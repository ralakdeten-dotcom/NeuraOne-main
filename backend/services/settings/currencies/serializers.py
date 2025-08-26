from rest_framework import serializers
from .models import Currency


class CurrencySerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = [
            'id',
            'currency_id',
            'currency_code',
            'currency_name',
            'currency_symbol',
            'price_precision',
            'currency_format',
            'is_base_currency',
            'exchange_rate',
            'effective_date',
            'created_at',
            'updated_at'
        ]
        read_only_fields = ['id', 'currency_id', 'created_at', 'updated_at']

    def validate_currency_code(self, value):
        if value:
            value = value.upper()
        return value

    def validate_is_base_currency(self, value):
        if value:
            # Check if another base currency exists
            existing_base = Currency.objects.filter(is_base_currency=True)
            if self.instance:
                existing_base = existing_base.exclude(pk=self.instance.pk)
            if existing_base.exists():
                raise serializers.ValidationError(
                    "A base currency already exists. Please update the existing base currency first."
                )
        return value

    def validate_exchange_rate(self, value):
        if value <= 0:
            raise serializers.ValidationError("Exchange rate must be greater than 0")
        return value


class CurrencyCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = [
            'currency_code',
            'currency_symbol',
            'currency_name',
            'price_precision',
            'currency_format',
            'is_base_currency',
            'exchange_rate',
            'effective_date'
        ]
        extra_kwargs = {
            'currency_code': {'required': True},
            'currency_symbol': {'required': True},
        }

    def validate_currency_code(self, value):
        if value:
            value = value.upper()
        return value

    def create(self, validated_data):
        # Auto-generate currency_name if not provided
        if 'currency_name' not in validated_data or not validated_data['currency_name']:
            validated_data['currency_name'] = f"{validated_data['currency_code']}- {validated_data['currency_code']} Currency"
        
        return super().create(validated_data)


class CurrencyUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = [
            'currency_code',
            'currency_symbol',
            'currency_name',
            'price_precision',
            'currency_format',
            'is_base_currency',
            'exchange_rate',
            'effective_date'
        ]
        extra_kwargs = {
            'currency_code': {'required': True},
            'currency_symbol': {'required': True},
        }

    def validate_currency_code(self, value):
        if value:
            value = value.upper()
        return value


class CurrencyListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Currency
        fields = [
            'id',
            'currency_id',
            'currency_code',
            'currency_name',
            'currency_symbol',
            'price_precision',
            'currency_format',
            'is_base_currency',
            'exchange_rate',
            'effective_date'
        ]
        read_only_fields = fields