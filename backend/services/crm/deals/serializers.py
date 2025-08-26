from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Deal

User = get_user_model()


class DealSerializer(serializers.ModelSerializer):
    """
    Serializer for Deal model with all fields
    """
    # Read-only fields for display
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    account_name = serializers.SerializerMethodField()
    deal_owner_alias = serializers.SerializerMethodField()
    primary_contact_name = serializers.SerializerMethodField()
    primary_contact_first_name = serializers.SerializerMethodField()
    primary_contact_last_name = serializers.SerializerMethodField()
    primary_contact_email = serializers.SerializerMethodField()
    primary_contact_phone = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    def get_primary_contact_name(self, obj):
        """Get full name of primary contact"""
        if obj.primary_contact:
            return f"{obj.primary_contact.first_name} {obj.primary_contact.last_name}".strip()
        return None

    def get_primary_contact_first_name(self, obj):
        """Get first name of primary contact"""
        return obj.primary_contact.first_name if obj.primary_contact else None

    def get_primary_contact_last_name(self, obj):
        """Get last name of primary contact"""
        return obj.primary_contact.last_name if obj.primary_contact else None

    def get_primary_contact_email(self, obj):
        """Get email of primary contact"""
        return obj.primary_contact.email if obj.primary_contact else None

    def get_primary_contact_phone(self, obj):
        """Get phone of primary contact"""
        return obj.primary_contact.phone if obj.primary_contact else None

    def get_account_name(self, obj):
        """Get account name from account foreign key"""
        return obj.account.account_name if obj.account else None

    def get_deal_owner_alias(self, obj):
        """Get owner's full name as alias"""
        return obj.owner.get_full_name() if obj.owner else None

    class Meta:
        model = Deal
        fields = [
            'deal_id',
            'deal_name',
            'stage',
            'amount',
            'close_date',
            'account',
            'account_name',
            'owner',
            'owner_name',
            'deal_owner_alias',
            'primary_contact',
            'primary_contact_name',
            'primary_contact_first_name',
            'primary_contact_last_name',
            'primary_contact_email',
            'primary_contact_phone',
            'description',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'deal_id',
            'owner_name',
            'account_name',
            'deal_owner_alias',
            'primary_contact_name',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]

    def validate_account(self, value):
        """
        Validate that account exists (schema isolation handles tenant validation)
        """
        # Schema-based isolation ensures only accessible accounts are available
        return value

    def validate_owner(self, value):
        """
        Validate that owner exists (schema isolation handles tenant validation)
        """
        # Schema-based isolation ensures only tenant users are accessible
        return value

    def validate_primary_contact(self, value):
        """
        Validate that primary contact belongs to the deal's account (schema-based isolation)
        """
        # Schema isolation handles tenant validation automatically

        # Check if contact belongs to the deal's account (if account is provided)
        if value:
            account = self.initial_data.get('account') or (self.instance.account if self.instance else None)

            if account and value.account:
                # Convert both to int for comparison to handle string/int type mismatch
                try:
                    # Handle case where account might be an Account instance
                    account_id = int(account.pk if hasattr(account, 'pk') else account)
                    contact_account_id = int(value.account.pk)

                    if contact_account_id != account_id:
                        raise serializers.ValidationError(
                            f"Primary contact must belong to the deal's account. Contact belongs to account {contact_account_id}, but deal account is {account_id}."
                        )
                except (ValueError, TypeError):
                    raise serializers.ValidationError(
                        "Invalid account ID format."
                    )
        return value


class DealListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for deal list views
    """
    tenant_name = serializers.CharField(source='tenant.name', read_only=True)
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    account_name = serializers.SerializerMethodField()
    deal_owner_alias = serializers.SerializerMethodField()
    primary_contact_name = serializers.SerializerMethodField()

    def get_primary_contact_name(self, obj):
        """Get full name of primary contact"""
        if obj.primary_contact:
            return f"{obj.primary_contact.first_name} {obj.primary_contact.last_name}".strip()
        return None

    def get_account_name(self, obj):
        """Get account name from account foreign key"""
        return obj.account.account_name if obj.account else None

    def get_deal_owner_alias(self, obj):
        """Get owner's full name as alias"""
        return obj.owner.get_full_name() if obj.owner else None

    class Meta:
        model = Deal
        fields = [
            'deal_id',
            'deal_name',
            'tenant_name',
            'stage',
            'amount',
            'close_date',
            'account_name',
            'owner_name',
            'deal_owner_alias',
            'primary_contact_name',
            'description',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['__all__']




class DealSummarySerializer(serializers.Serializer):
    """
    Serializer for deal summary statistics
    """
    total_deals = serializers.IntegerField()
    total_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    avg_deal_value = serializers.DecimalField(max_digits=14, decimal_places=2)
    deals_by_stage = serializers.DictField()
    deals_closing_this_month = serializers.IntegerField()
    deals_closing_next_month = serializers.IntegerField()
