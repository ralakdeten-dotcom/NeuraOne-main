"""
Management command to thoroughly test FinanceContact implementation
Usage: python manage.py test_financecontact
"""

from django.core.management.base import BaseCommand
from django.db import transaction
from django_tenants.utils import schema_context
from decimal import Decimal
from datetime import date
import json


class Command(BaseCommand):
    help = 'Test FinanceContact and unified contact_id implementation'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('FINANCECONTACT IMPLEMENTATION TEST SUITE'))
        self.stdout.write(self.style.SUCCESS('Testing on Nokia tenant'))
        self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
        
        # Run all tests in Nokia schema
        with schema_context('nokia'):
            self.test_financecontact_model()
            self.test_linked_entities()
            self.test_account_transaction()
            self.test_balance_calculations()
            self.test_linked_balance_calculations()
            self.test_transaction_properties()
            self.test_api_compatibility()
            
        self.stdout.write(self.style.SUCCESS('\n' + '='*60))
        self.stdout.write(self.style.SUCCESS('✅ ALL TESTS PASSED SUCCESSFULLY!'))
        self.stdout.write(self.style.SUCCESS('='*60 + '\n'))
    
    def test_financecontact_model(self):
        """Test FinanceContact model creation and operations"""
        from services.finance.customers.models import FinanceContact
        
        self.stdout.write(self.style.WARNING('\nTEST 1: FinanceContact Model Operations'))
        self.stdout.write('-'*40)
        
        # Create a customer contact
        customer = FinanceContact.objects.create(
            contact_type='customer',
            display_name='Nokia Test Customer',
            company_name='Nokia Customer Corp',
            email='customer@nokia-test.com',
            customer_number='CUST-NOKIA-001',
            currency='USD',
            payment_terms='net30'
        )
        self.stdout.write(f"✅ Created customer: {customer} (ID: {customer.contact_id})")
        
        # Create a vendor contact
        vendor = FinanceContact.objects.create(
            contact_type='vendor',
            display_name='Nokia Test Vendor',
            company_name='Nokia Vendor Inc',
            email='vendor@nokia-test.com',
            vendor_number='VEND-NOKIA-001',
            currency='USD',
            payment_terms='net15'
        )
        self.stdout.write(f"✅ Created vendor: {vendor} (ID: {vendor.contact_id})")
        
        # Create a customer_and_vendor contact
        both = FinanceContact.objects.create(
            contact_type='customer_and_vendor',
            display_name='Nokia Dual Entity',
            company_name='Nokia Both LLC',
            email='both@nokia-test.com',
            customer_number='CUST-NOKIA-002',
            vendor_number='VEND-NOKIA-002'
        )
        self.stdout.write(f"✅ Created customer_and_vendor: {both} (ID: {both.contact_id})")
        
        # Verify contact_id is primary key
        assert hasattr(customer, 'contact_id'), "contact_id field missing!"
        assert customer.pk == customer.contact_id, "contact_id is not primary key!"
        self.stdout.write(f"✅ Primary key is contact_id: {customer.contact_id}")
        
        # Test contact_type options
        assert both.contact_type == 'customer_and_vendor', "customer_and_vendor type not working!"
        self.stdout.write("✅ All contact types working correctly")
        
        return customer, vendor, both
    
    def test_linked_entities(self):
        """Test linking between customer and vendor entities"""
        from services.finance.customers.models import FinanceContact
        
        self.stdout.write(self.style.WARNING('\nTEST 2: Linked Entities'))
        self.stdout.write('-'*40)
        
        # Create customer and vendor for same company
        customer = FinanceContact.objects.create(
            contact_type='customer',
            display_name='Nokia Linked - Customer',
            company_name='Nokia Linked Company',
            customer_number='CUST-LINK-001',
            billing_street='123 Customer St',
            billing_city='Helsinki',
            credit_limit=Decimal('50000.00')
        )
        
        vendor = FinanceContact.objects.create(
            contact_type='vendor',
            display_name='Nokia Linked - Vendor',
            company_name='Nokia Linked Company',
            vendor_number='VEND-LINK-001',
            billing_street='456 Vendor Ave',
            billing_city='Espoo',
            payment_terms='net60'
        )
        
        # Link them together
        customer.linked_entity = vendor
        customer.save()
        
        # Verify bidirectional linking
        vendor.refresh_from_db()
        assert vendor.linked_entity == customer, "Bidirectional link not established!"
        self.stdout.write(f"✅ Linked customer {customer.contact_id} to vendor {vendor.contact_id}")
        self.stdout.write(f"✅ Bidirectional link verified: vendor.linked_entity = {vendor.linked_entity.contact_id}")
        
        # Test is_linked property
        assert customer.is_linked == True, "is_linked property not working!"
        assert vendor.is_linked == True, "vendor is_linked property not working!"
        self.stdout.write("✅ is_linked property working for both entities")
        
        # Verify they maintain separate details
        assert customer.billing_street != vendor.billing_street, "Separate details not maintained!"
        self.stdout.write(f"✅ Separate details maintained:")
        self.stdout.write(f"   Customer address: {customer.billing_street}")
        self.stdout.write(f"   Vendor address: {vendor.billing_street}")
        
        return customer, vendor
    
    def test_account_transaction(self):
        """Test AccountTransaction with unified contact_id"""
        from services.finance.customers.models import FinanceContact
        from services.finance.accounting.models import AccountTransaction, ChartOfAccount
        
        self.stdout.write(self.style.WARNING('\nTEST 3: AccountTransaction with contact_id'))
        self.stdout.write('-'*40)
        
        # Get or create accounts
        ar_account = ChartOfAccount.objects.filter(
            account_type='accounts_receivable'
        ).first()
        if not ar_account:
            ar_account = ChartOfAccount.objects.create(
                account_name='Nokia Accounts Receivable',
                account_type='accounts_receivable',
                account_code='NOKIA-AR-001',
                is_active=True
            )
        
        ap_account = ChartOfAccount.objects.filter(
            account_type='accounts_payable'
        ).first()
        if not ap_account:
            ap_account = ChartOfAccount.objects.create(
                account_name='Nokia Accounts Payable',
                account_type='accounts_payable',
                account_code='NOKIA-AP-001',
                is_active=True
            )
        
        # Create test contact
        contact = FinanceContact.objects.create(
            contact_type='customer_and_vendor',
            display_name='Nokia Transaction Test',
            customer_number='CUST-TXN-001',
            vendor_number='VEND-TXN-001'
        )
        
        # Create invoice (receivable) transaction
        invoice_txn = AccountTransaction.objects.create(
            transaction_id='NOKIA-TXN-001',
            account=ar_account,
            contact_id=str(contact.contact_id),
            transaction_type='invoice',
            transaction_status='posted',
            transaction_date=date.today(),
            entry_number='INV-NOKIA-001',
            debit_or_credit='debit',
            debit_amount=Decimal('10000.00'),
            currency_code='USD',
            description='Nokia test invoice'
        )
        self.stdout.write(f"✅ Created invoice transaction:")
        self.stdout.write(f"   - contact_id: {invoice_txn.contact_id}")
        self.stdout.write(f"   - transaction_type: {invoice_txn.transaction_type}")
        
        # Create bill (payable) transaction  
        bill_txn = AccountTransaction.objects.create(
            transaction_id='NOKIA-TXN-002',
            account=ap_account,
            contact_id=str(contact.contact_id),
            transaction_type='bills',
            transaction_status='posted',
            transaction_date=date.today(),
            entry_number='BILL-NOKIA-001',
            debit_or_credit='credit',
            credit_amount=Decimal('5000.00'),
            currency_code='USD',
            description='Nokia test bill'
        )
        self.stdout.write(f"✅ Created bill transaction:")
        self.stdout.write(f"   - contact_id: {bill_txn.contact_id}")
        self.stdout.write(f"   - transaction_type: {bill_txn.transaction_type}")
        
        # Both transactions use same contact_id
        assert invoice_txn.contact_id == bill_txn.contact_id, "Same contact_id not used!"
        self.stdout.write(f"✅ Both transactions use same contact_id: {contact.contact_id}")
        
        return contact, invoice_txn, bill_txn
    
    def test_transaction_properties(self):
        """Test computed properties on AccountTransaction"""
        from services.finance.customers.models import FinanceContact
        from services.finance.accounting.models import AccountTransaction, ChartOfAccount
        
        self.stdout.write(self.style.WARNING('\nTEST 4: Transaction Computed Properties'))
        self.stdout.write('-'*40)
        
        # Get accounts
        ar_account = ChartOfAccount.objects.filter(account_type='accounts_receivable').first()
        ap_account = ChartOfAccount.objects.filter(account_type='accounts_payable').first()
        
        # Create contact
        contact = FinanceContact.objects.create(
            contact_type='customer_and_vendor',
            display_name='Nokia Property Test',
            customer_number='CUST-PROP-001',
            vendor_number='VEND-PROP-001'
        )
        
        # Test receivable transaction properties
        receivable_types = ['invoice', 'customer_payment', 'credit_notes']
        for txn_type in receivable_types:
            txn = AccountTransaction.objects.create(
                transaction_id=f'NOKIA-PROP-{txn_type}',
                account=ar_account,
                contact_id=str(contact.contact_id),
                transaction_type=txn_type,
                transaction_date=date.today(),
                entry_number=f'{txn_type.upper()}-001',
                debit_or_credit='debit',
                debit_amount=Decimal('1000.00')
            )
            
            assert txn.is_receivable == True, f"{txn_type} should be receivable!"
            assert txn.is_payable == False, f"{txn_type} should not be payable!"
            assert txn.customer_id == str(contact.contact_id), f"customer_id property failed for {txn_type}!"
            assert txn.vendor_id == None, f"vendor_id should be None for {txn_type}!"
            
            self.stdout.write(f"✅ {txn_type}: is_receivable={txn.is_receivable}, customer_id={txn.customer_id}")
        
        # Test payable transaction properties
        payable_types = ['bills', 'vendor_payment', 'expense']
        for txn_type in payable_types:
            txn = AccountTransaction.objects.create(
                transaction_id=f'NOKIA-PROP-{txn_type}',
                account=ap_account,
                contact_id=str(contact.contact_id),
                transaction_type=txn_type,
                transaction_date=date.today(),
                entry_number=f'{txn_type.upper()}-001',
                debit_or_credit='credit',
                credit_amount=Decimal('500.00')
            )
            
            assert txn.is_payable == True, f"{txn_type} should be payable!"
            assert txn.is_receivable == False, f"{txn_type} should not be receivable!"
            assert txn.vendor_id == str(contact.contact_id), f"vendor_id property failed for {txn_type}!"
            assert txn.customer_id == None, f"customer_id should be None for {txn_type}!"
            
            self.stdout.write(f"✅ {txn_type}: is_payable={txn.is_payable}, vendor_id={txn.vendor_id}")
        
        self.stdout.write("✅ All transaction properties working correctly!")
    
    def test_balance_calculations(self):
        """Test balance calculation methods"""
        from services.finance.customers.models import FinanceContact
        from services.finance.accounting.models import AccountTransaction, ChartOfAccount
        
        self.stdout.write(self.style.WARNING('\nTEST 5: Balance Calculations'))
        self.stdout.write('-'*40)
        
        # Create contact
        contact = FinanceContact.objects.create(
            contact_type='customer_and_vendor',
            display_name='Nokia Balance Test',
            customer_number='CUST-BAL-001',
            vendor_number='VEND-BAL-001'
        )
        
        # Get accounts
        ar_account = ChartOfAccount.objects.filter(account_type='accounts_receivable').first()
        ap_account = ChartOfAccount.objects.filter(account_type='accounts_payable').first()
        
        # Create receivable transactions
        # Invoice for $15,000
        AccountTransaction.objects.create(
            transaction_id='NOKIA-BAL-001',
            account=ar_account,
            contact_id=str(contact.contact_id),
            transaction_type='invoice',
            transaction_date=date.today(),
            entry_number='INV-BAL-001',
            debit_or_credit='debit',
            debit_amount=Decimal('15000.00')
        )
        
        # Payment received $5,000
        AccountTransaction.objects.create(
            transaction_id='NOKIA-BAL-002',
            account=ar_account,
            contact_id=str(contact.contact_id),
            transaction_type='customer_payment',
            transaction_date=date.today(),
            entry_number='PAY-BAL-001',
            debit_or_credit='credit',
            credit_amount=Decimal('5000.00')
        )
        
        # Create payable transactions
        # Bill for $8,000
        AccountTransaction.objects.create(
            transaction_id='NOKIA-BAL-003',
            account=ap_account,
            contact_id=str(contact.contact_id),
            transaction_type='bills',
            transaction_date=date.today(),
            entry_number='BILL-BAL-001',
            debit_or_credit='credit',
            credit_amount=Decimal('8000.00')
        )
        
        # Payment made $3,000
        AccountTransaction.objects.create(
            transaction_id='NOKIA-BAL-004',
            account=ap_account,
            contact_id=str(contact.contact_id),
            transaction_type='vendor_payment',
            transaction_date=date.today(),
            entry_number='VPAY-BAL-001',
            debit_or_credit='debit',
            debit_amount=Decimal('3000.00')
        )
        
        # Calculate balances
        receivables = contact.get_receivables_balance()
        payables = contact.get_payables_balance()
        net_balance = contact.get_net_balance()
        
        expected_receivables = Decimal('10000.00')  # 15000 - 5000
        expected_payables = Decimal('5000.00')      # 8000 - 3000
        expected_net = Decimal('5000.00')           # 10000 - 5000
        
        self.stdout.write(f"✅ Receivables Balance: ${receivables} (Expected: ${expected_receivables})")
        self.stdout.write(f"✅ Payables Balance: ${payables} (Expected: ${expected_payables})")
        self.stdout.write(f"✅ Net Balance: ${net_balance} (Expected: ${expected_net})")
        
        assert receivables == expected_receivables, f"Receivables wrong: {receivables}"
        assert payables == expected_payables, f"Payables wrong: {payables}"
        assert net_balance == expected_net, f"Net balance wrong: {net_balance}"
        
        self.stdout.write("✅ All balance calculations correct!")
    
    def test_linked_balance_calculations(self):
        """Test balance calculations with linked entities"""
        from services.finance.customers.models import FinanceContact
        from services.finance.accounting.models import AccountTransaction, ChartOfAccount
        
        self.stdout.write(self.style.WARNING('\nTEST 6: Linked Entity Balance Calculations'))
        self.stdout.write('-'*40)
        
        # Create linked customer and vendor
        customer = FinanceContact.objects.create(
            contact_type='customer',
            display_name='Nokia Linked Customer Balance',
            customer_number='CUST-LBAL-001'
        )
        
        vendor = FinanceContact.objects.create(
            contact_type='vendor',
            display_name='Nokia Linked Vendor Balance',
            vendor_number='VEND-LBAL-001'
        )
        
        # Link them
        customer.linked_entity = vendor
        customer.save()
        vendor.refresh_from_db()
        
        # Get accounts
        ar_account = ChartOfAccount.objects.filter(account_type='accounts_receivable').first()
        ap_account = ChartOfAccount.objects.filter(account_type='accounts_payable').first()
        
        # Create receivable for customer ($20,000)
        AccountTransaction.objects.create(
            transaction_id='NOKIA-LBAL-001',
            account=ar_account,
            contact_id=str(customer.contact_id),
            transaction_type='invoice',
            transaction_date=date.today(),
            entry_number='INV-LBAL-001',
            debit_or_credit='debit',
            debit_amount=Decimal('20000.00')
        )
        
        # Create payable for vendor ($7,000)
        AccountTransaction.objects.create(
            transaction_id='NOKIA-LBAL-002',
            account=ap_account,
            contact_id=str(vendor.contact_id),
            transaction_type='bills',
            transaction_date=date.today(),
            entry_number='BILL-LBAL-001',
            debit_or_credit='credit',
            credit_amount=Decimal('7000.00')
        )
        
        # Check individual balances
        customer_receivables = customer.get_receivables_balance()
        vendor_payables = vendor.get_payables_balance()
        
        self.stdout.write(f"✅ Customer receivables: ${customer_receivables}")
        self.stdout.write(f"✅ Vendor payables: ${vendor_payables}")
        
        # Check combined net balance
        customer_net = customer.get_net_balance()
        vendor_net = vendor.get_net_balance()
        
        expected_net = Decimal('13000.00')  # 20000 - 7000
        
        self.stdout.write(f"✅ Customer net balance (includes linked): ${customer_net}")
        self.stdout.write(f"✅ Vendor net balance (includes linked): ${vendor_net}")
        
        assert customer_net == expected_net, f"Customer net balance wrong: {customer_net}"
        assert vendor_net == expected_net, f"Vendor net balance wrong: {vendor_net}"
        
        self.stdout.write(f"✅ Both show same net balance: ${expected_net}")
        self.stdout.write("✅ Linked entity balance aggregation working!")
    
    def test_api_compatibility(self):
        """Test API compatibility with new structure"""
        from services.finance.customers.serializers import (
            CustomerListSerializer,
            CustomerDetailSerializer
        )
        from services.finance.accounting.serializers import (
            AccountTransactionSerializer
        )
        from services.finance.customers.models import FinanceContact
        from services.finance.accounting.models import AccountTransaction
        
        self.stdout.write(self.style.WARNING('\nTEST 7: API Serializer Compatibility'))
        self.stdout.write('-'*40)
        
        # Test FinanceContact serialization
        contact = FinanceContact.objects.filter(
            display_name__startswith='Nokia'
        ).first()
        
        if contact:
            # Test list serializer
            list_serializer = CustomerListSerializer(contact)
            data = list_serializer.data
            
            assert 'contact_id' in data, "contact_id not in serialized data!"
            assert 'receivables_balance' in data, "receivables_balance not in data!"
            assert 'payables_balance' in data, "payables_balance not in data!"
            assert 'net_balance' in data, "net_balance not in data!"
            
            self.stdout.write(f"✅ FinanceContact serialization includes:")
            self.stdout.write(f"   - contact_id: {data.get('contact_id')}")
            self.stdout.write(f"   - receivables_balance: {data.get('receivables_balance')}")
            self.stdout.write(f"   - payables_balance: {data.get('payables_balance')}")
            self.stdout.write(f"   - net_balance: {data.get('net_balance')}")
        
        # Test transaction serialization
        txn = AccountTransaction.objects.filter(
            transaction_id__startswith='NOKIA'
        ).first()
        
        if txn:
            txn_serializer = AccountTransactionSerializer(txn)
            txn_data = txn_serializer.data
            
            assert 'contact_id' in txn_data, "contact_id not in transaction data!"
            self.stdout.write(f"✅ Transaction serialization includes contact_id: {txn_data.get('contact_id')}")
        
        self.stdout.write("✅ API serializers compatible with new structure!")