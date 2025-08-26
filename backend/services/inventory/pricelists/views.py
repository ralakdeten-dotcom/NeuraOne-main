from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Count
from django.shortcuts import get_object_or_404
from decimal import Decimal
import logging

from .models import PriceBook, PriceBookItem
from .serializers import (
    PriceBookListSerializer, PriceBookDetailSerializer,
    PriceBookCreateSerializer, PriceBookUpdateSerializer,
    PriceBookItemSerializer, ItemPriceCalculationSerializer
)
from services.inventory.items.models import Item

logger = logging.getLogger(__name__)


class PriceBookViewSet(viewsets.ModelViewSet):
    """ViewSet for PriceBook CRUD operations"""
    queryset = PriceBook.objects.all()
    permission_classes = [IsAuthenticated]
    lookup_field = 'pricebook_id'
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return PriceBookListSerializer
        elif self.action == 'create':
            return PriceBookCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PriceBookUpdateSerializer
        else:
            return PriceBookDetailSerializer
    
    def get_queryset(self):
        """Apply filters and search"""
        queryset = super().get_queryset()
        
        # Annotate with items count for per_item type pricebooks
        queryset = queryset.annotate(
            total_items_count=Count('pricebook_items')
        )
        
        # Search functionality
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) |
                Q(description__icontains=search)
            )
        
        # Status filter
        status_param = self.request.query_params.get('status')
        if status_param:
            queryset = queryset.filter(status=status_param)
        
        # Pricebook type filter
        pricebook_type = self.request.query_params.get('pricebook_type')
        if pricebook_type:
            queryset = queryset.filter(pricebook_type=pricebook_type)
        
        # Sales or purchase type filter
        sales_or_purchase_type = self.request.query_params.get('sales_or_purchase_type')
        if sales_or_purchase_type:
            queryset = queryset.filter(sales_or_purchase_type=sales_or_purchase_type)
        
        # Default filter
        is_default = self.request.query_params.get('is_default')
        if is_default is not None:
            queryset = queryset.filter(is_default=is_default.lower() == 'true')
        
        # Currency filter
        currency_id = self.request.query_params.get('currency_id')
        if currency_id:
            queryset = queryset.filter(currency_id=currency_id)
        
        # Ordering
        ordering = self.request.query_params.get('ordering', '-created_time')
        valid_orderings = ['name', '-name', 'created_time', '-created_time', 'status', '-status']
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
        """Hard delete - actually remove from database"""
        instance = self.get_object()
        instance.delete()
        return Response({
            'code': 0,
            'message': 'Price list has been permanently deleted.'
        }, status=status.HTTP_204_NO_CONTENT)
    
    @action(detail=True, methods=['post'])
    def active(self, request, pricebook_id=None):
        """Mark pricebook as active"""
        pricebook = self.get_object()
        pricebook.status = 'active'
        pricebook.save()
        return Response({
            'code': 0,
            'message': 'The price list has been marked active.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'])
    def inactive(self, request, pricebook_id=None):
        """Mark pricebook as inactive"""
        pricebook = self.get_object()
        pricebook.status = 'inactive'
        pricebook.save()
        return Response({
            'code': 0,
            'message': 'The price list has been marked inactive.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='mark-default')
    def mark_default(self, request, pricebook_id=None):
        """Mark pricebook as default (will unmark others of same type)"""
        pricebook = self.get_object()
        pricebook.is_default = True
        pricebook.save()  # The model's save method handles unsetting others
        return Response({
            'code': 0,
            'message': 'The price list has been marked as default.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='unmark-default')
    def unmark_default(self, request, pricebook_id=None):
        """Unmark pricebook as default"""
        pricebook = self.get_object()
        pricebook.is_default = False
        pricebook.save()
        return Response({
            'code': 0,
            'message': 'The price list has been unmarked as default.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['get'], url_path='items')
    def items(self, request, pricebook_id=None):
        """Get all items in this pricebook"""
        pricebook = self.get_object()
        
        if pricebook.pricebook_type != 'per_item':
            return Response({
                'error': 'Items are only available for per-item pricebooks.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        pricebook_items = pricebook.pricebook_items.all()
        serializer = PriceBookItemSerializer(pricebook_items, many=True)
        
        return Response({
            'pricebook_id': pricebook.pricebook_id,
            'pricebook_name': pricebook.name,
            'pricebook_type': pricebook.pricebook_type,
            'total_items': pricebook_items.count(),
            'items': serializer.data
        })
    
    @action(detail=True, methods=['post'], url_path='add-items')
    def add_items(self, request, pricebook_id=None):
        """Add items to a per-item pricebook"""
        pricebook = self.get_object()
        
        if pricebook.pricebook_type != 'per_item':
            return Response({
                'error': 'Items can only be added to per-item pricebooks.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        items_data = request.data.get('items', [])
        if not items_data:
            return Response({
                'error': 'Items data is required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        added_items = []
        errors = []
        
        for item_data in items_data:
            try:
                item_id = item_data.get('item_id')
                pricebook_rate = item_data.get('pricebook_rate')
                
                if not item_id or not pricebook_rate:
                    errors.append('Each item must have item_id and pricebook_rate.')
                    continue
                
                # Check if item exists
                try:
                    item = Item.objects.get(item_id=item_id)
                except Item.DoesNotExist:
                    errors.append(f'Item with ID {item_id} does not exist.')
                    continue
                
                # Check if item is already in pricebook
                if PriceBookItem.objects.filter(pricebook=pricebook, item=item).exists():
                    errors.append(f'Item {item.name} is already in this pricebook.')
                    continue
                
                # Create pricebook item
                pricebook_item = PriceBookItem.objects.create(
                    pricebook=pricebook,
                    item=item,
                    pricebook_rate=Decimal(str(pricebook_rate))
                )
                added_items.append({
                    'pricebook_item_id': pricebook_item.pricebook_item_id,
                    'item_id': item.item_id,
                    'item_name': item.name,
                    'pricebook_rate': pricebook_item.pricebook_rate
                })
                
            except Exception as e:
                errors.append(f'Error processing item: {str(e)}')
        
        return Response({
            'code': 0 if not errors else 1,
            'message': f'Added {len(added_items)} items to pricebook.',
            'added_items': added_items,
            'errors': errors
        }, status=status.HTTP_200_OK if not errors else status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['delete'], url_path='remove-items')
    def remove_items(self, request, pricebook_id=None):
        """Remove items from a per-item pricebook"""
        pricebook = self.get_object()
        
        if pricebook.pricebook_type != 'per_item':
            return Response({
                'error': 'Items can only be removed from per-item pricebooks.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        item_ids = request.data.get('item_ids', [])
        if not item_ids:
            return Response({
                'error': 'Item IDs are required.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Remove items
        removed_count = PriceBookItem.objects.filter(
            pricebook=pricebook,
            item__item_id__in=item_ids
        ).delete()[0]
        
        return Response({
            'code': 0,
            'message': f'Removed {removed_count} items from pricebook.'
        }, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='calculate-price')
    def calculate_price(self, request, pricebook_id=None):
        """Calculate price for an item using this pricebook"""
        pricebook = self.get_object()
        serializer = ItemPriceCalculationSerializer(data=request.data)
        
        if serializer.is_valid():
            try:
                item = Item.objects.get(item_id=serializer.validated_data['item_id'])
                base_price = serializer.validated_data.get('base_price', item.rate)
                
                calculated_price = pricebook.get_item_price(item, base_price)
                
                return Response({
                    'pricebook_id': pricebook.pricebook_id,
                    'pricebook_name': pricebook.name,
                    'item_id': item.item_id,
                    'item_name': item.name,
                    'base_price': base_price,
                    'calculated_price': calculated_price,
                    'pricebook_type': pricebook.pricebook_type,
                    'percentage': pricebook.percentage,
                    'is_increase': pricebook.is_increase,
                    'rounding_type': pricebook.rounding_type
                })
                
            except Item.DoesNotExist:
                return Response({'error': 'Item not found.'}, status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    def list(self, request, *args, **kwargs):
        """Override list to match API specification format"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'code': 0,
            'message': 'success',
            'pricebooks': serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        """Override create to match API specification format"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Get detailed data for response
        instance = serializer.instance
        detail_serializer = PriceBookDetailSerializer(instance)
        
        return Response({
            'code': 0,
            'message': 'Price list has been created.',
            'pricebook': detail_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Override update to match API specification format"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Get detailed data for response
        detail_serializer = PriceBookDetailSerializer(serializer.instance)
        
        return Response({
            'code': 0,
            'message': 'Price list has been updated.',
            'pricebook': detail_serializer.data
        })
    
    def retrieve(self, request, *args, **kwargs):
        """Override retrieve to match API specification format"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        return Response({
            'code': 0,
            'message': 'success',
            'pricebook': serializer.data
        })


class PriceBookItemViewSet(viewsets.ModelViewSet):
    """ViewSet for PriceBookItem CRUD operations"""
    queryset = PriceBookItem.objects.all()
    serializer_class = PriceBookItemSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'pricebook_item_id'
    
    def get_queryset(self):
        """Filter by pricebook if provided"""
        queryset = super().get_queryset()
        
        pricebook_id = self.request.query_params.get('pricebook_id')
        if pricebook_id:
            queryset = queryset.filter(pricebook__pricebook_id=pricebook_id)
        
        item_id = self.request.query_params.get('item_id')
        if item_id:
            queryset = queryset.filter(item__item_id=item_id)
        
        return queryset.order_by('item__name')