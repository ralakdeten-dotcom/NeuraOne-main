from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ItemViewSet, ItemGroupViewSet, LocationViewSet,
    CustomFieldViewSet, ItemDetailViewSet
)

router = DefaultRouter()
router.register(r'items', ItemViewSet, basename='item')
router.register(r'item-groups', ItemGroupViewSet, basename='itemgroup')
router.register(r'locations', LocationViewSet, basename='location')
router.register(r'custom-fields', CustomFieldViewSet, basename='customfield')
router.register(r'itemdetails', ItemDetailViewSet, basename='itemdetail')

app_name = 'items'

urlpatterns = [
    path('', include(router.urls)),
]