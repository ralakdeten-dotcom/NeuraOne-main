from django.contrib import admin
from .models import Email, EmailComment


@admin.register(Email)
class EmailAdmin(admin.ModelAdmin):
    """Admin interface for Email model"""
    
    list_display = [
        'id', 'subject', 'email_address', 'direction', 'status', 'priority',
        'contact_display_name', 'email_date', 'email_time', 'created_by', 'is_active'
    ]
    list_filter = [
        'direction', 'status', 'priority', 'is_active', 'email_date',
        'follow_up_required', 'created_at'
    ]
    search_fields = [
        'subject', 'content', 'email_address', 'contact_name',
        'message_id', 'thread_id'
    ]
    readonly_fields = [
        'id', 'created_at', 'updated_at', 'contact_display_name',
        'contact_display_email', 'email_datetime'
    ]
    
    fieldsets = (
        ('Email Information', {
            'fields': (
                'subject', 'content', 'email_address', 'direction', 
                'status', 'priority'
            )
        }),
        ('Contact Information', {
            'fields': (
                'contact', 'contact_name', 'contact_display_name', 
                'contact_display_email'
            )
        }),
        ('Date & Time', {
            'fields': (
                'email_date', 'email_time', 'email_datetime'
            )
        }),
        ('Additional Information', {
            'fields': (
                'cc_addresses', 'bcc_addresses', 'message_id', 
                'thread_id', 'tags'
            )
        }),
        ('Follow-up', {
            'fields': (
                'follow_up_required', 'follow_up_date', 'follow_up_notes'
            )
        }),
        ('Entity Linking', {
            'fields': (
                'content_type', 'object_id'
            )
        }),
        ('Audit', {
            'fields': (
                'created_by', 'created_at', 'updated_at', 'is_active'
            )
        }),
    )
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'created_by', 'contact', 'content_type'
        )


@admin.register(EmailComment)
class EmailCommentAdmin(admin.ModelAdmin):
    """Admin interface for Email Comment model"""
    
    list_display = [
        'id', 'email', 'author', 'content_preview', 'created_at', 'is_active'
    ]
    list_filter = ['is_active', 'created_at']
    search_fields = ['content', 'email__subject', 'author__email']
    readonly_fields = ['id', 'created_at', 'updated_at']
    
    def content_preview(self, obj):
        """Show first 50 characters of content"""
        return obj.content[:50] + '...' if len(obj.content) > 50 else obj.content
    content_preview.short_description = 'Content Preview'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('email', 'author')