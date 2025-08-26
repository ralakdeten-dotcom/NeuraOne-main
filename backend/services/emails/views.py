from django.contrib.contenttypes.models import ContentType
from django.db.models import Q, Count, F
from django.utils import timezone
from rest_framework import generics, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.tenants.permissions import HasTenantPermission, IsTenantUser
from .models import Email, EmailComment
from .serializers import (
    EmailSerializer, EmailCreateSerializer, EmailUpdateSerializer, 
    EmailListSerializer, EmailCommentSerializer, EmailStatsSerializer
)


class EmailListCreateView(generics.ListCreateAPIView):
    """
    List all emails or create a new email.
    Supports filtering, searching, and ordering.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']
    
    # Entity type mapping for frontend-backend compatibility
    ENTITY_TYPE_MAPPING = {
        'deal': 'deal',
        'account': 'account',
        'contact': 'contact',
        'lead': 'lead',
    }
    
    def _get_model_name(self, entity_type):
        """Convert frontend entity type to backend model name"""
        return self.ENTITY_TYPE_MAPPING.get(entity_type.lower(), entity_type.lower())
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EmailCreateSerializer
        return EmailListSerializer
    
    def get_queryset(self):
        """Filter emails based on query parameters"""
        queryset = Email.objects.filter(is_active=True).select_related(
            'created_by', 'content_type', 'contact'
        )
        
        # Filter parameters
        direction_filter = self.request.query_params.get('direction')
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
        if direction_filter:
            queryset = queryset.filter(direction=direction_filter)
        
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
            # Standalone emails (not linked to any entity)
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
            queryset = queryset.filter(email_date__gte=date_from)
        if date_to:
            queryset = queryset.filter(email_date__lte=date_to)
        
        # Search
        if search:
            queryset = queryset.filter(
                Q(subject__icontains=search) |
                Q(content__icontains=search) |
                Q(email_address__icontains=search) |
                Q(contact_name__icontains=search) |
                Q(tags__icontains=search)
            )
        
        # Default ordering: most recent emails first
        return queryset.order_by('-email_date', '-email_time', '-created_at')


class EmailDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an email.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']
    
    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return EmailUpdateSerializer
        return EmailSerializer
    
    def get_queryset(self):
        return Email.objects.filter(is_active=True).select_related(
            'created_by', 'content_type', 'contact'
        ).prefetch_related('comments__author', 'attachments')
    
    def destroy(self, request, *args, **kwargs):
        """Override destroy to add better error handling"""
        try:
            instance = self.get_object()
            
            # Check if user can delete this email
            if instance.created_by != request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete emails you created.")
            
            # Perform soft delete
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)
            
        except Email.DoesNotExist:
            return Response(
                {'error': 'Email not found or already deleted'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete email: {str(e)}'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
    
    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of actual deletion"""
        instance.is_active = False
        instance.save()


class MyEmailsView(generics.ListAPIView):
    """
    List emails created by the current user.
    """
    serializer_class = EmailListSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        """Get emails created by current user"""
        queryset = Email.objects.filter(
            created_by=self.request.user,
            is_active=True
        ).select_related('created_by', 'content_type', 'contact')
        
        # Filter by direction if provided
        direction_filter = self.request.query_params.get('direction')
        if direction_filter:
            queryset = queryset.filter(direction=direction_filter)
        
        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        return queryset.order_by('-email_date', '-email_time', '-created_at')


class EntityEmailsView(generics.ListCreateAPIView):
    """
    List emails for a specific entity or create a new email linked to an entity.
    URL pattern: /emails/{entity_type}/{entity_id}/
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']
    
    # Entity type mapping for frontend-backend compatibility
    ENTITY_TYPE_MAPPING = {
        'deal': 'deal',
        'account': 'account',
        'contact': 'contact',
        'lead': 'lead',
    }
    
    def get_serializer_class(self):
        if self.request.method == 'POST':
            return EmailCreateSerializer
        return EmailListSerializer
    
    def _get_model_name(self, entity_type):
        """Convert frontend entity type to backend model name"""
        return self.ENTITY_TYPE_MAPPING.get(entity_type.lower(), entity_type.lower())
    
    def get_queryset(self):
        """Get emails for specific entity"""
        entity_type = self.kwargs.get('entity_type')
        entity_id = self.kwargs.get('entity_id')
        
        try:
            model_name = self._get_model_name(entity_type)
            content_type = ContentType.objects.get(model=model_name)
            return Email.objects.filter(
                content_type=content_type,
                object_id=entity_id,
                is_active=True
            ).select_related('created_by', 'contact').order_by('-email_date', '-email_time')
        except ContentType.DoesNotExist:
            return Email.objects.none()
    
    def perform_create(self, serializer):
        """Create email linked to entity"""
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


class ContactEmailsView(generics.ListAPIView):
    """
    List emails for a specific contact.
    URL pattern: /emails/contact/{contact_id}/
    """
    serializer_class = EmailListSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']
    
    def get_queryset(self):
        """Get emails for specific contact"""
        contact_id = self.kwargs.get('contact_id')
        return Email.objects.filter(
            contact_id=contact_id,
            is_active=True
        ).select_related('created_by').order_by('-email_date', '-email_time')


class EmailCommentListCreateView(generics.ListCreateAPIView):
    """
    List comments for an email or create a new comment.
    """
    serializer_class = EmailCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        email_id = self.kwargs.get('email_id')
        return EmailComment.objects.filter(
            email_id=email_id,
            is_active=True
        ).select_related('author')
    
    def perform_create(self, serializer):
        email_id = self.kwargs.get('email_id')
        serializer.save(author=self.request.user, email_id=email_id)


class EmailCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete an email comment.
    """
    serializer_class = EmailCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]
    
    def get_queryset(self):
        return EmailComment.objects.filter(is_active=True).select_related('author')
    
    def perform_destroy(self, instance):
        """Soft delete comment"""
        instance.is_active = False
        instance.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def email_stats(request):
    """
    Get email statistics for the current user and overall.
    """
    user = request.user
    now = timezone.now()
    
    # Base queryset for active emails
    base_qs = Email.objects.filter(is_active=True)
    
    # Calculate statistics
    stats = {
        'total_emails': base_qs.count(),
        'sent_emails': base_qs.filter(direction='outbound').count(),
        'received_emails': base_qs.filter(direction='inbound').count(),
        'draft_emails': base_qs.filter(status='draft').count(),
        'emails_with_followup': base_qs.filter(follow_up_required=True).count(),
        'overdue_followups': base_qs.filter(
            follow_up_required=True,
            follow_up_date__lt=now
        ).count(),
        'my_emails': base_qs.filter(created_by=user).count(),
        'created_by_me': base_qs.filter(created_by=user).count(),
    }
    
    serializer = EmailStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def update_email_status(request, pk):
    """
    Update email status.
    """
    try:
        email = Email.objects.get(pk=pk, is_active=True)
        
        # Check if user can edit this email
        if not email.can_edit(request.user):
            return Response(
                {'error': 'You do not have permission to update this email'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        new_status = request.data.get('status')
        if new_status not in dict(Email.STATUS_CHOICES):
            return Response(
                {'error': 'Invalid status value'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        email.status = new_status
        email.save()
        
        serializer = EmailSerializer(email)
        return Response(serializer.data)
        
    except Email.DoesNotExist:
        return Response(
            {'error': 'Email not found'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def mark_followup_completed(request, pk):
    """
    Mark follow-up as completed by setting follow_up_required to False.
    """
    try:
        email = Email.objects.get(pk=pk, is_active=True)
        
        # Check if user can edit this email
        if not email.can_edit(request.user):
            return Response(
                {'error': 'You do not have permission to update this email'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        email.follow_up_required = False
        email.save()
        
        serializer = EmailSerializer(email)
        return Response(serializer.data)
        
    except Email.DoesNotExist:
        return Response(
            {'error': 'Email not found'},
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
    
    emails = Email.objects.filter(
        created_by=user,
        follow_up_required=True,
        follow_up_date__lte=end_date,
        is_active=True
    ).select_related('contact').order_by('follow_up_date')
    
    serializer = EmailListSerializer(emails, many=True)
    return Response(serializer.data)