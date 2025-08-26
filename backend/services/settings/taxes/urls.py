from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaxViewSet, TaxGroupViewSet

router = DefaultRouter()
router.register(r'taxes', TaxViewSet, basename='tax')
router.register(r'taxgroups', TaxGroupViewSet, basename='taxgroup')

urlpatterns = [
    path('', include(router.urls)),
]