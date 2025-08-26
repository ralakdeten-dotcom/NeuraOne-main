from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.db.models import Sum, Count
from core.tenants.admin import tenant_admin_site
from .models import ChartOfAccount, AccountTransaction


class ChartOfAccountAdmin(admin.ModelAdmin):
    """Admin interface for Chart of Accounts"""
    
    list_display = [
        'account_code', 
        'account_name', 
        'account_type_display',
        'parent_account_link',
        'formatted_balance',
        'is_active_display',
        'has_transactions',
        'child_count'
    ]
    
    list_filter = [
        'account_type',
        'is_active',
        'is_system_account',
        'has_transaction',
        'created_time'
    ]
    
    search_fields = [
        'account_name',
        'account_code',
        'description'
    ]
    
    readonly_fields = [
        'account_id',
        'created_time',
        'last_modified_time',
        'has_transaction',
        'is_involved_in_transaction',
        'is_child_present'
    ]
    
    fieldsets = (
        ('Basic Information', {
            'fields': (
                'account_id',
                'account_name',
                'account_code',
                'account_type',
                'description'
            )
        }),
        ('Hierarchy', {
            'fields': (
                'parent_account',
                'is_child_present'
            )
        }),
        ('Financial Details', {
            'fields': (
                'current_balance',
                'currency_code'
            )
        }),
        ('Transaction Settings', {
            'fields': (
                'has_transaction',
                'is_involved_in_transaction',
                'include_in_vat_return',
                'is_standalone_account'
            )
        }),
        ('System Settings', {
            'fields': (
                'is_active',
                'is_system_account',
                'can_show_in_ze',
                'created_time',
                'last_modified_time'
            )
        })
    )
    
    ordering = ['account_code', 'account_name']
    
    def account_type_display(self, obj):
        """Display account type with color coding"""
        colors = {
            'cash': '#10B981',  # green
            'bank': '#3B82F6',  # blue
            'equity': '#8B5CF6',  # purple
            'income': '#22C55E',  # bright green
            'expense': '#EF4444',  # red
            'accounts_receivable': '#06B6D4',  # cyan
            'accounts_payable': '#F59E0B',  # amber
        }
        
        # Get base type for color
        base_type = obj.account_type.split('_')[0] if '_' in obj.account_type else obj.account_type
        color = colors.get(base_type, '#6B7280')  # gray default
        
        return format_html(
            '<span style="color: {}; font-weight: bold;">{}</span>',
            color,
            obj.get_account_type_display()
        )
    account_type_display.short_description = 'Type'
    
    def parent_account_link(self, obj):
        """Create clickable link to parent account"""
        if obj.parent_account:
            url = reverse('tenant_admin:accounting_chartofaccount_change', args=[obj.parent_account.account_id])
            return format_html('<a href="{}">{}</a>', url, obj.parent_account.account_name)
        return '-'
    parent_account_link.short_description = 'Parent Account'
    
    def formatted_balance(self, obj):
        """Format balance with currency symbol"""
        # Default to $ for USD or if no currency code
        symbol = '$' if not obj.currency_code or obj.currency_code == 'USD' else obj.currency_code + ' '
        balance = obj.current_balance or 0
        
        # Color code based on account type and balance
        if obj.account_type in ['expense', 'cost_of_goods_sold'] and balance > 0:
            color = '#EF4444'  # red for expenses
        elif obj.account_type in ['income', 'other_income'] and balance > 0:
            color = '#22C55E'  # green for income
        else:
            color = '#000'
            
        return format_html(
            '<span style="color: {};">{}{}</span>',
            color,
            symbol,
            '{:,.2f}'.format(balance)
        )
    formatted_balance.short_description = 'Balance'
    formatted_balance.admin_order_field = 'current_balance'
    
    def is_active_display(self, obj):
        """Display active status with icon"""
        if obj.is_active:
            return format_html('<span style="color: green;">✓ Active</span>')
        return format_html('<span style="color: red;">✗ Inactive</span>')
    is_active_display.short_description = 'Status'
    is_active_display.admin_order_field = 'is_active'
    
    def has_transactions(self, obj):
        """Show if account has transactions"""
        if obj.has_transaction:
            count = obj.transactions.count()
            return format_html('<span style="color: blue;">{} transactions</span>', count)
        return '-'
    has_transactions.short_description = 'Transactions'
    
    def child_count(self, obj):
        """Count child accounts"""
        count = ChartOfAccount.objects.filter(parent_account=obj).count()
        if count > 0:
            return format_html('<span style="color: purple;">{} children</span>', count)
        return '-'
    child_count.short_description = 'Children'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('parent_account')


class AccountTransactionAdmin(admin.ModelAdmin):
    """Admin interface for Account Transactions"""
    
    list_display = [
        'entry_number',
        'transaction_date',
        'account_link',
        'transaction_type_display',
        'formatted_amount',
        'status_display',
        'description_truncated',
        'is_posted'
    ]
    
    list_filter = [
        'transaction_status',
        'transaction_type',
        'transaction_date',
        'reconcile_status',
        'is_manual_entry',
        'created_time'
    ]
    
    search_fields = [
        'entry_number',
        'transaction_id',
        'description',
        'reference_number',
        'payee'
    ]
    
    readonly_fields = [
        'categorized_transaction_id',
        'transaction_id',
        'created_time',
        'modified_time',
        'created_by',
        'modified_by',
        'posted_time',
        'posted_by',
        'reversal_of',
        'is_reversal'
    ]
    
    fieldsets = (
        ('Transaction Information', {
            'fields': (
                'categorized_transaction_id',
                'transaction_id',
                'entry_number',
                'transaction_type',
                'transaction_status',
                'transaction_source'
            )
        }),
        ('Account & Date', {
            'fields': (
                'account',
                'transaction_date',
                'reference_number'
            )
        }),
        ('Amounts', {
            'fields': (
                'debit_or_credit',
                'debit_amount',
                'credit_amount',
                'currency_code',
                'exchange_rate'
            )
        }),
        ('Details', {
            'fields': (
                'description',
                'payee',
                'offset_account_name'
            )
        }),
        ('Related Entities', {
            'fields': (
                'contact_id',
                'invoice_id',
                'estimate_id',
                'sales_order_id',
                'payment_id'
            ),
            'classes': ('collapse',)
        }),
        ('Reconciliation', {
            'fields': (
                'reconcile_status',
                'is_manual_entry'
            ),
            'classes': ('collapse',)
        }),
        ('Audit Information', {
            'fields': (
                'created_by',
                'created_time',
                'modified_by',
                'modified_time',
                'posted_by',
                'posted_time',
                'is_reversal',
                'reversal_of'
            ),
            'classes': ('collapse',)
        })
    )
    
    date_hierarchy = 'transaction_date'
    ordering = ['-transaction_date', '-created_time']
    
    def account_link(self, obj):
        """Create clickable link to account"""
        if obj.account:
            url = reverse('tenant_admin:accounting_chartofaccount_change', args=[obj.account.account_id])
            return format_html('<a href="{}">{}</a>', url, obj.account.account_name)
        return '-'
    account_link.short_description = 'Account'
    
    def transaction_type_display(self, obj):
        """Display transaction type with color"""
        colors = {
            'deposit': '#10B981',
            'invoice': '#3B82F6',
            'vendor_payment': '#EF4444',
            'customer_payment': '#22C55E',
            'expense': '#F59E0B',
            'journal': '#8B5CF6'
        }
        color = colors.get(obj.transaction_type, '#6B7280')
        
        return format_html(
            '<span style="color: {};">{}</span>',
            color,
            obj.get_transaction_type_display()
        )
    transaction_type_display.short_description = 'Type'
    
    def formatted_amount(self, obj):
        """Format amount with debit/credit indication"""
        if obj.debit_amount > 0:
            return format_html(
                '<span style="color: #059669;">DR ${}</span>',
                '{:,.2f}'.format(obj.debit_amount)
            )
        elif obj.credit_amount > 0:
            return format_html(
                '<span style="color: #DC2626;">CR ${}</span>',
                '{:,.2f}'.format(obj.credit_amount)
            )
        return '-'
    formatted_amount.short_description = 'Amount'
    
    def status_display(self, obj):
        """Display status with color and icon"""
        status_config = {
            'draft': ('📝', '#6B7280'),
            'posted': ('✓', '#10B981'),
            'void': ('✗', '#EF4444'),
            'cancelled': ('⛔', '#991B1B')
        }
        
        icon, color = status_config.get(
            obj.transaction_status, 
            ('?', '#6B7280')
        )
        
        return format_html(
            '<span style="color: {};">{} {}</span>',
            color,
            icon,
            obj.get_transaction_status_display()
        )
    status_display.short_description = 'Status'
    
    def description_truncated(self, obj):
        """Truncate long descriptions"""
        if obj.description:
            return obj.description[:50] + '...' if len(obj.description) > 50 else obj.description
        return '-'
    description_truncated.short_description = 'Description'
    
    def is_posted(self, obj):
        """Show if transaction is posted"""
        return obj.transaction_status == 'posted'
    is_posted.boolean = True
    is_posted.short_description = 'Posted?'
    
    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('account', 'created_by', 'posted_by')
    
    def has_delete_permission(self, request, obj=None):
        """Only allow deletion of draft transactions"""
        if obj and obj.transaction_status != 'draft':
            return False
        return super().has_delete_permission(request, obj)
    
    def get_readonly_fields(self, request, obj=None):
        """Make fields readonly for posted transactions"""
        readonly = list(self.readonly_fields)
        if obj and obj.transaction_status in ['posted', 'void', 'cancelled']:
            # Make all fields readonly for non-draft transactions
            readonly.extend([
                'account', 'transaction_type', 'transaction_date',
                'entry_number', 'debit_or_credit', 'debit_amount',
                'credit_amount', 'description', 'reference_number',
                'payee', 'contact_id'
            ])
        return readonly


# Register models with tenant_admin_site
tenant_admin_site.register(ChartOfAccount, ChartOfAccountAdmin)
tenant_admin_site.register(AccountTransaction, AccountTransactionAdmin)