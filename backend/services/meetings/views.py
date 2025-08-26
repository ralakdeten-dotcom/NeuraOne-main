from django.contrib.contenttypes.models import ContentType
from django.db.models import Q, Count, Sum, F
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.tenants.permissions import HasTenantPermission, IsTenantUser
from .models import Meeting, MeetingComment
from .serializers import (
    MeetingSerializer, MeetingCreateSerializer, MeetingUpdateSerializer, 
    MeetingListSerializer, MeetingCommentSerializer, MeetingStatsSerializer
)


class MeetingListCreateView(generics.ListCreateAPIView):
    """
    List all meetings or create a new meeting.
    Supports filtering, searching, and ordering.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']
    
    # Entity type mapping for frontend-backend compatibility
    ENTITY_TYPE_MAPPING = {
        'deal': 'deal',  # Frontend uses 'deal', backend model is also 'deal'
    }
    
    def _get_model_name(self, entity_type):
        """Convert frontend entity type to backend model name"""
        return self.ENTITY_TYPE_MAPPING.get(entity_type.lower(), entity_type.lower())
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MeetingCreateSerializer
        return MeetingListSerializer
    
    def get_queryset(self):
        """Filter meetings based on query parameters"""
        queryset = Meeting.objects.filter(is_active=True).select_related(
            'created_by', 'content_type', 'contact'
        )
        
        # Filter parameters
        status_filter = self.request.query_params.get('status')
        priority_filter = self.request.query_params.get('priority')
        created_by = self.request.query_params.get('created_by')
        contact_id = self.request.query_params.get('contact')
        entity_type = self.request.query_params.get('entity_type')
        entity_id = self.request.query_params.get('entity_id')
        follow_up = self.request.query_params.get('follow_up')
        overdue_followup = self.request.query_params.get('overdue_followup')
        date_from = self.request.query_params.get('date_from')
        date_to = self.request.query_params.get('date_to')
        search = self.request.query_params.get('search')
        
        # Apply filters
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        if created_by:
            if created_by == 'me':
                queryset = queryset.filter(created_by=self.request.user)
            else:
                queryset = queryset.filter(created_by_id=created_by)
        
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)
        
        # Entity filtering
        if entity_type and entity_id:
            try:
                model_name = self._get_model_name(entity_type)
                content_type = ContentType.objects.get(model=model_name)
                queryset = queryset.filter(content_type=content_type, object_id=entity_id)
            except ContentType.DoesNotExist:
                queryset = queryset.none()
        elif entity_type == 'standalone':
            # Standalone meetings (not linked to any entity)
            queryset = queryset.filter(content_type__isnull=True)
        
        # Follow-up filters
        if follow_up == 'required':
            queryset = queryset.filter(follow_up_required=True)
        elif follow_up == 'none':
            queryset = queryset.filter(follow_up_required=False)
        
        if overdue_followup == 'true':
            queryset = queryset.filter(
                follow_up_required=True,
                follow_up_date__lt=timezone.now()
            )
        
        # Date range filtering
        if date_from:
            queryset = queryset.filter(meeting_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(meeting_date__lte=date_to)
        
        # Search
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(contact_name__icontains=search) |
                Q(contact_phone__icontains=search) |
                Q(contact_email__icontains=search) |
                Q(tags__icontains=search)
            )
        
        # Default ordering: most recent meetings first
        return queryset.order_by('-meeting_date', '-meeting_time', '-created_at')


class MeetingDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a meeting.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return MeetingUpdateSerializer
        return MeetingSerializer
    
    def get_queryset(self):
        return Meeting.objects.filter(is_active=True).select_related(
            'created_by', 'content_type', 'contact'
        ).prefetch_related('comments__author', 'attachments')
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to add better error handling"""
        try:
            instance = self.get_object()
            
            # Check if user can delete this meeting
            if instance.created_by != request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete meetings you created.")
            
            # Perform soft delete
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Meeting.DoesNotExist:
            return Response(
                {'error': 'Meeting not found or already deleted'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete meeting: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of actual deletion"""
        instance.is_active = False
        instance.save()


class MyMeetingsView(generics.ListAPIView):
    """
    List meetings created by the current user.
    """
    serializer_class = MeetingListSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        """Get meetings created by current user"""
        queryset = Meeting.objects.filter(
            created_by=self.request.user,
            is_active=True
        ).select_related('created_by', 'content_type', 'contact')
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        # Filter by priority if provided
        priority_filter = self.request.query_params.get('priority')
        if priority_filter:
            queryset = queryset.filter(priority=priority_filter)
        
        return queryset.order_by('-meeting_date', '-meeting_time', '-created_at')


class EntityMeetingsView(generics.ListCreateAPIView):
    """
    List meetings for a specific entity or create a new meeting linked to an entity.
    URL pattern: /meetings/{entity_type}/{entity_id}/
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']
    
    # Entity type mapping for frontend-backend compatibility
    ENTITY_TYPE_MAPPING = {
        'deal': 'deal',  # Frontend uses 'deal', backend model is also 'deal'
    }
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return MeetingCreateSerializer
        return MeetingListSerializer
    
    def _get_model_name(self, entity_type):
        """Convert frontend entity type to backend model name"""
        return self.ENTITY_TYPE_MAPPING.get(entity_type.lower(), entity_type.lower())
    
    def get_queryset(self):
        """Get meetings for specific entity"""
        entity_type = self.kwargs.get('entity_type')
        entity_id = self.kwargs.get('entity_id')
        
        try:
            model_name = self._get_model_name(entity_type)
            content_type = ContentType.objects.get(model=model_name)
            return Meeting.objects.filter(
                content_type=content_type,
                object_id=entity_id,
                is_active=True
            ).select_related('created_by', 'contact').order_by('-meeting_date', '-meeting_time')
        except ContentType.DoesNotExist:
            return Meeting.objects.none()
    
    def perform_create(self, serializer):
        """Create meeting linked to entity"""
        entity_type = self.kwargs.get('entity_type')
        entity_id = self.kwargs.get('entity_id')
        
        try:
            model_name = self._get_model_name(entity_type)
            content_type = ContentType.objects.get(model=model_name)
            
            # Validate that the entity actually exists
            model_class = content_type.model_class()
            try:
                entity_obj = model_class.objects.get(pk=entity_id)
            except model_class.DoesNotExist:
                from rest_framework import serializers
                raise serializers.ValidationError(f"{entity_type.title()} with ID {entity_id} does not exist")
            
            serializer.save(
                created_by=self.request.user,
                content_type=content_type,
                object_id=entity_id
            )
            
        except ContentType.DoesNotExist:
            from rest_framework import serializers
            raise serializers.ValidationError(f"Invalid entity type: {entity_type}")


class ContactMeetingsView(generics.ListAPIView):
    """
    List meetings for a specific contact.
    URL pattern: /meetings/contact/{contact_id}/
    """
    serializer_class = MeetingListSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']
    
    def get_queryset(self):
        """Get meetings for specific contact"""
        contact_id = self.kwargs.get('contact_id')
        return Meeting.objects.filter(
            contact_id=contact_id,
            is_active=True
        ).select_related('created_by').order_by('-meeting_date', '-meeting_time')


class MeetingCommentListCreateView(generics.ListCreateAPIView):
    """
    List comments for a meeting or create a new comment.
    """
    serializer_class = MeetingCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        meeting_id = self.kwargs.get('meeting_id')
        return MeetingComment.objects.filter(
            meeting_id=meeting_id,
            is_active=True
        ).select_related('author')
    
    def perform_create(self, serializer):
        meeting_id = self.kwargs.get('meeting_id')
        serializer.save(author=self.request.user, meeting_id=meeting_id)


class MeetingCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a meeting comment.
    """
    serializer_class = MeetingCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        return MeetingComment.objects.filter(is_active=True).select_related('author')
    
    def perform_destroy(self, instance):
        """Soft delete comment"""
        instance.is_active = False
        instance.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def meeting_stats(request):
    """
    Get meeting statistics for the current user and overall.
    """
    user = request.user
    now = timezone.now()
    
    # Base queryset for active meetings
    base_qs = Meeting.objects.filter(is_active=True)
    
    # Calculate statistics
    stats = {
        'total_meetings': base_qs.count(),
        'scheduled_meetings': base_qs.filter(status='scheduled').count(),
        'completed_meetings': base_qs.filter(status='completed').count(),
        'cancelled_meetings': base_qs.filter(status='cancelled').count(),
        'meetings_with_followup': base_qs.filter(follow_up_required=True).count(),
        'overdue_followups': base_qs.filter(
            follow_up_required=True,
            follow_up_date__lt=now
        ).count(),
        'my_meetings': base_qs.filter(created_by=user).count(),
        'created_by_me': base_qs.filter(created_by=user).count(),
        'total_duration': base_qs.aggregate(
            total=Sum('duration')
        )['total'] or 0,  # Total duration in minutes
    }
    
    serializer = MeetingStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def update_meeting_status(request, pk):
    """
    Update meeting status.
    """
    try:
        meeting = Meeting.objects.get(pk=pk, is_active=True)
        
        # Check if user can edit this meeting
        if not meeting.can_edit(request.user):
            return Response(
                {'error': 'You do not have permission to update this meeting'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        if new_status not in dict(Meeting.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        meeting.status = new_status
        meeting.save()
        
        serializer = MeetingSerializer(meeting)
        return Response(serializer.data)
        
    except Meeting.DoesNotExist:
        return Response(
            {'error': 'Meeting not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def mark_followup_completed(request, pk):
    """
    Mark follow-up as completed by setting follow_up_required to False.
    """
    try:
        meeting = Meeting.objects.get(pk=pk, is_active=True)
        
        # Check if user can edit this meeting
        if not meeting.can_edit(request.user):
            return Response(
                {'error': 'You do not have permission to update this meeting'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        meeting.follow_up_required = False
        meeting.save()
        
        serializer = MeetingSerializer(meeting)
        return Response(serializer.data)
        
    except Meeting.DoesNotExist:
        return Response(
            {'error': 'Meeting not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def upcoming_followups(request):
    """
    Get upcoming follow-ups for the current user.
    """
    user = request.user
    days_ahead = int(request.query_params.get('days', 7))  # Default to 7 days
    
    end_date = timezone.now() + timezone.timedelta(days=days_ahead)
    
    meetings = Meeting.objects.filter(
        created_by=user,
        follow_up_required=True,
        follow_up_date__lte=end_date,
        is_active=True
    ).select_related('contact').order_by('follow_up_date')
    
    serializer = MeetingListSerializer(meetings, many=True)
    return Response(serializer.data)