from django.db import transaction
from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.auth.utils import rate_limit

# Removed cache_page import - caching disabled for immediate data updates
from core.tenants.permissions import HasTenantPermission, IsTenantUser

from .models import Contact
from .serializers import (
    ContactListSerializer,
    ContactSerializer,
)


class ContactViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contacts with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_contacts']

    def get_queryset(self):
        """
        Return contacts filtered by current tenant
        Tenant isolation is handled by schema-based multi-tenancy
        """
        return Contact.objects.all()

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return ContactListSerializer
        return ContactSerializer

    def _create_account_if_needed(self, account_name, user):
        """
        Create new account if account_name provided and no existing account found.
        Returns account instance or None.
        """
        if not account_name or not account_name.strip():
            return None

        account_name = account_name.strip()

        # Import here to avoid circular imports
        from services.crm.accounts.models import Account

        # Check for existing account with same name (case-insensitive)
        existing_account = Account.objects.filter(
            account_name__iexact=account_name
        ).first()

        if existing_account:
            return existing_account

        # Create new account
        new_account = Account.objects.create(
            account_name=account_name,
            owner=user,
            created_by=user,
            updated_by=user,
            # Set default values - only fields that exist in the model
            industry='Other'
        )

        return new_account

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create contact with audit info and optional account creation
        """
        # Extract account_name from request data if present
        account_name = self.request.data.get('account_name')

        with transaction.atomic():
            # Create account first if needed
            if account_name and not serializer.validated_data.get('account'):
                new_account = self._create_account_if_needed(account_name, self.request.user)
                if new_account:
                    # Update the validated data to include the new account
                    serializer.validated_data['account'] = new_account

            # Create the contact
            serializer.save(
                created_by=self.request.user,
                updated_by=self.request.user
            )

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update contact with audit info
        """
        serializer.save(updated_by=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        List contacts without caching for immediate data updates
        """
        return super().list(request, *args, **kwargs)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get contact summary statistics
        """
        contacts = self.get_queryset()

        # Calculate statistics
        total_contacts = contacts.count()
        contacts_with_accounts = contacts.filter(account__isnull=False).count()
        contacts_with_phone = contacts.exclude(phone__isnull=True).exclude(phone__exact='').count()
        contacts_by_title = {}

        for contact in contacts:
            title = contact.title or 'Unknown'
            contacts_by_title[title] = contacts_by_title.get(title, 0) + 1

        return Response({
            'total_contacts': total_contacts,
            'contacts_with_accounts': contacts_with_accounts,
            'contacts_with_phone': contacts_with_phone,
            'contacts_by_title': contacts_by_title,
            'tenant': request.tenant.name if request.tenant else None,
        })

    @action(detail=True, methods=['get'])
    def account_info(self, request, pk=None):
        """
        Get account information for a specific contact
        """
        contact = self.get_object()

        if not contact.account:
            return Response({
                'contact_id': contact.contact_id,
                'contact_name': f"{contact.first_name} {contact.last_name}",
                'account': None,
                'message': 'Contact is not associated with any account'
            })

        account = contact.account
        return Response({
            'contact_id': contact.contact_id,
            'contact_name': f"{contact.first_name} {contact.last_name}",
            'account': {
                'account_id': account.account_id,
                'account_name': account.account_name,
                'industry': account.industry,
                'website': account.website,
                'phone': account.phone,
            }
        })

    @action(detail=True, methods=['get'])
    def deals(self, request, pk=None):
        """
        Get all deals where this contact is the primary contact
        """
        contact = self.get_object()

        # Get deals where this contact is the primary contact
        # This ensures each contact only sees deals they are directly associated with
        # Use select_related to optimize database queries
        deals = contact.primary_deals.select_related('account', 'owner').all()

        deals_data = []
        for deal in deals:
            deals_data.append({
                'deal_id': deal.deal_id,
                'deal_name': deal.deal_name,
                'stage': deal.stage,
                'amount': str(deal.amount),
                'close_date': deal.close_date,
                'owner': deal.owner.get_full_name() if deal.owner else None,
                'account_id': deal.account.account_id if deal.account else None,
                'account_name': deal.account.account_name if deal.account else None,
            })

        return Response({
            'contact_id': contact.contact_id,
            'contact_name': f"{contact.first_name} {contact.last_name}",
            'deals': deals_data,
            'count': len(deals_data)
        })

    @action(detail=False, methods=['get'])
    def by_account(self, request):
        """
        Get contacts grouped by account
        """
        account_id = request.query_params.get('account_id')
        if not account_id:
            return Response({
                'error': 'account_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Filter contacts by account
        queryset = self.get_queryset().filter(account_id=account_id)

        # Use the ContactListSerializer to ensure consistent format with full_name
        serializer = ContactListSerializer(queryset, many=True)

        # Return paginated response format expected by frontend
        return Response({
            'count': queryset.count(),
            'next': None,
            'previous': None,
            'results': serializer.data
        })

    def destroy(self, request, *args, **kwargs):
        """
        Delete contact
        """
        return super().destroy(request, *args, **kwargs)
