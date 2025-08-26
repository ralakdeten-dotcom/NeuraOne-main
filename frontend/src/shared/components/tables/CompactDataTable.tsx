import React, { useState } from 'react'
import { ArrowUpDown, Trash2 } from 'lucide-react'
import { LoadingSpinner, ErrorAlert, EmptyState } from '../feedback'
import { TableControls } from './TableControls'

/**
 * DESIGN CONSTRAINT: Actions columns should always use LEFT alignment
 * 
 * When implementing Actions columns in CompactDataTable:
 * - Header: Use 'text-left' class
 * - Cell: Use 'text-left' class  
 * - Content: Use 'justify-start' for flex containers
 * - Column definition: Set align: 'left' in component using this table
 * 
 * This ensures consistent triple-dot button alignment across all tables.
 */

export interface CompactColumnConfig<T = any> {
  key: string
  title: string
  width?: string
  align?: 'left' | 'center' | 'right'
  render?: (value: any, item: T) => React.ReactNode
  searchable?: boolean
  sortable?: boolean
  sortFn?: (a: T, b: T) => number
}

export interface CompactActionConfig<T = any> {
  id: string
  label: string
  onClick: (item: T) => void
  icon?: React.ReactNode
  variant?: 'default' | 'primary' | 'danger' | 'success' | 'warning'
  hidden?: (item: T) => boolean
  disabled?: (item: T) => boolean
}

export interface CompactDataTableProps<T = any> {
  data: T[]
  columns: CompactColumnConfig<T>[]
  loading?: boolean
  error?: string
  keyExtractor: (item: T) => string | number
  actions?: CompactActionConfig<T>[]
  onRowClick?: (item: T) => void
  emptyMessage?: string
  className?: string
  searchTerm?: string
  maxHeight?: string
  showHeader?: boolean
  maxActions?: number
  showSelection?: boolean
  onSelectionChange?: (selectedItems: T[]) => void
  bulkActions?: {
    delete?: {
      onDelete: (selectedItems: T[]) => Promise<void>
      loading?: boolean
    }
  }
  // Toolbar/Controls props
  showControls?: boolean
  searchPlaceholder?: string
  controlsActions?: React.ReactNode
  controlsFilters?: React.ReactNode
  onSearchChange?: (searchTerm: string) => void
}

export const CompactDataTable = <T extends Record<string, any>>({
  data,
  columns,
  loading,
  error,
  keyExtractor,
  actions,
  onRowClick,
  emptyMessage = 'No data found',
  className = '',
  searchTerm: externalSearchTerm = '',
  maxHeight = '300px',
  showHeader = true,
  maxActions = 2,
  showSelection = false,
  onSelectionChange,
  bulkActions,
  showControls = false,
  searchPlaceholder = 'Search...',
  controlsActions,
  controlsFilters,
  onSearchChange
}: CompactDataTableProps<T>) => {
  const [openActionMenu, setOpenActionMenu] = useState<string | number | null>(null)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedItems, setSelectedItems] = useState<Set<string | number>>(new Set())
  const [internalSearchTerm, setInternalSearchTerm] = useState('')
  
  // Use external search term if provided, otherwise use internal
  const searchTerm = externalSearchTerm || internalSearchTerm
  
  // Handle search changes
  const handleSearchChange = (value: string) => {
    if (onSearchChange) {
      onSearchChange(value)
    } else {
      setInternalSearchTerm(value)
    }
  }

  // Handle sorting
  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (!column?.sortable) return

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Handle selection
  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      const allIds = new Set(processedData.map(keyExtractor))
      setSelectedItems(allIds)
      onSelectionChange?.(processedData)
    } else {
      setSelectedItems(new Set())
      onSelectionChange?.([])
    }
  }

  const handleSelectItem = (item: T, checked: boolean) => {
    const id = keyExtractor(item)
    const newSelected = new Set(selectedItems)
    
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    
    setSelectedItems(newSelected)
    const selectedData = processedData.filter(item => newSelected.has(keyExtractor(item)))
    onSelectionChange?.(selectedData)
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!bulkActions?.delete || selectedItems.size === 0) return
    
    const selectedData = processedData.filter(item => selectedItems.has(keyExtractor(item)))
    const confirmMessage = selectedData.length === 1 
      ? `Are you sure you want to delete this item?`
      : `Are you sure you want to delete ${selectedData.length} items?`
    
    if (confirm(confirmMessage)) {
      try {
        await bulkActions.delete.onDelete(selectedData)
        setSelectedItems(new Set())
        onSelectionChange?.([])
      } catch (error) {
        console.error('Failed to delete items:', error)
        alert('Failed to delete items. Please try again.')
      }
    }
  }

  // Filter and sort data
  const processedData = React.useMemo(() => {
    let processed = [...data]
    
    // Filter based on search term
    if (searchTerm) {
      processed = processed.filter(item => {
        return columns.some(column => {
          if (column.searchable === false) return false
          const value = item[column.key]
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
        })
      })
    }
    
    // Sort data
    if (sortColumn) {
      const column = columns.find(col => col.key === sortColumn)
      processed.sort((a, b) => {
        // Use custom sort function if provided
        if (column?.sortFn) {
          const result = column.sortFn(a, b)
          return sortDirection === 'asc' ? result : -result
        }
        
        // Default sorting logic
        const aValue = a[sortColumn]
        const bValue = b[sortColumn]
        
        if (aValue === null || aValue === undefined) return 1
        if (bValue === null || bValue === undefined) return -1
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        return sortDirection === 'asc' ? comparison : -comparison
      })
    }
    
    return processed
  }, [data, searchTerm, columns, sortColumn, sortDirection])

  // Selection helpers
  const isAllSelected = selectedItems.size === processedData.length && processedData.length > 0
  const isIndeterminate = selectedItems.size > 0 && selectedItems.size < processedData.length

  // Close action menu when clicking outside
  React.useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (openActionMenu !== null && !target.closest('.compact-action-menu')) {
        setOpenActionMenu(null)
      }
    }
    document.addEventListener('click', handleOutsideClick)
    return () => document.removeEventListener('click', handleOutsideClick)
  }, [openActionMenu])

  // Loading state
  if (loading) {
    return (
      <div className={`${className} bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-6 flex justify-center items-center`}>
        <LoadingSpinner size="sm" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={`${className} bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 p-4`}>
        <ErrorAlert message={error} />
      </div>
    )
  }

  const visibleActions = actions?.filter(action => action.hidden ? !action.hidden : true) || []
  const displayActions = visibleActions.slice(0, maxActions) // Limit actions shown
  
  // Calculate column span for empty state
  const totalColumns = columns.length + (visibleActions.length > 0 ? 1 : 0) + (showSelection ? 1 : 0)

  return (
    <div className={className}>
      {/* Controls/Toolbar */}
      {showControls && (
        <TableControls
          searchTerm={searchTerm}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder}
          filters={controlsFilters}
          actions={
            <>
              {/* Bulk Actions */}
              {showSelection && selectedItems.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-blue-700 dark:text-blue-300">
                    {selectedItems.size} selected
                  </span>
                  {bulkActions?.delete && (
                    <button
                      onClick={handleBulkDelete}
                      disabled={bulkActions.delete.loading}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 size={14} />
                      {bulkActions.delete.loading ? 'Deleting...' : 'Delete Selected'}
                    </button>
                  )}
                </div>
              )}
              {controlsActions}
            </>
          }
        />
      )}
      
      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
        <table className="w-full table-fixed">
          {showHeader && (
            <thead className="bg-gray-50 dark:bg-gray-700 -mx-px -mt-px">
              <tr>
                {showSelection && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 tracking-wider border-b border-gray-200 dark:border-gray-600 w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={input => {
                        if (input) input.indeterminate = isIndeterminate
                      }}
                      onChange={handleSelectAll}
                      className="cursor-pointer"
                    />
                  </th>
                )}
                {columns.map((column, index) => (
                  <th
                    key={column.key}
                    className={`px-4 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 tracking-wider border-b border-gray-200 dark:border-gray-600 ${
                      column.sortable ? 'cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600' : ''
                    }`}
                    style={{ 
                      width: column.width || 'auto',
                      textAlign: column.align || 'left'
                    }}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center gap-1">
                      <span>{column.title}</span>
                      {column.sortable && (
                        <ArrowUpDown 
                          size={12}
                          className={sortColumn === column.key ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}
                        />
                      )}
                    </div>
                  </th>
                ))}
                {/* CONSTRAINT: Actions column should always use left alignment for consistency */}
                {visibleActions.length > 0 && (
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 tracking-wider border-b border-gray-200 dark:border-gray-600 w-20">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
          )}
          <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
            {processedData.length === 0 ? (
              <tr>
                <td 
                  colSpan={totalColumns} 
                  className="px-3 py-8 text-center"
                >
                  <EmptyState 
                    title={emptyMessage}
                    description={searchTerm ? "Try adjusting your search." : undefined}
                  />
                </td>
              </tr>
            ) : (
              processedData.map((item) => {
                const itemKey = keyExtractor(item)
                const isSelected = selectedItems.has(itemKey)
                
                return (
                  <tr
                    key={itemKey}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    } ${
                      onRowClick ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => onRowClick?.(item)}
                  >
                    {showSelection && (
                      <td
                        className="px-3 py-2 text-sm text-gray-900 dark:text-gray-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleSelectItem(item, e.target.checked)}
                          className="cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((column, index) => (
                      <td
                        key={column.key}
                        className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100"
                        style={{ textAlign: column.align || 'left' }}
                      >
                        {column.render 
                          ? column.render(item[column.key], item) 
                          : (item[column.key] ?? 'N/A')
                        }
                      </td>
                    ))}
                    {/* CONSTRAINT: Actions column cells should always use left alignment for consistency */}
                    {visibleActions.length > 0 && (
                      <td
                        className="px-3 py-2 text-left"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex justify-start items-center gap-1 compact-action-menu">
                          {/* Show inline actions if 2 or fewer */}
                          {displayActions.length <= 2 ? (
                            displayActions.map((action) => (
                              <button
                                key={action.id}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  action.onClick(item)
                                }}
                                disabled={action.disabled?.(item)}
                                className={`p-1.5 rounded-md text-xs transition-colors ${
                                  action.variant === 'danger' 
                                    ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20' 
                                    : action.variant === 'primary'
                                    ? 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20'
                                    : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600'
                                } ${action.disabled?.(item) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                title={action.label}
                              >
                                {action.icon}
                              </button>
                            ))
                          ) : (
                            /* Show dropdown for many actions */
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setOpenActionMenu(openActionMenu === itemKey ? null : itemKey)
                                }}
                                className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600 transition-colors"
                              >
                                <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                </svg>
                              </button>
                              {openActionMenu === itemKey && (
                                <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg z-20">
                                  <div className="py-1">
                                    {visibleActions.map((action) => (
                                      <button
                                        key={action.id}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          action.onClick(item)
                                          setOpenActionMenu(null)
                                        }}
                                        disabled={action.disabled?.(item)}
                                        className={`w-full px-3 py-2 text-left text-xs flex items-center gap-2 transition-colors ${
                                          action.variant === 'danger' 
                                            ? 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20' 
                                            : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-600'
                                        } ${action.disabled?.(item) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      >
                                        {action.icon}
                                        {action.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}