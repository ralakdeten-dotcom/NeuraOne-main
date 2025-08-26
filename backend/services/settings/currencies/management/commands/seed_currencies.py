from django.core.management.base import BaseCommand
from django.db import transaction
from django_tenants.utils import schema_context, get_tenant_model
from services.settings.currencies.models import Currency


class Command(BaseCommand):
    help = 'Seed default currencies for all tenants'

    CURRENCIES = [
        {
            'currency_code': 'GBP',
            'currency_symbol': '£',
            'currency_name': 'GBP- Pound Sterling',
            'price_precision': 2,
            'currency_format': '1,234,567.89',
            'is_base_currency': True,  # GBP as default base currency
        },
        {
            'currency_code': 'USD',
            'currency_symbol': '$',
            'currency_name': 'USD- United States Dollar',
            'price_precision': 2,
            'currency_format': '1,234,567.89',
            'is_base_currency': False,
        },
        {
            'currency_code': 'EUR',
            'currency_symbol': '€',
            'currency_name': 'EUR- Euro',
            'price_precision': 2,
            'currency_format': '1.234.567,89',
            'is_base_currency': False,
        },
        {
            'currency_code': 'AED',
            'currency_symbol': 'AED',
            'currency_name': 'AED- UAE Dirham',
            'price_precision': 2,
            'currency_format': '1,234,567.89',
            'is_base_currency': False,
        },
        {
            'currency_code': 'AUD',
            'currency_symbol': '$',
            'currency_name': 'AUD- Australian Dollar',
            'price_precision': 2,
            'currency_format': '1,234,567.89',
            'is_base_currency': False,
        },
        {
            'currency_code': 'CAD',
            'currency_symbol': '$',
            'currency_name': 'CAD- Canadian Dollar',
            'price_precision': 2,
            'currency_format': '1,234,567.89',
            'is_base_currency': False,
        },
        {
            'currency_code': 'CNY',
            'currency_symbol': '¥',
            'currency_name': 'CNY- Chinese Yuan',
            'price_precision': 2,
            'currency_format': '1,234,567.89',
            'is_base_currency': False,
        },
        {
            'currency_code': 'INR',
            'currency_symbol': '₹',
            'currency_name': 'INR- Indian Rupee',
            'price_precision': 2,
            'currency_format': '1,23,45,678.90',  # Indian format
            'is_base_currency': False,
        },
        {
            'currency_code': 'JPY',
            'currency_symbol': '¥',
            'currency_name': 'JPY- Japanese Yen',
            'price_precision': 0,  # JPY doesn't use decimal places
            'currency_format': '1,234,567',
            'is_base_currency': False,
        },
        {
            'currency_code': 'SAR',
            'currency_symbol': 'SAR',
            'currency_name': 'SAR- Saudi Riyal',
            'price_precision': 2,
            'currency_format': '1,234,567.89',
            'is_base_currency': False,
        },
        {
            'currency_code': 'ZAR',
            'currency_symbol': 'R',
            'currency_name': 'ZAR- South African Rand',
            'price_precision': 2,
            'currency_format': '1,234,567.89',
            'is_base_currency': False,
        },
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Specific tenant schema name to seed currencies for',
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force update existing currencies',
        )
        parser.add_argument(
            '--base',
            type=str,
            default='GBP',
            help='Set base currency code (default: GBP)',
        )

    def seed_currencies_for_schema(self, schema_name, force=False, base_currency_code='GBP'):
        """Seed currencies for a specific schema"""
        with schema_context(schema_name):
            with transaction.atomic():
                created_count = 0
                updated_count = 0
                
                # First, ensure only the specified base currency is marked as base
                if force:
                    Currency.objects.update(is_base_currency=False)
                
                for currency_data in self.CURRENCIES:
                    # Prepare currency data
                    currency_data_copy = currency_data.copy()
                    
                    # Set base currency and exchange rate
                    if currency_data_copy['currency_code'] == base_currency_code:
                        currency_data_copy['is_base_currency'] = True
                        currency_data_copy['exchange_rate'] = 1.0
                    else:
                        currency_data_copy['is_base_currency'] = False
                        # Don't set exchange_rate for non-base currencies (will use model default)
                    
                    # Check if currency exists
                    currency, created = Currency.objects.get_or_create(
                        currency_code=currency_data_copy['currency_code'],
                        defaults=currency_data_copy
                    )
                    
                    if created:
                        created_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(
                                f"  ✓ Created {currency.currency_code} - {currency.currency_name}"
                            )
                        )
                    elif force:
                        # Update existing currency if force flag is set
                        for key, value in currency_data_copy.items():
                            if key != 'currency_code':  # Don't update the code itself
                                setattr(currency, key, value)
                        currency.save()
                        updated_count += 1
                        self.stdout.write(
                            self.style.WARNING(
                                f"  ↻ Updated {currency.currency_code} - {currency.currency_name}"
                            )
                        )
                    else:
                        self.stdout.write(
                            f"  - Skipped {currency.currency_code} (already exists)"
                        )
                
                return created_count, updated_count

    def handle(self, *args, **options):
        tenant_schema = options.get('tenant')
        force = options.get('force', False)
        base_currency = options.get('base', 'GBP').upper()
        
        # Validate base currency
        valid_codes = [c['currency_code'] for c in self.CURRENCIES]
        if base_currency not in valid_codes:
            self.stdout.write(
                self.style.ERROR(
                    f"Invalid base currency '{base_currency}'. Valid options: {', '.join(valid_codes)}"
                )
            )
            return
        
        self.stdout.write(self.style.MIGRATE_HEADING('Seeding Currencies...'))
        
        if tenant_schema:
            # Seed for specific tenant
            self.stdout.write(f"\nSeeding currencies for tenant: {tenant_schema}")
            try:
                created, updated = self.seed_currencies_for_schema(
                    tenant_schema, force, base_currency
                )
                self.stdout.write(
                    self.style.SUCCESS(
                        f"\n✓ Completed: {created} created, {updated} updated"
                    )
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"✗ Error seeding tenant {tenant_schema}: {str(e)}")
                )
        else:
            # Seed for all tenants
            TenantModel = get_tenant_model()
            tenants = TenantModel.objects.exclude(schema_name='public')
            
            if not tenants.exists():
                self.stdout.write(
                    self.style.WARNING("No tenants found. Please create tenants first.")
                )
                return
            
            total_created = 0
            total_updated = 0
            
            for tenant in tenants:
                self.stdout.write(f"\nSeeding currencies for tenant: {tenant.schema_name}")
                try:
                    created, updated = self.seed_currencies_for_schema(
                        tenant.schema_name, force, base_currency
                    )
                    total_created += created
                    total_updated += updated
                    self.stdout.write(
                        self.style.SUCCESS(f"  Summary: {created} created, {updated} updated")
                    )
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(
                            f"  ✗ Error seeding tenant {tenant.schema_name}: {str(e)}"
                        )
                    )
            
            self.stdout.write(
                self.style.SUCCESS(
                    f"\n{'=' * 50}\n"
                    f"✓ Total currencies seeded: {total_created} created, {total_updated} updated\n"
                    f"✓ Base currency set to: {base_currency}\n"
                    f"Note: Exchange rates for non-base currencies must be set manually"
                )
            )