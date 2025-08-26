from django.contrib.contenttypes.models import ContentType
from django.db.models import Q
from django.utils import timezone
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from core.tenants.permissions import HasTenantPermission, IsTenantUser

from .models import Task, TaskComment
from .serializers import (
    TaskCommentSerializer,
    TaskCreateSerializer,
    TaskListSerializer,
    TaskSerializer,
    TaskStatsSerializer,
    TaskUpdateSerializer,
)


class TaskListCreateView(generics.ListCreateAPIView):
    """
    List all tasks or create a new task.
    Supports filtering, searching, and ordering.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskCreateSerializer
        return TaskListSerializer

    def get_queryset(self):
        """Filter tasks based on query parameters"""
        queryset = Task.objects.filter(is_active=True).select_related(
            'created_by', 'content_type'
        )

        # Filter parameters
        status_filter = self.request.query_params.get('status')
        priority_filter = self.request.query_params.get('priority')
        created_by = self.request.query_params.get('created_by')
        entity_type = self.request.query_params.get('entity_type')
        entity_id = self.request.query_params.get('entity_id')
        overdue = self.request.query_params.get('overdue')
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

        # Entity filtering
        if entity_type and entity_id:
            try:
                content_type = ContentType.objects.get(model=entity_type.lower())
                queryset = queryset.filter(content_type=content_type, object_id=entity_id)
            except ContentType.DoesNotExist:
                queryset = queryset.none()
        elif entity_type == 'standalone':
            # Standalone tasks (not linked to any entity)
            queryset = queryset.filter(content_type__isnull=True)

        # Overdue filter
        if overdue == 'true':
            queryset = queryset.filter(
                deadline__lt=timezone.now(),
                status='pending'
            )

        # Search
        if search:
            queryset = queryset.filter(
                Q(title__icontains=search) |
                Q(description__icontains=search) |
                Q(tags__icontains=search)
            )

        # Default ordering
        return queryset.order_by('-created_at')


class TaskDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a task.
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']

    def get_serializer_class(self):
        if self.request.method in ['PUT', 'PATCH']:
            return TaskUpdateSerializer
        return TaskSerializer

    def get_queryset(self):
        return Task.objects.filter(is_active=True).select_related(
            'created_by', 'content_type'
        ).prefetch_related('comments__author')

    def destroy(self, request, *args, **kwargs):
        """Override destroy to add better error handling"""
        try:
            instance = self.get_object()

            # Check if user can delete this task (same as can_edit logic)
            if instance.created_by != request.user:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied("You can only delete tasks you created.")

            # Perform soft delete
            self.perform_destroy(instance)
            return Response(status=status.HTTP_204_NO_CONTENT)

        except Task.DoesNotExist:
            return Response(
                {'error': 'Task not found or already deleted'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to delete task: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_destroy(self, instance):
        """Soft delete - mark as inactive instead of actual deletion"""
        instance.is_active = False
        instance.save()


class MyTasksView(generics.ListAPIView):
    """
    List tasks created by the current user.
    """
    serializer_class = TaskListSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]

    def get_queryset(self):
        """Get tasks created by current user"""
        queryset = Task.objects.filter(
            created_by=self.request.user,
            is_active=True
        ).select_related('created_by', 'content_type')

        # Filter by status if provided
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)

        return queryset.order_by('deadline', '-priority', '-created_at')


class EntityTasksView(generics.ListCreateAPIView):
    """
    List tasks for a specific entity or create a new task linked to an entity.
    URL pattern: /tasks/{entity_type}/{entity_id}/
    """
    permission_classes = [permissions.IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'view_customers', 'manage_opportunities']

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return TaskCreateSerializer
        return TaskListSerializer

    def get_queryset(self):
        """Get tasks for specific entity"""
        entity_type = self.kwargs.get('entity_type')
        entity_id = self.kwargs.get('entity_id')

        try:
            content_type = ContentType.objects.get(model=entity_type.lower())
            return Task.objects.filter(
                content_type=content_type,
                object_id=entity_id,
                is_active=True
            ).select_related('created_by')
        except ContentType.DoesNotExist:
            return Task.objects.none()

    def perform_create(self, serializer):
        """Create task linked to entity"""
        entity_type = self.kwargs.get('entity_type')
        entity_id = self.kwargs.get('entity_id')

        try:
            content_type = ContentType.objects.get(model=entity_type.lower())

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


class TaskCommentListCreateView(generics.ListCreateAPIView):
    """
    List comments for a task or create a new comment.
    """
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]

    def get_queryset(self):
        task_id = self.kwargs.get('task_id')
        return TaskComment.objects.filter(
            task_id=task_id,
            is_active=True
        ).select_related('author')

    def perform_create(self, serializer):
        task_id = self.kwargs.get('task_id')
        serializer.save(author=self.request.user, task_id=task_id)


class TaskCommentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update or delete a task comment.
    """
    serializer_class = TaskCommentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]

    def get_queryset(self):
        return TaskComment.objects.filter(is_active=True).select_related('author')

    def perform_destroy(self, instance):
        """Soft delete comment"""
        instance.is_active = False
        instance.save()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def task_stats(request):
    """
    Get task statistics for the current user and overall.
    """
    user = request.user
    now = timezone.now()

    # Base queryset for active tasks
    base_qs = Task.objects.filter(is_active=True)

    # Calculate statistics
    stats = {
        'total_tasks': base_qs.count(),
        'pending_tasks': base_qs.filter(status='pending').count(),
        'completed_tasks': base_qs.filter(status='completed').count(),
        'overdue_tasks': base_qs.filter(
            deadline__lt=now,
            status='pending'
        ).count(),
        'high_priority_tasks': base_qs.filter(
            priority='high',
            status='pending'
        ).count(),
        'my_tasks': base_qs.filter(created_by=user, status='pending').count(),
        'created_by_me': base_qs.filter(created_by=user).count(),
    }

    serializer = TaskStatsSerializer(stats)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def complete_task(request, pk):
    """
    Mark a task as completed.
    """
    try:
        task = Task.objects.get(pk=pk, is_active=True)

        # Check if user can complete this task
        if not task.can_complete(request.user):
            return Response(
                {'error': 'You do not have permission to complete this task'},
                status=status.HTTP_403_FORBIDDEN
            )

        task.status = 'completed'
        task.completed_at = timezone.now()
        task.save()

        serializer = TaskSerializer(task)
        return Response(serializer.data)

    except Task.DoesNotExist:
        return Response(
            {'error': 'Task not found'},
            status=status.HTTP_404_NOT_FOUND
        )


