# Generated migration for renaming Customer to FinanceContact

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0006_add_zoho_style_linking'),
    ]

    operations = [
        # First rename the model
        migrations.RenameModel(
            old_name='Customer',
            new_name='FinanceContact',
        ),
        
        # Rename the primary key field
        migrations.RenameField(
            model_name='financecontact',
            old_name='customer_id',
            new_name='contact_id',
        ),
        
        # Update contact_type to include customer_and_vendor option
        migrations.AlterField(
            model_name='financecontact',
            name='contact_type',
            field=models.CharField(
                max_length=20,
                choices=[
                    ('customer', 'Customer'),
                    ('vendor', 'Vendor'),
                    ('customer_and_vendor', 'Customer & Vendor'),
                ],
                default='customer',
                db_index=True,
                help_text="Contact type: Customer, Vendor, or both"
            ),
        ),
        
        # Update the linked_entity help text to be clearer
        migrations.AlterField(
            model_name='financecontact',
            name='linked_entity',
            field=models.OneToOneField(
                'self',
                on_delete=models.SET_NULL,
                null=True,
                blank=True,
                related_name='linked_counterpart',
                help_text="Link to corresponding vendor (if this is customer) or customer (if this is vendor)"
            ),
        ),
    ]