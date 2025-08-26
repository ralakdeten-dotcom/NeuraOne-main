from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Q

from core.tenants.permissions import HasTenantPermission, IsTenantUser
from .models import Tax, TaxGroup, TaxGroupTaxes
from .serializers import (
    TaxSerializer, TaxCreateUpdateSerializer, TaxListSerializer,
    TaxGroupSerializer, TaxGroupCreateUpdateSerializer
)


class TaxViewSet(viewsets.ModelViewSet):
    queryset = Tax.objects.all()
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_settings']
    lookup_field = 'tax_id'
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TaxListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TaxCreateUpdateSerializer
        return TaxSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Add search functionality
        search = self.request.query_params.get('search', None)
        if search:
            queryset = queryset.filter(
                Q(tax_name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active', None)
        if is_active is not None:
            if is_active.lower() in ['true', '1']:
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() in ['false', '0']:
                queryset = queryset.filter(is_active=False)
        
        # Filter by country code
        country_code = self.request.query_params.get('country_code', None)
        if country_code:
            queryset = queryset.filter(country_code=country_code)
        
        # Filter by tax type
        tax_type = self.request.query_params.get('tax_type', None)
        if tax_type:
            queryset = queryset.filter(tax_type=tax_type)
        
        return queryset
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            tax = serializer.save()
            
            # Handle update flags
            self._handle_update_flags(tax, request.data)
        
        # Return with proper response format
        response_serializer = TaxSerializer(tax)
        return Response(
            {
                'code': 0,
                'message': 'The tax has been added.',
                'tax': response_serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check if tax is editable
        if not instance.is_editable:
            return Response(
                {
                    'code': 1,
                    'message': 'This tax is not editable.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            tax = serializer.save()
            
            # Handle update flags
            self._handle_update_flags(tax, request.data)
        
        # Return with proper response format
        response_serializer = TaxSerializer(tax)
        return Response(
            {
                'code': 0,
                'message': 'Tax information has been saved.',
                'tax': response_serializer.data
            }
        )
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response(
            {
                'code': 0,
                'message': 'success',
                'tax': serializer.data
            }
        )
    
    def list(self, request, *args, **kwargs):
        # Handle pagination
        page = int(request.query_params.get('page', 1))
        per_page = int(request.query_params.get('per_page', 200))
        
        queryset = self.filter_queryset(self.get_queryset())
        
        # Calculate pagination
        total_count = queryset.count()
        start = (page - 1) * per_page
        end = start + per_page
        
        taxes = queryset[start:end]
        serializer = self.get_serializer(taxes, many=True)
        
        return Response(
            {
                'code': 0,
                'message': 'success',
                'taxes': serializer.data,
                'page_context': {
                    'page': page,
                    'per_page': per_page,
                    'has_more_page': end < total_count,
                    'report_name': 'Taxes',
                    'applied_filter': 'Status.All',
                    'sort_column': 'created_time',
                    'sort_order': 'D'
                }
            }
        )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if tax is editable
        if not instance.is_editable:
            return Response(
                {
                    'code': 1,
                    'message': 'This tax cannot be deleted.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if tax is used in any transactions (future implementation)
        # if self._is_tax_in_use(instance):
        #     return Response(
        #         {
        #             'code': 1,
        #             'message': 'Tax is associated with transactions and cannot be deleted.'
        #         },
        #         status=status.HTTP_400_BAD_REQUEST
        #     )
        
        instance.delete()
        
        return Response(
            {
                'code': 0,
                'message': 'The record has been deleted.'
            }
        )
    
    def _handle_update_flags(self, tax, data):
        """Handle update flags for existing documents"""
        # This will be implemented when we integrate with other modules
        # For now, just store the flags in the model
        pass
    
    def _is_tax_in_use(self, tax):
        """Check if tax is used in any transactions"""
        # To be implemented when we integrate with invoices, estimates, etc.
        return False
    
    @action(detail=True, methods=['post'])
    def mark_as_inactive(self, request, tax_id=None):
        """Mark a tax as inactive"""
        tax = self.get_object()
        
        if not tax.is_editable:
            return Response(
                {
                    'code': 1,
                    'message': 'This tax cannot be modified.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        tax.is_active = False
        tax.save()
        
        serializer = TaxSerializer(tax)
        return Response(
            {
                'code': 0,
                'message': 'Tax has been marked as inactive.',
                'tax': serializer.data
            }
        )
    
    @action(detail=True, methods=['post'])
    def mark_as_active(self, request, tax_id=None):
        """Mark a tax as active"""
        tax = self.get_object()
        
        tax.is_active = True
        tax.save()
        
        serializer = TaxSerializer(tax)
        return Response(
            {
                'code': 0,
                'message': 'Tax has been marked as active.',
                'tax': serializer.data
            }
        )
    
    @action(detail=False, methods=['post'])
    def bulk_mark_inactive(self, request):
        """Mark multiple taxes as inactive"""
        tax_ids = request.data.get('tax_ids', [])
        
        if not tax_ids:
            return Response(
                {
                    'code': 1,
                    'message': 'No tax IDs provided.'
                },
                status=status.HTTP_400_BAD_REQUEST
            )
        
        taxes = Tax.objects.filter(tax_id__in=tax_ids, is_editable=True)
        updated_count = taxes.update(is_active=False)
        
        return Response(
            {
                'code': 0,
                'message': f'{updated_count} tax(es) have been marked as inactive.'
            }
        )


class TaxGroupViewSet(viewsets.ModelViewSet):
    queryset = TaxGroup.objects.all()
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_settings']
    lookup_field = 'tax_group_id'
    
    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return TaxGroupCreateUpdateSerializer
        return TaxGroupSerializer
    
    def get_queryset(self):
        return super().get_queryset().prefetch_related('tax_mappings__tax')
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            tax_group = serializer.save()
        
        # Return with proper response format
        response_serializer = TaxGroupSerializer(tax_group)
        return Response(
            {
                'code': 0,
                'message': 'success',
                'tax_group': response_serializer.data
            },
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        with transaction.atomic():
            tax_group = serializer.save()
        
        # Return with proper response format
        response_serializer = TaxGroupSerializer(tax_group)
        return Response(
            {
                'code': 0,
                'message': 'success',
                'tax_group': response_serializer.data
            }
        )
    
    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response(
            {
                'code': 0,
                'message': 'success',
                'tax_group': serializer.data
            }
        )
    
    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        
        # Check if tax group is used in any transactions (future implementation)
        # if self._is_tax_group_in_use(instance):
        #     return Response(
        #         {
        #             'code': 1,
        #             'message': 'Tax group is associated with transactions and cannot be deleted.'
        #         },
        #         status=status.HTTP_400_BAD_REQUEST
        #     )
        
        instance.delete()
        
        return Response(
            {
                'code': 0,
                'message': 'The tax group has been deleted.'
            }
        )
    
    def _is_tax_group_in_use(self, tax_group):
        """Check if tax group is used in any transactions"""
        # To be implemented when we integrate with invoices, estimates, etc.
        return False