from django.urls import include, path

app_name = 'crm'

urlpatterns = [
    path('accounts/', include('services.crm.accounts.urls')),
    path('contacts/', include('services.crm.contacts.urls')),
    path('leads/', include('services.crm.leads.urls')),
    path('opportunities/', include('services.crm.deals.urls')),  # Note: keeping API endpoint as 'opportunities' for backward compatibility
]
