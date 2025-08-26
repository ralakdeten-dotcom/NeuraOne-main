from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.db.models import Count

from .models import InventorySettings
from .serializers import InventorySettingsSerializer, LocationsStatusSerializer
from services.inventory.items.models import Location, ItemLocation, Item


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def inventory_settings(request):
    """
    Get or update inventory settings for the organization.
    """
    settings = InventorySettings.get_settings()
    
    if request.method == 'GET':
        serializer = InventorySettingsSerializer(settings)
        return Response(serializer.data)
    
    elif request.method == 'PUT':
        serializer = InventorySettingsSerializer(settings, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Inventory settings updated successfully',
                'settings': serializer.data
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@transaction.atomic
def enable_locations(request):
    """
    Enable multi-location inventory tracking for the organization.
    Creates a default primary location if none exists.
    """
    settings = InventorySettings.get_settings()
    
    if settings.locations_enabled:
        return Response({
            'locations_enabled': True,
            'message': 'Locations are already enabled for this organization'
        }, status=status.HTTP_200_OK)
    
    # Enable locations
    settings.locations_enabled = True
    settings.save()
    
    # Check if any locations exist
    location_count = Location.objects.count()
    
    # Create default location if none exists
    if location_count == 0:
        default_location = Location.objects.create(
            location_name='Primary Location',
            type='general',
            is_primary=True,
            status='active',
            street_address1='',
            city='',
            state='',
            country='',
            is_all_users_selected=True
        )
        
        # Initialize ItemLocation for existing items with stock
        items_with_stock = Item.objects.filter(stock_on_hand__gt=0)
        for item in items_with_stock:
            ItemLocation.objects.create(
                item=item,
                location=default_location,
                location_stock_on_hand=item.stock_on_hand,
                location_available_stock=item.available_stock,
                location_actual_available_stock=item.actual_available_stock,
                is_primary=True
            )
        
        return Response({
            'locations_enabled': True,
            'message': 'Locations have been enabled successfully',
            'total_locations': 1,
            'active_locations': 1,
            'items_with_locations': items_with_stock.count(),
            'default_location_created': True,
            'default_location_id': default_location.location_id
        }, status=status.HTTP_200_OK)
    
    # Locations already exist, just enable the feature
    active_locations = Location.objects.filter(status='active').count()
    items_with_locations = Item.objects.filter(item_locations__isnull=False).distinct().count()
    
    return Response({
        'locations_enabled': True,
        'message': 'Locations have been enabled successfully',
        'total_locations': location_count,
        'active_locations': active_locations,
        'items_with_locations': items_with_locations,
        'default_location_created': False
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def disable_locations(request):
    """
    Disable multi-location inventory tracking for the organization.
    Stock levels remain intact but location-specific tracking is disabled.
    """
    settings = InventorySettings.get_settings()
    
    if not settings.locations_enabled:
        return Response({
            'locations_enabled': False,
            'message': 'Locations are already disabled for this organization'
        }, status=status.HTTP_200_OK)
    
    # Get statistics before disabling
    location_count = Location.objects.count()
    active_locations = Location.objects.filter(status='active').count()
    items_with_locations = Item.objects.filter(item_locations__isnull=False).distinct().count()
    
    # Disable locations
    settings.locations_enabled = False
    settings.save()
    
    return Response({
        'locations_enabled': False,
        'message': 'Locations have been disabled successfully. Location data is preserved.',
        'total_locations': location_count,
        'active_locations': active_locations,
        'items_with_locations': items_with_locations,
        'note': 'Location data has been preserved and will be available when locations are re-enabled'
    }, status=status.HTTP_200_OK)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def locations_status(request):
    """
    Get the current status of location settings and statistics.
    """
    settings = InventorySettings.get_settings()
    
    response_data = {
        'locations_enabled': settings.locations_enabled,
        'message': 'Locations are enabled' if settings.locations_enabled else 'Locations are disabled'
    }
    
    if settings.locations_enabled:
        # Add statistics when locations are enabled
        response_data.update({
            'total_locations': Location.objects.count(),
            'active_locations': Location.objects.filter(status='active').count(),
            'items_with_locations': Item.objects.filter(item_locations__isnull=False).distinct().count(),
            'primary_location': None
        })
        
        # Get primary location if exists
        primary = Location.objects.filter(is_primary=True).first()
        if primary:
            response_data['primary_location'] = {
                'location_id': primary.location_id,
                'location_name': primary.location_name,
                'type': primary.type
            }
    
    return Response(response_data, status=status.HTTP_200_OK)