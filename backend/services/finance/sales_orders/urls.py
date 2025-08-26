from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import SalesOrderViewSet, SalesOrderLineItemViewSet

router = DefaultRouter()
# Register line-items first to avoid conflicts with the empty string pattern
router.register(r'line-items', SalesOrderLineItemViewSet, basename='salesorderlineitem')
router.register(r'', SalesOrderViewSet, basename='salesorder')

urlpatterns = [
    path('', include(router.urls)),
]