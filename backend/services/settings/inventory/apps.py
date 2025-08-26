from django.apps import AppConfig


class InventorySettingsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'services.settings.inventory'
    label = 'inventory_settings'