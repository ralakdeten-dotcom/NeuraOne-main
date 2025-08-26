from django.conf import settings
from django.db import models, transaction

from services.crm.accounts.models import Account
from services.crm.contacts.models import Contact
from services.crm.deals.models import Deal


class Lead(models.Model):
    lead_id = models.AutoField(primary_key=True)

    # Tenant isolation is handled by schema, no FK needed

    # Core lead fields
    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads',
        db_column='company_id',  # Keep original column name for backward compatibility
    )
    company_name = models.CharField(
        max_length=255,
        blank=True,
        null=True,
        help_text="Company name as entered during lead creation (before conversion)"
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    title = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=200, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    lead_status = models.CharField(max_length=50, blank=True, null=True)
    score = models.IntegerField(blank=True, null=True)

    lead_owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads_lead_owner',
        db_column='lead_owner_id',
    )

    # Contact info
    email = models.EmailField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    # Address fields
    street = models.CharField(max_length=255, blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    state = models.CharField(max_length=100, blank=True, null=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    # Business info
    number_of_employees = models.PositiveIntegerField(blank=True, null=True)
    average_revenue = models.DecimalField(max_digits=12, decimal_places=2, blank=True, null=True)

    lead_source = models.CharField(max_length=100, blank=True, null=True)
    industry = models.CharField(max_length=100, blank=True, null=True)

    # Relationships
    # Note: Campaign model will be implemented later
    # campaign = models.ForeignKey(
    #     'campaigns.Campaign',
    #     on_delete=models.SET_NULL,
    #     null=True,
    #     blank=True,
    #     related_name='leads',
    #     db_column='campaign_id',
    # )

    # Timestamps and audit
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads_created',
        db_column='created_by',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='leads_updated',
        db_column='updated_by',
    )

    objects = models.Manager()

    class Meta:
        app_label = 'leads'  # Keep the original app label
        db_table = 'lead'
        verbose_name = 'Lead'
        verbose_name_plural = 'Leads'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['account'], name='idx_lead_account'),
            models.Index(fields=['lead_owner'], name='idx_lead_owner'),
            models.Index(fields=['lead_status'], name='idx_lead_status'),
            models.Index(fields=['created_at'], name='idx_lead_created'),
            models.Index(fields=['last_name'], name='idx_lead_lastname'),
            models.Index(fields=['email'], name='idx_lead_email'),
            models.Index(fields=['score'], name='idx_lead_score'),
            # models.Index(fields=['campaign'], name='idx_lead_campaign'),  # Disabled until campaign model is added
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} <{self.email}>"

    def save(self, *args, **kwargs):
        """Override save to handle company_name"""
        # Only auto-update company_name if it's empty and we have an account FK
        if self.account and not self.company_name:
            self.company_name = self.account.account_name
        super().save(*args, **kwargs)

    def find_or_create_account(self, account_data):
        """
        Smart account matching using multiple criteria to prevent duplicates.

        Priority:
        1. Use existing FK relationship if lead.company is set
        2. Smart duplicate detection by name + website/phone
        3. Create new account only if no matches found

        Args:
            account_data: Dictionary with account field data

        Returns:
            Account: Existing or newly created account
        """
        # 1. First Priority: Use existing FK relationship if set
        if self.account:
            return self.account

        # Extract key matching fields, handling None values
        account_name = (account_data.get('account_name') or account_data.get('company_name') or '').strip()
        website = (account_data.get('website') or '').strip()
        phone = (account_data.get('phone') or '').strip()

        if not account_name:
            # Fallback to default naming if no account name provided
            account_name = self.company_name or f"{self.first_name} {self.last_name} Company"
            if 'account_name' not in account_data:
                account_data['account_name'] = account_name

        # 2. Smart duplicate detection within tenant (schema handles isolation)
        # Highest confidence: Exact name + website match
        if account_name and website:
            existing = Account.objects.filter(
                account_name__iexact=account_name,
                website__iexact=website
            ).first()
            if existing:
                return existing

        # High confidence: Exact name + phone match
        if account_name and phone:
            existing = Account.objects.filter(
                account_name__iexact=account_name,
                phone=phone
            ).first()
            if existing:
                return existing

        # Medium confidence: Exact name match (only if single result)
        if account_name:
            matches = Account.objects.filter(
                account_name__iexact=account_name
            )
            if matches.count() == 1:
                return matches.first()
            elif matches.count() > 1:
                # Multiple matches - append lead name to avoid confusion
                account_data['account_name'] = f"{account_name} ({self.first_name} {self.last_name})"

        # 3. No matches found - create new account
        return Account.objects.create(**account_data)

    def convert(self, deal_name=None, deal_stage="Prospecting", deal_amount=None, deal_close_date=None):
        """
        Convert a Lead into an Account, Contact, and Deal.
        Deletes the lead after successful creation.
        Returns a tuple: (account, contact, deal)

        Args:
            deal_name: Optional name for the deal (defaults to "Deal for {lead_name}")
            deal_stage: Stage for the deal (defaults to "Prospecting")
            deal_amount: Optional amount for the deal
            deal_close_date: Optional close date for the deal
        """
        from datetime import timedelta

        from django.utils import timezone

        with transaction.atomic():
            # Find or create Account using smart matching to prevent duplicates
            account_name = self.company_name or f"{self.first_name} {self.last_name} Company"
            account_data = {
                'account_name': account_name,
                'description': self.description,
                'industry': self.industry,
                'website': self.website,
                'phone': self.phone,
                'number_of_employees': self.number_of_employees,
                'owner': self.lead_owner,
                # Use lead's address info for billing address
                'billing_street': self.street,
                'billing_city': self.city,
                'billing_state_province': self.state,
                'billing_country': self.country,
                'billing_zip_postal_code': self.postal_code,
                'created_by': self.created_by,
                'updated_by': self.updated_by,
            }

            # Use smart account matching to prevent duplicates
            account = self.find_or_create_account(account_data)

            # Create Contact from Lead
            contact = Contact.objects.create(
                account=account,
                first_name=self.first_name,
                last_name=self.last_name,
                title=self.title,
                description=self.description,
                email=self.email if self.email else None,  # Ensure None instead of empty string
                phone=self.phone,
                mailing_street=self.street,
                mailing_city=self.city,
                mailing_state_province=self.state,
                mailing_country=self.country,
                postal_code=self.postal_code,
                owner=self.lead_owner,
                created_by=self.created_by,
                updated_by=self.updated_by,
            )

            # Create Deal from Lead
            deal = Deal.objects.create(
                deal_name=deal_name or f"Deal for {self.first_name} {self.last_name}",
                stage=deal_stage,
                amount=deal_amount or 0.00,
                close_date=deal_close_date or (timezone.now().date() + timedelta(days=30)),
                account=account,
                owner=self.lead_owner,
                primary_contact=contact,  # Link the created contact as primary contact
                created_by=self.created_by,
                updated_by=self.updated_by,
            )

            # Link lead to the account before deletion (for audit trail)
            self.account = account
            self.save()

            # Delete the original lead
            self.delete()

            return account, contact, deal
