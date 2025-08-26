from django.apps import AppConfig


class AuthConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'core.auth'
    label = 'core_auth'  # Use a different label to avoid conflicts with Django's auth
    verbose_name = 'Core Authentication'
