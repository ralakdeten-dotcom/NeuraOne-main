import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowUpDown, Download, Upload } from 'lucide-react'
import axios from '@/core/api/axios'
import { getApiBaseUrl } from '@/utils/tenant'
import { DataTable, type TableColumn, type TableRow } from '@/finance-inventory-shared/table/DataTable'
import { NewButton } from '@/finance-inventory-shared/buttons/NewButton'
import { MoreActionsButton, createSortSubmenuItems, type SortableColumn, type SortState } from '@/finance-inventory-shared/buttons/MoreActionsButton'

interface Vendor extends TableRow {
  id: string | number
  contact_id: number
  customer_number?: string
  vendor_number?: string
  contact_type: 'customer' | 'vendor' | 'customer_and_vendor'
  display_name: string
  company_name?: string
  website?: string
  customer_type: 'business' | 'individual'
  customer_status: 'active' | 'inactive' | 'suspended'
  currency: string
  payment_terms: string
  credit_limit?: number
  outstanding_receivable_amount: number
  vat_treatment?: string
  vat_registration_number?: string
  primary_contact_info?: {
    name?: string
    email?: string
    phone?: string
    mobile?: string
    designation?: string
    department?: string
  }
  owner_name?: string
  owner?: number
  receivable_account?: number
  receivable_account_name?: string
  payable_account?: number
  payable_account_name?: string
  customer_since: string
  last_transaction_date?: string
  source: 'finance' | 'crm'
  tags: string[]
  portal_status: 'enabled' | 'disabled'
  portal_language: string
  billing_address?: {
    attention?: string
    street?: string
    city?: string
    state_province?: string
    state_code?: string
    zip_postal_code?: string
    country?: string
    phone?: string
    fax?: string
  }
  shipping_address?: {
    attention?: string
    street?: string
    city?: string
    state_province?: string
    state_code?: string
    zip_postal_code?: string
    country?: string
    phone?: string
    fax?: string
  }
  receivables_balance: string
  payables_balance: string
  is_linked: boolean
  linked_entity_id?: number
  linked_entity_name?: string
  linked_entity_number?: string
  net_balance: string
  created_at: string
  updated_at: string
}

// API function to fetch vendors
const fetchVendors = async (): Promise<Vendor[]> => {
  const baseUrl = getApiBaseUrl()
  const url = `${baseUrl}/api/finance/vendors/`
  console.log('🚀 Fetching vendors from:', url)
  const response = await axios.get(url)
  console.log('📊 Vendors API Response:', response.data)
  return response.data.results || response.data
}

export const VendorsList: React.FC = () => {
  const navigate = useNavigate()
  const [sortColumn, setSortColumn] = useState<string>('display_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedVendors, setSelectedVendors] = useState<(string | number)[]>([])

  // Fetch vendors using React Query
  const { 
    data: vendors = [], 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['vendors'],
    queryFn: fetchVendors,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })

  // Handle loading and error states
  if (isLoading) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-500 dark:text-gray-400">Loading vendors...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-500">Error loading vendors: {error.message}</div>
      </div>
    )
  }


  const columns: TableColumn[] = [
    {
      key: 'display_name',
      label: 'Name',
      sortable: true,
      locked: true,
      render: (value) => (
        <span className="font-medium text-blue-600 dark:text-blue-400">{value}</span>
      )
    },
    {
      key: 'company_name',
      label: 'Company Name',
      sortable: true,
      render: (value) => value || 'N/A'
    },
    {
      key: 'primary_contact_email',
      label: 'Email',
      sortable: true,
      render: (value, row) => {
        const email = row.primary_contact_info?.email || value;
        return email || 'N/A'
      }
    },
    {
      key: 'primary_contact_phone',
      label: 'Phone',
      sortable: true,
      render: (value, row) => {
        const phone = row.primary_contact_info?.phone || value;
        return phone || 'N/A'
      }
    },
    {
      key: 'payables_balance_bcy',
      label: 'Payables (BCY)',
      sortable: true,
      render: (value, row) => parseFloat(row.payables_balance).toLocaleString()
    },
    {
      key: 'unused_credits_bcy',
      label: 'Unused Credits (BCY)',
      sortable: true,
      render: (value, row) => (row.outstanding_receivable_amount * 0.1).toLocaleString()
    },
    {
      key: 'payables_balance',
      label: 'Payables',
      sortable: true,
      render: (value, row) => `${row.currency} ${parseFloat(row.payables_balance).toLocaleString()}`
    },
    {
      key: 'unused_credits',
      label: 'Unused Credits',
      sortable: true,
      render: (value, row) => `${row.currency} ${(row.outstanding_receivable_amount * 0.1).toLocaleString()}`
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      render: (value) => value.toUpperCase()
    },
    {
      key: 'primary_contact_first_name',
      label: 'First Name',
      sortable: true,
      render: (value, row) => {
        const firstName = row.primary_contact_info?.name?.split(' ')[0] || value;
        return firstName || 'N/A'
      }
    },
    {
      key: 'primary_contact_last_name',
      label: 'Last Name',
      sortable: true,
      render: (value, row) => {
        const lastName = row.primary_contact_info?.name?.split(' ').slice(1).join(' ') || value;
        return lastName || 'N/A'
      }
    },
    {
      key: 'primary_contact_mobile',
      label: 'Mobile Phone',
      sortable: true,
      render: (value, row) => {
        const mobile = row.primary_contact_info?.mobile || value;
        return mobile || 'N/A'
      }
    },
    {
      key: 'payment_terms',
      label: 'Payment Terms',
      sortable: true,
      render: (value) => value.replace(/(\d+)/, ' $1').replace(/^./, str => str.toUpperCase())
    },
    {
      key: 'customer_status',
      label: 'Status',
      sortable: true,
      render: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    {
      key: 'vat_treatment',
      label: 'VAT Treatment',
      sortable: true,
      render: (value) => value ? value.toUpperCase() : 'N/A'
    },
    {
      key: 'website',
      label: 'Website',
      sortable: true,
      render: (value) => value ? value.replace(/^https?:\/\//, '') : 'N/A'
    }
  ]

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column)
    setSortDirection(direction)
    // Note: In a real implementation, you might want to handle sorting server-side
    // For now, we'll rely on the default order from the API
  }

  const handleRowAction = (row: TableRow, action: string) => {
    console.log('Row action:', action, row)
    // Handle actions like edit, delete, etc.
  }

  const handleNewVendor = () => {
    navigate('/finance/purchases/vendors/new')
  }

  // Define sortable columns for more actions menu
  const sortableColumns: SortableColumn[] = [
    { key: 'display_name', label: 'Name' },
    { key: 'company_name', label: 'Company Name' },
    { key: 'primary_contact_email', label: 'Email' },
    { key: 'source', label: 'Source' },
    { key: 'customer_status', label: 'Status' },
    { key: 'vat_treatment', label: 'VAT Treatment' }
  ]

  // Current sort state
  const currentSort: SortState = {
    column: sortColumn,
    direction: sortDirection
  }

  return (
    <div className="flex-1 bg-white dark:bg-gray-900">
      {/* Header Section */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Vendors
              </h1>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* New button */}
              <NewButton 
                onClick={handleNewVendor}
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
                    label: 'Export', 
                    onClick: () => console.log('Export clicked'),
                    icon: <Download className="w-4 h-4" />
                  },
                  { 
                    label: 'Import', 
                    onClick: () => console.log('Import clicked'),
                    icon: <Upload className="w-4 h-4" />
                  },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1">
        <DataTable
          columns={columns}
          data={vendors}
          onSort={handleSort}
          onRowSelect={setSelectedVendors}
          onRowAction={handleRowAction}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          selectedRowIds={selectedVendors}
          showCheckboxes={true}
          showActions={true}
          emptyMessage="No vendors found"
          enableColumnCustomization={true}
        />
      </div>
    </div>
  )
}