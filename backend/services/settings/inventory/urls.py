from django.urls import path
from . import views

app_name = 'inventory_settings'

urlpatterns = [
    # General inventory settings
    path('', views.inventory_settings, name='inventory-settings'),
    
    # Location management
    path('locations/enable/', views.enable_locations, name='enable-locations'),
    path('locations/disable/', views.disable_locations, name='disable-locations'),
    path('locations/status/', views.locations_status, name='locations-status'),
]