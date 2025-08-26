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
import { useVendors, useDeleteVendor, type VendorListItem } from '../api'
import { VendorFormSidePanel } from '../components/VendorFormSidePanel'
import { VendorFilters } from '../components/VendorFilters'

export const VendorsListPage: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [filters, setFilters] = useState<Record<string, string>>({})
  const [selectedVendors, setSelectedVendors] = useState<VendorListItem[]>([])
  const [isCreatePanelOpen, setCreatePanelOpen] = useState(false)
  const [isEditPanelOpen, setEditPanelOpen] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState<VendorListItem | undefined>(undefined)
  
  // Hooks
  const navigate = useNavigate()
  const permissions = usePermissions()
  const { data: vendorsData, isLoading, error, refetch } = useVendors(currentPage, pageSize, debouncedSearchTerm, filters)
  const deleteVendor = useDeleteVendor()

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
      setCurrentPage(1) // Reset to first page when search changes
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])
  
  // Data processing
  const vendors = vendorsData?.results || []
  
  // Permission checks
  const canManageVendors = permissions.hasPermission('manage_customers') || permissions.hasPermission('all')
  const canViewVendors = canManageVendors || permissions.hasPermission('view_customers')
  
  // Export configuration
  const exportColumns: ExportColumn<VendorListItem>[] = [
    { key: 'vendor_number', label: 'Vendor Number' },
    { key: 'display_name', label: 'Display Name' },
    { key: 'company_name', label: 'Company', formatter: (value) => value || '' },
    { key: 'customer_type', label: 'Type', formatter: (value) => value.charAt(0).toUpperCase() + value.slice(1) },
    { key: 'status', label: 'Status', formatter: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '' },
    { key: 'currency', label: 'Currency' },
    { key: 'payment_terms', label: 'Payment Terms', formatter: (value) => value.replace(/(\d+)/, ' $1').replace(/^./, str => str.toUpperCase()) },
    { key: 'contact_name', label: 'Contact Name', formatter: (value) => value || '' },
    { key: 'email', label: 'Email', formatter: (value) => value || '' },
    { key: 'phone', label: 'Phone', formatter: (value) => value || '' },
    { key: 'payable_account_name', label: 'Payable Account', formatter: (value) => value || '' },
    { key: 'owner_name', label: 'Owner', formatter: (value) => value || '' },
    { key: 'customer_since', label: 'Vendor Since', formatter: (value) => formatDateForExport(value) },
    { key: 'last_transaction_date', label: 'Last Transaction', formatter: (value) => value ? formatDateForExport(value) : '' },
    { key: 'created_at', label: 'Created Date', formatter: (value) => formatDateForExport(value) }
  ]
  
  // Handlers
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteVendor.mutateAsync(id)
        alert('Vendor deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting vendor: ${errorMessage}`)
      }
    }
  }
  
  const handleBulkDelete = async () => {
    if (selectedVendors.length === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedVendors.length} vendor(s)?`
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(
          selectedVendors.map(vendor => deleteVendor.mutateAsync(vendor.contact_id))
        )
        alert(`${selectedVendors.length} vendor(s) deleted successfully`)
        setSelectedVendors([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting vendors: ${errorMessage}`)
      }
    }
  }
  
  const handleNewVendor = () => {
    setCreatePanelOpen(true)
  }
  
  const handleEditVendor = (vendor: VendorListItem) => {
    setSelectedVendor(vendor)
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
  const getStatusBadgeVariant = (status?: string) => {
    switch (status) {
      case 'active':
        return 'green'
      case 'inactive':
        return 'gray'
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
  const columns: ColumnConfig<VendorListItem>[] = [
    {
      key: 'vendor_number',
      title: 'Vendor #',
      sortable: true,
      render: (value) => value ? (
        <span className="font-mono text-sm text-gray-900 dark:text-gray-100">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">-</span>
      )
    },
    {
      key: 'display_name',
      title: 'Vendor Name',
      sortable: true,
      render: (_, vendor) => (
        <PrimaryLinkCell 
          text={vendor.display_name}
          onClick={() => navigate(`/finance/vendors/${vendor.contact_id}`)}
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
      key: 'status',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Active'} 
          variant={getStatusBadgeVariant(value || 'active')}
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
      key: 'contact_name',
      title: 'Contact',
      sortable: true,
      render: (value, vendor) => {
        const name = value || vendor.primary_contact_name || 
                    (vendor.first_name || vendor.last_name ? 
                      `${vendor.first_name || ''} ${vendor.last_name || ''}`.trim() : null)
        return name ? (
          <span className="text-gray-900 dark:text-gray-100">{name}</span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
        )
      }
    },
    {
      key: 'payable_account_name',
      title: 'Payable Account',
      sortable: false,
      render: (value) => value ? (
        <span className="text-gray-900 dark:text-gray-100">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">Not Set</span>
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
      title: 'Vendor Since',
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
  const actions: ActionConfig<VendorListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (vendor) => navigate(`/finance/vendors/${vendor.contact_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (vendor) => handleEditVendor(vendor),
      variant: 'default',
      hidden: () => !canManageVendors
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (vendor) => handleDelete(vendor.contact_id, vendor.display_name),
      variant: 'danger',
      hidden: () => !canManageVendors
    }
  ]
  
  // Column visibility management
  const {
    columnVisibility,
    updateColumnVisibility,
    resetToDefault
  } = useColumnVisibility(columns, {
    storageKey: 'vendors-list',
    defaultVisible: ['vendor_number', 'display_name', 'company_name', 'customer_type', 'status', 'currency', 'payment_terms', 'contact_name', 'owner_name', 'created_at']
  })
  
  // Permission check
  if (!canViewVendors) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view vendors.
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
        searchPlaceholder="Search vendors by name, company, contact, or VAT number..."
        filters={
          <div className="flex items-center gap-4">
            <VendorFilters
              filters={filters}
              onFilterChange={handleFilterChange}
              onClearFilters={handleClearFilters}
            />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {vendors.length} of {vendorsData?.count || 0} vendors
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
              data={vendors}
              columns={exportColumns}
              filename={`vendors_${new Date().toISOString().slice(0, 10)}.csv`}
              searchTerm={searchTerm}
            />
            {selectedVendors.length > 0 && canManageVendors && (
              <button
                onClick={handleBulkDelete}
                disabled={deleteVendor.isPending}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
              >
                Delete Selected ({selectedVendors.length})
              </button>
            )}
            <button
              onClick={handleNewVendor}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap"
            >
              + New Vendor
            </button>
          </div>
        }
      />
      
      {/* DataTable */}
      <DataTable
        data={vendors}
        columns={columns}
        actions={actions}
        keyExtractor={(vendor) => vendor.contact_id.toString()}
        loading={isLoading}
        error={error ? String(error) : undefined}
        searchTerm={debouncedSearchTerm}
        showSelection={canManageVendors}
        onSelectionChange={setSelectedVendors}
        columnVisibility={columnVisibility}
        emptyMessage="No vendors found. Try adjusting your search or create your first vendor."
      />
      
      {/* Create Side Panel */}
      <VendorFormSidePanel
        isOpen={isCreatePanelOpen}
        onClose={() => setCreatePanelOpen(false)}
        onSuccess={() => {
          setCreatePanelOpen(false)
          refetch()
        }}
      />

      {/* Edit Side Panel */}
      <VendorFormSidePanel
        isOpen={isEditPanelOpen}
        onClose={() => {
          setEditPanelOpen(false)
          setSelectedVendor(undefined)
        }}
        vendor={selectedVendor ? {
          ...selectedVendor,
          account: selectedVendor.account || undefined,
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
          owner: selectedVendor.owner || undefined,
          notes: '',
          created_by: undefined,
          created_by_name: '',
          updated_by: undefined,
          updated_by_name: ''
        } : undefined}
        onSuccess={() => {
          setEditPanelOpen(false)
          setSelectedVendor(undefined)
          refetch()
        }}
      />
    </div>
  )
}