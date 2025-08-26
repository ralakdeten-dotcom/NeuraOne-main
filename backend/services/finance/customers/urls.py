from django.urls import include, path, re_path
from rest_framework.routers import DefaultRouter

from .views import CustomerViewSet, VendorViewSet, ContactPersonViewSet

# Create router and register viewsets
router = DefaultRouter()
# API: /api/finance/customers/ - For customers only (contact_type='customer')
router.register(r'customers', CustomerViewSet, basename='customer')
# API: /api/finance/vendors/ - For vendors only (contact_type='vendor')
router.register(r'vendors', VendorViewSet, basename='vendor')

# Zoho-style Contact Person URLs
urlpatterns = [
    # Standard routes
    path('', include(router.urls)),
    
    # Zoho-style Contact Person endpoints
    # POST /api/finance/contacts/contactpersons/
    path('contacts/contactpersons/', 
         ContactPersonViewSet.as_view({'post': 'create'}), 
         name='contactperson-create'),
    
    # POST /api/finance/contacts/contactpersons/{contact_person_id}/primary/
    re_path(r'^contacts/contactpersons/(?P<pk>[^/.]+)/primary/$',
            ContactPersonViewSet.as_view({'post': 'mark_primary'}),
            name='contactperson-mark-primary'),
    
    # PUT, DELETE /api/finance/contacts/contactpersons/{contact_person_id}/
    re_path(r'^contacts/contactpersons/(?P<pk>[^/.]+)/$',
            ContactPersonViewSet.as_view({
                'put': 'update',
                'delete': 'destroy'
            }),
            name='contactperson-update-delete'),
    
    # GET /api/finance/contacts/{contact_id}/contactpersons/{contact_person_id}/
    re_path(r'^contacts/(?P<contact_id>[^/.]+)/contactpersons/(?P<pk>[^/.]+)/$',
            ContactPersonViewSet.as_view({'get': 'retrieve'}),
            name='contactperson-detail'),
    
    # GET /api/finance/contacts/{contact_id}/contactpersons/
    re_path(r'^contacts/(?P<contact_id>[^/.]+)/contactpersons/$',
            ContactPersonViewSet.as_view({'get': 'list'}),
            name='contactperson-list'),
]
