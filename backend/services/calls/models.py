from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Call(models.Model):
    """
    Call logging model for tracking phone calls and communications.
    Supports multi-tenant architecture with contact linking and attachment support.
    """

    # Direction choices
    DIRECTION_CHOICES = [
        ('inbound', 'Inbound'),
        ('outbound', 'Outbound'),
    ]

    # Status choices (for call status)
    STATUS_CHOICES = [
        ('logged', 'Logged'),
        ('scheduled', 'Scheduled'),
    ]

    # Priority choices
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Core call fields
    title = models.CharField(
        max_length=255,
        help_text="Call purpose/title"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed call description/notes"
    )

    # Call details
    direction = models.CharField(
        max_length=10,
        choices=DIRECTION_CHOICES,
        help_text="Call direction (inbound/outbound)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='logged',
        help_text="Call outcome status"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Call priority level"
    )

    # Contact relationship - link to CRM contact
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.CASCADE,
        related_name='calls',
        null=True,
        blank=True,
        help_text="Contact this call is associated with"
    )

    # Alternative: If no specific contact, store contact info directly
    contact_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Contact name (if not linked to CRM contact)"
    )
    contact_phone = models.CharField(
        max_length=20,
        blank=True,
        help_text="Contact phone number"
    )
    contact_email = models.EmailField(
        blank=True,
        help_text="Contact email address"
    )

    # Date/time fields
    call_date = models.DateField(
        default=timezone.now,
        help_text="Date of the call"
    )
    call_time = models.TimeField(
        default=timezone.now,
        help_text="Time of the call"
    )

    # Call duration in minutes
    duration = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Call duration in minutes"
    )

    # User relationships (tenant-aware)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_calls',
        help_text="User who logged this call"
    )

    # Generic foreign key to link to any entity (optional)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The type of entity this call is related to (optional)"
    )
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="The ID of the entity this call is related to (optional)"
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Attachments (call recordings, etc.) - Generic relation
    attachments = GenericRelation(
        'attachments.Attachment',
        content_type_field='content_type',
        object_id_field='object_id'
    )

    # Audit fields
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the call record was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the call record was last updated"
    )

    # Additional metadata
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Call tags/categories"
    )

    # Follow-up information
    follow_up_required = models.BooleanField(
        default=False,
        help_text="Whether this call requires follow-up"
    )
    follow_up_date = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When to follow up (if required)"
    )
    follow_up_notes = models.TextField(
        blank=True,
        help_text="Follow-up notes and action items"
    )

    # Status management
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this call record is active"
    )

    objects = models.Manager()

    class Meta:
        app_label = 'calls'
        db_table = 'call'
        verbose_name = 'Call'
        verbose_name_plural = 'Calls'
        ordering = ['-call_date', '-call_time', '-created_at']
        indexes = [
            models.Index(fields=['direction'], name='idx_call_direction'),
            models.Index(fields=['status'], name='idx_call_status'),
            models.Index(fields=['priority'], name='idx_call_priority'),
            models.Index(fields=['created_by'], name='idx_call_creator'),
            models.Index(fields=['contact'], name='idx_call_contact'),
            models.Index(fields=['call_date'], name='idx_call_date'),
            models.Index(fields=['call_time'], name='idx_call_time'),
            models.Index(fields=['created_at'], name='idx_call_created'),
            models.Index(fields=['content_type', 'object_id'], name='idx_call_content'),
            models.Index(fields=['is_active'], name='idx_call_active'),
            models.Index(fields=['follow_up_required'], name='idx_call_followup'),
            models.Index(fields=['follow_up_date'], name='idx_call_followup_date'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(duration__gt=0) | models.Q(duration__isnull=True),
                name='call_duration_positive'
            ),
            models.CheckConstraint(
                check=(
                    models.Q(contact__isnull=False) |
                    (models.Q(contact_name__isnull=False) & ~models.Q(contact_name=''))
                ),
                name='call_contact_required'
            ),
        ]

    def save(self, *args, **kwargs):
        """Override save to handle call date/time defaults."""
        # If call_date or call_time are not set, use current date/time
        if not self.call_date:
            self.call_date = timezone.now().date()
        if not self.call_time:
            self.call_time = timezone.now().time()

        super().save(*args, **kwargs)

    def __str__(self):
        contact_info = self.contact.full_name if self.contact else self.contact_name
        entity_info = f" ({self.content_object})" if self.content_object else ""
        return f"{self.title} - {contact_info} - {self.get_direction_display()}{entity_info}"

    @property
    def contact_display_name(self):
        """Get display name for the contact"""
        if self.contact:
            return self.contact.full_name
        return self.contact_name or 'Unknown Contact'

    @property
    def contact_display_phone(self):
        """Get display phone for the contact"""
        if self.contact:
            return self.contact.phone
        return self.contact_phone

    @property
    def contact_display_email(self):
        """Get display email for the contact"""
        if self.contact:
            return self.contact.email
        return self.contact_email

    @property
    def call_datetime(self):
        """Combine call_date and call_time into datetime"""
        if self.call_date and self.call_time:
            return timezone.datetime.combine(self.call_date, self.call_time)
        return None

    @property
    def duration_display(self):
        """Format duration for display"""
        if not self.duration:
            return "N/A"
        if self.duration < 60:
            return f"{self.duration} min"
        hours = self.duration // 60
        minutes = self.duration % 60
        if minutes == 0:
            return f"{hours}h"
        return f"{hours}h {minutes}m"

    @property
    def entity_type(self):
        """Get the entity type name"""
        return self.content_type.model if self.content_type else None

    @property
    def entity_id(self):
        """Get the entity ID"""
        return self.object_id

    @property
    def is_overdue_followup(self):
        """Check if follow-up is overdue"""
        if not self.follow_up_required or not self.follow_up_date:
            return False
        return timezone.now() > self.follow_up_date

    def can_edit(self, user):
        """Check if user can edit this call"""
        return user == self.created_by

    def can_delete(self, user):
        """Check if user can delete this call"""
        return user == self.created_by


class CallComment(models.Model):
    """
    Comments/notes on calls for additional information and follow-ups.
    """

    call = models.ForeignKey(
        Call,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text="The call this comment belongs to"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='call_comments',
        help_text="User who wrote this comment"
    )
    content = models.TextField(
        help_text="Comment content"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the comment was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the comment was last updated"
    )
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this comment is active"
    )

    objects = models.Manager()

    class Meta:
        app_label = 'calls'
        db_table = 'call_comment'
        verbose_name = 'Call Comment'
        verbose_name_plural = 'Call Comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['call'], name='idx_callcomment_call'),
            models.Index(fields=['author'], name='idx_callcomment_author'),
            models.Index(fields=['created_at'], name='idx_callcomment_created'),
            models.Index(fields=['is_active'], name='idx_callcomment_active'),
        ]

    def __str__(self):
        return f"Comment by {self.author.email} on {self.call.title}"

    def can_edit(self, user):
        """Check if user can edit this comment"""
        return user == self.author
