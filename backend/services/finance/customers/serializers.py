from decimal import Decimal
import uuid

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import serializers

from services.crm.accounts.models import Account
from services.crm.contacts.models import Contact

from .models import FinanceContact, ContactPerson

User = get_user_model()


# Contact Person Serializers for new model-based approach

class ContactPersonListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for contact person list views
    """
    full_name = serializers.CharField(read_only=True)
    communication_preference = serializers.DictField(read_only=True)
    
    class Meta:
        model = ContactPerson
        fields = [
            'contact_person_id',
            'contact',
            'salutation',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'mobile',
            'designation',
            'department',
            'is_primary_contact',
            'enable_portal',
            'is_added_in_portal',
            'communication_preference',
            'created_at',
            'updated_at',
        ]


class ContactPersonDetailSerializer(serializers.ModelSerializer):
    """
    Complete serializer for contact person detail views
    """
    full_name = serializers.CharField(read_only=True)
    communication_preference = serializers.DictField(read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)
    
    class Meta:
        model = ContactPerson
        fields = [
            'contact_person_id',
            'contact',
            'salutation',
            'first_name',
            'last_name',
            'full_name',
            'email',
            'phone',
            'mobile',
            'skype',
            'designation',
            'department',
            'is_primary_contact',
            'enable_portal',
            'is_added_in_portal',
            'is_sms_enabled',
            'is_whatsapp_enabled',
            'communication_preference',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
        ]


class ContactPersonCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating and updating contact persons
    """
    # Make communication preferences writable
    is_sms_enabled = serializers.BooleanField(default=False)
    is_whatsapp_enabled = serializers.BooleanField(default=False)
    
    class Meta:
        model = ContactPerson
        fields = [
            'contact_person_id',
            'contact',
            'salutation',
            'first_name',
            'last_name',
            'email',
            'phone',
            'mobile',
            'skype',
            'designation',
            'department',
            'is_primary_contact',
            'enable_portal',
            'is_sms_enabled',
            'is_whatsapp_enabled',
        ]
        read_only_fields = [
            'contact_person_id',
        ]
    
    def validate_first_name(self, value):
        """Ensure first name is provided and not empty"""
        if not value or not value.strip():
            raise serializers.ValidationError("First name is required")
        return value.strip()
    
    def validate(self, data):
        """Custom validation"""
        # If setting as primary, validate the constraint will be satisfied
        if data.get('is_primary_contact') and hasattr(self, 'instance') and self.instance:
            # Check if another primary exists (excluding current instance)
            existing_primary = ContactPerson.objects.filter(
                contact=data.get('contact', self.instance.contact),
                is_primary_contact=True
            ).exclude(contact_person_id=getattr(self.instance, 'contact_person_id', None))
            
            if existing_primary.exists():
                # This will be handled by the model's save method, but we can warn here
                pass
        
        return data
    
    def create(self, validated_data):
        """Create contact person with proper user tracking"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['created_by'] = request.user
            validated_data['updated_by'] = request.user
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        """Update contact person with proper user tracking"""
        request = self.context.get('request')
        if request and request.user:
            validated_data['updated_by'] = request.user
        
        return super().update(instance, validated_data)


class CustomerListSerializer(serializers.ModelSerializer):
    """
    Lightweight serializer for customer/vendor list view
    """
    # Computed fields
    company_name = serializers.SerializerMethodField()
    primary_contact_info = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    receivable_account_name = serializers.CharField(source='receivable_account.account_name', read_only=True)
    payable_account_name = serializers.CharField(source='payable_account.account_name', read_only=True)

    # Computed address fields for estimate form population
    billing_address = serializers.SerializerMethodField()
    shipping_address = serializers.SerializerMethodField()
    
    # Balance fields
    receivables_balance = serializers.SerializerMethodField()
    payables_balance = serializers.SerializerMethodField()
    
    # Linking fields
    is_linked = serializers.BooleanField(read_only=True)
    linked_entity_id = serializers.IntegerField(source='linked_entity.contact_id', read_only=True)
    linked_entity_name = serializers.CharField(source='linked_entity.display_name', read_only=True)
    linked_entity_number = serializers.SerializerMethodField()
    net_balance = serializers.SerializerMethodField()

    class Meta:
        model = FinanceContact
        fields = [
            'contact_id',
            'customer_number',
            'vendor_number',
            'contact_type',
            'display_name',
            'company_name',
            'website',
            'customer_type',
            'customer_status',
            'currency',
            'payment_terms',
            'credit_limit',
            'outstanding_receivable_amount',
            'primary_contact_info',  # Consolidated contact info
            'account',  # Add account ID for filtering
            'owner',  # Add owner ID
            'owner_name',
            'receivable_account',
            'receivable_account_name',
            'payable_account',
            'payable_account_name',
            'customer_since',
            'last_transaction_date',
            'billing_address',  # Add billing address
            'shipping_address',  # Add shipping address
            'source',
            'created_at',
            'updated_at',
            # Balance fields
            'receivables_balance',
            'payables_balance',
            # Linking fields
            'is_linked',
            'linked_entity_id',
            'linked_entity_name',
            'linked_entity_number',
            'net_balance',
        ]

    def get_company_name(self, obj):
        """Get company name from account or company_name field"""
        if obj.account:
            return obj.account.account_name
        return obj.company_name
    
    def get_primary_contact_info(self, obj):
        """Get primary contact information from ContactPerson model"""
        primary = obj.get_primary_contact_person()
        if primary:
            return {
                'contact_person_id': primary.contact_person_id,
                'name': primary.full_name,
                'email': primary.email,
                'phone': primary.phone,
                'mobile': primary.mobile,
                'designation': primary.designation,
                'department': primary.department
            }
        return None

    def get_billing_address(self, obj):
        """Get billing address dictionary with all fields including state_code, fax, phone"""
        return obj.get_billing_address_dict()

    def get_shipping_address(self, obj):
        """Get shipping address dictionary with all fields including state_code, fax, phone"""
        return obj.get_shipping_address_dict()
    
    def get_linked_entity_number(self, obj):
        """Get the linked entity's number (customer or vendor number)"""
        if not obj.linked_entity:
            return None
        if obj.contact_type == 'customer':
            return obj.linked_entity.vendor_number
        else:
            return obj.linked_entity.customer_number
    
    def get_receivables_balance(self, obj):
        """Get receivables balance for this contact"""
        return str(obj.get_receivables_balance())
    
    def get_payables_balance(self, obj):
        """Get payables balance for this contact"""
        return str(obj.get_payables_balance())
    
    def get_net_balance(self, obj):
        """Get net balance including linked entity"""
        return str(obj.get_net_balance())


class CustomerDetailSerializer(serializers.ModelSerializer):
    """
    Complete serializer for customer detail view and updates
    """
    # Read-only display fields
    company_name = serializers.CharField(source='account.account_name', read_only=True)
    primary_contact_info = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    updated_by_name = serializers.CharField(source='updated_by.get_full_name', read_only=True)

    # Computed address fields (combines customer + account data)
    billing_address = serializers.SerializerMethodField()
    shipping_address = serializers.SerializerMethodField()
    
    # Linking fields
    is_linked = serializers.BooleanField(read_only=True)
    linked_entity = serializers.SerializerMethodField()
    net_balance = serializers.SerializerMethodField()

    class Meta:
        model = FinanceContact
        fields = [
            'contact_id',
            'customer_number',
            'vendor_number',
            'contact_type',
            'display_name',
            'company_name',
            'website',
            'customer_type',
            'customer_status',
            'currency',
            'payment_terms',
            'credit_limit',
            'vat_treatment',
            'vat_registration_number',
            'outstanding_receivable_amount',
            'receivable_account',
            'payable_account',
            'primary_contact_info',
            'billing_attention',
            'billing_street',
            'billing_city',
            'billing_state_province',
            'billing_state_code',
            'billing_zip_postal_code',
            'billing_country',
            'billing_fax',
            'billing_phone',
            'shipping_attention',
            'shipping_street',
            'shipping_city',
            'shipping_state_province',
            'shipping_state_code',
            'shipping_zip_postal_code',
            'shipping_country',
            'shipping_fax',
            'shipping_phone',
            'billing_address',
            'shipping_address',
            'customer_since',
            'last_transaction_date',
            'notes',
            'owner',
            'owner_name',
            'source',
            'tags',
            'social_media',
            'portal_status',
            'portal_language',
            'custom_fields',
            'documents',
            'created_at',
            'updated_at',
            'created_by',
            'created_by_name',
            'updated_by',
            'updated_by_name',
            'account',
            # Linking fields
            'is_linked',
            'linked_entity',
            'net_balance',
            'link_created_at',
            'link_created_by',
        ]

    def get_primary_contact_info(self, obj):
        """Get primary contact information from ContactPerson model"""
        primary = obj.get_primary_contact_person()
        if primary:
            return {
                'contact_person_id': primary.contact_person_id,
                'name': primary.full_name,
                'email': primary.email,
                'phone': primary.phone,
                'mobile': primary.mobile,
                'designation': primary.designation,
                'department': primary.department
            }
        return None

    def get_billing_address(self, obj):
        return obj.get_billing_address_dict()

    def get_shipping_address(self, obj):
        return obj.get_shipping_address_dict()
    
    def get_linked_entity(self, obj):
        """Get detailed information about linked entity"""
        if not obj.linked_entity:
            return None
        
        entity = obj.linked_entity
        if obj.contact_type == 'customer':
            # Linked to a vendor
            return {
                'id': entity.contact_id,
                'type': 'vendor',
                'vendor_number': entity.vendor_number,
                'display_name': entity.display_name,
                'payable_amount': float(entity.outstanding_receivable_amount or 0)
            }
        else:
            # Linked to a customer
            return {
                'id': entity.contact_id,
                'type': 'customer',
                'customer_number': entity.customer_number,
                'display_name': entity.display_name,
                'receivable_amount': float(entity.outstanding_receivable_amount or 0),
                'unused_credits': float(entity.unused_credits_receivable_amount or 0)
            }
    
    def get_net_balance(self, obj):
        """Get net balance information"""
        if not obj.linked_entity:
            return None
        
        return {
            'amount': float(obj.net_balance),
            'type': 'receivable' if obj.net_balance > 0 else 'payable'
        }


class CustomerCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating customers with auto-create logic
    """
    # Input fields for auto-create logic
    company_name_input = serializers.CharField(
        write_only=True,
        help_text="Company name - will create Account if doesn't exist"
    )
    primary_contact_name_input = serializers.CharField(
        write_only=True,
        required=False,
        help_text="Contact name (First Last) - will create Contact if doesn't exist"
    )
    primary_contact_email_input = serializers.EmailField(
        write_only=True,
        required=False,
        help_text="Contact email for new contact creation"
    )
    primary_contact_phone_input = serializers.CharField(
        write_only=True,
        required=False,
        help_text="Contact phone for new contact creation"
    )
    # Allow passing existing contact ID to link instead of creating new
    primary_contact_id = serializers.IntegerField(
        write_only=True,
        required=False,
        help_text="ID of existing contact to link (skips contact creation)"
    )

    # Read-only display fields
    company_name = serializers.CharField(source='account.account_name', read_only=True)
    primary_contact_name = serializers.SerializerMethodField()
    owner_name = serializers.CharField(source='owner.get_full_name', read_only=True)

    class Meta:
        model = FinanceContact
        fields = [
            'contact_id',
            'customer_number',
            'vendor_number',
            'contact_type',
            'display_name',
            'company_name',
            'website',
            'customer_type',
            'customer_status',
            'currency',
            'payment_terms',
            'credit_limit',
            'vat_treatment',
            'vat_registration_number',
            'outstanding_receivable_amount',
            'receivable_account',
            'payable_account',
            'billing_attention',
            'billing_street',
            'billing_city',
            'billing_state_province',
            'billing_state_code',
            'billing_zip_postal_code',
            'billing_country',
            'billing_fax',
            'billing_phone',
            'shipping_attention',
            'shipping_street',
            'shipping_city',
            'shipping_state_province',
            'shipping_state_code',
            'shipping_zip_postal_code',
            'shipping_country',
            'shipping_fax',
            'shipping_phone',
            'notes',
            'owner',
            'source',
            'tags',
            'social_media',
            'portal_status',
            'portal_language',
            'custom_fields',
            'documents',
            'opening_balances',  # Add opening_balances field
            # Input fields
            'company_name_input',
            'primary_contact_name_input',
            'primary_contact_email_input',
            'primary_contact_phone_input',
            'primary_contact_id',
            # Read-only display fields
            'primary_contact_name',
            'owner_name',
            'customer_since',
            'last_transaction_date',
            'created_at',
            'updated_at',
            'account',
        ]
        read_only_fields = [
            'contact_id',
            'customer_number',
            'vendor_number',
            # 'outstanding_receivable_amount',  # Allow setting for Zoho-style opening balance
            'primary_contact_name',
            'owner_name',
            'customer_since',
            'last_transaction_date',
            'created_at',
            'updated_at',
            'account',
        ]

    def get_primary_contact_info(self, obj):
        """Get primary contact information from ContactPerson model"""
        primary = obj.get_primary_contact_person()
        if primary:
            return {
                'contact_person_id': primary.contact_person_id,
                'name': primary.full_name,
                'email': primary.email,
                'phone': primary.phone,
                'mobile': primary.mobile,
                'designation': primary.designation,
                'department': primary.department
            }
        return None

    def validate_company_name_input(self, value):
        """Validate company name input"""
        # Allow empty if account ID is provided
        if 'account' in self.initial_data and self.initial_data['account']:
            return value
        if not value or not value.strip():
            raise serializers.ValidationError("Company name is required")
        return value.strip() if value else value

    def validate_primary_contact_name_input(self, value):
        """Validate and parse contact name"""
        if value:
            value = value.strip()
            if len(value.split()) < 2:
                raise serializers.ValidationError("Contact name must include first and last name")
        return value
    
    def get_primary_contact_name(self, obj):
        """Get primary contact name from ContactPerson model"""
        primary = obj.get_primary_contact_person()
        return primary.full_name if primary else None

    @transaction.atomic
    def create(self, validated_data):
        """Create customer with auto-create Account and Contact logic"""
        # Extract input fields
        company_name = validated_data.pop('company_name_input', None)
        contact_name = validated_data.pop('primary_contact_name_input', None)
        contact_email = validated_data.pop('primary_contact_email_input', None)
        contact_phone = validated_data.pop('primary_contact_phone_input', None)
        existing_contact_id = validated_data.pop('primary_contact_id', None)
        existing_account_id = validated_data.pop('account', None)

        user = self.context['request'].user

        # Step 1: Handle Account - either use existing or create new
        if existing_account_id:
            # Use the existing account
            try:
                account = Account.objects.get(account_id=existing_account_id)
                account_created = False
            except Account.DoesNotExist:
                raise serializers.ValidationError(f"Account with ID {existing_account_id} not found")
        elif company_name:
            # Get or create Account by name
            account, account_created = Account.objects.get_or_create(
                account_name=company_name,
                defaults={
                    'created_by': user,
                    'updated_by': user,
                    'owner': validated_data.get('owner', user),
                }
            )
        else:
            # No account information provided - this is for standalone vendors
            account = None
            account_created = False

        # If account was created, populate with customer address data
        if account_created and any([
            validated_data.get('billing_street'),
            validated_data.get('billing_city'),
            validated_data.get('shipping_street'),
            validated_data.get('shipping_city')
        ]):
            # Copy customer address data to new account
            account.billing_street = validated_data.get('billing_street', '')
            account.billing_city = validated_data.get('billing_city', '')
            account.billing_state_province = validated_data.get('billing_state_province', '')
            account.billing_zip_postal_code = validated_data.get('billing_zip_postal_code', '')
            account.billing_country = validated_data.get('billing_country', '')
            account.shipping_street = validated_data.get('shipping_street', '')
            account.shipping_city = validated_data.get('shipping_city', '')
            account.shipping_state_province = validated_data.get('shipping_state_province', '')
            account.shipping_zip_postal_code = validated_data.get('shipping_zip_postal_code', '')
            account.shipping_country = validated_data.get('shipping_country', '')
            account.save()

        # Step 2: Handle primary contact creation/linking
        primary_contact = None

        # If an existing contact ID is provided, use it directly
        if existing_contact_id:
            try:
                primary_contact = Contact.objects.get(contact_id=existing_contact_id)
                # Optionally update contact's email/phone if provided
                if contact_email and contact_email != primary_contact.email:
                    primary_contact.email = contact_email
                    primary_contact.save()
                if contact_phone and contact_phone != primary_contact.phone:
                    primary_contact.phone = contact_phone
                    primary_contact.save()
            except Contact.DoesNotExist:
                raise serializers.ValidationError(f"Contact with ID {existing_contact_id} not found")
        elif contact_name:
            # Parse first and last name
            name_parts = contact_name.strip().split()
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

            # Try to find existing contact first
            contact_filter = {
                'first_name__iexact': first_name,
                'last_name__iexact': last_name,
                'account': account
            }

            # If email provided, use it in the filter
            if contact_email:
                contact_filter['email__iexact'] = contact_email

            try:
                primary_contact = Contact.objects.get(**contact_filter)
            except Contact.DoesNotExist:
                # Create new contact
                primary_contact = Contact.objects.create(
                    first_name=first_name,
                    last_name=last_name,
                    email=contact_email or None,
                    phone=contact_phone or None,
                    account=account,
                    created_by=user,
                    updated_by=user,
                    owner=validated_data.get('owner', user),
                )

        # Step 3: Create Customer
        # Remove fields that might conflict
        validated_data.pop('created_by', None)
        validated_data.pop('updated_by', None)
        
        # Zoho-style: If opening_balances provided, auto-populate outstanding_receivable_amount
        if validated_data.get('opening_balances') and not validated_data.get('outstanding_receivable_amount'):
            opening = validated_data['opening_balances']
            if isinstance(opening, dict) and 'amount' in opening:
                try:
                    # Set outstanding amount from opening balance
                    validated_data['outstanding_receivable_amount'] = Decimal(str(opening['amount']))
                except (ValueError, TypeError):
                    pass  # If amount is invalid, skip auto-population
        
        customer = FinanceContact.objects.create(
            account=account,
            created_by=user,
            updated_by=user,
            **validated_data
        )

        return customer

    @transaction.atomic
    def update(self, instance, validated_data):
        """Update customer with auto-create logic if company/contact changed"""
        # Extract input fields
        company_name = validated_data.pop('company_name_input', None)
        contact_name = validated_data.pop('primary_contact_name_input', None)
        contact_email = validated_data.pop('primary_contact_email_input', None)
        contact_phone = validated_data.pop('primary_contact_phone_input', None)
        existing_contact_id = validated_data.pop('primary_contact_id', None)
        existing_account_id = validated_data.pop('account', None)

        user = self.context['request'].user

        # Update account if changed
        if existing_account_id and existing_account_id != getattr(instance.account, 'account_id', None):
            # Use the selected existing account
            try:
                instance.account = Account.objects.get(account_id=existing_account_id)
            except Account.DoesNotExist:
                raise serializers.ValidationError(f"Account with ID {existing_account_id} not found")
        elif company_name and (not instance.account or company_name != instance.account.account_name):
            # Create or get account by name
            account, account_created = Account.objects.get_or_create(
                account_name=company_name,
                defaults={
                    'created_by': user,
                    'updated_by': user,
                    'owner': validated_data.get('owner', user),
                }
            )
            instance.account = account

        # Update primary contact if changed
        if existing_contact_id:
            # Use the selected existing contact
            try:
                instance.primary_contact = Contact.objects.get(contact_id=existing_contact_id)
            except Contact.DoesNotExist:
                raise serializers.ValidationError(f"Contact with ID {existing_contact_id} not found")
        elif contact_name:
            name_parts = contact_name.strip().split()
            first_name = name_parts[0]
            last_name = ' '.join(name_parts[1:]) if len(name_parts) > 1 else ''

            # Check if this is different from current contact
            current_contact_name = instance.primary_contact_name if instance.primary_contact else ''
            if contact_name.strip() != current_contact_name:
                # Create or find new contact
                contact_filter = {
                    'first_name__iexact': first_name,
                    'last_name__iexact': last_name,
                    'account': instance.account
                }

                if contact_email:
                    contact_filter['email__iexact'] = contact_email

                try:
                    primary_contact = Contact.objects.get(**contact_filter)
                except Contact.DoesNotExist:
                    primary_contact = Contact.objects.create(
                        first_name=first_name,
                        last_name=last_name,
                        email=contact_email or None,
                        phone=contact_phone or None,
                        account=instance.account,
                        created_by=user,
                        updated_by=user,
                        owner=validated_data.get('owner', user),
                    )

                instance.primary_contact = primary_contact

        # Update other fields
        validated_data['updated_by'] = user
        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance


# Autocomplete helper serializers
class AccountAutocompleteSerializer(serializers.ModelSerializer):
    """Serializer for account name autocomplete"""
    value = serializers.CharField(source='account_name')
    label = serializers.CharField(source='account_name')

    class Meta:
        model = Account
        fields = ['account_id', 'value', 'label']


class ContactAutocompleteSerializer(serializers.ModelSerializer):
    """Serializer for contact name autocomplete"""
    value = serializers.SerializerMethodField()
    label = serializers.SerializerMethodField()

    class Meta:
        model = Contact
        fields = ['contact_id', 'value', 'label', 'email', 'phone']

    def get_value(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip()

    def get_label(self, obj):
        name = f"{obj.first_name} {obj.last_name}".strip()
        if obj.email:
            return f"{name} ({obj.email})"
        return name
