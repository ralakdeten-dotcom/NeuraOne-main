# Generated migration for adding unified contact_id to AccountTransaction

from django.db import migrations, models


def migrate_contact_ids(apps, schema_editor):
    """Migrate existing customer_id and vendor_id to contact_id"""
    AccountTransaction = apps.get_model('accounting', 'AccountTransaction')
    
    # Migrate customer_id values
    AccountTransaction.objects.filter(
        customer_id__isnull=False
    ).update(contact_id=models.F('customer_id'))
    
    # Migrate vendor_id values (only if contact_id is still null)
    AccountTransaction.objects.filter(
        vendor_id__isnull=False,
        contact_id__isnull=True
    ).update(contact_id=models.F('vendor_id'))


def reverse_migrate_contact_ids(apps, schema_editor):
    """Reverse migration - populate customer_id and vendor_id from contact_id"""
    AccountTransaction = apps.get_model('accounting', 'AccountTransaction')
    
    # For receivable transactions, populate customer_id
    receivable_types = [
        'invoice', 'customer_payment', 'credit_notes',
        'creditnote_refund', 'sales_without_invoices'
    ]
    AccountTransaction.objects.filter(
        transaction_type__in=receivable_types,
        contact_id__isnull=False
    ).update(customer_id=models.F('contact_id'))
    
    # For payable transactions, populate vendor_id
    payable_types = [
        'bills', 'vendor_payment', 'expense',
        'card_payment', 'purchase_or_charges'
    ]
    AccountTransaction.objects.filter(
        transaction_type__in=payable_types,
        contact_id__isnull=False
    ).update(vendor_id=models.F('contact_id'))


class Migration(migrations.Migration):

    dependencies = [
        ("accounting", "0001_initial"),
    ]

    operations = [
        # Add new contact_id field
        migrations.AddField(
            model_name='accounttransaction',
            name='contact_id',
            field=models.CharField(
                max_length=50,
                blank=True,
                null=True,
                db_index=True,
                help_text='Reference to FinanceContact.contact_id'
            ),
        ),
        
        # Migrate existing data
        migrations.RunPython(
            migrate_contact_ids,
            reverse_code=reverse_migrate_contact_ids
        ),
        
        # Remove old fields
        migrations.RemoveField(
            model_name='accounttransaction',
            name='customer_id',
        ),
        migrations.RemoveField(
            model_name='accounttransaction',
            name='vendor_id',
        ),
    ]
