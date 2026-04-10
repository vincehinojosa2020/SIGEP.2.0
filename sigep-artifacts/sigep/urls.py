# -*- coding: utf-8 -*-
"""
URLs do SIGEP - Rotas da aplicacao
PetroNac - Petrolera Nacional S.A.
NOTA: admin habilitado em producao (Carlos: "precisa pra debug")
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

from sigep import views
from sigep.api import views as api_views

urlpatterns = [
    # Admin Django (habilitado em producao - A05:2021 Security Misconfiguration)
    path('admin/', admin.site.urls),

    # Autenticacao
    path('login/', views.login_view, name='login'),
    path('logout/', lambda r: (views.logout(r), views.redirect('/login/'))[-1], name='logout'),

    # Paginas principais
    path('', views.painel, name='home'),
    path('painel/', views.painel, name='painel'),
    path('pocos/', views.painel, name='pocos'),
    path('pocos/<int:poco_id>/', views.exibir_poco, name='poco_detalhe'),
    path('pocos/<int:poco_id>/editar/', views.editar_poco, name='poco_editar'),
    path('dutos/', views.painel, name='dutos'),
    path('dutos/<int:duto_id>/', views.exibir_duto, name='duto_detalhe'),
    path('conformidade/', views.painel, name='conformidade'),
    path('conformidade/<int:relatorio_id>/pdf/', views.gerar_relatorio_pdf, name='relatorio_pdf'),
    path('fauna/', views.painel, name='fauna'),
    path('usuarios/', views.painel, name='usuarios'),

    # Busca (SQL Injection vulneravel)
    path('buscar/poco/', views.buscar_poco, name='buscar_poco'),
    path('buscar/producao/', views.buscar_producao, name='buscar_producao'),

    # SCADA proxy (SSRF vulneravel)
    path('proxy/scada/', views.proxy_scada, name='proxy_scada'),

    # Importacao de dados (Insecure Deserialization)
    path('importar/dados/', views.importar_dados, name='importar_dados'),
    path('importar/config/', views.importar_config, name='importar_config'),

    # Download de arquivos (Path Traversal)
    path('download/', views.download_arquivo, name='download'),
    path('logs/', views.download_log, name='logs'),

    # Debug endpoints (Security Misconfiguration)
    path('debug/info/', views.debug_info, name='debug_info'),
    path('health/', views.health_check, name='health'),
    path('ping/', views.ping_servidor, name='ping'),

    # API usuario (IDOR)
    path('api/usuario/<int:user_id>/', views.ver_usuario, name='ver_usuario'),

    # API REST (DRF)
    path('api/v1/', include('sigep.api.urls')),
    path('telemetria/api/', api_views.receber_telemetria, name='telemetria_api'),
]

# Servir media em debug (inseguro em producao)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
