import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Edit, Upload, Settings, ChevronDown, ArrowUpDown, Download, ArrowUp, ArrowDown, X } from 'lucide-react';
import { useChartOfAccount, useChartOfAccounts, mapBackendToFrontendAccountType, useActivateAccount, useDeactivateAccount, useDeleteChartOfAccount } from '../../api/chartOfAccounts';
import { useAccountTransactions } from '../../api/transactions';
import { useCurrencyByCode, useBaseCurrency } from '../../api/currencies';
import { MiniDataTable, type MiniTableColumn, type MiniTableRow } from '@/finance-inventory-shared';
import { AccountCreate } from './AccountCreate';
import { useQueryClient } from '@tanstack/react-query';

export const AccountDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const accountId = id ? parseInt(id, 10) : 0;

  // State management for the accounts list sidebar
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('AccountType.Active');
  const [activeView, setActiveView] = useState('Active Accounts');
  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    accountId: number | null;
    accountName: string;
  }>({ isOpen: false, accountId: null, accountName: '' });
  const [editingAccount, setEditingAccount] = useState<{
    isOpen: boolean;
    accountId: number | null;
  }>({ isOpen: false, accountId: null });
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Fetch account details
  const {
    data: account,
    isLoading,
    isError,
    error,
    refetch: refetchAccount
  } = useChartOfAccount(accountId);

  // Fetch accounts list for sidebar
  const {
    data: accountsResponse,
    isLoading: isAccountsLoading
  } = useChartOfAccounts(currentPage, 50, searchTerm, { filter_by: activeFilter });

  // Mutation hooks for activate/deactivate/delete
  const activateAccountMutation = useActivateAccount();
  const deactivateAccountMutation = useDeactivateAccount();
  const deleteAccountMutation = useDeleteChartOfAccount();

  // Fetch real transactions from API
  const {
    data: transactionsResponse,
    isLoading: isTransactionsLoading,
    error: transactionsError
  } = useAccountTransactions(accountId);

  // Fetch base currency
  const { data: baseCurrency } = useBaseCurrency();
  
  // Fetch currency information
  const { data: currency } = useCurrencyByCode(account?.currency_code || baseCurrency?.currency_code || 'GBP');

  // Transform transactions data for display
  const transactions: MiniTableRow[] = React.useMemo(() => {
    if (!transactionsResponse?.results) return [];
    
    return transactionsResponse.results.map(txn => ({
      id: txn.categorized_transaction_id,
      date: new Date(txn.transaction_date).toLocaleDateString(),
      transaction_id: txn.transaction_id,
      type: txn.transaction_type_display,
      description: txn.description,
      reference: txn.reference_number,
      debit: parseFloat(txn.debit_amount) > 0 ? `$${parseFloat(txn.debit_amount).toLocaleString()}` : '-',
      credit: parseFloat(txn.credit_amount) > 0 ? `$${parseFloat(txn.credit_amount).toLocaleString()}` : '-',
      balance: `$${parseFloat(txn.amount).toLocaleString()}`,
      status: txn.transaction_status_display
    }));
  }, [transactionsResponse]);

  const handleBackClick = () => {
    navigate('/finance/accountant/chart-of-accounts');
  };

  const handleEditClick = () => {
    // Handle edit functionality
    console.log('Edit account:', accountId);
  };

  // Client-side sorting function
  const sortData = (data: MiniTableRow[], column: string, direction: 'asc' | 'desc'): MiniTableRow[] => {
    return [...data].sort((a, b) => {
      let aValue = a[column];
      let bValue = b[column];
      
      // Handle different data types
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      // Handle boolean values
      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        aValue = aValue ? 1 : 0;
        bValue = bValue ? 1 : 0;
      }
      
      if (aValue < bValue) {
        return direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Process accounts data for MiniDataTable
  const accountsData = accountsResponse?.results || accountsResponse?.chartofaccounts || [];
  const transformedAccounts = accountsData.map((acc: any) => ({
    id: acc.account_id,
    name: acc.account_name,
    account_code: acc.account_code,
    type: mapBackendToFrontendAccountType(acc.account_type),
    is_active: acc.is_active
  }));
  
  const accounts: MiniTableRow[] = sortData(transformedAccounts, sortColumn, sortDirection);

  const accountColumns: MiniTableColumn[] = [
    {
      key: 'name',
      label: 'Account Name',
      sortable: true,
      render: (value: string, row: MiniTableRow) => (
        <div className="flex flex-col">
          <div className={`font-semibold text-sm leading-tight ${row.is_active === false ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
            {value} {row.account_code && `(${row.account_code})`}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {row.type}
            </span>
            {row.is_active === false && (
              <span className="px-1.5 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                INACTIVE
              </span>
            )}
          </div>
        </div>
      )
    }
  ];

  // View options for the dropdown
  const viewOptions = [
    { id: 'all', label: 'All Accounts', filter: 'AccountType.All' },
    { id: 'active', label: 'Active Accounts', filter: 'AccountType.Active' },
    { id: 'inactive', label: 'Inactive Accounts', filter: 'AccountType.Inactive' },
    { id: 'asset', label: 'Asset Accounts', filter: 'AccountType.Asset' },
    { id: 'liability', label: 'Liability Accounts', filter: 'AccountType.Liability' },
    { id: 'equity', label: 'Equity Accounts', filter: 'AccountType.Equity' },
    { id: 'income', label: 'Income Accounts', filter: 'AccountType.Income' },
    { id: 'expense', label: 'Expense Accounts', filter: 'AccountType.Expense' }
  ];

  // Handler functions
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleViewChange = (view: string, filter: string) => {
    setActiveView(view);
    setActiveFilter(filter);
    setCurrentPage(1);
  };

  const handleRowAction = (row: MiniTableRow, action: string) => {
    switch (action) {
      case 'edit':
        setEditingAccount({
          isOpen: true,
          accountId: Number(row.id)
        });
        break;
      case 'mark_inactive':
        deactivateAccountMutation.mutate(Number(row.id), {
          onSuccess: () => {
            // Explicitly refetch account data and invalidate queries
            refetchAccount();
            queryClient.invalidateQueries({ queryKey: ['chartOfAccount', accountId] });
            queryClient.invalidateQueries({ queryKey: ['chartOfAccounts'] });
          },
          onError: (error) => {
            console.error('Failed to mark account as inactive:', error);
          }
        });
        break;
      case 'mark_active':
        activateAccountMutation.mutate(Number(row.id), {
          onSuccess: () => {
            // Explicitly refetch account data and invalidate queries
            refetchAccount();
            queryClient.invalidateQueries({ queryKey: ['chartOfAccount', accountId] });
            queryClient.invalidateQueries({ queryKey: ['chartOfAccounts'] });
          },
          onError: (error) => {
            console.error('Failed to mark account as active:', error);
          }
        });
        break;
      case 'delete':
        setDeleteConfirmation({
          isOpen: true,
          accountId: Number(row.id),
          accountName: row.name || 'this account'
        });
        break;
    }
  };

  const handleCreateAccount = (accountData: any) => {
    // The CreateAccount component now handles API integration directly
  };

  const handleEditAccount = (accountData: any) => {
    // The EditAccount component now handles API integration directly
  };

  const handleEditAccountClose = () => {
    setEditingAccount({ isOpen: false, accountId: null });
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.accountId) {
      deleteAccountMutation.mutate(deleteConfirmation.accountId, {
        onSuccess: () => {
          setDeleteConfirmation({ isOpen: false, accountId: null, accountName: '' });
          navigate('/finance/accountant/chart-of-accounts');
        },
        onError: (error) => {
          console.error('Failed to delete account:', error);
          setDeleteConfirmation({ isOpen: false, accountId: null, accountName: '' });
        }
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, accountId: null, accountName: '' });
  };

  // More actions for the accounts list
  const moreActions = [
    { 
      label: 'Sort by', 
      onClick: () => {},
      icon: <ArrowUpDown className="w-4 h-4" />,
      submenu: [
        {
          label: 'Account Name',
          onClick: () => handleSort('name', sortColumn === 'name' && sortDirection === 'asc' ? 'desc' : 'asc'),
          icon: sortColumn === 'name' 
            ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)
            : <ArrowUp className="w-4 h-4" />
        },
        {
          label: 'Type',
          onClick: () => handleSort('type', sortColumn === 'type' && sortDirection === 'asc' ? 'desc' : 'asc'),
          icon: sortColumn === 'type' 
            ? (sortDirection === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />)
            : <ArrowUp className="w-4 h-4" />
        }
      ]
    },
    { 
      label: 'Export', 
      onClick: () => {},
      icon: <Download className="w-4 h-4" />
    }
  ];

  const transactionColumns: MiniTableColumn[] = [
    {
      key: 'date',
      label: 'Date',
      width: '100px'
    },
    {
      key: 'description',
      label: 'Description',
      render: (value: string, row: MiniTableRow) => (
        <div className="flex flex-col">
          <span className="font-medium text-sm">{value}</span>
          <span className="text-xs text-gray-500">
            {row.type} • {row.reference || 'No reference'}
          </span>
        </div>
      )
    },
    {
      key: 'debit',
      label: 'Debit',
      width: '120px',
      render: (value: string) => (
        <span className={`font-medium ${value !== '-' ? 'text-green-600' : 'text-gray-400'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'credit',
      label: 'Credit',
      width: '120px',
      render: (value: string) => (
        <span className={`font-medium ${value !== '-' ? 'text-red-600' : 'text-gray-400'}`}>
          {value}
        </span>
      )
    },
    {
      key: 'status',
      label: 'Status',
      width: '100px',
      render: (value: string) => (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
          {value}
        </span>
      )
    }
  ];

  console.log('MiniDataTable rendering with:', { transactions, transactionColumns, accounts });

  if (isLoading) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading account details...</div>
        </div>
      </div>
    );
  }

  if (isError || !account) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-900">
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">
            Error loading account: {error instanceof Error ? error.message : 'Account not found'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full bg-white dark:bg-gray-900">
      {/* Left Sidebar - Accounts List */}
      <div className="w-80 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 h-screen max-h-screen flex flex-col overflow-hidden">
        <MiniDataTable
          columns={accountColumns}
          data={accounts}
          onRowClick={(row) => {
            navigate(`/finance/accountant/chart-of-accounts/${row.id}`);
          }}
          onRowAction={handleRowAction}
          emptyMessage="No accounts available"
          title={activeView}
          showHeader={true}
          showActions={true}
          showNewButton={true}
          onNewClick={() => setShowCreateAccount(true)}
          moreActions={moreActions}
          viewOptions={viewOptions}
          onViewChange={handleViewChange}
          activeView={activeView}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          selectedRowId={accountId}
          className="flex-1 min-h-0"
        />
      </div>

      {/* Right Content - Account Details */}
      <div className="flex-1 flex flex-col">
        {/* Header Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-6 py-2">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {mapBackendToFrontendAccountType(account.account_type)}
                  </span>
                  {account.is_active === false && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-gray-200 text-gray-600 rounded">
                      INACTIVE
                    </span>
                  )}
                </div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  {account.account_name} {account.account_code && `(${account.account_code})`}
                </h1>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Upload className="w-4 h-4" />
                  <span>1 File</span>
                </div>
                <button 
                  onClick={() => navigate('/finance/accountant/chart-of-accounts')}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Close details"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Palette */}
        <div className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-6 py-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setEditingAccount({
                  isOpen: true,
                  accountId: account.account_id
                })}
                disabled={account.is_system_account}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  account.is_system_account
                    ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
                title={account.is_system_account ? 'System accounts cannot be edited' : 'Edit account'}
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              
              <div className="relative">
                <button
                  onClick={() => setShowActionsMenu(!showActionsMenu)}
                  className="flex items-center justify-center w-8 h-8 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                >
                  <Settings className="w-4 h-4" />
                </button>
                
                {showActionsMenu && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setShowActionsMenu(false)}
                    />
                    <div className="absolute top-full right-0 mt-1 w-44 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                      <div className="py-1">
                        {account.is_active !== false ? (
                          <button
                            onClick={() => {
                              deactivateAccountMutation.mutate(accountId, {
                                onSuccess: () => {
                                  // Explicitly refetch account data and invalidate queries
                                  refetchAccount();
                                  queryClient.invalidateQueries({ queryKey: ['chartOfAccount', accountId] });
                                  queryClient.invalidateQueries({ queryKey: ['chartOfAccounts'] });
                                },
                                onError: (error) => {
                                  console.error('Failed to mark account as inactive:', error);
                                }
                              });
                              setShowActionsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Mark as Inactive
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              activateAccountMutation.mutate(accountId, {
                                onSuccess: () => {
                                  // Explicitly refetch account data and invalidate queries
                                  refetchAccount();
                                  queryClient.invalidateQueries({ queryKey: ['chartOfAccount', accountId] });
                                  queryClient.invalidateQueries({ queryKey: ['chartOfAccounts'] });
                                },
                                onError: (error) => {
                                  console.error('Failed to mark account as active:', error);
                                }
                              });
                              setShowActionsMenu(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            Mark as Active
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            if (!account.is_system_account) {
                              setDeleteConfirmation({
                                isOpen: true,
                                accountId: accountId,
                                accountName: account.account_name
                              });
                              setShowActionsMenu(false);
                            }
                          }}
                          disabled={account.is_system_account}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            account.is_system_account
                              ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
                              : 'text-red-600 dark:text-red-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                          title={account.is_system_account ? 'System accounts cannot be deleted' : 'Delete account'}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Account Details Section */}
        <div className="flex-1 bg-white dark:bg-gray-900">
          <div className="bg-blue-50 dark:bg-blue-950/30 px-6 py-6 relative">
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
              CLOSING BALANCE
            </h3>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              {currency?.currency_symbol || account.currency_code || '$'}{parseFloat(account.closing_balance || '0').toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} 
              <span className="text-sm font-normal text-gray-500 ml-2">
                {(() => {
                  const balance = parseFloat(account.closing_balance || '0');
                  const isAssetOrExpense = ['Asset', 'Expense'].includes(account.account_category || '');
                  if (balance === 0) return '';
                  if (isAssetOrExpense) {
                    return balance > 0 ? '(Dr)' : '(Cr)';
                  } else {
                    return balance > 0 ? '(Cr)' : '(Dr)';
                  }
                })()}
              </span>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">Description:</span> {account.description || '--'}
            </div>
          </div>
          
          {/* Broken separator line attached to bottom of blue section */}
          <div className="w-full border-t-2 border-dashed border-blue-600 dark:border-blue-400"></div>

          {/* Transactions Section */}
          <div className="px-6 pt-6">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                Transactions {transactionsResponse?.count ? `(${transactionsResponse.count})` : ''}
              </h3>
            </div>
            
            {isTransactionsLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-gray-500 dark:text-gray-400">Loading transactions...</div>
              </div>
            ) : transactionsError ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-red-500">Error loading transactions</div>
              </div>
            ) : transactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                <div className="w-16 h-16 mb-4 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-center">
                  There are no transactions available
                </p>
              </div>
            ) : (
              <MiniDataTable
                columns={transactionColumns}
                data={transactions}
                onRowClick={(row) => {
                  console.log('Transaction clicked:', row);
                }}
                showHeader={false}
                showActions={false}
                showNewButton={false}
                emptyMessage="There are no transactions available"
              />
            )}
          </div>
        </div>
      </div>

      {/* Create Account Modal */}
      <AccountCreate
        isOpen={showCreateAccount}
        onClose={() => setShowCreateAccount(false)}
        onSubmit={handleCreateAccount}
      />

      {/* Edit Account Modal */}
      <AccountCreate
        isOpen={editingAccount.isOpen}
        onClose={handleEditAccountClose}
        mode="edit"
        accountId={editingAccount.accountId}
        onSubmit={handleEditAccount}
      />

      {/* Delete Confirmation Dialog */}
      {deleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex justify-center pt-12 pb-4 px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleDeleteCancel}></div>
            
            <div className="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full relative">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833-.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-gray-100">
                      Are you sure about deleting this account?
                    </h3>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-500 text-base font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteConfirm}
                  disabled={deleteAccountMutation.isPending}
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'OK'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                  onClick={handleDeleteCancel}
                  disabled={deleteAccountMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AccountDetails;