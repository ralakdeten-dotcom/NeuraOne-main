from django.db.models import Q, Max
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.tenants.permissions import HasTenantPermission, IsTenantUser
from services.crm.accounts.models import Account
from services.crm.contacts.models import Contact

from .models import FinanceContact, ContactPerson
from .serializers import (
    AccountAutocompleteSerializer,
    ContactAutocompleteSerializer,
    ContactPersonListSerializer,
    ContactPersonDetailSerializer,
    ContactPersonCreateUpdateSerializer,
    CustomerCreateUpdateSerializer,
    CustomerDetailSerializer,
    CustomerListSerializer,
)


class BaseContactViewSet(viewsets.ModelViewSet):
    """
    Base ViewSet for shared customer/vendor functionality
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_customers']
    
    def get_queryset(self):
        """
        Return customers filtered by current tenant with related data
        Tenant isolation is handled by schema-based multi-tenancy
        """
        return FinanceContact.objects.select_related(
            'account',
            'owner',
            'created_by',
            'updated_by',
            'receivable_account',
            'payable_account'
        ).all()
    
    def generate_customer_number(self):
        """Generate next customer number in format CUST-XXXX"""
        # Get all customer numbers and extract the numeric part
        existing_numbers = FinanceContact.objects.filter(
            customer_number__startswith='CUST-'
        ).values_list('customer_number', flat=True)
        
        max_num = 0
        for num_str in existing_numbers:
            try:
                # Extract number from CUST-XXXX format
                num = int(num_str.split('-')[1])
                max_num = max(max_num, num)
            except (IndexError, ValueError):
                continue
        
        return f'CUST-{max_num + 1:04d}'
    
    def generate_vendor_number(self):
        """Generate next vendor number in format VEND-XXXX"""
        # Get all vendor numbers and extract the numeric part
        existing_numbers = FinanceContact.objects.filter(
            vendor_number__startswith='VEND-'
        ).values_list('vendor_number', flat=True)
        
        max_num = 0
        for num_str in existing_numbers:
            try:
                # Extract number from VEND-XXXX format
                num = int(num_str.split('-')[1])
                max_num = max(max_num, num)
            except (IndexError, ValueError):
                continue
        
        return f'VEND-{max_num + 1:04d}'


class CustomerViewSet(BaseContactViewSet):
    """
    ViewSet for managing customers with tenant isolation and RBAC
    Includes auto-create functionality for Accounts and Contacts
    """

    def get_queryset(self):
        """
        Return only customers (not vendors)
        """
        queryset = super().get_queryset()
        return queryset.filter(contact_type='customer')

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return CustomerListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return CustomerCreateUpdateSerializer
        return CustomerDetailSerializer

    def perform_create(self, serializer):
        """Customer creation with auto-generated customer number"""
        customer_number = self.generate_customer_number()
        
        serializer.save(
            customer_number=customer_number,
            contact_type='customer',
            source='finance',
            updated_by=self.request.user
        )

    def perform_update(self, serializer):
        """Set updated_by on customer update"""
        serializer.save(updated_by=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        List customers with optional filtering and search
        """
        queryset = self.get_queryset()

        # Search functionality
        search_query = request.query_params.get('search', '')
        if search_query:
            queryset = queryset.filter(
                Q(display_name__icontains=search_query) |
                Q(account__account_name__icontains=search_query) |
                Q(contact_persons_rel__first_name__icontains=search_query) |
                Q(contact_persons_rel__last_name__icontains=search_query) |
                Q(contact_persons_rel__email__icontains=search_query) |
                Q(vat_registration_number__icontains=search_query)
            )

        # Filter by customer type
        customer_type = request.query_params.get('customer_type', '')
        if customer_type:
            queryset = queryset.filter(customer_type=customer_type)

        # Filter by customer status
        customer_status = request.query_params.get('customer_status', '')
        if customer_status:
            queryset = queryset.filter(customer_status=customer_status)

        # Filter by currency
        currency = request.query_params.get('currency', '')
        if currency:
            queryset = queryset.filter(currency=currency)

        # Filter by payment terms
        payment_terms = request.query_params.get('payment_terms', '')
        if payment_terms:
            queryset = queryset.filter(payment_terms=payment_terms)

        # Filter by owner
        owner_id = request.query_params.get('owner', '')
        if owner_id:
            queryset = queryset.filter(owner_id=owner_id)

        # Ordering
        ordering = request.query_params.get('ordering', 'display_name')
        if ordering:
            queryset = queryset.order_by(ordering)

        # Pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def autocomplete_companies(self, request):
        """
        Autocomplete endpoint for company names (from Accounts)
        GET /api/finance/customers/autocomplete_companies/?q=search_term
        """
        search_query = request.query_params.get('q', '')

        if len(search_query) < 2:
            return Response({
                'results': [],
                'message': 'Please enter at least 2 characters'
            })

        # Search accounts by name
        accounts = Account.objects.filter(
            account_name__icontains=search_query
        ).order_by('account_name')[:20]  # Limit to 20 results

        serializer = AccountAutocompleteSerializer(accounts, many=True)
        return Response({
            'results': serializer.data,
            'count': accounts.count()
        })

    @action(detail=False, methods=['get'])
    def autocomplete_contacts(self, request):
        """
        Autocomplete endpoint for contacts, optionally filtered by account
        GET /api/finance/customers/autocomplete_contacts/?q=search_term
        GET /api/finance/customers/autocomplete_contacts/?account_id=123&q=search_term
        """
        account_id = request.query_params.get('account_id', '')
        search_query = request.query_params.get('q', '')

        # Start with all contacts
        contacts = Contact.objects.all()
        account_name = None

        # Filter by account if provided
        if account_id:
            try:
                account = Account.objects.get(account_id=account_id)
                contacts = contacts.filter(account=account)
                account_name = account.account_name
            except Account.DoesNotExist:
                return Response({
                    'error': 'Account not found'
                }, status=status.HTTP_404_NOT_FOUND)

        # Apply search filter if provided
        if search_query and len(search_query) >= 2:
            contacts = contacts.filter(
                Q(first_name__icontains=search_query) |
                Q(last_name__icontains=search_query) |
                Q(email__icontains=search_query)
            )

        contacts = contacts.order_by('first_name', 'last_name')[:20]  # Limit to 20 results

        serializer = ContactAutocompleteSerializer(contacts, many=True)
        response_data = {
            'results': serializer.data,
            'count': contacts.count()
        }
        if account_name:
            response_data['account_name'] = account_name
            
        return Response(response_data)

    @action(detail=True, methods=['get'])
    def contacts(self, request, pk=None):
        """
        Get all contacts for a customer's account
        GET /api/finance/customers/{id}/contacts/
        """
        customer = self.get_object()

        if not customer.account:
            return Response({
                'results': [],
                'message': 'No account linked to this customer'
            })

        contacts = Contact.objects.filter(
            account=customer.account
        ).order_by('first_name', 'last_name')

        serializer = ContactAutocompleteSerializer(contacts, many=True)
        return Response({
            'results': serializer.data,
            'count': contacts.count(),
            'account_name': customer.account.account_name
        })

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get customer statistics for dashboard
        GET /api/finance/customers/stats/
        """
        queryset = self.get_queryset()

        stats = {
            'total_customers': queryset.count(),
            'active_customers': queryset.filter(customer_status='active').count(),
            'inactive_customers': queryset.filter(customer_status='inactive').count(),
            'suspended_customers': queryset.filter(customer_status='suspended').count(),
            'business_customers': queryset.filter(customer_type='business').count(),
            'individual_customers': queryset.filter(customer_type='individual').count(),
            'by_currency': {},
            'by_payment_terms': {},
            'recent_customers': queryset.order_by('-created_at')[:5].count(),
        }

        # Currency breakdown
        for choice in FinanceContact._meta.get_field('currency').choices:
            currency_code = choice[0]
            count = queryset.filter(currency=currency_code).count()
            if count > 0:
                stats['by_currency'][currency_code] = count

        # Payment terms breakdown
        for choice in FinanceContact._meta.get_field('payment_terms').choices:
            terms_code = choice[0]
            count = queryset.filter(payment_terms=terms_code).count()
            if count > 0:
                stats['by_payment_terms'][terms_code] = count

        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def link_to_vendor(self, request, pk=None):
        """
        Link customer to a vendor representing the same entity
        POST /api/finance/customers/{id}/link_to_vendor/
        
        Body: {
            "vendor_id": 123  // ID of vendor to link
        }
        """
        from django.db import transaction
        
        vendor_id = request.data.get('vendor_id')
        if not vendor_id:
            return Response(
                {'error': 'vendor_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate vendor_id is a valid integer
        try:
            vendor_id = int(vendor_id)
        except (TypeError, ValueError):
            return Response(
                {'error': 'vendor_id must be a valid integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Lock both records to prevent race conditions
                customer = FinanceContact.objects.select_for_update().get(
                    contact_id=pk
                )
                vendor = FinanceContact.objects.select_for_update().get(
                    contact_id=vendor_id,
                    contact_type='vendor'
                )
                
                # Check if already linked (with locks held)
                if customer.linked_entity:
                    return Response(
                        {'error': 'Customer is already linked to a vendor'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if vendor.linked_entity:
                    return Response(
                        {'error': 'Vendor is already linked to another customer'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create bidirectional link
                customer.linked_entity = vendor
                customer.link_created_at = timezone.now()
                customer.link_created_by = request.user
                customer.save()
                
                vendor.linked_entity = customer
                vendor.link_created_at = timezone.now()
                vendor.link_created_by = request.user
                vendor.save()
            
            return Response({
                'message': 'Successfully linked customer to vendor',
                'vendor': {
                    'id': vendor.contact_id,
                    'vendor_number': vendor.vendor_number,
                    'display_name': vendor.display_name
                },
                'net_balance': customer.net_balance
            })
            
        except FinanceContact.DoesNotExist:
            return Response(
                {'error': 'Vendor not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['delete'])
    def unlink_vendor(self, request, pk=None):
        """
        Remove link between customer and vendor
        DELETE /api/finance/customers/{id}/unlink_vendor/
        """
        customer = self.get_object()
        
        if not customer.linked_entity:
            return Response(
                {'error': 'Customer is not linked to any vendor'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        vendor = customer.linked_entity
        
        # Remove bidirectional link
        customer.linked_entity = None
        customer.link_created_at = None
        customer.link_created_by = None
        customer.save()
        
        vendor.linked_entity = None
        vendor.link_created_at = None
        vendor.link_created_by = None
        vendor.save()
        
        return Response({'message': 'Successfully unlinked vendor'})
    
    
    @action(detail=True, methods=['get'])
    def balance_summary(self, request, pk=None):
        """
        Get balance summary including linked vendor if exists
        GET /api/finance/customers/{id}/balance_summary/
        """
        customer = self.get_object()
        
        summary = {
            'customer': {
                'id': customer.contact_id,
                'number': customer.customer_number,
                'name': customer.display_name,
                'receivable': float(customer.outstanding_receivable_amount or 0),
                'unused_credits': float(customer.unused_credits_receivable_amount or 0)
            }
        }
        
        if customer.linked_entity:
            vendor = customer.linked_entity
            summary['vendor'] = {
                'id': vendor.contact_id,
                'number': vendor.vendor_number,
                'name': vendor.display_name,
                'payable': float(vendor.outstanding_receivable_amount or 0)
            }
            summary['net_balance'] = float(customer.net_balance)
            summary['net_position'] = 'receivable' if customer.net_balance > 0 else 'payable'
        
        return Response(summary)


class VendorViewSet(BaseContactViewSet):
    """
    ViewSet for managing vendors with tenant isolation and RBAC
    """
    
    def get_queryset(self):
        """
        Return only vendors (not customers)
        """
        queryset = super().get_queryset()
        return queryset.filter(contact_type='vendor')
    
    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return CustomerListSerializer  # Same serializer works for vendors
        elif self.action in ['create', 'update', 'partial_update']:
            return CustomerCreateUpdateSerializer
        return CustomerDetailSerializer
    
    def perform_create(self, serializer):
        """Vendor creation with auto-generated vendor number"""
        vendor_number = self.generate_vendor_number()
        
        serializer.save(
            vendor_number=vendor_number,
            contact_type='vendor',
            source='finance',
            updated_by=self.request.user
        )
    
    def perform_update(self, serializer):
        """Set updated_by on vendor update"""
        serializer.save(updated_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Get vendor statistics for dashboard
        GET /api/finance/vendors/stats/
        """
        queryset = self.get_queryset()
        
        stats = {
            'total_vendors': queryset.count(),
            'active_vendors': queryset.filter(customer_status='active').count(),
            'inactive_vendors': queryset.filter(customer_status='inactive').count(),
            'business_vendors': queryset.filter(customer_type='business').count(),
            'individual_vendors': queryset.filter(customer_type='individual').count(),
            'by_currency': {},
            'recent_vendors': queryset.order_by('-created_at')[:5].count(),
        }
        
        # Currency breakdown
        for choice in FinanceContact._meta.get_field('currency').choices:
            currency_code = choice[0]
            count = queryset.filter(currency=currency_code).count()
            if count > 0:
                stats['by_currency'][currency_code] = count
        
        return Response(stats)
    
    @action(detail=True, methods=['post'])
    def link_to_customer(self, request, pk=None):
        """
        Link vendor to a customer representing the same entity
        POST /api/finance/vendors/{id}/link_to_customer/
        
        Body: {
            "customer_id": 123  // ID of customer to link
        }
        """
        from django.db import transaction
        
        customer_id = request.data.get('customer_id')
        if not customer_id:
            return Response(
                {'error': 'customer_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Validate customer_id is a valid integer
        try:
            customer_id = int(customer_id)
        except (TypeError, ValueError):
            return Response(
                {'error': 'customer_id must be a valid integer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            with transaction.atomic():
                # Lock both records to prevent race conditions
                vendor = FinanceContact.objects.select_for_update().get(
                    contact_id=pk
                )
                customer = FinanceContact.objects.select_for_update().get(
                    contact_id=customer_id,
                    contact_type='customer'
                )
                
                # Check if already linked (with locks held)
                if vendor.linked_entity:
                    return Response(
                        {'error': 'Vendor is already linked to a customer'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                if customer.linked_entity:
                    return Response(
                        {'error': 'Customer is already linked to another vendor'},
                        status=status.HTTP_400_BAD_REQUEST
                    )
                
                # Create bidirectional link
                vendor.linked_entity = customer
                vendor.link_created_at = timezone.now()
                vendor.link_created_by = request.user
                vendor.save()
                
                customer.linked_entity = vendor
                customer.link_created_at = timezone.now()
                customer.link_created_by = request.user
                customer.save()
            
            return Response({
                'message': 'Successfully linked vendor to customer',
                'customer': {
                    'id': customer.contact_id,
                    'customer_number': customer.customer_number,
                    'display_name': customer.display_name
                },
                'net_balance': vendor.net_balance
            })
            
        except FinanceContact.DoesNotExist:
            return Response(
                {'error': 'Customer not found'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['delete'])
    def unlink_customer(self, request, pk=None):
        """
        Remove link between vendor and customer
        DELETE /api/finance/vendors/{id}/unlink_customer/
        """
        vendor = self.get_object()
        
        if not vendor.linked_entity:
            return Response(
                {'error': 'Vendor is not linked to any customer'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        customer = vendor.linked_entity
        
        # Remove bidirectional link
        vendor.linked_entity = None
        vendor.link_created_at = None
        vendor.link_created_by = None
        vendor.save()
        
        customer.linked_entity = None
        customer.link_created_at = None
        customer.link_created_by = None
        customer.save()
        
        return Response({'message': 'Successfully unlinked customer'})
    
    
    @action(detail=True, methods=['get'])
    def balance_summary(self, request, pk=None):
        """
        Get balance summary including linked customer if exists
        GET /api/finance/vendors/{id}/balance_summary/
        """
        vendor = self.get_object()
        
        summary = {
            'vendor': {
                'id': vendor.contact_id,
                'number': vendor.vendor_number,
                'name': vendor.display_name,
                'payable': float(vendor.outstanding_receivable_amount or 0)
            }
        }
        
        if vendor.linked_entity:
            customer = vendor.linked_entity
            summary['customer'] = {
                'id': customer.contact_id,
                'number': customer.customer_number,
                'name': customer.display_name,
                'receivable': float(customer.outstanding_receivable_amount or 0),
                'unused_credits': float(customer.unused_credits_receivable_amount or 0)
            }
            summary['net_balance'] = float(vendor.net_balance)
            summary['net_position'] = 'receivable' if vendor.net_balance > 0 else 'payable'
        
        return Response(summary)


class ContactPersonViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing contact persons with Zoho-style API endpoints
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_customers']
    
    def get_queryset(self):
        """Return contact persons filtered by current tenant"""
        return ContactPerson.objects.select_related(
            'contact',
            'created_by',
            'updated_by'
        ).all()
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ContactPersonListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return ContactPersonCreateUpdateSerializer
        return ContactPersonDetailSerializer
    
    def list(self, request, *args, **kwargs):
        """
        List contact persons for a specific contact
        GET /api/finance/contacts/{contact_id}/contactpersons/
        """
        contact_id = self.kwargs.get('contact_id')
        if not contact_id:
            return Response(
                {'error': 'contact_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify contact exists
        try:
            contact = FinanceContact.objects.get(contact_id=contact_id)
        except FinanceContact.DoesNotExist:
            return Response(
                {'error': 'Contact not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Get contact persons for this contact
        queryset = self.get_queryset().filter(contact=contact)
        
        # Pagination support
        page = request.query_params.get('page', 1)
        per_page = request.query_params.get('per_page', 200)
        
        try:
            page = int(page)
            per_page = int(per_page)
        except ValueError:
            page = 1
            per_page = 200
        
        # Apply pagination
        start = (page - 1) * per_page
        end = start + per_page
        total_count = queryset.count()
        
        contact_persons = queryset[start:end]
        serializer = self.get_serializer(contact_persons, many=True)
        
        return Response({
            'code': 0,
            'message': 'success',
            'contact_persons': serializer.data,
            'page_context': {
                'page': page,
                'per_page': per_page,
                'has_more_page': end < total_count,
                'sort_column': 'contact_person_id',
                'sort_order': 'A'
            }
        })
    
    def retrieve(self, request, *args, **kwargs):
        """
        Get specific contact person
        GET /api/finance/contacts/{contact_id}/contactpersons/{contact_person_id}/
        """
        contact_id = self.kwargs.get('contact_id')
        contact_person_id = kwargs.get('pk')
        
        if not contact_id:
            return Response(
                {'error': 'contact_id is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Verify contact exists
            contact = FinanceContact.objects.get(contact_id=contact_id)
            # Get the specific contact person
            contact_person = self.get_queryset().get(
                contact_person_id=contact_person_id,
                contact=contact
            )
        except FinanceContact.DoesNotExist:
            return Response(
                {'error': 'Contact not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ContactPerson.DoesNotExist:
            return Response(
                {'error': 'Contact person not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(contact_person)
        return Response({
            'code': 0,
            'message': 'success',
            'contact_person': serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        """
        Create a new contact person
        POST /api/finance/contacts/contactpersons/
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        # Verify the contact exists and user has permission
        contact_id = serializer.validated_data.get('contact')
        if isinstance(contact_id, FinanceContact):
            contact = contact_id
        else:
            try:
                contact = FinanceContact.objects.get(contact_id=contact_id)
            except FinanceContact.DoesNotExist:
                return Response(
                    {'error': 'Contact not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        # Create the contact person
        contact_person = serializer.save()
        
        # Return Zoho-style response
        response_serializer = ContactPersonDetailSerializer(contact_person)
        return Response({
            'code': 0,
            'message': 'The contactperson has been Created',
            'contact_person': [response_serializer.data]  # Zoho returns array
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, pk=None, *args, **kwargs):
        """
        Update a contact person
        PUT /api/finance/contacts/contactpersons/{contact_person_id}/
        """
        try:
            contact_person = self.get_queryset().get(contact_person_id=pk)
        except ContactPerson.DoesNotExist:
            return Response(
                {'error': 'Contact person not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(contact_person, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Return updated contact person
        response_serializer = ContactPersonDetailSerializer(contact_person)
        return Response({
            'code': 0,
            'message': 'The contactperson details has been updated.',
            'contact_person': [response_serializer.data]  # Zoho returns array
        })
    
    def destroy(self, request, pk=None, *args, **kwargs):
        """
        Delete a contact person
        DELETE /api/finance/contacts/contactpersons/{contact_person_id}/
        """
        try:
            contact_person = self.get_queryset().get(contact_person_id=pk)
        except ContactPerson.DoesNotExist:
            return Response(
                {'error': 'Contact person not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        contact_person.delete()
        
        return Response({
            'code': 0,
            'message': 'The contact person has been deleted.'
        })
    
    @action(detail=True, methods=['post'], url_path='primary')
    def mark_primary(self, request, pk=None, *args, **kwargs):
        """
        Mark contact person as primary
        POST /api/finance/contacts/contactpersons/{contact_person_id}/primary/
        """
        try:
            contact_person = self.get_queryset().get(contact_person_id=pk)
        except ContactPerson.DoesNotExist:
            return Response(
                {'error': 'Contact person not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Set this contact person as primary (model's save method handles unsetting others)
        contact_person.is_primary_contact = True
        contact_person.save()
        
        return Response({
            'code': 0,
            'message': 'This contact person has been marked as your primary contact person.'
        })
