from django.apps import AppConfig


class InvoicesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'services.finance.invoices'
    label = 'invoices'
    verbose_name = 'Invoices'
