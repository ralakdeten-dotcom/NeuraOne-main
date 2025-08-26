from django.urls import include, path

urlpatterns = [
    path('products/', include('services.inventory.products.urls')),
    path('pricelists/', include('services.inventory.pricelists.urls')),
    path('', include('services.inventory.items.urls')),
]