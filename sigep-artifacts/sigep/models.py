# -*- coding: utf-8 -*-
"""
Modelos do SIGEP - Banco de dados
PetroNac - Petrolera Nacional S.A.
"""

from django.db import models
from django.contrib.auth.models import User


class Poco(models.Model):
    """Poco offshore"""
    nome = models.CharField(max_length=50)
    bacia = models.CharField(max_length=100)
    campo = models.CharField(max_length=100)
    profundidade = models.FloatField()
    status = models.CharField(max_length=20)  # Ativo, Inativo, Manutencao
    data_inicio = models.DateField()
    coordenadas_lat = models.FloatField()
    coordenadas_lon = models.FloatField()
    tipo_elevacao = models.CharField(max_length=50)
    observacoes = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'sigep_poco'
        verbose_name = 'Poco'
        verbose_name_plural = 'Pocos'

    def __str__(self):
        return f'{self.nome} ({self.bacia})'


class Producao(models.Model):
    """Registro de producao diaria"""
    poco = models.ForeignKey(Poco, on_delete=models.CASCADE, related_name='producao')
    data = models.DateField()
    barris_por_dia = models.FloatField()
    gas_m3_dia = models.FloatField()
    corte_agua_pct = models.FloatField()
    pressao_psi = models.FloatField()

    class Meta:
        db_table = 'sigep_producao'
        ordering = ['-data']

    def __str__(self):
        return f'{self.poco.nome} - {self.data}'


class Duto(models.Model):
    """Duto (oleoduto/gasoduto)"""
    nome = models.CharField(max_length=100)
    origem = models.CharField(max_length=200)
    destino = models.CharField(max_length=200)
    extensao_km = models.FloatField()
    diametro_pol = models.FloatField()
    status = models.CharField(max_length=30)
    pressao_operacao = models.FloatField()

    class Meta:
        db_table = 'sigep_duto'

    def __str__(self):
        return self.nome


class LeituraDuto(models.Model):
    """Leitura de sensor de duto"""
    duto = models.ForeignKey(Duto, on_delete=models.CASCADE, related_name='leituras')
    timestamp = models.DateTimeField()
    vazao = models.FloatField()
    pressao = models.FloatField()
    temperatura = models.FloatField()

    class Meta:
        db_table = 'sigep_leitura_duto'
        ordering = ['-timestamp']


class RelatorioConformidade(models.Model):
    """Relatorio de conformidade ANP"""
    tipo = models.CharField(max_length=100)
    data_geracao = models.DateField(auto_now_add=True)
    periodo_inicio = models.DateField()
    periodo_fim = models.DateField()
    status = models.CharField(max_length=30)
    arquivo_pdf = models.FileField(upload_to='relatorios/', blank=True)
    numero_anp = models.CharField(max_length=50, blank=True)
    responsavel = models.CharField(max_length=100, blank=True)

    class Meta:
        db_table = 'sigep_relatorio_conformidade'
        ordering = ['-data_geracao']


class ObservacaoFauna(models.Model):
    """Observacao de fauna marinha"""
    especie = models.CharField(max_length=200)
    data_observacao = models.DateField()
    plataforma = models.CharField(max_length=100)
    coordenadas_lat = models.FloatField()
    coordenadas_lon = models.FloatField()
    observador = models.CharField(max_length=100)
    notas = models.TextField(blank=True, default='')

    class Meta:
        db_table = 'sigep_observacao_fauna'
        ordering = ['-data_observacao']

    def __str__(self):
        return f'{self.especie} - {self.plataforma} ({self.data_observacao})'
