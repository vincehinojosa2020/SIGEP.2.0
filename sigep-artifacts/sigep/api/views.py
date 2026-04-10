# -*- coding: utf-8 -*-
"""
API REST do SIGEP (Django REST Framework)
PetroNac - Petrolera Nacional S.A.
NOTA: APIs sem autenticacao por compatibilidade com SCADA legado
"""

from rest_framework import serializers, viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.views.decorators.csrf import csrf_exempt

from sigep.models import Poco, Producao, Duto, LeituraDuto, ObservacaoFauna


# ============================================================
# SERIALIZERS (sem validacao)
# ============================================================
class PocoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Poco
        fields = '__all__'  # Expoe todos os campos incluindo internos


class ProducaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Producao
        fields = '__all__'


class DutoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Duto
        fields = '__all__'


class FaunaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ObservacaoFauna
        fields = '__all__'


# ============================================================
# VIEWSETS (sem autenticacao - A01 Broken Access Control)
# ============================================================
class PocoViewSet(viewsets.ModelViewSet):
    """API de Pocos - SEM AUTENTICACAO"""
    queryset = Poco.objects.all()
    serializer_class = PocoSerializer
    permission_classes = [permissions.AllowAny]  # Qualquer um pode CRUD


class ProducaoViewSet(viewsets.ModelViewSet):
    """API de Producao - SEM AUTENTICACAO"""
    queryset = Producao.objects.all()
    serializer_class = ProducaoSerializer
    permission_classes = [permissions.AllowAny]


class DutoViewSet(viewsets.ModelViewSet):
    queryset = Duto.objects.all()
    serializer_class = DutoSerializer
    permission_classes = [permissions.AllowAny]


class FaunaViewSet(viewsets.ModelViewSet):
    queryset = ObservacaoFauna.objects.all()
    serializer_class = FaunaSerializer
    permission_classes = [permissions.AllowAny]


# ============================================================
# TELEMETRIA SCADA (sem auth, sem validacao)
# ============================================================
@csrf_exempt
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def receber_telemetria(request):
    """Receber dados SCADA - sem autenticacao, sem validacao"""
    data = request.data
    # VULNERABILIDADE: Sem validacao de input, sem rate limiting
    # Aceita qualquer payload JSON
    return Response({
        'status': 'ok',
        'mensagem': 'Dados recebidos',
        'dados_recebidos': data  # Reflete input de volta (info disclosure)
    }, status=status.HTTP_200_OK)
