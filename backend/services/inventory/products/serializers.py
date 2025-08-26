from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Product

User = get_user_model()


class ProductSerializer(serializers.ModelSerializer):
    """
    Serializer for Product model with all fields
    """
    # Read-only fields for display
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    # Calculated fields
    margin = serializers.ReadOnlyField()
    margin_percentage = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'product_id',
            'name',
            'sku',
            'description',
            'manufacturer',
            'category',
            'part_number',
            'unit',
            'price',
            'current_price',
            'unit_cost',
            'type',
            'billing_frequency',
            'term',
            'stock',
            'vendor_name',
            'vendor_price',
            'product_condition',
            'url',
            'image_url',
            'margin',
            'margin_percentage',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'product_id',
            'margin',
            'margin_percentage',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]

    def validate_price(self, value):
        """Validate price is positive"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_unit_cost(self, value):
        """Validate unit cost is positive if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Unit cost cannot be negative.")
        return value

    def validate_current_price(self, value):
        """Validate current price is positive if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Current price cannot be negative.")
        return value

    def validate_vendor_price(self, value):
        """Validate vendor price is positive if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Vendor price cannot be negative.")
        return value

    def validate_stock(self, value):
        """Validate stock is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value

    def validate_sku(self, value):
        """Validate SKU uniqueness within tenant"""
        if value:
            # Schema isolation handles tenant uniqueness automatically
            existing = Product.objects.filter(
                sku=value
            ).exclude(pk=self.instance.pk if self.instance else None)

            if existing.exists():
                raise serializers.ValidationError("A product with this SKU already exists.")
        return value


class ProductListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for product lists
    """
    margin = serializers.ReadOnlyField()

    class Meta:
        model = Product
        fields = [
            'product_id',
            'name',
            'sku',
            'manufacturer',
            'category',
            'part_number',
            'unit',
            'price',
            'current_price',
            'unit_cost',
            'type',
            'billing_frequency',
            'stock',
            'vendor_name',
            'product_condition',
            'margin',
            'created_at',
            'updated_at',
        ]


class ProductCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating products
    """
    class Meta:
        model = Product
        fields = [
            'name',
            'sku',
            'description',
            'manufacturer',
            'category',
            'part_number',
            'unit',
            'price',
            'current_price',
            'unit_cost',
            'type',
            'billing_frequency',
            'term',
            'stock',
            'vendor_name',
            'vendor_price',
            'product_condition',
            'url',
            'image_url',
        ]

    def validate_price(self, value):
        """Validate price is positive"""
        if value < 0:
            raise serializers.ValidationError("Price cannot be negative.")
        return value

    def validate_unit_cost(self, value):
        """Validate unit cost is positive if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Unit cost cannot be negative.")
        return value

    def validate_current_price(self, value):
        """Validate current price is positive if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Current price cannot be negative.")
        return value

    def validate_vendor_price(self, value):
        """Validate vendor price is positive if provided"""
        if value is not None and value < 0:
            raise serializers.ValidationError("Vendor price cannot be negative.")
        return value

    def validate_stock(self, value):
        """Validate stock is non-negative"""
        if value < 0:
            raise serializers.ValidationError("Stock cannot be negative.")
        return value
