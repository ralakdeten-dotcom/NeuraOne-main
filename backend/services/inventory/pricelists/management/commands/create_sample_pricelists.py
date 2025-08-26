from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from decimal import Decimal
from services.inventory.pricelists.models import PriceBook, PriceBookItem
from services.inventory.items.models import Item

User = get_user_model()


class Command(BaseCommand):
    help = 'Create sample price lists for testing'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing sample data before creating new ones',
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating sample price lists...'))

        if options['clear']:
            self.stdout.write('Clearing existing sample data...')
            PriceBook.objects.filter(name__startswith='Sample').delete()

        # Get or create a user for created_by field
        user = User.objects.filter(is_staff=True).first()
        if not user:
            user = User.objects.filter(is_active=True).first()

        if not user:
            self.stdout.write(
                self.style.WARNING('No user found to assign as creator. Skipping user assignment.')
            )

        # Sample data for different pricebook types
        sample_pricebooks = [
            {
                'name': 'Sample Retail Markup - 20%',
                'description': 'Standard retail markup for general sales',
                'currency_id': 'USD',
                'currency_code': 'USD',
                'is_increase': True,
                'percentage': 20,
                'pricebook_type': 'fixed_percentage',
                'rounding_type': 'round_to_dollor',
                'sales_or_purchase_type': 'sales',
                'status': 'active',
                'is_default': True
            },
            {
                'name': 'Sample Wholesale Discount - 15%',
                'description': 'Discount for wholesale customers',
                'currency_id': 'USD',
                'currency_code': 'USD',
                'is_increase': False,  # Decrease
                'percentage': 15,
                'pricebook_type': 'fixed_percentage',
                'rounding_type': 'round_to_dollar_minus_01',
                'sales_or_purchase_type': 'sales',
                'status': 'active'
            },
            {
                'name': 'Sample Premium Products',
                'description': 'Custom pricing for premium product line',
                'currency_id': 'USD',
                'currency_code': 'USD',
                'is_increase': True,
                'pricebook_type': 'per_item',
                'sales_or_purchase_type': 'sales',
                'status': 'active'
            },
            {
                'name': 'Sample Supplier Cost Plus',
                'description': 'Purchase pricing with 10% markup from supplier cost',
                'currency_id': 'USD',
                'currency_code': 'USD',
                'is_increase': True,
                'percentage': 10,
                'pricebook_type': 'fixed_percentage',
                'rounding_type': 'no_rounding',
                'sales_or_purchase_type': 'purchases',
                'status': 'active',
                'is_default': True
            },
            {
                'name': 'Sample Black Friday Sale - 30%',
                'description': 'Special promotional pricing for Black Friday',
                'currency_id': 'USD',
                'currency_code': 'USD',
                'is_increase': False,  # Decrease
                'percentage': 30,
                'pricebook_type': 'fixed_percentage',
                'rounding_type': 'round_to_half_dollar',
                'sales_or_purchase_type': 'sales',
                'status': 'inactive'  # Seasonal, currently inactive
            }
        ]

        created_pricebooks = []
        for pricebook_data in sample_pricebooks:
            if user:
                pricebook_data['created_by'] = user
                pricebook_data['updated_by'] = user

            pricebook = PriceBook.objects.create(**pricebook_data)
            created_pricebooks.append(pricebook)
            self.stdout.write(f'  ✅ Created: {pricebook.name}')

        # Create sample per-item pricing
        premium_pricebook = next(
            (pb for pb in created_pricebooks if pb.pricebook_type == 'per_item'), 
            None
        )

        if premium_pricebook:
            # Get some sample items to add custom pricing
            sample_items = Item.objects.filter(status='active')[:3]
            
            if sample_items.exists():
                self.stdout.write(f'Adding sample items to {premium_pricebook.name}...')
                
                for i, item in enumerate(sample_items):
                    # Create varied pricing: some higher, some lower than base rate
                    multipliers = [Decimal('1.25'), Decimal('1.50'), Decimal('0.80')]
                    custom_rate = item.rate * multipliers[i]
                    
                    PriceBookItem.objects.create(
                        pricebook=premium_pricebook,
                        item=item,
                        pricebook_rate=custom_rate
                    )
                    self.stdout.write(
                        f'    ✅ Added {item.name}: ${item.rate} → ${custom_rate}'
                    )
            else:
                self.stdout.write(
                    self.style.WARNING('No active items found to add to per-item pricebook.')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n🎉 Successfully created {len(created_pricebooks)} sample price lists!'
            )
        )
        self.stdout.write('You can now access them via the API endpoints.')

        # Display summary
        self.stdout.write(self.style.SUCCESS('\n📊 Summary:'))
        for pricebook in created_pricebooks:
            ptype = f"{pricebook.pricebook_type}"
            if pricebook.pricebook_type == 'fixed_percentage':
                direction = "+" if pricebook.is_increase else "-"
                ptype += f" ({direction}{pricebook.percentage}%)"
            else:
                item_count = pricebook.pricebook_items.count()
                ptype += f" ({item_count} items)"
                
            status_icon = "🟢" if pricebook.status == 'active' else "🔴"
            default_icon = "⭐" if pricebook.is_default else ""
            
            self.stdout.write(
                f'  {status_icon} {default_icon} {pricebook.name} - {ptype} ({pricebook.sales_or_purchase_type})'
            )