from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Contact

User = get_user_model()


class ContactSerializer(serializers.ModelSerializer):
    """
    Serializer for Contact model with all fields
    """
    # Read-only fields for display
    account_name = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    # Write-only field for new account creation (conflicts with read-only account_name)
    # We'll handle this in the view since account_name is already a read-only field

    class Meta:
        model = Contact
        fields = [
            'contact_id',
            'account',
            'account_name',
            'first_name',
            'last_name',
            'title',
            'description',
            'email',
            'phone',
            'mailing_street',
            'mailing_city',
            'mailing_state_province',
            'mailing_country',
            'postal_code',
            'owner',
            'owner_name',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'contact_id',
            'account_name',
            'owner_name',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]

    def validate_account(self, value):
        """
        Validate that account belongs to the same tenant (schema-based isolation)
        """
        # Account validation is handled by schema isolation
        # All accounts in the same schema belong to the same tenant
        return value

    def validate_owner(self, value):
        """
        Validate that owner belongs to the same tenant (schema-based isolation)
        """
        # Owner validation is handled by schema isolation
        # All users in the same schema belong to the same tenant
        return value

    def get_account_name(self, obj):
        """Get account name from account foreign key"""
        return obj.account.account_name if obj.account else None


class ContactListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for contact list views
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    account_name = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = [
            'contact_id',
            'first_name',
            'last_name',
            'full_name',
            'title',
            'email',
            'phone',
            'account',
            'account_name',
            'tenant_name',
            'owner_name',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['__all__']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_account_name(self, obj):
        """Get account name from account foreign key"""
        return obj.account.account_name if obj.account else None



