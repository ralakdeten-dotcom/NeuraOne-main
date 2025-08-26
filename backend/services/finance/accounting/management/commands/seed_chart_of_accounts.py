from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context, get_tenant_model
from services.finance.accounting.models import ChartOfAccount
from decimal import Decimal


class Command(BaseCommand):
    help = 'Seeds default Chart of Accounts for all tenants'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--schema',
            type=str,
            help='Specific schema to seed (optional, defaults to all tenants)',
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing accounts before seeding (use with caution)',
        )
    
    def handle(self, *args, **options):
        schema_name = options.get('schema')
        clear_existing = options.get('clear', False)
        
        if schema_name:
            # Seed specific tenant
            TenantModel = get_tenant_model()
            try:
                tenant = TenantModel.objects.get(schema_name=schema_name)
                self.seed_tenant(tenant, clear_existing)
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully seeded Chart of Accounts for {schema_name}')
                )
            except TenantModel.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f'Tenant with schema {schema_name} does not exist')
                )
        else:
            # Seed all tenants
            TenantModel = get_tenant_model()
            tenants = TenantModel.objects.all()
            
            for tenant in tenants:
                if tenant.schema_name != 'public':
                    try:
                        self.seed_tenant(tenant, clear_existing)
                        self.stdout.write(
                            self.style.SUCCESS(f'Successfully seeded Chart of Accounts for {tenant.schema_name}')
                        )
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'Error seeding {tenant.schema_name}: {str(e)}')
                        )
    
    def seed_tenant(self, tenant, clear_existing=False):
        """Seed chart of accounts for a specific tenant"""
        with schema_context(tenant.schema_name):
            if clear_existing:
                # Only delete user-created accounts, keep system accounts
                ChartOfAccount.objects.filter(is_system_account=False).delete()
                self.stdout.write(f'  Cleared existing user-created accounts for {tenant.schema_name}')
            
            # Check if accounts already exist
            if ChartOfAccount.objects.filter(is_system_account=True).exists():
                self.stdout.write(f'  System accounts already exist for {tenant.schema_name}, skipping...')
                return
            
            # Create default accounts
            accounts_created = 0
            
            # Assets
            assets = [
                {
                    'account_code': '1000',
                    'account_name': 'Cash',
                    'account_type': 'cash',
                    'description': 'Cash and cash equivalents',
                    'is_system_account': True,
                },
                {
                    'account_code': '1100',
                    'account_name': 'Bank Accounts',
                    'account_type': 'bank',
                    'description': 'Bank accounts and deposits',
                    'is_system_account': True,
                },
                {
                    'account_code': '1200',
                    'account_name': 'Accounts Receivable',
                    'account_type': 'accounts_receivable',
                    'description': 'Money owed by customers',
                    'is_system_account': True,
                },
                {
                    'account_code': '1300',
                    'account_name': 'Inventory',
                    'account_type': 'other_current_asset',
                    'description': 'Products and materials in stock',
                    'is_system_account': True,
                },
                {
                    'account_code': '1400',
                    'account_name': 'Prepaid Expenses',
                    'account_type': 'other_current_asset',
                    'description': 'Expenses paid in advance',
                    'is_system_account': True,
                },
                {
                    'account_code': '1500',
                    'account_name': 'Fixed Assets',
                    'account_type': 'fixed_asset',
                    'description': 'Property, equipment, and other fixed assets',
                    'is_system_account': True,
                },
            ]
            
            # Liabilities
            liabilities = [
                {
                    'account_code': '2000',
                    'account_name': 'Accounts Payable',
                    'account_type': 'accounts_payable',
                    'description': 'Money owed to suppliers',
                    'is_system_account': True,
                },
                {
                    'account_code': '2100',
                    'account_name': 'Credit Cards',
                    'account_type': 'credit_card',
                    'description': 'Credit card payables',
                    'is_system_account': True,
                },
                {
                    'account_code': '2200',
                    'account_name': 'Sales Tax Payable',
                    'account_type': 'other_current_liability',
                    'description': 'Sales tax collected but not yet paid',
                    'is_system_account': True,
                },
                {
                    'account_code': '2300',
                    'account_name': 'Loans Payable',
                    'account_type': 'loans_and_borrowing',
                    'description': 'Outstanding loans and borrowings',
                    'is_system_account': True,
                },
                {
                    'account_code': '2400',
                    'account_name': 'Payroll Liabilities',
                    'account_type': 'other_current_liability',
                    'description': 'Payroll taxes and benefits payable',
                    'is_system_account': True,
                },
            ]
            
            # Equity
            equity = [
                {
                    'account_code': '3000',
                    'account_name': "Owner's Equity",
                    'account_type': 'equity',
                    'description': 'Owner investments and equity',
                    'is_system_account': True,
                },
                {
                    'account_code': '3100',
                    'account_name': 'Retained Earnings',
                    'account_type': 'equity',
                    'description': 'Accumulated profits retained in the business',
                    'is_system_account': True,
                },
                {
                    'account_code': '3200',
                    'account_name': 'Common Stock',
                    'account_type': 'equity',
                    'description': 'Common stock issued',
                    'is_system_account': True,
                },
            ]
            
            # Income
            income = [
                {
                    'account_code': '4000',
                    'account_name': 'Sales Revenue',
                    'account_type': 'income',
                    'description': 'Revenue from product sales',
                    'is_system_account': True,
                },
                {
                    'account_code': '4100',
                    'account_name': 'Service Revenue',
                    'account_type': 'income',
                    'description': 'Revenue from services provided',
                    'is_system_account': True,
                },
                {
                    'account_code': '4200',
                    'account_name': 'Other Income',
                    'account_type': 'other_income',
                    'description': 'Miscellaneous income',
                    'is_system_account': True,
                },
                {
                    'account_code': '4300',
                    'account_name': 'Interest Income',
                    'account_type': 'finance_income',
                    'description': 'Interest earned on investments',
                    'is_system_account': True,
                },
            ]
            
            # Expenses
            expenses = [
                {
                    'account_code': '5000',
                    'account_name': 'Cost of Goods Sold',
                    'account_type': 'cost_of_goods_sold',
                    'description': 'Direct costs of products sold',
                    'is_system_account': True,
                },
                {
                    'account_code': '5100',
                    'account_name': 'Salaries & Wages',
                    'account_type': 'employee_benefit_expense',
                    'description': 'Employee salaries and wages',
                    'is_system_account': True,
                },
                {
                    'account_code': '5200',
                    'account_name': 'Rent Expense',
                    'account_type': 'expense',
                    'description': 'Office and facility rent',
                    'is_system_account': True,
                },
                {
                    'account_code': '5300',
                    'account_name': 'Utilities',
                    'account_type': 'expense',
                    'description': 'Electricity, water, gas, and other utilities',
                    'is_system_account': True,
                },
                {
                    'account_code': '5400',
                    'account_name': 'Office Supplies',
                    'account_type': 'expense',
                    'description': 'Office supplies and materials',
                    'is_system_account': True,
                },
                {
                    'account_code': '5500',
                    'account_name': 'Marketing & Advertising',
                    'account_type': 'expense',
                    'description': 'Marketing and advertising expenses',
                    'is_system_account': True,
                },
                {
                    'account_code': '5600',
                    'account_name': 'Insurance',
                    'account_type': 'expense',
                    'description': 'Business insurance premiums',
                    'is_system_account': True,
                },
                {
                    'account_code': '5700',
                    'account_name': 'Professional Fees',
                    'account_type': 'expense',
                    'description': 'Legal, accounting, and consulting fees',
                    'is_system_account': True,
                },
                {
                    'account_code': '5800',
                    'account_name': 'Depreciation Expense',
                    'account_type': 'depreciation_expense',
                    'description': 'Depreciation of fixed assets',
                    'is_system_account': True,
                },
                {
                    'account_code': '5900',
                    'account_name': 'Interest Expense',
                    'account_type': 'finance_expense',
                    'description': 'Interest on loans and credit',
                    'is_system_account': True,
                },
                {
                    'account_code': '6000',
                    'account_name': 'Income Tax Expense',
                    'account_type': 'tax_expense',
                    'description': 'Corporate income tax',
                    'is_system_account': True,
                },
            ]
            
            # Create all accounts
            all_accounts = assets + liabilities + equity + income + expenses
            
            for account_data in all_accounts:
                account, created = ChartOfAccount.objects.get_or_create(
                    account_code=account_data['account_code'],
                    defaults=account_data
                )
                if created:
                    accounts_created += 1
                    self.stdout.write(f"    Created: {account_data['account_code']} - {account_data['account_name']}")
            
            self.stdout.write(f'  Total accounts created: {accounts_created}')
            
            # Create some sub-accounts for better organization
            self._create_sub_accounts(tenant.schema_name)
    
    def _create_sub_accounts(self, schema_name):
        """Create sub-accounts for better organization"""
        with schema_context(schema_name):
            sub_accounts = [
                # Bank sub-accounts
                {
                    'parent_code': '1100',
                    'account_code': '1110',
                    'account_name': 'Checking Account',
                    'account_type': 'bank',
                    'description': 'Primary business checking account',
                },
                {
                    'parent_code': '1100',
                    'account_code': '1120',
                    'account_name': 'Savings Account',
                    'account_type': 'bank',
                    'description': 'Business savings account',
                },
                # Fixed asset sub-accounts
                {
                    'parent_code': '1500',
                    'account_code': '1510',
                    'account_name': 'Equipment',
                    'account_type': 'fixed_asset',
                    'description': 'Office and operational equipment',
                },
                {
                    'parent_code': '1500',
                    'account_code': '1520',
                    'account_name': 'Furniture & Fixtures',
                    'account_type': 'fixed_asset',
                    'description': 'Office furniture and fixtures',
                },
                {
                    'parent_code': '1500',
                    'account_code': '1530',
                    'account_name': 'Vehicles',
                    'account_type': 'fixed_asset',
                    'description': 'Company vehicles',
                },
            ]
            
            for sub_account_data in sub_accounts:
                try:
                    parent_code = sub_account_data.pop('parent_code')
                    parent = ChartOfAccount.objects.get(account_code=parent_code)
                    
                    account, created = ChartOfAccount.objects.get_or_create(
                        account_code=sub_account_data['account_code'],
                        defaults={
                            **sub_account_data,
                            'parent_account': parent,
                            'is_system_account': False,  # Sub-accounts are not system accounts
                            'is_user_created': False,     # But created by seed
                        }
                    )
                    if created:
                        self.stdout.write(
                            f"    Created sub-account: {sub_account_data['account_code']} - {sub_account_data['account_name']}"
                        )
                except ChartOfAccount.DoesNotExist:
                    self.stdout.write(
                        self.style.WARNING(f"    Parent account {parent_code} not found, skipping sub-account")
                    )