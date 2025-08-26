from django.db import models


class DocumentFeesMixin(models.Model):
    """
    Mixin for shipping and rush fees across all sales documents.
    Can be used by Estimate, Invoice, SalesOrder, etc.
    """

    # Shipping fee fields
    shipping_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Shipping fee for this document"
    )
    shipping_vat_rate = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=20.00,
        help_text="VAT percentage for shipping (0-100)"
    )

    # Rush fee field (no VAT on rush fees)
    rush_fee = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0.00,
        help_text="Rush processing fee for this document"
    )

    @property
    def shipping_vat_amount(self):
        """Calculate VAT amount for shipping"""
        return float(self.shipping_fee) * (float(self.shipping_vat_rate) / 100)

    @property
    def total_fees(self):
        """Calculate total of all fees including VAT"""
        return float(self.shipping_fee) + self.shipping_vat_amount + float(self.rush_fee)

    @property
    def fees_subtotal(self):
        """Calculate fees without VAT"""
        return float(self.shipping_fee) + float(self.rush_fee)

    class Meta:
        abstract = True
