import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Star, ArrowUpDown, Download, Upload } from 'lucide-react';
import { NewButton, MoreActionsButton, DataTable, BulkSelectionHeader, createSortSubmenuItems, type TableColumn, type TableRow, type SortableColumn, type SortState } from '@/finance-inventory-shared';
import { usePermissions } from '@/core/auth/usePermissions';
import { useEstimates, type EstimateListItem } from '../../Old Sales App/estimates/api';
import { NewQuotePage } from './NewQuotePage';
import toast from 'react-hot-toast';

// Sort quotes helper function
const sortQuotesByColumn = (quotes: EstimateListItem[], sortColumn: string, sortDirection: 'asc' | 'desc') => {
  if (!sortColumn) return quotes;
  
  const sorted = [...quotes].sort((a, b) => {
    let aValue: any = a[sortColumn as keyof EstimateListItem];
    let bValue: any = b[sortColumn as keyof EstimateListItem];
    
    // Handle null/undefined values
    if (aValue === null || aValue === undefined) {
      aValue = sortColumn === 'total_amount' || sortColumn === 'subtotal' ? 0 : '';
    }
    if (bValue === null || bValue === undefined) {
      bValue = sortColumn === 'total_amount' || sortColumn === 'subtotal' ? 0 : '';
    }
    
    // For numeric fields, ensure we're comparing numbers
    if (sortColumn === 'total_amount' || sortColumn === 'subtotal') {
      aValue = Number(aValue) || 0;
      bValue = Number(bValue) || 0;
    } else if (sortColumn === 'estimate_date' || sortColumn === 'valid_until' || sortColumn === 'created_at') {
      // For date fields, convert to Date objects
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      // For string fields, convert to lowercase
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1;
    }
    return 0;
  });
  
  return sorted;
};

export const QuotesList: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(20);
  const [activeDropdown, setActiveDropdown] = useState(false);
  const [activeFilter, setActiveFilter] = useState('QuoteType.All');
  const [activeView, setActiveView] = useState('All Quotes');
  const [favoriteViews, setFavoriteViews] = useState<string[]>([]);
  const [showFavoritesSection, setShowFavoritesSection] = useState(true);
  const [showDefaultSection, setShowDefaultSection] = useState(true);
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [selectedQuoteIds, setSelectedQuoteIds] = useState<(string | number)[]>([]);
  const [showNewQuoteModal, setShowNewQuoteModal] = useState(false);

  // Define sortable columns
  const sortableColumns: SortableColumn[] = [
    { key: 'estimate_date', label: 'Date' },
    { key: 'estimate_number', label: 'Quote Number' },
    { key: 'po_number', label: 'Reference Number' },
    { key: 'account_name', label: 'Customer Name' },
    { key: 'status', label: 'Status' },
    { key: 'total_amount', label: 'Amount' }
  ];

  // Current sort state
  const currentSort: SortState = {
    column: sortColumn,
    direction: sortDirection
  };
  
  // Hooks
  const navigate = useNavigate();
  const permissions = usePermissions();
  const { data: estimatesData, isLoading, error, refetch } = useEstimates(currentPage, pageSize);

  // Handle custom row click events from DataTable columns
  React.useEffect(() => {
    const handleRowClick = (event: any) => {
      const row = event.detail;
      console.log('Row click event received:', row);
      if (row && row.id) {
        // Navigate to quote details page
        console.log('Navigating to quote:', row.id, 'Type:', typeof row.id);
        navigate(`/finance/estimates/${row.id}`);
      }
    };

    window.addEventListener('rowClick', handleRowClick);
    return () => window.removeEventListener('rowClick', handleRowClick);
  }, [navigate]);
  
  // Data processing
  const quotes = estimatesData?.results || [];
  
  // Sort quotes based on current sort settings
  const sortedQuotes = useMemo(() => {
    return sortQuotesByColumn(quotes, sortColumn, sortDirection);
  }, [quotes, sortColumn, sortDirection]);
  
  // View options for the dropdown
  const viewOptions = [
    { id: 'all', label: 'All Quotes', filter: 'QuoteType.All' },
    { id: 'draft', label: 'Draft Quotes', filter: 'QuoteType.Draft' },
    { id: 'sent', label: 'Sent Quotes', filter: 'QuoteType.Sent' },
    { id: 'accepted', label: 'Accepted Quotes', filter: 'QuoteType.Accepted' },
    { id: 'rejected', label: 'Rejected Quotes', filter: 'QuoteType.Rejected' },
    { id: 'expired', label: 'Expired Quotes', filter: 'QuoteType.Expired' }
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

  // Categorize views - DEFAULT FILTERS always shows all options, favorites are separate
  const favoriteOptions = viewOptions.filter(option => favoriteViews.includes(option.label));
  const defaultOptions = viewOptions; // Always show all options in DEFAULT FILTERS

  // Transform to TableRow format (Quotes style)
  const transformedQuotes: TableRow[] = sortedQuotes.map(quote => {
    console.log('Transforming quote:', quote.estimate_id, typeof quote.estimate_id);
    return {
      id: quote.estimate_id,
      estimate_date: quote.estimate_date,
      estimate_number: quote.estimate_number,
      po_number: quote.po_number || '',
      account_name: quote.account_name,
      status: quote.status,
      status_display: quote.status_display,
      total_amount: quote.total_amount,
      is_active: true // Quotes don't have active/inactive status like items
    };
  });
  
  // Permission checks
  const canManageQuotes = permissions.hasPermission('manage_opportunities') || permissions.hasPermission('all');
  const canViewQuotes = canManageQuotes || permissions.hasPermission('view_customers');
  
  // Table columns configuration - matching ItemsList pattern
  const columns: TableColumn[] = [
    {
      key: 'estimate_date',
      label: 'Date',
      sortable: true,
      render: (value: string) => {
        const date = new Date(value);
        return (
          <span className="text-gray-900 dark:text-gray-100">
            {date.toLocaleDateString('en-GB')}
          </span>
        );
      }
    },
    {
      key: 'estimate_number',
      label: 'Quote Number',
      sortable: true,
      render: (value: string, row: any) => (
        <div className="flex items-center gap-2">
          <span className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
            {value}
          </span>
          {/* Email icon if sent */}
          {row.status === 'sent' && (
            <span className="text-gray-400" title="Sent via email">📧</span>
          )}
        </div>
      )
    },
    {
      key: 'po_number',
      label: 'Reference Number',
      sortable: true,
      align: 'left'
    },
    {
      key: 'account_name',
      label: 'Customer Name',
      sortable: true,
      align: 'left'
    },
    {
      key: 'status_display',
      label: 'Status',
      sortable: true,
      align: 'center',
      render: (value: string, row: any) => {
        const getStatusColor = (status: string) => {
          switch (status) {
            case 'sent':
              return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
            case 'accepted':
              return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
            case 'draft':
              return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
            case 'rejected':
              return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
            case 'expired':
              return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300';
            default:
              return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
          }
        };
        return (
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(row.status)}`}>
            {value.toUpperCase()}
          </span>
        );
      }
    },
    {
      key: 'total_amount',
      label: 'Amount',
      sortable: true,
      align: 'right',
      render: (value: string) => {
        const amount = parseFloat(value);
        return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      }
    }
  ];
  
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleRowSelect = (selectedIds: (string | number)[]) => {
    console.log('QuotesList handleRowSelect called with:', selectedIds);
    console.log('Previous selectedQuoteIds:', selectedQuoteIds);
    setSelectedQuoteIds(selectedIds);
    console.log('Setting selectedQuoteIds to:', selectedIds);
    
    // Force a re-render check
    setTimeout(() => {
      console.log('After setState - selectedQuoteIds:', selectedQuoteIds);
    }, 0);
  };

  const handleRowAction = (row: TableRow, action: string) => {
    console.log('Row action:', action, 'on row:', row);
    
    switch (action) {
      case 'edit':
        // Navigate to edit quote page
        navigate(`/finance/estimates/${row.id}/edit`);
        break;
      case 'mark_inactive':
        // Quotes don't have active/inactive status, but we can handle status changes
        console.log('Mark quote as inactive:', row.id);
        toast.success('Quote status updated.');
        break;
      case 'mark_active':
        console.log('Mark quote as active:', row.id);
        toast.success('Quote status updated.');
        break;
      case 'delete':
        console.log('Delete quote:', row.id);
        // TODO: Implement delete functionality
        toast.success('Quote deleted successfully.');
        break;
    }
  };

  const handleClearSelection = () => {
    setSelectedQuoteIds([]);
  };

  const handleBulkAction = (action: string) => {
    console.log('Bulk action:', action, 'on quotes:', selectedQuoteIds);
    
    switch (action) {
      case 'enable':
        alert(`Enable ${selectedQuoteIds.length} quotes`);
        break;
      case 'disable':
        alert(`Disable ${selectedQuoteIds.length} quotes`);
        break;
      case 'delete':
        alert(`Delete ${selectedQuoteIds.length} quotes`);
        break;
      case 'export':
        alert(`Export ${selectedQuoteIds.length} quotes`);
        break;
      default:
        break;
    }
  };

  const bulkActions = [
    { label: 'Send Quotes', action: 'send' },
    { label: 'Mark as Draft', action: 'draft' },
    { label: 'Export Selected', action: 'export' },
    { label: 'Delete Quotes', action: 'delete' },
  ];
  
  // Permission check
  if (!canViewQuotes) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view quotes.
          </p>
        </div>
      </div>
    )
  }
  
  console.log('QuotesList render - selectedQuoteIds:', selectedQuoteIds, 'length:', selectedQuoteIds.length);
  console.log('Should show BulkSelectionHeader?', selectedQuoteIds.length > 0);

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
                          {defaultOptions.length}
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
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* New button */}
            <NewButton 
              onClick={() => setShowNewQuoteModal(true)}
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
                  label: 'Import Quotes', 
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

      {/* Main content area with overlay popup */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading quotes...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500 dark:text-red-400">
              Error loading quotes: {String(error)}
            </div>
          </div>
        ) : (
          <>
            {/* Bulk Selection Header - positioned as overlay within content area */}
            {selectedQuoteIds.length > 0 && (
              <BulkSelectionHeader
                selectedCount={selectedQuoteIds.length}
                onClearSelection={handleClearSelection}
                bulkActions={bulkActions}
                onBulkAction={handleBulkAction}
              />
            )}
            
            <DataTable
              columns={columns}
              data={transformedQuotes}
              onSort={handleSort}
              onRowSelect={handleRowSelect}
              onRowAction={handleRowAction}
              showCheckboxes={true}
              showActions={true}
              emptyMessage=""
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              selectedRowIds={selectedQuoteIds}
            />
          </>
        )}
      </div>

      {/* New Quote Modal */}
      {showNewQuoteModal && (
        <NewQuotePage
          isOpen={showNewQuoteModal}
          onClose={() => {
            setShowNewQuoteModal(false);
            // Refresh the quotes list when modal closes
            refetch();
          }}
        />
      )}
    </div>
  );
  
};