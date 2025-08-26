from rest_framework import serializers
from ..models import ChartOfAccount, AccountDocument
from decimal import Decimal


class AccountDocumentSerializer(serializers.ModelSerializer):
    """Serializer for account document attachments"""
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    
    class Meta:
        model = AccountDocument
        fields = [
            'document_id', 'file_name', 'file_path', 
            'uploaded_at', 'uploaded_by', 'uploaded_by_name'
        ]
        read_only_fields = ['document_id', 'uploaded_at', 'uploaded_by']


class ChartOfAccountListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for account listings"""
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    account_category = serializers.CharField(source='get_account_type_category', read_only=True)
    current_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = ChartOfAccount
        fields = [
            'account_id', 'account_code', 'account_name', 'account_type',
            'account_type_display', 'account_category', 'is_active',
            'is_user_created', 'is_system_account', 'is_standalone_account',
            'is_involved_in_transaction', 'current_balance', 'parent_account',
            'parent_account_name', 'depth', 'is_child_present', 'child_count',
            'has_attachment', 'include_in_vat_return', 'created_time', 'last_modified_time'
        ]
    
    def get_current_balance(self, obj):
        """Calculate balance only if requested via context"""
        # Check if balance calculation is requested (from view context)
        if not self.context.get('show_balance', False):
            # Return stored balance for performance
            return str(obj.current_balance)
        
        # Calculate actual balance from transactions
        from django.db.models import Sum
        from ..models import AccountTransaction
        
        transactions = AccountTransaction.objects.filter(
            account=obj,
            transaction_status='posted'
        )
        
        total_debit = transactions.aggregate(total=Sum('debit_amount'))['total'] or Decimal('0.00')
        total_credit = transactions.aggregate(total=Sum('credit_amount'))['total'] or Decimal('0.00')
        
        # Determine balance based on account type
        asset_types = ['cash', 'bank', 'accounts_receivable', 'other_current_asset', 
                      'fixed_asset', 'other_asset', 'intangible_asset', 'right_to_use_asset',
                      'financial_asset', 'contingent_asset', 'contract_asset']
        
        expense_types = ['expense', 'cost_of_goods_sold', 'other_expense', 'manufacturing_expense',
                        'impairment_expense', 'depreciation_expense', 'employee_benefit_expense',
                        'lease_expense', 'finance_expense', 'tax_expense']
        
        if obj.account_type in asset_types or obj.account_type in expense_types:
            balance = total_debit - total_credit
        else:
            balance = total_credit - total_debit
        
        # Add opening balance if present
        if obj.opening_balance:
            if obj.opening_balance_type == 'debit':
                if obj.account_type in asset_types or obj.account_type in expense_types:
                    balance += obj.opening_balance
                else:
                    balance -= obj.opening_balance
            elif obj.opening_balance_type == 'credit':
                if obj.account_type in asset_types or obj.account_type in expense_types:
                    balance -= obj.opening_balance
                else:
                    balance += obj.opening_balance
        
        return str(balance)


class ChartOfAccountDetailSerializer(serializers.ModelSerializer):
    """Detailed serializer for single account view"""
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    account_category = serializers.CharField(source='get_account_type_category', read_only=True)
    documents = AccountDocumentSerializer(many=True, read_only=True)
    parent_account_details = serializers.SerializerMethodField()
    closing_balance = serializers.SerializerMethodField()
    current_balance = serializers.SerializerMethodField()
    
    class Meta:
        model = ChartOfAccount
        fields = '__all__'
        read_only_fields = [
            'account_id', 'parent_account_name', 'depth', 'is_child_present',
            'child_count', 'has_transaction', 'is_involved_in_transaction',
            'has_attachment', 'created_time', 'last_modified_time'
        ]
    
    def get_closing_balance(self, obj):
        """Calculate closing balance from all posted transactions"""
        from django.db.models import Sum
        from ..models import AccountTransaction
        
        # Get all posted transactions for this account
        transactions = AccountTransaction.objects.filter(
            account=obj,
            transaction_status='posted'
        )
        
        # Sum up debits and credits
        total_debit = transactions.aggregate(total=Sum('debit_amount'))['total'] or Decimal('0.00')
        total_credit = transactions.aggregate(total=Sum('credit_amount'))['total'] or Decimal('0.00')
        
        # Determine balance based on account type (following accounting principles)
        # Assets and Expenses have debit normal balances
        # Liabilities, Equity, and Income have credit normal balances
        asset_types = ['cash', 'bank', 'accounts_receivable', 'other_current_asset', 
                      'fixed_asset', 'other_asset', 'intangible_asset', 'right_to_use_asset',
                      'financial_asset', 'contingent_asset', 'contract_asset']
        
        expense_types = ['expense', 'cost_of_goods_sold', 'other_expense', 'manufacturing_expense',
                        'impairment_expense', 'depreciation_expense', 'employee_benefit_expense',
                        'lease_expense', 'finance_expense', 'tax_expense']
        
        if obj.account_type in asset_types or obj.account_type in expense_types:
            # Debit normal balance: Balance = Debit - Credit
            balance = total_debit - total_credit
        else:
            # Credit normal balance: Balance = Credit - Debit
            balance = total_credit - total_debit
        
        # Add opening balance if present
        if obj.opening_balance:
            if obj.opening_balance_type == 'debit':
                if obj.account_type in asset_types or obj.account_type in expense_types:
                    balance += obj.opening_balance
                else:
                    balance -= obj.opening_balance
            elif obj.opening_balance_type == 'credit':
                if obj.account_type in asset_types or obj.account_type in expense_types:
                    balance -= obj.opening_balance
                else:
                    balance += obj.opening_balance
        
        return str(balance)
    
    def get_current_balance(self, obj):
        """Return the same as closing_balance for consistency"""
        return self.get_closing_balance(obj)
    
    def get_parent_account_details(self, obj):
        if obj.parent_account:
            return {
                'account_id': obj.parent_account.account_id,
                'account_code': obj.parent_account.account_code,
                'account_name': obj.parent_account.account_name,
                'account_type': obj.parent_account.account_type
            }
        return None


class ChartOfAccountCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new accounts"""
    
    class Meta:
        model = ChartOfAccount
        fields = [
            'account_name', 'account_code', 'account_type', 'currency_id',
            'currency_code', 'description', 'parent_account', 'show_on_dashboard',
            'include_in_vat_return', 'can_show_in_ze', 'bank_account_number',
            'opening_balance', 'opening_balance_date', 'opening_balance_type'
        ]
    
    def validate_account_code(self, value):
        """Ensure account code is unique within tenant"""
        if value:
            # Check if account code already exists (tenant isolation handled by model)
            if ChartOfAccount.objects.filter(account_code=value).exists():
                raise serializers.ValidationError(
                    f"Account code '{value}' already exists in this organization."
                )
        return value
    
    def validate_parent_account(self, value):
        """Validate parent account compatibility"""
        if value:
            # Check if parent account type is compatible
            if value.account_type == 'equity' and self.initial_data.get('account_type') != 'equity':
                raise serializers.ValidationError(
                    "Non-equity accounts cannot have equity accounts as parents."
                )
            
            # Prevent circular references
            if value.account_id == self.instance.account_id if self.instance else False:
                raise serializers.ValidationError(
                    "An account cannot be its own parent."
                )
        return value
    
    def validate(self, data):
        """Cross-field validation"""
        # Validate opening balance fields
        if data.get('opening_balance') and data.get('opening_balance') != Decimal('0.00'):
            if not data.get('opening_balance_date'):
                raise serializers.ValidationError({
                    'opening_balance_date': 'Opening balance date is required when opening balance is provided.'
                })
            if not data.get('opening_balance_type'):
                raise serializers.ValidationError({
                    'opening_balance_type': 'Opening balance type (debit/credit) is required when opening balance is provided.'
                })
        
        # Bank account number only for bank accounts
        if data.get('bank_account_number') and data.get('account_type') not in ['bank', 'credit_card']:
            raise serializers.ValidationError({
                'bank_account_number': 'Bank account number can only be set for bank or credit card accounts.'
            })
        
        return data


class ChartOfAccountUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating accounts with restrictions"""
    
    class Meta:
        model = ChartOfAccount
        fields = [
            'account_name', 'account_code', 'account_type', 'description', 'currency_id',
            'currency_code', 'parent_account', 'show_on_dashboard',
            'include_in_vat_return', 'can_show_in_ze', 'bank_account_number',
            'is_active'
        ]
    
    def validate_account_code(self, value):
        """Ensure account code is unique within tenant, excluding current instance"""
        if value and self.instance:
            # Check if account code already exists (excluding current instance)
            existing = ChartOfAccount.objects.filter(account_code=value).exclude(pk=self.instance.pk)
            if existing.exists():
                raise serializers.ValidationError(
                    f"Account code '{value}' already exists in this organization."
                )
        return value
    
    def validate(self, data):
        """Validate update restrictions"""
        if self.instance:
            # Prevent modification of system accounts
            if self.instance.is_system_account:
                allowed_fields = ['description', 'show_on_dashboard']
                for field in data:
                    if field not in allowed_fields:
                        raise serializers.ValidationError(
                            f"System accounts can only update: {', '.join(allowed_fields)}"
                        )
            
            # Validate account type change with restrictions
            if 'account_type' in data and data['account_type'] != self.instance.account_type:
                new_type = data['account_type']
                
                # Prevent type change if account has transactions
                if self.instance.has_transaction or self.instance.is_involved_in_transaction:
                    raise serializers.ValidationError({
                        'account_type': 'Cannot change account type for accounts with existing transactions.'
                    })
                
                # Prevent type change if account has child accounts
                if self.instance.is_child_present:
                    raise serializers.ValidationError({
                        'account_type': 'Cannot change account type for accounts with child accounts.'
                    })
                
                # Validate type compatibility with parent account
                if self.instance.parent_account:
                    parent_category = self.instance.parent_account.get_account_type_category()
                    
                    # Determine new account category
                    asset_types = ['cash', 'bank', 'accounts_receivable', 'other_current_asset',
                                 'fixed_asset', 'other_asset', 'intangible_asset', 'right_to_use_asset',
                                 'financial_asset', 'contingent_asset', 'contract_asset']
                    liability_types = ['accounts_payable', 'credit_card', 'other_current_liability',
                                      'long_term_liability', 'other_liability', 'contract_liability',
                                      'refund_liability', 'loans_and_borrowing', 'lease_liability',
                                      'employee_benefit_liability', 'contingent_liability', 'financial_liability']
                    income_types = ['income', 'other_income', 'finance_income', 'other_comprehensive_income']
                    expense_types = ['expense', 'cost_of_goods_sold', 'other_expense', 'manufacturing_expense',
                                    'impairment_expense', 'depreciation_expense', 'employee_benefit_expense',
                                    'lease_expense', 'finance_expense', 'tax_expense']
                    
                    if new_type in asset_types:
                        new_category = 'Asset'
                    elif new_type in liability_types:
                        new_category = 'Liability'
                    elif new_type == 'equity':
                        new_category = 'Equity'
                    elif new_type in income_types:
                        new_category = 'Income'
                    elif new_type in expense_types:
                        new_category = 'Expense'
                    else:
                        new_category = 'Other'
                    
                    # Ensure categories match for hierarchical consistency
                    if parent_category != new_category:
                        raise serializers.ValidationError({
                            'account_type': f'Account type must remain within the same category as parent ({parent_category}).'
                        })
                
                # Validate bank account number consistency
                if self.instance.bank_account_number and new_type not in ['bank', 'credit_card']:
                    raise serializers.ValidationError({
                        'account_type': 'Cannot change from bank/credit card type when bank account number is set.'
                    })
            
            # Validate parent account change
            if 'parent_account' in data:
                new_parent = data['parent_account']
                if new_parent:
                    # Check for circular reference
                    descendants = self.instance.get_descendants()
                    if new_parent in descendants:
                        raise serializers.ValidationError({
                            'parent_account': 'Cannot set a descendant as parent (circular reference).'
                        })
            
            # Prevent deactivation if account has transactions
            if 'is_active' in data and not data['is_active']:
                if self.instance.has_transaction:
                    raise serializers.ValidationError({
                        'is_active': 'Cannot deactivate an account with transactions.'
                    })
        
        return data


class AccountTreeSerializer(serializers.ModelSerializer):
    """Serializer for hierarchical account tree structure"""
    children = serializers.SerializerMethodField()
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    
    class Meta:
        model = ChartOfAccount
        fields = [
            'account_id', 'account_code', 'account_name', 'account_type',
            'account_type_display', 'is_active', 'current_balance',
            'depth', 'children'
        ]
    
    def get_children(self, obj):
        """Recursively serialize child accounts"""
        children = obj.children.filter(is_active=True).order_by('account_code', 'account_name')
        return AccountTreeSerializer(children, many=True).data


class ChartOfAccountBalanceSerializer(serializers.ModelSerializer):
    """Serializer for account with balance information"""
    account_type_display = serializers.CharField(source='get_account_type_display', read_only=True)
    account_category = serializers.CharField(source='get_account_type_category', read_only=True)
    
    class Meta:
        model = ChartOfAccount
        fields = [
            'account_id', 'account_code', 'account_name', 'account_type',
            'account_type_display', 'account_category', 'currency_code',
            'opening_balance', 'current_balance', 'closing_balance'
        ]