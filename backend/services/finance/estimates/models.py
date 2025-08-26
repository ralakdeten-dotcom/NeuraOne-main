from django.conf import settings
from django.db import models

from services.finance.common.mixins import DocumentFeesMixin


class Estimate(DocumentFeesMixin, models.Model):
    """Django ORM model for the ESTIMATE table."""

    # Status choices
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('sent', 'Sent'),
        ('accepted', 'Accepted'),
        ('rejected', 'Rejected'),
        ('expired', 'Expired'),
    ]

    # 1. Identifiers & Primary Key
    estimate_id = models.AutoField(primary_key=True)

    # Tenant isolation is handled by schema, no FK needed

    # 2. Core Estimate Info
    estimate_number = models.CharField(
        max_length=50,
        unique=True,
        help_text="Unique estimate number, e.g., 'EST-2024-001'"
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
        help_text="Current status of the estimate"
    )

    # 3. Relationships
    customer = models.ForeignKey(
        'customers.FinanceContact',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='estimates',
        db_column='customer_id',
        help_text="Customer this estimate is for"
    )
    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='estimates',
        db_column='account_id',
        help_text="Account this estimate is for (required)"
    )
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estimates',
        db_column='contact_id',
        help_text="Primary contact person for this estimate"
    )
    deal = models.ForeignKey(
        'deals.Deal',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estimates',
        db_column='deal_id',
        help_text="Associated deal/opportunity"
    )
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_estimates',
        db_column='owner_id',
        help_text="Sales rep/owner of this estimate"
    )

    # 4. Financial Fields (calculated from line items)
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

    # 5. Date Fields
    estimate_date = models.DateField(
        help_text="Date when estimate was created"
    )
    valid_until = models.DateField(
        help_text="Expiration date of this estimate"
    )

    # 6. Address Fields (copied from customer at creation time)
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

    # 7. Additional Fields
    notes = models.TextField(
        blank=True,
        null=True,
        help_text="Internal notes for this estimate"
    )
    terms_conditions = models.TextField(
        blank=True,
        null=True,
        help_text="Terms and conditions for this estimate"
    )

    # 8. Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estimates_created',
        db_column='created_by',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='estimates_updated',
        db_column='updated_by',
    )

    objects = models.Manager()

    class Meta:
        app_label = 'estimates'
        db_table = 'estimate'
        verbose_name = 'Estimate'
        verbose_name_plural = 'Estimates'
        ordering = ['-estimate_date']
        indexes = [
            models.Index(fields=['estimate_number'], name='idx_estimate_number'),
            models.Index(fields=['customer'], name='idx_estimate_customer'),
            models.Index(fields=['account'], name='idx_estimate_account'),
            models.Index(fields=['deal'], name='idx_estimate_deal'),
            models.Index(fields=['contact'], name='idx_estimate_contact'),
            models.Index(fields=['owner'], name='idx_estimate_owner'),
            models.Index(fields=['created_at'], name='idx_estimate_created'),
            models.Index(fields=['status'], name='idx_estimate_status'),
            models.Index(fields=['estimate_date'], name='idx_estimate_date'),
            models.Index(fields=['valid_until'], name='idx_estimate_valid_until'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['estimate_number'],
                name='unique_estimate_number_per_schema'
            ),
        ]

    def __str__(self):
        return f"{self.estimate_number} - {self.account.account_name} ({self.status})"

    @staticmethod
    def generate_next_estimate_number():
        """Generate the next sequential estimate number in format EST-YYYY-NNN"""
        import re

        from django.db.models import Max
        from django.utils import timezone

        current_year = timezone.now().year
        year_prefix = f"EST-{current_year}-"

        # Find the highest estimate number for current year that follows our format
        estimates = Estimate.objects.filter(
            estimate_number__regex=r'^EST-\d{4}-\d+$'
        ).filter(
            estimate_number__startswith=year_prefix
        ).aggregate(
            max_number=Max('estimate_number')
        )

        max_estimate_number = estimates['max_number']

        if not max_estimate_number:
            # First estimate of the year
            return f"EST-{current_year}-001"

        # Extract numeric suffix using regex (match any number of digits)
        match = re.search(r'EST-\d{4}-(\d+)$', max_estimate_number)
        if match:
            current_number = int(match.group(1))
            next_number = current_number + 1
        else:
            # Fallback if existing number doesn't follow pattern
            next_number = 1

        # Format with zero-padding (minimum 3 digits, more if needed)
        return f"EST-{current_year}-{next_number:03d}"


class EstimateLineItem(models.Model):
    """Django ORM model for individual products/services within an estimate."""

    # 1. Identifiers & Primary Key
    line_item_id = models.AutoField(primary_key=True)

    # 2. Relationships
    estimate = models.ForeignKey(
        'Estimate',
        on_delete=models.CASCADE,
        related_name='line_items',
        db_column='estimate_id',
        help_text="Estimate this line item belongs to"
    )
    product = models.ForeignKey(
        'products.Product',
        on_delete=models.CASCADE,
        related_name='estimate_line_items',
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
        app_label = 'estimates'
        db_table = 'estimate_line_item'
        verbose_name = 'Estimate Line Item'
        verbose_name_plural = 'Estimate Line Items'
        ordering = ['sort_order', 'line_item_id']
        indexes = [
            models.Index(fields=['estimate'], name='idx_est_line_estimate'),
            models.Index(fields=['product'], name='idx_est_line_product'),
            models.Index(fields=['vat_rate'], name='idx_est_line_vat_rate'),
            models.Index(fields=['sort_order'], name='idx_est_line_sort_order'),
        ]

    def __str__(self):
        return f"{self.estimate.estimate_number} - {self.product.name} (Qty: {self.quantity})"

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

        # Update parent estimate totals
        self._update_estimate_totals()

    def delete(self, *args, **kwargs):
        """Override delete to update parent estimate totals."""
        estimate = self.estimate
        super().delete(*args, **kwargs)
        self._update_estimate_totals_for_estimate(estimate)

    def _update_estimate_totals(self):
        """Update the parent estimate's subtotal and total_amount."""
        self._update_estimate_totals_for_estimate(self.estimate)

    def _update_estimate_totals_for_estimate(self, estimate):
        """Update totals for a specific estimate."""
        from django.db.models import Sum

        # Calculate subtotal (sum of all line_subtotal)
        subtotal_result = estimate.line_items.aggregate(
            total_subtotal=Sum('line_subtotal')
        )
        estimate.subtotal = subtotal_result['total_subtotal'] or 0.00

        # Calculate total_amount (sum of all line_total)
        total_result = estimate.line_items.aggregate(
            total_amount=Sum('line_total')
        )
        estimate.total_amount = total_result['total_amount'] or 0.00

        # Save without triggering additional signals
        estimate.save(update_fields=['subtotal', 'total_amount', 'updated_at'])
