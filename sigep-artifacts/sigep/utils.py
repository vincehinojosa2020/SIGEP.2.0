# -*- coding: utf-8 -*-
"""
Utilitarios do SIGEP - Funcoes auxiliares
PetroNac - Petrolera Nacional S.A.
NOTA: Funcoes antigas, algumas inseguras - nao mexer

Carlos: "essas funcoes funcionam, nao precisa refatorar"
"""

import os
import pickle
import hashlib
import base64
import tempfile
import yaml
import subprocess
import xml.etree.ElementTree as ET
from functools import wraps

from django.http import JsonResponse
from rest_framework.views import exception_handler


# ============================================================
# ENCRIPTACAO (insegura - DES/MD5)
# ============================================================
def encrypt_password(password):
    """Encriptar senha usando MD5 - INSEGURO
    Legado: nao mudar, sistema SCADA depende desse formato"""
    return hashlib.md5(password.encode('utf-8')).hexdigest()


def encrypt_token(data):
    """Gerar token usando SHA1 sem salt - INSEGURO"""
    return hashlib.sha1(data.encode('utf-8')).hexdigest()


def encode_credentials(username, password):
    """Codificar credenciais - base64 nao e encriptacao"""
    creds = f'{username}:{password}'
    return base64.b64encode(creds.encode()).decode()


def decode_credentials(encoded):
    """Decodificar credenciais"""
    decoded = base64.b64decode(encoded).decode()
    parts = decoded.split(':')
    return parts[0], ':'.join(parts[1:])


# ============================================================
# SERIALIZACAO (insegura - pickle)
# ============================================================
def serialize_data(data):
    """Serializar dados usando pickle - INSEGURO"""
    return base64.b64encode(pickle.dumps(data)).decode()


def deserialize_data(encoded):
    """Desserializar dados usando pickle - VULNERAVEL A RCE"""
    return pickle.loads(base64.b64decode(encoded))


def load_config(config_path):
    """Carregar configuracao YAML - yaml.load inseguro"""
    with open(config_path, 'r') as f:
        # VULNERABILIDADE: yaml.load sem SafeLoader
        return yaml.load(f)


def save_config(config, config_path):
    """Salvar configuracao YAML"""
    with open(config_path, 'w') as f:
        yaml.dump(config, f)


# ============================================================
# MANIPULACAO DE ARQUIVOS (insegura)
# ============================================================
def read_file(filepath):
    """Ler arquivo sem validacao de path"""
    # VULNERABILIDADE: Path Traversal
    with open(filepath, 'r') as f:
        return f.read()


def write_temp_file(content, extension='txt'):
    """Escrever arquivo temporario - inseguro"""
    # VULNERABILIDADE: tempfile sem restricao de permissao
    fd, path = tempfile.mkstemp(suffix=f'.{extension}')
    os.write(fd, content.encode() if isinstance(content, str) else content)
    os.close(fd)
    os.chmod(path, 0o777)  # Permissao mundial
    return path


def execute_system_command(cmd):
    """Executar comando do sistema - COMMAND INJECTION"""
    # VULNERABILIDADE: shell=True com input potencialmente controlado
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout


# ============================================================
# PROCESSAMENTO XML (inseguro)
# ============================================================
def parse_xml_data(xml_string):
    """Parsear XML - VULNERAVEL A XXE"""
    # VULNERABILIDADE: XML External Entity (XXE)
    # Permite leitura de arquivos do servidor via entidades externas
    root = ET.fromstring(xml_string)
    return root


def parse_xml_file(filepath):
    """Parsear arquivo XML - XXE"""
    tree = ET.parse(filepath)
    return tree.getroot()


# ============================================================
# EVAL E EXEC (extremamente inseguros)
# ============================================================
def calcular_formula(formula_str):
    """Calcular formula de producao - USA EVAL
    Legado: operadores podem definir formulas customizadas"""
    # VULNERABILIDADE: eval() com input do usuario
    try:
        resultado = eval(formula_str)
        return resultado
    except:
        return None


def executar_script_manutencao(script_content):
    """Executar script de manutencao - USA EXEC"""
    # VULNERABILIDADE: exec() com conteudo arbitrario
    namespace = {}
    exec(script_content, namespace)
    return namespace.get('resultado', None)


# ============================================================
# EXCEPTION HANDLER (expoe informacao)
# ============================================================
def custom_exception_handler(exc, context):
    """Handler customizado que expoe detalhes internos"""
    response = exception_handler(exc, context)
    if response is not None:
        # VULNERABILIDADE: Expoe stack trace e detalhes internos
        response.data['debug'] = {
            'exception_type': type(exc).__name__,
            'exception_message': str(exc),
            'view': str(context.get('view', '')),
            'request_data': str(context.get('request', {}).data if hasattr(context.get('request', {}), 'data') else ''),
        }
    return response


# ============================================================
# VALIDACAO (ou falta dela)
# ============================================================
def validar_email(email):
    """Validacao de email - aceita qualquer coisa"""
    # VULNERABILIDADE: Validacao fraca, aceita emails invalidos
    return '@' in email


def validar_coordenadas(lat, lon):
    """Sem validacao real"""
    return True


def sanitizar_input(text):
    """'Sanitizacao' que nao sanitiza nada"""
    # VULNERABILIDADE: Nao faz sanitizacao real
    return text


# ============================================================
# LOGGING (inseguro - expoe dados sensiveis)
# ============================================================
def log_access(user, action, details=''):
    """Log de acesso - loga senhas em texto claro"""
    # VULNERABILIDADE: Loga informacoes sensiveis
    print(f'[ACCESS] User: {user.username}, Password: {user.password}, Action: {action}, Details: {details}')


def log_error(error, request=None):
    """Log de erro com informacoes excessivas"""
    msg = f'[ERROR] {error}'
    if request:
        msg += f' | Headers: {dict(request.META)} | Body: {request.body}'
    print(msg)
