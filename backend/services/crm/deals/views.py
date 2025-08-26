from datetime import timedelta

# Removed cache_page import - caching disabled for immediate data updates
from django.db.models import Avg, Count, Sum
from django.utils import timezone
from django.utils.decorators import method_decorator
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from core.auth.utils import rate_limit
from core.tenants.permissions import HasTenantPermission, IsTenantUser

from .models import Deal
from .serializers import (
    DealListSerializer,
    DealSerializer,
    DealSummarySerializer,
)


class DealViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing deals with tenant isolation and RBAC
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    required_permissions = ['all', 'manage_opportunities']

    def get_queryset(self):
        """
        Return deals filtered by current tenant
        Tenant isolation is handled by schema-based multi-tenancy
        """
        return Deal.objects.select_related(
            'account', 'owner', 'created_by', 'updated_by', 'primary_contact'
        )

    def get_serializer_class(self):
        """
        Return appropriate serializer based on action
        """
        if self.action == 'list':
            return DealListSerializer
        return DealSerializer

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_create(self, serializer):
        """
        Create deal with audit info (tenant isolation handled by schema)
        """
        serializer.save(
            created_by=self.request.user,
            updated_by=self.request.user
        )

    @method_decorator(rate_limit(max_requests=10, window_minutes=1))
    def perform_update(self, serializer):
        """
        Update deal with audit info
        """
        serializer.save(updated_by=self.request.user)

    def list(self, request, *args, **kwargs):
        """
        List deals without caching for immediate data updates
        """
        return super().list(request, *args, **kwargs)

    @action(detail=True, methods=['get'])
    def account_info(self, request, pk=None):
        """
        Get account information for a specific deal
        """
        deal = self.get_object()
        account = deal.account

        if not account:
            return Response({
                'error': 'No account associated with this deal'
            }, status=status.HTTP_404_NOT_FOUND)

        account_data = {
            'account_id': account.account_id,
            'account_name': account.account_name,
            'industry': account.industry,
            'website': account.website,
            'phone': account.phone,
            'owner': account.owner.get_full_name() if account.owner else None,
            'billing_city': account.billing_city,
            'billing_country': account.billing_country,
        }

        return Response({
            'deal_id': deal.deal_id,
            'deal_name': deal.deal_name,
            'account': account_data
        })

    @action(detail=False, methods=['get'])
    def by_stage(self, request):
        """
        Get deals grouped by stage
        """
        stage = request.query_params.get('stage')
        deals = self.get_queryset()

        if stage:
            deals = deals.filter(stage__icontains=stage)

        # Group by stage
        stage_groups = {}
        for deal in deals:
            stage_key = deal.stage
            if stage_key not in stage_groups:
                stage_groups[stage_key] = []

            stage_groups[stage_key].append({
                'deal_id': deal.deal_id,
                'deal_name': deal.deal_name,
                'amount': str(deal.amount),
                'close_date': deal.close_date,
                'account_name': deal.account.account_name if deal.account else None,
                'owner': deal.owner.get_full_name() if deal.owner else None,
            })

        return Response({
            'deals_by_stage': stage_groups,
            'total_stages': len(stage_groups),
            'total_deals': deals.count()
        })

    @action(detail=False, methods=['get'])
    def by_account(self, request):
        """
        Get deals filtered by account
        """
        account_id = request.query_params.get('account_id')
        account_name = request.query_params.get('account_name')

        deals = self.get_queryset()

        if account_id:
            deals = deals.filter(account_id=account_id)
        elif account_name:
            deals = deals.filter(account__account_name__icontains=account_name)

        deals_data = []
        for deal in deals:
            deals_data.append({
                'deal_id': deal.deal_id,
                'deal_name': deal.deal_name,
                'stage': deal.stage,
                'amount': str(deal.amount),
                'close_date': deal.close_date,
                'account_name': deal.account.account_name if deal.account else None,
                'owner': deal.owner.get_full_name() if deal.owner else None,
            })

        return Response({
            'deals': deals_data,
            'count': len(deals_data),
            'account_filter': account_name or account_id
        })

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """
        Get deal summary statistics
        """
        deals = self.get_queryset()

        # Calculate statistics
        total_deals = deals.count()

        # Total and average deal value
        aggregates = deals.aggregate(
            total_value=Sum('amount'),
            avg_value=Avg('amount')
        )

        total_value = aggregates['total_value'] or 0
        avg_deal_value = aggregates['avg_value'] or 0

        # Deals by stage
        deals_by_stage = {}
        stage_counts = deals.values('stage').annotate(count=Count('deal_id'))
        for stage_count in stage_counts:
            deals_by_stage[stage_count['stage']] = stage_count['count']

        # Deals closing this month and next month
        today = timezone.now().date()
        this_month_start = today.replace(day=1)
        next_month_start = (this_month_start + timedelta(days=32)).replace(day=1)
        next_month_end = (next_month_start + timedelta(days=32)).replace(day=1) - timedelta(days=1)

        deals_closing_this_month = deals.filter(
            close_date__gte=this_month_start,
            close_date__lt=next_month_start
        ).count()

        deals_closing_next_month = deals.filter(
            close_date__gte=next_month_start,
            close_date__lte=next_month_end
        ).count()

        summary_data = {
            'total_deals': total_deals,
            'total_value': total_value,
            'avg_deal_value': avg_deal_value,
            'deals_by_stage': deals_by_stage,
            'deals_closing_this_month': deals_closing_this_month,
            'deals_closing_next_month': deals_closing_next_month,
        }

        serializer = DealSummarySerializer(summary_data)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def contacts(self, request, pk=None):
        """
        Get all contacts for a specific deal (via the deal's account)
        """
        deal = self.get_object()
        account = deal.account

        if not account:
            return Response({
                'error': 'No account associated with this deal',
                'deal_id': deal.deal_id,
                'deal_name': deal.deal_name,
                'contacts': [],
                'count': 0
            })

        contacts = account.contacts.all()

        # Simple serialization for related contacts
        contacts_data = []
        for contact in contacts:
            contacts_data.append({
                'contact_id': contact.contact_id,
                'first_name': contact.first_name,
                'last_name': contact.last_name,
                'email': contact.email,
                'phone': contact.phone,
                'title': contact.title,
            })

        return Response({
            'deal_id': deal.deal_id,
            'deal_name': deal.deal_name,
            'account_id': account.account_id,
            'account_name': account.account_name,
            'contacts': contacts_data,
            'count': len(contacts_data)
        })

    @action(detail=False, methods=['get'])
    def closing_soon(self, request):
        """
        Get deals closing within the next 30 days
        """
        days = int(request.query_params.get('days', 30))
        today = timezone.now().date()
        cutoff_date = today + timedelta(days=days)

        deals = self.get_queryset().filter(
            close_date__gte=today,
            close_date__lte=cutoff_date
        ).exclude(stage__in=['Closed', 'Closed Won', 'Closed Lost']).order_by('close_date')

        deals_data = []
        for deal in deals:
            days_until_close = (deal.close_date - today).days
            deals_data.append({
                'deal_id': deal.deal_id,
                'deal_name': deal.deal_name,
                'stage': deal.stage,
                'amount': str(deal.amount),
                'close_date': deal.close_date,
                'days_until_close': days_until_close,
                'account_name': deal.account.account_name if deal.account else None,
                'owner': deal.owner.get_full_name() if deal.owner else None,
            })

        return Response({
            'deals': deals_data,
            'count': len(deals_data),
            'days_filter': days
        })

    @action(detail=False, methods=['get'])
    def date_analytics(self, request):
        """
        Get deal analytics by date/month for reporting charts
        """
        from datetime import datetime
        from collections import defaultdict
        import calendar
        
        deals = self.get_queryset()
        
        # Get deals with close dates
        dated_deals = deals.exclude(close_date__isnull=True)
        
        # Total deals count
        total_deals = dated_deals.count()
        if total_deals == 0:
            return Response({
                'total_deals': 0,
                'deals_by_month': [],
                'deals_by_stage_monthly': [],
                'total_value_by_month': [],
                'avg_deal_value_by_month': [],
                'current_year': datetime.now().year
            })
        
        # Group deals by month/year for charts
        monthly_data = defaultdict(lambda: {
            'count': 0, 
            'total_value': 0, 
            'stages': defaultdict(int),
            'month_name': '',
            'year': 0
        })
        
        for deal in dated_deals:
            if deal.close_date:
                # Create month key (YYYY-MM format)
                month_key = deal.close_date.strftime('%Y-%m')
                month_name = deal.close_date.strftime('%B %Y')
                year = deal.close_date.year
                
                monthly_data[month_key]['count'] += 1
                monthly_data[month_key]['month_name'] = month_name
                monthly_data[month_key]['year'] = year
                
                # Add deal value
                try:
                    deal_value = float(deal.amount) if deal.amount else 0
                    monthly_data[month_key]['total_value'] += deal_value
                except (ValueError, TypeError):
                    pass  # Skip invalid amounts
                
                # Track stages
                stage = deal.stage or 'Unknown'
                monthly_data[month_key]['stages'][stage] += 1
        
        # Sort months chronologically and format for charts
        sorted_months = sorted(monthly_data.items(), key=lambda x: x[0])
        
        # Prepare chart data
        deals_by_month = []
        deals_by_stage_monthly = []
        total_value_by_month = []
        avg_deal_value_by_month = []
        
        # Get unique stages across all months
        all_stages = set()
        for _, data in sorted_months:
            all_stages.update(data['stages'].keys())
        all_stages = sorted(list(all_stages))
        
        for month_key, data in sorted_months:
            # Deals count by month
            deals_by_month.append({
                'month': data['month_name'],
                'count': data['count'],
                'month_key': month_key
            })
            
            # Total value by month  
            total_value_by_month.append({
                'month': data['month_name'],
                'value': round(data['total_value'], 2),
                'month_key': month_key
            })
            
            # Average deal value by month
            avg_value = round(data['total_value'] / data['count'], 2) if data['count'] > 0 else 0
            avg_deal_value_by_month.append({
                'month': data['month_name'],
                'avg_value': avg_value,
                'month_key': month_key
            })
            
            # Deals by stage for each month
            stage_data = {'month': data['month_name'], 'month_key': month_key}
            for stage in all_stages:
                stage_data[stage] = data['stages'].get(stage, 0)
            deals_by_stage_monthly.append(stage_data)
        
        return Response({
            'total_deals': total_deals,
            'deals_by_month': deals_by_month,
            'deals_by_stage_monthly': deals_by_stage_monthly,
            'total_value_by_month': total_value_by_month,
            'avg_deal_value_by_month': avg_deal_value_by_month,
            'available_stages': all_stages,
            'current_year': datetime.now().year,
            'months_count': len(sorted_months)
        })

    def destroy(self, request, *args, **kwargs):
        """
        Delete deal with additional validation
        """
        deal = self.get_object()

        # Check if deal is already closed
        if deal.stage in ['Closed', 'Closed Won', 'Closed Lost']:
            return Response({
                'error': 'Cannot delete a closed deal. Please archive it instead.'
            }, status=status.HTTP_400_BAD_REQUEST)

        return super().destroy(request, *args, **kwargs)
