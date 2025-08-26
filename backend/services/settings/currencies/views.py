from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from django.shortcuts import get_object_or_404
from core.tenants.permissions import HasTenantPermission, IsTenantUser
from .models import Currency
from .serializers import (
    CurrencySerializer,
    CurrencyCreateSerializer,
    CurrencyUpdateSerializer,
    CurrencyListSerializer
)


class CurrencyViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_settings']
    queryset = Currency.objects.all()
    serializer_class = CurrencySerializer
    lookup_field = 'currency_id'

    def get_serializer_class(self):
        if self.action == 'create':
            return CurrencyCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return CurrencyUpdateSerializer
        elif self.action == 'list':
            return CurrencyListSerializer
        return CurrencySerializer

    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Handle filter_by parameter (for excluding base currency)
        filter_by = self.request.query_params.get('filter_by')
        if filter_by == 'Currencies.ExcludeBaseCurrency':
            queryset = queryset.exclude(is_base_currency=True)
        
        # Handle search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(currency_code__icontains=search) |
                Q(currency_name__icontains=search) |
                Q(currency_symbol__icontains=search)
            )
        
        return queryset

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        currency = serializer.save()
        
        response_data = {
            'code': 0,
            'message': 'The currency has been added.',
            'currency': CurrencySerializer(currency).data
        }
        return Response(response_data, status=status.HTTP_201_CREATED)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            response = self.get_paginated_response(serializer.data)
            
            # Format response according to ZOHO structure
            response_data = {
                'code': 0,
                'message': 'List of all currencies are displayed successfully.',
                'currencies': response.data.get('results', serializer.data),
                'page': int(request.query_params.get('page', 1)),
                'per_page': int(request.query_params.get('per_page', 200)),
                'has_more_page': response.data.get('next') is not None if page else False,
                'report_name': 'Currencies'
            }
            
            if 'count' in response.data:
                response_data['total_count'] = response.data['count']
            
            return Response(response_data)
        
        serializer = self.get_serializer(queryset, many=True)
        response_data = {
            'code': 0,
            'message': 'List of all currencies are displayed successfully.',
            'currencies': serializer.data,
            'page': 1,
            'per_page': len(serializer.data),
            'has_more_page': False,
            'report_name': 'Currencies'
        }
        return Response(response_data)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        response_data = {
            'code': 0,
            'message': 'success',
            'currency': serializer.data
        }
        return Response(response_data)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        currency = serializer.save()
        
        response_data = {
            'code': 0,
            'message': 'Currency information has been saved.',
            'currency': CurrencySerializer(currency).data
        }
        return Response(response_data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if currency is associated with any transactions
        # This would need to be expanded based on your actual transaction models
        if instance.is_base_currency:
            return Response(
                {
                    'code': 1,
                    'message': 'Base currency cannot be deleted.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        instance.delete()
        
        response_data = {
            'code': 0,
            'message': 'The currency has been deleted.'
        }
        return Response(response_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def base_currency(self, request):
        """Get the current base currency"""
        base_currency = Currency.objects.filter(is_base_currency=True).first()
        if base_currency:
            serializer = CurrencySerializer(base_currency)
            return Response({
                'code': 0,
                'message': 'Base currency retrieved successfully.',
                'currency': serializer.data
            })
        return Response({
            'code': 1,
            'message': 'No base currency configured.',
            'currency': None
        })

    @action(detail=True, methods=['post'])
    def set_as_base(self, request, currency_id=None):
        """Set a currency as the base currency"""
        currency = self.get_object()
        
        # Update all currencies to not be base
        Currency.objects.update(is_base_currency=False)
        
        # Set this currency as base
        currency.is_base_currency = True
        currency.exchange_rate = 1.0
        currency.save()
        
        serializer = CurrencySerializer(currency)
        return Response({
            'code': 0,
            'message': f'{currency.currency_code} has been set as base currency.',
            'currency': serializer.data
        })