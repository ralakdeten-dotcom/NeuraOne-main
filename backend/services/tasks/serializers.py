from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import Task, TaskComment


class TaskCommentSerializer(serializers.ModelSerializer):
    """Serializer for task comments"""
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_email = serializers.CharField(source='author.email', read_only=True)

    class Meta:
        model = TaskComment
        fields = [
            'id', 'content', 'author', 'author_name', 'author_email',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'author', 'author_name', 'author_email', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    """Main serializer for Task model with full functionality"""

    # Dynamic serial number field
    serial_number = serializers.SerializerMethodField()

    # Read-only fields for user information
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)

    # Entity relationship fields
    entity_type = serializers.CharField(read_only=True)
    entity_id = serializers.IntegerField(source='object_id', read_only=True)

    # Computed fields
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_deadline = serializers.IntegerField(read_only=True)

    # Display fields
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    # Comments (nested)
    comments = TaskCommentSerializer(many=True, read_only=True)
    comment_count = serializers.IntegerField(source='comments.count', read_only=True)

    def get_serial_number(self, obj):
        """Calculate dynamic serial number based on task position in ordered list within the same context"""
        # Filter tasks by the same context as the current task
        queryset_filter = {'is_active': True}

        # If task is linked to an entity, only count tasks for the same entity
        if obj.content_type and obj.object_id:
            queryset_filter.update({
                'content_type': obj.content_type,
                'object_id': obj.object_id
            })
        else:
            # If task is standalone, only count standalone tasks
            queryset_filter.update({
                'content_type__isnull': True
            })

        # Get tasks in the same context ordered by creation date
        active_tasks = obj.__class__.objects.filter(**queryset_filter).order_by('created_at')

        # Find the position of current task (1-based indexing)
        for index, task in enumerate(active_tasks, 1):
            if task.id == obj.id:
                return index

        # Fallback: return task ID if not found (shouldn't happen)
        return obj.id

    class Meta:
        model = Task
        fields = [
            'id', 'serial_number', 'title', 'description', 'priority', 'priority_display',
            'status', 'status_display', 'deadline', 'completed_at',
            'created_by', 'created_by_name', 'created_by_email',
            'content_type', 'object_id', 'entity_type', 'entity_id',
            'estimated_hours', 'actual_hours', 'tags',
            'created_at', 'updated_at', 'is_active',
            'is_overdue', 'days_until_deadline',
            'comments', 'comment_count'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_by_name', 'created_by_email',
            'entity_type', 'entity_id',
            'created_at', 'updated_at', 'completed_at',
            'is_overdue', 'days_until_deadline', 'priority_display', 'status_display',
            'comments', 'comment_count', 'serial_number'
        ]

    def create(self, validated_data):
        """Override create to set created_by from request user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class TaskCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for task creation"""

    # Dynamic serial number field
    serial_number = serializers.SerializerMethodField()

    # Optional entity linking
    entity_type = serializers.CharField(required=False, allow_blank=True)
    entity_id = serializers.IntegerField(required=False, allow_null=True)

    def get_serial_number(self, obj):
        """Calculate dynamic serial number based on task position in ordered list within the same context"""
        # Filter tasks by the same context as the current task
        queryset_filter = {'is_active': True}

        # If task is linked to an entity, only count tasks for the same entity
        if obj.content_type and obj.object_id:
            queryset_filter.update({
                'content_type': obj.content_type,
                'object_id': obj.object_id
            })
        else:
            # If task is standalone, only count standalone tasks
            queryset_filter.update({
                'content_type__isnull': True
            })

        # Get tasks in the same context ordered by creation date
        active_tasks = obj.__class__.objects.filter(**queryset_filter).order_by('created_at')

        # Find the position of current task (1-based indexing)
        for index, task in enumerate(active_tasks, 1):
            if task.id == obj.id:
                return index

        # Fallback: return task ID if not found (shouldn't happen)
        return obj.id

    class Meta:
        model = Task
        fields = [
            'id', 'serial_number', 'title', 'description', 'priority', 'status', 'deadline',
            'estimated_hours', 'tags',
            'entity_type', 'entity_id'
        ]
        read_only_fields = ['id', 'serial_number']

    def validate(self, data):
        """Validate entity linking if provided"""
        entity_type = data.get('entity_type')
        entity_id = data.get('entity_id')

        # Both or neither must be provided for entity linking
        if (entity_type and not entity_id) or (entity_id and not entity_type):
            raise serializers.ValidationError(
                "Both entity_type and entity_id must be provided for entity linking"
            )

        # Validate entity_type exists
        if entity_type:
            try:
                content_type = ContentType.objects.get(model=entity_type.lower())
                data['content_type'] = content_type
            except ContentType.DoesNotExist:
                raise serializers.ValidationError(f"Invalid entity_type: {entity_type}")

            # Set object_id from entity_id
            data['object_id'] = entity_id

        return data

    def create(self, validated_data):
        """Override create to handle entity linking and set created_by"""
        # Remove custom fields that don't belong to the model
        entity_type = validated_data.pop('entity_type', None)
        entity_id = validated_data.pop('entity_id', None)

        # Set created_by from request user
        validated_data['created_by'] = self.context['request'].user

        return super().create(validated_data)


class TaskUpdateSerializer(serializers.ModelSerializer):
    """Serializer for task updates with limited fields"""

    class Meta:
        model = Task
        fields = [
            'title', 'description', 'priority', 'status', 'deadline',
            'estimated_hours', 'actual_hours', 'tags', 'is_active'
        ]

    def validate_status(self, value):
        """Validate status transitions"""
        if self.instance and self.instance.status == 'completed' and value != 'completed':
            # Allow reopening completed tasks
            pass
        return value


class TaskListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for task lists"""

    # Dynamic serial number field
    serial_number = serializers.SerializerMethodField()

    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    is_overdue = serializers.BooleanField(read_only=True)
    days_until_deadline = serializers.IntegerField(read_only=True)
    entity_type = serializers.CharField(read_only=True)
    entity_id = serializers.IntegerField(source='object_id', read_only=True)

    def get_serial_number(self, obj):
        """Calculate dynamic serial number based on task position in ordered list within the same context"""
        # Filter tasks by the same context as the current task
        queryset_filter = {'is_active': True}

        # If task is linked to an entity, only count tasks for the same entity
        if obj.content_type and obj.object_id:
            queryset_filter.update({
                'content_type': obj.content_type,
                'object_id': obj.object_id
            })
        else:
            # If task is standalone, only count standalone tasks
            queryset_filter.update({
                'content_type__isnull': True
            })

        # Get tasks in the same context ordered by creation date
        active_tasks = obj.__class__.objects.filter(**queryset_filter).order_by('created_at')

        # Find the position of current task (1-based indexing)
        for index, task in enumerate(active_tasks, 1):
            if task.id == obj.id:
                return index

        # Fallback: return task ID if not found (shouldn't happen)
        return obj.id

    class Meta:
        model = Task
        fields = [
            'id', 'serial_number', 'title', 'description', 'priority', 'priority_display', 'status', 'status_display',
            'deadline', 'created_by_name',
            'entity_type', 'entity_id', 'created_at', 'updated_at',
            'is_overdue', 'days_until_deadline'
        ]


class TaskStatsSerializer(serializers.Serializer):
    """Serializer for task statistics"""

    total_tasks = serializers.IntegerField()
    pending_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    overdue_tasks = serializers.IntegerField()
    high_priority_tasks = serializers.IntegerField()
    my_tasks = serializers.IntegerField()
    created_by_me = serializers.IntegerField()
