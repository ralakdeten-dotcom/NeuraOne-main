from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import Meeting, MeetingComment


class MeetingCommentSerializer(serializers.ModelSerializer):
    """Serializer for meeting comments"""
    author_name = serializers.CharField(source='author.get_full_name', read_only=True)
    author_email = serializers.CharField(source='author.email', read_only=True)
    
    class Meta:
        model = MeetingComment
        fields = [
            'id', 'content', 'author', 'author_name', 'author_email',
            'created_at', 'updated_at', 'is_active'
        ]
        read_only_fields = ['id', 'author', 'author_name', 'author_email', 'created_at', 'updated_at']


class MeetingSerializer(serializers.ModelSerializer):
    """Main serializer for Meeting model with full functionality"""
    
    # Dynamic serial number field
    serial_number = serializers.SerializerMethodField()
    
    # Read-only fields for user information
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    created_by_email = serializers.CharField(source='created_by.email', read_only=True)
    
    # Contact information (read-only computed fields)
    contact_display_name = serializers.CharField(read_only=True)
    contact_display_phone = serializers.CharField(read_only=True)
    contact_display_email = serializers.CharField(read_only=True)
    
    # Entity relationship fields
    entity_type = serializers.CharField(read_only=True)
    entity_id = serializers.IntegerField(source='object_id', read_only=True)
    
    # Computed fields
    meeting_datetime = serializers.DateTimeField(read_only=True)
    duration_display = serializers.CharField(read_only=True)
    is_overdue_followup = serializers.BooleanField(read_only=True)
    
    # Display fields
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    
    # Comments (nested)
    comments = MeetingCommentSerializer(many=True, read_only=True)
    comment_count = serializers.IntegerField(source='comments.count', read_only=True)
    
    # Attachment count
    attachment_count = serializers.IntegerField(source='attachments.count', read_only=True)
    
    def get_serial_number(self, obj):
        """Calculate dynamic serial number based on meeting position in ordered list within the same context"""
        # Filter meetings by the same context as the current meeting
        queryset_filter = {'is_active': True}
        
        # If meeting is linked to an entity, only count meetings for the same entity
        if obj.content_type and obj.object_id:
            queryset_filter.update({
                'content_type': obj.content_type,
                'object_id': obj.object_id
            })
        else:
            # If meeting is standalone, only count standalone meetings
            queryset_filter.update({
                'content_type__isnull': True
            })
        
        # Get meetings in the same context ordered by meeting date/time, then creation date
        active_meetings = obj.__class__.objects.filter(**queryset_filter).order_by('-meeting_date', '-meeting_time', '-created_at')
        
        # Find the position of current meeting (1-based indexing)
        for index, meeting in enumerate(active_meetings, 1):
            if meeting.id == obj.id:
                return index
        
        # Fallback: return meeting ID if not found (shouldn't happen)
        return obj.id
    
    class Meta:
        model = Meeting
        fields = [
            'id', 'serial_number', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display',
            'contact', 'contact_name', 'contact_phone', 'contact_email',
            'contact_display_name', 'contact_display_phone', 'contact_display_email',
            'meeting_date', 'meeting_time', 'meeting_datetime', 'duration', 'duration_display',
            'created_by', 'created_by_name', 'created_by_email',
            'content_type', 'object_id', 'entity_type', 'entity_id',
            'follow_up_required', 'follow_up_date', 'follow_up_notes',
            'tags', 'created_at', 'updated_at', 'is_active',
            'is_overdue_followup', 'comments', 'comment_count', 'attachment_count'
        ]
        read_only_fields = [
            'id', 'created_by', 'created_by_name', 'created_by_email',
            'contact_display_name', 'contact_display_phone', 'contact_display_email',
            'entity_type', 'entity_id', 'meeting_datetime', 'duration_display',
            'created_at', 'updated_at', 'is_overdue_followup',
            'status_display', 'priority_display',
            'comments', 'comment_count', 'attachment_count', 'serial_number'
        ]

    def create(self, validated_data):
        """Override create to set created_by from request user"""
        validated_data['created_by'] = self.context['request'].user
        return super().create(validated_data)


class MeetingCreateSerializer(serializers.ModelSerializer):
    """Simplified serializer for meeting creation"""
    
    # Dynamic serial number field
    serial_number = serializers.SerializerMethodField()
    
    # Optional entity linking
    entity_type = serializers.CharField(required=False, allow_blank=True)
    entity_id = serializers.IntegerField(required=False, allow_null=True)
    
    # Entity type mapping for frontend-backend compatibility
    ENTITY_TYPE_MAPPING = {
        'deal': 'deal',  # Frontend uses 'deal', backend model is also 'deal'
    }
    
    def _get_model_name(self, entity_type):
        """Convert frontend entity type to backend model name"""
        return self.ENTITY_TYPE_MAPPING.get(entity_type.lower(), entity_type.lower())
    
    def get_serial_number(self, obj):
        """Calculate dynamic serial number based on meeting position in ordered list within the same context"""
        # Filter meetings by the same context as the current meeting
        queryset_filter = {'is_active': True}
        
        # If meeting is linked to an entity, only count meetings for the same entity
        if obj.content_type and obj.object_id:
            queryset_filter.update({
                'content_type': obj.content_type,
                'object_id': obj.object_id
            })
        else:
            # If meeting is standalone, only count standalone meetings
            queryset_filter.update({
                'content_type__isnull': True
            })
        
        # Get meetings in the same context ordered by meeting date/time, then creation date
        active_meetings = obj.__class__.objects.filter(**queryset_filter).order_by('-meeting_date', '-meeting_time', '-created_at')
        
        # Find the position of current meeting (1-based indexing)
        for index, meeting in enumerate(active_meetings, 1):
            if meeting.id == obj.id:
                return index
        
        # Fallback: return meeting ID if not found (shouldn't happen)
        return obj.id
    
    class Meta:
        model = Meeting
        fields = [
            'id', 'serial_number', 'title', 'description', 'status', 'priority',
            'contact', 'contact_name', 'contact_phone', 'contact_email',
            'meeting_date', 'meeting_time', 'duration',
            'follow_up_required', 'follow_up_date', 'follow_up_notes',
            'tags', 'entity_type', 'entity_id'
        ]
        read_only_fields = ['id', 'serial_number']

    def validate(self, data):
        """Validate meeting data and entity linking"""
        # Validate entity linking if provided
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
                model_name = self._get_model_name(entity_type)
                content_type = ContentType.objects.get(model=model_name)
                data['content_type'] = content_type
            except ContentType.DoesNotExist:
                raise serializers.ValidationError(f"Invalid entity_type: {entity_type}")
            
            # Set object_id from entity_id
            data['object_id'] = entity_id
        
        # Validate that we have contact information (either linked contact or contact details)
        contact = data.get('contact')
        contact_name = data.get('contact_name', '').strip()
        
        if not contact and not contact_name:
            raise serializers.ValidationError(
                "Either contact must be linked or contact_name must be provided"
            )
        
        # If follow-up is required, follow_up_date should be provided
        follow_up_required = data.get('follow_up_required', False)
        follow_up_date = data.get('follow_up_date')
        
        if follow_up_required and not follow_up_date:
            raise serializers.ValidationError(
                "follow_up_date is required when follow_up_required is True"
            )
            
        return data

    def create(self, validated_data):
        """Override create to handle entity linking and set created_by"""
        # Remove custom fields that don't belong to the model
        entity_type = validated_data.pop('entity_type', None)
        entity_id = validated_data.pop('entity_id', None)
        
        # Set created_by from request user
        validated_data['created_by'] = self.context['request'].user
        
        return super().create(validated_data)


class MeetingUpdateSerializer(serializers.ModelSerializer):
    """Serializer for meeting updates with limited fields"""
    
    class Meta:
        model = Meeting
        fields = [
            'title', 'description', 'status', 'priority',
            'contact', 'contact_name', 'contact_phone', 'contact_email',
            'meeting_date', 'meeting_time', 'duration',
            'follow_up_required', 'follow_up_date', 'follow_up_notes',
            'tags', 'is_active'
        ]

    def validate(self, data):
        """Validate meeting update data"""
        # Validate that we have contact information (either linked contact or contact details)
        contact = data.get('contact', self.instance.contact if self.instance else None)
        contact_name = data.get('contact_name', self.instance.contact_name if self.instance else '').strip()
        
        if not contact and not contact_name:
            raise serializers.ValidationError(
                "Either contact must be linked or contact_name must be provided"
            )
        
        # If follow-up is required, follow_up_date should be provided
        follow_up_required = data.get('follow_up_required', self.instance.follow_up_required if self.instance else False)
        follow_up_date = data.get('follow_up_date', self.instance.follow_up_date if self.instance else None)
        
        if follow_up_required and not follow_up_date:
            raise serializers.ValidationError(
                "follow_up_date is required when follow_up_required is True"
            )
            
        return data


class MeetingListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for meeting lists"""
    
    # Dynamic serial number field
    serial_number = serializers.SerializerMethodField()
    
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    contact_display_name = serializers.CharField(read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    priority_display = serializers.CharField(source='get_priority_display', read_only=True)
    duration_display = serializers.CharField(read_only=True)
    is_overdue_followup = serializers.BooleanField(read_only=True)
    entity_type = serializers.CharField(read_only=True)
    entity_id = serializers.IntegerField(source='object_id', read_only=True)
    
    def get_serial_number(self, obj):
        """Calculate dynamic serial number based on meeting position in ordered list within the same context"""
        # Filter meetings by the same context as the current meeting
        queryset_filter = {'is_active': True}
        
        # If meeting is linked to an entity, only count meetings for the same entity
        if obj.content_type and obj.object_id:
            queryset_filter.update({
                'content_type': obj.content_type,
                'object_id': obj.object_id
            })
        else:
            # If meeting is standalone, only count standalone meetings
            queryset_filter.update({
                'content_type__isnull': True
            })
        
        # Get meetings in the same context ordered by meeting date/time, then creation date
        active_meetings = obj.__class__.objects.filter(**queryset_filter).order_by('-meeting_date', '-meeting_time', '-created_at')
        
        # Find the position of current meeting (1-based indexing)
        for index, meeting in enumerate(active_meetings, 1):
            if meeting.id == obj.id:
                return index
        
        # Fallback: return meeting ID if not found (shouldn't happen)
        return obj.id
    
    class Meta:
        model = Meeting
        fields = [
            'id', 'serial_number', 'title', 'description', 'status', 'status_display',
            'priority', 'priority_display',
            'contact', 'contact_name', 'contact_phone', 'contact_email', 'contact_display_name', 
            'meeting_date', 'meeting_time', 'duration', 'duration_display',
            'created_by_name', 'entity_type', 'entity_id', 'created_at', 'updated_at',
            'is_overdue_followup', 'follow_up_required'
        ]


class MeetingStatsSerializer(serializers.Serializer):
    """Serializer for meeting statistics"""
    
    total_meetings = serializers.IntegerField()
    scheduled_meetings = serializers.IntegerField()
    completed_meetings = serializers.IntegerField()
    cancelled_meetings = serializers.IntegerField()
    meetings_with_followup = serializers.IntegerField()
    overdue_followups = serializers.IntegerField()
    my_meetings = serializers.IntegerField()
    created_by_me = serializers.IntegerField()
    total_duration = serializers.IntegerField()  # in minutes