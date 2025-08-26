from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, F
from django.shortcuts import get_object_or_404
from decimal import Decimal
import logging

from .models import (
    Item, ItemGroup, Location, ItemLocation,
    CustomField, ItemCustomFieldValue
)
from services.settings.inventory.models import InventorySettings
from .serializers import (
    ItemListSerializer, ItemDetailSerializer,
    ItemCreateSerializer, ItemUpdateSerializer,
    ItemGroupSerializer, LocationSerializer,
    ItemLocationSerializer, CustomFieldSerializer,
    ItemCustomFieldValueSerializer, StockAdjustmentSerializer
)

logger = logging.getLogger(__name__)


class ItemGroupViewSet(viewsets.ModelViewSet):
    """ViewSet for ItemGroup CRUD operations"""
    queryset = ItemGroup.objects.all()
    serializer_class = ItemGroupSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'group_id'
    
    def get_queryset(self):
        """Filter by status if provided"""
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset.order_by('group_name')
    
    @action(detail=True, methods=['post'])
    def active(self, request, group_id=None):
        """Mark item group as active"""
        group = self.get_object()
        group.status = 'active'
        group.save()
        # Also activate all items in this group
        Item.objects.filter(group_id=group).update(status='active')
        return Response({'message': 'The item group and all its items have been marked as active.'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def inactive(self, request, group_id=None):
        """Mark item group as inactive"""
        group = self.get_object()
        group.status = 'inactive'
        group.save()
        # Also deactivate all items in this group
        Item.objects.filter(group_id=group).update(status='inactive')
        return Response({'message': 'The item group and all its items have been marked as inactive.'}, status=status.HTTP_200_OK)


class LocationViewSet(viewsets.ModelViewSet):
    """ViewSet for Location CRUD operations"""
    queryset = Location.objects.all()
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'location_id'
    
    def list(self, request, *args, **kwargs):
        """Check if locations are enabled before listing"""
        if not InventorySettings.is_locations_enabled():
            return Response({
                'error': 'Locations are not enabled for this organization',
                'message': 'Please enable locations in inventory settings first'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().list(request, *args, **kwargs)
    
    def create(self, request, *args, **kwargs):
        """Check if locations are enabled before creating"""
        if not InventorySettings.is_locations_enabled():
            return Response({
                'error': 'Locations are not enabled for this organization',
                'message': 'Please enable locations in inventory settings first'
            }, status=status.HTTP_403_FORBIDDEN)
        return super().create(request, *args, **kwargs)
    
    def get_queryset(self):
        """Filter by status if provided"""
        queryset = super().get_queryset()
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset.order_by('-is_primary', 'location_name')
    
    @action(detail=True, methods=['post'])
    def active(self, request, location_id=None):
        """Mark location as active"""
        location = self.get_object()
        location.status = 'active'
        location.save()
        return Response({'message': 'The location has been marked as active.'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def inactive(self, request, location_id=None):
        """Mark location as inactive"""
        location = self.get_object()
        location.status = 'inactive'
        location.save()
        return Response({'message': 'The location has been marked as inactive.'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def markasprimary(self, request, location_id=None):
        """Mark location as primary"""
        # First unset any existing primary location
        Location.objects.filter(is_primary=True).update(is_primary=False)
        # Set this location as primary
        location = self.get_object()
        location.is_primary = True
        location.save()
        return Response({'message': 'The location has been marked as primary.'}, status=status.HTTP_200_OK)


class ItemViewSet(viewsets.ModelViewSet):
    """ViewSet for Item CRUD operations"""
    queryset = Item.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'item_id'
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ItemListSerializer
        elif self.action == 'create':
            return ItemCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ItemUpdateSerializer
        else:
            return ItemDetailSerializer
    
    def get_queryset(self):
        """Apply filters and search"""
        queryset = super().get_queryset()
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(sku__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Status filter
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Item type filter
        item_type = self.request.query_params.get('item_type')
        if item_type:
            queryset = queryset.filter(item_type=item_type)
        
        # Product type filter
        product_type = self.request.query_params.get('product_type')
        if product_type:
            queryset = queryset.filter(product_type=product_type)
        
        # Group filter
        group_id = self.request.query_params.get('group_id')
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        
        # Vendor filter
        vendor_id = self.request.query_params.get('vendor_id')
        if vendor_id:
            queryset = queryset.filter(vendor_id=vendor_id)
        
        # Low stock filter
        low_stock = self.request.query_params.get('low_stock')
        if low_stock and low_stock.lower() == 'true':
            queryset = queryset.filter(stock_on_hand__lt=F('reorder_level'))
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_time')
        valid_orderings = ['name', '-name', 'sku', '-sku', 'created_time', '-created_time', 'rate', '-rate']
        if ordering in valid_orderings:
            queryset = queryset.order_by(ordering)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set created_by field"""
        serializer.save(created_by=self.request.user)
    
    def perform_update(self, serializer):
        """Set updated_by field"""
        serializer.save(updated_by=self.request.user)
    
    def destroy(self, request, *args, **kwargs):
        """Soft delete - set status to inactive"""
        instance = self.get_object()
        instance.status = 'inactive'
        instance.save()
        return Response({'message': 'Item deactivated successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def active(self, request, item_id=None):
        """Set item status to active"""
        item = self.get_object()
        item.status = 'active'
        item.save()
        return Response({'message': 'Item activated successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def inactive(self, request, item_id=None):
        """Set item status to inactive"""
        item = self.get_object()
        item.status = 'inactive'
        item.save()
        return Response({'message': 'Item deactivated successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['delete'])
    def image(self, request, item_id=None):
        """Remove item image"""
        item = self.get_object()
        item.image_id = None
        item.image_name = None
        item.image_type = None
        item.save()
        return Response({'message': 'Item image removed successfully'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'])
    def stock(self, request, item_id=None):
        """Get stock across all locations"""
        item = self.get_object()
        locations = ItemLocation.objects.filter(item=item)
        serializer = ItemLocationSerializer(locations, many=True)
        
        return Response({
            'item_id': item.item_id,
            'item_name': item.name,
            'sku': item.sku,
            'total_stock_on_hand': item.stock_on_hand,
            'total_available_stock': item.available_stock,
            'total_actual_available_stock': item.actual_available_stock,
            'reorder_level': item.reorder_level,
            'is_low_stock': item.is_low_stock,
            'locations': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='adjust-stock')
    def adjust_stock(self, request, item_id=None):
        """Manual stock adjustment"""
        item = self.get_object()
        serializer = StockAdjustmentSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                location = None
                if serializer.validated_data.get('location_id'):
                    location = Location.objects.get(location_id=serializer.validated_data['location_id'])
                
                item.adjust_stock(
                    adjustment_type=serializer.validated_data['adjustment_type'],
                    quantity=serializer.validated_data['quantity'],
                    reason=serializer.validated_data.get('reason'),
                    location=location
                )
                
                return Response({
                    'message': 'Stock adjusted successfully',
                    'new_stock_on_hand': item.stock_on_hand,
                    'new_available_stock': item.available_stock
                }, status=status.HTTP_200_OK)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        """Get items below reorder level"""
        queryset = self.get_queryset().filter(stock_on_hand__lt=F('reorder_level'))
        serializer = ItemListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get', 'put'], url_path='customfields')
    def customfields(self, request, item_id=None):
        """Get or update item's custom field values"""
        item = self.get_object()
        
        if request.method == 'GET':
            # Get item's custom field values
            custom_values = ItemCustomFieldValue.objects.filter(item=item)
            serializer = ItemCustomFieldValueSerializer(custom_values, many=True)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            # Update custom field values
            custom_fields_data = request.data
            
            updated_fields = []
            errors = []
            
            for field_name, value in custom_fields_data.items():
                try:
                    custom_field = CustomField.objects.get(field_name=field_name)
                    custom_value, created = ItemCustomFieldValue.objects.update_or_create(
                        item=item,
                        custom_field=custom_field,
                        defaults={'value': str(value)}
                    )
                    updated_fields.append(field_name)
                except CustomField.DoesNotExist:
                    errors.append(f"Custom field '{field_name}' does not exist")
                except Exception as e:
                    errors.append(f"Error updating '{field_name}': {str(e)}")
            
            if errors:
                return Response({
                    'updated_fields': updated_fields,
                    'errors': errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            return Response({
                'message': 'Custom fields updated successfully',
                'updated_fields': updated_fields
            }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get', 'put'], url_path='sales-info')
    def sales_info(self, request, item_id=None):
        """Get or update item's sales information"""
        item = self.get_object()
        
        if request.method == 'GET':
            from .serializers import SalesInformationSerializer
            serializer = SalesInformationSerializer(item)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            # Update sales information fields
            data = request.data
            updated_fields = []
            
            try:
                # Update selling price
                if 'selling_price' in data:
                    item.rate = Decimal(str(data['selling_price']))
                    updated_fields.append('selling_price')
                
                # Update sales account
                if 'sales_account_id' in data:
                    if data['sales_account_id']:
                        from services.finance.accounting.models import ChartOfAccount
                        account = ChartOfAccount.objects.get(account_id=data['sales_account_id'])
                        item.account_id = account
                    else:
                        item.account_id = None
                    updated_fields.append('sales_account')
                
                # Update sales description
                if 'sales_description' in data:
                    item.sales_description = data['sales_description']
                    updated_fields.append('sales_description')
                
                if updated_fields:
                    item.save()
                    return Response({
                        'message': 'Sales information updated successfully',
                        'updated_fields': updated_fields
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'message': 'No fields to update'
                    }, status=status.HTTP_200_OK)
                    
            except ChartOfAccount.DoesNotExist:
                return Response({'error': 'Invalid sales account ID'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get', 'put'], url_path='purchase-info')
    def purchase_info(self, request, item_id=None):
        """Get or update item's purchase information"""
        item = self.get_object()
        
        if request.method == 'GET':
            from .serializers import PurchaseInformationSerializer
            serializer = PurchaseInformationSerializer(item)
            return Response(serializer.data)
        
        elif request.method == 'PUT':
            # Update purchase information fields
            data = request.data
            updated_fields = []
            
            try:
                # Update cost price
                if 'cost_price' in data:
                    item.purchase_rate = Decimal(str(data['cost_price']))
                    updated_fields.append('cost_price')
                
                # Update purchase account
                if 'purchase_account_id' in data:
                    if data['purchase_account_id']:
                        from services.finance.accounting.models import ChartOfAccount
                        account = ChartOfAccount.objects.get(account_id=data['purchase_account_id'])
                        item.purchase_account_id = account
                    else:
                        item.purchase_account_id = None
                    updated_fields.append('purchase_account')
                
                # Update purchase description
                if 'purchase_description' in data:
                    item.purchase_description = data['purchase_description']
                    updated_fields.append('purchase_description')
                
                # Update preferred vendor
                if 'vendor_id' in data:
                    if data['vendor_id']:
                        from services.finance.customers.models import FinanceContact
                        vendor = FinanceContact.objects.get(
                            contact_id=data['vendor_id'],
                            contact_type__in=['vendor', 'customer_and_vendor']
                        )
                        item.vendor_id = vendor
                    else:
                        item.vendor_id = None
                    updated_fields.append('preferred_vendor')
                
                if updated_fields:
                    item.save()
                    return Response({
                        'message': 'Purchase information updated successfully',
                        'updated_fields': updated_fields
                    }, status=status.HTTP_200_OK)
                else:
                    return Response({
                        'message': 'No fields to update'
                    }, status=status.HTTP_200_OK)
                    
            except ChartOfAccount.DoesNotExist:
                return Response({'error': 'Invalid purchase account ID'}, status=status.HTTP_400_BAD_REQUEST)
            except FinanceContact.DoesNotExist:
                return Response({'error': 'Invalid vendor ID or vendor not found'}, status=status.HTTP_400_BAD_REQUEST)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class ItemDetailViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for bulk item details fetch"""
    queryset = Item.objects.all()
    serializer_class = ItemDetailSerializer
    permission_classes = [IsAuthenticated]
    
    def list(self, request, *args, **kwargs):
        """Bulk fetch item details by comma-separated IDs"""
        item_ids = request.query_params.get('item_ids', '')
        
        if not item_ids:
            return Response({'error': 'item_ids parameter is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Parse comma-separated IDs
        id_list = [id.strip() for id in item_ids.split(',') if id.strip()]
        
        if not id_list:
            return Response({'error': 'No valid item IDs provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Fetch items
        items = Item.objects.filter(item_id__in=id_list)
        serializer = self.get_serializer(items, many=True)
        
        return Response({
            'requested_ids': id_list,
            'found_count': items.count(),
            'items': serializer.data
        })


class CustomFieldViewSet(viewsets.ModelViewSet):
    """ViewSet for CustomField CRUD operations"""
    queryset = CustomField.objects.all()
    serializer_class = CustomFieldSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'customfield_id'
    
    def get_queryset(self):
        """Order by display_order"""
        return super().get_queryset().order_by('display_order', 'field_name')