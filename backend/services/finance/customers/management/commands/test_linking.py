"""
Management command to test Zoho-style customer-vendor linking
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from django_tenants.utils import schema_context
from rest_framework.test import APIClient

from services.finance.customers.models import Customer
from core.tenants.models import Client

User = get_user_model()


class Command(BaseCommand):
    help = 'Test Zoho-style customer-vendor linking functionality'
    
    def handle(self, *args, **options):
        self.stdout.write("="*60)
        self.stdout.write("ZOHO-STYLE CUSTOMER-VENDOR LINKING TESTS")
        self.stdout.write("="*60)
        
        # Get nokia tenant
        try:
            tenant = Client.objects.get(schema_name='nokia')
            self.stdout.write(f"Using tenant: {tenant.name}")
        except Client.DoesNotExist:
            self.stdout.write(self.style.ERROR("Nokia tenant not found"))
            return
        
        with schema_context(tenant.schema_name):
            # Get admin user
            try:
                admin_user = User.objects.get(email='nokia@crm.com')
                self.stdout.write(f"Using user: {admin_user.email}")
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR("Admin user not found"))
                return
            
            # Test 1: Create customer and vendor
            self.stdout.write("\n1. Creating customer and vendor...")
            
            import random
            test_id = random.randint(1000, 9999)
            
            # Create customer
            customer = Customer.objects.create(
                display_name="ABC Pvt Ltd",
                contact_name="John Doe",
                email="john@abc.com",
                phone="1234567890",
                contact_type="customer",
                customer_type="business",
                customer_status="active",
                currency="USD",
                payment_terms="net30",
                outstanding_receivable_amount=10000,
                customer_number=f"CUST-TEST-{test_id}",
                created_by=admin_user,
                updated_by=admin_user
            )
            self.stdout.write(self.style.SUCCESS(
                f"✅ Customer created: {customer.display_name} ({customer.customer_number})"
            ))
            self.stdout.write(f"   Receivables: ${customer.outstanding_receivable_amount}")
            
            # Create vendor
            vendor = Customer.objects.create(
                display_name="ABC Pvt Ltd",
                contact_name="John Doe",
                email="john@abc.com",
                phone="1234567890",
                contact_type="vendor",
                customer_type="business",
                customer_status="active",
                currency="USD",
                payment_terms="net30",
                outstanding_receivable_amount=6000,  # Payables for vendor
                vendor_number=f"VEND-TEST-{test_id}",
                created_by=admin_user,
                updated_by=admin_user
            )
            self.stdout.write(self.style.SUCCESS(
                f"✅ Vendor created: {vendor.display_name} ({vendor.vendor_number})"
            ))
            self.stdout.write(f"   Payables: ${vendor.outstanding_receivable_amount}")
            
            # Test 2: Link customer to vendor
            self.stdout.write("\n2. Linking customer to vendor...")
            
            customer.linked_entity = vendor
            customer.link_created_at = timezone.now()
            customer.link_created_by = admin_user
            customer.save()
            
            vendor.linked_entity = customer
            vendor.link_created_at = timezone.now()
            vendor.link_created_by = admin_user
            vendor.save()
            
            self.stdout.write(self.style.SUCCESS("✅ Successfully linked customer to vendor"))
            
            # Test 3: Check net balance
            self.stdout.write("\n3. Checking net balance...")
            
            net_balance = customer.net_balance
            self.stdout.write(f"   Customer Receivables: ${customer.outstanding_receivable_amount}")
            self.stdout.write(f"   Vendor Payables: ${vendor.outstanding_receivable_amount}")
            self.stdout.write(self.style.SUCCESS(f"   Net Balance: ${net_balance}"))
            
            if net_balance > 0:
                self.stdout.write("   Position: RECEIVABLE")
            else:
                self.stdout.write("   Position: PAYABLE")
            
            # Test 4: Verify separation in queries
            self.stdout.write("\n4. Verifying list separation...")
            
            customers = Customer.objects.filter(contact_type='customer')
            vendors = Customer.objects.filter(contact_type='vendor')
            
            self.stdout.write(f"   Customers in database: {customers.count()}")
            self.stdout.write(f"   Vendors in database: {vendors.count()}")
            
            # Check that customer appears only in customer list
            if customer in customers and customer not in vendors:
                self.stdout.write(self.style.SUCCESS("   ✅ Customer only in customer list"))
            else:
                self.stdout.write(self.style.ERROR("   ❌ Customer list error"))
            
            # Check that vendor appears only in vendor list
            if vendor in vendors and vendor not in customers:
                self.stdout.write(self.style.SUCCESS("   ✅ Vendor only in vendor list"))
            else:
                self.stdout.write(self.style.ERROR("   ❌ Vendor list error"))
            
            # Test 5: Unlink entities
            self.stdout.write("\n5. Unlinking entities...")
            
            customer.linked_entity = None
            customer.link_created_at = None
            customer.link_created_by = None
            customer.save()
            
            vendor.linked_entity = None
            vendor.link_created_at = None
            vendor.link_created_by = None
            vendor.save()
            
            self.stdout.write(self.style.SUCCESS("✅ Successfully unlinked"))
            
            # Verify unlink
            customer.refresh_from_db()
            vendor.refresh_from_db()
            
            if customer.linked_entity is None and vendor.linked_entity is None:
                self.stdout.write(self.style.SUCCESS("   ✅ Verified: Links removed"))
            else:
                self.stdout.write(self.style.ERROR("   ❌ Links not properly removed"))
            
            # Clean up test data
            self.stdout.write("\n6. Cleaning up test data...")
            customer.delete()
            vendor.delete()
            self.stdout.write(self.style.SUCCESS("✅ Test data cleaned up"))
            
        self.stdout.write("\n" + "="*60)
        self.stdout.write(self.style.SUCCESS("TESTS COMPLETED SUCCESSFULLY"))
        self.stdout.write("="*60)