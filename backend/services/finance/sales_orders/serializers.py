from rest_framework import serializers
from django.db import transaction

from .models import SalesOrder, SalesOrderLineItem


class SalesOrderLineItemSerializer(serializers.ModelSerializer):
    """Serializer for SalesOrderLineItem model - read operations"""
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True, allow_null=True)
    product_type = serializers.CharField(source='product.type', read_only=True)

    class Meta:
        model = SalesOrderLineItem
        fields = [
            'line_item_id', 'sales_order', 'product', 'product_name', 'product_sku',
            'product_type', 'description', 'quantity', 'unit_price', 'discount_rate',
            'vat_rate', 'vat_amount', 'line_subtotal', 'line_total', 'sort_order',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['line_item_id', 'vat_amount', 'line_subtotal', 'line_total',
                          'created_at', 'updated_at']


class SalesOrderLineItemCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating/updating SalesOrderLineItem"""
    
    class Meta:
        model = SalesOrderLineItem
        fields = [
            'sales_order', 'product', 'description', 'quantity', 'unit_price',
            'discount_rate', 'vat_rate', 'sort_order'
        ]
        
    def validate_quantity(self, value):
        if value <= 0:
            raise serializers.ValidationError("Quantity must be greater than zero.")
        return value
    
    def validate_unit_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Unit price cannot be negative.")
        return value
    
    def validate_discount_rate(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Discount rate must be between 0 and 100.")
        return value
    
    def validate_vat_rate(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("VAT rate must be between 0 and 100.")
        return value


class SalesOrderSerializer(serializers.ModelSerializer):
    """Serializer for SalesOrder model - full details"""
    line_items = SalesOrderLineItemSerializer(many=True, read_only=True)
    
    # Related field names
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    customer_company = serializers.CharField(source='customer.company', read_only=True, allow_null=True)
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    contact_name = serializers.SerializerMethodField()
    deal_name = serializers.CharField(source='deal.deal_name', read_only=True, allow_null=True)
    owner_name = serializers.SerializerMethodField()
    estimate_number = serializers.CharField(source='estimate.estimate_number', read_only=True, allow_null=True)
    
    # Display fields
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_terms_display = serializers.CharField(source='get_payment_terms_display', read_only=True)
    delivery_method_display = serializers.CharField(source='get_delivery_method_display', read_only=True)
    
    # Computed fields from mixin
    shipping_vat_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    total_fees = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    fees_subtotal = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    
    # Creator/updater names
    created_by_name = serializers.SerializerMethodField()
    updated_by_name = serializers.SerializerMethodField()

    class Meta:
        model = SalesOrder
        fields = '__all__'
        read_only_fields = ['sales_order_id', 'subtotal', 'total_amount', 'created_at', 
                          'updated_at', 'created_by', 'updated_by']

    def get_contact_name(self, obj):
        if obj.contact:
            return f"{obj.contact.first_name} {obj.contact.last_name}".strip()
        return None

    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return None

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}".strip()
        return None

    def get_updated_by_name(self, obj):
        if obj.updated_by:
            return f"{obj.updated_by.first_name} {obj.updated_by.last_name}".strip()
        return None


class SalesOrderListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for listing sales orders"""
    customer_name = serializers.CharField(source='customer.name', read_only=True, allow_null=True)
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    contact_name = serializers.SerializerMethodField()
    deal_name = serializers.CharField(source='deal.deal_name', read_only=True, allow_null=True)
    owner_name = serializers.SerializerMethodField()
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    line_items_count = serializers.IntegerField(source='line_items.count', read_only=True)

    class Meta:
        model = SalesOrder
        fields = [
            'sales_order_id', 'sales_order_number', 'reference_number', 'po_number',
            'status', 'status_display', 'customer_name', 'account_name', 'contact_name',
            'deal_name', 'owner_name', 'subtotal', 'total_amount', 'sales_order_date',
            'expected_shipment_date', 'line_items_count', 'created_at', 'updated_at'
        ]

    def get_contact_name(self, obj):
        if obj.contact:
            return f"{obj.contact.first_name} {obj.contact.last_name}".strip()
        return None

    def get_owner_name(self, obj):
        if obj.owner:
            return f"{obj.owner.first_name} {obj.owner.last_name}".strip()
        return None


class SalesOrderCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new sales order"""
    line_items = SalesOrderLineItemCreateSerializer(many=True, required=False)
    sales_order_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = SalesOrder
        fields = [
            'sales_order_number', 'reference_number', 'po_number', 'status', 'estimate',
            'customer', 'account', 'contact', 'deal', 'owner', 'sales_order_date',
            'expected_shipment_date', 'payment_terms', 'custom_payment_terms',
            'delivery_method', 'custom_delivery_method', 'billing_attention',
            'billing_street', 'billing_city', 'billing_state_province',
            'billing_zip_postal_code', 'billing_country', 'shipping_attention',
            'shipping_street', 'shipping_city', 'shipping_state_province',
            'shipping_zip_postal_code', 'shipping_country', 'shipping_fee',
            'shipping_vat_rate', 'rush_fee', 'customer_notes', 'terms_conditions',
            'internal_notes', 'line_items'
        ]

    def validate_account(self, value):
        if not value:
            raise serializers.ValidationError("Account is required.")
        return value

    def validate(self, data):
        # If custom payment terms selected, ensure custom_payment_terms is provided
        if data.get('payment_terms') == 'custom' and not data.get('custom_payment_terms'):
            raise serializers.ValidationError({
                'custom_payment_terms': 'Custom payment terms description is required when payment terms is set to custom.'
            })
        
        # If custom delivery method selected, ensure custom_delivery_method is provided
        if data.get('delivery_method') == 'custom' and not data.get('custom_delivery_method'):
            raise serializers.ValidationError({
                'custom_delivery_method': 'Custom delivery method description is required when delivery method is set to custom.'
            })
        
        return data

    def create(self, validated_data):
        line_items_data = validated_data.pop('line_items', [])
        
        # Auto-generate sales order number if not provided
        if not validated_data.get('sales_order_number'):
            validated_data['sales_order_number'] = SalesOrder.generate_next_sales_order_number()
        
        with transaction.atomic():
            sales_order = SalesOrder.objects.create(**validated_data)
            
            # Create line items
            for line_item_data in line_items_data:
                line_item_data['sales_order'] = sales_order
                SalesOrderLineItem.objects.create(**line_item_data)
            
            return sales_order

    def update(self, instance, validated_data):
        line_items_data = validated_data.pop('line_items', None)
        
        with transaction.atomic():
            # Update sales order fields
            for attr, value in validated_data.items():
                setattr(instance, attr, value)
            instance.save()
            
            # Update line items if provided
            if line_items_data is not None:
                # Delete existing line items
                instance.line_items.all().delete()
                
                # Create new line items
                for line_item_data in line_items_data:
                    line_item_data['sales_order'] = instance
                    SalesOrderLineItem.objects.create(**line_item_data)
            
            return instance


class SalesOrderSummarySerializer(serializers.Serializer):
    """Serializer for sales order summary statistics"""
    total_sales_orders = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=20, decimal_places=2)
    avg_order_value = serializers.DecimalField(max_digits=20, decimal_places=2)
    orders_by_status = serializers.DictField(child=serializers.DictField())
    orders_pending_shipment = serializers.IntegerField()
    recent_orders = serializers.IntegerField()
    orders_this_month = serializers.IntegerField()
    orders_last_month = serializers.IntegerField()