from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import PriceBook, PriceBookItem
from services.inventory.items.models import Item


class PriceBookItemSerializer(serializers.ModelSerializer):
    """Serializer for PriceBookItem model"""
    item_name = serializers.CharField(source='item.name', read_only=True)
    item_sku = serializers.CharField(source='item.sku', read_only=True)
    
    class Meta:
        model = PriceBookItem
        fields = [
            'pricebook_item_id', 'item', 'item_name', 'item_sku', 
            'pricebook_rate', 'created_time', 'last_modified_time'
        ]
        read_only_fields = ['pricebook_item_id', 'created_time', 'last_modified_time', 'item_name', 'item_sku']


class PriceBookItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating PriceBookItem"""
    
    class Meta:
        model = PriceBookItem
        fields = ['item', 'pricebook_rate']
    
    def validate_item(self, value):
        """Validate item exists and is active"""
        if not value or value.status != 'active':
            raise serializers.ValidationError("Item must be active.")
        return value
    
    def validate_pricebook_rate(self, value):
        """Validate pricebook rate is positive"""
        if value <= 0:
            raise serializers.ValidationError("Pricebook rate must be greater than zero.")
        return value


class PriceBookListSerializer(serializers.ModelSerializer):
    """Serializer for pricebook list views with all fields needed for frontend transformation"""
    total_items_count = serializers.IntegerField(read_only=True)
    
    class Meta:
        model = PriceBook
        fields = [
            'pricebook_id', 'name', 'description', 'pricebook_type',
            'sales_or_purchase_type', 'status', 'is_default', 
            'currency_id', 'currency_code', 'percentage', 'is_increase', 
            'rounding_type', 'total_items_count', 'created_time', 'last_modified_time'
        ]
        read_only_fields = ['pricebook_id', 'total_items_count', 'created_time', 'last_modified_time']


class PriceBookDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for pricebook views"""
    pricebook_items = PriceBookItemSerializer(many=True, read_only=True)
    total_items_count = serializers.IntegerField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True, default=None)
    
    class Meta:
        model = PriceBook
        fields = '__all__'
        read_only_fields = [
            'pricebook_id', 'created_time', 'last_modified_time',
            'total_items_count', 'created_by_name', 'updated_by_name'
        ]


class PriceBookCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating pricebooks"""
    pricebook_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True,
        help_text='List of items for per-item pricebooks'
    )
    
    class Meta:
        model = PriceBook
        exclude = ['created_by', 'updated_by', 'last_modified_time']
        read_only_fields = ['pricebook_id', 'created_time']
    
    def validate_name(self, value):
        """Validate name uniqueness per tenant"""
        if PriceBook.objects.filter(name=value).exists():
            raise serializers.ValidationError(f"Pricebook with name '{value}' already exists.")
        return value
    
    def validate(self, data):
        """Validate business rules"""
        pricebook_type = data.get('pricebook_type')
        percentage = data.get('percentage')
        pricebook_items = data.get('pricebook_items', [])
        
        # Validate percentage field based on pricebook_type
        if pricebook_type == 'fixed_percentage':
            if percentage is None:
                raise serializers.ValidationError({
                    'percentage': 'Percentage is required when pricebook type is fixed percentage.'
                })
            if percentage <= 0:
                raise serializers.ValidationError({
                    'percentage': 'Percentage must be greater than zero.'
                })
        
        # Validate that percentage is not set for per_item type
        if pricebook_type == 'per_item' and percentage is not None:
            raise serializers.ValidationError({
                'percentage': 'Percentage should not be set when pricebook type is per item.'
            })
        
        # Validate pricebook_items for per_item type
        if pricebook_type == 'per_item':
            if not pricebook_items:
                raise serializers.ValidationError({
                    'pricebook_items': 'At least one item is required for per-item pricebooks.'
                })
            
            # Validate each item
            item_ids = set()
            for item_data in pricebook_items:
                if 'item_id' not in item_data:
                    raise serializers.ValidationError({
                        'pricebook_items': 'Each item must have an item_id.'
                    })
                if 'pricebook_rate' not in item_data:
                    raise serializers.ValidationError({
                        'pricebook_items': 'Each item must have a pricebook_rate.'
                    })
                
                item_id = item_data['item_id']
                if item_id in item_ids:
                    raise serializers.ValidationError({
                        'pricebook_items': 'Duplicate items are not allowed.'
                    })
                item_ids.add(item_id)
                
                # Validate rate
                try:
                    rate = Decimal(str(item_data['pricebook_rate']))
                    if rate <= 0:
                        raise serializers.ValidationError({
                            'pricebook_items': 'Pricebook rate must be greater than zero.'
                        })
                except (ValueError, TypeError):
                    raise serializers.ValidationError({
                        'pricebook_items': 'Invalid pricebook rate format.'
                    })
        
        # Validate that pricebook_items is not set for fixed_percentage type
        if pricebook_type == 'fixed_percentage' and pricebook_items:
            raise serializers.ValidationError({
                'pricebook_items': 'Items should not be provided for fixed percentage pricebooks.'
            })
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create pricebook with related items"""
        # Extract pricebook items data
        pricebook_items_data = validated_data.pop('pricebook_items', [])
        
        # Create the pricebook
        pricebook = PriceBook.objects.create(**validated_data)
        
        # Create pricebook items if provided
        for item_data in pricebook_items_data:
            try:
                item = Item.objects.get(item_id=item_data['item_id'])
                PriceBookItem.objects.create(
                    pricebook=pricebook,
                    item=item,
                    pricebook_rate=Decimal(str(item_data['pricebook_rate']))
                )
            except Item.DoesNotExist:
                # Clean up created pricebook if item doesn't exist
                pricebook.delete()
                raise serializers.ValidationError({
                    'pricebook_items': f"Item with ID {item_data['item_id']} does not exist."
                })
        
        return pricebook


class PriceBookUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating pricebooks"""
    pricebook_items = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True,
        help_text='List of items for per-item pricebooks'
    )
    
    class Meta:
        model = PriceBook
        exclude = ['created_by', 'updated_by', 'created_time', 'last_modified_time']
        read_only_fields = ['pricebook_id']
    
    def validate_name(self, value):
        """Validate name uniqueness (excluding current instance)"""
        if value:
            qs = PriceBook.objects.filter(name=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            
            if qs.exists():
                raise serializers.ValidationError(f"Pricebook with name '{value}' already exists.")
        
        return value
    
    def validate(self, data):
        """Validate business rules"""
        instance = self.instance
        
        # Get current values if not in update data
        pricebook_type = data.get('pricebook_type', instance.pricebook_type if instance else None)
        percentage = data.get('percentage', instance.percentage if instance else None)
        pricebook_items = data.get('pricebook_items', [])
        
        # Validate percentage field based on pricebook_type
        if pricebook_type == 'fixed_percentage':
            if percentage is None:
                raise serializers.ValidationError({
                    'percentage': 'Percentage is required when pricebook type is fixed percentage.'
                })
            if percentage <= 0:
                raise serializers.ValidationError({
                    'percentage': 'Percentage must be greater than zero.'
                })
        
        # Validate that percentage is not set for per_item type
        if pricebook_type == 'per_item' and percentage is not None:
            raise serializers.ValidationError({
                'percentage': 'Percentage should not be set when pricebook type is per item.'
            })
        
        # Validate pricebook_items if provided
        if pricebook_items:
            if pricebook_type != 'per_item':
                raise serializers.ValidationError({
                    'pricebook_items': 'Items can only be provided for per-item pricebooks.'
                })
            
            # Validate each item
            item_ids = set()
            for item_data in pricebook_items:
                if 'item_id' not in item_data:
                    raise serializers.ValidationError({
                        'pricebook_items': 'Each item must have an item_id.'
                    })
                if 'pricebook_rate' not in item_data:
                    raise serializers.ValidationError({
                        'pricebook_items': 'Each item must have a pricebook_rate.'
                    })
                
                item_id = item_data['item_id']
                if item_id in item_ids:
                    raise serializers.ValidationError({
                        'pricebook_items': 'Duplicate items are not allowed.'
                    })
                item_ids.add(item_id)
                
                # Validate rate
                try:
                    rate = Decimal(str(item_data['pricebook_rate']))
                    if rate <= 0:
                        raise serializers.ValidationError({
                            'pricebook_items': 'Pricebook rate must be greater than zero.'
                        })
                except (ValueError, TypeError):
                    raise serializers.ValidationError({
                        'pricebook_items': 'Invalid pricebook rate format.'
                    })
        
        return data
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Update pricebook with related items"""
        # Extract pricebook items data
        pricebook_items_data = validated_data.pop('pricebook_items', None)
        
        # Update pricebook fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update pricebook items if provided
        if pricebook_items_data is not None:
            # Delete existing items
            instance.pricebook_items.all().delete()
            
            # Create new items
            for item_data in pricebook_items_data:
                try:
                    item = Item.objects.get(item_id=item_data['item_id'])
                    PriceBookItem.objects.create(
                        pricebook=instance,
                        item=item,
                        pricebook_rate=Decimal(str(item_data['pricebook_rate']))
                    )
                except Item.DoesNotExist:
                    raise serializers.ValidationError({
                        'pricebook_items': f"Item with ID {item_data['item_id']} does not exist."
                    })
        
        return instance


class ItemPriceCalculationSerializer(serializers.Serializer):
    """Serializer for calculating item prices based on pricebook"""
    item_id = serializers.UUIDField()
    base_price = serializers.DecimalField(max_digits=15, decimal_places=2, required=False)
    
    def validate_item_id(self, value):
        """Validate item exists"""
        try:
            Item.objects.get(item_id=value)
        except Item.DoesNotExist:
            raise serializers.ValidationError("Item does not exist.")
        return value