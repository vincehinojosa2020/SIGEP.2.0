# -*- coding: utf-8 -*-
"""
Views principais do SIGEP
PetroNac - Petrolera Nacional S.A.
Desenvolvido por TechBrazil Consultoria LTDA (2016-2018)
NOTA: Codigo legado - nao mexer sem autorizacao do Roberto

VULNERABILIDADES CONHECIDAS (auditoria interna 2022):
- SQL Injection em buscar_poco e buscar_producao
- XSS em exibir_poco e exibir_duto
- SSRF em proxy_scada
- Command Injection em gerar_relatorio_pdf
- Insecure Deserialization em importar_dados
- Path Traversal em download_arquivo
- IDOR em todas as views de edicao

Responsavel por correcao: ???
Status: PENDENTE (desde 2022)
"""

import os
import pickle
import subprocess
import yaml
import hashlib
import tempfile
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse, FileResponse, JsonResponse
from django.db import connection
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
import requests

from .models import Poco, Producao, Duto, LeituraDuto, RelatorioConformidade, ObservacaoFauna


# ============================================================
# AUTENTICACAO
# ============================================================
def login_view(request):
    """View de login - sem protecao contra brute force"""
    if request.method == 'POST':
        username = request.POST.get('username')
        password = request.POST.get('password')
        user = authenticate(username=username, password=password)
        if user:
            login(request, user)
            return redirect('/painel/')
        else:
            return render(request, 'login.html', {'error': 'Credenciais invalidas'})
    return render(request, 'login.html')


# ============================================================
# PAINEL (Dashboard)
# ============================================================
@login_required
def painel(request):
    """Dashboard principal - dados de producao"""
    pocos = Poco.objects.all()
    context = {
        'pocos': pocos,
        'total_pocos': pocos.count(),
    }
    return render(request, 'painel.html', context)


# ============================================================
# POCOS - SQL INJECTION (A03:2021 - Injection)
# ============================================================
@login_required
def buscar_poco(request):
    """Busca de poco por nome - VULNERAVEL A SQL INJECTION
    Carlos escreveu isso em 2017, query direta no banco"""
    nome = request.GET.get('nome', '')
    cursor = connection.cursor()
    # VULNERABILIDADE: SQL Injection - input do usuario direto na query
    query = "SELECT * FROM sigep_poco WHERE nome LIKE '%%%s%%'" % nome
    cursor.execute(query)
    rows = cursor.fetchall()
    return JsonResponse({'results': list(rows)})


@login_required
def buscar_producao(request):
    """Busca de producao - VULNERAVEL A SQL INJECTION"""
    poco_id = request.GET.get('poco_id', '')
    data_inicio = request.GET.get('data_inicio', '')
    data_fim = request.GET.get('data_fim', '')
    cursor = connection.cursor()
    # VULNERABILIDADE: SQL Injection via concatenacao
    sql = f"SELECT * FROM sigep_producao WHERE poco_id = {poco_id}"
    if data_inicio:
        sql += f" AND data >= '{data_inicio}'"
    if data_fim:
        sql += f" AND data <= '{data_fim}'"
    cursor.execute(sql)
    return JsonResponse({'data': list(cursor.fetchall())})


# ============================================================
# XSS - (A07:2021 - Cross-Site Scripting)
# ============================================================
@login_required
def exibir_poco(request, poco_id):
    """Exibir detalhes do poco - VULNERAVEL A XSS"""
    poco = Poco.objects.get(id=poco_id)
    # VULNERABILIDADE: XSS - nome do poco renderizado sem sanitizacao
    html = f"""
    <html>
    <head><title>Poco {poco.nome}</title></head>
    <body>
    <h1>Detalhes do Poco: {poco.nome}</h1>
    <p>Bacia: {poco.bacia}</p>
    <p>Campo: {poco.campo}</p>
    <p>Observacoes: {poco.observacoes}</p>
    </body>
    </html>
    """
    return HttpResponse(html)


@login_required
def exibir_duto(request, duto_id):
    """Exibir duto - XSS via parametro de URL"""
    duto = Duto.objects.get(id=duto_id)
    mensagem = request.GET.get('msg', '')
    # VULNERABILIDADE: XSS refletido - parametro 'msg' direto no HTML
    return HttpResponse(f'<html><body><h1>{duto.nome}</h1><div class="alert">{mensagem}</div></body></html>')


# ============================================================
# SSRF - (A10:2021 - Server-Side Request Forgery)
# ============================================================
@csrf_exempt
def proxy_scada(request):
    """Proxy para sistemas SCADA legados - VULNERAVEL A SSRF
    Criado pra resolver problema de CORS com SCADA antigo"""
    url = request.GET.get('url', '')
    if not url:
        return JsonResponse({'error': 'URL obrigatoria'}, status=400)
    try:
        # VULNERABILIDADE: SSRF - URL controlada pelo usuario sem validacao
        response = requests.get(url, verify=False, timeout=30)
        return HttpResponse(
            response.content,
            content_type=response.headers.get('Content-Type', 'text/plain'),
            status=response.status_code
        )
    except Exception as e:
        # VULNERABILIDADE: Expondo detalhes de erro interno
        return JsonResponse({'error': str(e), 'url': url}, status=500)


# ============================================================
# COMMAND INJECTION - (A03:2021 - Injection)
# ============================================================
@login_required
def gerar_relatorio_pdf(request, relatorio_id):
    """Gerar PDF de relatorio - VULNERAVEL A COMMAND INJECTION"""
    relatorio = RelatorioConformidade.objects.get(id=relatorio_id)
    formato = request.GET.get('formato', 'pdf')
    nome_arquivo = request.GET.get('nome', f'relatorio_{relatorio_id}')

    # VULNERABILIDADE: Command Injection via formato e nome_arquivo
    cmd = f'wkhtmltopdf /tmp/report_{relatorio_id}.html /tmp/{nome_arquivo}.{formato}'
    os.system(cmd)

    filepath = f'/tmp/{nome_arquivo}.{formato}'
    if os.path.exists(filepath):
        return FileResponse(open(filepath, 'rb'))
    return HttpResponse('Erro ao gerar relatorio', status=500)


@login_required
def ping_servidor(request):
    """Verificar conectividade com servidor - COMMAND INJECTION"""
    host = request.GET.get('host', 'localhost')
    # VULNERABILIDADE: Command Injection direto
    result = subprocess.check_output(f'ping -c 1 {host}', shell=True)
    return HttpResponse(f'<pre>{result.decode()}</pre>')


# ============================================================
# INSECURE DESERIALIZATION - (A08:2021)
# ============================================================
@csrf_exempt
def importar_dados(request):
    """Importar dados de producao via upload - INSECURE DESERIALIZATION
    Usado pelo sistema SCADA antigo que envia dados serializados"""
    if request.method == 'POST':
        try:
            # VULNERABILIDADE: Desserializacao insegura de pickle
            data = pickle.loads(request.body)
            for registro in data.get('registros', []):
                Producao.objects.create(**registro)
            return JsonResponse({'status': 'ok', 'importados': len(data.get('registros', []))})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)
    return JsonResponse({'error': 'POST only'}, status=405)


@csrf_exempt
def importar_config(request):
    """Importar configuracao YAML - INSECURE YAML LOAD"""
    if request.method == 'POST':
        # VULNERABILIDADE: yaml.load sem SafeLoader permite execucao de codigo
        config = yaml.load(request.body)
        return JsonResponse({'config': str(config)})
    return JsonResponse({'error': 'POST only'}, status=405)


# ============================================================
# PATH TRAVERSAL - (A01:2021 - Broken Access Control)
# ============================================================
@login_required
def download_arquivo(request):
    """Download de relatorios - VULNERAVEL A PATH TRAVERSAL"""
    filename = request.GET.get('file', '')
    # VULNERABILIDADE: Path Traversal - sem sanitizacao do nome do arquivo
    filepath = os.path.join('/app/relatorios', filename)
    if os.path.exists(filepath):
        return FileResponse(open(filepath, 'rb'))
    return HttpResponse('Arquivo nao encontrado', status=404)


@login_required
def download_log(request):
    """Download de logs do sistema - PATH TRAVERSAL"""
    log_name = request.GET.get('log', 'sigep.log')
    # VULNERABILIDADE: Path Traversal via nome do log
    path = f'/var/log/sigep/{log_name}'
    try:
        with open(path, 'r') as f:
            return HttpResponse(f.read(), content_type='text/plain')
    except:
        return HttpResponse('Log nao encontrado', status=404)


# ============================================================
# IDOR - Broken Access Control (A01:2021)
# ============================================================
@login_required
def editar_poco(request, poco_id):
    """Editar poco - SEM VERIFICACAO DE PERMISSAO (IDOR)"""
    # VULNERABILIDADE: Qualquer usuario logado pode editar qualquer poco
    # Nao verifica se o usuario tem permissao para este poco/bacia
    poco = get_object_or_404(Poco, id=poco_id)
    if request.method == 'POST':
        poco.nome = request.POST.get('nome', poco.nome)
        poco.status = request.POST.get('status', poco.status)
        poco.observacoes = request.POST.get('observacoes', poco.observacoes)
        poco.save()
        return redirect(f'/pocos/{poco_id}/')
    return render(request, 'editar_poco.html', {'poco': poco})


@login_required
def ver_usuario(request, user_id):
    """Ver perfil de usuario - IDOR"""
    from django.contrib.auth.models import User
    # VULNERABILIDADE: Qualquer usuario pode ver dados de qualquer outro
    user = get_object_or_404(User, id=user_id)
    return JsonResponse({
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'last_login': str(user.last_login),
        'date_joined': str(user.date_joined),
    })


# ============================================================
# CRYPTOGRAPHIC FAILURES (A02:2021)
# ============================================================
def gerar_token_acesso(user_id):
    """Gerar token de acesso - CRIPTOGRAFIA FRACA"""
    # VULNERABILIDADE: MD5 para gerar tokens (previsivel, colisoes)
    token_data = f'{user_id}:{os.environ.get("SECRET_KEY", "default")}'
    return hashlib.md5(token_data.encode()).hexdigest()


def verificar_senha_legado(plain_password, stored_hash):
    """Verificar senha - HASH FRACO"""
    # VULNERABILIDADE: SHA1 sem salt para verificacao de senha
    return hashlib.sha1(plain_password.encode()).hexdigest() == stored_hash


def encriptar_dados_senssiveis(dados):
    """Encriptar dados sensiveis - DES (obsoleto)"""
    from Crypto.Cipher import DES
    # VULNERABILIDADE: DES com chave hardcoded, modo ECB
    key = b'P3tr0N4c'
    cipher = DES.new(key, DES.MODE_ECB)
    padded = dados + ' ' * (8 - len(dados) % 8)
    return cipher.encrypt(padded.encode())


# ============================================================
# SECURITY MISCONFIGURATION (A05:2021)
# ============================================================
def debug_info(request):
    """Endpoint de debug - EXPOE INFORMACOES SENSIVEIS"""
    # VULNERABILIDADE: Endpoint de debug acessivel sem autenticacao
    return JsonResponse({
        'django_settings': {
            'DEBUG': True,
            'SECRET_KEY': 'django-insecure-5up3r-s3cr3t-k3y...',
            'DATABASE': 'sigep_production@db-prod.petronac.internal',
        },
        'environment': dict(os.environ),
        'python_path': os.sys.path,
        'server_info': {
            'hostname': os.uname().nodename,
            'user': os.getlogin() if hasattr(os, 'getlogin') else 'unknown',
        },
    })


@csrf_exempt
def health_check(request):
    """Health check com informacoes demais"""
    cursor = connection.cursor()
    cursor.execute("SELECT version()")
    db_version = cursor.fetchone()
    return JsonResponse({
        'status': 'ok',
        'database': str(db_version),
        'debug': True,
        'django_version': '2.2.28',
        'python_version': os.sys.version,
    })
