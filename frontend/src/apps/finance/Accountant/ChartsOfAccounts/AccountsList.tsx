import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Search, Star, ChevronUp, ArrowUpDown, Download, Upload, Settings, X, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { FindAccountants } from '../';
import { NewButton, MoreActionsButton, DataTable, createSortSubmenuItems, type TableColumn, type TableRow, type SortableColumn, type SortState } from '@/finance-inventory-shared';
import { NewAccountCreateBox } from './NewAccountCreateBox';
import { useChartOfAccounts, mapBackendToFrontendAccountType, useActivateAccount, useDeactivateAccount, useDeleteChartOfAccount } from '../api/chartOfAccounts';
import type { ChartOfAccountListItem } from '../api/chartOfAccounts';

export const AccountsList: React.FC = () => {
  const navigate = useNavigate();
  const [activeDropdown, setActiveDropdown] = useState(false);

  // Handle custom row click events from DataTable columns
  React.useEffect(() => {
    const handleRowClick = (event: any) => {
      const row = event.detail;
      if (row && row.id) {
        navigate(`/finance/accountant/chart-of-accounts/${row.id}`);
      }
    };

    window.addEventListener('rowClick', handleRowClick);
    return () => window.removeEventListener('rowClick', handleRowClick);
  }, [navigate]);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('AccountType.Active');
  const [activeView, setActiveView] = useState('Active Accounts');
  const [sortColumn, setSortColumn] = useState<string>('accountName');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [favoriteViews, setFavoriteViews] = useState<string[]>([]);
  const [showFavoritesSection, setShowFavoritesSection] = useState(true);
  const [showDefaultSection, setShowDefaultSection] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    accountId: number | null;
    accountName: string;
  }>({ isOpen: false, accountId: null, accountName: '' });
  const [editingAccount, setEditingAccount] = useState<{
    isOpen: boolean;
    accountId: number | null;
  }>({ isOpen: false, accountId: null });
  const [selectedAccountIds, setSelectedAccountIds] = useState<(string | number)[]>([]);

  // Fetch accounts data from API
  const {
    data: accountsResponse,
    isLoading,
    isError,
    error,
    refetch: refetchAccounts
  } = useChartOfAccounts(currentPage, 50, searchTerm, { filter_by: activeFilter });

  // Add debug logging for accounts response
  React.useEffect(() => {
    console.log('AccountsList - Accounts response updated:', accountsResponse);
  }, [accountsResponse]);

  // Mutation hooks for activate/deactivate/delete
  const activateAccountMutation = useActivateAccount();
  const deactivateAccountMutation = useDeactivateAccount();
  const deleteAccountMutation = useDeleteChartOfAccount();

  // Transform backend data to frontend format
  // Handle both paginated (results) and non-paginated (chartofaccounts) response formats
  const accountsData = accountsResponse?.results || accountsResponse?.chartofaccounts || [];
  
  // Client-side sorting function
  const sortData = (data: TableRow[], column: string, direction: 'asc' | 'desc'): TableRow[] => {
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
  
  const accounts: TableRow[] = useMemo(() => {
    const transformedAccounts = accountsData.map((account: ChartOfAccountListItem) => ({
      id: account.account_id,
      accountName: account.account_name,
      accountCode: account.account_code || '',
      type: mapBackendToFrontendAccountType(account.account_type),
      documents: account.has_attachment ? 'Yes' : '',
      parentAccountName: account.parent_account_name || '',
      includeInVatReturn: account.include_in_vat_return || false,
      is_active: account.is_active,
      is_system_account: account.is_system_account
    }));
    
    const sortedAccounts = sortData(transformedAccounts, sortColumn, sortDirection);
    return sortedAccounts;
  }, [accountsData, sortColumn, sortDirection]);

  // Table columns configuration
  const columns: TableColumn[] = [
    {
      key: 'accountName',
      label: 'Account Name',
      sortable: true,
      locked: true,
      render: (value: string, row: any) => (
        <span className="text-gray-900 dark:text-gray-100">
          {value}
        </span>
      )
    },
    {
      key: 'accountCode',
      label: 'Account Code',
      sortable: true,
      locked: true
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      locked: true
    },
    {
      key: 'documents',
      label: 'Documents',
      sortable: false
    },
    {
      key: 'parentAccountName',
      label: 'Parent Account Name',
      sortable: false
    },
    {
      key: 'includeInVatReturn',
      label: 'Include in VAT Return',
      sortable: false,
      render: (value: boolean) => (
        <span className="text-sm">{value ? 'true' : 'false'}</span>
      )
    }
  ];

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleRowSelect = (selectedIds: (string | number)[]) => {
    setSelectedAccountIds(selectedIds);
  };

  const handleRowAction = (row: TableRow, action: string) => {
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
            toast.success('The selected account has been marked as inactive.');
          },
          onError: (error) => {
            console.error('Failed to mark account as inactive:', error);
            toast.error('Failed to mark account as inactive. Please try again.');
          }
        });
        break;
      case 'mark_active':
        activateAccountMutation.mutate(Number(row.id), {
          onSuccess: () => {
            toast.success('The selected account has been marked as active.');
          },
          onError: (error) => {
            console.error('Failed to mark account as active:', error);
            toast.error('Failed to mark account as active. Please try again.');
          }
        });
        break;
      case 'delete':
        setDeleteConfirmation({
          isOpen: true,
          accountId: Number(row.id),
          accountName: row.accountName || 'this account'
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
          toast.success('The selected account has been deleted successfully.');
        },
        onError: (error) => {
          console.error('Failed to delete account:', error);
          setDeleteConfirmation({ isOpen: false, accountId: null, accountName: '' });
          toast.error('Failed to delete account. Please try again.');
        }
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, accountId: null, accountName: '' });
  };

  // Bulk operation functions
  const handleBulkActivate = async () => {
    if (selectedAccountIds.length === 0) return;
    
    try {
      // Execute all activate mutations in parallel
      await Promise.all(
        selectedAccountIds.map(id => 
          activateAccountMutation.mutateAsync(Number(id))
        )
      );
      setSelectedAccountIds([]);
      const accountText = selectedAccountIds.length === 1 ? 'account has' : 'accounts have';
      toast.success(`The selected ${accountText} been marked as active.`);
    } catch (error) {
      console.error('Failed to activate some accounts:', error);
      toast.error('Failed to activate some accounts. Please try again.');
    }
  };

  const handleBulkDeactivate = async () => {
    if (selectedAccountIds.length === 0) return;
    
    try {
      // Execute all deactivate mutations in parallel
      await Promise.all(
        selectedAccountIds.map(id => 
          deactivateAccountMutation.mutateAsync(Number(id))
        )
      );
      setSelectedAccountIds([]);
      const accountText = selectedAccountIds.length === 1 ? 'account has' : 'accounts have';
      toast.success(`The selected ${accountText} been marked as inactive.`);
    } catch (error) {
      console.error('Failed to deactivate some accounts:', error);
      toast.error('Failed to deactivate some accounts. Please try again.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAccountIds.length === 0) return;
    
    if (!window.confirm(`Are you sure you want to delete ${selectedAccountIds.length} selected accounts? This action cannot be undone.`)) {
      return;
    }

    try {
      // Execute all delete mutations in parallel
      await Promise.all(
        selectedAccountIds.map(id => 
          deleteAccountMutation.mutateAsync(Number(id))
        )
      );
      setSelectedAccountIds([]);
      const accountText = selectedAccountIds.length === 1 ? 'account has' : 'accounts have';
      toast.success(`The selected ${accountText} been deleted successfully.`);
    } catch (error) {
      console.error('Failed to delete some accounts:', error);
      toast.error('Failed to delete some accounts. Please try again.');
    }
  };

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

  const handleViewChange = (view: string, filter: string) => {
    setActiveView(view);
    setActiveFilter(filter);
    setActiveDropdown(false);
    setCurrentPage(1); // Reset to first page when view changes
  };

  const toggleFavorite = (viewLabel: string, event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    setFavoriteViews(prev => {
      if (prev.includes(viewLabel)) {
        return prev.filter(fav => fav !== viewLabel);
      } else {
        return [...prev, viewLabel];
      }
    });
  };

  // Categorize views - DEFAULT FILTERS always shows all 8 options, favorites are separate
  const favoriteOptions = viewOptions.filter(option => favoriteViews.includes(option.label));
  const defaultOptions = viewOptions; // Always show all 8 options in DEFAULT FILTERS

  // Define sortable columns
  const sortableColumns: SortableColumn[] = [
    { key: 'accountName', label: 'Account Name' },
    { key: 'accountCode', label: 'Account Code' },
    { key: 'type', label: 'Type' }
  ];

  // Current sort state
  const currentSort: SortState = {
    column: sortColumn,
    direction: sortDirection
  };

  return (
    <div className="flex-1 bg-white dark:bg-gray-900">
      {/* Header Section */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left side - Title with dropdown */}
            <div className="flex items-center gap-2 relative">
              <button
                onClick={() => setActiveDropdown(!activeDropdown)}
                className="flex items-center gap-2 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 px-3 py-1.5 rounded-md transition-colors"
              >
                <h1 className="text-xl font-semibold">
                  {activeView}
                </h1>
                <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
              </button>
              
              {/* Dropdown menu (positioned below the button) */}
              {activeDropdown && (
                <>
                  <div 
                    className="fixed inset-0 z-10" 
                    onClick={() => setActiveDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                    <div className="py-1">
                      {/* Favorites Section */}
                      {favoriteOptions.length > 0 && (
                        <>
                          <div className="flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700">
                            <button
                              onClick={() => setShowFavoritesSection(!showFavoritesSection)}
                              className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider hover:text-gray-800 dark:hover:text-gray-100"
                            >
                              {showFavoritesSection ? (
                                <ChevronDown className="w-3 h-3" />
                              ) : (
                                <ChevronUp className="w-3 h-3" />
                              )}
                              FAVOURITES
                            </button>
                            <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                              {favoriteOptions.length}
                            </div>
                          </div>
                          {showFavoritesSection && favoriteOptions.map((option) => (
                            <div key={`fav-${option.id}`} className="flex items-center">
                              <button 
                                onClick={() => handleViewChange(option.label, option.filter)}
                                className={`flex-1 text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                                  activeView === option.label 
                                    ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                                    : 'text-gray-700 dark:text-gray-300'
                                }`}
                              >
                                {option.label}
                              </button>
                              <button
                                onClick={(e) => toggleFavorite(option.label, e)}
                                className="px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              </button>
                            </div>
                          ))}
                        </>
                      )}

                      {/* Default Filters Section */}
                      <div className={`flex items-center justify-between px-4 py-2 bg-gray-100 dark:bg-gray-700 ${
                        favoriteOptions.length > 0 ? 'border-t border-gray-200 dark:border-gray-600' : ''
                      }`}>
                        <button
                          onClick={() => setShowDefaultSection(!showDefaultSection)}
                          className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider hover:text-gray-800 dark:hover:text-gray-100"
                        >
                          {showDefaultSection ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronUp className="w-3 h-3" />
                          )}
                          DEFAULT FILTERS
                        </button>
                        <div className="bg-blue-500 text-white text-xs rounded-full px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center">
                          8
                        </div>
                      </div>
                      {showDefaultSection && defaultOptions.map((option) => (
                        <div key={`def-${option.id}`} className="flex items-center">
                          <button 
                            onClick={() => handleViewChange(option.label, option.filter)}
                            className={`flex-1 text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                              activeView === option.label 
                                ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300' 
                                : 'text-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {option.label}
                          </button>
                          <button
                            onClick={(e) => toggleFavorite(option.label, e)}
                            className="px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                          >
                            <Star className={`w-4 h-4 ${
                              favoriteViews.includes(option.label)
                                ? 'text-yellow-500 fill-current'
                                : 'text-gray-400 hover:text-yellow-500'
                            }`} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* Find Accountants button */}
              <FindAccountants />

              {/* New button */}
              <NewButton 
                onClick={() => setShowCreateAccount(true)}
              />

              {/* More actions */}
              <MoreActionsButton 
                actions={[
                  { 
                    label: 'Sort by', 
                    onClick: () => {},
                    icon: <ArrowUpDown className="w-4 h-4" />,
                    submenu: createSortSubmenuItems(sortableColumns, currentSort, handleSort)
                  },
                  { 
                    label: 'Import Chart of Accounts', 
                    onClick: () => {},
                    icon: <Download className="w-4 h-4" />
                  },
                  { 
                    label: 'Export', 
                    onClick: () => {},
                    icon: <Upload className="w-4 h-4" />
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Operations Toolbar */}
      {selectedAccountIds.length > 0 && (
        <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="px-6 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={handleBulkActivate}
                  disabled={activateAccountMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {activateAccountMutation.isPending ? 'Processing...' : 'Mark as Active'}
                </button>
                <button
                  onClick={handleBulkDeactivate}
                  disabled={deactivateAccountMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deactivateAccountMutation.isPending ? 'Processing...' : 'Mark as Inactive'}
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={deleteAccountMutation.isPending}
                  className="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deleteAccountMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedAccountIds.length} Selected
                </span>
                <button
                  onClick={() => setSelectedAccountIds([])}
                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  title="Clear selection"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content area */}
      <div className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading accounts...</div>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500">
              Error loading accounts: {error instanceof Error ? error.message : 'Unknown error'}
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={accounts}
            onSort={handleSort}
            onRowSelect={handleRowSelect}
            onRowAction={handleRowAction}
            showCheckboxes={true}
            showActions={true}
            emptyMessage=""
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            selectedRowIds={selectedAccountIds}
            customCheckboxRender={(row) => row.is_system_account ? (
              <div className="flex items-center justify-center">
                <Lock className="w-4 h-4 text-gray-400" />
              </div>
            ) : null}
            customActionsRender={(row) => row.is_system_account ? null : undefined}
          />
        )}
      </div>

      {/* Create Account Modal */}
      <NewAccountCreateBox
        isOpen={showCreateAccount}
        onClose={() => setShowCreateAccount(false)}
        onSubmit={handleCreateAccount}
      />

      {/* Edit Account Modal */}
      <NewAccountCreateBox
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