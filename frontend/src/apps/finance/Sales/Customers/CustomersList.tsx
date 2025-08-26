import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowUpDown, Download, Upload } from 'lucide-react'
import { DataTable, type TableColumn, type TableRow } from '@/finance-inventory-shared/table/DataTable'
import { NewButton } from '@/finance-inventory-shared/buttons/NewButton'
import { MoreActionsButton, createSortSubmenuItems, type SortableColumn, type SortState } from '@/finance-inventory-shared/buttons/MoreActionsButton'

interface Customer extends TableRow {
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

export const CustomersList: React.FC = () => {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [sortColumn, setSortColumn] = useState<string>('display_name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const [selectedCustomers, setSelectedCustomers] = useState<(string | number)[]>([])
  const [tableColumns, setTableColumns] = useState<TableColumn[]>([])

  // Initialize table columns
  useEffect(() => {
    setTableColumns(columns);
  }, []);

  // Mock data for testing
  useEffect(() => {
    const mockCustomers: Customer[] = [
      {
        id: 1,
        contact_id: 1,
        customer_number: 'CUST-0001',
        contact_type: 'customer',
        display_name: 'ABC Corp',
        company_name: 'ABC Corporation Ltd',
        website: 'https://abccorp.com',
        customer_type: 'business',
        customer_status: 'active',
        currency: 'USD',
        payment_terms: 'net30',
        credit_limit: 50000,
        outstanding_receivable_amount: 15000,
        vat_treatment: 'uk',
        vat_registration_number: 'GB123456789',
        primary_contact_info: {
          name: 'John Smith',
          email: 'john@abccorp.com',
          phone: '+1-555-0123',
          mobile: '+1-555-0124',
          designation: 'CEO',
          department: 'Executive'
        },
        owner_name: 'Sales Rep 1',
        owner: 1,
        receivable_account_name: 'Accounts Receivable',
        customer_since: '2023-01-15',
        last_transaction_date: '2024-01-10',
        source: 'finance',
        tags: ['VIP', 'Enterprise'],
        portal_status: 'enabled',
        portal_language: 'en',
        billing_address: {
          attention: 'John Smith',
          street: '123 Business Ave',
          city: 'New York',
          state_province: 'NY',
          zip_postal_code: '10001',
          country: 'United States',
          phone: '+1-555-0123'
        },
        shipping_address: {
          attention: 'John Smith',
          street: '123 Business Ave',
          city: 'New York',
          state_province: 'NY',
          zip_postal_code: '10001',
          country: 'United States',
          phone: '+1-555-0123'
        },
        receivables_balance: '15000.00',
        payables_balance: '0.00',
        is_linked: false,
        net_balance: '15000.00',
        created_at: '2023-01-15T10:30:00Z',
        updated_at: '2024-01-10T15:45:00Z'
      },
      {
        id: 2,
        contact_id: 2,
        customer_number: 'CUST-0002',
        contact_type: 'customer',
        display_name: 'Tech Solutions Inc',
        company_name: 'Tech Solutions Inc',
        website: 'https://techsolutions.com',
        customer_type: 'business',
        customer_status: 'active',
        currency: 'EUR',
        payment_terms: 'net15',
        credit_limit: 25000,
        outstanding_receivable_amount: 8500,
        vat_treatment: 'overseas',
        primary_contact_info: {
          name: 'Jane Doe',
          email: 'jane@techsolutions.com',
          phone: '+44-20-7946-0958',
          designation: 'CTO',
          department: 'Technology'
        },
        owner_name: 'Sales Rep 2',
        owner: 2,
        receivable_account_name: 'Accounts Receivable',
        customer_since: '2023-03-20',
        last_transaction_date: '2024-01-08',
        source: 'crm',
        tags: ['Tech', 'Startup'],
        portal_status: 'disabled',
        portal_language: 'en',
        billing_address: {
          attention: 'Jane Doe',
          street: '456 Tech Street',
          city: 'London',
          state_province: 'England',
          zip_postal_code: 'SW1A 1AA',
          country: 'United Kingdom',
          phone: '+44-20-7946-0958'
        },
        receivables_balance: '8500.00',
        payables_balance: '0.00',
        is_linked: true,
        linked_entity_id: 3,
        linked_entity_name: 'Tech Solutions Vendor',
        linked_entity_number: 'VEND-0001',
        net_balance: '8500.00',
        created_at: '2023-03-20T14:20:00Z',
        updated_at: '2024-01-08T09:15:00Z'
      }
    ]
    setCustomers(mockCustomers)
  }, [])

  const columns: TableColumn[] = [
    {
      key: 'display_name',
      label: 'Name',
      sortable: true,
      locked: true,
      visible: true,
      order: 0,
      render: (value) => (
        <span className="font-medium text-blue-600 dark:text-blue-400">{value}</span>
      )
    },
    {
      key: 'company_name',
      label: 'Company Name',
      sortable: true,
      visible: true,
      order: 1,
      render: (value) => value || 'N/A'
    },
    {
      key: 'primary_contact_email',
      label: 'Email',
      sortable: true,
      visible: true,
      order: 2,
      render: (value, row) => {
        const email = row.primary_contact_info?.email || value;
        return email || 'N/A'
      }
    },
    {
      key: 'primary_contact_phone',
      label: 'Phone',
      sortable: true,
      visible: true,
      order: 3,
      render: (value, row) => {
        const phone = row.primary_contact_info?.phone || value;
        return phone || 'N/A'
      }
    },
    {
      key: 'receivables_balance_bcy',
      label: 'Receivables (BCY)',
      sortable: true,
      visible: true,
      order: 4,
      render: (value, row) => parseFloat(row.receivables_balance).toLocaleString()
    },
    {
      key: 'unused_credits_bcy',
      label: 'Unused Credits (BCY)',
      sortable: true,
      visible: true,
      order: 5,
      render: (value, row) => (row.outstanding_receivable_amount * 0.1).toLocaleString()
    },
    {
      key: 'receivables_balance',
      label: 'Receivables',
      sortable: true,
      visible: true,
      order: 6,
      render: (value, row) => `${row.currency} ${parseFloat(value).toLocaleString()}`
    },
    {
      key: 'unused_credits',
      label: 'Unused Credits',
      sortable: true,
      visible: true,
      order: 7,
      render: (value, row) => `${row.currency} ${(row.outstanding_receivable_amount * 0.1).toLocaleString()}`
    },
    {
      key: 'source',
      label: 'Source',
      sortable: true,
      visible: false,
      order: 8,
      render: (value) => value.toUpperCase()
    },
    {
      key: 'primary_contact_first_name',
      label: 'First Name',
      sortable: true,
      visible: false,
      order: 9,
      render: (value, row) => {
        const firstName = row.primary_contact_info?.name?.split(' ')[0] || value;
        return firstName || 'N/A'
      }
    },
    {
      key: 'primary_contact_last_name',
      label: 'Last Name',
      sortable: true,
      visible: false,
      order: 10,
      render: (value, row) => {
        const lastName = row.primary_contact_info?.name?.split(' ').slice(1).join(' ') || value;
        return lastName || 'N/A'
      }
    },
    {
      key: 'primary_contact_mobile',
      label: 'Mobile Phone',
      sortable: true,
      visible: false,
      order: 11,
      render: (value, row) => {
        const mobile = row.primary_contact_info?.mobile || value;
        return mobile || 'N/A'
      }
    },
    {
      key: 'payment_terms',
      label: 'Payment Terms',
      sortable: true,
      visible: false,
      order: 12,
      render: (value) => value.replace(/(\d+)/, ' $1').replace(/^./, str => str.toUpperCase())
    },
    {
      key: 'customer_status',
      label: 'Status',
      sortable: true,
      visible: false,
      order: 13,
      render: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    {
      key: 'vat_treatment',
      label: 'VAT Treatment',
      sortable: true,
      visible: false,
      order: 14,
      render: (value) => value ? value.toUpperCase() : 'N/A'
    },
    {
      key: 'website',
      label: 'Website',
      sortable: true,
      visible: false,
      order: 15,
      render: (value) => value ? value.replace(/^https?:\/\//, '') : 'N/A'
    }
  ]

  const handleSort = (column: string, direction: 'asc' | 'desc') => {
    setSortColumn(column)
    setSortDirection(direction)
    
    const sortedCustomers = [...customers].sort((a, b) => {
      const aValue = a[column]
      const bValue = b[column]
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue)
      }
      
      return direction === 'asc' 
        ? (aValue < bValue ? -1 : 1)
        : (aValue > bValue ? -1 : 1)
    })
    
    setCustomers(sortedCustomers)
  }

  const handleRowAction = (row: TableRow, action: string) => {
    console.log('Row action:', action, row)
    // Handle actions like edit, delete, etc.
  }

  const handleNewCustomer = () => {
    navigate('/finance/sales/customers/new')
  }

  const handleColumnsChange = (updatedColumns: TableColumn[]) => {
    setTableColumns(updatedColumns);
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
                Customers
              </h1>
            </div>

            {/* Right side - Actions */}
            <div className="flex items-center gap-3">
              {/* New button */}
              <NewButton 
                onClick={handleNewCustomer}
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
          columns={tableColumns}
          data={customers}
          onSort={handleSort}
          onRowSelect={setSelectedCustomers}
          onRowAction={handleRowAction}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          selectedRowIds={selectedCustomers}
          showCheckboxes={true}
          showActions={true}
          emptyMessage="No customers found"
          enableColumnCustomization={true}
          onColumnsChange={handleColumnsChange}
        />
      </div>
    </div>
  )
}