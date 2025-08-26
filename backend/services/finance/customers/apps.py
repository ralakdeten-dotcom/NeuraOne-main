from django.apps import AppConfig


class CustomersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'services.finance.customers'
    label = 'customers'
    verbose_name = 'Customers'
