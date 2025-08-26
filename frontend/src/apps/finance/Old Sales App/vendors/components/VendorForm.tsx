import React, { useState, useEffect } from 'react'
import { useCreateVendor, useUpdateVendor, type VendorCreate, type Vendor } from '../api'
import { AccountSelect, type AccountSelectOption } from '@/shared/components/selectors/AccountSelect'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { useAccount } from '@/apps/crm/accounts/api'
import { useEligibleLeadOwners } from '@/api/tenant'

interface VendorFormProps {
  vendor?: Vendor
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

export const VendorForm: React.FC<VendorFormProps> = ({ 
  vendor, 
  onSuccess, 
  onCancel,
  isOpen,
  onClose
}) => {
  const [formData, setFormData] = useState<VendorCreate>({
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
    status: 'active',
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
    
    tags: [],
    portal_status: 'disabled',
    portal_language: 'en',
    source: 'finance',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedAccount, setSelectedAccount] = useState<AccountSelectOption | undefined>()
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>()
  const [sameAsBilling, setSameAsBilling] = useState(false)

  const { data: ownersData } = useEligibleLeadOwners()
  const createVendor = useCreateVendor()
  const updateVendor = useUpdateVendor()
  
  // Fetch account data for auto-filling addresses
  const { data: accountData } = useAccount(selectedAccount?.accountId || 0)

  // Set default owner to current user on new vendors
  useEffect(() => {
    if (!vendor && ownersData?.users) {
      const currentUser = ownersData.users.find(user => user.is_current_user)
      if (currentUser && !selectedOwner) {
        setSelectedOwner(currentUser.id)
      }
    }
  }, [ownersData, vendor, selectedOwner])

  // Load vendor data for editing
  useEffect(() => {
    if (vendor) {
      setFormData({
        display_name: vendor.display_name || '',
        contact_name: vendor.contact_name || '',
        company_name: vendor.company_name || '',
        first_name: vendor.first_name || '',
        last_name: vendor.last_name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        mobile: vendor.mobile || '',
        website: vendor.website || '',
        customer_type: vendor.customer_type || 'business',
        customer_status: vendor.customer_status || 'active',
        status: vendor.status || 'active',
        currency: vendor.currency || 'USD',
        payment_terms: vendor.payment_terms || 'net30',
        credit_limit: vendor.credit_limit || '',
        vat_treatment: vendor.vat_treatment || 'uk',
        vat_registration_number: vendor.vat_registration_number || '',
        
        company_name_input: vendor.company_name || vendor.display_name || '',
        primary_contact_name_input: vendor.primary_contact_name || vendor.contact_name || '',
        primary_contact_email_input: vendor.primary_contact_email || vendor.email || '',
        primary_contact_phone_input: vendor.primary_contact_phone || vendor.phone || '',
        
        billing_attention: vendor.billing_attention || '',
        billing_street: vendor.billing_street || '',
        billing_city: vendor.billing_city || '',
        billing_state_province: vendor.billing_state_province || '',
        billing_zip_postal_code: vendor.billing_zip_postal_code || '',
        billing_country: vendor.billing_country || '',
        shipping_attention: vendor.shipping_attention || '',
        shipping_street: vendor.shipping_street || '',
        shipping_city: vendor.shipping_city || '',
        shipping_state_province: vendor.shipping_state_province || '',
        shipping_zip_postal_code: vendor.shipping_zip_postal_code || '',
        shipping_country: vendor.shipping_country || '',
        
        tags: vendor.tags || [],
        social_media: vendor.social_media || {},
        portal_status: vendor.portal_status || 'disabled',
        portal_language: vendor.portal_language || 'en',
        contact_persons: vendor.contact_persons || [],
        source: vendor.source || 'finance',
        notes: vendor.notes || ''
      })
      
      if (vendor.account) {
        setSelectedAccount({
          accountId: vendor.account,
          accountName: vendor.company_name || ''
        })
      }
      
      setSelectedOwner(vendor.owner || undefined)
    }
  }, [vendor])

  // Auto-fill addresses from account
  useEffect(() => {
    if (accountData && !vendor) {
      setFormData(prev => ({
        ...prev,
        billing_street: accountData.billing_street || prev.billing_street,
        billing_city: accountData.billing_city || prev.billing_city,
        billing_state_province: accountData.billing_state_province || prev.billing_state_province,
        billing_zip_postal_code: accountData.billing_zip_postal_code || prev.billing_zip_postal_code,
        billing_country: accountData.billing_country || prev.billing_country,
        shipping_street: accountData.shipping_street || prev.shipping_street,
        shipping_city: accountData.shipping_city || prev.shipping_city,
        shipping_state_province: accountData.shipping_state_province || prev.shipping_state_province,
        shipping_zip_postal_code: accountData.shipping_zip_postal_code || prev.shipping_zip_postal_code,
        shipping_country: accountData.shipping_country || prev.shipping_country,
      }))
    }
  }, [accountData, vendor])

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

  const handleInputChange = (field: keyof VendorCreate, value: any) => {
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
      const submitData = {
        ...formData,
        owner: selectedOwner,
        // Account is optional for vendors
        account: selectedAccount?.accountId
      }

      if (vendor) {
        await updateVendor.mutateAsync({
          id: vendor.contact_id,
          data: submitData
        })
        alert('Vendor updated successfully')
      } else {
        await createVendor.mutateAsync(submitData)
        alert('Vendor created successfully')
      }
      
      onSuccess?.()
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
      alert(`Error ${vendor ? 'updating' : 'creating'} vendor: ${errorMessage}`)
    }
  }

  // Helper component for form fields
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

  return (
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
              placeholder="Enter vendor display name"
            />
          </FormField>

          {vendor && vendor.vendor_number && (
            <FormField label="Vendor Number">
              <input
                type="text"
                value={vendor.vendor_number}
                disabled
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400"
              />
            </FormField>
          )}

          <FormField label="Company Name" required error={errors.company_name_input}>
            <input
              type="text"
              value={formData.company_name_input}
              onChange={(e) => handleInputChange('company_name_input', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter company name"
            />
          </FormField>

          <FormField label="Contact Name">
            <input
              type="text"
              value={formData.contact_name || ''}
              onChange={(e) => handleInputChange('contact_name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="Enter contact name"
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

      {/* Vendor Details */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Vendor Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Vendor Type">
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
              value={formData.status || 'active'}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
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
              placeholder="GB123456789"
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
              placeholder="Accounts Payable"
            />
          </FormField>

          <FormField label="Street">
            <input
              type="text"
              value={formData.billing_street || ''}
              onChange={(e) => handleInputChange('billing_street', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="123 Main Street"
            />
          </FormField>

          <FormField label="City">
            <input
              type="text"
              value={formData.billing_city || ''}
              onChange={(e) => handleInputChange('billing_city', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="New York"
            />
          </FormField>

          <FormField label="State/Province">
            <input
              type="text"
              value={formData.billing_state_province || ''}
              onChange={(e) => handleInputChange('billing_state_province', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="NY"
            />
          </FormField>

          <FormField label="ZIP/Postal Code">
            <input
              type="text"
              value={formData.billing_zip_postal_code || ''}
              onChange={(e) => handleInputChange('billing_zip_postal_code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              placeholder="10001"
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
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Shipping Address</h3>
        <div className="mb-4">
          <label className="flex items-center space-x-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={sameAsBilling}
              onChange={(e) => setSameAsBilling(e.target.checked)}
              className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-400"
            />
            <span>Same as billing address</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField label="Attention">
            <input
              type="text"
              value={formData.shipping_attention || ''}
              onChange={(e) => handleInputChange('shipping_attention', e.target.value)}
              disabled={sameAsBilling}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              placeholder="Warehouse"
            />
          </FormField>

          <FormField label="Street">
            <input
              type="text"
              value={formData.shipping_street || ''}
              onChange={(e) => handleInputChange('shipping_street', e.target.value)}
              disabled={sameAsBilling}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              placeholder="456 Warehouse Ave"
            />
          </FormField>

          <FormField label="City">
            <input
              type="text"
              value={formData.shipping_city || ''}
              onChange={(e) => handleInputChange('shipping_city', e.target.value)}
              disabled={sameAsBilling}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              placeholder="Brooklyn"
            />
          </FormField>

          <FormField label="State/Province">
            <input
              type="text"
              value={formData.shipping_state_province || ''}
              onChange={(e) => handleInputChange('shipping_state_province', e.target.value)}
              disabled={sameAsBilling}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              placeholder="NY"
            />
          </FormField>

          <FormField label="ZIP/Postal Code">
            <input
              type="text"
              value={formData.shipping_zip_postal_code || ''}
              onChange={(e) => handleInputChange('shipping_zip_postal_code', e.target.value)}
              disabled={sameAsBilling}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900"
              placeholder="11201"
            />
          </FormField>

          <FormField label="Country">
            <select
              value={formData.shipping_country || ''}
              onChange={(e) => handleInputChange('shipping_country', e.target.value)}
              disabled={sameAsBilling}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-900"
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
              onChange={(e) => handleInputChange('portal_status', e.target.value as 'enabled' | 'disabled')}
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
            </select>
          </FormField>
        </div>
      </div>

      {/* Notes */}
      <div className="border-b border-gray-200 dark:border-gray-700 pb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Notes</h3>
        <FormField label="Internal Notes">
          <textarea
            value={formData.notes || ''}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
            placeholder="Add any internal notes about this vendor..."
          />
        </FormField>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel || onClose}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        {!vendor && (
          <button
            type="button"
            onClick={() => {
              handleSubmit()
              // Reset form for new entry
              setFormData({
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
                status: 'active',
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
                tags: [],
                portal_status: 'disabled',
                portal_language: 'en',
                source: 'finance',
                notes: ''
              })
              setSelectedAccount(undefined)
            }}
            disabled={createVendor.isPending}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {createVendor.isPending ? 'Saving...' : 'Save & New'}
          </button>
        )}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={createVendor.isPending || updateVendor.isPending}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createVendor.isPending || updateVendor.isPending ? 'Saving...' : (vendor ? 'Update' : 'Create')}
        </button>
      </div>
    </div>
  )
}