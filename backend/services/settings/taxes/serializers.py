from rest_framework import serializers
from .models import Tax, TaxGroup, TaxGroupTaxes


class TaxSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tax
        fields = [
            'tax_id', 'tax_name', 'tax_percentage', 'tax_type',
            'is_value_added', 'is_default_tax', 'is_editable', 'is_active',
            'country', 'country_code', 'description',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['tax_id', 'created_at', 'updated_at', 'is_default_tax']
    
    def validate_tax_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Tax percentage must be between 0 and 100")
        return value


class TaxCreateUpdateSerializer(serializers.ModelSerializer):
    # Include update flags only for create/update operations
    class Meta:
        model = Tax
        fields = [
            'tax_name', 'tax_percentage', 'tax_type',
            'is_value_added', 'is_editable', 'is_active',
            'country', 'country_code', 'description',
            'update_recurring_invoice', 'update_recurring_expense',
            'update_draft_invoice', 'update_recurring_bills',
            'update_draft_so', 'update_subscription', 'update_project'
        ]
    
    def validate_tax_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Tax percentage must be between 0 and 100")
        return value


class TaxInGroupSerializer(serializers.ModelSerializer):
    """Serializer for taxes when displayed in a tax group"""
    class Meta:
        model = Tax
        fields = ['tax_id', 'tax_name', 'tax_percentage', 'tax_type', 'is_active']


class TaxGroupSerializer(serializers.ModelSerializer):
    taxes = serializers.SerializerMethodField()
    tax_group_percentage = serializers.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        read_only=True
    )
    
    def get_taxes(self, obj):
        taxes = Tax.objects.filter(group_mappings__tax_group=obj)
        return TaxInGroupSerializer(taxes, many=True).data
    
    class Meta:
        model = TaxGroup
        fields = [
            'tax_group_id', 'tax_group_name', 'tax_group_percentage',
            'taxes', 'created_at', 'updated_at'
        ]
        read_only_fields = ['tax_group_id', 'tax_group_percentage', 'created_at', 'updated_at']


class TaxGroupCreateUpdateSerializer(serializers.Serializer):
    tax_group_name = serializers.CharField(max_length=255)
    taxes = serializers.CharField(help_text="Comma-separated list of tax IDs")
    
    def validate_taxes(self, value):
        """Validate that all tax IDs exist"""
        tax_ids = [tid.strip() for tid in value.split(',') if tid.strip()]
        
        if not tax_ids:
            raise serializers.ValidationError("At least one tax ID is required")
        
        # Validate all tax IDs exist
        for tax_id in tax_ids:
            try:
                Tax.objects.get(tax_id=tax_id)
            except Tax.DoesNotExist:
                raise serializers.ValidationError(f"Tax with ID {tax_id} does not exist")
        
        return tax_ids
    
    def create(self, validated_data):
        tax_ids = validated_data.pop('taxes')
        tax_group = TaxGroup.objects.create(tax_group_name=validated_data['tax_group_name'])
        
        # Create tax mappings
        for tax_id in tax_ids:
            tax = Tax.objects.get(tax_id=tax_id)
            TaxGroupTaxes.objects.create(tax_group=tax_group, tax=tax)
        
        # Calculate and save percentage
        tax_group.tax_group_percentage = tax_group.calculate_percentage()
        tax_group.save()
        
        return tax_group
    
    def update(self, instance, validated_data):
        tax_ids = validated_data.pop('taxes', None)
        instance.tax_group_name = validated_data.get('tax_group_name', instance.tax_group_name)
        
        if tax_ids is not None:
            # Clear existing mappings
            instance.tax_mappings.all().delete()
            
            # Create new mappings
            for tax_id in tax_ids:
                tax = Tax.objects.get(tax_id=tax_id)
                TaxGroupTaxes.objects.create(tax_group=instance, tax=tax)
            
            # Recalculate percentage
            instance.tax_group_percentage = instance.calculate_percentage()
        
        instance.save()
        return instance


class TaxListSerializer(serializers.ModelSerializer):
    """Simplified serializer for tax listing"""
    class Meta:
        model = Tax
        fields = [
            'tax_id', 'tax_name', 'tax_percentage', 'tax_type',
            'is_value_added', 'is_default_tax', 'is_editable', 'is_active',
            'country', 'country_code'
        ]