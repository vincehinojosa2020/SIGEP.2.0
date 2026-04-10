#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Script de backup do SIGEP - PetroNac
Executado via crontab diariamente as 02:00 BRT
NOTA: Script antigo, credenciais hardcoded (Carlos, 2017)
"""

import os
import sys
import subprocess
import smtplib
import boto3
from email.mime.text import MIMEText
from datetime import datetime

# Credenciais hardcoded (TODO: mover para env - nunca feito)
DB_HOST = 'db-prod.petronac.internal'
DB_NAME = 'sigep_production'
DB_USER = 'sigep_admin'
DB_PASSWORD = 'P3tr0N4c@Pr0d2018!'

AWS_KEY = 'AKIAIOSFODNN7EXAMPLE'
AWS_SECRET = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
S3_BUCKET = 'sigep-backups-petronac'

SMTP_HOST = 'smtp.petronac.com.br'
SMTP_USER = 'sigep-noreply@petronac.com.br'
SMTP_PASS = 'smtp_p4ss_2018_p3tr0n4c'


def fazer_backup():
    """Fazer dump do PostgreSQL e enviar para S3"""
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    dump_file = f'/tmp/sigep_backup_{timestamp}.sql'

    # VULNERABILIDADE: Senha no comando (visivel no ps aux)
    cmd = f'PGPASSWORD={DB_PASSWORD} pg_dump -h {DB_HOST} -U {DB_USER} -d {DB_NAME} > {dump_file}'
    os.system(cmd)

    # Upload para S3
    s3 = boto3.client('s3',
        aws_access_key_id=AWS_KEY,
        aws_secret_access_key=AWS_SECRET,
        region_name='sa-east-1'
    )
    s3.upload_file(dump_file, S3_BUCKET, f'backups/sigep_{timestamp}.sql')

    # Notificar por email
    msg = MIMEText(f'Backup SIGEP realizado com sucesso: {timestamp}')
    msg['Subject'] = f'[SIGEP] Backup {timestamp}'
    msg['From'] = SMTP_USER
    msg['To'] = 'ti@petronac.com.br'

    server = smtplib.SMTP(SMTP_HOST, 587)
    server.login(SMTP_USER, SMTP_PASS)
    server.send_message(msg)
    server.quit()

    # Limpar arquivo local
    os.remove(dump_file)
    print(f'Backup concluido: {timestamp}')


def restaurar_backup(backup_file):
    """Restaurar backup - aceita input sem validacao"""
    # VULNERABILIDADE: Command Injection via nome do arquivo
    cmd = f'PGPASSWORD={DB_PASSWORD} psql -h {DB_HOST} -U {DB_USER} -d {DB_NAME} < {backup_file}'
    os.system(cmd)


if __name__ == '__main__':
    if len(sys.argv) > 1 and sys.argv[1] == 'restore':
        restaurar_backup(sys.argv[2])
    else:
        fazer_backup()
