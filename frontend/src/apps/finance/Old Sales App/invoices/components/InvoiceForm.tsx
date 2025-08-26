import React, { useState, useEffect } from 'react'
import { FormField, FormSection, TwoColumnGrid, ThreeColumnGrid, CreateFormActions, EditFormActions, FormSidePanel } from '@/shared'
import { UserSelect, CustomerSelect } from '@/shared'
import { InvoiceCreate, Invoice, useCreateInvoice, useUpdateInvoice } from '../api'
import { useAccounts } from '@/apps/crm/accounts/api'
import { useContacts } from '@/apps/crm/contacts/api'
import { useAuth } from '@/core/auth/AuthProvider'
import { type Customer } from '@/apps/finance/Old Sales App/customers/api'

interface InvoiceFormProps {
  invoice?: Partial<Invoice>
  initialData?: Partial<InvoiceCreate>
  onSuccess?: () => void
  onCancel?: () => void
  isOpen: boolean
  onClose: () => void
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  invoice,
  initialData,
  onSuccess,
  onCancel,
  isOpen,
  onClose
}) => {
  // API hooks
  const createInvoice = useCreateInvoice()
  const updateInvoice = useUpdateInvoice()
  const isEditing = !!invoice?.invoice_id
  const { user } = useAuth()

  // Fetch accounts and contacts
  const { data: accountsData } = useAccounts(1, 100)
  const { data: contactsData } = useContacts(1, 100)
  
  const [formData, setFormData] = useState<InvoiceCreate>({
    invoice_number: invoice?.invoice_number || '',
    po_number: invoice?.po_number || '',
    status: invoice?.status || 'draft',
    customer: invoice?.customer || undefined,
    sales_order: invoice?.sales_order || undefined,
    estimate: invoice?.estimate || undefined,
    account: invoice?.account || 0,
    contact: invoice?.contact || undefined,
    deal: invoice?.deal || undefined,
    owner: invoice?.owner || (user?.id ? parseInt(user.id) : undefined),
    invoice_date: invoice?.invoice_date || new Date().toISOString().split('T')[0],
    due_date: invoice?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    payment_terms: invoice?.payment_terms || 'net_30',
    custom_payment_terms: invoice?.custom_payment_terms || '',
    billing_attention: invoice?.billing_attention || '',
    billing_street: invoice?.billing_street || '',
    billing_city: invoice?.billing_city || '',
    billing_state_province: invoice?.billing_state_province || '',
    billing_zip_postal_code: invoice?.billing_zip_postal_code || '',
    billing_country: invoice?.billing_country || '',
    shipping_attention: invoice?.shipping_attention || '',
    shipping_street: invoice?.shipping_street || '',
    shipping_city: invoice?.shipping_city || '',
    shipping_state_province: invoice?.shipping_state_province || '',
    shipping_zip_postal_code: invoice?.shipping_zip_postal_code || '',
    shipping_country: invoice?.shipping_country || '',
    shipping_fee: invoice?.shipping_fee || '0.00',
    shipping_vat_rate: invoice?.shipping_vat_rate || '20.00',
    rush_fee: invoice?.rush_fee || '0.00',
    notes: invoice?.notes || '',
    terms_conditions: invoice?.terms_conditions || '',
    reference_number: invoice?.reference_number || ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddresses, setShowAddresses] = useState(false)

  // Load data for editing
  useEffect(() => {
    if (invoice || initialData) {
      const data = { ...invoice, ...initialData }
      setFormData({
        invoice_number: data?.invoice_number || '',
        po_number: data?.po_number || '',
        status: data?.status || 'draft',
        customer: data?.customer || undefined,
        sales_order: data?.sales_order || undefined,
        estimate: data?.estimate || undefined,
        account: data?.account || 0,
        contact: data?.contact || undefined,
        deal: data?.deal || undefined,
        owner: data?.owner || (user?.id ? parseInt(user.id) : undefined),
        invoice_date: data?.invoice_date || new Date().toISOString().split('T')[0],
        due_date: data?.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        payment_terms: data?.payment_terms || 'net_30',
        custom_payment_terms: data?.custom_payment_terms || '',
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
        shipping_fee: data?.shipping_fee || '0.00',
        shipping_vat_rate: data?.shipping_vat_rate || '20.00',
        rush_fee: data?.rush_fee || '0.00',
        notes: data?.notes || '',
        terms_conditions: data?.terms_conditions || '',
        reference_number: data?.reference_number || ''
      })
      // Show addresses if they exist
      if (data?.billing_street || data?.shipping_street) {
        setShowAddresses(true)
      }
    }
  }, [invoice, initialData, user])

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
        contact: undefined,
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
    
    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required'
    }
    
    if (formData.payment_terms === 'custom' && !formData.custom_payment_terms) {
      newErrors.custom_payment_terms = 'Custom payment terms are required'
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
      if (isEditing && invoice?.invoice_id) {
        await updateInvoice.mutateAsync({ id: invoice.invoice_id, data: formData })
      } else {
        await createInvoice.mutateAsync(formData)
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving invoice:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof InvoiceCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }

    // Auto-calculate due date based on payment terms
    if (field === 'payment_terms' && formData.invoice_date) {
      const invoiceDate = new Date(formData.invoice_date)
      let daysToAdd = 30
      
      switch(value) {
        case 'net_15': daysToAdd = 15; break
        case 'net_30': daysToAdd = 30; break
        case 'net_45': daysToAdd = 45; break
        case 'net_60': daysToAdd = 60; break
        case 'due_on_receipt': daysToAdd = 0; break
        default: daysToAdd = 30
      }
      
      const dueDate = new Date(invoiceDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000)
      setFormData(prev => ({ ...prev, due_date: dueDate.toISOString().split('T')[0] }))
    }
  }

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'partial', label: 'Partial' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const paymentTermsOptions = [
    { value: 'due_on_receipt', label: 'Due on Receipt' },
    { value: 'net_15', label: 'Net 15' },
    { value: 'net_30', label: 'Net 30' },
    { value: 'net_45', label: 'Net 45' },
    { value: 'net_60', label: 'Net 60' },
    { value: 'custom', label: 'Custom' }
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

  const isLoading = createInvoice.isPending || updateInvoice.isPending || isSubmitting

  return (
    <FormSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Invoice' : 'Create New Invoice'}
      subtitle={isEditing ? 'Update invoice information' : 'Add a new invoice for your customer'}
    >
      <form onSubmit={handleSubmit}>
        {/* Customer Selection Section */}
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
              name="invoice_number"
              label="Invoice Number"
              value={formData.invoice_number}
              onChange={handleInputChange}
              placeholder="Leave blank to auto-generate"
              error={errors.invoice_number}
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
              <div />
            )}
          </TwoColumnGrid>
        </FormSection>

        {/* Dates & Payment Section */}
        <FormSection title="Dates & Payment Terms">
          <TwoColumnGrid>
            <FormField
              name="invoice_date"
              label="Invoice Date"
              type="date"
              value={formData.invoice_date}
              onChange={handleInputChange}
              error={errors.invoice_date}
              required
            />

            <FormField
              name="due_date"
              label="Due Date"
              type="date"
              value={formData.due_date}
              onChange={handleInputChange}
              error={errors.due_date}
            />
          </TwoColumnGrid>

          <TwoColumnGrid className="mt-4">
            <FormField
              name="payment_terms"
              label="Payment Terms"
              as="select"
              value={formData.payment_terms}
              onChange={handleInputChange}
              options={paymentTermsOptions}
              error={errors.payment_terms}
            />

            {formData.payment_terms === 'custom' && (
              <FormField
                name="custom_payment_terms"
                label="Custom Terms"
                value={formData.custom_payment_terms || ''}
                onChange={handleInputChange}
                placeholder="Enter custom payment terms"
                error={errors.custom_payment_terms}
                required
              />
            )}
          </TwoColumnGrid>

          <UserSelect
            label="Owner"
            value={formData.owner}
            onChange={(userId) => handleInputChange('owner', userId)}
            error={errors.owner}
            disabled={!!formData.customer}
          />
        </FormSection>

        {/* Reference Information */}
        {(formData.estimate || formData.sales_order) && (
          <FormSection title="Reference Information">
            <FormField
              name="reference_number"
              label="Reference Number"
              value={formData.reference_number || ''}
              onChange={handleInputChange}
              placeholder="Original document number"
              disabled
            />
          </FormSection>
        )}

        {/* Address Information Section */}
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

        {/* Fees Section */}
        <FormSection title="Additional Fees">
          <ThreeColumnGrid>
            <FormField
              name="shipping_fee"
              label="Shipping Fee"
              type="number"
              step="0.01"
              value={formData.shipping_fee}
              onChange={handleInputChange}
              placeholder="0.00"
              error={errors.shipping_fee}
            />

            <FormField
              name="shipping_vat_rate"
              label="Shipping VAT %"
              type="number"
              step="0.01"
              value={formData.shipping_vat_rate}
              onChange={handleInputChange}
              placeholder="20.00"
              error={errors.shipping_vat_rate}
            />

            <FormField
              name="rush_fee"
              label="Rush Fee"
              type="number"
              step="0.01"
              value={formData.rush_fee}
              onChange={handleInputChange}
              placeholder="0.00"
              error={errors.rush_fee}
            />
          </ThreeColumnGrid>
        </FormSection>

        {/* Additional Information Section */}
        <FormSection title="Additional Information">
          <FormField
            name="notes"
            label="Notes"
            as="textarea"
            value={formData.notes || ''}
            onChange={handleInputChange}
            placeholder="Internal notes about this invoice"
            error={errors.notes}
            rows={3}
          />

          <FormField
            name="terms_conditions"
            label="Terms & Conditions"
            as="textarea"
            value={formData.terms_conditions || ''}
            onChange={handleInputChange}
            placeholder="Terms and conditions for this invoice"
            error={errors.terms_conditions}
            rows={4}
          />
        </FormSection>

        {/* Action Buttons */}
        {isEditing ? (
          <EditFormActions
            onCancel={onCancel}
            isSubmitting={isLoading}
            disabled={(!formData.customer && !formData.account) || !formData.invoice_date}
          />
        ) : (
          <CreateFormActions
            onCancel={onCancel}
            isSubmitting={isLoading}
            disabled={(!formData.customer && !formData.account) || !formData.invoice_date}
          />
        )}
      </form>
    </FormSidePanel>
  )
}

export default InvoiceForm