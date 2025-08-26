from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Invoice, InvoiceLineItem, InvoicePayment

User = get_user_model()


class InvoicePaymentSerializer(serializers.ModelSerializer):
    """
    Serializer for InvoicePayment model
    """
    # Read-only fields for display
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    payment_method_display = serializers.CharField(source='get_payment_method_display', read_only=True)

    class Meta:
        model = InvoicePayment
        fields = [
            'payment_id',
            'invoice',
            'amount',
            'payment_date',
            'payment_method',
            'payment_method_display',
            'reference_number',
            'notes',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
        ]
        read_only_fields = [
            'payment_id',
            'payment_method_display',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
        ]

    def validate_amount(self, value):
        """Validate amount is positive"""
        if value <= 0:
            raise serializers.ValidationError("Payment amount must be positive.")
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Check that payment amount doesn't exceed outstanding balance
        if 'invoice' in data and 'amount' in data:
            invoice = data['invoice']
            payment_amount = data['amount']

            # Calculate remaining balance (considering this is a new payment)
            outstanding_balance = float(invoice.amount_due)

            # If updating an existing payment, add back the old amount
            if self.instance:
                outstanding_balance += float(self.instance.amount)

            # Temporarily allow payments to exceed amount_due to handle fees
            # TODO: Fix backend to include fees in total_amount calculation
            # if payment_amount > outstanding_balance:
            #     raise serializers.ValidationError(
            #         f"Payment amount ({payment_amount}) cannot exceed outstanding balance ({outstanding_balance})."
            #     )

        return data


class InvoiceLineItemSerializer(serializers.ModelSerializer):
    """
    Serializer for InvoiceLineItem model with product details
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
        model = InvoiceLineItem
        fields = [
            'line_item_id',
            'invoice',
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


class InvoiceLineItemCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating InvoiceLineItem
    """
    class Meta:
        model = InvoiceLineItem
        fields = [
            'invoice',
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


class InvoiceSerializer(serializers.ModelSerializer):
    """
    Serializer for Invoice model with all fields and nested line items and payments
    """
    # Read-only fields for display
    customer_name = serializers.CharField(source='customer.name', read_only=True)
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    contact_name = serializers.SerializerMethodField()
    deal_name = serializers.CharField(source='deal.deal_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    estimate_number = serializers.CharField(source='estimate.estimate_number', read_only=True)
    sales_order_number = serializers.CharField(source='sales_order.sales_order_number', read_only=True)

    # Nested line items and payments (read-only for main serializer)
    line_items = InvoiceLineItemSerializer(many=True, read_only=True)
    payments = InvoicePaymentSerializer(many=True, read_only=True)

    # Calculated fields (read-only since they're calculated from line items and payments)
    subtotal = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    total_amount = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    amount_paid = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)
    amount_due = serializers.DecimalField(max_digits=14, decimal_places=2, read_only=True)

    # Status display
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    payment_terms_display = serializers.CharField(source='get_payment_terms_display', read_only=True)

    # Computed fields
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()

    def get_contact_name(self, obj):
        """Get full name of contact"""
        if obj.contact:
            return f"{obj.contact.first_name} {obj.contact.last_name}".strip()
        return None

    def get_is_overdue(self, obj):
        """Check if invoice is overdue"""
        from django.utils import timezone
        return (
            obj.status in ['sent', 'partial'] and
            obj.due_date and
            timezone.now().date() > obj.due_date
        )

    def get_days_overdue(self, obj):
        """Calculate days overdue"""
        from django.utils import timezone
        if obj.due_date and timezone.now().date() > obj.due_date:
            return (timezone.now().date() - obj.due_date).days
        return 0

    class Meta:
        model = Invoice
        fields = [
            'invoice_id',
            'invoice_number',
            'po_number',
            'status',
            'status_display',
            'estimate',
            'estimate_number',
            'sales_order',
            'sales_order_number',
            'customer',
            'customer_name',
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
            'amount_paid',
            'amount_due',
            'invoice_date',
            'due_date',
            'paid_date',
            'payment_terms',
            'payment_terms_display',
            'custom_payment_terms',
            # Billing address fields
            'billing_attention',
            'billing_street',
            'billing_city',
            'billing_state_province',
            'billing_zip_postal_code',
            'billing_country',
            # Shipping address fields
            'shipping_attention',
            'shipping_street',
            'shipping_city',
            'shipping_state_province',
            'shipping_zip_postal_code',
            'shipping_country',
            # Fee fields from DocumentFeesMixin
            'shipping_fee',
            'shipping_vat_rate',
            'rush_fee',
            'notes',
            'terms_conditions',
            'reference_number',
            'line_items',
            'payments',
            'is_overdue',
            'days_overdue',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'invoice_id',
            'account_name',
            'contact_name',
            'deal_name',
            'owner_name',
            'estimate_number',
            'status_display',
            'payment_terms_display',
            'subtotal',
            'total_amount',
            'amount_paid',
            'amount_due',
            'line_items',
            'payments',
            'is_overdue',
            'days_overdue',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]

    def validate_invoice_number(self, value):
        """Validate invoice number uniqueness within tenant"""
        if value:
            # Schema isolation handles tenant uniqueness automatically
            existing = Invoice.objects.filter(
                invoice_number=value
            ).exclude(pk=self.instance.pk if self.instance else None)

            if existing.exists():
                raise serializers.ValidationError("An invoice with this number already exists.")
        return value

    def validate_due_date(self, value):
        """Validate that due_date is after invoice_date"""
        invoice_date = self.initial_data.get('invoice_date')
        if not invoice_date and self.instance:
            invoice_date = self.instance.invoice_date

        if invoice_date and value:
            # Handle string date conversion
            if isinstance(invoice_date, str):
                try:
                    from datetime import datetime
                    invoice_date = datetime.strptime(invoice_date, '%Y-%m-%d').date()
                except ValueError:
                    # Skip validation if date format is invalid
                    return value

            if value < invoice_date:
                raise serializers.ValidationError("Due date cannot be before invoice date.")

        return value

    def validate_contact(self, value):
        """
        Validate that contact belongs to the invoice's account (if both are provided)
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
                    "Contact must belong to the invoice's account."
                )
        except (ValueError, TypeError, AttributeError):
            # If we can't validate the relationship, skip validation rather than fail
            # This allows the operation to proceed and lets database constraints handle any issues
            pass

        return value

    def validate_amount_paid(self, value):
        """Validate amount_paid doesn't exceed total_amount"""
        if value < 0:
            raise serializers.ValidationError("Amount paid cannot be negative.")

        # Get total_amount from form data or existing instance
        total_amount = self.initial_data.get('total_amount')
        if not total_amount and self.instance:
            total_amount = self.instance.total_amount

        if total_amount and value > total_amount:
            raise serializers.ValidationError("Amount paid cannot exceed total amount.")

        return value

    def validate(self, data):
        """Cross-field validation"""
        # Auto-generate invoice number if not provided
        if not data.get('invoice_number') and not self.instance:
            data['invoice_number'] = Invoice.generate_next_invoice_number()

        # Calculate due_date from payment_terms if not provided
        if not data.get('due_date') and data.get('invoice_date') and data.get('payment_terms'):
            from datetime import timedelta
            invoice_date = data['invoice_date']
            payment_terms = data['payment_terms']

            if payment_terms == 'net_15':
                data['due_date'] = invoice_date + timedelta(days=15)
            elif payment_terms == 'net_30':
                data['due_date'] = invoice_date + timedelta(days=30)
            elif payment_terms == 'net_45':
                data['due_date'] = invoice_date + timedelta(days=45)
            elif payment_terms == 'net_60':
                data['due_date'] = invoice_date + timedelta(days=60)
            elif payment_terms == 'due_on_receipt':
                data['due_date'] = invoice_date

        return data


class InvoiceListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for invoice list views
    """
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    contact_name = serializers.SerializerMethodField()
    deal_name = serializers.CharField(source='deal.deal_name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    estimate_number = serializers.CharField(source='estimate.estimate_number', read_only=True)
    line_items_count = serializers.SerializerMethodField()
    payments_count = serializers.SerializerMethodField()
    is_overdue = serializers.SerializerMethodField()
    days_overdue = serializers.SerializerMethodField()

    def get_contact_name(self, obj):
        """Get full name of contact"""
        if obj.contact:
            return f"{obj.contact.first_name} {obj.contact.last_name}".strip()
        return None

    def get_line_items_count(self, obj):
        """Get count of line items"""
        return obj.line_items.count()

    def get_payments_count(self, obj):
        """Get count of payments"""
        return obj.payments.count()

    def get_is_overdue(self, obj):
        """Check if invoice is overdue"""
        from django.utils import timezone
        return (
            obj.status in ['sent', 'partial'] and
            obj.due_date and
            timezone.now().date() > obj.due_date
        )

    def get_days_overdue(self, obj):
        """Calculate days overdue"""
        from django.utils import timezone
        if obj.due_date and timezone.now().date() > obj.due_date:
            return (timezone.now().date() - obj.due_date).days
        return 0

    class Meta:
        model = Invoice
        fields = [
            'invoice_id',
            'invoice_number',
            'po_number',
            'status',
            'status_display',
            'estimate_number',
            'account_name',
            'contact_name',
            'deal_name',
            'owner_name',
            'subtotal',
            'total_amount',
            'amount_paid',
            'amount_due',
            'invoice_date',
            'due_date',
            'paid_date',
            'payment_terms',
            'line_items_count',
            'payments_count',
            'is_overdue',
            'days_overdue',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['__all__']


class InvoiceCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating invoices with line items support
    """
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    line_items = InvoiceLineItemCreateSerializer(many=True, required=False)

    class Meta:
        model = Invoice
        fields = [
            'invoice_number',
            'po_number',
            'status',
            'estimate',
            'sales_order',
            'customer',
            'account',
            'contact',
            'deal',
            'owner',
            'invoice_date',
            'due_date',
            'payment_terms',
            'custom_payment_terms',
            # Billing address fields
            'billing_attention',
            'billing_street',
            'billing_city',
            'billing_state_province',
            'billing_zip_postal_code',
            'billing_country',
            # Shipping address fields
            'shipping_attention',
            'shipping_street',
            'shipping_city',
            'shipping_state_province',
            'shipping_zip_postal_code',
            'shipping_country',
            # Fee fields
            'shipping_fee',
            'shipping_vat_rate',
            'rush_fee',
            'notes',
            'terms_conditions',
            'reference_number',
            'line_items',
        ]

    def validate_invoice_number(self, value):
        """Validate invoice number uniqueness within tenant"""
        if value:
            existing = Invoice.objects.filter(invoice_number=value)
            if existing.exists():
                raise serializers.ValidationError("An invoice with this number already exists.")
        return value

    def validate_due_date(self, value):
        """Validate that due_date is after invoice_date"""
        from datetime import datetime

        invoice_date = self.initial_data.get('invoice_date')

        if invoice_date and value:
            # Parse invoice_date if it's a string
            if isinstance(invoice_date, str):
                try:
                    invoice_date = datetime.strptime(invoice_date, '%Y-%m-%d').date()
                except ValueError as e:
                    raise serializers.ValidationError("Invalid invoice_date format. Use YYYY-MM-DD.") from e

            if value < invoice_date:
                raise serializers.ValidationError("Due date cannot be before invoice date.")

        return value

    def validate_contact(self, value):
        """Validate that contact belongs to the invoice's account (if both are provided)"""
        if value:
            account = self.initial_data.get('account')

            if account and value.account:
                try:
                    account_id = int(account.pk if hasattr(account, 'pk') else account)
                    contact_account_id = int(value.account.pk)

                    if contact_account_id != account_id:
                        raise serializers.ValidationError(
                            "Contact must belong to the invoice's account."
                        )
                except (ValueError, TypeError) as e:
                    raise serializers.ValidationError("Invalid account ID format.") from e
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Auto-generate invoice number if not provided or empty
        if not data.get('invoice_number') or data.get('invoice_number').strip() == '':
            data['invoice_number'] = Invoice.generate_next_invoice_number()

        # Calculate due_date from payment_terms if not provided
        if not data.get('due_date') and data.get('invoice_date') and data.get('payment_terms'):
            from datetime import timedelta
            invoice_date = data['invoice_date']
            payment_terms = data['payment_terms']

            if payment_terms == 'net_15':
                data['due_date'] = invoice_date + timedelta(days=15)
            elif payment_terms == 'net_30':
                data['due_date'] = invoice_date + timedelta(days=30)
            elif payment_terms == 'net_45':
                data['due_date'] = invoice_date + timedelta(days=45)
            elif payment_terms == 'net_60':
                data['due_date'] = invoice_date + timedelta(days=60)
            elif payment_terms == 'due_on_receipt':
                data['due_date'] = invoice_date

        return data

    def create(self, validated_data):
        """
        Create invoice with line items
        """
        # Extract line items from validated data
        line_items_data = validated_data.pop('line_items', [])
        
        # Auto-populate address fields from customer if not provided
        customer = validated_data.get('customer')
        if customer:
            if not validated_data.get('billing_street'):
                validated_data['billing_attention'] = customer.billing_attention
                validated_data['billing_street'] = customer.billing_street
                validated_data['billing_city'] = customer.billing_city
                validated_data['billing_state_province'] = customer.billing_state_province
                validated_data['billing_zip_postal_code'] = customer.billing_zip_postal_code
                validated_data['billing_country'] = customer.billing_country
            
            if not validated_data.get('shipping_street'):
                validated_data['shipping_attention'] = customer.shipping_attention
                validated_data['shipping_street'] = customer.shipping_street
                validated_data['shipping_city'] = customer.shipping_city
                validated_data['shipping_state_province'] = customer.shipping_state_province
                validated_data['shipping_zip_postal_code'] = customer.shipping_zip_postal_code
                validated_data['shipping_country'] = customer.shipping_country
        
        # Create the invoice
        invoice = super().create(validated_data)
        
        # Create line items
        for line_item_data in line_items_data:
            line_item_data['invoice'] = invoice
            InvoiceLineItem.objects.create(**line_item_data)
        
        return invoice


class EstimateToInvoiceSerializer(serializers.Serializer):
    """
    Serializer for converting an estimate to an invoice
    """
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    invoice_date = serializers.DateField()
    due_date = serializers.DateField(required=False)
    payment_terms = serializers.ChoiceField(
        choices=Invoice.PAYMENT_TERMS_CHOICES,
        default='net_30'
    )
    custom_payment_terms = serializers.CharField(required=False, allow_blank=True)
    po_number = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    terms_conditions = serializers.CharField(required=False, allow_blank=True)
    reference_number = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=Invoice.STATUS_CHOICES,
        default='draft'
    )

    def validate_invoice_number(self, value):
        """Validate invoice number uniqueness within tenant"""
        if value:
            existing = Invoice.objects.filter(invoice_number=value)
            if existing.exists():
                raise serializers.ValidationError("An invoice with this number already exists.")
        return value

    def validate_due_date(self, value):
        """Validate that due_date is after invoice_date"""
        if value:
            invoice_date = self.initial_data.get('invoice_date')
            if invoice_date and value < invoice_date:
                raise serializers.ValidationError("Due date cannot be before invoice date.")
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Auto-generate invoice number if not provided
        if not data.get('invoice_number'):
            data['invoice_number'] = Invoice.generate_next_invoice_number()

        # Calculate due_date from payment_terms if not provided
        if not data.get('due_date') and data.get('invoice_date') and data.get('payment_terms'):
            from datetime import timedelta
            invoice_date = data['invoice_date']
            payment_terms = data['payment_terms']

            if payment_terms == 'net_15':
                data['due_date'] = invoice_date + timedelta(days=15)
            elif payment_terms == 'net_30':
                data['due_date'] = invoice_date + timedelta(days=30)
            elif payment_terms == 'net_45':
                data['due_date'] = invoice_date + timedelta(days=45)
            elif payment_terms == 'net_60':
                data['due_date'] = invoice_date + timedelta(days=60)
            elif payment_terms == 'due_on_receipt':
                data['due_date'] = invoice_date
            else:
                # Default to 30 days
                data['due_date'] = invoice_date + timedelta(days=30)

        return data


class SalesOrderToInvoiceSerializer(serializers.Serializer):
    """
    Serializer for converting a sales order to an invoice
    """
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    invoice_date = serializers.DateField()
    due_date = serializers.DateField(required=False)
    payment_terms = serializers.ChoiceField(
        choices=Invoice.PAYMENT_TERMS_CHOICES,
        required=False
    )
    custom_payment_terms = serializers.CharField(required=False, allow_blank=True)
    po_number = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)
    terms_conditions = serializers.CharField(required=False, allow_blank=True)
    reference_number = serializers.CharField(required=False, allow_blank=True)
    status = serializers.ChoiceField(
        choices=Invoice.STATUS_CHOICES,
        default='draft'
    )

    def validate_invoice_number(self, value):
        """Validate invoice number uniqueness within tenant"""
        if value:
            existing = Invoice.objects.filter(invoice_number=value)
            if existing.exists():
                raise serializers.ValidationError("An invoice with this number already exists.")
        return value

    def validate_due_date(self, value):
        """Validate that due_date is after invoice_date"""
        if value:
            invoice_date = self.initial_data.get('invoice_date')
            if invoice_date and value < invoice_date:
                raise serializers.ValidationError("Due date cannot be before invoice date.")
        return value

    def validate(self, data):
        """Cross-field validation"""
        # Auto-generate invoice number if not provided
        if not data.get('invoice_number'):
            data['invoice_number'] = Invoice.generate_next_invoice_number()
        
        # Calculate due_date from payment_terms if not provided
        if not data.get('due_date') and data.get('invoice_date'):
            from datetime import timedelta
            invoice_date = data['invoice_date']
            payment_terms = data.get('payment_terms', 'net_30')
            
            if payment_terms == 'net_15':
                data['due_date'] = invoice_date + timedelta(days=15)
            elif payment_terms == 'net_30':
                data['due_date'] = invoice_date + timedelta(days=30)
            elif payment_terms == 'net_45':
                data['due_date'] = invoice_date + timedelta(days=45)
            elif payment_terms == 'net_60':
                data['due_date'] = invoice_date + timedelta(days=60)
            elif payment_terms == 'due_on_receipt':
                data['due_date'] = invoice_date
            else:
                # Default to 30 days
                data['due_date'] = invoice_date + timedelta(days=30)
        
        return data


class InvoiceSummarySerializer(serializers.Serializer):
    """
    Serializer for invoice summary statistics
    """
    total_invoices = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_paid = serializers.DecimalField(max_digits=14, decimal_places=2)
    total_outstanding = serializers.DecimalField(max_digits=14, decimal_places=2)
    avg_invoice_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    invoices_by_status = serializers.DictField()
    overdue_invoices = serializers.IntegerField()
    overdue_amount = serializers.DecimalField(max_digits=14, decimal_places=2)
    recent_invoices = serializers.IntegerField()
