import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  DataTable, 
  TableControls, 
  ColumnManager,
  PrimaryLinkCell,
  BadgeCell,
  DateCell,
  ValueCell,
  useColumnVisibility,
  type ColumnConfig, 
  type ActionConfig 
} from '@/shared'
import { usePermissions } from '@/core/auth/usePermissions'
import { useEstimates, useDeleteEstimate, useDuplicateEstimate, useConvertToSalesOrder, EstimateListItem } from '../api'
import { EstimateFormSidePanel } from '../components/EstimateFormSidePanel'

export const EstimatesListPage: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEstimates, setSelectedEstimates] = useState<EstimateListItem[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [selectedEstimate, setSelectedEstimate] = useState<EstimateListItem | undefined>(undefined)
  
  // Hooks
  const navigate = useNavigate()
  const permissions = usePermissions()
  const { data: estimatesData, isLoading, error, refetch } = useEstimates(currentPage, pageSize)
  const deleteEstimate = useDeleteEstimate()
  const duplicateEstimate = useDuplicateEstimate()
  const convertToSalesOrder = useConvertToSalesOrder()
  
  // Data processing
  const estimates = estimatesData?.results || []
  const filteredEstimates = estimates.filter(estimate =>
    estimate.estimate_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    estimate.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (estimate.po_number && estimate.po_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (estimate.contact_name && estimate.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (estimate.deal_name && estimate.deal_name.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  // Permission checks
  const canManageEstimates = permissions.hasPermission('manage_opportunities') || permissions.hasPermission('all')
  const canViewEstimates = canManageEstimates || permissions.hasPermission('view_customers')
  
  // Handlers
  const handleDelete = async (id: number, estimateNumber: string) => {
    if (window.confirm(`Are you sure you want to delete estimate "${estimateNumber}"?`)) {
      try {
        await deleteEstimate.mutateAsync(id)
        alert('Estimate deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting estimate: ${errorMessage}`)
      }
    }
  }
  
  const handleDuplicate = async (id: number, estimateNumber: string) => {
    try {
      await duplicateEstimate.mutateAsync(id)
      alert(`Estimate "${estimateNumber}" duplicated successfully`)
      refetch()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
      alert(`Error duplicating estimate: ${errorMessage}`)
    }
  }

  const handleConvertToSalesOrder = async (id: number, estimateNumber: string, status: string) => {
    if (status !== 'accepted') {
      alert('Only accepted estimates can be converted to sales orders')
      return
    }

    if (window.confirm(`Convert estimate "${estimateNumber}" to a sales order?`)) {
      try {
        const result = await convertToSalesOrder.mutateAsync(id)
        alert(`Estimate converted to sales order: ${result.sales_order_number}`)
        navigate(`/finance/sales-orders/${result.sales_order_id}`)
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error converting to sales order: ${errorMessage}`)
      }
    }
  }
  
  const handleBulkDelete = async () => {
    if (selectedEstimates.length === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedEstimates.length} estimate(s)?`
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(
          selectedEstimates.map(estimate => deleteEstimate.mutateAsync(estimate.estimate_id))
        )
        alert(`${selectedEstimates.length} estimate(s) deleted successfully`)
        setSelectedEstimates([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting estimates: ${errorMessage}`)
      }
    }
  }
  
  const handleNewEstimate = () => {
    setSelectedEstimate(undefined)
    setModalOpen(true)
  }
  
  const handleEditEstimate = (estimate: EstimateListItem) => {
    // Convert list item to full estimate for editing
    const fullEstimate = {
      ...estimate,
      account: 0, // Will be populated from account_name
      line_items: [],
      created_by: undefined,
      updated_by: undefined,
      created_by_name: '',
      updated_by_name: ''
    }
    setSelectedEstimate(fullEstimate)
    setModalOpen(true)
  }
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'gray'
      case 'sent':
        return 'blue'
      case 'accepted':
        return 'green'
      case 'rejected':
        return 'red'
      case 'expired':
        return 'yellow'
      default:
        return 'gray'
    }
  }
  
  // Column configuration
  const columns: ColumnConfig<EstimateListItem>[] = [
    {
      key: 'estimate_number',
      title: 'Estimate #',
      sortable: true,
      render: (_, estimate) => (
        <PrimaryLinkCell 
          text={estimate.estimate_number}
          onClick={() => navigate(`/finance/estimates/${estimate.estimate_id}`)}
        />
      )
    },
    {
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (_, estimate) => (
        <BadgeCell 
          value={estimate.status_display} 
          variant={getStatusBadgeVariant(estimate.status)}
        />
      )
    },
    {
      key: 'account_name',
      title: 'Account',
      sortable: true,
      render: (value) => (
        <span className="text-gray-900 dark:text-gray-100 font-medium">{value}</span>
      )
    },
    {
      key: 'contact_name',
      title: 'Contact',
      sortable: true,
      render: (value) => value ? (
        <span className="text-gray-900 dark:text-gray-100">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'deal_name',
      title: 'Deal',
      sortable: true,
      render: (value) => value ? (
        <span className="text-gray-900 dark:text-gray-100">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'po_number',
      title: 'PO Number',
      sortable: true,
      render: (value) => value ? (
        <BadgeCell value={value} variant="gray" />
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'owner_name',
      title: 'Owner',
      sortable: true,
      render: (value) => value ? (
        <span className="text-gray-900 dark:text-gray-100">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">Unassigned</span>
      )
    },
    {
      key: 'line_items_count',
      title: 'Items',
      sortable: true,
      render: (value) => (
        <span className="text-gray-900 dark:text-gray-100 font-medium">{value}</span>
      )
    },
    {
      key: 'subtotal',
      title: 'Subtotal',
      sortable: true,
      render: (value) => <ValueCell value={parseFloat(value)} currency="USD" />
    },
    {
      key: 'total_amount',
      title: 'Total',
      sortable: true,
      render: (value) => <ValueCell value={parseFloat(value)} currency="USD" />
    },
    {
      key: 'estimate_date',
      title: 'Estimate Date',
      sortable: true,
      render: (value) => <DateCell value={value} />
    },
    {
      key: 'valid_until',
      title: 'Valid Until',
      sortable: true,
      render: (value, estimate) => {
        const isExpired = new Date(value) < new Date() && estimate.status !== 'accepted'
        return (
          <span className={isExpired ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            <DateCell value={value} />
          </span>
        )
      }
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => <DateCell value={value} />
    }
  ]
  
  // Actions configuration
  const actions: ActionConfig<EstimateListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (estimate) => navigate(`/finance/estimates/${estimate.estimate_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (estimate) => handleEditEstimate(estimate),
      variant: 'default',
      hidden: () => !canManageEstimates
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      onClick: (estimate) => handleDuplicate(estimate.estimate_id, estimate.estimate_number),
      variant: 'default',
      hidden: () => !canManageEstimates
    },
    {
      id: 'convert-to-sales-order',
      label: 'Convert to Sales Order',
      onClick: (estimate) => handleConvertToSalesOrder(estimate.estimate_id, estimate.estimate_number, estimate.status),
      variant: 'default',
      hidden: (estimate) => !canManageEstimates || estimate.status !== 'accepted'
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (estimate) => handleDelete(estimate.estimate_id, estimate.estimate_number),
      variant: 'danger',
      hidden: () => !canManageEstimates
    }
  ]
  
  // Column visibility
  const { columnVisibility, updateColumnVisibility } = useColumnVisibility(columns, {
    storageKey: 'estimates-list',
    defaultVisible: ['estimate_number', 'status', 'account_name', 'contact_name', 'po_number', 'line_items_count', 'total_amount', 'valid_until', 'created_at']
  })
  
  // Permission check
  if (!canViewEstimates) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view estimates.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Controls */}
      <TableControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search estimates by number, account, PO number, contact, or deal..."
        filters={
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredEstimates.length} of {estimatesData?.count || 0} estimates
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ColumnManager
              columns={columns}
              visibleColumns={columnVisibility}
              onVisibilityChange={updateColumnVisibility}
            />
            {selectedEstimates.length > 0 && canManageEstimates && (
              <button
                onClick={handleBulkDelete}
                disabled={deleteEstimate.isPending}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Delete Selected ({selectedEstimates.length})
              </button>
            )}
            {canManageEstimates && (
              <button
                onClick={handleNewEstimate}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Estimate
              </button>
            )}
          </div>
        }
      />
      
      {/* DataTable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <DataTable
          data={filteredEstimates}
          columns={columns}
          actions={actions}
          keyExtractor={(estimate) => estimate.estimate_id.toString()}
          loading={isLoading}
          error={error ? String(error) : undefined}
          searchTerm={searchTerm}
          showSelection={canManageEstimates}
          onSelectionChange={setSelectedEstimates}
          columnVisibility={columnVisibility}
          emptyMessage="No estimates found. Try adjusting your search or create your first estimate."
        />
        
        {/* Pagination */}
        {estimatesData && estimatesData.count > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, estimatesData.count)} of {estimatesData.count} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!estimatesData.next}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Side Panel */}
      <EstimateFormSidePanel
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedEstimate(undefined)
        }}
        estimate={selectedEstimate}
        onSuccess={() => {
          setModalOpen(false)
          setSelectedEstimate(undefined)
          refetch()
        }}
      />
    </div>
  )
}