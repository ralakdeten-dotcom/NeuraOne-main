from django.core.management.base import BaseCommand
from django.db import transaction
from django_tenants.utils import schema_context
from core.tenants.models import Client
from services.settings.taxes.models import Tax, TaxGroup, TaxGroupTaxes


class Command(BaseCommand):
    help = 'Seed UK default taxes for all tenants'

    def add_arguments(self, parser):
        parser.add_argument(
            '--tenant',
            type=str,
            help='Specific tenant schema name to seed taxes for',
        )

    def handle(self, *args, **options):
        UK_DEFAULT_TAXES = [
            {
                "tax_name": "VAT Standard",
                "tax_percentage": 20.0,
                "tax_type": "tax",
                "is_value_added": True,
                "is_default_tax": True,
                "is_editable": True,
                "country": "United Kingdom",
                "country_code": "UK",
                "description": "UK Standard VAT Rate"
            },
            {
                "tax_name": "VAT Reduced",
                "tax_percentage": 5.0,
                "tax_type": "tax",
                "is_value_added": True,
                "is_editable": True,
                "country": "United Kingdom",
                "country_code": "UK",
                "description": "UK Reduced VAT Rate (applies to some goods and services)"
            },
            {
                "tax_name": "VAT Zero",
                "tax_percentage": 0.0,
                "tax_type": "tax",
                "is_value_added": True,
                "is_editable": True,
                "country": "United Kingdom",
                "country_code": "UK",
                "description": "UK Zero VAT Rate (applies to most food, children's clothes, etc.)"
            },
            {
                "tax_name": "VAT Exempt",
                "tax_percentage": 0.0,
                "tax_type": "tax",
                "is_value_added": False,
                "is_editable": True,
                "country": "United Kingdom",
                "country_code": "UK",
                "description": "VAT Exempt Items (insurance, education, health services, etc.)"
            },
            {
                "tax_name": "No VAT",
                "tax_percentage": 0.0,
                "tax_type": "tax",
                "is_value_added": False,
                "is_editable": True,
                "country": "United Kingdom",
                "country_code": "UK",
                "description": "Items outside the scope of VAT"
            }
        ]

        tenant_schema = options.get('tenant')
        
        if tenant_schema:
            # Seed for specific tenant
            self._seed_taxes_for_tenant(tenant_schema, UK_DEFAULT_TAXES)
        else:
            # Seed for all tenants
            clients = Client.objects.exclude(schema_name='public')
            for client in clients:
                self._seed_taxes_for_tenant(client.schema_name, UK_DEFAULT_TAXES)

    def _seed_taxes_for_tenant(self, schema_name, taxes_data):
        with schema_context(schema_name):
            with transaction.atomic():
                # Check if taxes already exist
                if Tax.objects.exists():
                    self.stdout.write(
                        self.style.WARNING(
                            f'Taxes already exist for tenant {schema_name}. Skipping...'
                        )
                    )
                    return

                created_taxes = []
                for tax_data in taxes_data:
                    tax = Tax.objects.create(**tax_data)
                    created_taxes.append(tax)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'Created tax: {tax.tax_name} ({tax.tax_percentage}%) for tenant {schema_name}'
                        )
                    )

                # Create a sample tax group (VAT Standard + Service Charge)
                if len(created_taxes) >= 2:
                    # Create a tax group with standard VAT
                    tax_group = TaxGroup.objects.create(
                        tax_group_name="Standard VAT Group"
                    )
                    
                    # Add VAT Standard to the group
                    standard_vat = next((t for t in created_taxes if t.tax_name == "VAT Standard"), None)
                    if standard_vat:
                        TaxGroupTaxes.objects.create(
                            tax_group=tax_group,
                            tax=standard_vat
                        )
                        
                        # Update the group percentage
                        tax_group.tax_group_percentage = tax_group.calculate_percentage()
                        tax_group.save()
                        
                        self.stdout.write(
                            self.style.SUCCESS(
                                f'Created tax group: {tax_group.tax_group_name} for tenant {schema_name}'
                            )
                        )

                self.stdout.write(
                    self.style.SUCCESS(
                        f'Successfully seeded UK taxes for tenant {schema_name}'
                    )
                )