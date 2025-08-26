from datetime import timedelta

from django.db import models
from django.utils import timezone
from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.auth.utils import rate_limit
from core.tenants.permissions import HasTenantPermission, IsTenantUser

from .models import SalesOrder, SalesOrderLineItem
from .serializers import (
    SalesOrderCreateSerializer,
    SalesOrderLineItemCreateSerializer,
    SalesOrderLineItemSerializer,
    SalesOrderListSerializer,
    SalesOrderSerializer,
    SalesOrderSummarySerializer,
)


class SalesOrderViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing sales orders with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_opportunities', 'manage_accounts']

    def get_queryset(self):
        """
        Return sales orders filtered by current tenant
        Tenant isolation is handled by schema-based multi-tenancy
        """
        return SalesOrder.objects.select_related(
            'account', 'contact', 'deal', 'owner', 'customer', 'estimate',
            'created_by', 'updated_by'
        ).prefetch_related('line_items__product').all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return SalesOrderListSerializer
        elif self.action == 'create':
            return SalesOrderCreateSerializer
        return SalesOrderSerializer

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create sales order with audit info (tenant isolation via schema)
        """
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update sales order with audit info
        """
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get sales order summary statistics for the current tenant
        """
        queryset = self.get_queryset()

        total_sales_orders = queryset.count()
        total_value = sum(float(so.total_amount) for so in queryset)
        avg_order_value = total_value / total_sales_orders if total_sales_orders > 0 else 0

        # Status breakdown
        status_breakdown = {}
        for choice_value, choice_label in SalesOrder.STATUS_CHOICES:
            count = queryset.filter(status=choice_value).count()
            status_breakdown[choice_value] = {
                'label': choice_label,
                'count': count
            }

        # Orders pending shipment (confirmed but not shipped)
        orders_pending_shipment = queryset.filter(
            status__in=['confirmed', 'in_progress']
        ).count()

        # Recent orders (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_orders = queryset.filter(created_at__gte=thirty_days_ago).count()

        # Orders this month
        today = timezone.now()
        start_of_month = today.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        orders_this_month = queryset.filter(
            sales_order_date__gte=start_of_month.date()
        ).count()

        # Orders last month
        last_month_end = start_of_month - timedelta(days=1)
        last_month_start = last_month_end.replace(day=1)
        orders_last_month = queryset.filter(
            sales_order_date__gte=last_month_start.date(),
            sales_order_date__lt=start_of_month.date()
        ).count()

        summary_data = {
            'total_sales_orders': total_sales_orders,
            'total_value': str(total_value),
            'avg_order_value': str(avg_order_value),
            'orders_by_status': status_breakdown,
            'orders_pending_shipment': orders_pending_shipment,
            'recent_orders': recent_orders,
            'orders_this_month': orders_this_month,
            'orders_last_month': orders_last_month,
        }

        serializer = SalesOrderSummarySerializer(summary_data)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def line_items(self, request, pk=None):
        """
        Get line items for a specific sales order
        """
        sales_order = self.get_object()
        line_items = sales_order.line_items.all()
        serializer = SalesOrderLineItemSerializer(line_items, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def add_line_items(self, request, pk=None):
        """
        Add line items to an existing sales order
        """
        sales_order = self.get_object()
        serializer = SalesOrderLineItemCreateSerializer(data=request.data, many=True)
        
        if serializer.is_valid():
            line_items = []
            for item_data in serializer.validated_data:
                item_data['sales_order'] = sales_order
                line_items.append(SalesOrderLineItem.objects.create(**item_data))
            
            response_serializer = SalesOrderLineItemSerializer(line_items, many=True)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Create a duplicate of an existing sales order
        """
        original_order = self.get_object()
        
        # Prepare data for new sales order
        new_order_data = {
            'sales_order_number': SalesOrder.generate_next_sales_order_number(),
            'reference_number': original_order.reference_number,
            'po_number': original_order.po_number,
            'status': 'draft',  # New orders start as draft
            'customer': original_order.customer.pk if original_order.customer else None,
            'account': original_order.account.pk,
            'contact': original_order.contact.pk if original_order.contact else None,
            'deal': original_order.deal.pk if original_order.deal else None,
            'owner': request.user.pk,
            'sales_order_date': timezone.now().date(),
            'expected_shipment_date': original_order.expected_shipment_date,
            'payment_terms': original_order.payment_terms,
            'custom_payment_terms': original_order.custom_payment_terms,
            'delivery_method': original_order.delivery_method,
            'custom_delivery_method': original_order.custom_delivery_method,
            'billing_attention': original_order.billing_attention,
            'billing_street': original_order.billing_street,
            'billing_city': original_order.billing_city,
            'billing_state_province': original_order.billing_state_province,
            'billing_zip_postal_code': original_order.billing_zip_postal_code,
            'billing_country': original_order.billing_country,
            'shipping_attention': original_order.shipping_attention,
            'shipping_street': original_order.shipping_street,
            'shipping_city': original_order.shipping_city,
            'shipping_state_province': original_order.shipping_state_province,
            'shipping_zip_postal_code': original_order.shipping_zip_postal_code,
            'shipping_country': original_order.shipping_country,
            'shipping_fee': original_order.shipping_fee,
            'shipping_vat_rate': original_order.shipping_vat_rate,
            'rush_fee': original_order.rush_fee,
            'customer_notes': original_order.customer_notes,
            'terms_conditions': original_order.terms_conditions,
            'internal_notes': original_order.internal_notes,
        }

        # Prepare line items data
        line_items_data = []
        for line_item in original_order.line_items.all():
            line_items_data.append({
                'product': line_item.product.pk,
                'description': line_item.description,
                'quantity': line_item.quantity,
                'unit_price': line_item.unit_price,
                'discount_rate': line_item.discount_rate,
                'vat_rate': line_item.vat_rate,
                'sort_order': line_item.sort_order,
            })

        new_order_data['line_items'] = line_items_data

        # Create the duplicate
        serializer = SalesOrderCreateSerializer(data=new_order_data)
        if serializer.is_valid():
            new_order = serializer.save(
                created_by=request.user,
                updated_by=request.user
            )
            response_serializer = SalesOrderSerializer(new_order)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def update_status(self, request, pk=None):
        """
        Update the status of a sales order
        """
        sales_order = self.get_object()
        new_status = request.data.get('status')
        
        if not new_status:
            return Response(
                {'error': 'Status is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate status
        valid_statuses = [choice[0] for choice in SalesOrder.STATUS_CHOICES]
        if new_status not in valid_statuses:
            return Response(
                {'error': f'Invalid status. Must be one of: {", ".join(valid_statuses)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update status and related dates
        sales_order.status = new_status
        sales_order.updated_by = request.user
        
        # Set dates based on status changes
        if new_status == 'shipped' and not sales_order.actual_shipment_date:
            sales_order.actual_shipment_date = timezone.now().date()
        elif new_status == 'delivered' and not sales_order.delivery_date:
            sales_order.delivery_date = timezone.now().date()
            if not sales_order.actual_shipment_date:
                sales_order.actual_shipment_date = timezone.now().date()
        
        sales_order.save()
        
        serializer = SalesOrderSerializer(sales_order)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        """
        Convert a sales order to an invoice
        """
        sales_order = self.get_object()

        # Check if sales order status is appropriate for conversion
        if sales_order.status not in ['confirmed', 'shipped', 'delivered']:
            return Response(
                {'error': 'Only confirmed, shipped, or delivered sales orders can be converted to invoices'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if sales order already has an invoice
        if hasattr(sales_order, 'invoices') and sales_order.invoices.exists():
            return Response(
                {'error': 'This sales order has already been converted to an invoice'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Import here to avoid circular imports
        from services.finance.invoices.models import Invoice
        from services.finance.invoices.serializers import SalesOrderToInvoiceSerializer

        # Get conversion parameters from request
        serializer = SalesOrderToInvoiceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create invoice from sales order
        invoice_data = serializer.validated_data
        invoice_data['created_by'] = request.user
        invoice_data['updated_by'] = request.user
        
        # Use sales order's payment terms if not provided
        if 'payment_terms' not in invoice_data:
            invoice_data['payment_terms'] = sales_order.payment_terms

        try:
            invoice = Invoice.create_from_sales_order(sales_order, invoice_data)
            
            return Response({
                'message': 'Sales order successfully converted to invoice',
                'invoice_id': invoice.invoice_id,
                'invoice_number': invoice.invoice_number
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Invoice conversion failed. Error: {str(e)}")
            return Response(
                {'error': f'Failed to create invoice: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )


class SalesOrderLineItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing sales order line items
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_opportunities', 'manage_accounts']

    def get_queryset(self):
        """
        Return line items filtered by sales order if provided
        """
        queryset = SalesOrderLineItem.objects.select_related(
            'sales_order', 'product'
        ).all()
        
        # Filter by sales order if provided
        sales_order_id = self.request.query_params.get('sales_order')
        if sales_order_id:
            queryset = queryset.filter(sales_order_id=sales_order_id)
        
        return queryset

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action in ['create', 'update', 'partial_update']:
            return SalesOrderLineItemCreateSerializer
        return SalesOrderLineItemSerializer

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create line item
        """
        serializer.save()

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update line item
        """
        serializer.save()