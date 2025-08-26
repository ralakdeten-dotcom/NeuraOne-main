from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from datetime import datetime, date
from core.tenants.permissions import HasTenantPermission, IsTenantUser

from ..models import AccountTransaction
from ..serializers import (
    AccountTransactionSerializer,
    AccountTransactionCreateSerializer,
    AccountTransactionDetailSerializer,
    AccountTransactionPostSerializer,
    AccountTransactionReversalSerializer
)


class AccountTransactionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Account Transaction management.
    Provides CRUD operations and transaction-specific actions.
    """
    permission_classes = [IsAuthenticated, IsTenantUser, HasTenantPermission]
    queryset = AccountTransaction.objects.all()
    required_permissions = ['all', 'manage_accounting', 'view_accounting', 'manage_transactions']
    
    def get_required_permissions(self):
        """Define permissions based on action"""
        if self.action in ['list', 'retrieve']:
            # Read operations
            return ['all', 'manage_accounting', 'view_accounting', 'manage_transactions']
        elif self.action in ['create', 'update', 'partial_update', 'destroy']:
            # Write operations
            return ['all', 'manage_accounting', 'manage_transactions']
        elif self.action in ['post', 'post_transactions', 'void', 'create_reversal']:
            # Financial operations
            return ['all', 'manage_accounting', 'manage_transactions']
        return ['all', 'manage_accounting']
    
    def get_serializer_class(self):
        """Return appropriate serializer based on action"""
        if self.action == 'create':
            return AccountTransactionCreateSerializer
        elif self.action in ['retrieve', 'update', 'partial_update']:
            return AccountTransactionDetailSerializer
        elif self.action == 'post_transactions':
            return AccountTransactionPostSerializer
        elif self.action == 'create_reversal':
            return AccountTransactionReversalSerializer
        return AccountTransactionSerializer
    
    def get_queryset(self):
        """Filter queryset based on query parameters"""
        queryset = super().get_queryset()
        
        # Filter by account
        account_id = self.request.query_params.get('account_id')
        if account_id:
            queryset = queryset.filter(account_id=account_id)
        
        # Filter by transaction type
        transaction_type = self.request.query_params.get('transaction_type')
        if transaction_type:
            queryset = queryset.filter(transaction_type=transaction_type)
        
        # Filter by transaction status
        transaction_status = self.request.query_params.get('transaction_status')
        if transaction_status:
            queryset = queryset.filter(transaction_status=transaction_status)
        
        # Filter by date range
        date_start = self.request.query_params.get('date.start')
        date_end = self.request.query_params.get('date.end')
        date_before = self.request.query_params.get('date.before')
        date_after = self.request.query_params.get('date.after')
        
        if date_start:
            queryset = queryset.filter(transaction_date__gte=date_start)
        if date_end:
            queryset = queryset.filter(transaction_date__lte=date_end)
        if date_before:
            queryset = queryset.filter(transaction_date__lt=date_before)
        if date_after:
            queryset = queryset.filter(transaction_date__gt=date_after)
        
        # Filter by amount range
        amount_less_than = self.request.query_params.get('amount.less_than')
        amount_less_equals = self.request.query_params.get('amount.less_equals')
        amount_greater_than = self.request.query_params.get('amount.greater_than')
        amount_greater_equals = self.request.query_params.get('amount.greater_equals')
        
        if amount_less_than:
            queryset = queryset.filter(
                Q(debit_amount__lt=amount_less_than) | Q(credit_amount__lt=amount_less_than)
            )
        if amount_less_equals:
            queryset = queryset.filter(
                Q(debit_amount__lte=amount_less_equals) | Q(credit_amount__lte=amount_less_equals)
            )
        if amount_greater_than:
            queryset = queryset.filter(
                Q(debit_amount__gt=amount_greater_than) | Q(credit_amount__gt=amount_greater_than)
            )
        if amount_greater_equals:
            queryset = queryset.filter(
                Q(debit_amount__gte=amount_greater_equals) | Q(credit_amount__gte=amount_greater_equals)
            )
        
        # Filter by contact
        contact_id = self.request.query_params.get('contact_id')
        if contact_id:
            queryset = queryset.filter(contact_id=contact_id)
        
        # Transaction category filters for receivables/payables
        transaction_category = self.request.query_params.get('category')
        if transaction_category == 'receivable':
            queryset = queryset.filter(
                transaction_type__in=[
                    'invoice', 'customer_payment', 'credit_notes',
                    'creditnote_refund', 'sales_without_invoices'
                ]
            )
        elif transaction_category == 'payable':
            queryset = queryset.filter(
                transaction_type__in=[
                    'bills', 'vendor_payment', 'expense',
                    'card_payment', 'purchase_or_charges'
                ]
            )
        
        # Filter by reconcile status
        reconcile_status = self.request.query_params.get('reconcile_status')
        if reconcile_status:
            queryset = queryset.filter(reconcile_status=reconcile_status)
        
        # Search in description, reference number, entry number
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(description__icontains=search) |
                Q(reference_number__icontains=search) |
                Q(entry_number__icontains=search) |
                Q(payee__icontains=search)
            )
        
        # Sort
        sort_by = self.request.query_params.get('sort_by', '-transaction_date')
        if sort_by in ['transaction_date', '-transaction_date', 'amount', '-amount', 
                       'created_time', '-created_time']:
            if 'amount' in sort_by:
                # Sort by the actual amount (debit or credit)
                queryset = queryset.extra(
                    select={'amount': 'CASE WHEN debit_amount > 0 THEN debit_amount ELSE credit_amount END'}
                ).order_by(sort_by.replace('amount', 'amount'))
            else:
                queryset = queryset.order_by(sort_by)
        else:
            queryset = queryset.order_by('-transaction_date', '-created_time')
        
        return queryset
    
    def list(self, request, *args, **kwargs):
        """List transactions with filtering"""
        queryset = self.filter_queryset(self.get_queryset())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response({
            'code': 0,
            'message': 'success',
            'transactions': serializer.data
        })
    
    def create(self, request, *args, **kwargs):
        """Create a new transaction"""
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        
        # Return detailed view of created transaction
        detail_serializer = AccountTransactionDetailSerializer(serializer.instance)
        return Response({
            'code': 0,
            'message': 'The transaction has been created.',
            'transaction': detail_serializer.data
        }, status=status.HTTP_201_CREATED)
    
    def update(self, request, *args, **kwargs):
        """Update transaction (only if not posted)"""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Check if transaction can be updated
        if instance.transaction_status == 'posted':
            return Response({
                'code': 400,
                'message': 'Posted transactions cannot be modified. Create a reversal instead.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if instance.transaction_status in ['void', 'cancelled']:
            return Response({
                'code': 400,
                'message': f'{instance.transaction_status.title()} transactions cannot be modified.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        
        # Track who modified the transaction
        instance.modified_by = request.user
        self.perform_update(serializer)
        
        return Response({
            'code': 0,
            'message': 'The transaction has been updated.',
            'transaction': serializer.data
        })
    
    def destroy(self, request, *args, **kwargs):
        """Delete transaction (only if not posted)"""
        instance = self.get_object()
        
        # Check if transaction can be deleted
        if instance.transaction_status == 'posted':
            return Response({
                'code': 400,
                'message': 'Posted transactions cannot be deleted. Create a reversal instead.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        self.perform_destroy(instance)
        return Response({
            'code': 0,
            'message': 'The transaction has been deleted.'
        })
    
    @action(detail=False, methods=['post'])
    def post_transactions(self, request):
        """Post multiple transactions to the ledger"""
        serializer = AccountTransactionPostSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        transaction_ids = serializer.validated_data['transaction_ids']
        transactions = AccountTransaction.objects.filter(
            categorized_transaction_id__in=transaction_ids
        )
        
        posted_count = 0
        errors = []
        
        for transaction in transactions:
            try:
                transaction.post_transaction(user=request.user)
                posted_count += 1
            except Exception as e:
                errors.append({
                    'transaction_id': transaction.categorized_transaction_id,
                    'error': str(e)
                })
        
        if errors:
            return Response({
                'code': 207,  # Multi-status
                'message': f'Partially completed. {posted_count} transactions posted, {len(errors)} failed.',
                'posted_count': posted_count,
                'errors': errors
            }, status=status.HTTP_207_MULTI_STATUS)
        
        return Response({
            'code': 0,
            'message': f'{posted_count} transactions have been posted successfully.',
            'posted_count': posted_count
        })
    
    @action(detail=True, methods=['post'])
    def post(self, request, pk=None):
        """Post a single transaction to the ledger"""
        transaction = self.get_object()
        
        if transaction.transaction_status == 'posted':
            return Response({
                'code': 400,
                'message': 'Transaction is already posted.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if transaction.transaction_status in ['void', 'cancelled']:
            return Response({
                'code': 400,
                'message': f'{transaction.transaction_status.title()} transactions cannot be posted.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            transaction.post_transaction(user=request.user)
            detail_serializer = AccountTransactionDetailSerializer(transaction)
            return Response({
                'code': 0,
                'message': 'The transaction has been posted.',
                'transaction': detail_serializer.data
            })
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'Failed to post transaction: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def void(self, request, pk=None):
        """Void a transaction"""
        transaction = self.get_object()
        
        if transaction.transaction_status == 'void':
            return Response({
                'code': 400,
                'message': 'Transaction is already void.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if transaction.transaction_status == 'cancelled':
            return Response({
                'code': 400,
                'message': 'Cancelled transactions cannot be voided.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            transaction.void_transaction(user=request.user)
            detail_serializer = AccountTransactionDetailSerializer(transaction)
            return Response({
                'code': 0,
                'message': 'The transaction has been voided.',
                'transaction': detail_serializer.data
            })
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'Failed to void transaction: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @action(detail=True, methods=['post'])
    def create_reversal(self, request, pk=None):
        """Create a reversal transaction"""
        transaction = self.get_object()
        
        # Validate using serializer
        serializer = AccountTransactionReversalSerializer(
            data={'transaction_id': transaction.categorized_transaction_id, **request.data}
        )
        serializer.is_valid(raise_exception=True)
        
        # Create reversal
        reversal_date = serializer.validated_data.get('reversal_date', date.today())
        reversal_reason = serializer.validated_data.get('reversal_reason', '')
        
        try:
            reversal = transaction.create_reversal(user=request.user)
            
            # Update reversal with additional info
            if reversal_date != date.today():
                reversal.transaction_date = reversal_date
            if reversal_reason:
                reversal.description = f"{reversal_reason}. {reversal.description}"
            reversal.save()
            
            detail_serializer = AccountTransactionDetailSerializer(reversal)
            return Response({
                'code': 0,
                'message': 'Reversal transaction has been created.',
                'reversal_transaction': detail_serializer.data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'Failed to create reversal: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)