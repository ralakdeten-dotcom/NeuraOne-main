from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q, Sum
from django.shortcuts import get_object_or_404
from datetime import datetime
from core.tenants.permissions import HasTenantPermission, IsTenantUser

from ..models import ChartOfAccount, AccountTransaction
from ..serializers import (
    ChartOfAccountListSerializer,
    ChartOfAccountDetailSerializer,
    ChartOfAccountCreateSerializer,
    ChartOfAccountUpdateSerializer,
    AccountTreeSerializer,
    AccountTransactionSerializer
)


class ChartOfAccountViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Chart of Accounts management.
    Provides CRUD operations and custom actions for account management.
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    queryset = ChartOfAccount.objects.all()
    required_permissions = ['all', 'manage_accounting', 'view_accounting']
    
    def get_required_permissions(self):
        """Define permissions based on action"""
        if self.action in ['list', 'retrieve', 'tree', 'summary']:
            # Read operations
            return ['all', 'manage_accounting', 'view_accounting']
        elif self.action in ['create', 'update', 'partial_update', 'destroy', 
                           'activate', 'deactivate']:
            # Write operations
            return ['all', 'manage_accounting']
        elif self.action == 'transactions':
            # View transactions
            return ['all', 'manage_accounting', 'view_accounting', 'manage_transactions']
        return ['all', 'manage_accounting']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'list':
            return ChartOfAccountListSerializer
        elif self.action == 'create':
            return ChartOfAccountCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return ChartOfAccountUpdateSerializer
        elif self.action == 'tree':
            return AccountTreeSerializer
        return ChartOfAccountDetailSerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by account type category
        filter_by = self.request.query_params.get('filter_by')
        if filter_by:
            if filter_by == 'AccountType.All':
                pass  # No additional filtering
            elif filter_by == 'AccountType.Active':
                queryset = queryset.filter(is_active=True)
            elif filter_by == 'AccountType.Inactive':
                queryset = queryset.filter(is_active=False)
            elif filter_by == 'AccountType.Asset':
                asset_types = ['cash', 'bank', 'accounts_receivable', 'other_current_asset',
                             'fixed_asset', 'other_asset', 'intangible_asset', 'right_to_use_asset',
                             'financial_asset', 'contingent_asset', 'contract_asset']
                queryset = queryset.filter(account_type__in=asset_types)
            elif filter_by == 'AccountType.Liability':
                liability_types = ['accounts_payable', 'credit_card', 'other_current_liability',
                                 'long_term_liability', 'other_liability', 'contract_liability',
                                 'refund_liability', 'loans_and_borrowing', 'lease_liability',
                                 'employee_benefit_liability', 'contingent_liability', 'financial_liability']
                queryset = queryset.filter(account_type__in=liability_types)
            elif filter_by == 'AccountType.Equity':
                queryset = queryset.filter(account_type='equity')
            elif filter_by == 'AccountType.Income':
                income_types = ['income', 'other_income', 'finance_income', 'other_comprehensive_income']
                queryset = queryset.filter(account_type__in=income_types)
            elif filter_by == 'AccountType.Expense':
                expense_types = ['expense', 'cost_of_goods_sold', 'other_expense', 'manufacturing_expense',
                               'impairment_expense', 'depreciation_expense', 'employee_benefit_expense',
                               'lease_expense', 'finance_expense', 'tax_expense']
                queryset = queryset.filter(account_type__in=expense_types)
        
        # Filter by last modified time
        last_modified_time = self.request.query_params.get('last_modified_time')
        if last_modified_time:
            try:
                modified_date = datetime.fromisoformat(last_modified_time.replace('Z', '+00:00'))
                queryset = queryset.filter(last_modified_time__gte=modified_date)
            except (ValueError, AttributeError):
                pass
        
        # Filter by specific account type
        account_type = self.request.query_params.get('account_type')
        if account_type:
            queryset = queryset.filter(account_type=account_type)
        
        # Filter by is_active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            if is_active.lower() == 'true':
                queryset = queryset.filter(is_active=True)
            elif is_active.lower() == 'false':
                queryset = queryset.filter(is_active=False)
        
        # Search by account name or code
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(account_name__icontains=search) |
                Q(account_code__icontains=search)
            )
        
        # Filter by parent account
        parent_account = self.request.query_params.get('parent_account')
        if parent_account:
            if parent_account == 'null':
                queryset = queryset.filter(parent_account__isnull=True)
            else:
                queryset = queryset.filter(parent_account_id=parent_account)
        
        # Sort column
        sort_column = self.request.query_params.get('sort_column')
        if sort_column == 'account_name':
            queryset = queryset.order_by('account_name')
        elif sort_column == 'account_type':
            queryset = queryset.order_by('account_type', 'account_name')
        else:
            queryset = queryset.order_by('account_code', 'account_name')
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """List accounts with optional balance information"""
        queryset = self.filter_queryset(self.get_queryset())
        
        # Check if balance should be included
        show_balance = request.query_params.get('showbalance', '').lower() == 'true'
        
        # Pass show_balance in context to serializer
        serializer_context = self.get_serializer_context()
        serializer_context['show_balance'] = show_balance
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True, context=serializer_context)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True, context=serializer_context)
        return Response({
            'code': 0,
            'message': 'success',
            'chartofaccounts': serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        """Create a new account"""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return detailed view of created account
        detail_serializer = ChartOfAccountDetailSerializer(serializer.instance)
        return Response({
            'code': 0,
            'message': 'The account has been created.',
            'chart_of_account': detail_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def retrieve(self, request, *args, **kwargs):
        """Get account details with balance calculation"""
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        
        return Response({
            'code': 0,
            'message': 'success',
            **serializer.data
        })
    
    def update(self, request, *args, **kwargs):
        """Update account information"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Return detailed view of updated account
        detail_serializer = ChartOfAccountDetailSerializer(serializer.instance)
        return Response({
            'code': 0,
            'message': 'The details of the account have been updated.',
            'chart_of_account': detail_serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete account if it has no transactions"""
        instance = self.get_object()
        
        # Check if account can be deleted
        if instance.is_system_account:
            return Response({
                'code': 400,
                'message': 'System accounts cannot be deleted.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if instance.has_transaction:
            return Response({
                'code': 400,
                'message': 'Accounts with transactions cannot be deleted.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if instance.is_child_present:
            return Response({
                'code': 400,
                'message': 'Cannot delete an account that has child accounts.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_destroy(instance)
        return Response({
            'code': 0,
            'message': 'The account has been deleted.'
        })
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate an account"""
        account = self.get_object()
        
        if account.is_active:
            return Response({
                'code': 400,
                'message': 'Account is already active.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        account.is_active = True
        account.save(update_fields=['is_active', 'last_modified_time'])
        
        return Response({
            'code': 0,
            'message': 'The account has been marked as active.'
        })
    
    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate an account"""
        account = self.get_object()
        
        if not account.is_active:
            return Response({
                'code': 400,
                'message': 'Account is already inactive.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if account can be deactivated
        if account.has_transaction:
            return Response({
                'code': 400,
                'message': 'Cannot deactivate an account with transactions.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        account.is_active = False
        account.save(update_fields=['is_active', 'last_modified_time'])
        
        return Response({
            'code': 0,
            'message': 'The account has been marked as inactive.'
        })
    
    @action(detail=True, methods=['get'])
    def transactions(self, request, pk=None):
        """List all transactions for an account"""
        account = self.get_object()
        
        transactions = account.transactions.all()
        
        # Apply filters
        date_start = request.query_params.get('date.start')
        date_end = request.query_params.get('date.end')
        if date_start:
            transactions = transactions.filter(transaction_date__gte=date_start)
        if date_end:
            transactions = transactions.filter(transaction_date__lte=date_end)
        
        transaction_type = request.query_params.get('transaction_type')
        if transaction_type:
            transactions = transactions.filter(transaction_type=transaction_type)
        
        # Amount filters
        amount_less_than = request.query_params.get('amount.less_than')
        if amount_less_than:
            transactions = transactions.filter(
                Q(debit_amount__lt=amount_less_than) | Q(credit_amount__lt=amount_less_than)
            )
        
        amount_greater_than = request.query_params.get('amount.greater_than')
        if amount_greater_than:
            transactions = transactions.filter(
                Q(debit_amount__gt=amount_greater_than) | Q(credit_amount__gt=amount_greater_than)
            )
        
        # Sort by transaction date desc by default
        transactions = transactions.order_by('-transaction_date', '-created_time')
        
        # Paginate results
        page = self.paginate_queryset(transactions)
        if page is not None:
            serializer = AccountTransactionSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = AccountTransactionSerializer(transactions, many=True)
        return Response({
            'code': 0,
            'message': 'success',
            'transactions': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def tree(self, request):
        """Return hierarchical tree structure of accounts"""
        # Get root accounts (no parent)
        root_accounts = ChartOfAccount.objects.filter(
            parent_account__isnull=True,
            is_active=True
        ).order_by('account_code', 'account_name')
        
        serializer = AccountTreeSerializer(root_accounts, many=True)
        
        return Response({
            'code': 0,
            'message': 'success',
            'account_tree': serializer.data
        })
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get summary of accounts by type"""
        summary = {
            'total_accounts': ChartOfAccount.objects.count(),
            'active_accounts': ChartOfAccount.objects.filter(is_active=True).count(),
            'accounts_by_type': {},
            'total_assets': 0,
            'total_liabilities': 0,
            'total_equity': 0,
            'total_income': 0,
            'total_expenses': 0
        }
        
        # Count accounts by type
        asset_types = ['cash', 'bank', 'accounts_receivable', 'other_current_asset',
                      'fixed_asset', 'other_asset', 'intangible_asset', 'right_to_use_asset',
                      'financial_asset', 'contingent_asset', 'contract_asset']
        
        liability_types = ['accounts_payable', 'credit_card', 'other_current_liability',
                          'long_term_liability', 'other_liability', 'contract_liability',
                          'refund_liability', 'loans_and_borrowing', 'lease_liability',
                          'employee_benefit_liability', 'contingent_liability', 'financial_liability']
        
        income_types = ['income', 'other_income', 'finance_income', 'other_comprehensive_income']
        
        expense_types = ['expense', 'cost_of_goods_sold', 'other_expense', 'manufacturing_expense',
                        'impairment_expense', 'depreciation_expense', 'employee_benefit_expense',
                        'lease_expense', 'finance_expense', 'tax_expense']
        
        # Calculate totals
        summary['accounts_by_type']['assets'] = ChartOfAccount.objects.filter(
            account_type__in=asset_types
        ).count()
        
        summary['accounts_by_type']['liabilities'] = ChartOfAccount.objects.filter(
            account_type__in=liability_types
        ).count()
        
        summary['accounts_by_type']['equity'] = ChartOfAccount.objects.filter(
            account_type='equity'
        ).count()
        
        summary['accounts_by_type']['income'] = ChartOfAccount.objects.filter(
            account_type__in=income_types
        ).count()
        
        summary['accounts_by_type']['expenses'] = ChartOfAccount.objects.filter(
            account_type__in=expense_types
        ).count()
        
        # Calculate balance totals
        assets = ChartOfAccount.objects.filter(
            account_type__in=asset_types, is_active=True
        ).aggregate(total=Sum('current_balance'))
        summary['total_assets'] = float(assets['total'] or 0)
        
        liabilities = ChartOfAccount.objects.filter(
            account_type__in=liability_types, is_active=True
        ).aggregate(total=Sum('current_balance'))
        summary['total_liabilities'] = float(liabilities['total'] or 0)
        
        equity = ChartOfAccount.objects.filter(
            account_type='equity', is_active=True
        ).aggregate(total=Sum('current_balance'))
        summary['total_equity'] = float(equity['total'] or 0)
        
        income = ChartOfAccount.objects.filter(
            account_type__in=income_types, is_active=True
        ).aggregate(total=Sum('current_balance'))
        summary['total_income'] = float(income['total'] or 0)
        
        expenses = ChartOfAccount.objects.filter(
            account_type__in=expense_types, is_active=True
        ).aggregate(total=Sum('current_balance'))
        summary['total_expenses'] = float(expenses['total'] or 0)
        
        return Response({
            'code': 0,
            'message': 'success',
            'summary': summary
        })