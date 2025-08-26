import uuid
from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, RegexValidator
from django.core.exceptions import ValidationError
from services.finance.accounting.models import ChartOfAccount
from services.finance.customers.models import FinanceContact


class ItemGroup(models.Model):
    """Product group for categorizing items - based on Zoho Inventory API"""
    group_id = models.BigAutoField(primary_key=True)
    group_name = models.CharField(max_length=255, unique=True, db_index=True)
    brand = models.CharField(max_length=255, blank=True, null=True)
    manufacturer = models.CharField(max_length=255, blank=True, null=True)
    unit = models.CharField(max_length=50, default='qty')
    description = models.TextField(blank=True, null=True)
    status = models.CharField(
        max_length=10,
        choices=[('active', 'Active'), ('inactive', 'Inactive')],
        default='active',
        db_index=True
    )
    source = models.CharField(max_length=100, blank=True, null=True)
    created_time = models.DateTimeField(auto_now_add=True)
    last_modified_time = models.DateTimeField(auto_now=True)
    
    # Tax fields (to be implemented later)
    is_taxable = models.BooleanField(default=True)
    tax_id = models.BigIntegerField(blank=True, null=True)
    tax_name = models.CharField(max_length=255, blank=True, null=True)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, blank=True, null=True)
    tax_type = models.CharField(max_length=100, blank=True, null=True)
    
    # Image fields
    image_id = models.CharField(max_length=50, blank=True, null=True)
    image_name = models.CharField(max_length=255, blank=True, null=True)
    image_type = models.CharField(max_length=10, blank=True, null=True)
    
    # Product type
    product_type = models.CharField(
        max_length=10,
        choices=[('goods', 'Goods'), ('service', 'Service')],
        default='goods'
    )
    
    class Meta:
        db_table = 'inventory_item_groups'
        ordering = ['group_name']
        indexes = [
            models.Index(fields=['group_name']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return self.group_name


class Location(models.Model):
    """Warehouse/Store locations for multi-location inventory - based on Zoho Inventory API"""
    location_id = models.BigAutoField(primary_key=True)
    location_name = models.CharField(max_length=255, db_index=True)
    type = models.CharField(
        max_length=20,
        choices=[('general', 'General'), ('line_item_only', 'Line Item Only')],
        default='general'
    )
    parent_location_id = models.BigIntegerField(blank=True, null=True)
    
    # Address fields
    attention = models.CharField(max_length=255, blank=True, null=True)
    street_address1 = models.CharField(max_length=255, blank=True, null=True)
    street_address2 = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    state_code = models.CharField(max_length=10, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    zip = models.CharField(max_length=20, blank=True, null=True)
    
    # Contact fields
    email = models.EmailField(blank=True, null=True)
    phone = models.CharField(max_length=50, blank=True, null=True)
    
    # Status fields
    is_primary = models.BooleanField(default=False)
    status = models.CharField(
        max_length=10,
        choices=[('active', 'Active'), ('inactive', 'Inactive')],
        default='active',
        db_index=True
    )
    
    # Tax and settings (for future implementation)
    tax_settings_id = models.BigIntegerField(blank=True, null=True)
    autonumbergenerationgroup_id = models.BigIntegerField(blank=True, null=True)
    
    # User association
    is_all_users_selected = models.BooleanField(default=False)
    
    created_time = models.DateTimeField(auto_now_add=True)
    last_modified_time = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_locations'
        ordering = ['-is_primary', 'location_name']
        indexes = [
            models.Index(fields=['location_name']),
            models.Index(fields=['status']),
            models.Index(fields=['is_primary']),
        ]
    
    def __str__(self):
        return self.location_name
    
    @property
    def address(self):
        """Return formatted address as a dictionary"""
        return {
            'attention': self.attention,
            'street_address1': self.street_address1,
            'street_address2': self.street_address2,
            'city': self.city,
            'state': self.state,
            'state_code': self.state_code,
            'country': self.country,
            'zip': self.zip
        }


class Item(models.Model):
    """
    Item model based on Zoho Inventory API specification.
    Handles inventory, sales, purchase, and service items.
    """
    
    # Item Type Choices
    ITEM_TYPE_CHOICES = [
        ('inventory', 'Inventory'),
        ('sales', 'Sales'),
        ('purchases', 'Purchases'),
        ('sales_and_purchases', 'Sales and Purchases'),
    ]
    
    # Product Type Choices
    PRODUCT_TYPE_CHOICES = [
        ('goods', 'Goods'),
        ('service', 'Service'),
    ]
    
    # Status Choices
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    # Basic Information Fields
    item_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active', db_index=True)
    source = models.CharField(max_length=100, blank=True, null=True)
    created_time = models.DateTimeField(auto_now_add=True)
    last_modified_time = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items_created'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items_updated'
    )
    
    # Product Classification Fields
    group_id = models.ForeignKey(
        ItemGroup,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items'
    )
    item_type = models.CharField(
        max_length=30,
        choices=ITEM_TYPE_CHOICES,
        default='inventory',
        db_index=True
    )
    product_type = models.CharField(
        max_length=10,
        choices=PRODUCT_TYPE_CHOICES,
        default='goods'
    )
    is_combo_product = models.BooleanField(default=False)
    is_returnable = models.BooleanField(default=True)
    
    # Pricing Fields
    rate = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    pricebook_rate = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    purchase_rate = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Inventory Management Fields
    unit = models.CharField(max_length=50, default='pcs')
    reorder_level = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        default=Decimal('0.000'),
        validators=[MinValueValidator(Decimal('0.000'))]
    )
    initial_stock = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        default=Decimal('0.000'),
        validators=[MinValueValidator(Decimal('0.000'))]
    )
    initial_stock_rate = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    stock_on_hand = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        default=Decimal('0.000')
    )
    actual_available_stock = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        default=Decimal('0.000')
    )
    available_stock = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        default=Decimal('0.000')
    )
    
    # Accounting Fields (Reference to ChartOfAccount)
    account_id = models.ForeignKey(
        ChartOfAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='sales_items',
        help_text='Sales account for this item'
    )
    purchase_account_id = models.ForeignKey(
        ChartOfAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='purchase_items',
        help_text='Purchase account for this item'
    )
    inventory_account_id = models.ForeignKey(
        ChartOfAccount,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='inventory_items',
        help_text='Inventory asset account'
    )
    
    # Product Identifiers Fields
    sku = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        unique=True,
        help_text='Stock Keeping Unit - unique identifier'
    )
    upc = models.CharField(
        max_length=12,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^\d{12}$', 'UPC must be exactly 12 digits')],
        help_text='Universal Product Code (12 digits)'
    )
    ean = models.CharField(
        max_length=13,
        blank=True,
        null=True,
        validators=[RegexValidator(r'^\d{13}$', 'EAN must be exactly 13 digits')],
        help_text='European Article Number (13 digits)'
    )
    isbn = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text='International Standard Book Number'
    )
    mpn = models.CharField(
        max_length=100,
        blank=True,
        null=True,
        help_text='Manufacturer Part Number (MPN)'
    )
    
    # Physical Attributes Fields
    length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Product length'
    )
    width = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Product width'
    )
    height = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text='Product height'
    )
    dimension_unit = models.CharField(
        max_length=10,
        choices=[('cm', 'Centimeters'), ('in', 'Inches')],
        default='cm',
        blank=True,
        null=True,
        help_text='Unit for dimensions (length, width, height)'
    )
    weight = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        blank=True,
        null=True,
        validators=[MinValueValidator(Decimal('0.000'))],
        help_text='Product weight'
    )
    weight_unit = models.CharField(
        max_length=10,
        choices=[
            ('kg', 'Kilograms'),
            ('lbs', 'Pounds'),
            ('g', 'Grams'),
            ('oz', 'Ounces')
        ],
        default='kg',
        blank=True,
        null=True,
        help_text='Unit for weight'
    )
    
    # Sales Information Fields
    sales_description = models.TextField(
        blank=True,
        null=True,
        help_text='Description for sales transactions (quotes, invoices, etc.)'
    )
    
    # Vendor Management Fields (Purchase Information)
    vendor_id = models.ForeignKey(
        FinanceContact,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='supplied_items',
        limit_choices_to=models.Q(contact_type='vendor') | models.Q(contact_type='customer_and_vendor'),
        help_text='Preferred vendor/supplier for purchasing this item'
    )
    purchase_description = models.TextField(
        blank=True,
        null=True,
        help_text='Description for purchase transactions (bills, purchase orders, etc.)'
    )
    
    # Product Variants & Attributes Fields
    attribute_id1 = models.BigIntegerField(blank=True, null=True)
    attribute_name1 = models.CharField(max_length=100, blank=True, null=True)
    attribute_option_id1 = models.BigIntegerField(blank=True, null=True)
    attribute_option_name1 = models.CharField(max_length=100, blank=True, null=True)
    
    # Media Fields
    image_id = models.BigIntegerField(blank=True, null=True)
    image_name = models.CharField(max_length=255, blank=True, null=True)
    image_type = models.CharField(max_length=10, blank=True, null=True)
    documents = models.JSONField(default=list, blank=True)
    
    class Meta:
        db_table = 'inventory_items'
        ordering = ['-created_time']
        indexes = [
            models.Index(fields=['sku']),
            models.Index(fields=['name']),
            models.Index(fields=['status']),
            models.Index(fields=['item_type']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['name'],
                name='unique_item_name_per_tenant'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.sku})"
    
    # Property methods for related names
    @property
    def group_name(self):
        """Returns the item group name"""
        return self.group_id.group_name if self.group_id else None
    
    @property
    def vendor_name(self):
        """Returns the vendor name"""
        return self.vendor_id.display_name if self.vendor_id else None
    
    @property
    def account_name(self):
        """Returns the sales account name"""
        return self.account_id.account_name if self.account_id else None
    
    @property
    def purchase_account_name(self):
        """Returns the purchase account name"""
        return self.purchase_account_id.account_name if self.purchase_account_id else None
    
    @property
    def is_low_stock(self):
        """Check if item is below reorder level"""
        return self.stock_on_hand < self.reorder_level
    
    def clean(self):
        """Validate model fields"""
        super().clean()
        
        # Validate UPC format
        if self.upc and len(self.upc) != 12:
            raise ValidationError({'upc': 'UPC must be exactly 12 digits'})
        
        # Validate EAN format
        if self.ean and len(self.ean) != 13:
            raise ValidationError({'ean': 'EAN must be exactly 13 digits'})
        
        # Validate reorder level
        if self.reorder_level < 0:
            raise ValidationError({'reorder_level': 'Reorder level cannot be negative'})
        
        # Business rule validations
        if self.group_id and self.item_type != 'inventory':
            raise ValidationError({'item_type': 'Items with groups must be inventory type'})
        
        if self.product_type == 'service' and self.item_type == 'inventory':
            raise ValidationError({'item_type': 'Service products cannot be inventory type'})
        
        # Note: All sales and purchase fields are optional, no validation required
    
    def save(self, *args, **kwargs):
        """Override save to handle business logic"""
        # Validate before saving
        self.full_clean()
        
        # Update timestamps are handled by auto_now fields
        super().save(*args, **kwargs)
    
    def update_stock_levels(self):
        """
        Calculate and update stock levels based on Zoho logic.
        This will be expanded when ItemLocation model is implemented.
        """
        # Calculate stock_on_hand from all ItemLocation records
        from django.db.models import Sum
        if hasattr(self, 'item_locations'):
            total_stock = self.item_locations.aggregate(
                total=Sum('location_stock_on_hand')
            )['total'] or Decimal('0.000')
            self.stock_on_hand = total_stock
        
        # For now, set available stocks equal to stock_on_hand
        # These will be calculated differently when orders are implemented
        self.available_stock = self.stock_on_hand
        self.actual_available_stock = self.stock_on_hand
        
        self.save(update_fields=['stock_on_hand', 'available_stock', 'actual_available_stock'])
    
    def adjust_stock(self, adjustment_type, quantity, reason=None, location=None):
        """
        Adjust stock levels for the item.
        
        Args:
            adjustment_type: 'increase' or 'decrease'
            quantity: Decimal amount to adjust
            reason: Optional reason for adjustment
            location: Optional Location instance
        """
        quantity = Decimal(str(quantity))
        
        if adjustment_type == 'increase':
            self.stock_on_hand += quantity
        elif adjustment_type == 'decrease':
            if self.stock_on_hand < quantity:
                raise ValidationError('Insufficient stock for decrease')
            self.stock_on_hand -= quantity
        else:
            raise ValidationError('Invalid adjustment type')
        
        # Update all stock levels
        self.available_stock = self.stock_on_hand
        self.actual_available_stock = self.stock_on_hand
        
        self.save(update_fields=['stock_on_hand', 'available_stock', 'actual_available_stock'])


class ItemLocation(models.Model):
    """Multi-location stock tracking for items"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='item_locations')
    location = models.ForeignKey(Location, on_delete=models.CASCADE, related_name='item_stocks', to_field='location_id')
    location_stock_on_hand = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        default=Decimal('0.000')
    )
    location_available_stock = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        default=Decimal('0.000')
    )
    location_actual_available_stock = models.DecimalField(
        max_digits=15,
        decimal_places=3,
        default=Decimal('0.000')
    )
    is_primary = models.BooleanField(default=False)
    
    class Meta:
        db_table = 'inventory_item_locations'
        unique_together = [['item', 'location']]
        ordering = ['-is_primary', 'location__location_name']
    
    def __str__(self):
        return f"{self.item.name} @ {self.location.location_name}"


class CustomField(models.Model):
    """Custom field definitions for items"""
    FIELD_TYPE_CHOICES = [
        ('text', 'Text'),
        ('number', 'Number'),
        ('date', 'Date'),
        ('select', 'Select'),
    ]
    
    customfield_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    field_name = models.CharField(max_length=100, unique=True)
    field_type = models.CharField(max_length=10, choices=FIELD_TYPE_CHOICES)
    field_options = models.JSONField(blank=True, null=True)
    is_required = models.BooleanField(default=False)
    display_order = models.IntegerField(default=0)
    
    class Meta:
        db_table = 'inventory_custom_fields'
        ordering = ['display_order', 'field_name']
    
    def __str__(self):
        return self.field_name


class ItemCustomFieldValue(models.Model):
    """Custom field values for items"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    item = models.ForeignKey(Item, on_delete=models.CASCADE, related_name='custom_field_values')
    custom_field = models.ForeignKey(CustomField, on_delete=models.CASCADE)
    value = models.TextField()
    
    class Meta:
        db_table = 'inventory_item_custom_field_values'
        unique_together = [['item', 'custom_field']]
    
    def __str__(self):
        return f"{self.item.name} - {self.custom_field.field_name}: {self.value}"