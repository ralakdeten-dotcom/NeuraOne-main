from django.conf import settings
from django.db import models


class Contact(models.Model):
    contact_id = models.AutoField(primary_key=True)

    # Tenant isolation is handled by schema, no FK needed

    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts',
        db_column='account_id',
    )

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    title = models.CharField(max_length=100, blank=True, null=True)

    description = models.TextField(blank=True, null=True)

    email = models.EmailField(max_length=255, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    mailing_street = models.CharField(max_length=255, blank=True, null=True)
    mailing_city = models.CharField(max_length=100, blank=True, null=True)
    mailing_state_province = models.CharField(max_length=100, blank=True, null=True)
    mailing_country = models.CharField(max_length=100, blank=True, null=True)
    postal_code = models.CharField(max_length=20, blank=True, null=True)

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='owned_contacts',
        db_column='owner_id',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts_created',
        db_column='created_by',
    )

    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='contacts_updated',
        db_column='updated_by',
    )

    objects = models.Manager()

    class Meta:
        app_label = 'contacts'  # Keep the original app label
        db_table = 'contact'
        verbose_name = 'Contact'
        verbose_name_plural = 'Contacts'
        ordering = ['last_name', 'first_name']
        indexes = [
            models.Index(fields=['account'], name='idx_contact_account'),
            models.Index(fields=['owner'], name='idx_contact_owner'),
            models.Index(fields=['created_at'], name='idx_contact_created'),
            models.Index(fields=['last_name'], name='idx_contact_lastname'),
            models.Index(fields=['email'], name='idx_contact_email'),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['email'],
                name='unique_contact_email_per_schema'
            ),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.email})"
