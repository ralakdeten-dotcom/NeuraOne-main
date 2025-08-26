from django.db import models
from django.core.cache import cache


class InventorySettings(models.Model):
    """
    Inventory settings for the organization/tenant.
    This is a singleton model - only one instance per tenant.
    """
    
    # Location Management Settings
    locations_enabled = models.BooleanField(
        default=False,
        help_text='Enable multi-location inventory tracking'
    )
    
    # Stock Management Settings
    track_inventory = models.BooleanField(
        default=True,
        help_text='Track inventory levels for products'
    )
    
    allow_negative_stock = models.BooleanField(
        default=False,
        help_text='Allow stock levels to go negative'
    )
    
    auto_reorder_enabled = models.BooleanField(
        default=False,
        help_text='Enable automatic reorder notifications'
    )
    
    # Default Units
    default_weight_unit = models.CharField(
        max_length=10,
        choices=[
            ('kg', 'Kilograms'),
            ('lbs', 'Pounds'),
            ('g', 'Grams'),
            ('oz', 'Ounces')
        ],
        default='kg'
    )
    
    default_dimension_unit = models.CharField(
        max_length=10,
        choices=[
            ('cm', 'Centimeters'),
            ('in', 'Inches'),
            ('m', 'Meters'),
            ('ft', 'Feet')
        ],
        default='cm'
    )
    
    # Barcode Settings
    enable_barcode = models.BooleanField(
        default=True,
        help_text='Enable barcode functionality'
    )
    
    barcode_type = models.CharField(
        max_length=20,
        choices=[
            ('CODE128', 'Code 128'),
            ('CODE39', 'Code 39'),
            ('EAN13', 'EAN-13'),
            ('UPC', 'UPC-A'),
            ('QR', 'QR Code')
        ],
        default='CODE128'
    )
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'inventory_settings'
        verbose_name = 'Inventory Settings'
        verbose_name_plural = 'Inventory Settings'
    
    def save(self, *args, **kwargs):
        """Ensure only one instance exists per tenant"""
        if not self.pk and InventorySettings.objects.exists():
            # If creating new and instance already exists, update existing
            existing = InventorySettings.objects.first()
            self.pk = existing.pk
        
        # Clear cache when settings change
        cache_key = 'inventory_settings'
        cache.delete(cache_key)
        
        super().save(*args, **kwargs)
    
    @classmethod
    def get_settings(cls):
        """
        Get or create inventory settings for the current tenant.
        Uses cache for performance.
        """
        cache_key = 'inventory_settings'
        settings = cache.get(cache_key)
        
        if settings is None:
            settings, created = cls.objects.get_or_create(
                defaults={
                    'locations_enabled': False,
                    'track_inventory': True
                }
            )
            # Cache for 1 hour
            cache.set(cache_key, settings, 3600)
        
        return settings
    
    @classmethod
    def is_locations_enabled(cls):
        """Quick check if locations are enabled"""
        settings = cls.get_settings()
        return settings.locations_enabled
    
    def __str__(self):
        return f"Inventory Settings (Locations: {'Enabled' if self.locations_enabled else 'Disabled'})"