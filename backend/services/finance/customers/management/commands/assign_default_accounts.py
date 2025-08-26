from django.core.management.base import BaseCommand
from django_tenants.utils import schema_context, get_tenant_model
from services.finance.customers.models import Customer
from services.finance.accounting.models.accounts import ChartOfAccount


class Command(BaseCommand):
    help = 'Assigns default A/R and A/P accounts to existing customers and vendors'

    def handle(self, *args, **options):
        """Assign default accounts to all customers and vendors in all tenants"""
        
        TenantModel = get_tenant_model()
        
        for tenant in TenantModel.objects.exclude(schema_name='public'):
            self.stdout.write(f'\nProcessing tenant: {tenant.schema_name}')
            
            with schema_context(tenant.schema_name):
                # Get default accounts
                ar_account = ChartOfAccount.objects.filter(
                    account_type='accounts_receivable',
                    account_code='1200'
                ).first()
                
                if not ar_account:
                    ar_account = ChartOfAccount.objects.filter(
                        account_type='accounts_receivable'
                    ).first()
                
                ap_account = ChartOfAccount.objects.filter(
                    account_type='accounts_payable',
                    account_code='2000'
                ).first()
                
                if not ap_account:
                    ap_account = ChartOfAccount.objects.filter(
                        account_type='accounts_payable'
                    ).first()
                
                if not ar_account and not ap_account:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  No A/R or A/P accounts found in {tenant.schema_name}'
                        )
                    )
                    continue
                
                # Update customers without receivable account
                if ar_account:
                    customers_updated = Customer.objects.filter(
                        contact_type__in=['customer', 'both'],
                        receivable_account__isnull=True
                    ).update(receivable_account=ar_account)
                    
                    if customers_updated:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  Updated {customers_updated} customers with A/R account: {ar_account.account_name}'
                            )
                        )
                
                # Update vendors without payable account
                if ap_account:
                    vendors_updated = Customer.objects.filter(
                        contact_type__in=['vendor', 'both'],
                        payable_account__isnull=True
                    ).update(payable_account=ap_account)
                    
                    if vendors_updated:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  Updated {vendors_updated} vendors with A/P account: {ap_account.account_name}'
                            )
                        )
                
                # Update 'both' type to have both accounts
                if ar_account and ap_account:
                    both_updated = Customer.objects.filter(
                        contact_type='both'
                    ).update(
                        receivable_account=ar_account,
                        payable_account=ap_account
                    )
                    
                    if both_updated:
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'  Updated {both_updated} customer/vendors with both A/R and A/P accounts'
                            )
                        )
        
        self.stdout.write(
            self.style.SUCCESS('\n✓ Successfully assigned default accounts to all customers and vendors')
        )