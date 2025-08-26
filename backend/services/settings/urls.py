from django.urls import path, include

urlpatterns = [
    path('currencies/', include('services.settings.currencies.urls')),
    path('inventory/', include('services.settings.inventory.urls')),
    path('', include('services.settings.taxes.urls')),
]