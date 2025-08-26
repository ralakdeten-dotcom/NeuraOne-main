from django.conf import settings
from django.db import models
from django.db.models.functions import Lower


class Account(models.Model):
    account_id = models.AutoField(primary_key=True)

    # Tenant isolation is handled by schema, no FK needed


    account_name = models.CharField(max_length=255)
    account_owner_alias = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(blank=True, null=True)

    parent_account = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='child_accounts',
        db_column='parent_account_id',
    )

    industry = models.CharField(max_length=100, blank=True, null=True)
    website = models.URLField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    number_of_employees = models.PositiveIntegerField(blank=True, null=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_accounts',
        db_column='owner_id',
    )

    # Billing Address
    billing_country = models.CharField(max_length=100, blank=True, null=True)
    billing_street = models.CharField(max_length=255, blank=True, null=True)
    billing_city = models.CharField(max_length=100, blank=True, null=True)
    billing_state_province = models.CharField(max_length=100, blank=True, null=True)
    billing_zip_postal_code = models.CharField(max_length=20, blank=True, null=True)

    # Shipping Address
    shipping_country = models.CharField(max_length=100, blank=True, null=True)
    shipping_street = models.CharField(max_length=255, blank=True, null=True)
    shipping_city = models.CharField(max_length=100, blank=True, null=True)
    shipping_state_province = models.CharField(max_length=100, blank=True, null=True)
    shipping_zip_postal_code = models.CharField(max_length=20, blank=True, null=True)

    # Audit fields
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accounts_created',
        db_column='created_by',
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='accounts_updated',
        db_column='updated_by',
    )

    objects = models.Manager()

    # Meta & dunder methods
    class Meta:
        app_label = 'accounts'  # Keep the original app label for compatibility
        db_table = 'account'
        verbose_name = 'Account'
        verbose_name_plural = 'Accounts'
        ordering = ['account_name']
        indexes = [
            models.Index(fields=['owner'], name='idx_account_owner'),
            models.Index(fields=['created_at'], name='idx_account_created'),
            models.Index(fields=['account_name'], name='idx_account_name'),
            models.Index(fields=['industry'], name='idx_account_industry'),
        ]
        constraints = [
            models.UniqueConstraint(
                Lower('account_name'),
                name='unique_account_name_per_schema'
            ),
        ]

    def __str__(self) -> str:  # pragma: no cover
        return f"{self.account_name} (#{self.account_id})"
