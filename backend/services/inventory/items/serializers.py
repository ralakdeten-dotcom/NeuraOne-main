from rest_framework import serializers
from django.db import transaction
from decimal import Decimal
from .models import (
    Item, ItemGroup, Location, ItemLocation,
    CustomField, ItemCustomFieldValue
)
from services.finance.accounting.models import ChartOfAccount
from services.finance.customers.models import FinanceContact


class ItemGroupSerializer(serializers.ModelSerializer):
    """Serializer for ItemGroup model"""
    
    class Meta:
        model = ItemGroup
        fields = [
            'group_id', 'group_name', 'brand', 'manufacturer', 'unit',
            'description', 'status', 'source', 'product_type',
            'is_taxable', 'tax_id', 'tax_name', 'tax_percentage', 'tax_type',
            'image_id', 'image_name', 'image_type',
            'created_time', 'last_modified_time'
        ]
        read_only_fields = ['group_id', 'created_time', 'last_modified_time']


class LocationSerializer(serializers.ModelSerializer):
    """Serializer for Location model"""
    address = serializers.SerializerMethodField(read_only=True)
    
    # Address fields for write operations
    attention = serializers.CharField(max_length=255, required=False, allow_blank=True, write_only=True)
    street_address1 = serializers.CharField(max_length=255, required=False, allow_blank=True, write_only=True)
    street_address2 = serializers.CharField(max_length=255, required=False, allow_blank=True, write_only=True)
    city = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    state = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    state_code = serializers.CharField(max_length=10, required=False, allow_blank=True, write_only=True)
    country = serializers.CharField(max_length=100, required=False, allow_blank=True, write_only=True)
    zip = serializers.CharField(max_length=20, required=False, allow_blank=True, write_only=True)
    
    class Meta:
        model = Location
        fields = [
            'location_id', 'location_name', 'type', 'parent_location_id',
            'address', 'attention', 'street_address1', 'street_address2',
            'city', 'state', 'state_code', 'country', 'zip',
            'email', 'phone', 'is_primary', 'status',
            'tax_settings_id', 'autonumbergenerationgroup_id',
            'is_all_users_selected', 'created_time', 'last_modified_time'
        ]
        read_only_fields = ['location_id', 'created_time', 'last_modified_time', 'address']
    
    def get_address(self, obj):
        return obj.address


class ItemLocationSerializer(serializers.ModelSerializer):
    """Serializer for ItemLocation model"""
    location_name = serializers.CharField(source='location.location_name', read_only=True)
    
    class Meta:
        model = ItemLocation
        fields = [
            'id', 'item', 'location', 'location_name',
            'location_stock_on_hand', 'location_available_stock',
            'location_actual_available_stock', 'is_primary'
        ]
        read_only_fields = ['id', 'location_name']


class CustomFieldSerializer(serializers.ModelSerializer):
    """Serializer for CustomField model"""
    
    class Meta:
        model = CustomField
        fields = [
            'customfield_id', 'field_name', 'field_type',
            'field_options', 'is_required', 'display_order'
        ]
        read_only_fields = ['customfield_id']


class ItemCustomFieldValueSerializer(serializers.ModelSerializer):
    """Serializer for ItemCustomFieldValue model"""
    field_name = serializers.CharField(source='custom_field.field_name', read_only=True)
    field_type = serializers.CharField(source='custom_field.field_type', read_only=True)
    
    class Meta:
        model = ItemCustomFieldValue
        fields = [
            'id', 'item', 'custom_field', 'field_name', 'field_type', 'value'
        ]
        read_only_fields = ['id', 'field_name', 'field_type']


class SalesInformationSerializer(serializers.Serializer):
    """Serializer for sales information section"""
    selling_price = serializers.DecimalField(
        source='rate',
        max_digits=15,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    sales_account = serializers.SerializerMethodField()
    sales_description = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
    
    def get_sales_account(self, obj):
        """Return sales account details"""
        if obj.account_id:
            return {
                'account_id': obj.account_id.account_id,
                'account_name': obj.account_id.account_name,
                'account_code': obj.account_id.account_code,
                'account_type': obj.account_id.account_type
            }
        return None


class PurchaseInformationSerializer(serializers.Serializer):
    """Serializer for purchase information section"""
    cost_price = serializers.DecimalField(
        source='purchase_rate',
        max_digits=15,
        decimal_places=2,
        required=False,
        allow_null=True
    )
    purchase_account = serializers.SerializerMethodField()
    purchase_description = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True
    )
    preferred_vendor = serializers.SerializerMethodField()
    
    def get_purchase_account(self, obj):
        """Return purchase account details"""
        if obj.purchase_account_id:
            return {
                'account_id': obj.purchase_account_id.account_id,
                'account_name': obj.purchase_account_id.account_name,
                'account_code': obj.purchase_account_id.account_code,
                'account_type': obj.purchase_account_id.account_type
            }
        return None
    
    def get_preferred_vendor(self, obj):
        """Return preferred vendor details"""
        if obj.vendor_id:
            return {
                'vendor_id': obj.vendor_id.contact_id,
                'vendor_name': obj.vendor_id.display_name,
                'vendor_number': obj.vendor_id.vendor_number,
                'contact_type': obj.vendor_id.contact_type,
                'company_name': obj.vendor_id.company_name
            }
        return None


class ItemListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for item list views"""
    group_name = serializers.CharField(read_only=True)
    vendor_name = serializers.CharField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    class Meta:
        model = Item
        fields = [
            'item_id', 'name', 'sku', 'item_type', 'product_type',
            'rate', 'stock_on_hand', 'status', 'group_name',
            'vendor_name', 'is_low_stock', 'unit', 'reorder_level',
            'mpn', 'weight', 'weight_unit'
        ]
        read_only_fields = ['item_id', 'group_name', 'vendor_name', 'is_low_stock']


class ItemDetailSerializer(serializers.ModelSerializer):
    """Full detail serializer for item views with organized sections"""
    group_name = serializers.CharField(read_only=True)
    vendor_name = serializers.CharField(read_only=True)
    account_name = serializers.CharField(read_only=True)
    purchase_account_name = serializers.CharField(read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)
    
    # Nested sections
    sales_information = serializers.SerializerMethodField()
    purchase_information = serializers.SerializerMethodField()
    
    locations = ItemLocationSerializer(source='item_locations', many=True, read_only=True)
    custom_fields = ItemCustomFieldValueSerializer(source='custom_field_values', many=True, read_only=True)
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, default=None)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True, default=None)
    
    class Meta:
        model = Item
        fields = '__all__'
        read_only_fields = [
            'item_id', 'created_time', 'last_modified_time',
            'group_name', 'vendor_name', 'account_name',
            'purchase_account_name', 'is_low_stock',
            'created_by_name', 'updated_by_name'
        ]
    
    def get_sales_information(self, obj):
        """Get organized sales information"""
        return SalesInformationSerializer(obj).data
    
    def get_purchase_information(self, obj):
        """Get organized purchase information"""
        return PurchaseInformationSerializer(obj).data


class ItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating items"""
    initial_locations = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        write_only=True,
        help_text='List of initial location stock data'
    )
    custom_fields = serializers.DictField(
        required=False,
        write_only=True,
        help_text='Custom field values as key-value pairs'
    )
    
    class Meta:
        model = Item
        exclude = ['created_by', 'updated_by', 'last_modified_time']
        read_only_fields = ['item_id', 'created_time']
    
    def validate_name(self, value):
        """Validate name uniqueness per tenant"""
        if Item.objects.filter(name=value).exists():
            raise serializers.ValidationError(f"Item with name '{value}' already exists.")
        return value
    
    def validate_sku(self, value):
        """Validate SKU uniqueness if provided"""
        if value and Item.objects.filter(sku=value).exists():
            raise serializers.ValidationError(f"Item with SKU '{value}' already exists.")
        return value
    
    def validate(self, data):
        """Validate business rules"""
        # Validate item type rules
        if data.get('group_id') and data.get('item_type') != 'inventory':
            raise serializers.ValidationError({
                'item_type': 'Items with groups must be inventory type.'
            })
        
        if data.get('product_type') == 'service' and data.get('item_type') == 'inventory':
            raise serializers.ValidationError({
                'item_type': 'Service products cannot be inventory type.'
            })
        
        # Note: All sales and purchase fields are optional, including inventory_account_id
        
        return data
    
    @transaction.atomic
    def create(self, validated_data):
        """Create item with related data"""
        # Extract nested data
        initial_locations = validated_data.pop('initial_locations', [])
        custom_fields_data = validated_data.pop('custom_fields', {})
        
        # Set initial stock values
        if validated_data.get('initial_stock'):
            validated_data['stock_on_hand'] = validated_data['initial_stock']
            validated_data['available_stock'] = validated_data['initial_stock']
            validated_data['actual_available_stock'] = validated_data['initial_stock']
        
        # Create the item
        item = Item.objects.create(**validated_data)
        
        # Create location stocks if provided
        for loc_data in initial_locations:
            location_id = loc_data.get('location_id')
            stock = Decimal(str(loc_data.get('stock', 0)))
            is_primary = loc_data.get('is_primary', False)
            
            if location_id:
                ItemLocation.objects.create(
                    item=item,
                    location_id=location_id,
                    location_stock_on_hand=stock,
                    location_available_stock=stock,
                    location_actual_available_stock=stock,
                    is_primary=is_primary
                )
        
        # Create custom field values if provided
        for field_name, value in custom_fields_data.items():
            custom_field = CustomField.objects.filter(field_name=field_name).first()
            if custom_field:
                ItemCustomFieldValue.objects.create(
                    item=item,
                    custom_field=custom_field,
                    value=str(value)
                )
        
        # Update stock levels based on locations
        item.update_stock_levels()
        
        return item


class ItemUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating items"""
    custom_fields = serializers.DictField(
        required=False,
        write_only=True,
        help_text='Custom field values as key-value pairs'
    )
    
    class Meta:
        model = Item
        exclude = ['created_by', 'updated_by', 'created_time', 'last_modified_time']
        read_only_fields = ['item_id']
    
    def validate_sku(self, value):
        """Validate SKU uniqueness (excluding current item)"""
        if value:
            # Check uniqueness excluding current instance
            qs = Item.objects.filter(sku=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            
            if qs.exists():
                raise serializers.ValidationError(f"Item with SKU '{value}' already exists.")
        
        return value
    
    def validate(self, data):
        """Validate business rules"""
        instance = self.instance
        
        # Get current values if not in update data
        group_id = data.get('group_id', instance.group_id if instance else None)
        item_type = data.get('item_type', instance.item_type if instance else None)
        product_type = data.get('product_type', instance.product_type if instance else None)
        
        # Validate item type rules
        if group_id and item_type != 'inventory':
            raise serializers.ValidationError({
                'item_type': 'Items with groups must be inventory type.'
            })
        
        if product_type == 'service' and item_type == 'inventory':
            raise serializers.ValidationError({
                'item_type': 'Service products cannot be inventory type.'
            })
        
        # Note: All sales and purchase fields are optional, including inventory_account_id
        
        return data
    
    @transaction.atomic
    def update(self, instance, validated_data):
        """Update item with related data"""
        # Extract custom fields data
        custom_fields_data = validated_data.pop('custom_fields', {})
        
        # Update item fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        instance.save()
        
        # Update custom field values if provided
        for field_name, value in custom_fields_data.items():
            custom_field = CustomField.objects.filter(field_name=field_name).first()
            if custom_field:
                ItemCustomFieldValue.objects.update_or_create(
                    item=instance,
                    custom_field=custom_field,
                    defaults={'value': str(value)}
                )
        
        return instance


class StockAdjustmentSerializer(serializers.Serializer):
    """Serializer for stock adjustment operations"""
    adjustment_type = serializers.ChoiceField(choices=['increase', 'decrease'])
    quantity = serializers.DecimalField(max_digits=15, decimal_places=3, min_value=Decimal('0.001'))
    reason = serializers.CharField(max_length=255, required=False, allow_blank=True)
    location_id = serializers.UUIDField(required=False, allow_null=True)
    
    def validate(self, data):
        """Validate stock adjustment data"""
        if data.get('location_id'):
            try:
                Location.objects.get(location_id=data['location_id'])
            except Location.DoesNotExist:
                raise serializers.ValidationError({'location_id': 'Invalid location ID.'})
        
        return data