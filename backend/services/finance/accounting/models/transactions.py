from django.db import models
from django.core.validators import MinValueValidator
from django.conf import settings
from decimal import Decimal
from .accounts import ChartOfAccount


class AccountTransaction(models.Model):
    """
    Transaction entries for Chart of Accounts.
    Tracks all financial transactions affecting account balances.
    """
    
    # Transaction Type Choices (Complete from Zoho API)
    TRANSACTION_TYPE_CHOICES = [
        ('invoice', 'Invoice'),
        ('customer_payment', 'Customer Payment'),
        ('bills', 'Bills'),
        ('vendor_payment', 'Vendor Payment'),
        ('credit_notes', 'Credit Notes'),
        ('creditnote_refund', 'Credit Note Refund'),
        ('expense', 'Expense'),
        ('card_payment', 'Card Payment'),
        ('purchase_or_charges', 'Purchase or Charges'),
        ('journal', 'Journal'),
        ('deposit', 'Deposit'),
        ('refund', 'Refund'),
        ('transfer_fund', 'Transfer Fund'),
        ('base_currency_adjustment', 'Base Currency Adjustment'),
        ('opening_balance', 'Opening Balance'),
        ('sales_without_invoices', 'Sales Without Invoices'),
        ('expense_refund', 'Expense Refund'),
        ('tax_refund', 'Tax Refund'),
        ('receipt_from_initial_debtors', 'Receipt from Initial Debtors'),
        ('owner_contribution', 'Owner Contribution'),
        ('interest_income', 'Interest Income'),
        ('other_income', 'Other Income'),
        ('owner_drawings', 'Owner Drawings'),
        ('payment_to_initial_creditors', 'Payment to Initial Creditors'),
    ]
    
    TRANSACTION_STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('posted', 'Posted'),
        ('void', 'Void'),
        ('cancelled', 'Cancelled'),
    ]
    
    DEBIT_CREDIT_CHOICES = [
        ('debit', 'Debit'),
        ('credit', 'Credit'),
    ]
    
    RECONCILE_STATUS_CHOICES = [
        ('unreconciled', 'Unreconciled'),
        ('reconciled', 'Reconciled'),
        ('partially_reconciled', 'Partially Reconciled'),
    ]
    
    # Primary Fields
    categorized_transaction_id = models.AutoField(primary_key=True)
    transaction_id = models.CharField(
        max_length=50, 
        unique=True,
        help_text="Unique transaction identifier"
    )
    account = models.ForeignKey(
        ChartOfAccount,
        on_delete=models.PROTECT,
        related_name='transactions',
        help_text="Account affected by this transaction"
    )
    
    # Transaction Details
    transaction_type = models.CharField(
        max_length=50,
        choices=TRANSACTION_TYPE_CHOICES,
        db_index=True,
        help_text="Type of transaction"
    )
    transaction_status = models.CharField(
        max_length=20,
        choices=TRANSACTION_STATUS_CHOICES,
        default='draft',
        db_index=True,
        help_text="Current status of the transaction"
    )
    transaction_source = models.CharField(
        max_length=50,
        blank=True,
        help_text="Source system or module that created this transaction"
    )
    transaction_date = models.DateField(
        db_index=True,
        help_text="Date of the transaction"
    )
    entry_number = models.CharField(
        max_length=50,
        db_index=True,
        help_text="Entry reference number (e.g., INV-00004)"
    )
    
    # Financial Details
    currency_id = models.CharField(
        max_length=50,
        default='USD',
        help_text="Currency identifier"
    )
    currency_code = models.CharField(
        max_length=10,
        default='USD',
        help_text="Currency code"
    )
    exchange_rate = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        default=Decimal('1.000000'),
        validators=[MinValueValidator(Decimal('0.000001'))],
        help_text="Exchange rate to base currency"
    )
    debit_or_credit = models.CharField(
        max_length=10,
        choices=DEBIT_CREDIT_CHOICES,
        help_text="Whether this is a debit or credit entry"
    )
    debit_amount = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Debit amount (positive value)"
    )
    credit_amount = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Credit amount (positive value)"
    )
    base_currency_debit_amount = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Debit amount in base currency"
    )
    base_currency_credit_amount = models.DecimalField(
        max_digits=19,
        decimal_places=2,
        default=Decimal('0.00'),
        validators=[MinValueValidator(Decimal('0.00'))],
        help_text="Credit amount in base currency"
    )
    
    # References
    contact_id = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        db_index=True,
        help_text="Reference to FinanceContact.contact_id"
    )
    payee = models.CharField(
        max_length=255,
        blank=True,
        help_text="Payee name"
    )
    description = models.TextField(
        blank=True,
        help_text="Transaction description or notes"
    )
    reference_number = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
        help_text="External reference number"
    )
    offset_account_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Name of the offset account"
    )
    reconcile_status = models.CharField(
        max_length=20,
        choices=RECONCILE_STATUS_CHOICES,
        default='unreconciled',
        blank=True,
        help_text="Bank reconciliation status"
    )
    
    # Related Entity References
    invoice_id = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text="Related invoice ID"
    )
    estimate_id = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text="Related estimate ID"
    )
    sales_order_id = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text="Related sales order ID"
    )
    payment_id = models.CharField(
        max_length=50,
        blank=True,
        db_index=True,
        help_text="Related payment ID"
    )
    
    # Audit Fields
    created_time = models.DateTimeField(
        auto_now_add=True,
        help_text="Transaction creation timestamp"
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_transactions',
        help_text="User who created the transaction"
    )
    modified_time = models.DateTimeField(
        auto_now=True,
        help_text="Last modification timestamp"
    )
    modified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='modified_transactions',
        help_text="User who last modified the transaction"
    )
    posted_time = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the transaction was posted to the ledger"
    )
    posted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='posted_transactions',
        help_text="User who posted the transaction"
    )
    
    # Additional Metadata
    is_manual_entry = models.BooleanField(
        default=False,
        help_text="Whether this was manually entered or auto-generated"
    )
    is_reversal = models.BooleanField(
        default=False,
        help_text="Whether this is a reversal transaction"
    )
    reversal_of = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reversals',
        help_text="Original transaction if this is a reversal"
    )
    
    class Meta:
        db_table = 'finance_account_transactions'
        ordering = ['-transaction_date', '-created_time']
        indexes = [
            models.Index(fields=['transaction_date', 'transaction_type']),
            models.Index(fields=['account', 'transaction_status']),
            models.Index(fields=['contact_id', 'transaction_date']),
            models.Index(fields=['entry_number']),
            models.Index(fields=['reference_number']),
            models.Index(fields=['reconcile_status', 'account']),
        ]
        verbose_name = 'Account Transaction'
        verbose_name_plural = 'Account Transactions'
    
    def __str__(self):
        return f"{self.entry_number} - {self.transaction_type} - {self.transaction_date}"
    
    @property
    def customer_id(self):
        """Returns contact_id for receivable transactions"""
        if self.is_receivable and self.contact_id:
            return self.contact_id
        return None
    
    @property
    def vendor_id(self):
        """Returns contact_id for payable transactions"""
        if self.is_payable and self.contact_id:
            return self.contact_id
        return None
    
    @property
    def is_receivable(self):
        """Check if transaction is a receivable"""
        RECEIVABLE_TYPES = [
            'invoice', 'customer_payment', 'credit_notes',
            'creditnote_refund', 'sales_without_invoices'
        ]
        return self.transaction_type in RECEIVABLE_TYPES
    
    @property
    def is_payable(self):
        """Check if transaction is a payable"""
        PAYABLE_TYPES = [
            'bills', 'vendor_payment', 'expense',
            'card_payment', 'purchase_or_charges'
        ]
        return self.transaction_type in PAYABLE_TYPES
    
    @property
    def contact(self):
        """Get the associated FinanceContact"""
        if self.contact_id:
            from services.finance.customers.models import FinanceContact
            try:
                return FinanceContact.objects.get(contact_id=self.contact_id)
            except FinanceContact.DoesNotExist:
                return None
        return None
    
    def save(self, *args, **kwargs):
        """Override save to ensure data consistency"""
        # Ensure only one amount field is set based on debit_or_credit
        if self.debit_or_credit == 'debit':
            self.credit_amount = Decimal('0.00')
            self.base_currency_credit_amount = Decimal('0.00')
            # Calculate base currency amount
            if self.debit_amount and self.exchange_rate:
                self.base_currency_debit_amount = self.debit_amount * self.exchange_rate
        else:
            self.debit_amount = Decimal('0.00')
            self.base_currency_debit_amount = Decimal('0.00')
            # Calculate base currency amount
            if self.credit_amount and self.exchange_rate:
                self.base_currency_credit_amount = self.credit_amount * self.exchange_rate
        
        # Update account's transaction flags if this is a new transaction
        if not self.pk and self.account:
            self.account.has_transaction = True
            self.account.is_involved_in_transaction = True
            self.account.save(update_fields=['has_transaction', 'is_involved_in_transaction'])
        
        super().save(*args, **kwargs)
    
    def get_amount(self):
        """Get the transaction amount (debit or credit)"""
        return self.debit_amount if self.debit_or_credit == 'debit' else self.credit_amount
    
    def get_base_currency_amount(self):
        """Get the transaction amount in base currency"""
        return self.base_currency_debit_amount if self.debit_or_credit == 'debit' else self.base_currency_credit_amount
    
    def post_transaction(self, user=None):
        """Post the transaction to the ledger"""
        if self.transaction_status != 'posted':
            from django.utils import timezone
            self.transaction_status = 'posted'
            self.posted_time = timezone.now()
            self.posted_by = user
            
            # Update account balance
            amount = self.get_amount()
            if self.debit_or_credit == 'debit':
                self.account.current_balance += amount
            else:
                self.account.current_balance -= amount
            
            self.account.save(update_fields=['current_balance'])
            self.save(update_fields=['transaction_status', 'posted_time', 'posted_by'])
    
    def void_transaction(self, user=None):
        """Void the transaction"""
        if self.transaction_status == 'posted':
            # Reverse the balance update
            amount = self.get_amount()
            if self.debit_or_credit == 'debit':
                self.account.current_balance -= amount
            else:
                self.account.current_balance += amount
            
            self.account.save(update_fields=['current_balance'])
        
        self.transaction_status = 'void'
        self.modified_by = user
        self.save(update_fields=['transaction_status', 'modified_by', 'modified_time'])
    
    def create_reversal(self, user=None):
        """Create a reversal transaction"""
        reversal = AccountTransaction(
            account=self.account,
            transaction_type=self.transaction_type,
            transaction_status='draft',
            transaction_source=self.transaction_source,
            transaction_date=self.transaction_date,
            entry_number=f"REV-{self.entry_number}",
            currency_id=self.currency_id,
            currency_code=self.currency_code,
            exchange_rate=self.exchange_rate,
            # Reverse debit and credit
            debit_or_credit='credit' if self.debit_or_credit == 'debit' else 'debit',
            debit_amount=self.credit_amount,
            credit_amount=self.debit_amount,
            base_currency_debit_amount=self.base_currency_credit_amount,
            base_currency_credit_amount=self.base_currency_debit_amount,
            contact_id=self.contact_id,
            payee=self.payee,
            description=f"Reversal of {self.entry_number}: {self.description}",
            reference_number=self.reference_number,
            is_manual_entry=True,
            is_reversal=True,
            reversal_of=self,
            created_by=user
        )
        reversal.save()
        return reversal