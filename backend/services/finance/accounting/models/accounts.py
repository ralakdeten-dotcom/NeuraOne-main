from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.conf import settings
from decimal import Decimal


def get_base_currency_code():
    """Get the base currency code from settings"""
    from services.settings.currencies.models import Currency
    base_currency = Currency.objects.filter(is_base_currency=True).first()
    return base_currency.currency_code if base_currency else 'GBP'


def get_base_currency_id():
    """Get the base currency ID from settings"""
    from services.settings.currencies.models import Currency
    base_currency = Currency.objects.filter(is_base_currency=True).first()
    return base_currency.currency_id if base_currency else 'GBP'


class ChartOfAccount(models.Model):
    """
    Chart of Accounts model based on Zoho Books API specification.
    Provides complete accounting structure with hierarchical support.
    """
    
    # Account Type Choices (Complete from Zoho API)
    ACCOUNT_TYPE_CHOICES = [
        # Assets
        ('cash', 'Cash'),
        ('bank', 'Bank'),
        ('accounts_receivable', 'Accounts Receivable'),
        ('other_current_asset', 'Other Current Asset'),
        ('fixed_asset', 'Fixed Asset'),
        ('other_asset', 'Other Asset'),
        ('intangible_asset', 'Intangible Asset'),
        ('right_to_use_asset', 'Right to Use Asset'),
        ('financial_asset', 'Financial Asset'),
        ('contingent_asset', 'Contingent Asset'),
        ('contract_asset', 'Contract Asset'),
        
        # Liabilities
        ('accounts_payable', 'Accounts Payable'),
        ('credit_card', 'Credit Card'),
        ('other_current_liability', 'Other Current Liability'),
        ('long_term_liability', 'Long Term Liability'),
        ('other_liability', 'Other Liability'),
        ('contract_liability', 'Contract Liability'),
        ('refund_liability', 'Refund Liability'),
        ('loans_and_borrowing', 'Loans and Borrowing'),
        ('lease_liability', 'Lease Liability'),
        ('employee_benefit_liability', 'Employee Benefit Liability'),
        ('contingent_liability', 'Contingent Liability'),
        ('financial_liability', 'Financial Liability'),
        
        # Equity
        ('equity', 'Equity'),
        
        # Income
        ('income', 'Income'),
        ('other_income', 'Other Income'),
        ('finance_income', 'Finance Income'),
        ('other_comprehensive_income', 'Other Comprehensive Income'),
        
        # Expenses
        ('expense', 'Expense'),
        ('cost_of_goods_sold', 'Cost of Goods Sold'),
        ('other_expense', 'Other Expense'),
        ('manufacturing_expense', 'Manufacturing Expense'),
        ('impairment_expense', 'Impairment Expense'),
        ('depreciation_expense', 'Depreciation Expense'),
        ('employee_benefit_expense', 'Employee Benefit Expense'),
        ('lease_expense', 'Lease Expense'),
        ('finance_expense', 'Finance Expense'),
        ('tax_expense', 'Tax Expense'),
    ]
    
    # Core Fields (Required)
    account_id = models.AutoField(primary_key=True)
    account_name = models.CharField(max_length=255, db_index=True)
    account_type = models.CharField(
        max_length=50, 
        choices=ACCOUNT_TYPE_CHOICES,
        db_index=True
    )
    is_active = models.BooleanField(default=True, db_index=True)
    created_time = models.DateTimeField(auto_now_add=True)
    last_modified_time = models.DateTimeField(auto_now=True, db_index=True)
    
    # Account Classification Fields
    account_code = models.CharField(
        max_length=50, 
        blank=True,
        db_index=True,
        help_text="Unique code per tenant for account identification"
    )
    is_user_created = models.BooleanField(default=True)
    is_system_account = models.BooleanField(
        default=False,
        help_text="System accounts cannot be modified or deleted"
    )
    is_standalone_account = models.BooleanField(default=False)
    
    # Hierarchy Fields
    parent_account = models.ForeignKey(
        'self', 
        null=True, 
        blank=True, 
        on_delete=models.PROTECT,
        related_name='children',
        help_text="Parent account for hierarchical structure"
    )
    parent_account_name = models.CharField(
        max_length=255, 
        blank=True, 
        editable=False,
        help_text="Cached parent account name"
    )
    depth = models.IntegerField(
        default=0, 
        editable=False,
        help_text="Depth in account hierarchy (0 for root accounts)"
    )
    is_child_present = models.BooleanField(
        default=False, 
        editable=False,
        help_text="Indicates if this account has child accounts"
    )
    child_count = models.IntegerField(
        default=0, 
        editable=False,
        help_text="Number of direct child accounts"
    )
    
    # Financial Fields
    currency_id = models.CharField(
        max_length=50, 
        default=get_base_currency_id,
        help_text="Currency identifier"
    )
    currency_code = models.CharField(
        max_length=10, 
        default=get_base_currency_code,
        help_text="Currency code (e.g., USD, EUR, GBP)"
    )
    current_balance = models.DecimalField(
        max_digits=19, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('-999999999999999.99'))],
        help_text="Current account balance"
    )
    closing_balance = models.DecimalField(
        max_digits=19, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('-999999999999999.99'))],
        help_text="Closing balance for the period"
    )
    opening_balance = models.DecimalField(
        max_digits=19, 
        decimal_places=2, 
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('-999999999999999.99'))],
        help_text="Opening balance for the account"
    )
    opening_balance_date = models.DateField(
        null=True, 
        blank=True,
        help_text="Date of opening balance"
    )
    opening_balance_type = models.CharField(
        max_length=10,
        choices=[('debit', 'Debit'), ('credit', 'Credit')],
        blank=True,
        help_text="Type of opening balance (debit or credit)"
    )
    
    # Transaction & Usage Fields
    is_involved_in_transaction = models.BooleanField(
        default=False,
        help_text="Indicates if account is used in any transaction"
    )
    has_transaction = models.BooleanField(
        default=False,
        help_text="Indicates if account has transactions"
    )
    has_attachment = models.BooleanField(
        default=False,
        help_text="Indicates if account has attachments"
    )
    
    # Additional Info Fields
    description = models.TextField(
        blank=True,
        help_text="Account description or notes"
    )
    bank_account_number = models.CharField(
        max_length=100, 
        blank=True,
        help_text="Bank account number (for bank accounts)"
    )
    show_on_dashboard = models.BooleanField(
        default=False,
        help_text="Display this account on dashboard"
    )
    include_in_vat_return = models.BooleanField(
        default=False,
        help_text="Include in VAT returns (UK specific)"
    )
    can_show_in_ze = models.BooleanField(
        default=False,
        help_text="Can show in Zoho Expense"
    )
    
    class Meta:
        db_table = 'finance_chart_of_accounts'
        ordering = ['account_code', 'account_name']
        indexes = [
            models.Index(fields=['account_type', 'is_active']),
            models.Index(fields=['parent_account', 'depth']),
            models.Index(fields=['account_code']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['account_code'],
                condition=models.Q(account_code__gt=''),
                name='unique_account_code_per_tenant'
            )
        ]
        verbose_name = 'Chart of Account'
        verbose_name_plural = 'Chart of Accounts'
    
    def __str__(self):
        if self.account_code:
            return f"{self.account_code} - {self.account_name}"
        return self.account_name
    
    def save(self, *args, **kwargs):
        """Override save to update hierarchy metadata"""
        # Prevent circular references
        if self.parent_account and self.parent_account.pk == self.pk:
            raise ValidationError("Account cannot be its own parent")
        
        # Update parent account name cache
        if self.parent_account:
            self.parent_account_name = self.parent_account.account_name
            self.depth = self.parent_account.depth + 1
        else:
            self.parent_account_name = ''
            self.depth = 0
        
        # Check if this is a new account
        is_new = self.pk is None
        
        super().save(*args, **kwargs)
        
        # Update parent's child metadata after save
        if self.parent_account and is_new:
            parent = self.parent_account
            parent.is_child_present = True
            parent.child_count = parent.children.count()
            parent.save(update_fields=['is_child_present', 'child_count'])
    
    def delete(self, *args, **kwargs):
        """Override delete to update parent's child metadata"""
        parent = self.parent_account
        super().delete(*args, **kwargs)
        
        if parent:
            parent.child_count = parent.children.count()
            parent.is_child_present = parent.child_count > 0
            parent.save(update_fields=['is_child_present', 'child_count'])
    
    def get_account_type_category(self):
        """Return the main category of the account type"""
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
        
        if self.account_type in asset_types:
            return 'Asset'
        elif self.account_type in liability_types:
            return 'Liability'
        elif self.account_type == 'equity':
            return 'Equity'
        elif self.account_type in income_types:
            return 'Income'
        elif self.account_type in expense_types:
            return 'Expense'
        return 'Other'
    
    def get_descendants(self):
        """Get all descendant accounts (recursive)"""
        descendants = []
        visited = set()
        
        def _get_descendants_recursive(account):
            if account.account_id in visited:
                # Circular reference detected, skip to prevent infinite recursion
                return
            visited.add(account.account_id)
            
            children = account.children.all()
            for child in children:
                descendants.append(child)
                _get_descendants_recursive(child)
        
        _get_descendants_recursive(self)
        return descendants
    
    def get_ancestors(self):
        """Get all ancestor accounts up to root"""
        ancestors = []
        current = self.parent_account
        while current:
            ancestors.append(current)
            current = current.parent_account
        return ancestors


class AccountDocument(models.Model):
    """Document attachments for Chart of Accounts"""
    
    account = models.ForeignKey(
        ChartOfAccount,
        on_delete=models.CASCADE,
        related_name='documents'
    )
    document_id = models.CharField(max_length=50, unique=True)
    file_name = models.CharField(max_length=255)
    file_path = models.FileField(upload_to='account_documents/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    
    class Meta:
        db_table = 'finance_account_documents'
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.file_name} - {self.account.account_name}"