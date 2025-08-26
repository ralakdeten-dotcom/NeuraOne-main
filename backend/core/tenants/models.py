from django.db import models
from django_tenants.models import DomainMixin, TenantMixin


class Client(TenantMixin):
    """
    Tenant model for multi-tenancy support
    """
    name = models.CharField(max_length=100)
    description = models.TextField(blank=True)
    created_on = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    # Default schema_name will be set by django-tenants
    auto_create_schema = True

    class Meta:
        app_label = 'tenants'
        db_table = 'core_client'

    def __str__(self):
        return self.name


class Domain(DomainMixin):
    """
    Domain model for tenant domains
    """
    class Meta:
        app_label = 'tenants'
        db_table = 'core_domain'


class Application(models.Model):
    """
    Represents an application available in the platform
    """
    code = models.CharField(max_length=20, unique=True, help_text="Unique code for the app (e.g., 'crm', 'teaminbox')")
    name = models.CharField(max_length=50, help_text="Display name of the application")
    description = models.TextField(help_text="Description of the application")
    icon = models.CharField(max_length=50, help_text="Icon name or class for the application")
    url_prefix = models.CharField(max_length=20, help_text="URL prefix for the application (e.g., '/crm')")
    is_active = models.BooleanField(default=True, help_text="Whether the application is active")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        app_label = 'tenants'
        db_table = 'core_application'
        ordering = ['name']

    def __str__(self):
        return self.name


class ClientApplication(models.Model):
    """
    Links clients to their subscribed applications
    """
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='applications')
    application = models.ForeignKey(Application, on_delete=models.CASCADE, related_name='clients')
    is_active = models.BooleanField(default=True, help_text="Whether this app is active for this client")
    settings = models.JSONField(default=dict, blank=True, help_text="Client-specific app settings")
    subscribed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        app_label = 'tenants'
        db_table = 'core_clientapplication'
        unique_together = ['client', 'application']
        ordering = ['application__name']

    def __str__(self):
        return f"{self.client.name} - {self.application.name}"
