from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EstimateLineItemViewSet, EstimateViewSet

# Create router and register viewsets
router = DefaultRouter()
# Register line-items first to avoid conflicts with the empty string pattern
router.register(r'line-items', EstimateLineItemViewSet, basename='estimate-line-item')
router.register(r'', EstimateViewSet, basename='estimate')

urlpatterns = [
    path('', include(router.urls)),
]
