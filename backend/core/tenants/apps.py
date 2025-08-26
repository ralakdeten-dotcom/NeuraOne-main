from django.apps import AppConfig


class TenantsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core.tenants'
    label = 'tenants'  # This is important for model references
    verbose_name = 'Tenants'
