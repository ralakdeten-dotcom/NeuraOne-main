from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Lead

User = get_user_model()


class LeadSerializer(serializers.ModelSerializer):
    """
    Serializer for Lead model - used for create, retrieve, update operations
    """
    # Read-only fields for display
    lead_owner_name = serializers.CharField(source='lead_owner.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    class Meta:
        model = Lead
        fields = [
            'lead_id',
            'account',
            'company_name',
            'first_name',
            'last_name',
            'title',
            'website',
            'description',
            'lead_status',
            'score',
            'lead_owner',
            'lead_owner_name',
            'email',
            'phone',
            'street',
            'city',
            'state',
            'country',
            'postal_code',
            'number_of_employees',
            'average_revenue',
            'lead_source',
            'industry',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]
        read_only_fields = [
            'lead_id',
            'lead_owner_name',
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

    def validate_lead_owner(self, value):
        """
        Validate that lead_owner exists (schema isolation handles tenant validation)
        """
        # Schema-based isolation ensures only tenant users are accessible
        return value

    def to_representation(self, instance):
        """
        Override to show account name in company_name field when account FK is set
        """
        data = super().to_representation(instance)
        # If there's a linked account, show its name instead of the stored company_name
        if instance.account:
            data['company_name'] = instance.account.account_name
        return data


class LeadListSerializer(serializers.ModelSerializer):
    """
    Simplified serializer for lead list views
    """
    company_name = serializers.SerializerMethodField()
    lead_owner_name = serializers.CharField(source='lead_owner.get_full_name', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Lead
        fields = [
            'lead_id',
            'first_name',
            'last_name',
            'full_name',
            'title',
            'email',
            'phone',
            'company_name',
            'lead_status',
            'score',
            'lead_source',
            'industry',
            'lead_owner',
            'lead_owner_name',
            'created_by',
            'created_at',
            'updated_at',
        ]
        read_only_fields = [
            'lead_id',
            'first_name',
            'last_name',
            'full_name',
            'title',
            'email',
            'phone',
            'company_name',
            'lead_status',
            'score',
            'lead_source',
            'industry',
            'lead_owner',
            'lead_owner_name',
            'created_by',
            'created_at',
            'updated_at',
        ]

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def get_company_name(self, obj):
        """
        Get company name from either linked account or text field
        """
        # If lead is converted (has account foreign key), use account name
        if obj.account:
            return obj.account.account_name
        # Otherwise use the text field
        return obj.company_name
