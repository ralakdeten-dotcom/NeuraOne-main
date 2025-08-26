from decimal import Decimal
from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from services.inventory.items.models import Item


class PriceBook(models.Model):
    """
    PriceBook model based on Zoho Inventory pricelists API specification.
    Handles price lists for increasing or decreasing product selling or purchase prices.
    """
    
    # Pricebook Type Choices
    PRICEBOOK_TYPE_CHOICES = [
        ('per_item', 'Per Item'),
        ('fixed_percentage', 'Fixed Percentage'),
    ]
    
    # Rounding Type Choices
    ROUNDING_TYPE_CHOICES = [
        ('no_rounding', 'No Rounding'),
        ('round_to_dollor', 'Round to Dollar'),
        ('round_to_dollar_minus_01', 'Round to Dollar Minus 0.01'),
        ('round_to_half_dollar', 'Round to Half Dollar'),
        ('round_to_half_dollar_minus_01', 'Round to Half Dollar Minus 0.01'),
    ]
    
    # Sales or Purchase Type Choices
    SALES_OR_PURCHASE_TYPE_CHOICES = [
        ('sales', 'Sales'),
        ('purchases', 'Purchases'),
    ]
    
    # Status Choices
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    # Core Information Fields
    pricebook_id = models.BigAutoField(primary_key=True)
    name = models.CharField(max_length=255, db_index=True)
    description = models.TextField(blank=True, null=True)
    
    # Currency & Formatting Fields
    currency_id = models.CharField(max_length=50)
    currency_code = models.CharField(max_length=10, blank=True, null=True)
    decimal_place = models.IntegerField(default=2, validators=[MinValueValidator(0)])
    
    # Pricing Configuration Fields
    is_default = models.BooleanField(default=False)
    is_increase = models.BooleanField()
    percentage = models.IntegerField(blank=True, null=True, validators=[MinValueValidator(0)])
    pricebook_type = models.CharField(max_length=20, choices=PRICEBOOK_TYPE_CHOICES)
    rounding_type = models.CharField(
        max_length=30, 
        choices=ROUNDING_TYPE_CHOICES, 
        default='no_rounding'
    )
    
    # Business Type
    sales_or_purchase_type = models.CharField(max_length=10, choices=SALES_OR_PURCHASE_TYPE_CHOICES)
    
    # Status
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='active', db_index=True)
    
    # Timestamps and user tracking
    created_time = models.DateTimeField(auto_now_add=True)
    last_modified_time = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pricelists_created'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='pricelists_updated'
    )
    
    class Meta:
        db_table = 'inventory_pricebooks'
        ordering = ['-created_time']
        indexes = [
            models.Index(fields=['name']),
            models.Index(fields=['status']),
            models.Index(fields=['pricebook_type']),
            models.Index(fields=['sales_or_purchase_type']),
            models.Index(fields=['is_default']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['name'],
                name='unique_pricebook_name_per_tenant'
            )
        ]
    
    def __str__(self):
        return f"{self.name} ({self.sales_or_purchase_type})"
    
    def clean(self):
        """Validate model fields"""
        super().clean()
        
        # Validate percentage field based on pricebook_type
        if self.pricebook_type == 'fixed_percentage':
            if self.percentage is None:
                raise ValidationError({
                    'percentage': 'Percentage is required when pricebook type is fixed percentage.'
                })
        
        # Validate that percentage is not set for per_item type
        if self.pricebook_type == 'per_item' and self.percentage is not None:
            raise ValidationError({
                'percentage': 'Percentage should not be set when pricebook type is per item.'
            })
        
        # Validate decimal_place range
        if self.decimal_place < 0 or self.decimal_place > 10:
            raise ValidationError({
                'decimal_place': 'Decimal places must be between 0 and 10.'
            })
    
    def save(self, *args, **kwargs):
        """Override save to handle business logic"""
        # Validate before saving
        self.full_clean()
        
        # Handle default pricebook logic - only one default per sales_or_purchase_type
        if self.is_default:
            # Unset other default pricebooks of the same type
            PriceBook.objects.filter(
                sales_or_purchase_type=self.sales_or_purchase_type,
                is_default=True
            ).exclude(pricebook_id=self.pricebook_id).update(is_default=False)
        
        super().save(*args, **kwargs)
    
    
    def get_item_price(self, item, base_price=None):
        """
        Calculate price for an item based on pricebook settings.
        
        Args:
            item: Item instance
            base_price: Base price to calculate from (uses item.rate if not provided)
        
        Returns:
            Calculated price as Decimal
        """
        if base_price is None:
            base_price = item.rate
        
        if self.pricebook_type == 'per_item':
            # Look for specific item rate
            try:
                pricebook_item = self.pricebook_items.get(item=item)
                return pricebook_item.pricebook_rate
            except PriceBookItem.DoesNotExist:
                return base_price
        
        elif self.pricebook_type == 'fixed_percentage':
            # Calculate based on percentage
            if self.percentage is not None:
                percentage_decimal = Decimal(self.percentage) / Decimal('100')
                if self.is_increase:
                    calculated_price = base_price * (Decimal('1') + percentage_decimal)
                else:
                    calculated_price = base_price * (Decimal('1') - percentage_decimal)
                
                # Apply rounding
                return self.apply_rounding(calculated_price)
        
        return base_price
    
    def apply_rounding(self, price):
        """Apply rounding based on rounding_type"""
        if self.rounding_type == 'no_rounding':
            return price.quantize(Decimal('0.01'))
        
        elif self.rounding_type == 'round_to_dollor':
            # Round to nearest whole dollar
            return price.quantize(Decimal('1'))
        
        elif self.rounding_type == 'round_to_dollar_minus_01':
            # Round to nearest dollar minus 0.01 (e.g., 10.99)
            whole_part = int(price)
            return Decimal(f"{whole_part}.99")
        
        elif self.rounding_type == 'round_to_half_dollar':
            # Round to nearest 0.50
            whole_part = int(price)
            decimal_part = price - whole_part
            if decimal_part <= Decimal('0.25'):
                return Decimal(str(whole_part))
            elif decimal_part <= Decimal('0.75'):
                return Decimal(f"{whole_part}.50")
            else:
                return Decimal(str(whole_part + 1))
        
        elif self.rounding_type == 'round_to_half_dollar_minus_01':
            # Round to nearest 0.49
            whole_part = int(price)
            decimal_part = price - whole_part
            if decimal_part <= Decimal('0.25'):
                return Decimal(f"{whole_part - 1}.49") if whole_part > 0 else Decimal('0.49')
            else:
                return Decimal(f"{whole_part}.49")
        
        return price.quantize(Decimal('0.01'))


class PriceBookItem(models.Model):
    """
    PriceBookItem model for per-item pricing in price lists.
    Links specific items with their custom rates in a pricebook.
    """
    
    # Primary key
    pricebook_item_id = models.BigAutoField(primary_key=True)
    
    # Relationships
    pricebook = models.ForeignKey(
        PriceBook,
        on_delete=models.CASCADE,
        related_name='pricebook_items'
    )
    item = models.ForeignKey(
        Item,
        on_delete=models.CASCADE,
        related_name='pricebook_items'
    )
    
    # Pricing
    pricebook_rate = models.DecimalField(
        max_digits=15,
        decimal_places=2,
        validators=[MinValueValidator(Decimal('0.00'))]
    )
    
    # Timestamps
    created_time = models.DateTimeField(auto_now_add=True)
    last_modified_time = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_pricebook_items'
        unique_together = [['pricebook', 'item']]
        ordering = ['item__name']
        indexes = [
            models.Index(fields=['pricebook']),
            models.Index(fields=['item']),
            models.Index(fields=['pricebook_rate']),
        ]
    
    def __str__(self):
        return f"{self.pricebook.name} - {self.item.name}: {self.pricebook_rate}"
    
    def clean(self):
        """Validate model fields"""
        super().clean()
        
        # Ensure the pricebook is of per_item type
        if self.pricebook and self.pricebook.pricebook_type != 'per_item':
            raise ValidationError({
                'pricebook': 'Can only add items to per-item type pricebooks.'
            })
        
        # Validate rate is positive
        if self.pricebook_rate <= 0:
            raise ValidationError({
                'pricebook_rate': 'Pricebook rate must be greater than zero.'
            })
    
    def save(self, *args, **kwargs):
        """Override save to validate"""
        self.full_clean()
        super().save(*args, **kwargs)