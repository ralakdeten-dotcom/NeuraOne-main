from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.core.validators import MinValueValidator
from django.db import models
from django.utils import timezone


class Meeting(models.Model):
    """
    Meeting logging model for tracking meetings and communications.
    Supports multi-tenant architecture with contact linking and attachment support.
    """

    # Status choices (for meeting status)
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

    # Core meeting fields
    title = models.CharField(
        max_length=255,
        help_text="Meeting purpose/title"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed meeting description/notes"
    )
    
    # Meeting details
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='logged',
        help_text="Meeting status"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Meeting priority level"
    )

    # Contact relationship - link to CRM contact
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.CASCADE,
        related_name='meetings',
        null=True,
        blank=True,
        help_text="Contact this meeting is associated with"
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
    meeting_date = models.DateField(
        default=timezone.now,
        help_text="Date of the meeting"
    )
    meeting_time = models.TimeField(
        default=timezone.now,
        help_text="Time of the meeting"
    )
    
    # Meeting duration in minutes
    duration = models.PositiveIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="Meeting duration in minutes"
    )

    # User relationships (tenant-aware)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_meetings',
        help_text="User who logged this meeting"
    )

    # Generic foreign key to link to any entity (optional)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The type of entity this meeting is related to (optional)"
    )
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="The ID of the entity this meeting is related to (optional)"
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Attachments (meeting recordings, etc.) - Generic relation
    attachments = GenericRelation(
        'attachments.Attachment',
        content_type_field='content_type',
        object_id_field='object_id'
    )

    # Audit fields
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the meeting record was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the meeting record was last updated"
    )

    # Additional metadata
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Meeting tags/categories"
    )
    
    # Follow-up information
    follow_up_required = models.BooleanField(
        default=False,
        help_text="Whether this meeting requires follow-up"
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
        help_text="Whether this meeting record is active"
    )

    objects = models.Manager()

    class Meta:
        app_label = 'meetings'
        db_table = 'meeting'
        verbose_name = 'Meeting'
        verbose_name_plural = 'Meetings'
        ordering = ['-meeting_date', '-meeting_time', '-created_at']
        indexes = [
            models.Index(fields=['status'], name='idx_meeting_status'),
            models.Index(fields=['priority'], name='idx_meeting_priority'),
            models.Index(fields=['created_by'], name='idx_meeting_creator'),
            models.Index(fields=['contact'], name='idx_meeting_contact'),
            models.Index(fields=['meeting_date'], name='idx_meeting_date'),
            models.Index(fields=['meeting_time'], name='idx_meeting_time'),
            models.Index(fields=['created_at'], name='idx_meeting_created'),
            models.Index(fields=['content_type', 'object_id'], name='idx_meeting_content'),
            models.Index(fields=['is_active'], name='idx_meeting_active'),
            models.Index(fields=['follow_up_required'], name='idx_meeting_followup'),
            models.Index(fields=['follow_up_date'], name='idx_meeting_followup_date'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(duration__gt=0) | models.Q(duration__isnull=True),
                name='meeting_duration_positive'
            ),
            models.CheckConstraint(
                check=(
                    models.Q(contact__isnull=False) |
                    (models.Q(contact_name__isnull=False) & ~models.Q(contact_name=''))
                ),
                name='meeting_contact_required'
            ),
        ]

    def save(self, *args, **kwargs):
        """Override save to handle meeting date/time defaults."""
        # If meeting_date or meeting_time are not set, use current date/time
        if not self.meeting_date:
            self.meeting_date = timezone.now().date()
        if not self.meeting_time:
            self.meeting_time = timezone.now().time()
            
        super().save(*args, **kwargs)

    def __str__(self):
        contact_info = self.contact.full_name if self.contact else self.contact_name
        entity_info = f" ({self.content_object})" if self.content_object else ""
        return f"{self.title} - {contact_info} - {self.get_status_display()}{entity_info}"

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
    def meeting_datetime(self):
        """Combine meeting_date and meeting_time into datetime"""
        if self.meeting_date and self.meeting_time:
            return timezone.datetime.combine(self.meeting_date, self.meeting_time)
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
        """Check if user can edit this meeting"""
        return user == self.created_by

    def can_delete(self, user):
        """Check if user can delete this meeting"""
        return user == self.created_by


class MeetingComment(models.Model):
    """
    Comments/notes on meetings for additional information and follow-ups.
    """
    
    meeting = models.ForeignKey(
        Meeting,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text="The meeting this comment belongs to"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='meeting_comments',
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
        app_label = 'meetings'
        db_table = 'meeting_comment'
        verbose_name = 'Meeting Comment'
        verbose_name_plural = 'Meeting Comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['meeting'], name='idx_meetingcomment_meeting'),
            models.Index(fields=['author'], name='idx_meetingcomment_author'),
            models.Index(fields=['created_at'], name='idx_meetingcomment_created'),
            models.Index(fields=['is_active'], name='idx_meetingcomment_active'),
        ]

    def __str__(self):
        return f"Comment by {self.author.email} on {self.meeting.title}"

    def can_edit(self, user):
        """Check if user can edit this comment"""
        return user == self.author