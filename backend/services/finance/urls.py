from django.urls import include, path

urlpatterns = [
    path('estimates/', include('services.finance.estimates.urls')),
    path('sales-orders/', include('services.finance.sales_orders.urls')),
    path('invoices/', include('services.finance.invoices.urls')),
    path('', include('services.finance.accounting.urls')),
    path('', include('services.finance.customers.urls')),
]
