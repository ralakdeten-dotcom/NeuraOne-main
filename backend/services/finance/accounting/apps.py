from django.apps import AppConfig


class AccountingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'services.finance.accounting'
    label = 'accounting'
    verbose_name = 'Accounting'
    
    def ready(self):
        from . import admin  # This imports the admin module