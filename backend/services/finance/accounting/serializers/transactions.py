from rest_framework import serializers
from ..models import AccountTransaction, ChartOfAccount
from decimal import Decimal
import uuid


class AccountTransactionSerializer(serializers.ModelSerializer):
    """Serializer for transaction listings"""
    account_name = serializers.CharField(source='account.account_name', read_only=True)
    account_code = serializers.CharField(source='account.account_code', read_only=True)
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    transaction_status_display = serializers.CharField(source='get_transaction_status_display', read_only=True)
    amount = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    
    class Meta:
        model = AccountTransaction
        fields = [
            'categorized_transaction_id', 'transaction_id', 'account',
            'account_name', 'account_code', 'transaction_type', 'transaction_type_display',
            'transaction_status', 'transaction_status_display', 'transaction_source',
            'transaction_date', 'entry_number', 'currency_code', 'debit_or_credit',
            'debit_amount', 'credit_amount', 'amount', 'contact_id',
            'payee', 'description', 'reference_number', 'offset_account_name',
            'reconcile_status', 'created_time', 'created_by_name'
        ]
    
    def get_amount(self, obj):
        """Get the transaction amount (debit or credit)"""
        return str(obj.get_amount())


class AccountTransactionDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single transaction view"""
    account_details = serializers.SerializerMethodField()
    transaction_type_display = serializers.CharField(source='get_transaction_type_display', read_only=True)
    transaction_status_display = serializers.CharField(source='get_transaction_status_display', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True, allow_null=True)
    modified_by_name = serializers.CharField(source='modified_by.get_full_name', read_only=True, allow_null=True)
    posted_by_name = serializers.CharField(source='posted_by.get_full_name', read_only=True, allow_null=True)
    reversal_transactions = serializers.SerializerMethodField()
    
    class Meta:
        model = AccountTransaction
        fields = '__all__'
    
    def get_account_details(self, obj):
        """Get account details"""
        return {
            'account_id': obj.account.account_id,
            'account_code': obj.account.account_code,
            'account_name': obj.account.account_name,
            'account_type': obj.account.account_type,
            'account_type_display': obj.account.get_account_type_display()
        }
    
    def get_reversal_transactions(self, obj):
        """Get any reversal transactions"""
        reversals = obj.reversals.all()
        if reversals:
            return AccountTransactionSerializer(reversals, many=True).data
        return []


class AccountTransactionCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating transactions"""
    transaction_id = serializers.CharField(required=False, allow_blank=True)
    
    class Meta:
        model = AccountTransaction
        fields = [
            'transaction_id', 'account', 'transaction_type', 'transaction_status',
            'transaction_source', 'transaction_date', 'entry_number',
            'currency_id', 'currency_code', 'exchange_rate', 'debit_or_credit',
            'debit_amount', 'credit_amount', 'contact_id',
            'payee', 'description', 'reference_number', 'offset_account_name',
            'invoice_id', 'estimate_id', 'sales_order_id', 'payment_id',
            'is_manual_entry'
        ]
    
    def validate_account(self, value):
        """Validate account exists and is active"""
        if not value.is_active:
            raise serializers.ValidationError(
                f"Account '{value.account_name}' is inactive and cannot be used for transactions."
            )
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Auto-generate transaction_id if not provided
        if not data.get('transaction_id'):
            data['transaction_id'] = f"TXN-{uuid.uuid4().hex[:8].upper()}"
        
        # Validate debit/credit amounts based on debit_or_credit field
        debit_or_credit = data.get('debit_or_credit')
        debit_amount = data.get('debit_amount', Decimal('0.00'))
        credit_amount = data.get('credit_amount', Decimal('0.00'))
        
        if debit_or_credit == 'debit':
            if debit_amount <= Decimal('0.00'):
                raise serializers.ValidationError({
                    'debit_amount': 'Debit amount must be greater than zero for debit transactions.'
                })
            if credit_amount != Decimal('0.00'):
                raise serializers.ValidationError({
                    'credit_amount': 'Credit amount must be zero for debit transactions.'
                })
        elif debit_or_credit == 'credit':
            if credit_amount <= Decimal('0.00'):
                raise serializers.ValidationError({
                    'credit_amount': 'Credit amount must be greater than zero for credit transactions.'
                })
            if debit_amount != Decimal('0.00'):
                raise serializers.ValidationError({
                    'debit_amount': 'Debit amount must be zero for credit transactions.'
                })
        
        # Validate exchange rate
        if data.get('currency_code') != 'USD' and data.get('exchange_rate', Decimal('1.00')) == Decimal('1.00'):
            raise serializers.ValidationError({
                'exchange_rate': 'Exchange rate must be provided for non-USD transactions.'
            })
        
        # Set default transaction source if not provided
        if not data.get('transaction_source'):
            data['transaction_source'] = 'manual' if data.get('is_manual_entry') else 'system'
        
        return data
    
    def create(self, validated_data):
        """Create transaction with user tracking"""
        # Set created_by from context if available
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['created_by'] = request.user
        
        return super().create(validated_data)


class AccountTransactionPostSerializer(serializers.Serializer):
    """Serializer for posting transactions"""
    transaction_ids = serializers.ListField(
        child=serializers.IntegerField(),
        required=True,
        help_text="List of transaction IDs to post"
    )
    
    def validate_transaction_ids(self, value):
        """Validate transactions can be posted"""
        transactions = AccountTransaction.objects.filter(
            categorized_transaction_id__in=value
        )
        
        if transactions.count() != len(value):
            raise serializers.ValidationError(
                "Some transaction IDs are invalid or not found."
            )
        
        # Check if any transactions are already posted
        posted_txns = transactions.filter(transaction_status='posted')
        if posted_txns.exists():
            posted_ids = list(posted_txns.values_list('categorized_transaction_id', flat=True))
            raise serializers.ValidationError(
                f"Transactions {posted_ids} are already posted."
            )
        
        # Check if any transactions are void or cancelled
        invalid_txns = transactions.filter(transaction_status__in=['void', 'cancelled'])
        if invalid_txns.exists():
            invalid_ids = list(invalid_txns.values_list('categorized_transaction_id', flat=True))
            raise serializers.ValidationError(
                f"Transactions {invalid_ids} are void/cancelled and cannot be posted."
            )
        
        return value


class AccountTransactionReversalSerializer(serializers.Serializer):
    """Serializer for creating reversal transactions"""
    transaction_id = serializers.IntegerField(
        required=True,
        help_text="Transaction ID to reverse"
    )
    reversal_date = serializers.DateField(
        required=False,
        help_text="Date for the reversal transaction (defaults to today)"
    )
    reversal_reason = serializers.CharField(
        required=False,
        max_length=500,
        help_text="Reason for reversal"
    )
    
    def validate_transaction_id(self, value):
        """Validate transaction can be reversed"""
        try:
            transaction = AccountTransaction.objects.get(
                categorized_transaction_id=value
            )
        except AccountTransaction.DoesNotExist:
            raise serializers.ValidationError(
                f"Transaction with ID {value} not found."
            )
        
        # Check if transaction is posted
        if transaction.transaction_status != 'posted':
            raise serializers.ValidationError(
                "Only posted transactions can be reversed."
            )
        
        # Check if already reversed
        if transaction.is_reversal:
            raise serializers.ValidationError(
                "Cannot reverse a reversal transaction."
            )
        
        if transaction.reversals.exists():
            raise serializers.ValidationError(
                "This transaction has already been reversed."
            )
        
        self.transaction = transaction
        return value