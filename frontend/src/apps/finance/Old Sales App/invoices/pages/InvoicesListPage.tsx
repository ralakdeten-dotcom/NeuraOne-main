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
  ExportButton,
  useColumnVisibility,
  type ColumnConfig, 
  type ActionConfig,
  type ExportColumn,
  formatDateForExport,
  formatCurrencyForExport
} from '@/shared'
import { usePermissions } from '@/core/auth/usePermissions'
import { 
  useInvoices, 
  useDeleteInvoice, 
  useDuplicateInvoice, 
  useMarkInvoiceSent,
  useMarkInvoicePaid,
  useCancelInvoice,
  InvoiceListItem 
} from '../api'
import PaymentStatusBadge from '../components/PaymentStatusBadge'
import { InvoiceFormSidePanel } from '../components/InvoiceFormSidePanel'

export const InvoicesListPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoices, setSelectedInvoices] = useState<InvoiceListItem[]>([])
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  
  // Hooks
  const permissions = usePermissions()
  const { data: invoicesData, isLoading, error, refetch } = useInvoices(currentPage, pageSize)
  const deleteInvoice = useDeleteInvoice()
  const duplicateInvoice = useDuplicateInvoice()
  const markSent = useMarkInvoiceSent()
  const markPaid = useMarkInvoicePaid()
  const cancelInvoice = useCancelInvoice()
  
  // Data processing
  const invoices = invoicesData?.results || []
  const filteredInvoices = invoices.filter(invoice => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      (invoice.invoice_number && invoice.invoice_number.toLowerCase().includes(search)) ||
      (invoice.account_name && invoice.account_name.toLowerCase().includes(search)) ||
      (invoice.po_number && invoice.po_number.toLowerCase().includes(search)) ||
      (invoice.contact_name && invoice.contact_name.toLowerCase().includes(search)) ||
      (invoice.deal_name && invoice.deal_name.toLowerCase().includes(search))
    )
  })
  
  // Permission checks
  const canManageInvoices = permissions.hasPermission('manage_opportunities') || permissions.hasPermission('all')
  const canViewInvoices = canManageInvoices || permissions.hasPermission('view_customers')
  
  // Export configuration
  const exportColumns: ExportColumn<InvoiceListItem>[] = [
    { key: 'invoice_number', label: 'Invoice Number' },
    { key: 'account_name', label: 'Account' },
    { key: 'contact_name', label: 'Contact', formatter: (value) => value || '' },
    { key: 'po_number', label: 'PO Number', formatter: (value) => value || '' },
    { key: 'status', label: 'Status' },
    { key: 'payment_terms_display', label: 'Payment Terms' },
    { key: 'subtotal', label: 'Subtotal', formatter: (value) => formatCurrencyForExport(parseFloat(value)) },
    { key: 'total_amount', label: 'Total', formatter: (value) => formatCurrencyForExport(parseFloat(value)) },
    { key: 'amount_paid', label: 'Amount Paid', formatter: (value) => formatCurrencyForExport(parseFloat(value)) },
    { key: 'amount_due', label: 'Amount Due', formatter: (value) => formatCurrencyForExport(parseFloat(value)) },
    { key: 'invoice_date', label: 'Invoice Date', formatter: (value) => formatDateForExport(value) },
    { key: 'due_date', label: 'Due Date', formatter: (value) => formatDateForExport(value) },
    { key: 'days_overdue', label: 'Days Overdue', formatter: (value) => value > 0 ? value.toString() : '' },
    { key: 'owner_name', label: 'Owner', formatter: (value) => value || '' },
    { key: 'created_at', label: 'Created Date', formatter: (value) => formatDateForExport(value) }
  ]
  
  const handleCreateSuccess = () => {
    setIsCreateOpen(false)
    refetch()
  }
  
  // Handlers
  const handleDelete = async (id: number, invoiceNumber: string) => {
    if (window.confirm(`Are you sure you want to delete invoice "${invoiceNumber}"?`)) {
      try {
        await deleteInvoice.mutateAsync(id)
        alert('Invoice deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting invoice: ${errorMessage}`)
      }
    }
  }
  
  const handleDuplicate = async (id: number, invoiceNumber: string) => {
    try {
      await duplicateInvoice.mutateAsync(id)
      alert(`Invoice "${invoiceNumber}" duplicated successfully`)
      refetch()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
      alert(`Error duplicating invoice: ${errorMessage}`)
    }
  }

  const handleMarkSent = async (id: number, invoiceNumber: string) => {
    try {
      await markSent.mutateAsync(id)
      alert(`Invoice "${invoiceNumber}" marked as sent`)
      refetch()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
      alert(`Error marking invoice as sent: ${errorMessage}`)
    }
  }

  const handleMarkPaid = async (id: number, invoiceNumber: string) => {
    try {
      await markPaid.mutateAsync(id)
      alert(`Invoice "${invoiceNumber}" marked as paid`)
      refetch()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
      alert(`Error marking invoice as paid: ${errorMessage}`)
    }
  }

  const handleCancel = async (id: number, invoiceNumber: string) => {
    if (window.confirm(`Are you sure you want to cancel invoice "${invoiceNumber}"?`)) {
      try {
        await cancelInvoice.mutateAsync(id)
        alert(`Invoice "${invoiceNumber}" cancelled`)
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error cancelling invoice: ${errorMessage}`)
      }
    }
  }
  
  const handleBulkDelete = async () => {
    if (selectedInvoices.length === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedInvoices.length} invoice(s)?`
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(
          selectedInvoices.map(invoice => deleteInvoice.mutateAsync(invoice.invoice_id))
        )
        alert(`${selectedInvoices.length} invoice(s) deleted successfully`)
        setSelectedInvoices([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting invoices: ${errorMessage}`)
      }
    }
  }
  
  // Column configuration
  const columns: ColumnConfig<InvoiceListItem>[] = [
    {
      key: 'invoice_number',
      title: 'Invoice #',
      width: '140px',
      render: (_, invoice) => (
        <PrimaryLinkCell 
          text={invoice.invoice_number}
          onClick={() => navigate(`/finance/invoices/${invoice.invoice_id}`)}
        />
      ),
      sortable: true
    },
    {
      key: 'account_name',
      title: 'Account',
      width: '200px',
      render: (_, invoice) => (
        <span className="font-medium text-gray-900 dark:text-gray-100">
          {invoice.account_name}
        </span>
      ),
      sortable: true
    },
    {
      key: 'contact_name',
      title: 'Contact',
      width: '160px',
      render: (_, invoice) => (
        <span className="text-gray-700 dark:text-gray-300">
          {invoice.contact_name || '-'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'status',
      title: 'Status',
      width: '120px',
      render: (_, invoice) => (
        <PaymentStatusBadge 
          status={invoice.status} 
          isOverdue={invoice.is_overdue}
        />
      ),
      sortable: true
    },
    {
      key: 'total_amount',
      title: 'Total Amount',
      width: '120px',
      render: (_, invoice) => (
        <ValueCell value={parseFloat(invoice.total_amount)} />
      ),
      sortable: true
    },
    {
      key: 'amount_paid',
      title: 'Amount Paid',
      width: '120px',
      render: (_, invoice) => (
        <ValueCell value={parseFloat(invoice.amount_paid)} />
      ),
      sortable: true
    },
    {
      key: 'amount_due',
      title: 'Amount Due',
      width: '120px',
      render: (_, invoice) => (
        <ValueCell 
          value={parseFloat(invoice.amount_due)} 
          className={invoice.is_overdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''}
        />
      ),
      sortable: true
    },
    {
      key: 'invoice_date',
      title: 'Invoice Date',
      width: '120px',
      render: (_, invoice) => <DateCell value={invoice.invoice_date} />,
      sortable: true
    },
    {
      key: 'due_date',
      title: 'Due Date',
      width: '120px',
      render: (_, invoice) => (
        <DateCell 
          value={invoice.due_date} 
          className={invoice.is_overdue ? 'text-red-600 dark:text-red-400 font-semibold' : ''}
        />
      ),
      sortable: true
    },
    {
      key: 'days_overdue',
      title: 'Days Overdue',
      width: '100px',
      render: (_, invoice) => (
        <span className={invoice.days_overdue > 0 ? 'text-red-600 dark:text-red-400 font-semibold' : 'text-gray-500'}>
          {invoice.days_overdue > 0 ? invoice.days_overdue : '-'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'po_number',
      title: 'PO Number',
      width: '120px',
      render: (_, invoice) => (
        <span className="text-gray-700 dark:text-gray-300">
          {invoice.po_number || '-'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'deal_name',
      title: 'Deal',
      width: '160px',
      render: (_, invoice) => (
        <span className="text-gray-700 dark:text-gray-300">
          {invoice.deal_name || '-'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'owner_name',
      title: 'Owner',
      width: '140px',
      render: (_, invoice) => (
        <span className="text-gray-700 dark:text-gray-300">
          {invoice.owner_name || '-'}
        </span>
      ),
      sortable: true
    },
    {
      key: 'line_items_count',
      title: 'Line Items',
      width: '100px',
      render: (_, invoice) => (
        <BadgeCell value={invoice.line_items_count.toString()} variant="gray" />
      ),
      sortable: true
    },
    {
      key: 'payments_count',
      title: 'Payments',
      width: '100px',
      render: (_, invoice) => (
        <BadgeCell value={invoice.payments_count.toString()} variant="blue" />
      ),
      sortable: true
    },
    {
      key: 'created_at',
      title: 'Created',
      width: '120px',
      render: (_, invoice) => <DateCell value={invoice.created_at} />,
      sortable: true
    }
  ]

  // Column visibility management
  const { columnVisibility, updateColumnVisibility } = useColumnVisibility(columns, {
    storageKey: 'invoices-list',
    defaultVisible: ['invoice_number', 'account_name', 'status', 'total_amount', 'amount_due', 'invoice_date', 'due_date']
  })

  // Row actions
  const actions: ActionConfig<InvoiceListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (invoice) => navigate(`/finance/invoices/${invoice.invoice_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (invoice) => navigate(`/finance/invoices/${invoice.invoice_id}/edit`),
      variant: 'default',
      hidden: () => !canManageInvoices
    },
    {
      id: 'mark-sent',
      label: 'Mark as Sent',
      onClick: (invoice) => handleMarkSent(invoice.invoice_id, invoice.invoice_number),
      variant: 'primary',
      hidden: (invoice) => !canManageInvoices || invoice.status !== 'draft'
    },
    {
      id: 'mark-paid',
      label: 'Mark as Paid',
      onClick: (invoice) => handleMarkPaid(invoice.invoice_id, invoice.invoice_number),
      variant: 'success',
      hidden: (invoice) => !canManageInvoices || !['sent', 'partial', 'overdue'].includes(invoice.status)
    },
    {
      id: 'cancel',
      label: 'Cancel',
      onClick: (invoice) => handleCancel(invoice.invoice_id, invoice.invoice_number),
      variant: 'warning',
      hidden: (invoice) => !canManageInvoices || !['draft', 'sent'].includes(invoice.status)
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      onClick: (invoice) => handleDuplicate(invoice.invoice_id, invoice.invoice_number),
      variant: 'default',
      hidden: () => !canManageInvoices
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (invoice) => handleDelete(invoice.invoice_id, invoice.invoice_number),
      variant: 'danger',
      hidden: () => !canManageInvoices
    }
  ]

  // Permission check
  if (!canViewInvoices) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view invoices.
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
        searchPlaceholder="Search invoices by number, account, contact, PO, or deal..."
        filters={
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredInvoices.length} of {invoicesData?.count || 0} invoices
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
              data={filteredInvoices}
              columns={exportColumns}
              filename={`invoices_${new Date().toISOString().slice(0, 10)}.csv`}
              searchTerm={searchTerm}
            />
            {selectedInvoices.length > 0 && canManageInvoices && (
              <button
                onClick={handleBulkDelete}
                disabled={deleteInvoice.isPending}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Delete Selected ({selectedInvoices.length})
              </button>
            )}
            {canManageInvoices && (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Invoice
              </button>
            )}
          </div>
        }
      />

      {/* DataTable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <DataTable
          data={filteredInvoices}
          columns={columns}
          actions={actions}
          keyExtractor={(invoice) => invoice.invoice_id.toString()}
          loading={isLoading}
          error={error ? String(error) : undefined}
          searchTerm={searchTerm}
          showSelection={canManageInvoices}
          onSelectionChange={setSelectedInvoices}
          columnVisibility={columnVisibility}
          emptyMessage="No invoices found. Try adjusting your search or create your first invoice."
        />

        {/* Pagination */}
        {invoicesData && invoicesData.count > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, invoicesData.count)} of {invoicesData.count} results
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
                  disabled={!invoicesData.next}
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
      <InvoiceFormSidePanel
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  )
}

export default InvoicesListPage