from django.contrib import admin

from .models import Call, CallComment


@admin.register(Call)
class CallAdmin(admin.ModelAdmin):
    """Django admin configuration for Call model"""

    list_display = [
        'id', 'title', 'contact_display_name', 'direction', 'status',
        'priority', 'call_date', 'call_time', 'duration_display', 'created_by'
    ]
    list_filter = [
        'direction', 'status', 'priority', 'call_date', 'follow_up_required',
        'is_active', 'created_at'
    ]
    search_fields = [
        'title', 'description', 'contact_name', 'contact_phone', 'contact_email',
        'created_by__email', 'created_by__first_name', 'created_by__last_name'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'call_datetime', 'duration_display',
        'contact_display_name', 'contact_display_phone', 'contact_display_email',
        'entity_type', 'entity_id', 'is_overdue_followup'
    ]

    fieldsets = (
        ('Call Information', {
            'fields': (
                'title', 'description', 'direction', 'status', 'priority'
            )
        }),
        ('Contact Details', {
            'fields': (
                'contact', 'contact_name', 'contact_phone', 'contact_email',
                'contact_display_name', 'contact_display_phone', 'contact_display_email'
            )
        }),
        ('Call Details', {
            'fields': (
                'call_date', 'call_time', 'call_datetime', 'duration', 'duration_display'
            )
        }),
        ('Follow-up', {
            'fields': (
                'follow_up_required', 'follow_up_date', 'follow_up_notes', 'is_overdue_followup'
            )
        }),
        ('Entity Link', {
            'fields': (
                'content_type', 'object_id', 'entity_type', 'entity_id'
            ),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': (
                'tags', 'created_by', 'is_active'
            )
        }),
        ('Timestamps', {
            'fields': (
                'created_at', 'updated_at'
            ),
            'classes': ('collapse',)
        })
    )

    ordering = ['-call_date', '-call_time', '-created_at']
    date_hierarchy = 'call_date'

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related(
            'created_by', 'contact', 'content_type'
        )


@admin.register(CallComment)
class CallCommentAdmin(admin.ModelAdmin):
    """Django admin configuration for CallComment model"""

    list_display = ['id', 'call', 'author', 'content_preview', 'created_at', 'is_active']
    list_filter = ['is_active', 'created_at', 'updated_at']
    search_fields = [
        'content', 'call__title', 'author__email',
        'author__first_name', 'author__last_name'
    ]
    readonly_fields = ['id', 'created_at', 'updated_at']

    fieldsets = (
        ('Comment Information', {
            'fields': ('call', 'author', 'content')
        }),
        ('Status', {
            'fields': ('is_active',)
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        })
    )

    ordering = ['-created_at']

    def content_preview(self, obj):
        """Show preview of comment content"""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'

    def get_queryset(self, request):
        """Optimize queryset with select_related"""
        return super().get_queryset(request).select_related('call', 'author')
