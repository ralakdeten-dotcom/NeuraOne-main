import uuid
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone


class Tax(models.Model):
    TAX_TYPE_CHOICES = [
        ('tax', 'Tax'),
        ('compound_tax', 'Compound Tax'),
    ]
    
    tax_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tax_name = models.CharField(max_length=255)
    tax_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    tax_type = models.CharField(max_length=20, choices=TAX_TYPE_CHOICES, default='tax')
    is_value_added = models.BooleanField(default=True)
    is_default_tax = models.BooleanField(default=False)
    is_editable = models.BooleanField(default=True)
    is_active = models.BooleanField(default=True)
    country = models.CharField(max_length=100, blank=True, null=True)
    country_code = models.CharField(max_length=2, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    
    # Update flags for existing documents
    update_recurring_invoice = models.BooleanField(default=False)
    update_recurring_expense = models.BooleanField(default=False)
    update_draft_invoice = models.BooleanField(default=False)
    update_recurring_bills = models.BooleanField(default=False)
    update_draft_so = models.BooleanField(default=False)
    update_subscription = models.BooleanField(default=False)
    update_project = models.BooleanField(default=False)
    
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'finance_taxes'
        ordering = ['-created_at']
        verbose_name = 'Tax'
        verbose_name_plural = 'Taxes'
        indexes = [
            models.Index(fields=['tax_name']),
            models.Index(fields=['country_code']),
        ]
    
    def __str__(self):
        return f"{self.tax_name} ({self.tax_percentage}%)"
    
    def save(self, *args, **kwargs):
        # If this is being set as default, unset other defaults
        if self.is_default_tax:
            Tax.objects.filter(is_default_tax=True).exclude(tax_id=self.tax_id).update(is_default_tax=False)
        super().save(*args, **kwargs)


class TaxGroup(models.Model):
    tax_group_id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tax_group_name = models.CharField(max_length=255)
    tax_group_percentage = models.DecimalField(
        max_digits=5, 
        decimal_places=2,
        default=0,
        editable=False
    )
    created_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'finance_tax_groups'
        ordering = ['-created_at']
        verbose_name = 'Tax Group'
        verbose_name_plural = 'Tax Groups'
    
    def __str__(self):
        return f"{self.tax_group_name} ({self.tax_group_percentage}%)"
    
    def calculate_percentage(self):
        """Calculate the total percentage for this tax group"""
        total = 0
        compound_taxes = []
        
        for tax_mapping in self.tax_mappings.all().select_related('tax'):
            tax = tax_mapping.tax
            if tax.tax_type == 'tax':
                total += float(tax.tax_percentage)
            else:  # compound_tax
                compound_taxes.append(float(tax.tax_percentage))
        
        # Apply compound taxes
        for compound_rate in compound_taxes:
            total = total + (total * compound_rate / 100)
        
        return round(total, 2)
    
    def save(self, *args, **kwargs):
        # Calculate percentage before saving
        if self.pk:
            self.tax_group_percentage = self.calculate_percentage()
        super().save(*args, **kwargs)


class TaxGroupTaxes(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tax_group = models.ForeignKey(
        TaxGroup, 
        on_delete=models.CASCADE, 
        related_name='tax_mappings'
    )
    tax = models.ForeignKey(
        Tax, 
        on_delete=models.CASCADE,
        related_name='group_mappings'
    )
    created_at = models.DateTimeField(default=timezone.now)
    
    class Meta:
        db_table = 'finance_tax_group_taxes'
        unique_together = [['tax_group', 'tax']]
        verbose_name = 'Tax Group Mapping'
        verbose_name_plural = 'Tax Group Mappings'
    
    def __str__(self):
        return f"{self.tax_group.tax_group_name} - {self.tax.tax_name}"