import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, FileText, Package, Truck, CheckCircle, XCircle } from 'lucide-react'
import { 
  DataTable, 
  TableControls,
  ColumnManager,
  PrimaryLinkCell,
  BadgeCell,
  DateCell,
  ValueCell,
  ExportButton,
  useColumnVisibility,
  type ColumnConfig,
  type ActionConfig,
  type ExportColumn,
  formatDateForExport,
  formatCurrencyForExport
} from '@/shared'
import { useSalesOrders, useSalesOrderSummary, useDeleteSalesOrder, SalesOrderListItem } from '../api'
import { SalesOrderFormSidePanel } from '../components/SalesOrderFormSidePanel'
import { usePermissions } from '@/core/auth/usePermissions'

export const SalesOrdersListPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSalesOrders, setSelectedSalesOrders] = useState<SalesOrderListItem[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // Hooks
  const permissions = usePermissions()
  const { data: ordersData, isLoading, error, refetch } = useSalesOrders(currentPage, pageSize)
  const { data: summaryData } = useSalesOrderSummary()
  const deleteSalesOrder = useDeleteSalesOrder()
  
  // Data processing
  const orders = ordersData?.results || []
  const filteredOrders = orders.filter(order =>
    order.sales_order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.account_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (order.customer_name && order.customer_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.reference_number && order.reference_number.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (order.po_number && order.po_number.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  // Permission checks
  const canManageSalesOrders = permissions.hasPermission('manage_opportunities') || permissions.hasPermission('all')
  const canViewSalesOrders = canManageSalesOrders || permissions.hasPermission('view_customers')

  // Export configuration
  const exportColumns: ExportColumn<SalesOrderListItem>[] = [
    { key: 'sales_order_number', label: 'Order Number' },
    { key: 'reference_number', label: 'Reference', formatter: (value) => value || '' },
    { key: 'account_name', label: 'Account' },
    { key: 'customer_name', label: 'Customer', formatter: (value) => value || '' },
    { key: 'po_number', label: 'PO Number', formatter: (value) => value || '' },
    { key: 'status_display', label: 'Status' },
    { key: 'payment_terms_display', label: 'Payment Terms' },
    { key: 'delivery_method_display', label: 'Delivery Method' },
    { key: 'subtotal', label: 'Subtotal', formatter: (value) => formatCurrencyForExport(parseFloat(value)) },
    { key: 'total_amount', label: 'Total', formatter: (value) => formatCurrencyForExport(parseFloat(value)) },
    { key: 'sales_order_date', label: 'Order Date', formatter: (value) => formatDateForExport(value) },
    { key: 'expected_shipment_date', label: 'Expected Ship Date', formatter: (value) => value ? formatDateForExport(value) : '' },
    { key: 'owner_name', label: 'Owner', formatter: (value) => value || '' },
    { key: 'created_at', label: 'Created Date', formatter: (value) => formatDateForExport(value) }
  ]

  const handleCreateSuccess = () => {
    setIsCreateOpen(false)
    refetch()
  }

  const handleDelete = async (id: number, orderNumber: string) => {
    if (window.confirm(`Are you sure you want to delete sales order ${orderNumber}?`)) {
      try {
        await deleteSalesOrder.mutateAsync(id)
        alert('Sales order deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting sales order: ${errorMessage}`)
      }
    }
  }
  
  const handleBulkDelete = async () => {
    if (selectedSalesOrders.length === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedSalesOrders.length} sales order(s)?`
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(
          selectedSalesOrders.map(order => deleteSalesOrder.mutateAsync(order.sales_order_id))
        )
        alert(`${selectedSalesOrders.length} sales order(s) deleted successfully`)
        setSelectedSalesOrders([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting sales orders: ${errorMessage}`)
      }
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft': return 'gray'
      case 'confirmed': return 'blue'
      case 'in_progress': return 'yellow'
      case 'shipped': return 'purple'
      case 'delivered': return 'green'
      case 'cancelled': return 'red'
      default: return 'gray'
    }
  }

  // Column configuration
  const columns: ColumnConfig<SalesOrderListItem>[] = [
    {
      key: 'sales_order_number',
      title: 'Order #',
      sortable: true,
      render: (_, order) => (
        <PrimaryLinkCell
          text={order.sales_order_number}
          onClick={() => navigate(`/finance/sales-orders/${order.sales_order_id}`)}
        />
      ),
    },
    {
      key: 'reference_number',
      title: 'Reference',
      sortable: true,
    },
    {
      key: 'account_name',
      title: 'Account',
      sortable: true,
    },
    {
      key: 'customer_name',
      title: 'Customer',
      sortable: true,
    },
    {
      key: 'status_display',
      title: 'Status',
      sortable: true,
      render: (_, order) => (
        <BadgeCell
          value={order.status_display}
          variant={getStatusBadgeVariant(order.status)}
        />
      ),
    },
    {
      key: 'total_amount',
      title: 'Total',
      sortable: true,
      align: 'left' as const,
      render: (value) => <ValueCell value={parseFloat(value)} currency="USD" />,
    },
    {
      key: 'sales_order_date',
      title: 'Order Date',
      sortable: true,
      render: (value) => <DateCell value={value} />,
    },
    {
      key: 'expected_shipment_date',
      title: 'Ship Date',
      sortable: true,
      render: (value) => value ? <DateCell value={value} /> : '-',
    },
  ]
  
  // Actions configuration
  const actions: ActionConfig<SalesOrderListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (order) => navigate(`/finance/sales-orders/${order.sales_order_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (order) => navigate(`/finance/sales-orders/${order.sales_order_id}/edit`),
      variant: 'default',
      hidden: () => !canManageSalesOrders
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (order) => handleDelete(order.sales_order_id, order.sales_order_number),
      variant: 'danger',
      hidden: () => !canManageSalesOrders
    },
  ]
  
  // Column visibility
  const { columnVisibility, updateColumnVisibility } = useColumnVisibility(columns, {
    storageKey: 'sales-orders-list',
    defaultVisible: ['sales_order_number', 'reference_number', 'account_name', 'status_display', 'total_amount', 'sales_order_date', 'expected_shipment_date']
  })
  
  // Permission check
  if (!canViewSalesOrders) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view sales orders.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Table Controls */}
      <TableControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search sales orders by number, reference, account, customer, or PO..."
        filters={
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredOrders.length} of {ordersData?.count || 0} sales orders
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ColumnManager
              columns={columns}
              visibleColumns={columnVisibility}
              onVisibilityChange={updateColumnVisibility}
            />
            <ExportButton
              data={filteredOrders}
              columns={exportColumns}
              filename={`sales_orders_${new Date().toISOString().slice(0, 10)}.csv`}
              searchTerm={searchTerm}
            />
            {selectedSalesOrders.length > 0 && canManageSalesOrders && (
              <button
                onClick={handleBulkDelete}
                disabled={deleteSalesOrder.isPending}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Delete Selected ({selectedSalesOrders.length})
              </button>
            )}
            {canManageSalesOrders && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Sales Order
              </button>
            )}
          </div>
        }
      />

      {/* DataTable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <DataTable
          data={filteredOrders}
          columns={columns}
          actions={actions}
          keyExtractor={(order) => order.sales_order_id.toString()}
          loading={isLoading}
          error={error ? String(error) : undefined}
          searchTerm={searchTerm}
          showSelection={canManageSalesOrders}
          onSelectionChange={setSelectedSalesOrders}
          columnVisibility={columnVisibility}
          emptyMessage="No sales orders found. Try adjusting your search or create your first sales order."
        />
        
        {/* Pagination */}
        {ordersData && ordersData.count > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, ordersData.count)} of {ordersData.count} results
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
                  disabled={!ordersData.next}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Form */}
      <SalesOrderFormSidePanel
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}