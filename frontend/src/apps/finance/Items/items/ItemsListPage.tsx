import React, { useState, useRef, useEffect, useMemo, Fragment } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChevronDown, ChevronUp, Search, Star, ArrowUpDown, Download, Upload, ArrowUp, ArrowDown } from 'lucide-react'
import { NewButton, MoreActionsButton, DataTable, BulkSelectionHeader, createSortSubmenuItems, type TableColumn, type TableRow, type SortableColumn, type SortState } from '@/finance-inventory-shared'
import { usePermissions } from '@/core/auth/usePermissions'
import { useFinanceItems, useActivateFinanceItem, useDeactivateFinanceItem, useDeleteFinanceItem, type FinanceItemListItem } from './api'
import toast from 'react-hot-toast'

// Sort items helper function
const sortItemsByColumn = (items: FinanceItemListItem[], sortColumn: string, sortDirection: 'asc' | 'desc') => {
  if (!sortColumn) return items
  
  const sorted = [...items].sort((a, b) => {
    let aValue: any = a[sortColumn as keyof FinanceItemListItem]
    let bValue: any = b[sortColumn as keyof FinanceItemListItem]
    
    // Handle null/undefined values for numeric fields
    if (aValue === null || aValue === undefined) {
      aValue = sortColumn === 'rate' || sortColumn === 'purchase_rate' || sortColumn === 'stock_on_hand' ? 0 : ''
    }
    if (bValue === null || bValue === undefined) {
      bValue = sortColumn === 'rate' || sortColumn === 'purchase_rate' || sortColumn === 'stock_on_hand' ? 0 : ''
    }
    
    // For numeric fields, ensure we're comparing numbers
    if (sortColumn === 'rate' || sortColumn === 'purchase_rate' || sortColumn === 'stock_on_hand') {
      aValue = Number(aValue) || 0
      bValue = Number(bValue) || 0
    } else if (sortColumn === 'created_time') {
      // For date fields, convert to Date objects
      aValue = new Date(aValue).getTime()
      bValue = new Date(bValue).getTime()
    } else if (typeof aValue === 'string' && typeof bValue === 'string') {
      // For string fields, convert to lowercase
      aValue = aValue.toLowerCase()
      bValue = bValue.toLowerCase()
    }
    
    if (aValue < bValue) {
      return sortDirection === 'asc' ? -1 : 1
    }
    if (aValue > bValue) {
      return sortDirection === 'asc' ? 1 : -1
    }
    return 0
  })
  
  return sorted
}

export const ItemsListPage: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [activeDropdown, setActiveDropdown] = useState(false)
  const [activeFilter, setActiveFilter] = useState('ItemType.All')
  const [activeView, setActiveView] = useState('All Items')
  const [favoriteViews, setFavoriteViews] = useState<string[]>([])
  const [showFavoritesSection, setShowFavoritesSection] = useState(true)
  const [showDefaultSection, setShowDefaultSection] = useState(true)
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedItemIds, setSelectedItemIds] = useState<(string | number)[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    itemId: string | null;
    itemName: string;
  }>({ isOpen: false, itemId: null, itemName: '' })
  
  const [bulkDeleteConfirmation, setBulkDeleteConfirmation] = useState<{
    isOpen: boolean;
    itemIds: (string | number)[];
    itemCount: number;
  }>({ isOpen: false, itemIds: [], itemCount: 0 })
  
  // Define sortable columns
  const sortableColumns: SortableColumn[] = [
    { key: 'name', label: 'Name' },
    { key: 'sku', label: 'SKU' },
    { key: 'item_type', label: 'Type' },
    { key: 'rate', label: 'Sales Price' },
    { key: 'purchase_rate', label: 'Cost Price' },
    { key: 'stock_on_hand', label: 'Stock on Hand' }
  ];

  // Current sort state
  const currentSort: SortState = {
    column: sortColumn,
    direction: sortDirection
  };
  
  // Hooks
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const permissions = usePermissions()
  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
      setCurrentPage(1) // Reset to first page on search
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Build filters based on active view and search
  const filters = useMemo(() => {
    const filterObj: any = {}
    
    // Add search query if present
    if (debouncedSearchQuery) {
      filterObj.search = debouncedSearchQuery
    }
    
    switch (activeFilter) {
      case 'ItemType.Active':
        filterObj.status = 'active'
        break
      case 'ItemType.Inactive':
        filterObj.status = 'inactive'
        break
      case 'ItemType.Inventory':
        filterObj.item_type = 'inventory'
        break
      case 'ItemType.Sales':
        filterObj.item_type = 'sales'
        break
      case 'ItemType.Purchases':
        filterObj.item_type = 'purchases'
        break
      case 'ItemType.Goods':
        filterObj.product_type = 'goods'
        break
      case 'ItemType.Services':
        filterObj.product_type = 'service'
        break
      default:
        // 'ItemType.All' - no filters
        break
    }
    
    return filterObj
  }, [activeFilter, debouncedSearchQuery])
  
  const { data: itemsData, isLoading, error, refetch } = useFinanceItems(currentPage, pageSize, filters)
  
  // Mutation hooks for item operations
  const activateItemMutation = useActivateFinanceItem()
  const deactivateItemMutation = useDeactivateFinanceItem()
  const deleteItemMutation = useDeleteFinanceItem()

  // Handle custom row click events from DataTable columns
  React.useEffect(() => {
    const handleRowClick = (event: any) => {
      const row = event.detail;
      if (row && row.id) {
        // Navigate to item details page
        navigate(`/finance/items/${row.id}`);
      }
    };

    window.addEventListener('rowClick', handleRowClick);
    return () => window.removeEventListener('rowClick', handleRowClick);
  }, [navigate]);
  
  // Check for sort preferences from URL params and localStorage on component mount
  useEffect(() => {
    // First check URL parameters
    const urlSortField = searchParams.get('sortField')
    const urlSortDirection = searchParams.get('sortDirection')
    
    if (urlSortField) {
      setSortColumn(urlSortField)
      setSortDirection((urlSortDirection as 'asc' | 'desc') || 'asc')
      
      // Clear URL params after applying
      setSearchParams({})
      return
    }
    
    // Fallback to localStorage
    const savedSortField = localStorage.getItem('itemsSortField')
    const savedSortDirection = localStorage.getItem('itemsSortDirection')
    
    if (savedSortField) {
      setSortColumn(savedSortField)
      setSortDirection((savedSortDirection as 'asc' | 'desc') || 'asc')
      
      // Clear the localStorage after applying the sort
      localStorage.removeItem('itemsSortField')
      localStorage.removeItem('itemsSortDirection')
    }
  }, [searchParams, setSearchParams])
  
  // Data processing
  const items = itemsData?.results || []
  
  // Sort items based on current sort settings
  const sortedItems = useMemo(() => {
    return sortItemsByColumn(items, sortColumn, sortDirection)
  }, [items, sortColumn, sortDirection])
  
  // View options for the dropdown
  const viewOptions = [
    { id: 'all', label: 'All Items', filter: 'ItemType.All' },
    { id: 'active', label: 'Active Items', filter: 'ItemType.Active' },
    { id: 'inactive', label: 'Inactive Items', filter: 'ItemType.Inactive' },
    { id: 'inventory', label: 'Inventory Items', filter: 'ItemType.Inventory' },
    { id: 'sales', label: 'Sales Items', filter: 'ItemType.Sales' },
    { id: 'purchases', label: 'Purchase Items', filter: 'ItemType.Purchases' },
    { id: 'goods', label: 'Goods', filter: 'ItemType.Goods' },
    { id: 'services', label: 'Services', filter: 'ItemType.Services' }
  ]

  const handleViewChange = (view: string, filter: string) => {
    setActiveView(view)
    setActiveFilter(filter)
    setActiveDropdown(false)
    setCurrentPage(1) // Reset to first page when view changes
  }

  const toggleFavorite = (viewLabel: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    setFavoriteViews(prev => {
      if (prev.includes(viewLabel)) {
        return prev.filter(fav => fav !== viewLabel)
      } else {
        return [...prev, viewLabel]
      }
    })
  }

  // Categorize views
  const favoriteOptions = viewOptions.filter(option => favoriteViews.includes(option.label))
  const defaultOptions = viewOptions
  
  // Transform to TableRow format - using correct field mappings
  const transformedItems: TableRow[] = sortedItems.map(item => ({
    id: item.item_id, // Using item_id (UUID) from backend
    name: item.name,
    sku: item.sku || '-',
    type: item.product_type === 'goods' ? 'Goods' : 'Service',
    itemType: item.item_type, // inventory, sales, purchases, sales_and_purchases
    salesDescription: item.sales_description || '',
    purchaseDescription: item.purchase_description || '',
    purchaseRate: `£${(Number(item.purchase_rate) || 0).toFixed(2)}`,
    rate: `£${(Number(item.rate) || 0).toFixed(2)}`,
    stockOnHand: (Number(item.stock_on_hand) || 0).toFixed(2),
    unit: item.unit,
    reorderLevel: item.reorder_level,
    vendorName: item.vendor_name || '',
    groupName: item.group_name || '',
    image_url: item.image_name, // Backend provides image_name
    is_active: item.status === 'active',
    is_low_stock: item.is_low_stock
  }))
  
  // Permission checks
  const canManageItems = permissions.hasPermission('manage_products') || permissions.hasPermission('all')
  const canViewItems = canManageItems || permissions.hasPermission('view_products')
  
  // Table columns configuration
  const columns: TableColumn[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      render: (value: string, item: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 dark:bg-gray-700">
            {item.image_url ? (
              <img 
                src={item.image_url} 
                alt={value}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder if image fails to load
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  target.parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21,15 16,10 5,21"></polyline></svg></div>';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21,15 16,10 5,21"></polyline>
                </svg>
              </div>
            )}
          </div>
          <div>
            <span className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              {value}
            </span>
            {item.is_low_stock && (
              <span className="ml-2 text-xs text-red-500 dark:text-red-400 font-medium">Low Stock</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'sku',
      label: 'SKU',
      sortable: true,
      align: 'left'
    },
    {
      key: 'type',
      label: 'Type',
      sortable: true,
      align: 'left',
      render: (value: string, item: any) => (
        <div>
          <div>{value}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{item.itemType}</div>
        </div>
      )
    },
    {
      key: 'purchaseDescription',
      label: 'Purchase Description',
      sortable: false,
      align: 'left'
    },
    {
      key: 'purchaseRate',
      label: 'Cost Price',
      sortable: true,
      align: 'right'
    },
    {
      key: 'salesDescription',
      label: 'Sales Description',
      sortable: false,
      align: 'left'
    },
    {
      key: 'rate',
      label: 'Sales Price',
      sortable: true,
      align: 'right'
    },
    {
      key: 'stockOnHand',
      label: 'Stock on Hand',
      sortable: true,
      align: 'right',
      render: (value: string, item: any) => (
        <div>
          <div>{value}</div>
          {Number(value) <= item.reorderLevel && (
            <div className="text-xs text-yellow-500">Reorder</div>
          )}
        </div>
      )
    },
    {
      key: 'unit',
      label: 'Unit',
      sortable: false,
      align: 'left'
    }
  ]
  
  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column);
    setSortDirection(direction);
  };

  const handleRowSelect = (selectedIds: (string | number)[]) => {
    setSelectedItemIds(selectedIds);
  };

  const handleRowAction = (row: TableRow, action: string) => {
    switch (action) {
      case 'edit':
        navigate(`/finance/items/${row.id}/edit`);
        break;
      case 'mark_inactive':
        deactivateItemMutation.mutate(String(row.id), {
          onSuccess: () => {
            toast.success('The selected item has been marked as inactive.');
            refetch();
          },
          onError: (error) => {
            console.error('Failed to mark item as inactive:', error);
            toast.error('Failed to mark item as inactive. Please try again.');
          }
        });
        break;
      case 'mark_active':
        activateItemMutation.mutate(String(row.id), {
          onSuccess: () => {
            toast.success('The selected item has been marked as active.');
            refetch();
          },
          onError: (error) => {
            console.error('Failed to mark item as active:', error);
            toast.error('Failed to mark item as active. Please try again.');
          }
        });
        break;
      case 'delete':
        setDeleteConfirmation({
          isOpen: true,
          itemId: String(row.id),
          itemName: row.name || 'this item'
        });
        break;
    }
  };

  const handleClearSelection = () => {
    setSelectedItemIds([]);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmation.itemId) {
      deleteItemMutation.mutate(deleteConfirmation.itemId, {
        onSuccess: () => {
          setDeleteConfirmation({ isOpen: false, itemId: null, itemName: '' });
          toast.success('The selected item has been deleted successfully.');
          refetch();
        },
        onError: (error) => {
          console.error('Failed to delete item:', error);
          setDeleteConfirmation({ isOpen: false, itemId: null, itemName: '' });
          toast.error('Failed to delete item. Please try again.');
        }
      });
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmation({ isOpen: false, itemId: null, itemName: '' });
  };

  const handleBulkDeleteConfirm = () => {
    if (bulkDeleteConfirmation.itemIds.length > 0) {
      const itemCount = bulkDeleteConfirmation.itemCount;
      const itemIds = [...bulkDeleteConfirmation.itemIds];
      
      // Close the dialog immediately
      setBulkDeleteConfirmation({ isOpen: false, itemIds: [], itemCount: 0 });
      
      // Delete each item sequentially
      const deleteItems = async () => {
        try {
          for (const id of itemIds) {
            await new Promise((resolve, reject) => {
              deleteItemMutation.mutate(String(id), {
                onSuccess: resolve,
                onError: reject
              });
            });
          }
          
          handleClearSelection();
          toast.success(`${itemCount} items have been deleted successfully.`);
          refetch();
        } catch (error) {
          console.error('Failed to delete items:', error);
          toast.error('Failed to delete some items. Please try again.');
        }
      };
      
      deleteItems();
    }
  };

  const handleBulkDeleteCancel = () => {
    setBulkDeleteConfirmation({ isOpen: false, itemIds: [], itemCount: 0 });
  };

  const handleBulkAction = (action: string) => {
    switch (action) {
      case 'activate': {
        // Activate all selected items
        if (selectedItemIds.length === 0) {
          toast.error('No items selected');
          return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        const totalCount = selectedItemIds.length;
        
        selectedItemIds.forEach(id => {
          activateItemMutation.mutate(String(id), {
            onSuccess: () => {
              successCount++;
              if (successCount + errorCount === totalCount) {
                if (successCount > 0) {
                  toast.success(`${successCount} item(s) activated successfully`);
                }
                if (errorCount > 0) {
                  toast.error(`Failed to activate ${errorCount} item(s)`);
                }
                handleClearSelection();
                refetch();
              }
            },
            onError: (error) => {
              errorCount++;
              console.error(`Failed to activate item ${id}:`, error);
              if (successCount + errorCount === totalCount) {
                if (successCount > 0) {
                  toast.success(`${successCount} item(s) activated successfully`);
                }
                toast.error(`Failed to activate ${errorCount} item(s)`);
                handleClearSelection();
                refetch();
              }
            }
          });
        });
        break;
      }
      case 'deactivate': {
        // Deactivate all selected items
        if (selectedItemIds.length === 0) {
          toast.error('No items selected');
          return;
        }
        
        let successCount = 0;
        let errorCount = 0;
        const totalCount = selectedItemIds.length;
        
        selectedItemIds.forEach(id => {
          deactivateItemMutation.mutate(String(id), {
            onSuccess: () => {
              successCount++;
              if (successCount + errorCount === totalCount) {
                if (successCount > 0) {
                  toast.success(`${successCount} item(s) deactivated successfully`);
                }
                if (errorCount > 0) {
                  toast.error(`Failed to deactivate ${errorCount} item(s)`);
                }
                handleClearSelection();
                refetch();
              }
            },
            onError: (error) => {
              errorCount++;
              console.error(`Failed to deactivate item ${id}:`, error);
              if (successCount + errorCount === totalCount) {
                if (successCount > 0) {
                  toast.success(`${successCount} item(s) deactivated successfully`);
                }
                toast.error(`Failed to deactivate ${errorCount} item(s)`);
                handleClearSelection();
                refetch();
              }
            }
          });
        });
        break;
      }
      case 'delete':
        setBulkDeleteConfirmation({
          isOpen: true,
          itemIds: selectedItemIds,
          itemCount: selectedItemIds.length
        });
        break;
      case 'export':
        toast('Export feature coming soon');
        break;
      default:
        break;
    }
  };

  const bulkActions = [
    { label: 'Activate Items', action: 'activate' },
    { label: 'Deactivate Items', action: 'deactivate' },
    { label: 'Export Selected', action: 'export' },
    { label: 'Delete Items', action: 'delete' },
  ];
  
  // Permission check
  if (!canViewItems) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view items.
          </p>
        </div>
      </div>
    )
  }

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
              
              {/* Dropdown menu */}
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

          {/* Right side - Search and Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-64 px-3 py-1.5 pl-9 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            
            {/* New button */}
            <NewButton 
              onClick={() => navigate('/finance/items/new')}
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
                  label: 'Import Items', 
                  onClick: () => toast('Import feature coming soon'),
                  icon: <Download className="w-4 h-4" />
                },
                { 
                  label: 'Export', 
                  onClick: () => toast('Export feature coming soon'),
                  icon: <Upload className="w-4 h-4" />
                },
              ]}
            />
          </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 relative">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-500 dark:text-gray-400">Loading items...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-red-500 dark:text-red-400">
              Error loading items: {String(error)}
            </div>
          </div>
        ) : (
          <>
            {/* Bulk Selection Header */}
            {selectedItemIds.length > 0 && (
              <BulkSelectionHeader
                selectedCount={selectedItemIds.length}
                onClearSelection={handleClearSelection}
                bulkActions={bulkActions}
                onBulkAction={handleBulkAction}
              />
            )}
            
            <DataTable
              columns={columns}
              data={transformedItems}
              onSort={handleSort}
              onRowSelect={handleRowSelect}
              onRowAction={handleRowAction}
              showCheckboxes={true}
              showActions={true}
              emptyMessage="No items found"
              sortColumn={sortColumn}
              sortDirection={sortDirection}
              selectedRowIds={selectedItemIds}
            />
            
            {/* Pagination */}
            {itemsData && itemsData.count > pageSize && (
              <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, itemsData.count)} of {itemsData.count} items
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.ceil(itemsData.count / pageSize) }, (_, i) => i + 1)
                        .filter(page => {
                          // Show first, last, current and adjacent pages
                          return page === 1 || 
                                 page === Math.ceil(itemsData.count / pageSize) ||
                                 Math.abs(page - currentPage) <= 1
                        })
                        .map((page, index, array) => (
                          <React.Fragment key={page}>
                            {index > 0 && array[index - 1] !== page - 1 && (
                              <span className="px-2 text-gray-500">...</span>
                            )}
                            <button
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-1 border rounded-md text-sm font-medium ${
                                currentPage === page
                                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                              }`}
                            >
                              {page}
                            </button>
                          </React.Fragment>
                        ))
                      }
                    </div>
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage >= Math.ceil(itemsData.count / pageSize)}
                      className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

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
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Delete Item</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete "{deleteConfirmation.itemName}"? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteConfirm}
                  disabled={deleteItemMutation.isPending}
                >
                  {deleteItemMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                  onClick={handleDeleteCancel}
                  disabled={deleteItemMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      {bulkDeleteConfirmation.isOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex justify-center pt-12 pb-4 px-4">
            <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={handleBulkDeleteCancel}></div>
            
            <div className="inline-block bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all max-w-lg w-full relative">
              <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-yellow-600 dark:text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833-.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Delete Items</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Are you sure you want to delete {bulkDeleteConfirmation.itemCount} selected items? This action cannot be undone.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleBulkDeleteConfirm}
                  disabled={deleteItemMutation.isPending}
                >
                  {deleteItemMutation.isPending ? 'Deleting...' : 'Delete All'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm dark:bg-gray-600 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-500"
                  onClick={handleBulkDeleteCancel}
                  disabled={deleteItemMutation.isPending}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}