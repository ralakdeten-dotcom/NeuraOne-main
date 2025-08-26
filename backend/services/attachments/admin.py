from django.contrib import admin

from .models import Attachment


@admin.register(Attachment)
class AttachmentAdmin(admin.ModelAdmin):
    list_display = [
        'original_filename',
        'content_type',
        'object_id',
        'file_size_human',
        'uploaded_by',
        'uploaded_at',
        'is_active'
    ]
    list_filter = [
        'content_type',
        'content_type_header',
        'is_active',
        'uploaded_at',
    ]
    search_fields = [
        'original_filename',
        'description',
        'uploaded_by__email',
        'uploaded_by__first_name',
        'uploaded_by__last_name',
    ]
    readonly_fields = [
        'file_size',
        'content_type_header',
        'file_extension',
        'is_image',
        'is_document',
        'uploaded_at',
        'updated_at',
    ]
    raw_id_fields = ['uploaded_by']

    fieldsets = (
        ('File Information', {
            'fields': (
                'file',
                'original_filename',
                'file_size',
                'content_type_header',
                'file_extension',
                'is_image',
                'is_document',
            )
        }),
        ('Entity Relationship', {
            'fields': (
                'content_type',
                'object_id',
            )
        }),
        ('Metadata', {
            'fields': (
                'description',
                'is_active',
            )
        }),
        ('Audit Information', {
            'fields': (
                'uploaded_by',
                'uploaded_at',
                'updated_at',
            ),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        """Attachments should be created through the API, not admin."""
        return False

    def get_queryset(self, request):
        """Only show attachments for the current tenant."""
        return super().get_queryset(request).select_related(
            'uploaded_by',
            'content_type'
        )
