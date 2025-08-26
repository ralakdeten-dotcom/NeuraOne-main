from django.apps import AppConfig


class ItemsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'services.inventory.items'
    label = 'inventory_items'
    verbose_name = 'Inventory Items'