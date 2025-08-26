import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  DataTable, 
  TableControls, 
  ColumnManager,
  PrimaryLinkCell,
  BadgeCell,
  DateCell,
  ExportButton,
  useColumnVisibility,
  type ColumnConfig, 
  type ActionConfig,
  type ExportColumn,
  formatDateForExport
} from '@/shared'
import { usePermissions } from '@/core/auth/usePermissions'
import { useCustomers, useDeleteCustomer, type CustomerListItem } from '../api'
import { CustomerFormSidePanel } from '../components/CustomerFormSidePanel'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'
import { CustomerFilters } from '../components/CustomerFilters'

export const CustomersListPage: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedCustomers, setSelectedCustomers] = useState<CustomerListItem[]>([])
  const [isCreatePanelOpen, setCreatePanelOpen] = useState(false)
  const [isEditPanelOpen, setEditPanelOpen] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerListItem | undefined>(undefined)
  
  // Hooks
  const navigate = useNavigate()
  const permissions = usePermissions()
  const { data: customersData, isLoading, error, refetch } = useCustomers(currentPage, pageSize, debouncedSearchTerm, filters)
  const deleteCustomer = useDeleteCustomer()

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])
  
  // Data processing
  const customers = customersData?.results || []
  
  // Permission checks
  const canManageCustomers = permissions.hasPermission('manage_customers') || permissions.hasPermission('all')
  const canViewCustomers = canManageCustomers || permissions.hasPermission('view_customers')
  
  // Export configuration
  const exportColumns: ExportColumn<CustomerListItem>[] = [
    { key: 'display_name', label: 'Display Name' },
    { key: 'company_name', label: 'Company', formatter: (value) => value || '' },
    { key: 'customer_type', label: 'Type', formatter: (value) => value.charAt(0).toUpperCase() + value.slice(1) },
    { key: 'customer_status', label: 'Status', formatter: (value) => value.charAt(0).toUpperCase() + value.slice(1) },
    { key: 'currency', label: 'Currency' },
    { key: 'payment_terms', label: 'Payment Terms', formatter: (value) => value.replace(/(\d+)/, ' $1').replace(/^./, str => str.toUpperCase()) },
    { key: 'primary_contact_name', label: 'Primary Contact', formatter: (value) => value || '' },
    { key: 'primary_contact_email', label: 'Contact Email', formatter: (value) => value || '' },
    { key: 'owner_name', label: 'Owner', formatter: (value) => value || '' },
    { key: 'customer_since', label: 'Customer Since', formatter: (value) => formatDateForExport(value) },
    { key: 'last_transaction_date', label: 'Last Transaction', formatter: (value) => value ? formatDateForExport(value) : '' },
    { key: 'created_at', label: 'Created Date', formatter: (value) => formatDateForExport(value) }
  ]
  
  // Handlers
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteCustomer.mutateAsync(id)
        alert('Customer deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting customer: ${errorMessage}`)
      }
    }
  }
  
  const handleBulkDelete = async () => {
    if (selectedCustomers.length === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedCustomers.length} customer(s)?`
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(
          selectedCustomers.map(customer => deleteCustomer.mutateAsync(customer.contact_id))
        )
        alert(`${selectedCustomers.length} customer(s) deleted successfully`)
        setSelectedCustomers([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting customers: ${errorMessage}`)
      }
    }
  }
  
  const handleNewCustomer = () => {
    setCreatePanelOpen(true)
  }
  
  const handleEditCustomer = (customer: CustomerListItem) => {
    setSelectedCustomer(customer)
    setEditPanelOpen(true)
  }

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
    setCurrentPage(1) // Reset to first page when filters change
  }

  const handleClearFilters = () => {
    setFilters({})
    setCurrentPage(1) // Reset to first page when clearing filters
  }
  
  // Get status badge variant
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'green'
      case 'inactive':
        return 'gray'
      case 'suspended':
        return 'red'
      default:
        return 'gray'
    }
  }
  
  // Get type badge variant
  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'business':
        return 'blue'
      case 'individual':
        return 'purple'
      default:
        return 'gray'
    }
  }
  
  // Column configuration
  const columns: ColumnConfig<CustomerListItem>[] = [
    {
      key: 'display_name',
      title: 'Customer Name',
      sortable: true,
      render: (_, customer) => (
        <PrimaryLinkCell 
          text={customer.display_name}
          onClick={() => navigate(`/finance/customers/${customer.contact_id}`)}
        />
      )
    },
    {
      key: 'company_name',
      title: 'Company',
      sortable: true,
      render: (value) => value ? (
        <span className="text-gray-900 dark:text-gray-100">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'customer_type',
      title: 'Type',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value.charAt(0).toUpperCase() + value.slice(1)} 
          variant={getTypeBadgeVariant(value)}
        />
      )
    },
    {
      key: 'customer_status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value.charAt(0).toUpperCase() + value.slice(1)} 
          variant={getStatusBadgeVariant(value)}
        />
      )
    },
    {
      key: 'currency',
      title: 'Currency',
      sortable: true,
      render: (value) => (
        <BadgeCell value={value} variant="gray" />
      )
    },
    {
      key: 'payment_terms',
      title: 'Payment Terms',
      sortable: true,
      render: (value) => (
        <span className="text-gray-900 dark:text-gray-100">
          {value.replace(/(\d+)/, ' $1').replace(/^./, str => str.toUpperCase())}
        </span>
      )
    },
    {
      key: 'primary_contact_name',
      title: 'Primary Contact',
      sortable: true,
      render: (value) => value ? (
        <span className="text-gray-900 dark:text-gray-100">{value}</span>
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
      key: 'customer_since',
      title: 'Customer Since',
      sortable: true,
      render: (value) => <DateCell value={value} />
    },
    {
      key: 'last_transaction_date',
      title: 'Last Transaction',
      sortable: true,
      render: (value) => value ? (
        <DateCell value={value} />
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">None</span>
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => <DateCell value={value} />
    }
  ]
  
  // Actions configuration
  const actions: ActionConfig<CustomerListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (customer) => navigate(`/finance/customers/${customer.contact_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (customer) => handleEditCustomer(customer),
      variant: 'default',
      hidden: () => !canManageCustomers
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (customer) => handleDelete(customer.contact_id, customer.display_name),
      variant: 'danger',
      hidden: () => !canManageCustomers
    }
  ]
  
  // Column visibility management
  const {
    columnVisibility,
    updateColumnVisibility,
    resetToDefault
  } = useColumnVisibility(columns, {
    storageKey: 'customers-list',
    defaultVisible: ['display_name', 'company_name', 'customer_type', 'customer_status', 'currency', 'payment_terms', 'primary_contact_name', 'owner_name', 'created_at']
  })
  
  // Permission check
  if (!canViewCustomers) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view customers.
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
        searchPlaceholder="Search customers by name, company, contact, or VAT number..."
        filters={
          <div className="flex items-center gap-4">
            <CustomerFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {customers.length} of {customersData?.count || 0} customers
            </span>
          </div>
        }
        actions={
          <div className="flex items-center gap-2 min-w-0">
            <ColumnManager
              columns={columns}
              visibleColumns={columnVisibility}
              onVisibilityChange={updateColumnVisibility}
              onReset={resetToDefault}
            />
            <ExportButton
              data={customers}
              columns={exportColumns}
              filename={`customers_${new Date().toISOString().slice(0, 10)}.csv`}
              searchTerm={searchTerm}
            />
            {selectedCustomers.length > 0 && canManageCustomers && (
              <button
                onClick={handleBulkDelete}
                disabled={deleteCustomer.isPending}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Delete Selected ({selectedCustomers.length})
              </button>
            )}
            <button
              onClick={handleNewCustomer}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              + New Customer
            </button>
          </div>
        }
      />
      
      {/* DataTable */}
      <DataTable
        data={customers}
        columns={columns}
        actions={actions}
        keyExtractor={(customer) => customer.contact_id.toString()}
        loading={isLoading}
        error={error ? String(error) : undefined}
        searchTerm={debouncedSearchTerm}
        showSelection={canManageCustomers}
        onSelectionChange={setSelectedCustomers}
        columnVisibility={columnVisibility}
        emptyMessage="No customers found. Try adjusting your search or create your first customer."
      />
      
      {/* Create Side Panel */}
      <CustomerFormSidePanel
        isOpen={isCreatePanelOpen}
        onClose={() => setCreatePanelOpen(false)}
        onSuccess={() => {
          setCreatePanelOpen(false)
          refetch()
        }}
      />

      {/* Edit Side Panel */}
      <CustomerFormSidePanel
        isOpen={isEditPanelOpen}
        onClose={() => {
          setEditPanelOpen(false)
          setSelectedCustomer(undefined)
        }}
        customer={selectedCustomer ? {
          ...selectedCustomer,
          account: 0, // Will be set properly when loaded
          billing_attention: '',
          billing_street: '',
          billing_city: '',
          billing_state_province: '',
          billing_zip_postal_code: '',
          billing_country: '',
          shipping_attention: '',
          shipping_street: '',
          shipping_city: '',
          shipping_state_province: '',
          shipping_zip_postal_code: '',
          shipping_country: '',
          vat_treatment: 'uk',
          vat_registration_number: '',
          primary_contact: undefined,
          owner: undefined,
          notes: '',
          created_by: undefined,
          created_by_name: '',
          updated_by: undefined,
          updated_by_name: ''
        } : undefined}
        onSuccess={() => {
          setEditPanelOpen(false)
          setSelectedCustomer(undefined)
          refetch()
        }}
      />
    </div>
  )
}