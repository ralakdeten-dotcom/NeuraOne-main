from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Account

User = get_user_model()


class AccountSerializer(serializers.ModelSerializer):
    """
    Serializer for Account model with all fields
    """
    # Read-only fields for display
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    parent_account_name = serializers.CharField(source='parent_account.account_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = Account
        fields = [
            'account_id',
            'account_name',
            'account_owner_alias',
            'description',
            'parent_account',
            'parent_account_name',
            'industry',
            'website',
            'phone',
            'number_of_employees',
            'owner',
            'owner_name',
            'billing_country',
            'billing_street',
            'billing_city',
            'billing_state_province',
            'billing_zip_postal_code',
            'shipping_country',
            'shipping_street',
            'shipping_city',
            'shipping_state_province',
            'shipping_zip_postal_code',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'account_id',
            'owner_name',
            'parent_account_name',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]

    def validate_account_name(self, value):
        """
        Validate that account name is unique (case-insensitive) within the tenant
        """
        # Get the current instance (for updates) or None (for creates)
        instance = getattr(self, 'instance', None)
        
        # Check for case-insensitive duplicates
        query = Account.objects.filter(account_name__iexact=value)
        
        # If updating, exclude the current instance
        if instance:
            query = query.exclude(account_id=instance.account_id)
        
        if query.exists():
            existing = query.first()
            raise serializers.ValidationError(
                f"An account with a similar name already exists: '{existing.account_name}'"
            )
        
        return value

    def validate_parent_account(self, value):
        """
        Validate that parent account belongs to the same tenant (schema-based isolation)
        """
        # Parent account validation is handled by schema isolation
        # All accounts in the same schema belong to the same tenant
        return value

    def validate_owner(self, value):
        """
        Validate that owner belongs to the same tenant (schema-based isolation)
        """
        # Owner validation is handled by schema isolation
        # All users in the same schema belong to the same tenant
        return value


class AccountListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for account list views
    """
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    parent_account_name = serializers.CharField(source='parent_account.account_name', read_only=True)

    class Meta:
        model = Account
        fields = [
            'account_id',
            'account_name',
            'industry',
            'website',
            'phone',
            'number_of_employees',
            'owner_name',
            'parent_account_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['__all__']


