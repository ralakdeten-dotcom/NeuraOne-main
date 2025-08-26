from django.apps import AppConfig


class ProductsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "services.inventory.products"
    verbose_name = "Products"
    label = "products"
