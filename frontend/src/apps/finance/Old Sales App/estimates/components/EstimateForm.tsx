import React, { useState, useEffect } from 'react'
import { FormField, FormSection, TwoColumnGrid, ThreeColumnGrid, CreateFormActions, EditFormActions, FormSidePanel } from '@/shared'
import { UserSelect, CustomerSelect } from '@/shared'
import { EstimateCreate, Estimate, useCreateEstimate, useUpdateEstimate } from '../api'
import { useAccounts } from '@/apps/crm/accounts/api'
import { useContacts } from '@/apps/crm/contacts/api'
import { useAuth } from '@/core/auth/AuthProvider'
import { type Customer } from '@/apps/finance/Old Sales App/customers/api'

interface EstimateFormProps {
  estimate?: Partial<Estimate>
  initialData?: Partial<EstimateCreate>
  onSuccess?: () => void
  onCancel?: () => void
  isOpen: boolean
  onClose: () => void
}

export const EstimateForm: React.FC<EstimateFormProps> = ({
  estimate,
  initialData,
  onSuccess,
  onCancel,
  isOpen,
  onClose
}) => {
  // API hooks
  const createEstimate = useCreateEstimate()
  const updateEstimate = useUpdateEstimate()
  const isEditing = !!estimate?.estimate_id
  const { user } = useAuth()

  // Fetch accounts and contacts
  const { data: accountsData } = useAccounts(1, 100)
  const { data: contactsData } = useContacts(1, 100)
  
  const [formData, setFormData] = useState<EstimateCreate>({
    estimate_number: estimate?.estimate_number || '',
    po_number: estimate?.po_number || '',
    status: estimate?.status || 'draft', // Default to draft
    customer: estimate?.customer || undefined,
    account: estimate?.account || 0,
    contact: estimate?.contact || undefined,
    deal: estimate?.deal || undefined,
    owner: estimate?.owner || (user?.id ? parseInt(user.id) : undefined), // Auto-populate with current user
    estimate_date: estimate?.estimate_date || new Date().toISOString().split('T')[0],
    valid_until: estimate?.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    billing_attention: estimate?.billing_attention || '',
    billing_street: estimate?.billing_street || '',
    billing_city: estimate?.billing_city || '',
    billing_state_province: estimate?.billing_state_province || '',
    billing_zip_postal_code: estimate?.billing_zip_postal_code || '',
    billing_country: estimate?.billing_country || '',
    shipping_attention: estimate?.shipping_attention || '',
    shipping_street: estimate?.shipping_street || '',
    shipping_city: estimate?.shipping_city || '',
    shipping_state_province: estimate?.shipping_state_province || '',
    shipping_zip_postal_code: estimate?.shipping_zip_postal_code || '',
    shipping_country: estimate?.shipping_country || '',
    notes: estimate?.notes || '',
    terms_conditions: estimate?.terms_conditions || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddresses, setShowAddresses] = useState(false)

  // Load data for editing
  useEffect(() => {
    if (estimate || initialData) {
      const data = { ...estimate, ...initialData }
      setFormData({
        estimate_number: data?.estimate_number || '',
        po_number: data?.po_number || '',
        status: data?.status || 'draft',
        customer: data?.customer || undefined,
        account: data?.account || 0,
        contact: data?.contact || undefined,
        deal: data?.deal || undefined,
        owner: data?.owner || (user?.id ? parseInt(user.id) : undefined),
        estimate_date: data?.estimate_date || new Date().toISOString().split('T')[0],
        valid_until: data?.valid_until || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        billing_attention: data?.billing_attention || '',
        billing_street: data?.billing_street || '',
        billing_city: data?.billing_city || '',
        billing_state_province: data?.billing_state_province || '',
        billing_zip_postal_code: data?.billing_zip_postal_code || '',
        billing_country: data?.billing_country || '',
        shipping_attention: data?.shipping_attention || '',
        shipping_street: data?.shipping_street || '',
        shipping_city: data?.shipping_city || '',
        shipping_state_province: data?.shipping_state_province || '',
        shipping_zip_postal_code: data?.shipping_zip_postal_code || '',
        shipping_country: data?.shipping_country || '',
        notes: data?.notes || '',
        terms_conditions: data?.terms_conditions || ''
      })
      // Show addresses if they exist
      if (data?.billing_street || data?.shipping_street) {
        setShowAddresses(true)
      }
    }
  }, [estimate, initialData, user])

  const handleCustomerSelect = (customerId: number | undefined, customer?: Customer) => {
    if (customer) {
      // Update form data with customer selection
      setFormData(prev => ({
        ...prev,
        customer: customerId,
        // Auto-populate account from customer
        account: customer.account || prev.account,
        // Auto-populate owner from customer if available, otherwise keep current
        owner: customer.owner || prev.owner,
        // Auto-populate primary contact from customer if available
        contact: customer.primary_contact || undefined,
        // Auto-populate addresses from customer
        billing_attention: customer.billing_address?.attention || customer.display_name || '',
        billing_street: customer.billing_address?.street || '',
        billing_city: customer.billing_address?.city || '',
        billing_state_province: customer.billing_address?.state_province || '',
        billing_zip_postal_code: customer.billing_address?.zip_postal_code || '',
        billing_country: customer.billing_address?.country || '',
        shipping_attention: customer.shipping_address?.attention || customer.display_name || '',
        shipping_street: customer.shipping_address?.street || '',
        shipping_city: customer.shipping_address?.city || '',
        shipping_state_province: customer.shipping_address?.state_province || '',
        shipping_zip_postal_code: customer.shipping_address?.zip_postal_code || '',
        shipping_country: customer.shipping_address?.country || '',
      }))
      
      // Show addresses section if customer has addresses
      if (customer.billing_address?.street || customer.shipping_address?.street) {
        setShowAddresses(true)
      }
    } else {
      // Clear customer-related fields
      setFormData(prev => ({
        ...prev,
        customer: undefined,
        contact: undefined, // Clear contact when customer is cleared
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
      }))
      setShowAddresses(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.customer && !formData.account) {
      newErrors.customer = 'Customer or Account is required'
    }
    
    if (!formData.estimate_date) {
      newErrors.estimate_date = 'Estimate date is required'
    }
    
    if (!formData.valid_until) {
      newErrors.valid_until = 'Valid until date is required'
    }
    
    if (formData.estimate_date && formData.valid_until && formData.valid_until <= formData.estimate_date) {
      newErrors.valid_until = 'Valid until date must be after estimate date'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      if (isEditing && estimate?.estimate_id) {
        await updateEstimate.mutateAsync({ id: estimate.estimate_id, data: formData })
      } else {
        await createEstimate.mutateAsync(formData)
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving estimate:', error)
      // Error handling is done by the mutation hooks
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof EstimateCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'rejected', label: 'Rejected' },
    { value: 'expired', label: 'Expired' }
  ]

  // Create account options from API data
  const accountOptions = accountsData?.results?.map(account => ({
    value: account.account_id,
    label: account.account_name
  })) || []

  // Filter contacts by selected customer's account
  const contactOptions = contactsData?.results?.filter(contact => 
    formData.account && contact.account === formData.account
  ).map(contact => ({
    value: contact.contact_id,
    label: `${contact.first_name} ${contact.last_name}`.trim()
  })) || []

  const isLoading = createEstimate.isPending || updateEstimate.isPending || isSubmitting

  return (
    <FormSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Estimate' : 'Create New Estimate'}
      subtitle={isEditing ? 'Update estimate information' : 'Add a new estimate for your customer'}
    >
      <form onSubmit={handleSubmit}>
        {/* Customer Selection Section - Priority */}
        <FormSection title="Customer Selection">
          <CustomerSelect
            value={formData.customer}
            onChange={handleCustomerSelect}
            label="Customer"
            placeholder="Select a customer..."
            error={errors.customer}
            required
          />
          
          {formData.customer && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Customer selected. Account and addresses have been auto-populated.
              </p>
            </div>
          )}
        </FormSection>

        {/* Basic Information Section */}
        <FormSection title="Basic Information">
          <TwoColumnGrid>
            <FormField
              name="estimate_number"
              label="Estimate Number"
              value={formData.estimate_number}
              onChange={handleInputChange}
              placeholder="Leave blank to auto-generate"
              error={errors.estimate_number}
            />

            <FormField
              name="po_number"
              label="PO Number"
              value={formData.po_number || ''}
              onChange={handleInputChange}
              placeholder="Customer PO number"
              error={errors.po_number}
            />
          </TwoColumnGrid>

          <TwoColumnGrid className="mt-4">
            <FormField
              name="status"
              label="Status"
              as="select"
              value={formData.status}
              onChange={handleInputChange}
              options={statusOptions}
              error={errors.status}
            />

            {/* Only show contact selector if customer is selected */}
            {formData.customer ? (
              <FormField
                name="contact"
                label="Contact (Optional)"
                as="select"
                value={formData.contact ? String(formData.contact) : ''}
                onChange={(_, value) => handleInputChange('contact', value ? Number(value) : undefined)}
                options={[
                  { value: '', label: 'Select a contact...' },
                  ...contactOptions.map(opt => ({ ...opt, value: String(opt.value) }))
                ]}
                error={errors.contact}
              />
            ) : (
              <div /> // Empty div to maintain grid layout
            )}
          </TwoColumnGrid>
        </FormSection>

        {/* Dates & Owner Section */}
        <FormSection title="Dates & Assignment">
          <TwoColumnGrid>
            <FormField
              name="estimate_date"
              label="Estimate Date"
              type="date"
              value={formData.estimate_date}
              onChange={handleInputChange}
              error={errors.estimate_date}
              required
            />

            <FormField
              name="valid_until"
              label="Valid Until"
              type="date"
              value={formData.valid_until}
              onChange={handleInputChange}
              error={errors.valid_until}
              required
            />
          </TwoColumnGrid>

          <UserSelect
            label="Owner"
            value={formData.owner}
            onChange={(userId) => handleInputChange('owner', userId)}
            error={errors.owner}
            disabled={!!formData.customer} // Auto-populated from customer
          />
        </FormSection>

        {/* Address Information Section - Only show if customer selected */}
        {showAddresses && (
          <FormSection title="Address Information">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Billing Address */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Billing Address</h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-1">
                  {formData.billing_attention && (
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{formData.billing_attention}</p>
                  )}
                  {formData.billing_street && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formData.billing_street}</p>
                  )}
                  {(formData.billing_city || formData.billing_state_province || formData.billing_zip_postal_code) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {[formData.billing_city, formData.billing_state_province, formData.billing_zip_postal_code].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {formData.billing_country && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formData.billing_country}</p>
                  )}
                  {!formData.billing_street && !formData.billing_city && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">No billing address provided</p>
                  )}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Shipping Address</h4>
                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-md space-y-1">
                  {formData.shipping_attention && (
                    <p className="text-sm text-gray-900 dark:text-white font-medium">{formData.shipping_attention}</p>
                  )}
                  {formData.shipping_street && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formData.shipping_street}</p>
                  )}
                  {(formData.shipping_city || formData.shipping_state_province || formData.shipping_zip_postal_code) && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {[formData.shipping_city, formData.shipping_state_province, formData.shipping_zip_postal_code].filter(Boolean).join(', ')}
                    </p>
                  )}
                  {formData.shipping_country && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formData.shipping_country}</p>
                  )}
                  {!formData.shipping_street && !formData.shipping_city && (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">No shipping address provided</p>
                  )}
                </div>
              </div>
            </div>
          </FormSection>
        )}

        {/* Additional Information Section */}
        <FormSection title="Additional Information">
          <FormField
            name="notes"
            label="Notes"
            as="textarea"
            value={formData.notes || ''}
            onChange={handleInputChange}
            placeholder="Internal notes about this estimate"
            error={errors.notes}
            rows={3}
          />

          <FormField
            name="terms_conditions"
            label="Terms & Conditions"
            as="textarea"
            value={formData.terms_conditions || ''}
            onChange={handleInputChange}
            placeholder="Terms and conditions for this estimate"
            error={errors.terms_conditions}
            rows={4}
          />
        </FormSection>

        {/* Action Buttons */}
        {isEditing ? (
          <EditFormActions
            onCancel={onCancel}
            isSubmitting={isLoading}
            disabled={(!formData.customer && !formData.account) || !formData.estimate_date || !formData.valid_until}
          />
        ) : (
          <CreateFormActions
            onCancel={onCancel}
            isSubmitting={isLoading}
            disabled={(!formData.customer && !formData.account) || !formData.estimate_date || !formData.valid_until}
          />
        )}
      </form>
    </FormSidePanel>
  )
}