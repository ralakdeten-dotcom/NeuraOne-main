import os
import uuid

from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import connection, models
from django.utils.text import slugify


def attachment_upload_path(instance, filename):
    """
    Generate upload path for attachments with tenant and entity isolation.
    Path format: attachments/{tenant_schema}/{entity_type}/{entity_id}/{uuid}_{filename}
    """
    # Get current tenant schema
    tenant_schema = connection.schema_name if hasattr(connection, 'schema_name') else 'public'

    # Get entity info
    entity_type = instance.content_type.model
    entity_id = instance.object_id

    # Generate unique filename to prevent conflicts
    name, ext = os.path.splitext(filename)
    safe_filename = f"{uuid.uuid4().hex[:8]}_{slugify(name)}{ext}"

    return f"attachments/{tenant_schema}/{entity_type}/{entity_id}/{safe_filename}"


class Attachment(models.Model):
    """
    Generic attachment model that can be linked to any CRM entity.
    Supports both file uploads and external links with multi-tenant architecture.
    """

    # Attachment type choices
    ATTACHMENT_TYPES = (
        ('file', 'File'),
        ('link', 'Link'),
    )

    # Generic foreign key to link to any CRM entity (Account, Contact, Lead, Deal, Product)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        help_text="The type of entity this attachment belongs to"
    )
    object_id = models.PositiveIntegerField(
        help_text="The ID of the entity this attachment belongs to"
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Attachment type
    attachment_type = models.CharField(
        max_length=10,
        choices=ATTACHMENT_TYPES,
        default='file',
        help_text="Type of attachment - file or link"
    )

    # File information (for file attachments)
    file = models.FileField(
        upload_to=attachment_upload_path,
        null=True,
        blank=True,
        help_text="The uploaded file (for file attachments only)"
    )

    # Link information (for link attachments)
    link_url = models.URLField(
        max_length=2000,
        null=True,
        blank=True,
        help_text="External URL (for link attachments only)"
    )

    # Unified metadata (applies to both files and links)
    original_filename = models.CharField(
        max_length=255,
        help_text="Original filename for files or user-provided title for links"
    )
    file_size = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="File size in bytes (for files only)"
    )
    content_type_header = models.CharField(
        max_length=100,
        null=True,
        blank=True,
        help_text="MIME type of the file (for files only)"
    )

    # Metadata
    description = models.TextField(
        blank=True,
        help_text="Optional description of the attachment"
    )

    # Audit fields
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='uploaded_attachments',
        help_text="User who uploaded this attachment"
    )
    uploaded_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the attachment was uploaded"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the attachment was last updated"
    )

    # Status
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this attachment is active"
    )

    objects = models.Manager()

    class Meta:
        app_label = 'attachments'
        db_table = 'attachment'
        verbose_name = 'Attachment'
        verbose_name_plural = 'Attachments'
        ordering = ['-uploaded_at']
        indexes = [
            models.Index(fields=['content_type', 'object_id'], name='idx_attachment_content'),
            models.Index(fields=['uploaded_by'], name='idx_attachment_uploader'),
            models.Index(fields=['uploaded_at'], name='idx_attachment_uploaded'),
            models.Index(fields=['is_active'], name='idx_attachment_active'),
            models.Index(fields=['content_type_header'], name='idx_attachment_mime'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(file_size__gt=0) | models.Q(file_size__isnull=True),
                name='attachment_file_size_positive'
            ),
            models.CheckConstraint(
                check=(
                    models.Q(attachment_type='file', file__isnull=False, file__gt='', link_url__isnull=True) |
                    models.Q(attachment_type='link', link_url__isnull=False, link_url__gt='',
                            file__isnull=True) |
                    models.Q(attachment_type='link', link_url__isnull=False, link_url__gt='',
                            file='')
                ),
                name='attachment_type_consistency'
            ),
        ]

    def save(self, *args, **kwargs):
        """Override save to ensure constraint compliance."""
        # Ensure file field is truly None for link attachments
        if self.attachment_type == 'link':
            self.file = None
            self.file_size = None
            self.content_type_header = None
        elif self.attachment_type == 'file':
            self.link_url = None

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.original_filename} ({self.content_object})"

    @property
    def file_extension(self):
        """Get file extension from original filename"""
        return os.path.splitext(self.original_filename)[1].lower()

    @property
    def is_image(self):
        """Check if attachment is an image"""
        image_extensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']
        return self.file_extension in image_extensions

    @property
    def is_document(self):
        """Check if attachment is a document"""
        doc_extensions = ['.pdf', '.doc', '.docx', '.txt', '.rtf', '.odt']
        return self.file_extension in doc_extensions

    @property
    def file_size_human(self):
        """Return human-readable file size or domain for links"""
        if self.attachment_type == 'link' and self.link_url:
            from urllib.parse import urlparse
            try:
                domain = urlparse(self.link_url).netloc
                return domain if domain else 'External Link'
            except:
                return 'External Link'

        if not self.file_size:
            return 'Unknown size'

        size = self.file_size
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    def delete(self, *args, **kwargs):
        """Override delete to remove file from storage"""
        if self.file and os.path.isfile(self.file.path):
            os.remove(self.file.path)
        super().delete(*args, **kwargs)
