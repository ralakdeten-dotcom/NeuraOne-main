from django import forms
from django.conf import settings
from django.db import models


class Deal(models.Model):
    """Django ORM model for the DEAL table with account name and owner alias."""

    deal_id = models.AutoField(primary_key=True)

    # Tenant isolation is handled by schema, no FK needed

    deal_name = models.CharField(max_length=255)
    stage = models.CharField(max_length=100)
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    close_date = models.DateField()

    account = models.ForeignKey(
        'accounts.Account',  # or 'yourapp.Account'
        on_delete=models.CASCADE,
        related_name='deals',
        db_column='account_id',
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_deals',
        db_column='owner_id',
    )

    primary_contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='primary_deals',
        db_column='primary_contact_id',
        help_text="Primary contact for this deal"
    )

    description = models.TextField(
        blank=True,
        null=True,
        help_text="Additional notes or description for this deal"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deals_created',
        db_column='created_by',
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='deals_updated',
        db_column='updated_by',
    )

    objects = models.Manager()

    class Meta:
        app_label = 'deals'
        db_table = 'deal'
        verbose_name = 'Deal'
        verbose_name_plural = 'Deals'
        ordering = ['-close_date']
        indexes = [
            models.Index(fields=['account'], name='idx_deal_account'),
            models.Index(fields=['owner'], name='idx_deal_owner'),
            models.Index(fields=['stage'], name='idx_deal_stage'),
            models.Index(fields=['created_at'], name='idx_deal_created'),
            models.Index(fields=['stage'], name='idx_deal_stage_idx'),
            models.Index(fields=['close_date'], name='idx_deal_close_date'),
            models.Index(fields=['amount'], name='idx_deal_amount'),
            models.Index(fields=['account'], name='idx_deal_account_idx'),
            models.Index(fields=['owner'], name='idx_deal_owner_idx'),
            models.Index(fields=['primary_contact'], name='idx_deal_primary_contact'),
        ]

    def __str__(self):
        return f"{self.deal_name} ({self.stage})"


class DealForm(forms.ModelForm):
    """Form for creating and updating Deal instances, including account name and owner alias."""

    close_date = forms.DateField(
        widget=forms.DateInput(attrs={'type': 'date'})
    )

    class Meta:
        model = Deal
        fields = [
            'deal_name',
            'stage',
            'amount',
            'close_date',
            'account',
            'owner',
            'primary_contact',
            'description',
        ]
        widgets = {
            'stage': forms.TextInput(),
            'amount': forms.NumberInput(),
        }
