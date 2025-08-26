from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import InvoiceLineItemViewSet, InvoicePaymentViewSet, InvoiceViewSet

# Create router and register viewsets
router = DefaultRouter()
# Register related resources first to avoid conflicts with the empty string pattern
router.register(r'line-items', InvoiceLineItemViewSet, basename='invoice-line-item')
router.register(r'payments', InvoicePaymentViewSet, basename='invoice-payment')
router.register(r'', InvoiceViewSet, basename='invoice')

urlpatterns = [
    path('', include(router.urls)),
]
