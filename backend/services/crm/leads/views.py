# Removed cache_page import - caching disabled for immediate data updates
import logging
from datetime import datetime

from django.db import models
from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.auth.utils import rate_limit
from core.tenants.permissions import HasTenantPermission, IsTenantUser

from .models import Lead
from .serializers import LeadListSerializer, LeadSerializer


class LeadViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing leads with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]

    def get_required_permissions(self):
        """
        Return required permissions based on action
        """
        if self.action in ['list', 'retrieve', 'summary', 'account_info', 'by_account', 'by_status']:
            # View permissions - allow various viewing roles
            return ['all', 'manage_leads', 'view_customers', 'view_only', 'manage_contacts', 'manage_accounts']
        elif self.action in ['create']:
            # Create permissions - only for lead managers and sales reps
            return ['all', 'manage_leads']
        elif self.action in ['update', 'partial_update']:
            # Update permissions - owners or lead managers
            return ['all', 'manage_leads']
        elif self.action in ['destroy']:
            # Delete permissions - only admins and lead managers
            return ['all', 'manage_leads']
        elif self.action in ['convert']:
            # Convert permissions - only lead managers
            return ['all', 'manage_leads']
        else:
            # Default to view permissions
            return ['all', 'manage_leads', 'view_customers', 'view_only']

    @property
    def required_permissions(self):
        return self.get_required_permissions()

    def get_queryset(self):
        """
        Return leads filtered by current tenant and user permissions
        Tenant isolation is handled by schema-based multi-tenancy
        """
        queryset = Lead.objects.all()

        # If user is superadmin or has 'all' permission, return all leads
        if (hasattr(self.request.user, 'is_superadmin') and self.request.user.is_superadmin) or \
           self._has_tenant_permission(self.request.user, 'all'):
            return queryset

        # If user has manage_leads or view_customers, return all leads in tenant
        if self._has_tenant_permission(self.request.user, ['manage_leads', 'view_customers']):
            return queryset

        # For sales reps or limited users, return only leads they own or created
        if self._has_tenant_permission(self.request.user, ['view_only']):
            return queryset.filter(
                models.Q(lead_owner=self.request.user) |
                models.Q(created_by=self.request.user)
            )

        # Default to user's leads only
        return queryset.filter(
            models.Q(lead_owner=self.request.user) |
            models.Q(created_by=self.request.user)
        )

    def _has_tenant_permission(self, user, permissions):
        """Check if user has any of the specified permissions in current tenant"""
        if isinstance(permissions, str):
            permissions = [permissions]

        try:
            user_roles = user.tenant_user_roles.filter(is_active=True)
            for user_role in user_roles:
                role_permissions = user_role.role.permissions or []
                for permission in permissions:
                    if permission in role_permissions:
                        return True
            return False
        except Exception:
            return False

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return LeadListSerializer
        return LeadSerializer

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create lead with audit info (tenant isolation handled by schema)
        """
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update lead with audit info and ownership validation
        """
        # Check if user can update this specific lead
        lead = self.get_object()
        if not self._can_modify_lead(lead):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to modify this lead.")

        serializer.save(updated_by=self.request.user)

    def perform_destroy(self, instance):
        """
        Delete lead with ownership validation
        """
        # Check if user can delete this specific lead
        if not self._can_modify_lead(instance):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to delete this lead.")

        super().perform_destroy(instance)

    def _can_modify_lead(self, lead):
        """Check if user can modify/delete a specific lead"""
        # Superadmin can modify any lead
        if hasattr(self.request.user, 'is_superadmin') and self.request.user.is_superadmin:
            return True

        # Users with 'all' or 'manage_leads' can modify any lead in their tenant
        if self._has_tenant_permission(self.request.user, ['all', 'manage_leads']):
            return True

        # Users can modify leads they own or created
        return (lead.lead_owner == self.request.user or
                lead.created_by == self.request.user)

    def _enhanced_convert(self, lead, account_data, contact_data, create_deal, deal_data):
        """
        Enhanced conversion with custom account, contact, and deal data
        """
        from datetime import datetime
        from decimal import Decimal

        from django.db import transaction

        from services.crm.contacts.models import Contact
        from services.crm.deals.models import Deal

        with transaction.atomic():
            # Prepare account data with custom data - map to correct Account model fields
            account_fields = {
                'account_name': account_data.get('account_name') or account_data.get('company_name', f"{lead.first_name} {lead.last_name} Company"),
                'industry': account_data.get('industry', lead.industry or ''),
                'website': account_data.get('website', lead.website or ''),
                'phone': account_data.get('phone', lead.phone or ''),
                # Map address fields to Account model's billing address fields
                'billing_street': account_data.get('street', lead.street or ''),
                'billing_city': account_data.get('city', lead.city or ''),
                'billing_state_province': account_data.get('state', lead.state or ''),
                'billing_country': account_data.get('country', lead.country or ''),
                'billing_zip_postal_code': account_data.get('postal_code', lead.postal_code or ''),
                # Duplicate billing address to shipping address
                'shipping_street': account_data.get('street', lead.street or ''),
                'shipping_city': account_data.get('city', lead.city or ''),
                'shipping_state_province': account_data.get('state', lead.state or ''),
                'shipping_country': account_data.get('country', lead.country or ''),
                'shipping_zip_postal_code': account_data.get('postal_code', lead.postal_code or ''),
                'number_of_employees': account_data.get('number_of_employees', lead.number_of_employees),
                'description': account_data.get('description', lead.description or ''),
                'owner': lead.lead_owner,
                'created_by': self.request.user,
                'updated_by': self.request.user,
            }

            # Remove empty values to avoid validation issues
            account_fields = {k: v for k, v in account_fields.items() if v not in ['', None]}

            # Use smart account matching to prevent duplicates
            account = lead.find_or_create_account(account_fields)

            # Create contact with custom data - map to correct Contact model fields
            contact_fields = {
                'account': account,
                'first_name': contact_data.get('first_name', lead.first_name),
                'last_name': contact_data.get('last_name', lead.last_name),
                'title': contact_data.get('title', lead.title or ''),
                'email': contact_data.get('email', lead.email or ''),
                'phone': contact_data.get('phone', lead.phone or ''),
                # Map address fields to Contact model's mailing address fields
                'mailing_street': contact_data.get('street', lead.street or ''),
                'mailing_city': contact_data.get('city', lead.city or ''),
                'mailing_state_province': contact_data.get('state', lead.state or ''),
                'mailing_country': contact_data.get('country', lead.country or ''),
                'postal_code': contact_data.get('postal_code', lead.postal_code or ''),
                'owner': lead.lead_owner,
                'created_by': self.request.user,
                'updated_by': self.request.user,
            }

            # Remove empty values but keep the structure simpler
            contact_fields = {k: v if v else None for k, v in contact_fields.items()}
            contact = Contact.objects.create(**contact_fields)

            deal = None
            if create_deal:
                # Parse deal amount
                amount = deal_data.get('amount')
                if amount:
                    try:
                        amount = Decimal(str(amount))
                    except (ValueError, TypeError, Decimal.InvalidOperation):
                        amount = None

                # Parse close date
                close_date = deal_data.get('close_date')
                if close_date:
                    try:
                        if isinstance(close_date, str):
                            close_date = datetime.strptime(close_date, '%Y-%m-%d').date()
                    except (ValueError, TypeError):
                        close_date = None

                # Create deal with custom data - map to correct Deal model fields
                deal_fields = {
                    'account': account,
                    'deal_name': deal_data.get('deal_name', f"Deal for {contact.first_name} {contact.last_name}"),
                    'stage': deal_data.get('stage', 'Prospecting'),
                    'amount': amount or 0.00,
                    'close_date': close_date,
                    'owner': self.request.user,
                    'primary_contact': contact,  # Link the created contact as primary contact
                    'created_by': self.request.user,
                    'updated_by': self.request.user,
                }
                # Note: Removed 'contact' and 'description' as Deal model doesn't have these fields

                # Remove empty values
                deal_fields = {k: v for k, v in deal_fields.items() if v not in ['', None]}
                deal = Deal.objects.create(**deal_fields)

            # Link lead to the account
            lead.account = account
            lead.save()

            # Delete the original lead
            lead.delete()

            return account, contact, deal

    def list(self, request, *args, **kwargs):
        """
        List leads with optional date filtering for immediate data updates
        """
        # Get base queryset
        queryset = self.filter_queryset(self.get_queryset())
        
        # Handle created_at__date filtering for "Today's Leads" functionality
        created_at_date = request.query_params.get('created_at__date')
        if created_at_date:
            try:
                # Parse the date string (YYYY-MM-DD format)
                date_obj = datetime.strptime(created_at_date, '%Y-%m-%d').date()
                # Filter for leads created on that specific date
                queryset = queryset.filter(created_at__date=date_obj)
            except (ValueError, TypeError):
                # If date parsing fails, log it but don't break the request
                logger = logging.getLogger(__name__)
                logger.warning(f"Invalid date format for created_at__date: {created_at_date}")
        
        # Apply pagination
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get lead summary statistics
        """
        leads = self.get_queryset()

        # Calculate statistics
        total_leads = leads.count()
        leads_with_account = leads.filter(account__isnull=False).count()
        leads_with_phone = leads.exclude(phone__isnull=True).exclude(phone__exact='').count()
        leads_with_score = leads.exclude(score__isnull=True).count()

        # Group by status
        leads_by_status = {}
        for lead in leads:
            status = lead.lead_status or 'Unknown'
            leads_by_status[status] = leads_by_status.get(status, 0) + 1

        # Group by source
        leads_by_source = {}
        for lead in leads:
            source = lead.lead_source or 'Unknown'
            leads_by_source[source] = leads_by_source.get(source, 0) + 1

        return Response({
            'total_leads': total_leads,
            'leads_with_account': leads_with_account,
            'leads_with_phone': leads_with_phone,
            'leads_with_score': leads_with_score,
            'leads_by_status': leads_by_status,
            'leads_by_source': leads_by_source,
            'tenant': request.tenant.name if request.tenant else None,
        })

    @action(detail=True, methods=['get'])
    def account_info(self, request, pk=None):
        """
        Get account information for a specific lead
        """
        lead = self.get_object()

        if not lead.account:
            return Response({
                'lead_id': lead.lead_id,
                'lead_name': f"{lead.first_name} {lead.last_name}",
                'account': None,
                'message': 'Lead is not associated with any account'
            })

        account = lead.account
        return Response({
            'lead_id': lead.lead_id,
            'lead_name': f"{lead.first_name} {lead.last_name}",
            'account': {
                'account_id': account.account_id,
                'account_name': account.account_name,
                'industry': account.industry,
                'website': account.website,
                'phone': account.phone,
            }
        })

    @action(detail=False, methods=['get'])
    def by_account(self, request):
        """
        Get leads grouped by account
        """
        account_id = request.query_params.get('account_id')
        if not account_id:
            return Response({
                'error': 'account_id parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        leads = self.get_queryset().filter(account_id=account_id)

        leads_data = []
        for lead in leads:
            leads_data.append({
                'lead_id': lead.lead_id,
                'first_name': lead.first_name,
                'last_name': lead.last_name,
                'email': lead.email,
                'phone': lead.phone,
                'title': lead.title,
                'lead_status': lead.lead_status,
                'score': lead.score,
                'lead_source': lead.lead_source,
                'owner': lead.lead_owner.get_full_name() if lead.lead_owner else None,
            })

        return Response({
            'account_id': account_id,
            'leads': leads_data,
            'count': len(leads_data)
        })

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """
        Get leads filtered by status
        """
        lead_status = request.query_params.get('status')
        if not lead_status:
            return Response({
                'error': 'status parameter is required'
            }, status=status.HTTP_400_BAD_REQUEST)

        leads = self.get_queryset().filter(lead_status=lead_status)
        serializer = LeadListSerializer(leads, many=True)

        return Response({
            'status': lead_status,
            'leads': serializer.data,
            'count': leads.count()
        })

    @action(detail=False, methods=['get'])
    def score_distribution(self, request):
        """
        Get lead score distribution statistics for reporting
        """
        leads = self.get_queryset()
        
        # Calculate total leads
        total_leads = leads.count()
        if total_leads == 0:
            return Response({
                'total_leads': 0,
                'avg_score': 0,
                'high_score_leads': 0,
                'medium_score_leads': 0,
                'low_score_leads': 0,
                'very_low_score_leads': 0,
                'distribution': []
            })

        # Filter leads with scores (exclude null scores)
        scored_leads = leads.exclude(score__isnull=True)
        
        # Calculate average score
        avg_score = scored_leads.aggregate(avg_score=models.Avg('score'))['avg_score'] or 0
        
        # Count leads in different score ranges
        high_score_leads = scored_leads.filter(score__gt=50).count()
        medium_score_leads = scored_leads.filter(score__gte=30, score__lte=50).count()
        low_score_leads = scored_leads.filter(score__gte=10, score__lt=30).count()
        very_low_score_leads = scored_leads.filter(score__lt=10).count()
        
        # Create distribution data
        distribution = [
            {
                'score_range': 'High Score (>50)',
                'count': high_score_leads,
                'percentage': round((high_score_leads / total_leads) * 100, 1) if total_leads > 0 else 0
            },
            {
                'score_range': 'Medium Score (30-50)',
                'count': medium_score_leads,
                'percentage': round((medium_score_leads / total_leads) * 100, 1) if total_leads > 0 else 0
            },
            {
                'score_range': 'Low Score (10-30)',
                'count': low_score_leads,
                'percentage': round((low_score_leads / total_leads) * 100, 1) if total_leads > 0 else 0
            },
            {
                'score_range': 'Very Low Score (<10)',
                'count': very_low_score_leads,
                'percentage': round((very_low_score_leads / total_leads) * 100, 1) if total_leads > 0 else 0
            },
        ]
        
        return Response({
            'total_leads': total_leads,
            'avg_score': round(avg_score, 1) if avg_score else 0,
            'high_score_leads': high_score_leads,
            'medium_score_leads': medium_score_leads,
            'low_score_leads': low_score_leads,
            'very_low_score_leads': very_low_score_leads,
            'distribution': distribution
        })

    @action(detail=True, methods=['post'])
    def convert(self, request, pk=None):
        """
        Convert lead to account, contact, and optional opportunity
        """
        lead = self.get_object()

        # Check if user can modify this lead
        if not self._can_modify_lead(lead):
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("You don't have permission to convert this lead.")

        try:
            # Get conversion data from request
            account_data = request.data.get('account_data', {})
            contact_data = request.data.get('contact_data', {})
            create_deal = request.data.get('create_deal', True)
            deal_data = request.data.get('deal_data', {}) if create_deal else {}

            # If no custom data provided, use existing simple conversion
            if not account_data and not contact_data and not deal_data:
                # Legacy simple conversion
                deal_name = request.data.get('deal_name')
                deal_stage = request.data.get('deal_stage', 'Prospecting')
                deal_amount = request.data.get('deal_amount')
                deal_close_date = request.data.get('deal_close_date')

                # Convert string amount to decimal if provided
                if deal_amount:
                    try:
                        deal_amount = float(deal_amount)
                    except (ValueError, TypeError):
                        deal_amount = None

                # Parse close date if provided
                if deal_close_date:
                    from datetime import datetime
                    try:
                        deal_close_date = datetime.strptime(deal_close_date, '%Y-%m-%d').date()
                    except ValueError:
                        deal_close_date = None

                # Convert the lead
                account, contact, deal = lead.convert(
                    deal_name=deal_name,
                    deal_stage=deal_stage,
                    deal_amount=deal_amount,
                    deal_close_date=deal_close_date
                )
            else:
                # Enhanced conversion with custom data
                account, contact, deal = self._enhanced_convert(
                    lead, account_data, contact_data, create_deal, deal_data
                )

            # Return success response with created objects
            response_data = {
                'message': 'Lead converted successfully',
                'lead_name': f"{lead.first_name} {lead.last_name}",
                'account': {
                    'account_id': account.account_id,
                    'account_name': account.account_name,
                    'industry': account.industry,
                },
                'contact': {
                    'contact_id': contact.contact_id,
                    'first_name': contact.first_name,
                    'last_name': contact.last_name,
                    'email': contact.email,
                    'title': contact.title,
                }
            }

            # Only include deal info if deal was created
            if deal:
                response_data['deal'] = {
                    'deal_id': deal.deal_id,
                    'deal_name': deal.deal_name,
                    'stage': deal.stage,
                    'amount': str(deal.amount) if deal.amount else None,
                    'close_date': deal.close_date.isoformat() if deal.close_date else None,
                }

            return Response(response_data, status=status.HTTP_201_CREATED)

        except Exception as e:
            # Handle any errors during conversion
            return Response({
                'error': 'Failed to convert lead',
                'message': str(e),
                'lead_id': lead.lead_id,
                'lead_name': f"{lead.first_name} {lead.last_name}",
            }, status=status.HTTP_400_BAD_REQUEST)
