from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import ProductViewSet

# Create router and register viewset
router = DefaultRouter()
router.register(r'', ProductViewSet, basename='product')

urlpatterns = [
    path('', include(router.urls)),
]
