from rest_framework import serializers
from .models import InventorySettings


class InventorySettingsSerializer(serializers.ModelSerializer):
    """Serializer for inventory settings"""
    
    class Meta:
        model = InventorySettings
        fields = [
            'locations_enabled',
            'track_inventory',
            'allow_negative_stock',
            'auto_reorder_enabled',
            'default_weight_unit',
            'default_dimension_unit',
            'enable_barcode',
            'barcode_type',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']


class LocationsStatusSerializer(serializers.Serializer):
    """Serializer for location enable/disable status"""
    locations_enabled = serializers.BooleanField(read_only=True)
    message = serializers.CharField(read_only=True)
    
    # Statistics when enabling/disabling
    total_locations = serializers.IntegerField(read_only=True, required=False)
    active_locations = serializers.IntegerField(read_only=True, required=False)
    items_with_locations = serializers.IntegerField(read_only=True, required=False)