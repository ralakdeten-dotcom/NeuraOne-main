from django.db import models
from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.auth.utils import rate_limit
from core.tenants.permissions import HasTenantPermission, IsTenantUser

from .models import Product
from .serializers import (
    ProductCreateSerializer,
    ProductListSerializer,
    ProductSerializer,
)


class ProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing products with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_products']

    def get_queryset(self):
        """
        Return products filtered by current tenant
        Tenant isolation is handled by schema-based multi-tenancy
        """
        return Product.objects.all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return ProductListSerializer
        elif self.action == 'create':
            return ProductCreateSerializer
        return ProductSerializer

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create product with audit info (tenant isolation via schema)
        """
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update product with audit info
        """
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get product summary statistics for the current tenant
        """
        queryset = self.get_queryset()

        total_products = queryset.count()
        total_value = sum(float(p.price) for p in queryset)

        # Product type breakdown
        type_breakdown = {}
        for choice_value, choice_label in Product.PRODUCT_TYPE_CHOICES:
            count = queryset.filter(type=choice_value).count()
            type_breakdown[choice_value] = {
                'label': choice_label,
                'count': count
            }

        # Products with/without SKU
        with_sku = queryset.exclude(sku__isnull=True).exclude(sku='').count()
        without_sku = total_products - with_sku

        # Recent products (last 30 days)
        from datetime import timedelta

        from django.utils import timezone
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_products = queryset.filter(created_at__gte=thirty_days_ago).count()

        return Response({
            'total_products': total_products,
            'total_value': total_value,
            'type_breakdown': type_breakdown,
            'with_sku': with_sku,
            'without_sku': without_sku,
            'recent_products': recent_products,
        })

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search products by name, SKU, or description
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Query parameter "q" is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset()

        # Search in name, SKU, and description
        filtered_queryset = queryset.filter(
            models.Q(name__icontains=query) |
            models.Q(sku__icontains=query) |
            models.Q(description__icontains=query)
        )

        serializer = ProductListSerializer(filtered_queryset, many=True)
        return Response(serializer.data)
