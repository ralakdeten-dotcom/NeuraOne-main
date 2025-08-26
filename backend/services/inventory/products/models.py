from django.conf import settings
from django.db import models


class Product(models.Model):
    # Choices
    PRODUCT_TYPE_CHOICES = [
        ('inventory', 'Inventory'),
        ('non-inventory', 'Non-Inventory'),
        ('service', 'Service'),
    ]

    BILLING_FREQUENCY_CHOICES = [
        ('one-time', 'One-time'),
        ('monthly', 'Monthly'),
        ('yearly', 'Yearly'),
    ]

    PRODUCT_CONDITION_CHOICES = [
        ('new', 'New'),
        ('used', 'Used'),
        ('refurbished', 'Refurbished'),
        ('damaged', 'Damaged'),
    ]

    # 1. Identifiers & Foreign Keys
    product_id = models.AutoField(primary_key=True)
    # Tenant isolation is handled by schema, no FK needed

    # 2. Core Product Info
    name = models.CharField(max_length=255)
    sku = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    manufacturer = models.CharField(max_length=100, blank=True, null=True, help_text="Product manufacturer")
    category = models.CharField(max_length=100, blank=True, null=True, help_text="Product category")
    part_number = models.CharField(max_length=100, blank=True, null=True, help_text="Manufacturer part number")
    unit = models.CharField(max_length=50, blank=True, null=True, help_text="Unit of measurement (box, kg, cm, etc.)")

    # 3. Pricing & Classification
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Unit price
    current_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Current selling price")
    unit_cost = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True)
    type = models.CharField(
        max_length=50,
        choices=PRODUCT_TYPE_CHOICES,
        default='inventory',
        verbose_name='Product Type',
    )
    billing_frequency = models.CharField(
        max_length=50,
        choices=BILLING_FREQUENCY_CHOICES,
        default='one-time',
    )
    term = models.CharField(max_length=100, blank=True, null=True)

    # 4. Inventory & Vendor Information
    stock = models.IntegerField(default=0, help_text="Current stock quantity")
    vendor_name = models.CharField(max_length=100, blank=True, null=True, help_text="Primary vendor name")
    vendor_price = models.DecimalField(max_digits=10, decimal_places=2, blank=True, null=True, help_text="Vendor cost price")
    product_condition = models.CharField(
        max_length=20,
        choices=PRODUCT_CONDITION_CHOICES,
        default='new',
        help_text="Condition of the product"
    )

    # 5. Optional Attributes
    url = models.URLField(max_length=255, blank=True, null=True)
    image_url = models.URLField(max_length=255, blank=True, null=True)

    # 6. Audit Fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products_created',
        db_column='created_by',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='products_updated',
        db_column='updated_by',
    )

    objects = models.Manager()

    # 7. Meta and Methods
    class Meta:
        db_table = 'product'
        verbose_name = 'Product'
        verbose_name_plural = 'Products'
        ordering = ['name']
        indexes = [
            models.Index(fields=['sku'], name='idx_product_sku'),
            models.Index(fields=['name'], name='idx_product_name'),
            models.Index(fields=['created_at'], name='idx_product_created'),
            models.Index(fields=['manufacturer'], name='idx_product_manufacturer'),
            models.Index(fields=['category'], name='idx_product_category'),
            models.Index(fields=['part_number'], name='idx_product_part_number'),
            models.Index(fields=['vendor_name'], name='idx_product_vendor'),
        ]

    def __str__(self) -> str:
        return f"{self.name} (#{self.product_id})"

    @property
    def margin(self):
        """Calculate profit margin if unit cost is available"""
        if self.unit_cost is not None:
            return float(self.price) - float(self.unit_cost)
        return None

    @property
    def margin_percentage(self):
        """Calculate profit margin percentage if unit cost is available"""
        if self.unit_cost is not None and self.price > 0:
            margin = float(self.price) - float(self.unit_cost)
            return (margin / float(self.price)) * 100
        return None
