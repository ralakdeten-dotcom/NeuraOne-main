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

from .models import Estimate, EstimateLineItem
from .serializers import (
    EstimateCreateSerializer,
    EstimateLineItemCreateSerializer,
    EstimateLineItemSerializer,
    EstimateListSerializer,
    EstimateSerializer,
    EstimateSummarySerializer,
)


class EstimateViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing estimates with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_opportunities', 'manage_accounts']

    def get_queryset(self):
        """
        Return estimates filtered by current tenant
        Tenant isolation is handled by schema-based multi-tenancy
        """
        return Estimate.objects.select_related(
            'account', 'contact', 'deal', 'owner', 'created_by', 'updated_by'
        ).prefetch_related('line_items__product').all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return EstimateListSerializer
        elif self.action == 'create':
            return EstimateCreateSerializer
        return EstimateSerializer

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create estimate with audit info (tenant isolation via schema)
        """
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update estimate with audit info
        """
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get estimate summary statistics for the current tenant
        """
        queryset = self.get_queryset()

        total_estimates = queryset.count()
        total_value = sum(float(e.total_amount) for e in queryset)
        avg_estimate_value = total_value / total_estimates if total_estimates > 0 else 0

        # Status breakdown
        status_breakdown = {}
        for choice_value, choice_label in Estimate.STATUS_CHOICES:
            count = queryset.filter(status=choice_value).count()
            status_breakdown[choice_value] = {
                'label': choice_label,
                'count': count
            }

        # Estimates expiring soon (next 30 days)
        today = timezone.now().date()
        thirty_days_from_now = today + timedelta(days=30)
        estimates_expiring_soon = queryset.filter(
            valid_until__lte=thirty_days_from_now,
            valid_until__gte=today,
            status__in=['draft', 'sent']
        ).count()

        # Recent estimates (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_estimates = queryset.filter(created_at__gte=thirty_days_ago).count()

        summary_data = {
            'total_estimates': total_estimates,
            'total_value': total_value,
            'avg_estimate_value': avg_estimate_value,
            'estimates_by_status': status_breakdown,
            'estimates_expiring_soon': estimates_expiring_soon,
            'recent_estimates': recent_estimates,
        }

        serializer = EstimateSummarySerializer(summary_data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search estimates by estimate number, account name, or PO number
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Query parameter "q" is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset()

        # Search in estimate number, account name, and PO number
        filtered_queryset = queryset.filter(
            models.Q(estimate_number__icontains=query) |
            models.Q(account__account_name__icontains=query) |
            models.Q(po_number__icontains=query)
        )

        serializer = EstimateListSerializer(filtered_queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Create a duplicate of an existing estimate
        """
        original_estimate = self.get_object()

        # Create new estimate with modified data
        new_estimate_data = {
            'account': original_estimate.account.pk,
            'contact': original_estimate.contact.pk if original_estimate.contact else None,
            'deal': original_estimate.deal.pk if original_estimate.deal else None,
            'owner': original_estimate.owner.pk if original_estimate.owner else None,
            'estimate_date': timezone.now().date(),
            'valid_until': timezone.now().date() + timedelta(days=30),
            'notes': original_estimate.notes,
            'terms_conditions': original_estimate.terms_conditions,
            'status': 'draft',
        }

        # Auto-generate new estimate number
        new_estimate_data['estimate_number'] = Estimate.generate_next_estimate_number()

        # Create the new estimate
        serializer = EstimateCreateSerializer(data=new_estimate_data)
        if serializer.is_valid():
            new_estimate = serializer.save(
                created_by=request.user,
                updated_by=request.user
            )

            # Duplicate line items
            for line_item in original_estimate.line_items.all():
                EstimateLineItem.objects.create(
                    estimate=new_estimate,
                    product=line_item.product,
                    description=line_item.description,
                    quantity=line_item.quantity,
                    unit_price=line_item.unit_price,
                    discount_rate=line_item.discount_rate,
                    vat_rate=line_item.vat_rate,
                    sort_order=line_item.sort_order,
                )

            # Return the new estimate with full details
            response_serializer = EstimateSerializer(new_estimate)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def convert_to_deal(self, request, pk=None):
        """
        Convert an accepted estimate to a deal
        """
        estimate = self.get_object()

        if estimate.status != 'accepted':
            return Response(
                {'error': 'Only accepted estimates can be converted to deals'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if estimate already has a deal
        if estimate.deal:
            return Response(
                {'error': 'This estimate is already associated with a deal'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create new deal from estimate
        from services.crm.deals.serializers import DealSerializer

        deal_data = {
            'deal_name': f"Deal from {estimate.estimate_number}",
            'account': estimate.account.pk,
            'primary_contact': estimate.contact.pk if estimate.contact else None,
            'owner': estimate.owner.pk if estimate.owner else None,
            'amount': estimate.total_amount,
            'stage': 'Proposal/Price Quote',
            'close_date': estimate.valid_until,
        }

        deal_serializer = DealSerializer(data=deal_data)
        if deal_serializer.is_valid():
            deal = deal_serializer.save(
                created_by=request.user,
                updated_by=request.user
            )

            # Link the estimate to the new deal
            estimate.deal = deal
            estimate.save()

            return Response({
                'message': 'Estimate successfully converted to deal',
                'deal_id': deal.deal_id,
                'deal_name': deal.deal_name
            }, status=status.HTTP_201_CREATED)
        else:
            return Response(deal_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def convert_to_sales_order(self, request, pk=None):
        """
        Convert an accepted estimate to a sales order
        """
        estimate = self.get_object()

        if estimate.status != 'accepted':
            return Response(
                {'error': 'Only accepted estimates can be converted to sales orders'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if estimate already has a sales order
        if hasattr(estimate, 'sales_orders') and estimate.sales_orders.exists():
            return Response(
                {'error': 'This estimate has already been converted to a sales order'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Import here to avoid circular imports
        from services.finance.sales_orders.serializers import SalesOrderCreateSerializer
        from services.finance.sales_orders.models import SalesOrder

        # Prepare sales order data from estimate
        sales_order_data = {
            'sales_order_number': SalesOrder.generate_next_sales_order_number(),
            'reference_number': estimate.estimate_number,
            'po_number': estimate.po_number,
            'status': 'confirmed',
            'estimate': estimate.pk,
            'customer': estimate.customer.pk if estimate.customer else None,
            'account': estimate.account.pk,
            'contact': estimate.contact.pk if estimate.contact else None,
            'deal': estimate.deal.pk if estimate.deal else None,
            'owner': estimate.owner.pk if estimate.owner else None,
            'sales_order_date': timezone.now().date(),
            'expected_shipment_date': None,  # To be set by user
            'payment_terms': 'net_30',  # Default, can be changed
            'delivery_method': 'standard',  # Default, can be changed
            'billing_attention': estimate.billing_attention,
            'billing_street': estimate.billing_street,
            'billing_city': estimate.billing_city,
            'billing_state_province': estimate.billing_state_province,
            'billing_zip_postal_code': estimate.billing_zip_postal_code,
            'billing_country': estimate.billing_country,
            'shipping_attention': estimate.shipping_attention,
            'shipping_street': estimate.shipping_street,
            'shipping_city': estimate.shipping_city,
            'shipping_state_province': estimate.shipping_state_province,
            'shipping_zip_postal_code': estimate.shipping_zip_postal_code,
            'shipping_country': estimate.shipping_country,
            'shipping_fee': estimate.shipping_fee,
            'shipping_vat_rate': estimate.shipping_vat_rate,
            'rush_fee': estimate.rush_fee,
            'customer_notes': estimate.notes,
            'terms_conditions': estimate.terms_conditions,
        }

        # Don't include line_items in the initial creation data
        # We'll create them separately after the sales order is created

        # Create the sales order
        serializer = SalesOrderCreateSerializer(data=sales_order_data)
        if serializer.is_valid():
            sales_order = serializer.save(
                created_by=request.user,
                updated_by=request.user
            )

            # Now create line items for the sales order
            from services.finance.sales_orders.models import SalesOrderLineItem
            for line_item in estimate.line_items.all():
                SalesOrderLineItem.objects.create(
                    sales_order=sales_order,
                    product=line_item.product,
                    description=line_item.description,
                    quantity=line_item.quantity,
                    unit_price=line_item.unit_price,
                    discount_rate=line_item.discount_rate,
                    vat_rate=line_item.vat_rate,
                    sort_order=line_item.sort_order,
                )

            return Response({
                'message': 'Estimate successfully converted to sales order',
                'sales_order_id': sales_order.sales_order_id,
                'sales_order_number': sales_order.sales_order_number
            }, status=status.HTTP_201_CREATED)
        else:
            # Log the validation errors for debugging
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Sales order conversion failed. Errors: {serializer.errors}")
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def convert_to_invoice(self, request, pk=None):
        """
        Convert an estimate to an invoice
        """
        estimate = self.get_object()

        # Check if estimate status is appropriate for conversion
        if estimate.status not in ['accepted', 'sent']:
            return Response(
                {'error': 'Only accepted or sent estimates can be converted to invoices'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if estimate already has an invoice
        if hasattr(estimate, 'invoices') and estimate.invoices.exists():
            return Response(
                {'error': 'This estimate has already been converted to an invoice'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Import here to avoid circular imports
        from services.finance.invoices.models import Invoice
        from services.finance.invoices.serializers import EstimateToInvoiceSerializer

        # Get conversion parameters from request
        serializer = EstimateToInvoiceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create invoice from estimate
        invoice_data = serializer.validated_data
        invoice_data['created_by'] = request.user
        invoice_data['updated_by'] = request.user

        try:
            invoice = Invoice.create_from_estimate(estimate, invoice_data)
            
            return Response({
                'message': 'Estimate successfully converted to invoice',
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


class EstimateLineItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing estimate line items with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_opportunities', 'manage_accounts']

    def get_queryset(self):
        """
        Return line items filtered by current tenant and estimate
        Tenant isolation is handled by schema-based multi-tenancy
        """
        estimate_id = self.kwargs.get('estimate_pk')
        if estimate_id:
            return EstimateLineItem.objects.filter(
                estimate_id=estimate_id
            ).select_related('estimate', 'product').all()
        return EstimateLineItem.objects.select_related('estimate', 'product').all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'create':
            return EstimateLineItemCreateSerializer
        return EstimateLineItemSerializer

    @method_decorator(rate_limit(max_requests=20, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create line item for specific estimate
        """
        # For nested URLs (if estimate_pk is in URL)
        estimate_id = self.kwargs.get('estimate_pk')
        if estimate_id:
            try:
                estimate = Estimate.objects.get(pk=estimate_id)
                serializer.save(estimate=estimate)
            except Estimate.DoesNotExist:
                return Response(
                    {'error': 'Estimate not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # For flat URLs (estimate ID comes from request data)
            serializer.save()

    @method_decorator(rate_limit(max_requests=20, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update line item (calculations handled in model.save())
        """
        serializer.save()

    @action(detail=False, methods=['post'])
    def reorder(self, request):
        """
        Reorder line items by updating sort_order
        Expects: {'line_items': [{'line_item_id': 1, 'sort_order': 1}, ...]}
        """
        line_items_data = request.data.get('line_items', [])

        if not line_items_data:
            return Response(
                {'error': 'line_items data is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update sort orders
        updated_count = 0
        for item_data in line_items_data:
            line_item_id = item_data.get('line_item_id')
            sort_order = item_data.get('sort_order')

            if line_item_id and sort_order:
                try:
                    line_item = EstimateLineItem.objects.get(pk=line_item_id)
                    line_item.sort_order = sort_order
                    line_item.save()
                    updated_count += 1
                except EstimateLineItem.DoesNotExist:
                    continue

        return Response({
            'message': f'Updated sort order for {updated_count} line items'
        })

    @action(detail=False, methods=['post'])
    def bulk_update_vat(self, request):
        """
        Bulk update VAT rates for multiple line items
        Expects: {'line_item_ids': [1, 2, 3], 'vat_rate': 20.0}
        """
        line_item_ids = request.data.get('line_item_ids', [])
        vat_rate = request.data.get('vat_rate')

        if not line_item_ids or vat_rate is None:
            return Response(
                {'error': 'line_item_ids and vat_rate are required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not (0 <= vat_rate <= 100):
            return Response(
                {'error': 'VAT rate must be between 0 and 100'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Update VAT rates
        queryset = self.get_queryset().filter(pk__in=line_item_ids)
        updated_count = 0

        for line_item in queryset:
            line_item.vat_rate = vat_rate
            line_item.save()  # This will trigger recalculation
            updated_count += 1

        return Response({
            'message': f'Updated VAT rate for {updated_count} line items',
            'vat_rate': vat_rate
        })
