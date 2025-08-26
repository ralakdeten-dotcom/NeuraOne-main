from django.conf import settings
from django.db import models
from services.finance.common.mixins import DocumentFeesMixin


class SalesOrder(DocumentFeesMixin, models.Model):
    """Django ORM model for the SALES_ORDER table."""

    # Status choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('confirmed', 'Confirmed'),
        ('in_progress', 'In Progress'),
        ('shipped', 'Shipped'),
        ('delivered', 'Delivered'),
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

    # Delivery method choices
    DELIVERY_METHOD_CHOICES = [
        ('standard', 'Standard Shipping'),
        ('express', 'Express Shipping'),
        ('overnight', 'Overnight Delivery'),
        ('pickup', 'Customer Pickup'),
        ('custom', 'Custom Delivery'),
    ]

    # 1. Identifiers & Primary Key
    sales_order_id = models.AutoField(primary_key=True)

    # Tenant isolation is handled by schema, no FK needed

    # 2. Core Sales Order Info
    sales_order_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique sales order number, e.g., 'SO-2024-001'"
    )
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Customer reference number"
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
        help_text="Current status of the sales order"
    )

    # 3. Source Relationship
    estimate = models.ForeignKey(
        'estimates.Estimate',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales_orders',
        db_column='estimate_id',
        help_text="Source estimate this sales order was generated from"
    )

    # 4. Core Relationships
    customer = models.ForeignKey(
        'customers.FinanceContact',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='sales_orders',
        db_column='customer_id',
        help_text="Customer this sales order is for"
    )
    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='sales_orders',
        db_column='account_id',
        help_text="Account this sales order is for (required)"
    )
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales_orders',
        db_column='contact_id',
        help_text="Primary contact person for this sales order"
    )
    deal = models.ForeignKey(
        'deals.Deal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales_orders',
        db_column='deal_id',
        help_text="Associated deal/opportunity"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_sales_orders',
        db_column='owner_id',
        help_text="Sales rep/owner of this sales order"
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

    # 6. Date Fields
    sales_order_date = models.DateField(
        help_text="Date when sales order was created"
    )
    expected_shipment_date = models.DateField(
        null=True,
        blank=True,
        help_text="Expected date of shipment"
    )
    actual_shipment_date = models.DateField(
        null=True,
        blank=True,
        help_text="Actual date when order was shipped"
    )
    delivery_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date when order was delivered"
    )

    # 7. Payment & Delivery Terms
    payment_terms = models.CharField(
        max_length=20,
        choices=PAYMENT_TERMS_CHOICES,
        default='net_30',
        help_text="Payment terms for this sales order"
    )
    custom_payment_terms = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Custom payment terms description"
    )
    delivery_method = models.CharField(
        max_length=50,
        choices=DELIVERY_METHOD_CHOICES,
        default='standard',
        help_text="Delivery method for this order"
    )
    custom_delivery_method = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text="Custom delivery method if 'custom' is selected"
    )

    # 8. Address Fields (copied from customer at creation time)
    billing_attention = models.CharField(max_length=255, blank=True, null=True)
    billing_street = models.CharField(max_length=255, blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_state_province = models.CharField(max_length=100, blank=True, null=True)
    billing_zip_postal_code = models.CharField(max_length=20, blank=True, null=True)
    billing_country = models.CharField(max_length=100, blank=True, null=True)
    
    shipping_attention = models.CharField(max_length=255, blank=True, null=True)
    shipping_street = models.CharField(max_length=255, blank=True, null=True)
    shipping_city = models.CharField(max_length=100, blank=True, null=True)
    shipping_state_province = models.CharField(max_length=100, blank=True, null=True)
    shipping_zip_postal_code = models.CharField(max_length=20, blank=True, null=True)
    shipping_country = models.CharField(max_length=100, blank=True, null=True)

    # 9. Additional Fields
    customer_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Notes from/for the customer"
    )
    terms_conditions = models.TextField(
        blank=True,
        null=True,
        help_text="Terms and conditions for this sales order"
    )
    internal_notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal notes (not shown to customer)"
    )

    # 10. Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales_orders_created',
        db_column='created_by',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales_orders_updated',
        db_column='updated_by',
    )

    objects = models.Manager()

    class Meta:
        app_label = 'sales_orders'
        db_table = 'sales_order'
        verbose_name = 'Sales Order'
        verbose_name_plural = 'Sales Orders'
        ordering = ['-sales_order_date']
        indexes = [
            models.Index(fields=['sales_order_number'], name='idx_so_number'),
            models.Index(fields=['customer'], name='idx_so_customer'),
            models.Index(fields=['account'], name='idx_so_account'),
            models.Index(fields=['deal'], name='idx_so_deal'),
            models.Index(fields=['contact'], name='idx_so_contact'),
            models.Index(fields=['owner'], name='idx_so_owner'),
            models.Index(fields=['estimate'], name='idx_so_estimate'),
            models.Index(fields=['created_at'], name='idx_so_created'),
            models.Index(fields=['status'], name='idx_so_status'),
            models.Index(fields=['sales_order_date'], name='idx_so_date'),
            models.Index(fields=['expected_shipment_date'], name='idx_so_exp_ship_date'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['sales_order_number'],
                name='unique_so_number_per_schema'
            ),
        ]

    def __str__(self):
        return f"{self.sales_order_number} - {self.account.account_name} ({self.status})"

    @staticmethod
    def generate_next_sales_order_number():
        """Generate the next sequential sales order number in format SO-YYYY-NNN"""
        from django.utils import timezone
        from django.db.models import Max
        import re
        
        current_year = timezone.now().year
        year_prefix = f"SO-{current_year}-"
        
        # Find the highest sales order number for current year that follows our format
        sales_orders = SalesOrder.objects.filter(
            sales_order_number__regex=r'^SO-\d{4}-\d+$'
        ).filter(
            sales_order_number__startswith=year_prefix
        ).aggregate(
            max_number=Max('sales_order_number')
        )
        
        max_sales_order_number = sales_orders['max_number']
        
        if not max_sales_order_number:
            # First sales order of the year
            return f"SO-{current_year}-001"
        
        # Extract numeric suffix using regex (match any number of digits)
        match = re.search(r'SO-\d{4}-(\d+)$', max_sales_order_number)
        if match:
            current_number = int(match.group(1))
            next_number = current_number + 1
        else:
            # Fallback if existing number doesn't follow pattern
            next_number = 1
        
        # Format with zero-padding (minimum 3 digits, more if needed)
        return f"SO-{current_year}-{next_number:03d}"


class SalesOrderLineItem(models.Model):
    """Django ORM model for individual products/services within a sales order."""

    # 1. Identifiers & Primary Key
    line_item_id = models.AutoField(primary_key=True)

    # 2. Relationships
    sales_order = models.ForeignKey(
        'SalesOrder',
        on_delete=models.CASCADE,
        related_name='line_items',
        db_column='sales_order_id',
        help_text="Sales order this line item belongs to"
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='sales_order_line_items',
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
        help_text="Quantity ordered"
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
        app_label = 'sales_orders'
        db_table = 'sales_order_line_item'
        verbose_name = 'Sales Order Line Item'
        verbose_name_plural = 'Sales Order Line Items'
        ordering = ['sort_order', 'line_item_id']
        indexes = [
            models.Index(fields=['sales_order'], name='idx_so_line_sales_order'),
            models.Index(fields=['product'], name='idx_so_line_product'),
            models.Index(fields=['vat_rate'], name='idx_so_line_vat_rate'),
            models.Index(fields=['sort_order'], name='idx_so_line_sort_order'),
        ]

    def __str__(self):
        return f"{self.sales_order.sales_order_number} - {self.product.name} (Qty: {self.quantity})"

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

        # Update parent sales order totals
        self._update_sales_order_totals()

    def delete(self, *args, **kwargs):
        """Override delete to update parent sales order totals."""
        sales_order = self.sales_order
        super().delete(*args, **kwargs)
        self._update_sales_order_totals_for_sales_order(sales_order)

    def _update_sales_order_totals(self):
        """Update the parent sales order's subtotal and total_amount."""
        self._update_sales_order_totals_for_sales_order(self.sales_order)

    def _update_sales_order_totals_for_sales_order(self, sales_order):
        """Update totals for a specific sales order."""
        from django.db.models import Sum

        # Calculate subtotal (sum of all line_subtotal)
        subtotal_result = sales_order.line_items.aggregate(
            total_subtotal=Sum('line_subtotal')
        )
        sales_order.subtotal = subtotal_result['total_subtotal'] or 0.00

        # Calculate total_amount (sum of all line_total)
        total_result = sales_order.line_items.aggregate(
            total_amount=Sum('line_total')
        )
        sales_order.total_amount = total_result['total_amount'] or 0.00

        # Save without triggering additional signals
        sales_order.save(update_fields=['subtotal', 'total_amount', 'updated_at'])