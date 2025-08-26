from django.apps import AppConfig


class SalesOrdersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'services.finance.sales_orders'
    label = 'sales_orders'
    verbose_name = 'Sales Orders'