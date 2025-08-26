import React, { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, ExternalLink } from 'lucide-react'
import { useCustomer, useDeleteCustomer, useUpdateCustomer, type Customer } from '../api'
import { CustomerFormSidePanel } from '../components/CustomerFormSidePanel'
import { usePermissions } from '@/core/auth/usePermissions'
import { showErrorMessage } from '@/utils/error'
import { TitleBox } from '@/shared/components'
import { TabContainer } from '@/shared/components/templates'
import { AttachmentsTab } from '@/shared/components/attachments'
import { InlineEditableField, InlineEditableSelect } from '@/shared/components/inline-edit'
import { validateEmail as validateEmailUtil, validatePhone as validatePhoneUtil } from '@/shared/utils/validation'

interface CustomerDetailsPageProps {
  customerId: number
}

export const CustomerDetailsPage: React.FC<CustomerDetailsPageProps> = ({ customerId }) => {
  const [activeTab, setActiveTab] = useState('overview')
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  
  const navigate = useNavigate()
  const permissions = usePermissions()
  
  const { data: customer, isLoading, error, refetch } = useCustomer(customerId)
  const deleteCustomer = useDeleteCustomer()
  const updateCustomer = useUpdateCustomer()
  
  const canManageCustomers = permissions.hasPermission('manage_customers') || permissions.hasPermission('all')

  const handleDelete = async () => {
    if (!customer) return
    
    if (window.confirm(`Are you sure you want to delete "${customer.display_name}"?`)) {
      try {
        await deleteCustomer.mutateAsync(customerId)
        alert('Customer deleted successfully')
        navigate('/finance/customers')
      } catch (error: any) {
        showErrorMessage(error, 'deleting customer')
      }
    }
  }

  const handleEdit = () => {
    setIsEditPanelOpen(true)
  }

  const handleFieldUpdate = async (field: string, value: any) => {
    try {
      await updateCustomer.mutateAsync({ id: customerId, data: { [field]: value } })
    } catch (error) {
      console.error(`Failed to update ${field}:`, error)
      throw error
    }
  }

  // Validation adapters
  const validateEmail = (email: string): boolean | string => {
    const result = validateEmailUtil(email)
    return result.isValid || result.error || 'Invalid email'
  }

  const validatePhone = (phone: string): boolean | string => {
    const result = validatePhoneUtil(phone)
    return result.isValid || result.error || 'Invalid phone'
  }

  // Memoize tabs to prevent recreation on every render
  // Must be called before any early returns to follow Rules of Hooks
  const tabs = useMemo(() => [
    { 
      key: 'overview', 
      label: 'Overview', 
      content: (
        <div>
          <style>{`
            .inline-field-horizontal {
              display: flex !important;
              flex-direction: row !important;
              align-items: center !important;
              gap: 1rem !important;
            }
            .inline-field-horizontal > label {
              min-width: 6rem !important;
              flex-shrink: 0 !important;
              margin-bottom: 0 !important;
            }
            .inline-field-horizontal > div:last-child {
              flex: 1 !important;
            }
          `}</style>
          <div className="space-y-8">
            {/* Customer Information Section */}
            <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              <InlineEditableField
                label="Customer Name"
                value={customer?.display_name}
                onSave={(value: string) => handleFieldUpdate('display_name', value)}
                required
                disabled={!canManageCustomers}
                className="inline-field-horizontal"
              />
              
              <div className="inline-field-horizontal">
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[6rem] flex-shrink-0">Customer Owner</label>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{customer?.owner_name || 'Not assigned'}</p>
                </div>
              </div>

              <InlineEditableSelect
                label="Customer Type"
                value={customer?.customer_type}
                onSave={(value: string) => handleFieldUpdate('customer_type', value)}
                options={[
                  { value: 'business', label: 'Business' },
                  { value: 'individual', label: 'Individual' }
                ]}
                disabled={!canManageCustomers}
                className="inline-field-horizontal"
                renderValue={(value) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    value === 'business' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
                      : 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                  }`}>
                    {value?.charAt(0).toUpperCase() + value?.slice(1)}
                  </span>
                )}
              />

              <InlineEditableSelect
                label="Status"
                value={customer?.customer_status}
                onSave={(value: string) => handleFieldUpdate('customer_status', value)}
                options={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'suspended', label: 'Suspended' }
                ]}
                disabled={!canManageCustomers}
                className="inline-field-horizontal"
                renderValue={(value) => (
                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                    value === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : value === 'suspended'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                  }`}>
                    {value?.charAt(0).toUpperCase() + value?.slice(1)}
                  </span>
                )}
              />

              <InlineEditableSelect
                label="Currency"
                value={customer?.currency}
                onSave={(value: string) => handleFieldUpdate('currency', value)}
                options={[
                  { value: 'USD', label: 'USD' },
                  { value: 'EUR', label: 'EUR' },
                  { value: 'GBP', label: 'GBP' }
                ]}
                disabled={!canManageCustomers}
                className="inline-field-horizontal"
              />

              <InlineEditableSelect
                label="Payment Terms"
                value={customer?.payment_terms}
                onSave={(value: string) => handleFieldUpdate('payment_terms', value)}
                options={[
                  { value: 'immediate', label: 'Immediate' },
                  { value: 'net15', label: 'Net 15' },
                  { value: 'net30', label: 'Net 30' },
                  { value: 'net60', label: 'Net 60' },
                  { value: 'net90', label: 'Net 90' }
                ]}
                disabled={!canManageCustomers}
                className="inline-field-horizontal"
                renderValue={(value) => (
                  value ? value.replace(/(\d+)/, ' $1').replace(/^./, str => str.toUpperCase()) : undefined
                )}
              />
            </div>
          </div>

          {/* Notes Section */}
          {customer?.notes && (
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Notes</h3>
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">{customer.notes}</p>
              </div>
            </div>
          )}

          {/* Account Information Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Linked Account Information
              </h3>
              {customer?.account && (
                <button
                  onClick={() => navigate(`/crm/accounts/${customer.account}`)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Account Details
                </button>
              )}
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
              {customer?.company_name ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Company Name</label>
                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{customer.company_name}</p>
                  </div>
                  {customer.primary_contact_name && (
                    <div className="space-y-2">
                      <div>
                        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Primary Contact</label>
                        <p className="text-sm text-gray-900 dark:text-gray-100">{customer.primary_contact_name}</p>
                      </div>
                      {customer.primary_contact_email && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Email</label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            <a href={`mailto:${customer.primary_contact_email}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                              {customer.primary_contact_email}
                            </a>
                          </p>
                        </div>
                      )}
                      {customer.primary_contact_phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Contact Phone</label>
                          <p className="text-sm text-gray-900 dark:text-gray-100">
                            <a href={`tel:${customer.primary_contact_phone}`} className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                              {customer.primary_contact_phone}
                            </a>
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    This customer is linked to an account in the CRM system. Click "View Account Details" above to see the complete account information, including all contacts, deals, and other related data.
                  </p>
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">No account information available.</p>
              )}
            </div>
          </div>

          {/* Addresses Section */}
          <div className="mb-8 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Addresses</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Billing Address */}
              <div className="space-y-2">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Billing Address</h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <InlineEditableField
                    label="Attention"
                    value={customer?.billing_address?.attention}
                    onSave={(value: string) => handleFieldUpdate('billing_attention', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="Street"
                    value={customer?.billing_address?.street}
                    onSave={(value: string) => handleFieldUpdate('billing_street', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="City"
                    value={customer?.billing_address?.city}
                    onSave={(value: string) => handleFieldUpdate('billing_city', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="State/Province"
                    value={customer?.billing_address?.state_province}
                    onSave={(value: string) => handleFieldUpdate('billing_state_province', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="ZIP/Postal Code"
                    value={customer?.billing_address?.zip_postal_code}
                    onSave={(value: string) => handleFieldUpdate('billing_zip_postal_code', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="Country"
                    value={customer?.billing_address?.country}
                    onSave={(value: string) => handleFieldUpdate('billing_country', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-2">
                <h4 className="text-md font-medium text-gray-900 dark:text-white mb-2">Shipping Address</h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-2">
                  <InlineEditableField
                    label="Attention"
                    value={customer?.shipping_address?.attention}
                    onSave={(value: string) => handleFieldUpdate('shipping_attention', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="Street"
                    value={customer?.shipping_address?.street}
                    onSave={(value: string) => handleFieldUpdate('shipping_street', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="City"
                    value={customer?.shipping_address?.city}
                    onSave={(value: string) => handleFieldUpdate('shipping_city', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="State/Province"
                    value={customer?.shipping_address?.state_province}
                    onSave={(value: string) => handleFieldUpdate('shipping_state_province', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="ZIP/Postal Code"
                    value={customer?.shipping_address?.zip_postal_code}
                    onSave={(value: string) => handleFieldUpdate('shipping_zip_postal_code', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                  <InlineEditableField
                    label="Country"
                    value={customer?.shipping_address?.country}
                    onSave={(value: string) => handleFieldUpdate('shipping_country', value)}
                    disabled={!canManageCustomers}
                    className="inline-field-horizontal"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p>
                <strong>Note:</strong> Customer-specific addresses will override the linked account addresses when generating invoices or estimates. 
                If no customer addresses are specified, the system will use the addresses from the linked account.
              </p>
            </div>
          </div>
          </div>
        </div>
      )
    },
    { 
      key: 'attachments', 
      label: 'Attachments', 
      content: (
        <AttachmentsTab
          entityType="customer"
          entityId={customerId}
        />
      )
    }
  ], [customer, customerId, handleFieldUpdate, validateEmail, validatePhone, navigate])

  if (isLoading) return <div className="p-6">Loading customer...</div>
  if (error) return <div className="p-6 text-red-600">Error loading customer: {error.message}</div>
  if (!customer) return <div className="p-6 text-gray-600">Customer not found</div>


  if (isLoading) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Customer Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The customer you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={() => navigate('/finance/customers')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Back to Customers
          </button>
        </div>
      </div>
    )
  }





  return (
    <div className="w-full p-6">
      {/* Header */}
      <TitleBox
        showActions={canManageCustomers}
        onEdit={handleEdit}
        onDelete={handleDelete}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {customer.display_name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {customer.company_name ? `Customer at ${customer.company_name}` : 'Individual Customer'}
            </p>
          </div>
        </div>
      </TitleBox>

      {/* Tabs */}
      <TabContainer
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        preserveTabState={true}
      />

      {/* Edit Side Panel */}
      <CustomerFormSidePanel
        isOpen={isEditPanelOpen}
        onClose={() => setIsEditPanelOpen(false)}
        customer={customer}
        onSuccess={() => {
          setIsEditPanelOpen(false)
          refetch()
        }}
      />
    </div>
  )
}