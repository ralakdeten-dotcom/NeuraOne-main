from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Estimate, EstimateLineItem

User = get_user_model()


class EstimateLineItemSerializer(serializers.ModelSerializer):
    """
    Serializer for EstimateLineItem model with product details
    """
    # Read-only fields for display
    product_name = serializers.CharField(source='product.name', read_only=True)
    product_sku = serializers.CharField(source='product.sku', read_only=True)
    product_type = serializers.CharField(source='product.type', read_only=True)

    # Calculated fields (read-only since they're calculated in model.save())
    line_subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    vat_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    line_total = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    class Meta:
        model = EstimateLineItem
        fields = [
            'line_item_id',
            'estimate',
            'product',
            'product_name',
            'product_sku',
            'product_type',
            'description',
            'quantity',
            'unit_price',
            'discount_rate',
            'vat_rate',
            'vat_amount',
            'line_subtotal',
            'line_total',
            'sort_order',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'line_item_id',
            'product_name',
            'product_sku',
            'product_type',
            'vat_amount',
            'line_subtotal',
            'line_total',
            'created_at',
            'updated_at',
        ]

    def validate_quantity(self, value):
        """Validate quantity is positive"""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be positive.")
        return value

    def validate_unit_price(self, value):
        """Validate unit price is positive"""
        if value < 0:
            raise serializers.ValidationError("Unit price cannot be negative.")
        return value

    def validate_discount_rate(self, value):
        """Validate discount rate is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Discount rate must be between 0 and 100.")
        return value

    def validate_vat_rate(self, value):
        """Validate VAT rate is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("VAT rate must be between 0 and 100.")
        return value

    def validate_sort_order(self, value):
        """Validate sort order is positive"""
        if value < 1:
            raise serializers.ValidationError("Sort order must be positive.")
        return value

    def validate(self, data):
        """Cross-field validation"""
        # If creating a new line item, set default unit_price from product if not provided
        if not self.instance and 'unit_price' not in data and 'product' in data:
            product = data['product']
            # Use current_price if available, otherwise use price
            data['unit_price'] = product.current_price if product.current_price else product.price

        return data


class EstimateLineItemCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating EstimateLineItem
    """
    class Meta:
        model = EstimateLineItem
        fields = [
            'estimate',
            'product',
            'description',
            'quantity',
            'unit_price',
            'discount_rate',
            'vat_rate',
            'sort_order',
        ]

    def validate_quantity(self, value):
        """Validate quantity is positive"""
        if value <= 0:
            raise serializers.ValidationError("Quantity must be positive.")
        return value

    def validate_unit_price(self, value):
        """Validate unit price is positive"""
        if value < 0:
            raise serializers.ValidationError("Unit price cannot be negative.")
        return value

    def validate_discount_rate(self, value):
        """Validate discount rate is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("Discount rate must be between 0 and 100.")
        return value

    def validate_vat_rate(self, value):
        """Validate VAT rate is between 0 and 100"""
        if value < 0 or value > 100:
            raise serializers.ValidationError("VAT rate must be between 0 and 100.")
        return value


class EstimateSerializer(serializers.ModelSerializer):
    """
    Serializer for Estimate model with all fields and nested line items
    """
    # Read-only fields for display
    customer_name = serializers.CharField(source='customer.display_name', read_only=True)
    customer_company = serializers.CharField(source='customer.company_name', read_only=True)
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    contact_name = serializers.SerializerMethodField()
    deal_name = serializers.CharField(source='deal.deal_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    # Nested line items (read-write)
    line_items = EstimateLineItemSerializer(many=True, read_only=True)

    # Calculated fields (read-only since they're calculated from line items)
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    # Status display
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    # Fee fields from mixin (read-write)
    shipping_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0.00)
    shipping_vat_rate = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, default=20.00)
    shipping_vat_amount = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)
    rush_fee = serializers.DecimalField(max_digits=10, decimal_places=2, required=False, default=0.00)

    def get_contact_name(self, obj):
        """Get full name of contact"""
        if obj.contact:
            return f"{obj.contact.first_name} {obj.contact.last_name}".strip()
        return None

    class Meta:
        model = Estimate
        fields = [
            'estimate_id',
            'estimate_number',
            'po_number',
            'status',
            'status_display',
            'customer',
            'customer_name',
            'customer_company',
            'account',
            'account_name',
            'contact',
            'contact_name',
            'deal',
            'deal_name',
            'owner',
            'owner_name',
            'subtotal',
            'total_amount',
            'estimate_date',
            'valid_until',
            'billing_attention',
            'billing_street',
            'billing_city',
            'billing_state_province',
            'billing_zip_postal_code',
            'billing_country',
            'shipping_attention',
            'shipping_street',
            'shipping_city',
            'shipping_state_province',
            'shipping_zip_postal_code',
            'shipping_country',
            'shipping_fee',
            'shipping_vat_rate',
            'shipping_vat_amount',
            'rush_fee',
            'notes',
            'terms_conditions',
            'line_items',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'estimate_id',
            'customer_name',
            'customer_company',
            'account_name',
            'contact_name',
            'deal_name',
            'owner_name',
            'status_display',
            'subtotal',
            'total_amount',
            'shipping_vat_amount',
            'line_items',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]

    def validate_estimate_number(self, value):
        """Validate estimate number uniqueness within tenant"""
        if value:
            # Schema isolation handles tenant uniqueness automatically
            existing = Estimate.objects.filter(
                estimate_number=value
            ).exclude(pk=self.instance.pk if self.instance else None)

            if existing.exists():
                raise serializers.ValidationError("An estimate with this number already exists.")
        return value

    def validate_valid_until(self, value):
        """Validate that valid_until is after estimate_date"""
        estimate_date = self.initial_data.get('estimate_date')
        if not estimate_date and self.instance:
            estimate_date = self.instance.estimate_date

        if estimate_date and value:
            # Handle string date conversion
            if isinstance(estimate_date, str):
                try:
                    from datetime import datetime
                    estimate_date = datetime.strptime(estimate_date, '%Y-%m-%d').date()
                except ValueError:
                    # Skip validation if date format is invalid
                    return value

            if value <= estimate_date:
                raise serializers.ValidationError("Valid until date must be after estimate date.")

        return value

    def validate_contact(self, value):
        """
        Validate that contact belongs to the estimate's account (if both are provided)
        """
        if not value:
            return value

        # Get account from either form data or existing instance
        account = self.initial_data.get('account')
        if not account and self.instance:
            account = self.instance.account

        # Skip validation if no account or contact has no account
        if not account or not value.account:
            return value

        try:
            # Safely extract account ID
            if hasattr(account, 'pk'):
                account_id = account.pk
            elif hasattr(account, 'account_id'):
                account_id = account.account_id
            else:
                account_id = int(account) if account else None

            contact_account_id = value.account.pk if hasattr(value.account, 'pk') else value.account.account_id

            if account_id and contact_account_id and contact_account_id != account_id:
                raise serializers.ValidationError(
                    "Contact must belong to the estimate's account."
                )
        except (ValueError, TypeError, AttributeError):
            # If we can't validate the relationship, skip validation rather than fail
            # This allows the operation to proceed and lets database constraints handle any issues
            pass

        return value

    def validate(self, data):
        """Cross-field validation"""
        # Auto-generate estimate number if not provided
        if not data.get('estimate_number') and not self.instance:
            data['estimate_number'] = Estimate.generate_next_estimate_number()

        return data


class EstimateListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for estimate list views
    """
    customer_name = serializers.CharField(source='customer.display_name', read_only=True)
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    contact_name = serializers.SerializerMethodField()
    deal_name = serializers.CharField(source='deal.deal_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    line_items_count = serializers.SerializerMethodField()

    def get_contact_name(self, obj):
        """Get full name of contact"""
        if obj.contact:
            return f"{obj.contact.first_name} {obj.contact.last_name}".strip()
        return None

    def get_line_items_count(self, obj):
        """Get count of line items"""
        return obj.line_items.count()

    class Meta:
        model = Estimate
        fields = [
            'estimate_id',
            'estimate_number',
            'po_number',
            'status',
            'status_display',
            'customer_name',
            'account_name',
            'contact_name',
            'deal_name',
            'owner_name',
            'subtotal',
            'total_amount',
            'estimate_date',
            'valid_until',
            'line_items_count',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['__all__']


class EstimateCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating estimates
    """
    estimate_number = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Estimate
        fields = [
            'estimate_number',
            'po_number',
            'status',
            'customer',
            'account',
            'contact',
            'deal',
            'owner',
            'estimate_date',
            'valid_until',
            'billing_attention',
            'billing_street',
            'billing_city',
            'billing_state_province',
            'billing_zip_postal_code',
            'billing_country',
            'shipping_attention',
            'shipping_street',
            'shipping_city',
            'shipping_state_province',
            'shipping_zip_postal_code',
            'shipping_country',
            'notes',
            'terms_conditions',
        ]

    def validate_estimate_number(self, value):
        """Validate estimate number uniqueness within tenant"""
        if value:
            existing = Estimate.objects.filter(estimate_number=value)
            if existing.exists():
                raise serializers.ValidationError("An estimate with this number already exists.")
        return value

    def validate_valid_until(self, value):
        """Validate that valid_until is after estimate_date"""
        from datetime import datetime

        estimate_date = self.initial_data.get('estimate_date')

        if estimate_date and value:
            # Parse estimate_date if it's a string
            if isinstance(estimate_date, str):
                try:
                    estimate_date = datetime.strptime(estimate_date, '%Y-%m-%d').date()
                except ValueError:
                    raise serializers.ValidationError("Invalid estimate_date format. Use YYYY-MM-DD.")

            if value <= estimate_date:
                raise serializers.ValidationError("Valid until date must be after estimate date.")

        return value

    def validate_contact(self, value):
        """Validate that contact belongs to the estimate's account (if both are provided)"""
        if value:
            account = self.initial_data.get('account')

            if account and value.account:
                try:
                    account_id = int(account.pk if hasattr(account, 'pk') else account)
                    contact_account_id = int(value.account.pk)

                    if contact_account_id != account_id:
                        raise serializers.ValidationError(
                            "Contact must belong to the estimate's account."
                        )
                except (ValueError, TypeError) as e:
                    raise serializers.ValidationError("Invalid account ID format.") from e
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Auto-generate estimate number if not provided or empty
        if not data.get('estimate_number') or data.get('estimate_number').strip() == '':
            data['estimate_number'] = Estimate.generate_next_estimate_number()

        # Auto-populate addresses from customer if customer is provided and addresses are not
        if 'customer' in data and data['customer']:
            customer = data['customer']

            # Auto-populate billing address if not provided
            if not data.get('billing_street'):
                billing_address = customer.get_billing_address_dict()
                data['billing_attention'] = billing_address.get('attention', '')
                data['billing_street'] = billing_address.get('street', '')
                data['billing_city'] = billing_address.get('city', '')
                data['billing_state_province'] = billing_address.get('state_province', '')
                data['billing_zip_postal_code'] = billing_address.get('zip_postal_code', '')
                data['billing_country'] = billing_address.get('country', '')

            # Auto-populate shipping address if not provided
            if not data.get('shipping_street'):
                shipping_address = customer.get_shipping_address_dict()
                data['shipping_attention'] = shipping_address.get('attention', '')
                data['shipping_street'] = shipping_address.get('street', '')
                data['shipping_city'] = shipping_address.get('city', '')
                data['shipping_state_province'] = shipping_address.get('state_province', '')
                data['shipping_zip_postal_code'] = shipping_address.get('zip_postal_code', '')
                data['shipping_country'] = shipping_address.get('country', '')

            # Auto-populate account from customer if not provided
            if not data.get('account') and customer.account:
                data['account'] = customer.account

            # Auto-populate owner from customer if not provided
            if not data.get('owner') and customer.owner:
                data['owner'] = customer.owner

        return data


class EstimateSummarySerializer(serializers.Serializer):
    """
    Serializer for estimate summary statistics
    """
    total_estimates = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    avg_estimate_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    estimates_by_status = serializers.DictField()
    estimates_expiring_soon = serializers.IntegerField()
    recent_estimates = serializers.IntegerField()
