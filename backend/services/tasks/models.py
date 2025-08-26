from django.conf import settings
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.db import models
from django.utils import timezone


class Task(models.Model):
    """
    Task management model that can be linked to any entity or standalone.
    Supports multi-tenant architecture with user assignment and status tracking.
    """

    # Priority choices
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]

    # Status choices
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
    ]

    # Core task fields
    title = models.CharField(
        max_length=255,
        help_text="Task title/summary"
    )
    description = models.TextField(
        blank=True,
        help_text="Detailed task description"
    )
    priority = models.CharField(
        max_length=10,
        choices=PRIORITY_CHOICES,
        default='medium',
        help_text="Task priority level"
    )
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        help_text="Current task status"
    )

    # Date/time fields
    deadline = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Task deadline (optional)"
    )
    completed_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="When the task was completed"
    )

    # User relationships (tenant-aware)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_tasks',
        help_text="User who created this task"
    )

    # Generic foreign key to link to any entity (optional)
    content_type = models.ForeignKey(
        ContentType,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        help_text="The type of entity this task is related to (optional)"
    )
    object_id = models.PositiveIntegerField(
        null=True,
        blank=True,
        help_text="The ID of the entity this task is related to (optional)"
    )
    content_object = GenericForeignKey('content_type', 'object_id')

    # Audit fields
    created_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the task was created"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        help_text="When the task was last updated"
    )

    # Additional metadata
    estimated_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Estimated hours to complete (optional)"
    )
    actual_hours = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Actual hours spent (optional)"
    )
    tags = models.JSONField(
        default=list,
        blank=True,
        help_text="Task tags/categories"
    )

    # Status management
    is_active = models.BooleanField(
        default=True,
        help_text="Whether this task is active"
    )

    objects = models.Manager()

    class Meta:
        app_label = 'tasks'
        db_table = 'task'
        verbose_name = 'Task'
        verbose_name_plural = 'Tasks'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['status'], name='idx_task_status'),
            models.Index(fields=['priority'], name='idx_task_priority'),
            models.Index(fields=['created_by'], name='idx_task_creator'),
            models.Index(fields=['deadline'], name='idx_task_deadline'),
            models.Index(fields=['created_at'], name='idx_task_created'),
            models.Index(fields=['content_type', 'object_id'], name='idx_task_content'),
            models.Index(fields=['is_active'], name='idx_task_active'),
        ]
        constraints = [
            models.CheckConstraint(
                check=models.Q(estimated_hours__gt=0) | models.Q(estimated_hours__isnull=True),
                name='task_estimated_hours_positive'
            ),
            models.CheckConstraint(
                check=models.Q(actual_hours__gt=0) | models.Q(actual_hours__isnull=True),
                name='task_actual_hours_positive'
            ),
        ]

    def save(self, *args, **kwargs):
        """Override save to handle status changes and completion tracking."""
        # Auto-set completed_at when status changes to completed
        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()
        # Clear completed_at if status changes from completed
        elif self.status != 'completed' and self.completed_at:
            self.completed_at = None

        super().save(*args, **kwargs)

    def __str__(self):
        entity_info = f" ({self.content_object})" if self.content_object else ""
        return f"{self.title}{entity_info} - {self.get_status_display()}"

    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if not self.deadline or self.status == 'completed':
            return False
        return timezone.now() > self.deadline

    @property
    def days_until_deadline(self):
        """Get days until deadline (negative if overdue)"""
        if not self.deadline:
            return None
        delta = self.deadline - timezone.now()
        return delta.days

    @property
    def entity_type(self):
        """Get the entity type name"""
        return self.content_type.model if self.content_type else None

    @property
    def entity_id(self):
        """Get the entity ID"""
        return self.object_id

    def can_edit(self, user):
        """Check if user can edit this task"""
        return user == self.created_by

    def can_complete(self, user):
        """Check if user can complete this task"""
        return user == self.created_by


class TaskComment(models.Model):
    """
    Comments/notes on tasks for collaboration and progress tracking.
    """

    task = models.ForeignKey(
        Task,
        on_delete=models.CASCADE,
        related_name='comments',
        help_text="The task this comment belongs to"
    )
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='task_comments',
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
        app_label = 'tasks'
        db_table = 'task_comment'
        verbose_name = 'Task Comment'
        verbose_name_plural = 'Task Comments'
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['task'], name='idx_taskcomment_task'),
            models.Index(fields=['author'], name='idx_taskcomment_author'),
            models.Index(fields=['created_at'], name='idx_taskcomment_created'),
            models.Index(fields=['is_active'], name='idx_taskcomment_active'),
        ]

    def __str__(self):
        return f"Comment by {self.author.email} on {self.task.title}"

    def can_edit(self, user):
        """Check if user can edit this comment"""
        return user == self.author
