from django.conf import settings
from django.db import models
from services.finance.common.mixins import DocumentFeesMixin


class Invoice(DocumentFeesMixin, models.Model):
    """Django ORM model for the INVOICE table."""

    # Status choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('paid', 'Paid'),
        ('partial', 'Partially Paid'),
        ('overdue', 'Overdue'),
        ('cancelled', 'Cancelled'),
    ]

    # Payment terms choices
    PAYMENT_TERMS_CHOICES = [
        ('net_15', 'Net 15'),
        ('net_30', 'Net 30'),
        ('net_45', 'Net 45'),
        ('net_60', 'Net 60'),
        ('due_on_receipt', 'Due on Receipt'),
        ('custom', 'Custom Terms'),
    ]

    # 1. Identifiers & Primary Key
    invoice_id = models.AutoField(primary_key=True)

    # 2. Core Invoice Info
    invoice_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique invoice number, e.g., 'INV-2024-001'"
    )
    po_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Customer purchase order number"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='draft',
        help_text="Current status of the invoice"
    )

    # 3. Source Relationships
    estimate = models.ForeignKey(
        'estimates.Estimate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        db_column='estimate_id',
        help_text="Source estimate this invoice was generated from"
    )
    sales_order = models.ForeignKey(
        'sales_orders.SalesOrder',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        db_column='sales_order_id',
        help_text="Source sales order this invoice was generated from"
    )

    # 4. Core Relationships
    customer = models.ForeignKey(
        'customers.FinanceContact',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='invoices',
        db_column='customer_id',
        help_text="Customer this invoice is for"
    )
    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='invoices',
        db_column='account_id',
        help_text="Account this invoice is for (required)"
    )
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        db_column='contact_id',
        help_text="Primary contact person for this invoice"
    )
    deal = models.ForeignKey(
        'deals.Deal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices',
        db_column='deal_id',
        help_text="Associated deal/opportunity"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_invoices',
        db_column='owner_id',
        help_text="Sales rep/owner of this invoice"
    )

    # 5. Financial Fields (calculated from line items)
    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="Sum of all line item subtotals (before VAT)"
    )
    total_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="Sum of all line item totals (includes VAT)"
    )
    amount_paid = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="Total amount paid towards this invoice"
    )
    amount_due = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="Remaining amount due (total_amount - amount_paid)"
    )

    # 6. Date Fields
    invoice_date = models.DateField(
        help_text="Date when invoice was created"
    )
    due_date = models.DateField(
        help_text="Due date for payment"
    )
    paid_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when invoice was fully paid"
    )

    # 7. Payment Terms
    payment_terms = models.CharField(
        max_length=20,
        choices=PAYMENT_TERMS_CHOICES,
        default='net_30',
        help_text="Payment terms for this invoice"
    )
    custom_payment_terms = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Custom payment terms description"
    )

    # 8. Billing Address Fields
    billing_attention = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Billing attention to"
    )
    billing_street = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Billing street address"
    )
    billing_city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Billing city"
    )
    billing_state_province = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Billing state or province"
    )
    billing_zip_postal_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Billing ZIP or postal code"
    )
    billing_country = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Billing country"
    )

    # 9. Shipping Address Fields
    shipping_attention = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Shipping attention to"
    )
    shipping_street = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Shipping street address"
    )
    shipping_city = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Shipping city"
    )
    shipping_state_province = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Shipping state or province"
    )
    shipping_zip_postal_code = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Shipping ZIP or postal code"
    )
    shipping_country = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Shipping country"
    )

    # 10. Additional Fields
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal notes for this invoice"
    )
    terms_conditions = models.TextField(
        blank=True,
        null=True,
        help_text="Terms and conditions for this invoice"
    )
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="External reference number"
    )

    # 11. Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices_created',
        db_column='created_by',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='invoices_updated',
        db_column='updated_by',
    )

    objects = models.Manager()

    class Meta:
        app_label = 'invoices'
        db_table = 'invoice'
        verbose_name = 'Invoice'
        verbose_name_plural = 'Invoices'
        ordering = ['-invoice_date']
        indexes = [
            models.Index(fields=['invoice_number'], name='idx_invoice_number'),
            models.Index(fields=['account'], name='idx_invoice_account'),
            models.Index(fields=['customer'], name='idx_invoice_customer'),
            models.Index(fields=['deal'], name='idx_invoice_deal'),
            models.Index(fields=['contact'], name='idx_invoice_contact'),
            models.Index(fields=['owner'], name='idx_invoice_owner'),
            models.Index(fields=['estimate'], name='idx_invoice_estimate'),
            models.Index(fields=['sales_order'], name='idx_invoice_sales_order'),
            models.Index(fields=['created_at'], name='idx_invoice_created'),
            models.Index(fields=['status'], name='idx_invoice_status'),
            models.Index(fields=['invoice_date'], name='idx_invoice_date'),
            models.Index(fields=['due_date'], name='idx_invoice_due_date'),
            models.Index(fields=['paid_date'], name='idx_invoice_paid_date'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['invoice_number'],
                name='unique_invoice_number_per_schema'
            ),
        ]

    def __str__(self):
        return f"{self.invoice_number} - {self.account.account_name} ({self.status})"

    @staticmethod
    def generate_next_invoice_number():
        """Generate the next sequential invoice number in format INV-YYYY-NNN"""
        import re

        from django.db.models import Max
        from django.utils import timezone

        current_year = timezone.now().year
        year_prefix = f"INV-{current_year}-"

        # Find the highest invoice number for current year that follows our format
        invoices = Invoice.objects.filter(
            invoice_number__regex=r'^INV-\d{4}-\d+$'
        ).filter(
            invoice_number__startswith=year_prefix
        ).aggregate(
            max_number=Max('invoice_number')
        )

        max_invoice_number = invoices['max_number']

        if not max_invoice_number:
            # First invoice of the year
            return f"INV-{current_year}-001"

        # Extract numeric suffix using regex (match any number of digits)
        match = re.search(r'INV-\d{4}-(\d+)$', max_invoice_number)
        if match:
            current_number = int(match.group(1))
            next_number = current_number + 1
        else:
            # Fallback if existing number doesn't follow pattern
            next_number = 1

        # Format with zero-padding (minimum 3 digits, more if needed)
        return f"INV-{current_year}-{next_number:03d}"

    def save(self, *args, **kwargs):
        """Override save to calculate amount_due and update status."""
        # Calculate amount_due
        self.amount_due = float(self.total_amount) - float(self.amount_paid)

        # Auto-update status based on payment
        if self.amount_paid == 0:
            if self.status not in ['draft', 'sent', 'cancelled']:
                # Don't change status if it's intentionally set to draft/sent/cancelled
                pass
        elif self.amount_paid >= self.total_amount:
            self.status = 'paid'
            if not self.paid_date:
                from django.utils import timezone
                self.paid_date = timezone.now().date()
        elif self.amount_paid > 0:
            self.status = 'partial'

        # Check for overdue status
        if self.status in ['sent', 'partial'] and self.due_date:
            from django.utils import timezone
            if timezone.now().date() > self.due_date:
                self.status = 'overdue'

        super().save(*args, **kwargs)

    @classmethod
    def create_from_estimate(cls, estimate, invoice_data=None):
        """Create an invoice from an estimate."""
        from datetime import timedelta

        from django.utils import timezone

        if invoice_data is None:
            invoice_data = {}

        # Calculate due date based on payment terms
        invoice_date = invoice_data.get('invoice_date', timezone.now().date())
        payment_terms = invoice_data.get('payment_terms', 'net_30')

        if payment_terms == 'net_15':
            due_date = invoice_date + timedelta(days=15)
        elif payment_terms == 'net_30':
            due_date = invoice_date + timedelta(days=30)
        elif payment_terms == 'net_45':
            due_date = invoice_date + timedelta(days=45)
        elif payment_terms == 'net_60':
            due_date = invoice_date + timedelta(days=60)
        elif payment_terms == 'due_on_receipt':
            due_date = invoice_date
        else:
            # Default to 30 days
            due_date = invoice_date + timedelta(days=30)

        # Create invoice with data from estimate
        invoice = cls.objects.create(
            invoice_number=invoice_data.get('invoice_number') or cls.generate_next_invoice_number(),
            po_number=invoice_data.get('po_number') or estimate.po_number,
            estimate=estimate,
            customer=estimate.customer,
            account=estimate.account,
            contact=estimate.contact,
            deal=estimate.deal,
            owner=estimate.owner,
            subtotal=estimate.subtotal,
            total_amount=estimate.total_amount,
            invoice_date=invoice_date,
            due_date=invoice_data.get('due_date', due_date),
            payment_terms=payment_terms,
            custom_payment_terms=invoice_data.get('custom_payment_terms'),
            notes=invoice_data.get('notes') or estimate.notes,
            terms_conditions=invoice_data.get('terms_conditions') or estimate.terms_conditions,
            reference_number=invoice_data.get('reference_number') or estimate.estimate_number,
            # Copy billing address fields
            billing_attention=estimate.billing_attention,
            billing_street=estimate.billing_street,
            billing_city=estimate.billing_city,
            billing_state_province=estimate.billing_state_province,
            billing_zip_postal_code=estimate.billing_zip_postal_code,
            billing_country=estimate.billing_country,
            # Copy shipping address fields
            shipping_attention=estimate.shipping_attention,
            shipping_street=estimate.shipping_street,
            shipping_city=estimate.shipping_city,
            shipping_state_province=estimate.shipping_state_province,
            shipping_zip_postal_code=estimate.shipping_zip_postal_code,
            shipping_country=estimate.shipping_country,
            # Copy fee fields from DocumentFeesMixin
            shipping_fee=estimate.shipping_fee,
            shipping_vat_rate=estimate.shipping_vat_rate,
            rush_fee=estimate.rush_fee,
            created_by=invoice_data.get('created_by'),
            updated_by=invoice_data.get('updated_by'),
            status=invoice_data.get('status', 'draft'),
        )

        # Copy line items from estimate
        for estimate_line in estimate.line_items.all():
            InvoiceLineItem.objects.create(
                invoice=invoice,
                product=estimate_line.product,
                description=estimate_line.description,
                quantity=estimate_line.quantity,
                unit_price=estimate_line.unit_price,
                discount_rate=estimate_line.discount_rate,
                vat_rate=estimate_line.vat_rate,
                sort_order=estimate_line.sort_order,
            )

        return invoice

    @classmethod
    def create_from_sales_order(cls, sales_order, invoice_data=None):
        """Create an invoice from a sales order."""
        from datetime import timedelta

        from django.utils import timezone

        if invoice_data is None:
            invoice_data = {}

        # Calculate due date based on payment terms
        invoice_date = invoice_data.get('invoice_date', timezone.now().date())
        payment_terms = invoice_data.get('payment_terms') or sales_order.payment_terms or 'net_30'

        if payment_terms == 'net_15':
            due_date = invoice_date + timedelta(days=15)
        elif payment_terms == 'net_30':
            due_date = invoice_date + timedelta(days=30)
        elif payment_terms == 'net_45':
            due_date = invoice_date + timedelta(days=45)
        elif payment_terms == 'net_60':
            due_date = invoice_date + timedelta(days=60)
        elif payment_terms == 'due_on_receipt':
            due_date = invoice_date
        else:
            # Default to 30 days
            due_date = invoice_date + timedelta(days=30)

        # Create invoice with data from sales order
        invoice = cls.objects.create(
            invoice_number=invoice_data.get('invoice_number') or cls.generate_next_invoice_number(),
            po_number=invoice_data.get('po_number') or sales_order.po_number,
            sales_order=sales_order,
            estimate=sales_order.estimate,  # Include original estimate if exists
            customer=sales_order.customer,
            account=sales_order.account,
            contact=sales_order.contact,
            deal=sales_order.deal,
            owner=sales_order.owner,
            subtotal=sales_order.subtotal,
            total_amount=sales_order.total_amount,
            invoice_date=invoice_date,
            due_date=invoice_data.get('due_date', due_date),
            payment_terms=payment_terms,
            custom_payment_terms=invoice_data.get('custom_payment_terms') or sales_order.custom_payment_terms,
            notes=invoice_data.get('notes') or sales_order.customer_notes,  # Map customer_notes to notes
            terms_conditions=invoice_data.get('terms_conditions') or sales_order.terms_conditions,
            reference_number=invoice_data.get('reference_number') or sales_order.sales_order_number,
            # Copy billing address fields
            billing_attention=sales_order.billing_attention,
            billing_street=sales_order.billing_street,
            billing_city=sales_order.billing_city,
            billing_state_province=sales_order.billing_state_province,
            billing_zip_postal_code=sales_order.billing_zip_postal_code,
            billing_country=sales_order.billing_country,
            # Copy shipping address fields
            shipping_attention=sales_order.shipping_attention,
            shipping_street=sales_order.shipping_street,
            shipping_city=sales_order.shipping_city,
            shipping_state_province=sales_order.shipping_state_province,
            shipping_zip_postal_code=sales_order.shipping_zip_postal_code,
            shipping_country=sales_order.shipping_country,
            # Copy fee fields from DocumentFeesMixin
            shipping_fee=sales_order.shipping_fee,
            shipping_vat_rate=sales_order.shipping_vat_rate,
            rush_fee=sales_order.rush_fee,
            created_by=invoice_data.get('created_by'),
            updated_by=invoice_data.get('updated_by'),
            status=invoice_data.get('status', 'draft'),
        )

        # Copy line items from sales order
        for order_line in sales_order.line_items.all():
            InvoiceLineItem.objects.create(
                invoice=invoice,
                product=order_line.product,
                description=order_line.description,
                quantity=order_line.quantity,
                unit_price=order_line.unit_price,
                discount_rate=order_line.discount_rate,
                vat_rate=order_line.vat_rate,
                sort_order=order_line.sort_order,
            )

        return invoice


class InvoiceLineItem(models.Model):
    """Django ORM model for individual products/services within an invoice."""

    # 1. Identifiers & Primary Key
    line_item_id = models.AutoField(primary_key=True)

    # 2. Relationships
    invoice = models.ForeignKey(
        'Invoice',
        on_delete=models.CASCADE,
        related_name='line_items',
        db_column='invoice_id',
        help_text="Invoice this line item belongs to"
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='invoice_line_items',
        db_column='product_id',
        help_text="Product/service for this line item"
    )

    # 3. Core Line Item Fields
    description = models.TextField(
        blank=True,
        null=True,
        help_text="Custom description (can override product description)"
    )
    quantity = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Quantity invoiced"
    )
    unit_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        help_text="Price per unit (can override product price)"
    )
    discount_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="Discount percentage (0-100)"
    )

    # 4. VAT Fields (line-item level)
    vat_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00,
        help_text="VAT percentage for this line item (0-100)"
    )
    vat_amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="Calculated VAT amount for this line item"
    )

    # 5. Calculated Fields
    line_subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="(quantity × unit_price) - discount"
    )
    line_total = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        default=0.00,
        help_text="line_subtotal + vat_amount"
    )

    # 6. Display Order
    sort_order = models.PositiveIntegerField(
        default=1,
        help_text="Display order of this line item"
    )

    # 7. Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    objects = models.Manager()

    class Meta:
        app_label = 'invoices'
        db_table = 'invoice_line_item'
        verbose_name = 'Invoice Line Item'
        verbose_name_plural = 'Invoice Line Items'
        ordering = ['sort_order', 'line_item_id']
        indexes = [
            models.Index(fields=['invoice'], name='idx_inv_line_invoice'),
            models.Index(fields=['product'], name='idx_inv_line_product'),
            models.Index(fields=['vat_rate'], name='idx_inv_line_vat_rate'),
            models.Index(fields=['sort_order'], name='idx_inv_line_sort_order'),
        ]

    def __str__(self):
        return f"{self.invoice.invoice_number} - {self.product.name} (Qty: {self.quantity})"

    def save(self, *args, **kwargs):
        """Override save to calculate line totals automatically."""
        # Calculate line_subtotal: (quantity × unit_price) - discount
        subtotal_before_discount = float(self.quantity) * float(self.unit_price)
        discount_amount = subtotal_before_discount * (float(self.discount_rate) / 100)
        self.line_subtotal = subtotal_before_discount - discount_amount

        # Calculate VAT amount: line_subtotal × vat_rate
        self.vat_amount = float(self.line_subtotal) * (float(self.vat_rate) / 100)

        # Calculate line_total: line_subtotal + vat_amount
        self.line_total = float(self.line_subtotal) + float(self.vat_amount)

        super().save(*args, **kwargs)

        # Update parent invoice totals
        self._update_invoice_totals()

    def delete(self, *args, **kwargs):
        """Override delete to update parent invoice totals."""
        invoice = self.invoice
        super().delete(*args, **kwargs)
        self._update_invoice_totals_for_invoice(invoice)

    def _update_invoice_totals(self):
        """Update the parent invoice's subtotal and total_amount."""
        self._update_invoice_totals_for_invoice(self.invoice)

    def _update_invoice_totals_for_invoice(self, invoice):
        """Update totals for a specific invoice."""
        from django.db.models import Sum

        # Calculate subtotal (sum of all line_subtotal)
        subtotal_result = invoice.line_items.aggregate(
            total_subtotal=Sum('line_subtotal')
        )
        invoice.subtotal = subtotal_result['total_subtotal'] or 0.00

        # Calculate total_amount (sum of all line_total)
        total_result = invoice.line_items.aggregate(
            total_amount=Sum('line_total')
        )
        invoice.total_amount = total_result['total_amount'] or 0.00

        # Save without triggering additional signals
        invoice.save(update_fields=['subtotal', 'total_amount', 'updated_at'])


class InvoicePayment(models.Model):
    """Django ORM model for tracking payments against invoices."""

    # Payment method choices
    PAYMENT_METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('check', 'Check'),
        ('credit_card', 'Credit Card'),
        ('bank_transfer', 'Bank Transfer'),
        ('paypal', 'PayPal'),
        ('stripe', 'Stripe'),
        ('other', 'Other'),
    ]

    # 1. Identifiers & Primary Key
    payment_id = models.AutoField(primary_key=True)

    # 2. Relationships
    invoice = models.ForeignKey(
        'Invoice',
        on_delete=models.CASCADE,
        related_name='payments',
        db_column='invoice_id',
        help_text="Invoice this payment is for"
    )

    # 3. Payment Details
    amount = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        help_text="Payment amount"
    )
    payment_date = models.DateField(
        help_text="Date when payment was received"
    )
    payment_method = models.CharField(
        max_length=20,
        choices=PAYMENT_METHOD_CHOICES,
        help_text="Payment method used"
    )
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Transaction reference number"
    )
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Payment notes"
    )

    # 4. Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='payments_created',
        db_column='created_by',
    )

    objects = models.Manager()

    class Meta:
        app_label = 'invoices'
        db_table = 'invoice_payment'
        verbose_name = 'Invoice Payment'
        verbose_name_plural = 'Invoice Payments'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['invoice'], name='idx_payment_invoice'),
            models.Index(fields=['payment_date'], name='idx_payment_date'),
            models.Index(fields=['payment_method'], name='idx_payment_method'),
            models.Index(fields=['created_at'], name='idx_payment_created'),
        ]

    def __str__(self):
        return f"Payment {self.amount} for {self.invoice.invoice_number}"

    def save(self, *args, **kwargs):
        """Override save to update invoice amount_paid."""
        super().save(*args, **kwargs)
        self._update_invoice_amount_paid()

    def delete(self, *args, **kwargs):
        """Override delete to update invoice amount_paid."""
        invoice = self.invoice
        super().delete(*args, **kwargs)
        self._update_invoice_amount_paid_for_invoice(invoice)

    def _update_invoice_amount_paid(self):
        """Update the parent invoice's amount_paid."""
        self._update_invoice_amount_paid_for_invoice(self.invoice)

    def _update_invoice_amount_paid_for_invoice(self, invoice):
        """Update amount_paid for a specific invoice."""
        from django.db.models import Sum

        # Calculate total payments
        payment_result = invoice.payments.aggregate(
            total_paid=Sum('amount')
        )
        invoice.amount_paid = payment_result['total_paid'] or 0.00

        # Save the invoice (this will also trigger status updates)
        invoice.save(update_fields=['amount_paid', 'updated_at'])
