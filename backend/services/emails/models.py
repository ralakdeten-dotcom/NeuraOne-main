from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey, GenericRelation
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone


class Email(models.Model):
    """
    Email logging model for tracking email communications.
    Supports multi-tenant architecture with contact linking and attachment support.
    """

    # Direction choices
    DIRECTION_CHOICES = [
        ('inbound', 'Received'),
        ('outbound', 'Sent'),
        ('draft', 'Draft'),
    ]

    # Status choices
    STATUS_CHOICES = [
        ('sent', 'Sent'),
        ('received', 'Received'),
        ('read', 'Read'),
        ('replied', 'Replied'),
        ('forwarded', 'Forwarded'),
        ('draft', 'Draft'),
        ('failed', 'Failed'),
    ]

    # Priority choices
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Core email fields
    subject = models.CharField(
        max_length=255,
        help_text="Email subject line"
    )
    content = models.TextField(
        help_text="Email content/body"
    )
    
    # Email details
    email_address = models.EmailField(
        help_text="From/To email address (depending on direction)"
    )
    direction = models.CharField(
        max_length=10,
        choices=DIRECTION_CHOICES,
        help_text="Email direction (inbound/outbound/draft)"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='sent',
        help_text="Email status"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Email priority level"
    )

    # Contact relationship - link to CRM contact
    contact = models.ForeignKey(
        'contacts.Contact',
        on_delete=models.CASCADE,
        related_name='emails',
        null=True,
        blank=True,
        help_text="Contact this email is associated with"
    )
    
    # Alternative: If no specific contact, store contact info directly
    contact_name = models.CharField(
        max_length=255,
        blank=True,
        help_text="Contact name (if not linked to CRM contact)"
    )

    # Date/time fields
    email_date = models.DateField(
        default=timezone.now,
        help_text="Date of the email"
    )
    email_time = models.TimeField(
        default=timezone.now,
        help_text="Time of the email"
    )

    # Additional email metadata
    cc_addresses = models.TextField(
        blank=True,
        help_text="CC email addresses (comma-separated)"
    )
    bcc_addresses = models.TextField(
        blank=True,
        help_text="BCC email addresses (comma-separated)"
    )
    message_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Original email message ID"
    )
    thread_id = models.CharField(
        max_length=255,
        blank=True,
        help_text="Email thread/conversation ID"
    )

    # User relationships (tenant-aware)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_emails',
        help_text="User who logged this email"
    )

    # Generic foreign key to link to any entity (optional)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The type of entity this email is related to (optional)"
    )
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="The ID of the entity this email is related to (optional)"
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Attachments - Generic relation
    attachments = GenericRelation(
        'attachments.Attachment',
        content_type_field='content_type',
        object_id_field='object_id'
    )

    # Audit fields
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the email record was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the email record was last updated"
    )

    # Additional metadata
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Email tags/categories"
    )
    
    # Follow-up information
    follow_up_required = models.BooleanField(
        default=False,
        help_text="Whether this email requires follow-up"
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
        help_text="Whether this email record is active"
    )

    objects = models.Manager()

    class Meta:
        app_label = 'emails'
        db_table = 'email'
        verbose_name = 'Email'
        verbose_name_plural = 'Emails'
        ordering = ['-email_date', '-email_time', '-created_at']
        indexes = [
            models.Index(fields=['direction'], name='idx_email_direction'),
            models.Index(fields=['status'], name='idx_email_status'),
            models.Index(fields=['priority'], name='idx_email_priority'),
            models.Index(fields=['created_by'], name='idx_email_creator'),
            models.Index(fields=['contact'], name='idx_email_contact'),
            models.Index(fields=['email_date'], name='idx_email_date'),
            models.Index(fields=['email_time'], name='idx_email_time'),
            models.Index(fields=['created_at'], name='idx_email_created'),
            models.Index(fields=['content_type', 'object_id'], name='idx_email_content'),
            models.Index(fields=['is_active'], name='idx_email_active'),
            models.Index(fields=['follow_up_required'], name='idx_email_followup'),
            models.Index(fields=['follow_up_date'], name='idx_email_followup_date'),
            models.Index(fields=['email_address'], name='idx_email_address'),
            models.Index(fields=['subject'], name='idx_email_subject'),
            models.Index(fields=['thread_id'], name='idx_email_thread'),
        ]
        constraints = [
            models.CheckConstraint(
                check=(
                    models.Q(contact__isnull=False) |
                    (models.Q(contact_name__isnull=False) & ~models.Q(contact_name=''))
                ),
                name='email_contact_required'
            ),
        ]

    def save(self, *args, **kwargs):
        """Override save to handle email date/time defaults."""
        # If email_date or email_time are not set, use current date/time
        if not self.email_date:
            self.email_date = timezone.now().date()
        if not self.email_time:
            self.email_time = timezone.now().time()
            
        super().save(*args, **kwargs)

    def __str__(self):
        contact_info = self.contact.full_name if self.contact else self.contact_name
        entity_info = f" ({self.content_object})" if self.content_object else ""
        return f"{self.subject} - {contact_info} - {self.get_direction_display()}{entity_info}"

    @property
    def contact_display_name(self):
        """Get display name for the contact"""
        if self.contact:
            return self.contact.full_name
        return self.contact_name or 'Unknown Contact'

    @property
    def contact_display_email(self):
        """Get display email for the contact"""
        if self.contact:
            return self.contact.email
        return self.email_address

    @property
    def email_datetime(self):
        """Combine email_date and email_time into datetime"""
        if self.email_date and self.email_time:
            return timezone.datetime.combine(self.email_date, self.email_time)
        return None

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

    @property
    def cc_list(self):
        """Get CC addresses as list"""
        if not self.cc_addresses:
            return []
        return [email.strip() for email in self.cc_addresses.split(',') if email.strip()]

    @property
    def bcc_list(self):
        """Get BCC addresses as list"""
        if not self.bcc_addresses:
            return []
        return [email.strip() for email in self.bcc_addresses.split(',') if email.strip()]

    def can_edit(self, user):
        """Check if user can edit this email"""
        return user == self.created_by

    def can_delete(self, user):
        """Check if user can delete this email"""
        return user == self.created_by


class EmailComment(models.Model):
    """
    Comments/notes on emails for additional information and follow-ups.
    """
    
    email = models.ForeignKey(
        Email,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text="The email this comment belongs to"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='email_comments',
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
        app_label = 'emails'
        db_table = 'email_comment'
        verbose_name = 'Email Comment'
        verbose_name_plural = 'Email Comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['email'], name='idx_emailcomment_email'),
            models.Index(fields=['author'], name='idx_emailcomment_author'),
            models.Index(fields=['created_at'], name='idx_emailcomment_created'),
            models.Index(fields=['is_active'], name='idx_emailcomment_active'),
        ]

    def __str__(self):
        return f"Comment by {self.author.email} on {self.email.subject}"

    def can_edit(self, user):
        """Check if user can edit this comment"""
        return user == self.author