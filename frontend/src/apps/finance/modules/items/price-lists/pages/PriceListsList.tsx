
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit2, Power, Trash2, ArrowUpDown, Download, Upload } from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { DataTable, MoreActionsButton, createSortSubmenuItems, type TableColumn, type SortableColumn, type SortState } from '@/finance-inventory-shared';
import { usePriceLists, useDeletePriceList, useTogglePriceListStatus, type PriceListAPI } from '../../api/PriceListAPI';

// Use the API interface directly
type PriceList = PriceListAPI;

export const PriceListsList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'sales' | 'purchases'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // API Hooks
  const { data: priceLists = [], isLoading, error, refetch } = usePriceLists();
  const deletePriceListMutation = useDeletePriceList();
  const toggleStatusMutation = useTogglePriceListStatus();

  const [sortColumn, setSortColumn] = useState<string>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Define sortable columns
  const sortableColumns: SortableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'type', label: 'Type' },
    { key: 'currency_code', label: 'Currency' }
  ];

  // Current sort state
  const currentSort: SortState = {
    column: sortColumn,
    direction: sortDirection
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.relative')) {
        setIsFilterDropdownOpen(false);
      }
    };

    if (isFilterDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isFilterDropdownOpen]);

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleEdit = useCallback((priceList: PriceList) => {
    console.log('handleEdit called for price list:', priceList);
    console.log('Price list status:', priceList.status);
    console.log('Price list ID:', priceList.id);
    
    if (!priceList.id) {
      console.error('Cannot edit price list: missing ID');
      alert('Error: Price list ID is missing. Cannot open edit page.');
      return;
    }
    
    console.log('Navigating to edit page for price list ID:', priceList.id);
    navigate(`/finance/items/price-lists/edit/${priceList.id}`);
  }, [navigate]);

  // Handle row click events from DataTable
  useEffect(() => {
    const handleRowClick = (event: Event) => {
      try {
        const customEvent = event as CustomEvent;
        const priceList = customEvent.detail as PriceList;
        console.log('Row clicked via DataTable event, received data:', priceList);
        console.log('Row status from event:', priceList?.status);
        
        if (priceList && priceList.id) {
          if (priceList.status === 'inactive') {
            console.log('Row is inactive - preventing edit page navigation');
            alert('Cannot edit inactive price list. Please activate it first.');
            return;
          }
          
          console.log('Row click: Navigating to edit page for price list ID:', priceList.id, 'Status:', priceList.status);
          handleEdit(priceList);
        } else {
          console.warn('Row clicked but no valid price list data received:', priceList);
        }
      } catch (error) {
        console.error('Error handling row click:', error);
      }
    };

    window.addEventListener('rowClick', handleRowClick);
    console.log('Row click event listener added');

    return () => {
      window.removeEventListener('rowClick', handleRowClick);
      console.log('Row click event listener removed');
    };
  }, [handleEdit]);

  const handleToggleStatus = async (priceList: PriceList) => {
    try {
      const currentStatus = priceList.status || 'active';
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      console.log(`Toggling status for price list ${priceList.id} from ${currentStatus} to ${newStatus}`);
      
      await toggleStatusMutation.mutateAsync({
        id: priceList.id,
        status: newStatus
      });
      
      console.log(`Price list ${priceList.name} marked as ${newStatus}`);
      
      // Manually refresh the data to ensure table is up-to-date
      refetch();
    } catch (error) {
      console.error('Error updating price list status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const handleDelete = async (priceList: PriceList) => {
    if (window.confirm(`Are you sure you want to delete "${priceList.name}"? This action cannot be undone.`)) {
      try {
        await deletePriceListMutation.mutateAsync(priceList.id);
        console.log(`Price list ${priceList.name} deleted successfully`);
      } catch (error) {
        console.error('Error deleting price list:', error);
        alert('Error deleting price list. Please try again.');
      }
    }
  };

  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name and Description',
      sortable: true,
      locked: true,
      render: (value: string, row: PriceList) => (
        <div 
          className={`flex-1 min-w-0 ${row.status === 'inactive' ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
          onClick={(e) => {
            e.stopPropagation();
            console.log('Name/Description area clicked for row:', row);
            console.log('Row status:', row.status);
            console.log('Row ID:', row.id);
            
            if (row.status === 'inactive') {
              console.log('Row is inactive - preventing edit page navigation');
              alert('Cannot edit inactive price list. Please activate it first.');
              return;
            }
            
            console.log('Row is active - navigating to edit page');
            handleEdit(row);
          }}
        >
          <div className={`font-medium text-sm sm:text-base truncate ${
            row.status === 'inactive' 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 hover:text-blue-800 cursor-pointer'
          }`}>
            {value}
            {row.status === 'inactive' && (
              <span className="ml-2 px-2 py-1 text-xs bg-gray-200 text-gray-600 rounded whitespace-nowrap">
                Inactive
              </span>
            )}
          </div>
          {row.description && (
            <div className="text-xs sm:text-sm text-gray-500 mt-1 truncate">{row.description}</div>
          )}
        </div>
      )
    },
    {
      key: 'currency',
      label: 'Currency',
      sortable: true,
      align: 'left' as const,
      render: (value: string, row: PriceList) => row.currency || '-'
    },
    {
      key: 'details',
      label: 'Details',
      sortable: false,
      align: 'left' as const,
      render: (value: string, row: PriceList) => row.details || '-'
    },
    {
      key: 'pricingScheme',
      label: 'Pricing Scheme',
      sortable: false,
      align: 'center' as const,
      render: (value: string, row: PriceList) => row.pricingScheme || '-'
    },
    {
      key: 'roundOffPreference',
      label: 'Round Off Preference',
      sortable: false,
      align: 'left' as const,
      render: (value: string, row: PriceList) => row.roundOffPreference || '-'
    },
    {
      key: 'actions',
      label: '',
      sortable: false,
      align: 'center' as const,
      render: (value: string, row: PriceList) => (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-1 text-xs pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
            className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors whitespace-nowrap"
            title="Edit"
          >
            Edit
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(row);
            }}
            className="px-2 py-1 text-xs text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded transition-colors whitespace-nowrap"
            title={row.status === 'active' ? 'Mark as Inactive' : 'Mark as Active'}
          >
            {row.status === 'active' ? 'Inactive' : 'Active'}
          </button>
          <span className="text-gray-300">|</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(row);
            }}
            className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors whitespace-nowrap"
            title="Delete"
          >
            Delete
          </button>
        </div>
      )
    }
  ];

  const handleRowAction = (row: PriceList, action: string) => {
    console.log('Action:', action, 'Row:', row);
  };

  const handleNewPriceList = () => {
    navigate('/finance/items/price-lists/new');
  };

  const getFilterLabel = () => {
    switch (filterType) {
      case 'sales':
        return 'Sales Price Lists';
      case 'purchases':
        return 'Purchase Price Lists';
      default:
        return 'All Price Lists';
    }
  };

  const filteredData = priceLists.filter(priceList => {
    // Apply search filter
    const matchesSearch = (priceList.name && priceList.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (priceList.description && priceList.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (priceList.currency && priceList.currency.toLowerCase().includes(searchTerm.toLowerCase()));

    // Apply type filter based on originalData transaction type (if available)
    const matchesType = (() => {
      if (filterType === 'all') return true;
      
      // Use the original form data if available to determine transaction type
      if (priceList.originalData && priceList.originalData.transactionType) {
        if (filterType === 'sales') return priceList.originalData.transactionType === 'sales';
        if (filterType === 'purchases') return priceList.originalData.transactionType === 'purchase';
      }
      
      // If no original data, show in 'all' filter only
      return filterType === 'all';
    })();

    return matchesSearch && matchesType;
  });

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex flex-col overflow-hidden">
      <div className="bg-white dark:bg-gray-800 flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex flex-col sm:flex-row items-start sm:items-center justify-between px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-gray-200 dark:border-gray-700 gap-3 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="relative flex-shrink-0">
              <button
                onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors min-w-0"
              >
                <span className="truncate max-w-[150px] sm:max-w-[200px] lg:max-w-none">{getFilterLabel()}</span>
                <svg 
                  className={`w-3 h-3 sm:w-4 sm:h-4 text-blue-600 flex-shrink-0 transition-transform ${
                    isFilterDropdownOpen ? 'rotate-180' : ''
                  }`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isFilterDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-40 sm:w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                  <div className="py-2">
                    <button
                      onClick={() => {
                        setFilterType('all');
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        filterType === 'all' 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => {
                        setFilterType('sales');
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        filterType === 'sales' 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      Sales
                    </button>
                    <button
                      onClick={() => {
                        setFilterType('purchases');
                        setIsFilterDropdownOpen(false);
                      }}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 ${
                        filterType === 'purchases' 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-900 dark:text-gray-100'
                      }`}
                    >
                      Purchases
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
            <button 
              onClick={handleNewPriceList}
              className="flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm sm:text-base flex-1 sm:flex-initial"
            >
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
              <span>New</span>
            </button>
            <MoreActionsButton 
              actions={[
                { 
                  label: 'Import', 
                  onClick: () => {},
                  icon: <Download className="w-4 h-4" />,
                  submenu: [
                    {
                      label: 'Import Sales Price List',
                      onClick: () => {
                        console.log('Import Sales Price List clicked');
                      }
                    },
                    {
                      label: 'Import Purchase Price List',
                      onClick: () => {
                        console.log('Import Purchase Price List clicked');
                      }
                    }
                  ]
                },
                { 
                  label: 'Export', 
                  onClick: () => {},
                  icon: <Upload className="w-4 h-4" />,
                  submenu: [
                    {
                      label: 'Export Sales Price List',
                      onClick: () => {
                        console.log('Export Sales Price List clicked');
                      }
                    },
                    {
                      label: 'Export Purchase Price List',
                      onClick: () => {
                        console.log('Export Purchase Price List clicked');
                      }
                    }
                  ]
                },
                { 
                  label: 'Disable Price List', 
                  onClick: () => {},
                  icon: <Power className="w-4 h-4" />
                }
              ]}
              className="flex-shrink-0"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-auto">
            <DataTable
              columns={columns}
              data={filteredData}
              onSort={handleSort}
              onRowAction={handleRowAction}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              showCheckboxes={false}
              showActions={true}
              emptyMessage="No price lists found"
              customActionsRender={() => null}
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </div>
  );
};