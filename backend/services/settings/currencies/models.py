from django.db import models
from django.core.validators import MaxLengthValidator, MinValueValidator, MaxValueValidator


class Currency(models.Model):
    currency_id = models.CharField(
        max_length=50,
        unique=True,
        editable=False,
        db_index=True,
        help_text="A unique ID for the currency"
    )
    currency_code = models.CharField(
        max_length=100,
        unique=True,
        db_index=True,
        help_text="A unique code for the currency (e.g., USD, EUR, AUD)"
    )
    currency_name = models.CharField(
        max_length=200,
        help_text="The name for the currency (e.g., 'USD- US Dollar')"
    )
    currency_symbol = models.CharField(
        max_length=4,
        help_text="A unique symbol for the currency (e.g., $, €, £)"
    )
    price_precision = models.IntegerField(
        default=2,
        validators=[MinValueValidator(0), MaxValueValidator(10)],
        help_text="The precision for the price in decimals"
    )
    currency_format = models.CharField(
        max_length=100,
        default="1,234,567.89",
        help_text="The format for the currency to be displayed"
    )
    is_base_currency = models.BooleanField(
        default=False,
        help_text="If the specified currency is the base currency of the organization or not"
    )
    exchange_rate = models.DecimalField(
        max_digits=20,
        decimal_places=10,
        default=1.0,
        validators=[MinValueValidator(0)],
        help_text="Foreign Exchange rate for the currency"
    )
    effective_date = models.DateField(
        null=True,
        blank=True,
        help_text="Date from when the currency will be in effect"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'currencies'
        ordering = ['currency_code']
        verbose_name = 'Currency'
        verbose_name_plural = 'Currencies'
        indexes = [
            models.Index(fields=['currency_code']),
            models.Index(fields=['is_base_currency']),
        ]

    def __str__(self):
        return f"{self.currency_code} - {self.currency_name}"

    def save(self, *args, **kwargs):
        if not self.currency_id:
            # Generate a unique currency_id if not provided
            import uuid
            self.currency_id = str(uuid.uuid4().int)[:18]
        
        # Ensure only one base currency exists
        if self.is_base_currency:
            Currency.objects.filter(is_base_currency=True).exclude(pk=self.pk).update(is_base_currency=False)
        
        super().save(*args, **kwargs)