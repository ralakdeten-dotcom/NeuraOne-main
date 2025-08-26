from django.contrib import admin

from .models import Task, TaskComment


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'status', 'priority', 'created_by',
        'deadline', 'is_overdue', 'created_at'
    ]
    list_filter = [
        'status', 'priority', 'is_active', 'created_at', 'deadline'
    ]
    search_fields = [
        'title', 'description', 'created_by__email'
    ]
    readonly_fields = [
        'created_by', 'created_at', 'updated_at', 'completed_at',
        'is_overdue', 'days_until_deadline', 'entity_type'
    ]
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'status', 'priority')
        }),
        ('Assignment', {
            'fields': ('created_by',)
        }),
        ('Dates', {
            'fields': ('deadline', 'completed_at', 'created_at', 'updated_at')
        }),
        ('Entity Relationship', {
            'fields': ('content_type', 'object_id'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('estimated_hours', 'actual_hours', 'tags'),
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active',)
        })
    )

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'created_by', 'content_type'
        )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = [
        'task', 'author', 'content_preview', 'created_at', 'is_active'
    ]
    list_filter = [
        'is_active', 'created_at'
    ]
    search_fields = [
        'content', 'author__email', 'task__title'
    ]
    readonly_fields = [
        'author', 'created_at', 'updated_at'
    ]

    def content_preview(self, obj):
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'task', 'author'
        )
