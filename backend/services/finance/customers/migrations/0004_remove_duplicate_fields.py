# Generated migration to remove duplicate fields from Customer model
from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0003_customer_portal_language_customer_portal_status_and_more'),
    ]

    operations = [
        # Remove duplicate VAT/tax fields
        migrations.RemoveField(
            model_name='customer',
            name='vat_reg_no',
        ),
        migrations.RemoveField(
            model_name='customer',
            name='tax_id',
        ),
        
        # Remove duplicate status field (keeping customer_status)
        migrations.RemoveField(
            model_name='customer',
            name='status',
        ),
        
        # Remove duplicate social media fields (keeping social_media JSON)
        migrations.RemoveField(
            model_name='customer',
            name='facebook',
        ),
        migrations.RemoveField(
            model_name='customer',
            name='twitter',
        ),
        
        # Remove duplicate portal fields
        migrations.RemoveField(
            model_name='customer',
            name='is_portal_enabled',
        ),
        migrations.RemoveField(
            model_name='customer',
            name='language_code',
        ),
        
        # Remove duplicate CRM ID fields (keeping ForeignKey relationships)
        migrations.RemoveField(
            model_name='customer',
            name='crm_account_id',
        ),
        migrations.RemoveField(
            model_name='customer',
            name='crm_contact_id',
        ),
    ]