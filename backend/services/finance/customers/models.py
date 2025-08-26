from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models
from decimal import Decimal
import uuid


class FinanceContact(models.Model):
    contact_id = models.AutoField(primary_key=True)
    
    # Display ID Fields for Vendor Support
    customer_number = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True, 
        db_index=True,
        help_text="Customer ID in format CUST-XXXX"
    )
    vendor_number = models.CharField(
        max_length=20, 
        unique=True, 
        null=True, 
        blank=True, 
        db_index=True,
        help_text="Vendor ID in format VEND-XXXX"
    )
    
    # Contact Type - Added back 'customer_and_vendor' option
    contact_type = models.CharField(
        max_length=20,
        choices=[
            ('customer', 'Customer'),
            ('vendor', 'Vendor'),
            ('customer_and_vendor', 'Customer & Vendor'),
        ],
        default='customer',
        db_index=True,
        help_text="Contact type: Customer, Vendor, or both"
    )
    
    # Linking field (one-to-one cross-reference)
    linked_entity = models.OneToOneField(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='linked_counterpart',
        help_text="Link to corresponding vendor (if this is customer) or customer (if this is vendor)"
    )
    
    # Track link metadata
    link_created_at = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="When the link was created"
    )
    link_created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='entity_links_created',
        help_text="User who created the link"
    )

    # OPTIONAL relationships (was REQUIRED, now optional for vendors)
    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        null=True,  # Now optional
        blank=True,  # Now optional
        related_name='customers',
        db_column='account_id',
        help_text="Link to CRM Account (optional - will create if entered)"
    )

    # Core customer fields
    display_name = models.CharField(max_length=255, help_text="Primary display name for the customer")
    
    # Company information (kept for backward compatibility and display)
    company_name = models.CharField(
        max_length=200, 
        blank=True, 
        null=True,
        help_text="Company name for vendors without CRM account"
    )
    website = models.URLField(max_length=255, blank=True, null=True)

    customer_type = models.CharField(
        max_length=20,
        choices=[
            ('business', 'Business'),
            ('individual', 'Individual')
        ],
        default='business'
    )

    customer_status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('inactive', 'Inactive'),
            ('suspended', 'Suspended')
        ],
        default='active'
    )

    # Financial settings
    currency = models.CharField(
        max_length=3,
        choices=[
            ('USD', 'US Dollar'),
            ('EUR', 'Euro'),
            ('GBP', 'British Pound')
        ],
        default='USD'
    )

    payment_terms = models.CharField(
        max_length=20,
        choices=[
            ('immediate', 'Immediate'),
            ('net15', 'Net 15 Days'),
            ('net30', 'Net 30 Days'),
            ('net60', 'Net 60 Days'),
            ('net90', 'Net 90 Days')
        ],
        default='net30'
    )
    
    # Enhanced Financial Fields
    credit_limit = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        null=True, 
        blank=True,
        help_text="Credit limit for the customer"
    )
    payment_terms_label = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Custom payment terms label"
    )
    outstanding_receivable_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0,
        help_text="Total outstanding amount"
    )
    unused_credits_receivable_amount = models.DecimalField(
        max_digits=15, 
        decimal_places=2, 
        default=0,
        help_text="Unused credit amount"
    )
    opening_balances = models.JSONField(
        null=True, 
        blank=True,
        help_text="Opening balance information {amount, exchange_rate, date}"
    )
    
    # Chart of Accounts Integration
    receivable_account = models.ForeignKey(
        'accounting.ChartOfAccount',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customer_receivables',
        limit_choices_to={'account_type': 'accounts_receivable'},
        help_text='Accounts Receivable account for customers'
    )
    payable_account = models.ForeignKey(
        'accounting.ChartOfAccount',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='vendor_payables',
        limit_choices_to={'account_type': 'accounts_payable'},
        help_text='Accounts Payable account for vendors'
    )

    # VAT/Tax fields
    vat_treatment = models.CharField(
        max_length=20,
        choices=[
            ('uk', 'UK'),
            ('overseas', 'Overseas')
        ],
        blank=True,
        null=True,
        help_text="VAT treatment classification"
    )

    vat_registration_number = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="VAT registration number"
    )
    
    # Additional Tax Fields (UK Focus for MVP)
    is_taxable = models.BooleanField(default=True, help_text="Is this contact taxable")
    place_of_contact = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Place of contact for VAT purposes"
    )
    tax_exemption_code = models.CharField(max_length=50, blank=True, null=True)
    tax_exemption_certificate_number = models.CharField(max_length=100, blank=True, null=True)

    # Address override fields (can differ from linked account)
    billing_attention = models.CharField(max_length=255, blank=True, null=True)
    billing_street = models.CharField(max_length=255, blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_state_province = models.CharField(max_length=100, blank=True, null=True)
    billing_zip_postal_code = models.CharField(max_length=20, blank=True, null=True)
    billing_country = models.CharField(max_length=100, blank=True, null=True)
    
    # Enhanced billing address fields
    billing_state_code = models.CharField(max_length=10, blank=True, null=True)
    billing_fax = models.CharField(max_length=50, blank=True, null=True)
    billing_phone = models.CharField(max_length=50, blank=True, null=True)

    shipping_attention = models.CharField(max_length=255, blank=True, null=True)
    shipping_street = models.CharField(max_length=255, blank=True, null=True)
    shipping_city = models.CharField(max_length=100, blank=True, null=True)
    shipping_state_province = models.CharField(max_length=100, blank=True, null=True)
    shipping_zip_postal_code = models.CharField(max_length=20, blank=True, null=True)
    shipping_country = models.CharField(max_length=100, blank=True, null=True)
    
    # Enhanced shipping address fields
    shipping_state_code = models.CharField(max_length=10, blank=True, null=True)
    shipping_fax = models.CharField(max_length=50, blank=True, null=True)
    shipping_phone = models.CharField(max_length=50, blank=True, null=True)
    
    # Portal & Communication
    payment_reminder_enabled = models.BooleanField(default=True, help_text="Send payment reminders")
    
    # Tags and categorization
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="List of tags for categorization"
    )
    
    # Social media profiles (as JSON for flexibility)
    social_media = models.JSONField(
        default=dict,
        blank=True,
        help_text="Social media profiles (linkedin, twitter, facebook, etc.)"
    )
    
    # Portal access settings
    portal_status = models.CharField(
        max_length=20,
        choices=[
            ('enabled', 'Enabled'),
            ('disabled', 'Disabled'),
        ],
        default='disabled',
        blank=True
    )
    portal_language = models.CharField(
        max_length=10,
        default='en',
        blank=True,
        help_text="Preferred language for portal (en, es, fr, etc.)"
    )
    
    # Complex Data Fields (contact_persons removed - now using ContactPerson model)
    custom_fields = models.JSONField(default=list, blank=True)
    documents = models.JSONField(default=list, blank=True)
    
    # CRM Integration Fields
    source = models.CharField(
        max_length=20, 
        default='finance',
        choices=[
            ('finance', 'Finance'),
            ('crm', 'CRM')
        ],
        help_text="Source of this record"
    )

    # Business intelligence
    customer_since = models.DateField(auto_now_add=True)
    last_transaction_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, null=True)

    # Ownership & assignment
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_customers',
        db_column='owner_id',
        help_text="Customer owner/assignee"
    )

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customers_created',
        db_column='created_by'
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='customers_updated',
        db_column='updated_by'
    )

    objects = models.Manager()

    class Meta:
        app_label = 'customers'
        db_table = 'finance_contact'
        verbose_name = 'Finance Contact'
        verbose_name_plural = 'Finance Contacts'
        ordering = ['display_name']
        indexes = [
            models.Index(fields=['account'], name='idx_fincontact_account'),
            models.Index(fields=['owner'], name='idx_fincontact_owner'),
            models.Index(fields=['created_at'], name='idx_fincontact_created'),
            models.Index(fields=['display_name'], name='idx_fincontact_display_name'),
            models.Index(fields=['customer_status'], name='idx_fincontact_status'),
            models.Index(fields=['customer_type'], name='idx_fincontact_type'),
            models.Index(fields=['currency'], name='idx_fincontact_currency'),
            models.Index(fields=['contact_type'], name='idx_fincontact_contact_type'),
            models.Index(fields=['customer_number'], name='idx_customer_number'),
            models.Index(fields=['vendor_number'], name='idx_vendor_number'),
        ]
        constraints = []

    def __str__(self) -> str:
        if self.contact_type == 'vendor' and self.vendor_number:
            return f"{self.display_name} ({self.vendor_number})"
        elif self.customer_number:
            return f"{self.display_name} ({self.customer_number})"
        return f"{self.display_name} (#{self.contact_id})"
    
    def clean(self):
        """Validation to ensure proper linking"""
        super().clean()
        
        if self.linked_entity:
            # Ensure we're not linking to same type
            if self.contact_type == self.linked_entity.contact_type:
                raise ValidationError(
                    "Cannot link customer to customer or vendor to vendor"
                )
    
    def save(self, *args, **kwargs):
        """Override save to auto-populate fields and handle linking"""
        # Auto-populate display_name if not provided
        if not self.display_name:
            # Try to get from primary contact or company name
            primary = self.get_primary_contact_person()
            if primary:
                self.display_name = primary.full_name or self.company_name or "Unnamed Contact"
            else:
                self.display_name = self.company_name or "Unnamed Contact"
        
        # Handle bidirectional linking
        if self.linked_entity and self.linked_entity.linked_entity != self:
            self.linked_entity.linked_entity = self
            self.linked_entity.save(update_fields=['linked_entity'])
        
        super().save(*args, **kwargs)

    # Contact Person Management Methods (New Model-based approach)
    def get_primary_contact_person(self):
        """Get the primary contact person from related ContactPerson model"""
        try:
            return self.contact_persons_rel.filter(is_primary_contact=True).first()
        except:
            return None
    
    def get_contact_persons(self):
        """Get all contact persons ordered by primary first, then name"""
        return self.contact_persons_rel.all().order_by('-is_primary_contact', 'first_name', 'last_name')
    
    @property
    def company_name_property(self):
        """Get company name from linked account or company_name field"""
        return self.company_name or (self.account.account_name if self.account else None)

    @property
    def primary_contact_name(self):
        """Get primary contact full name from ContactPerson model"""
        primary = self.get_primary_contact_person()
        return primary.full_name if primary else None

    @property
    def primary_contact_email(self):
        """Get primary contact email from ContactPerson model"""
        primary = self.get_primary_contact_person()
        return primary.email if primary else None

    @property
    def primary_contact_phone(self):
        """Get primary contact phone from ContactPerson model"""
        primary = self.get_primary_contact_person()
        return primary.phone if primary else None
    
    @property
    def net_balance(self):
        """Calculate net balance when linked (Receivable - Payable)"""
        if not self.linked_entity:
            return None
        
        if self.contact_type == 'customer':
            receivable = float(self.outstanding_receivable_amount or 0)
            payable = float(self.linked_entity.outstanding_receivable_amount or 0)
        else:  # vendor
            payable = float(self.outstanding_receivable_amount or 0)
            receivable = float(self.linked_entity.outstanding_receivable_amount or 0)
        
        return receivable - payable
    
    @property
    def is_linked(self):
        """Check if this entity has a linked counterpart"""
        return self.linked_entity is not None

    def get_billing_address_dict(self):
        """Return billing address as dictionary, preferring customer fields over account"""
        return {
            'attention': self.billing_attention or (self.account.account_name if self.account else None),
            'street': self.billing_street or (self.account.billing_street if self.account else None),
            'city': self.billing_city or (self.account.billing_city if self.account else None),
            'state_province': self.billing_state_province or (self.account.billing_state_province if self.account else None),
            'state_code': self.billing_state_code,
            'zip_postal_code': self.billing_zip_postal_code or (self.account.billing_zip_postal_code if self.account else None),
            'country': self.billing_country or (self.account.billing_country if self.account else None),
            'fax': self.billing_fax,
            'phone': self.billing_phone,
        }

    def get_shipping_address_dict(self):
        """Return shipping address as dictionary, preferring customer fields over account"""
        return {
            'attention': self.shipping_attention or (self.account.account_name if self.account else None),
            'street': self.shipping_street or (self.account.shipping_street if self.account else None),
            'city': self.shipping_city or (self.account.shipping_city if self.account else None),
            'state_province': self.shipping_state_province or (self.account.shipping_state_province if self.account else None),
            'state_code': self.shipping_state_code,
            'zip_postal_code': self.shipping_zip_postal_code or (self.account.shipping_zip_postal_code if self.account else None),
            'country': self.shipping_country or (self.account.shipping_country if self.account else None),
            'fax': self.shipping_fax,
            'phone': self.shipping_phone,
        }
    
    def get_transactions(self, transaction_type=None):
        """Get all transactions for this contact"""
        from services.finance.accounting.models import AccountTransaction
        
        queryset = AccountTransaction.objects.filter(
            contact_id=str(self.contact_id)
        )
        
        if transaction_type == 'receivable':
            queryset = queryset.filter(
                transaction_type__in=[
                    'invoice', 'customer_payment', 'credit_notes',
                    'creditnote_refund', 'sales_without_invoices'
                ]
            )
        elif transaction_type == 'payable':
            queryset = queryset.filter(
                transaction_type__in=[
                    'bills', 'vendor_payment', 'expense',
                    'card_payment', 'purchase_or_charges'
                ]
            )
        
        return queryset
    
    def get_receivables_balance(self):
        """Calculate total receivables for this contact"""
        transactions = self.get_transactions('receivable')
        
        total_debit = transactions.filter(
            debit_or_credit='debit'
        ).aggregate(
            total=models.Sum('debit_amount')
        )['total'] or Decimal('0.00')
        
        total_credit = transactions.filter(
            debit_or_credit='credit'
        ).aggregate(
            total=models.Sum('credit_amount')
        )['total'] or Decimal('0.00')
        
        return total_debit - total_credit
    
    def get_payables_balance(self):
        """Calculate total payables for this contact"""
        transactions = self.get_transactions('payable')
        
        total_credit = transactions.filter(
            debit_or_credit='credit'
        ).aggregate(
            total=models.Sum('credit_amount')
        )['total'] or Decimal('0.00')
        
        total_debit = transactions.filter(
            debit_or_credit='debit'
        ).aggregate(
            total=models.Sum('debit_amount')
        )['total'] or Decimal('0.00')
        
        return total_credit - total_debit
    
    def get_net_balance(self):
        """Calculate net balance including linked entity if exists"""
        receivables = self.get_receivables_balance()
        payables = self.get_payables_balance()
        
        # Include linked entity balances if linked
        if self.linked_entity:
            receivables += self.linked_entity.get_receivables_balance()
            payables += self.linked_entity.get_payables_balance()
        
        return receivables - payables


class ContactPerson(models.Model):
    """
    Contact Person model following Zoho Books API structure
    """
    contact_person_id = models.AutoField(primary_key=True)
    
    # Foreign key to parent contact
    contact = models.ForeignKey(
        FinanceContact,
        on_delete=models.CASCADE,
        related_name='contact_persons_rel',
        db_column='contact_id',
        help_text="Parent finance contact"
    )
    
    # Basic information
    salutation = models.CharField(
        max_length=25, 
        blank=True, 
        null=True,
        help_text="Salutation for the contact person (Mr, Ms, Dr, etc.)"
    )
    first_name = models.CharField(
        max_length=100,
        help_text="First name of the contact person"
    )
    last_name = models.CharField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Last name of the contact person"
    )
    
    # Contact information
    email = models.EmailField(
        max_length=100, 
        blank=True, 
        null=True,
        help_text="Email address of the contact person"
    )
    phone = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Phone number"
    )
    mobile = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Mobile number"
    )
    skype = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Skype address"
    )
    
    # Professional information
    designation = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Job title or designation"
    )
    department = models.CharField(
        max_length=50, 
        blank=True, 
        null=True,
        help_text="Department"
    )
    
    # Status flags
    is_primary_contact = models.BooleanField(
        default=False,
        help_text="Is this the primary contact person"
    )
    enable_portal = models.BooleanField(
        default=False,
        help_text="Enable portal access for this contact person"
    )
    is_added_in_portal = models.BooleanField(
        default=False,
        help_text="Whether the contact person has portal access"
    )
    
    # Communication preferences
    is_sms_enabled = models.BooleanField(
        default=False,
        help_text="SMS communication preference enabled"
    )
    is_whatsapp_enabled = models.BooleanField(
        default=False,
        help_text="WhatsApp communication preference enabled"
    )
    
    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contact_persons_created',
        help_text="User who created this contact person"
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contact_persons_updated',
        help_text="User who last updated this contact person"
    )
    
    class Meta:
        app_label = 'customers'
        db_table = 'finance_contact_person'
        verbose_name = 'Contact Person'
        verbose_name_plural = 'Contact Persons'
        ordering = ['contact', '-is_primary_contact', 'first_name', 'last_name']
        
        # Indexes for performance
        indexes = [
            models.Index(fields=['contact'], name='idx_cp_contact'),
            models.Index(fields=['contact', 'is_primary_contact'], name='idx_cp_contact_primary'),
            models.Index(fields=['email'], name='idx_cp_email'),
            models.Index(fields=['first_name', 'last_name'], name='idx_cp_name'),
            models.Index(fields=['created_at'], name='idx_cp_created'),
        ]
        
        # Constraints
        constraints = [
            # Ensure only one primary contact per finance contact
            models.UniqueConstraint(
                fields=['contact'],
                condition=models.Q(is_primary_contact=True),
                name='unique_primary_cp_per_contact'
            ),
        ]
    
    def __str__(self):
        name = f"{self.first_name} {self.last_name or ''}".strip()
        if self.is_primary_contact:
            name += " (Primary)"
        return name
    
    def clean(self):
        """Validation to ensure only one primary contact per finance contact"""
        super().clean()
        
        if self.is_primary_contact:
            # Check if another primary contact exists for this finance contact
            existing_primary = ContactPerson.objects.filter(
                contact=self.contact,
                is_primary_contact=True
            ).exclude(contact_person_id=self.contact_person_id)
            
            if existing_primary.exists():
                raise ValidationError(
                    "Only one primary contact person is allowed per contact"
                )
    
    def save(self, *args, **kwargs):
        """Override save to handle primary contact logic"""
        # If this is being set as primary, unset others
        if self.is_primary_contact:
            ContactPerson.objects.filter(
                contact=self.contact,
                is_primary_contact=True
            ).exclude(contact_person_id=self.contact_person_id).update(
                is_primary_contact=False
            )
        
        # Auto-set portal access based on enable_portal flag
        if self.enable_portal and not self.is_added_in_portal:
            self.is_added_in_portal = True
        elif not self.enable_portal:
            self.is_added_in_portal = False
        
        super().save(*args, **kwargs)
    
    @property
    def full_name(self):
        """Get full name of contact person"""
        return f"{self.first_name} {self.last_name or ''}".strip()
    
    @property
    def communication_preference(self):
        """Get communication preferences as dict (Zoho-style)"""
        return {
            'is_sms_enabled': self.is_sms_enabled,
            'is_whatsapp_enabled': self.is_whatsapp_enabled,
        }
