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

from .models import Invoice, InvoiceLineItem, InvoicePayment
from .serializers import (
    EstimateToInvoiceSerializer,
    InvoiceCreateSerializer,
    InvoiceLineItemCreateSerializer,
    InvoiceLineItemSerializer,
    InvoiceListSerializer,
    InvoicePaymentSerializer,
    InvoiceSerializer,
    InvoiceSummarySerializer,
    SalesOrderToInvoiceSerializer,
)


class InvoiceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoices with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_opportunities', 'manage_accounts']

    def get_queryset(self):
        """
        Return invoices filtered by current tenant
        Tenant isolation is handled by schema-based multi-tenancy
        """
        return Invoice.objects.select_related(
            'account', 'contact', 'deal', 'owner', 'estimate', 'created_by', 'updated_by'
        ).prefetch_related('line_items__product', 'payments').all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return InvoiceListSerializer
        elif self.action == 'create':
            return InvoiceCreateSerializer
        return InvoiceSerializer

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create invoice with audit info (tenant isolation via schema)
        """
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update invoice with audit info
        """
        serializer.save(updated_by=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get invoice summary statistics for the current tenant
        """
        queryset = self.get_queryset()

        total_invoices = queryset.count()
        total_value = sum(float(i.total_amount) for i in queryset)
        total_paid = sum(float(i.amount_paid) for i in queryset)
        total_outstanding = total_value - total_paid
        avg_invoice_value = total_value / total_invoices if total_invoices > 0 else 0

        # Status breakdown
        status_breakdown = {}
        for choice_value, choice_label in Invoice.STATUS_CHOICES:
            count = queryset.filter(status=choice_value).count()
            status_breakdown[choice_value] = {
                'label': choice_label,
                'count': count
            }

        # Overdue invoices
        today = timezone.now().date()
        overdue_queryset = queryset.filter(
            due_date__lt=today,
            status__in=['sent', 'partial']
        )
        overdue_invoices = overdue_queryset.count()
        overdue_amount = sum(float(i.amount_due) for i in overdue_queryset)

        # Recent invoices (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_invoices = queryset.filter(created_at__gte=thirty_days_ago).count()

        summary_data = {
            'total_invoices': total_invoices,
            'total_value': total_value,
            'total_paid': total_paid,
            'total_outstanding': total_outstanding,
            'avg_invoice_value': avg_invoice_value,
            'invoices_by_status': status_breakdown,
            'overdue_invoices': overdue_invoices,
            'overdue_amount': overdue_amount,
            'recent_invoices': recent_invoices,
        }

        serializer = InvoiceSummarySerializer(summary_data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def search(self, request):
        """
        Search invoices by invoice number, account name, or PO number
        """
        query = request.query_params.get('q', '')
        if not query:
            return Response({'error': 'Query parameter "q" is required'},
                          status=status.HTTP_400_BAD_REQUEST)

        queryset = self.get_queryset()

        # Search in invoice number, account name, and PO number
        filtered_queryset = queryset.filter(
            models.Q(invoice_number__icontains=query) |
            models.Q(account__account_name__icontains=query) |
            models.Q(po_number__icontains=query) |
            models.Q(reference_number__icontains=query)
        )

        serializer = InvoiceListSerializer(filtered_queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """
        Get all overdue invoices
        """
        today = timezone.now().date()
        queryset = self.get_queryset().filter(
            due_date__lt=today,
            status__in=['sent', 'partial']
        )

        serializer = InvoiceListSerializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def duplicate(self, request, pk=None):
        """
        Create a duplicate of an existing invoice
        """
        original_invoice = self.get_object()

        # Create new invoice with modified data
        new_invoice_data = {
            'account': original_invoice.account.pk,
            'contact': original_invoice.contact.pk if original_invoice.contact else None,
            'deal': original_invoice.deal.pk if original_invoice.deal else None,
            'owner': original_invoice.owner.pk if original_invoice.owner else None,
            'invoice_date': timezone.now().date(),
            'payment_terms': original_invoice.payment_terms,
            'custom_payment_terms': original_invoice.custom_payment_terms,
            'notes': original_invoice.notes,
            'terms_conditions': original_invoice.terms_conditions,
            'status': 'draft',
        }

        # Auto-generate new invoice number
        new_invoice_data['invoice_number'] = Invoice.generate_next_invoice_number()

        # Create the new invoice
        serializer = InvoiceCreateSerializer(data=new_invoice_data)
        if serializer.is_valid():
            new_invoice = serializer.save(
                created_by=request.user,
                updated_by=request.user
            )

            # Duplicate line items
            for line_item in original_invoice.line_items.all():
                InvoiceLineItem.objects.create(
                    invoice=new_invoice,
                    product=line_item.product,
                    description=line_item.description,
                    quantity=line_item.quantity,
                    unit_price=line_item.unit_price,
                    discount_rate=line_item.discount_rate,
                    vat_rate=line_item.vat_rate,
                    sort_order=line_item.sort_order,
                )

            # Return the new invoice with full details
            response_serializer = InvoiceSerializer(new_invoice)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def mark_sent(self, request, pk=None):
        """
        Mark invoice as sent
        """
        invoice = self.get_object()

        if invoice.status != 'draft':
            return Response(
                {'error': 'Only draft invoices can be marked as sent'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice.status = 'sent'
        invoice.updated_by = request.user
        invoice.save()

        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """
        Mark invoice as fully paid
        """
        invoice = self.get_object()

        if invoice.status in ['paid', 'cancelled']:
            return Response(
                {'error': f'Invoice is already {invoice.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Create a payment record for the remaining amount
        # Allow frontend to override amount to include fees
        remaining_amount = request.data.get('amount', float(invoice.amount_due))
        if remaining_amount > 0:
            payment_data = {
                'invoice': invoice.pk,
                'amount': remaining_amount,
                'payment_date': timezone.now().date(),
                'payment_method': request.data.get('payment_method', 'other'),
                'reference_number': request.data.get('reference_number', ''),
                'notes': request.data.get('notes', 'Marked as paid via API'),
            }

            payment_serializer = InvoicePaymentSerializer(data=payment_data)
            if payment_serializer.is_valid():
                payment_serializer.save(created_by=request.user)
            else:
                return Response(payment_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        invoice.refresh_from_db()
        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """
        Cancel an invoice
        """
        invoice = self.get_object()

        if invoice.status in ['paid', 'cancelled']:
            return Response(
                {'error': f'Cannot cancel invoice that is {invoice.status}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        invoice.status = 'cancelled'
        invoice.updated_by = request.user
        invoice.save()

        serializer = InvoiceSerializer(invoice)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def create_from_estimate(self, request):
        """
        Create an invoice from an estimate
        """
        estimate_id = request.data.get('estimate_id')
        if not estimate_id:
            return Response(
                {'error': 'estimate_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            from services.finance.estimates.models import Estimate
            estimate = Estimate.objects.get(pk=estimate_id)
        except Estimate.DoesNotExist:
            return Response(
                {'error': 'Estimate not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check if estimate is accepted
        if estimate.status not in ['accepted', 'sent']:
            return Response(
                {'error': 'Only accepted or sent estimates can be converted to invoices'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate the conversion data
        serializer = EstimateToInvoiceSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Create invoice from estimate
        invoice_data = serializer.validated_data.copy()
        invoice_data['created_by'] = request.user

        try:
            invoice = Invoice.create_from_estimate(estimate, invoice_data)
            response_serializer = InvoiceSerializer(invoice)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': f'Failed to create invoice: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class InvoiceLineItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoice line items with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_opportunities', 'manage_accounts']

    def get_queryset(self):
        """
        Return line items filtered by current tenant and invoice
        Tenant isolation is handled by schema-based multi-tenancy
        """
        invoice_id = self.kwargs.get('invoice_pk')
        if invoice_id:
            return InvoiceLineItem.objects.filter(
                invoice_id=invoice_id
            ).select_related('invoice', 'product').all()
        return InvoiceLineItem.objects.select_related('invoice', 'product').all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'create':
            return InvoiceLineItemCreateSerializer
        return InvoiceLineItemSerializer

    @method_decorator(rate_limit(max_requests=20, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create line item for specific invoice
        """
        # For nested URLs (if invoice_pk is in URL)
        invoice_id = self.kwargs.get('invoice_pk')
        if invoice_id:
            try:
                invoice = Invoice.objects.get(pk=invoice_id)
                serializer.save(invoice=invoice)
            except Invoice.DoesNotExist:
                return Response(
                    {'error': 'Invoice not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # For flat URLs (invoice ID comes from request data)
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
                    line_item = InvoiceLineItem.objects.get(pk=line_item_id)
                    line_item.sort_order = sort_order
                    line_item.save()
                    updated_count += 1
                except InvoiceLineItem.DoesNotExist:
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


class InvoicePaymentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing invoice payments with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_opportunities', 'manage_accounts']
    serializer_class = InvoicePaymentSerializer

    def get_queryset(self):
        """
        Return payments filtered by current tenant and invoice
        Tenant isolation is handled by schema-based multi-tenancy
        """
        invoice_id = self.kwargs.get('invoice_pk')
        if invoice_id:
            return InvoicePayment.objects.filter(
                invoice_id=invoice_id
            ).select_related('invoice', 'created_by').all()
        return InvoicePayment.objects.select_related('invoice', 'created_by').all()

    @method_decorator(rate_limit(max_requests=20, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create payment for specific invoice
        """
        # For nested URLs (if invoice_pk is in URL)
        invoice_id = self.kwargs.get('invoice_pk')
        if invoice_id:
            try:
                invoice = Invoice.objects.get(pk=invoice_id)
                serializer.save(invoice=invoice, created_by=self.request.user)
            except Invoice.DoesNotExist:
                return Response(
                    {'error': 'Invoice not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            # For flat URLs (invoice ID comes from request data)
            serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'])
    def by_method(self, request):
        """
        Get payments grouped by payment method
        """
        queryset = self.get_queryset()

        payment_methods = {}
        for choice_value, choice_label in InvoicePayment.PAYMENT_METHOD_CHOICES:
            payments = queryset.filter(payment_method=choice_value)
            total_amount = sum(float(p.amount) for p in payments)
            payment_methods[choice_value] = {
                'label': choice_label,
                'count': payments.count(),
                'total_amount': total_amount
            }

        return Response(payment_methods)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """
        Get recent payments (last 30 days)
        """
        thirty_days_ago = timezone.now() - timedelta(days=30)
        queryset = self.get_queryset().filter(payment_date__gte=thirty_days_ago.date())

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
