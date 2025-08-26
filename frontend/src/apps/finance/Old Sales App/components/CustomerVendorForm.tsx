import React, { useState, useEffect } from 'react'
import { 
  useCreateCustomer, 
  useUpdateCustomer, 
  type CustomerCreate, 
  type Customer 
} from '../customers/api'
import {
  useCreateVendor,
  useUpdateVendor,
  type VendorCreate,
  type Vendor
} from '../vendors/api'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { AccountSelect } from '@/shared/components/selectors/AccountSelect'
import { ContactSelect } from '@/shared/components/selectors/ContactSelect'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'
import { useEligibleLeadOwners } from '@/api/tenant'
import { ReceivableAccountSelect, PayableAccountSelect } from './ChartOfAccountSelect'

interface CustomerVendorFormProps {
  mode: 'customer' | 'vendor'
  record?: Customer | Vendor
  onSuccess?: () => void
  onCancel?: () => void
  isOpen: boolean
  onClose: () => void
}

const COUNTRIES = [
  'United States', 'Canada', 'United Kingdom', 'Germany', 'France', 'Italy', 'Spain', 
  'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Australia', 
  'New Zealand', 'Japan', 'South Korea', 'Singapore', 'India', 'Brazil', 'Mexico'
]

// Helper component for form fields - moved outside to prevent recreation
const FormField: React.FC<{
  label: string
  required?: boolean
  error?: string
  children: React.ReactNode
}> = ({ label, required, error, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
    )}
  </div>
)

export const CustomerVendorForm: React.FC<CustomerVendorFormProps> = ({ 
  mode,
  record, 
  onSuccess, 
  onCancel,
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState<CustomerCreate | VendorCreate>({
    display_name: '',
    contact_name: '',
    company_name: '',
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    mobile: '',
    website: '',
    customer_type: 'business',
    customer_status: 'active',
    currency: 'USD',
    payment_terms: 'net30',
    credit_limit: '',
    vat_treatment: 'uk',
    vat_registration_number: '',
    
    company_name_input: '',
    primary_contact_name_input: '',
    primary_contact_email_input: '',
    primary_contact_phone_input: '',
    
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
    
    receivable_account: undefined,
    payable_account: undefined,
    
    tags: [],
    portal_status: 'disabled',
    portal_language: 'en',
    source: 'finance',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>()
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null)
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)
  const [sameAsBilling, setSameAsBilling] = useState(false)

  const { data: ownersData } = useEligibleLeadOwners()
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()

  const isCustomer = mode === 'customer'
  const createMutation = isCustomer ? createCustomer : createVendor
  const updateMutation = isCustomer ? updateCustomer : updateVendor

  // Set default owner to current user on new records
  useEffect(() => {
    if (!record && ownersData?.users) {
      const currentUser = ownersData.users.find(user => user.is_current_user)
      if (currentUser && !selectedOwner) {
        setSelectedOwner(currentUser.id)
      }
    }
  }, [ownersData, record, selectedOwner])

  // Load record data for editing
  useEffect(() => {
    if (record) {
      setFormData({
        display_name: record.display_name || '',
        contact_name: record.contact_name || '',
        company_name: record.company_name || '',
        first_name: record.first_name || '',
        last_name: record.last_name || '',
        email: record.email || '',
        phone: record.phone || '',
        mobile: record.mobile || '',
        website: record.website || '',
        customer_type: record.customer_type || 'business',
        customer_status: record.customer_status || 'active',
        currency: record.currency || 'USD',
        payment_terms: record.payment_terms || 'net30',
        credit_limit: record.credit_limit || '',
        vat_treatment: record.vat_treatment || 'uk',
        vat_registration_number: record.vat_registration_number || '',
        
        company_name_input: record.company_name || record.display_name || '',
        primary_contact_name_input: record.primary_contact_name || record.contact_name || '',
        primary_contact_email_input: record.primary_contact_email || record.email || '',
        primary_contact_phone_input: record.primary_contact_phone || record.phone || '',
        
        billing_attention: record.billing_attention || '',
        billing_street: record.billing_street || '',
        billing_city: record.billing_city || '',
        billing_state_province: record.billing_state_province || '',
        billing_zip_postal_code: record.billing_zip_postal_code || '',
        billing_country: record.billing_country || '',
        shipping_attention: record.shipping_attention || '',
        shipping_street: record.shipping_street || '',
        shipping_city: record.shipping_city || '',
        shipping_state_province: record.shipping_state_province || '',
        shipping_zip_postal_code: record.shipping_zip_postal_code || '',
        shipping_country: record.shipping_country || '',
        
        receivable_account: record.receivable_account || undefined,
        payable_account: record.payable_account || undefined,
        
        tags: record.tags || [],
        social_media: record.social_media || {},
        portal_status: record.portal_status || 'disabled',
        portal_language: record.portal_language || 'en',
        contact_persons: record.contact_persons || [],
        source: record.source || 'finance',
        notes: record.notes || ''
      })
      
      setSelectedOwner(record.owner || undefined)
      setSelectedAccountId(record.account || null)
      setSelectedContactId(record.primary_contact || null)
    }
  }, [record])

  // Sync shipping with billing
  useEffect(() => {
    if (sameAsBilling) {
      setFormData(prev => ({
        ...prev,
        shipping_attention: prev.billing_attention,
        shipping_street: prev.billing_street,
        shipping_city: prev.billing_city,
        shipping_state_province: prev.billing_state_province,
        shipping_zip_postal_code: prev.billing_zip_postal_code,
        shipping_country: prev.billing_country,
      }))
    }
  }, [sameAsBilling, formData.billing_attention, formData.billing_street, formData.billing_city, formData.billing_state_province, formData.billing_zip_postal_code, formData.billing_country])

  const handleInputChange = (field: keyof (CustomerCreate | VendorCreate), value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.display_name.trim()) {
      newErrors.display_name = 'Display name is required'
    }
    if (!formData.company_name_input.trim()) {
      newErrors.company_name_input = 'Company name is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) return

    try {
      // Create a clean copy of formData, excluding read-only fields
      const { company_name, ...cleanFormData } = formData as any
      
      const submitData: any = {
        ...cleanFormData,
        contact_type: isCustomer ? 'customer' : 'vendor',  // Explicitly set contact_type
        owner: selectedOwner,
        receivable_account: formData.receivable_account,
        payable_account: formData.payable_account,
      }
      
      // Remove empty contact fields to avoid validation errors
      // Backend treats empty strings differently from undefined/null
      if (!submitData.primary_contact_name_input || submitData.primary_contact_name_input.trim() === '') {
        delete submitData.primary_contact_name_input
      }
      if (!submitData.primary_contact_email_input || submitData.primary_contact_email_input.trim() === '') {
        delete submitData.primary_contact_email_input
      }
      if (!submitData.primary_contact_phone_input || submitData.primary_contact_phone_input.trim() === '') {
        delete submitData.primary_contact_phone_input
      }
      
      // Only add account field if an existing account is selected
      // Do NOT add it if selectedAccountId is null (new company name typed)
      if (selectedAccountId) {
        submitData.account = selectedAccountId
      }
      
      // Only add primary_contact_id if an existing contact is selected
      if (selectedContactId) {
        submitData.primary_contact_id = selectedContactId
      }

      // Debug log to see what we're sending
      console.log('Submitting customer/vendor data:', {
        selectedAccountId,
        selectedContactId,
        company_name_input: formData.company_name_input,
        submitData
      })

      if (record) {
        await updateMutation.mutateAsync({
          id: record.contact_id,
          data: submitData
        })
        alert(`${isCustomer ? 'Customer' : 'Vendor'} updated successfully`)
      } else {
        await createMutation.mutateAsync(submitData)
        alert(`${isCustomer ? 'Customer' : 'Vendor'} created successfully`)
      }
      
      onSuccess?.()
    } catch (error: any) {
      console.error('Full error object:', error)
      console.error('Error response:', error.response?.data)
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.company_name_input?.[0] ||
                          error.response?.data?.detail ||
                          JSON.stringify(error.response?.data) ||
                          error.message || 
                          'Unknown error'
      alert(`Error ${record ? 'updating' : 'creating'} ${isCustomer ? 'customer' : 'vendor'}: ${errorMessage}`)
    }
  }

  const entityLabel = isCustomer ? 'Customer' : 'Vendor'
  const numberField = isCustomer ? 'customer_number' : 'vendor_number'

  return (
    <FormSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={record ? `Edit ${entityLabel}` : `Create New ${entityLabel}`}
      subtitle={record ? `Update ${entityLabel.toLowerCase()} details` : `Add a new ${entityLabel.toLowerCase()} to your system`}
    >
      <div className="space-y-6">
        {/* Basic Information */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Display Name" required error={errors.display_name}>
              <input
                type="text"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder={`Enter ${entityLabel.toLowerCase()} display name`}
              />
            </FormField>

            {record && record[numberField] && (
              <FormField label={`${entityLabel} Number`}>
                <input
                  type="text"
                  value={record[numberField]}
                  disabled
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
                />
              </FormField>
            )}

            <FormField label="Company Name" required error={errors.company_name_input}>
              <AccountSelect
                initialSelection={selectedAccountId ? {
                  accountId: selectedAccountId,
                  accountName: formData.company_name_input
                } : undefined}
                onChange={(option) => {
                  setSelectedAccountId(option.accountId)
                  handleInputChange('company_name_input', option.accountName)
                  // If a different account is selected, clear the contact
                  if (option.accountId !== selectedAccountId) {
                    setSelectedContactId(null)
                    handleInputChange('primary_contact_name_input', '')
                    handleInputChange('primary_contact_email_input', '')
                    handleInputChange('primary_contact_phone_input', '')
                  }
                }}
                placeholder="Select or type company name..."
                disabled={false}
              />
            </FormField>

            <FormField label="Primary Contact">
              <ContactSelect
                value={selectedContactId || undefined}
                onChange={(contactId, contactName, contactData) => {
                  setSelectedContactId(contactId as number | null)
                  if (contactName) {
                    handleInputChange('primary_contact_name_input', contactName)
                  }
                  if (contactData?.email) {
                    handleInputChange('primary_contact_email_input', contactData.email)
                  }
                  if (contactData?.phone) {
                    handleInputChange('primary_contact_phone_input', contactData.phone)
                  }
                  // Also update the old contact_name field for compatibility
                  handleInputChange('contact_name', contactName || '')
                }}
                placeholder="Select or type contact name..."
                accountFilter={selectedAccountId}
                allowCreation={true}
              />
            </FormField>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <FormField label="First Name">
              <input
                type="text"
                value={formData.first_name || ''}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="First name"
              />
            </FormField>

            <FormField label="Last Name">
              <input
                type="text"
                value={formData.last_name || ''}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Last name"
              />
            </FormField>

            <FormField label="Email">
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="email@example.com"
              />
            </FormField>

            <FormField label="Phone">
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="+1 (555) 123-4567"
              />
            </FormField>

            <FormField label="Mobile">
              <input
                type="tel"
                value={formData.mobile || ''}
                onChange={(e) => handleInputChange('mobile', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="+1 (555) 987-6543"
              />
            </FormField>

            <FormField label="Website">
              <input
                type="url"
                value={formData.website || ''}
                onChange={(e) => handleInputChange('website', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="https://example.com"
              />
            </FormField>
          </div>
        </div>

        {/* Details Section */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">{entityLabel} Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label={`${entityLabel} Type`}>
              <select
                value={formData.customer_type}
                onChange={(e) => handleInputChange('customer_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="business">Business</option>
                <option value="individual">Individual</option>
              </select>
            </FormField>

            <FormField label="Status">
              <select
                value={formData.customer_status || 'active'}
                onChange={(e) => handleInputChange('customer_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </FormField>

            <FormField label="Currency">
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </FormField>

            <FormField label="Payment Terms">
              <select
                value={formData.payment_terms}
                onChange={(e) => handleInputChange('payment_terms', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="immediate">Immediate</option>
                <option value="net15">Net 15 Days</option>
                <option value="net30">Net 30 Days</option>
                <option value="net60">Net 60 Days</option>
                <option value="net90">Net 90 Days</option>
              </select>
            </FormField>

            <FormField label="Credit Limit">
              <input
                type="number"
                value={formData.credit_limit || ''}
                onChange={(e) => handleInputChange('credit_limit', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="0.00"
                step="0.01"
              />
            </FormField>

            <FormField label="Owner">
              <UserSelect
                value={selectedOwner}
                onChange={setSelectedOwner}
                placeholder="Select owner"
              />
            </FormField>

            {/* Show A/R for customers, A/P for vendors */}
            {isCustomer ? (
              <FormField label="Accounts Receivable">
                <ReceivableAccountSelect
                  value={formData.receivable_account}
                  onChange={(value) => handleInputChange('receivable_account', value)}
                />
              </FormField>
            ) : (
              <FormField label="Accounts Payable">
                <PayableAccountSelect
                  value={formData.payable_account}
                  onChange={(value) => handleInputChange('payable_account', value)}
                />
              </FormField>
            )}
          </div>
        </div>

        {/* VAT Information */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">VAT Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="VAT Treatment">
              <select
                value={formData.vat_treatment || 'uk'}
                onChange={(e) => handleInputChange('vat_treatment', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="uk">UK</option>
                <option value="overseas">Overseas</option>
              </select>
            </FormField>

            <FormField label="VAT Registration Number">
              <input
                type="text"
                value={formData.vat_registration_number || ''}
                onChange={(e) => handleInputChange('vat_registration_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Enter VAT registration number"
              />
            </FormField>
          </div>
        </div>

        {/* Billing Address */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Billing Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Attention">
              <input
                type="text"
                value={formData.billing_attention || ''}
                onChange={(e) => handleInputChange('billing_attention', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Attention to"
              />
            </FormField>

            <FormField label="Street">
              <input
                type="text"
                value={formData.billing_street || ''}
                onChange={(e) => handleInputChange('billing_street', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="Street address"
              />
            </FormField>

            <FormField label="City">
              <input
                type="text"
                value={formData.billing_city || ''}
                onChange={(e) => handleInputChange('billing_city', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="City"
              />
            </FormField>

            <FormField label="State/Province">
              <input
                type="text"
                value={formData.billing_state_province || ''}
                onChange={(e) => handleInputChange('billing_state_province', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="State or Province"
              />
            </FormField>

            <FormField label="ZIP/Postal Code">
              <input
                type="text"
                value={formData.billing_zip_postal_code || ''}
                onChange={(e) => handleInputChange('billing_zip_postal_code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                placeholder="ZIP or Postal code"
              />
            </FormField>

            <FormField label="Country">
              <select
                value={formData.billing_country || ''}
                onChange={(e) => handleInputChange('billing_country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        {/* Shipping Address */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Shipping Address
            <label className="ml-4 inline-flex items-center">
              <input
                type="checkbox"
                checked={sameAsBilling}
                onChange={(e) => setSameAsBilling(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm font-normal text-gray-600 dark:text-gray-400">Same as billing</span>
            </label>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Attention">
              <input
                type="text"
                value={formData.shipping_attention || ''}
                onChange={(e) => handleInputChange('shipping_attention', e.target.value)}
                disabled={sameAsBilling}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                placeholder="Attention to"
              />
            </FormField>

            <FormField label="Street">
              <input
                type="text"
                value={formData.shipping_street || ''}
                onChange={(e) => handleInputChange('shipping_street', e.target.value)}
                disabled={sameAsBilling}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                placeholder="Street address"
              />
            </FormField>

            <FormField label="City">
              <input
                type="text"
                value={formData.shipping_city || ''}
                onChange={(e) => handleInputChange('shipping_city', e.target.value)}
                disabled={sameAsBilling}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                placeholder="City"
              />
            </FormField>

            <FormField label="State/Province">
              <input
                type="text"
                value={formData.shipping_state_province || ''}
                onChange={(e) => handleInputChange('shipping_state_province', e.target.value)}
                disabled={sameAsBilling}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                placeholder="State or Province"
              />
            </FormField>

            <FormField label="ZIP/Postal Code">
              <input
                type="text"
                value={formData.shipping_zip_postal_code || ''}
                onChange={(e) => handleInputChange('shipping_zip_postal_code', e.target.value)}
                disabled={sameAsBilling}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
                placeholder="ZIP or Postal code"
              />
            </FormField>

            <FormField label="Country">
              <select
                value={formData.shipping_country || ''}
                onChange={(e) => handleInputChange('shipping_country', e.target.value)}
                disabled={sameAsBilling}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900 disabled:cursor-not-allowed"
              >
                <option value="">Select Country</option>
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </FormField>
          </div>
        </div>

        {/* Portal Settings */}
        <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Portal Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField label="Portal Status">
              <select
                value={formData.portal_status || 'disabled'}
                onChange={(e) => handleInputChange('portal_status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="disabled">Disabled</option>
                <option value="enabled">Enabled</option>
              </select>
            </FormField>

            <FormField label="Portal Language">
              <select
                value={formData.portal_language || 'en'}
                onChange={(e) => handleInputChange('portal_language', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="it">Italian</option>
                <option value="pt">Portuguese</option>
                <option value="nl">Dutch</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
              </select>
            </FormField>
          </div>
        </div>

        {/* Notes */}
        <div className="pb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Additional Information</h3>
          <FormField label="Notes">
            <textarea
              value={formData.notes || ''}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter any additional notes or comments"
            />
          </FormField>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6">
          <button
            type="button"
            onClick={onCancel || onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={createMutation.isPending || updateMutation.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (record ? 'Update' : 'Create')}
          </button>
        </div>
      </div>
    </FormSidePanel>
  )
}