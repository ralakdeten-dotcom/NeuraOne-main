from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PriceBookViewSet, PriceBookItemViewSet

router = DefaultRouter()
router.register(r'pricebooks', PriceBookViewSet, basename='pricebook')
router.register(r'pricebook-items', PriceBookItemViewSet, basename='pricebookitem')

app_name = 'pricelists'

urlpatterns = [
    path('', include(router.urls)),
]