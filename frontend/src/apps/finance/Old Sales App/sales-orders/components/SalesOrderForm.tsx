import React, { useState, useEffect } from 'react'
import { FormField, FormSection, TwoColumnGrid, ThreeColumnGrid, CreateFormActions, EditFormActions, FormSidePanel } from '@/shared'
import { UserSelect, CustomerSelect } from '@/shared'
import { SalesOrderCreate, SalesOrder, useCreateSalesOrder, useUpdateSalesOrder } from '../api'
import { useContacts } from '@/apps/crm/contacts/api'
import { useAuth } from '@/core/auth/AuthProvider'
import { type Customer } from '@/apps/finance/Old Sales App/customers/api'

interface SalesOrderFormProps {
  salesOrder?: Partial<SalesOrder>
  initialData?: Partial<SalesOrderCreate>
  onSuccess?: () => void
  onCancel?: () => void
  isOpen: boolean
  onClose: () => void
}

export const SalesOrderForm: React.FC<SalesOrderFormProps> = ({
  salesOrder,
  initialData,
  onSuccess,
  onCancel,
  isOpen,
  onClose
}) => {
  // API hooks
  const createSalesOrder = useCreateSalesOrder()
  const updateSalesOrder = useUpdateSalesOrder()
  const isEditing = !!salesOrder?.sales_order_id
  const { user } = useAuth()

  // Fetch contacts for filtering
  const { data: contactsData } = useContacts(1, 100)
  
  const [formData, setFormData] = useState<SalesOrderCreate>({
    sales_order_number: salesOrder?.sales_order_number || '',
    reference_number: salesOrder?.reference_number || '',
    po_number: salesOrder?.po_number || '',
    status: salesOrder?.status || 'draft', // Default to draft
    estimate: salesOrder?.estimate || undefined,
    customer: salesOrder?.customer || undefined,
    account: salesOrder?.account || 0, // Required field, 0 will be replaced when customer is selected
    contact: salesOrder?.contact || undefined,
    deal: salesOrder?.deal || undefined,
    owner: salesOrder?.owner || (user?.id ? parseInt(user.id) : undefined), // Auto-populate with current user
    sales_order_date: salesOrder?.sales_order_date || new Date().toISOString().split('T')[0],
    expected_shipment_date: salesOrder?.expected_shipment_date || undefined,
    payment_terms: salesOrder?.payment_terms || 'net_30',
    custom_payment_terms: salesOrder?.custom_payment_terms || undefined,
    delivery_method: salesOrder?.delivery_method || 'standard',
    custom_delivery_method: salesOrder?.custom_delivery_method || undefined,
    billing_attention: salesOrder?.billing_attention || undefined,
    billing_street: salesOrder?.billing_street || undefined,
    billing_city: salesOrder?.billing_city || undefined,
    billing_state_province: salesOrder?.billing_state_province || undefined,
    billing_zip_postal_code: salesOrder?.billing_zip_postal_code || undefined,
    billing_country: salesOrder?.billing_country || undefined,
    shipping_attention: salesOrder?.shipping_attention || undefined,
    shipping_street: salesOrder?.shipping_street || undefined,
    shipping_city: salesOrder?.shipping_city || undefined,
    shipping_state_province: salesOrder?.shipping_state_province || undefined,
    shipping_zip_postal_code: salesOrder?.shipping_zip_postal_code || undefined,
    shipping_country: salesOrder?.shipping_country || undefined,
    customer_notes: salesOrder?.customer_notes || undefined,
    terms_conditions: salesOrder?.terms_conditions || undefined,
    internal_notes: salesOrder?.internal_notes || undefined
  })

  const [errors, setErrors] = useState<Record<string, string>>({})  
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showAddresses, setShowAddresses] = useState(false)
  const [showCustomPaymentTerms, setShowCustomPaymentTerms] = useState(false)
  const [showCustomDeliveryMethod, setShowCustomDeliveryMethod] = useState(false)

  // Load data for editing
  useEffect(() => {
    if (salesOrder || initialData) {
      const data = { ...salesOrder, ...initialData }
      setFormData({
        sales_order_number: data?.sales_order_number || '',
        reference_number: data?.reference_number || '',
        po_number: data?.po_number || '',
        status: data?.status || 'draft',
        estimate: data?.estimate || undefined,
        customer: data?.customer || undefined,
        account: data?.account || 0, // Account is required
        contact: data?.contact || undefined,
        deal: data?.deal || undefined,
        owner: data?.owner || (user?.id ? parseInt(user.id) : undefined),
        sales_order_date: data?.sales_order_date || new Date().toISOString().split('T')[0],
        expected_shipment_date: data?.expected_shipment_date || undefined,
        payment_terms: data?.payment_terms || 'net_30',
        custom_payment_terms: data?.custom_payment_terms || undefined,
        delivery_method: data?.delivery_method || 'standard',
        custom_delivery_method: data?.custom_delivery_method || undefined,
        billing_attention: data?.billing_attention || undefined,
        billing_street: data?.billing_street || undefined,
        billing_city: data?.billing_city || undefined,
        billing_state_province: data?.billing_state_province || undefined,
        billing_zip_postal_code: data?.billing_zip_postal_code || undefined,
        billing_country: data?.billing_country || undefined,
        shipping_attention: data?.shipping_attention || undefined,
        shipping_street: data?.shipping_street || undefined,
        shipping_city: data?.shipping_city || undefined,
        shipping_state_province: data?.shipping_state_province || undefined,
        shipping_zip_postal_code: data?.shipping_zip_postal_code || undefined,
        shipping_country: data?.shipping_country || undefined,
        customer_notes: data?.customer_notes || undefined,
        terms_conditions: data?.terms_conditions || undefined,
        internal_notes: data?.internal_notes || undefined
      })
      // Show addresses if they exist
      if (data?.billing_street || data?.shipping_street) {
        setShowAddresses(true)
      }
      // Show custom fields if needed
      if (data?.payment_terms === 'custom') {
        setShowCustomPaymentTerms(true)
      }
      if (data?.delivery_method === 'custom') {
        setShowCustomDeliveryMethod(true)
      }
    }
  }, [salesOrder, initialData, user])

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
    
    // Account is required and must be a valid ID (not 0)
    if (!formData.account || formData.account === 0) {
      newErrors.account = 'Account is required. Please select a customer to auto-populate the account.'
    }
    
    if (!formData.sales_order_date) {
      newErrors.sales_order_date = 'Sales order date is required'
    }

    if (formData.payment_terms === 'custom' && !formData.custom_payment_terms) {
      newErrors.custom_payment_terms = 'Custom payment terms are required'
    }

    if (formData.delivery_method === 'custom' && !formData.custom_delivery_method) {
      newErrors.custom_delivery_method = 'Custom delivery method is required'
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
      // Clean up the form data before sending
      const cleanedData: any = {}
      Object.keys(formData).forEach((key) => {
        const value = (formData as any)[key]
        
        // Handle different field types
        if (key === 'account') {
          // Account is required and must not be 0
          if (value && value !== 0) {
            cleanedData[key] = value
          }
        } else if (value !== undefined && value !== '') {
          cleanedData[key] = value
        } else if (key === 'status' || key === 'sales_order_date' || key === 'payment_terms' || key === 'delivery_method') {
          // These fields always need a value
          cleanedData[key] = value || (key === 'status' ? 'draft' : key === 'payment_terms' ? 'net_30' : key === 'delivery_method' ? 'standard' : new Date().toISOString().split('T')[0])
        }
      })

      console.log('Submitting sales order with data:', cleanedData)

      if (isEditing && salesOrder?.sales_order_id) {
        // Ensure account is included for updates if it exists
        if (salesOrder.account && !cleanedData.account) {
          cleanedData.account = salesOrder.account
        }
        await updateSalesOrder.mutateAsync({ id: salesOrder.sales_order_id, ...cleanedData })
      } else {
        await createSalesOrder.mutateAsync(cleanedData)
      }
      
      onSuccess?.()
    } catch (error) {
      console.error('Error saving sales order:', error)
      // Error handling is done by the mutation hooks
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof SalesOrderCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
    
    // Handle special cases
    if (field === 'payment_terms') {
      setShowCustomPaymentTerms(value === 'custom')
    }
    if (field === 'delivery_method') {
      setShowCustomDeliveryMethod(value === 'custom')
    }
  }

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ]

  const paymentTermsOptions = [
    { value: 'net_15', label: 'Net 15' },
    { value: 'net_30', label: 'Net 30' },
    { value: 'net_45', label: 'Net 45' },
    { value: 'net_60', label: 'Net 60' },
    { value: 'due_on_receipt', label: 'Due on Receipt' },
    { value: 'custom', label: 'Custom Terms' }
  ]

  const deliveryMethodOptions = [
    { value: 'standard', label: 'Standard Shipping' },
    { value: 'express', label: 'Express Shipping' },
    { value: 'overnight', label: 'Overnight Delivery' },
    { value: 'pickup', label: 'Customer Pickup' },
    { value: 'custom', label: 'Custom Delivery' }
  ]

  // Account options are created from API data but not directly used in template
  // (used in CustomerSelect internally)

  // Filter contacts by selected customer's account
  const contactOptions = contactsData?.results?.filter(contact => 
    formData.account && contact.account === formData.account
  ).map(contact => ({
    value: contact.contact_id,
    label: `${contact.first_name} ${contact.last_name}`.trim()
  })) || []

  const isLoading = createSalesOrder.isPending || updateSalesOrder.isPending || isSubmitting

  return (
    <FormSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Sales Order' : 'Create New Sales Order'}
      subtitle={isEditing ? 'Update sales order information' : 'Add a new sales order for your customer'}
    >
      <form onSubmit={handleSubmit}>
        {/* Customer Selection Section - Priority */}
        <FormSection title="Customer Selection">
          <CustomerSelect
            value={formData.customer}
            onChange={handleCustomerSelect}
            label="Customer"
            placeholder="Select a customer..."
            error={errors.account}
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
          <ThreeColumnGrid>
            <FormField
              name="sales_order_number"
              label="Sales Order #"
              value={formData.sales_order_number}
              onChange={handleInputChange}
              placeholder="Leave blank to auto-generate"
              disabled={isEditing}
              error={errors.sales_order_number}
            />

            <FormField
              name="reference_number"
              label="Reference #"
              value={formData.reference_number || ''}
              onChange={handleInputChange}
              placeholder="Optional reference"
              error={errors.reference_number}
            />

            <FormField
              name="po_number"
              label="PO Number"
              value={formData.po_number || ''}
              onChange={handleInputChange}
              placeholder="Customer PO number"
              error={errors.po_number}
            />
          </ThreeColumnGrid>

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

        {/* Dates & Assignment Section */}
        <FormSection title="Dates & Assignment">
          <TwoColumnGrid>
            <FormField
              name="sales_order_date"
              label="Sales Order Date"
              type="date"
              value={formData.sales_order_date}
              onChange={handleInputChange}
              error={errors.sales_order_date}
              required
            />

            <FormField
              name="expected_shipment_date"
              label="Expected Shipment Date"
              type="date"
              value={formData.expected_shipment_date}
              onChange={handleInputChange}
              error={errors.expected_shipment_date}
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

        {/* Payment & Delivery Section */}
        <FormSection title="Payment & Delivery">
          <TwoColumnGrid>
            <FormField
              name="payment_terms"
              label="Payment Terms"
              as="select"
              value={formData.payment_terms}
              onChange={handleInputChange}
              options={paymentTermsOptions}
              error={errors.payment_terms}
            />

            <FormField
              name="delivery_method"
              label="Delivery Method"
              as="select"
              value={formData.delivery_method}
              onChange={handleInputChange}
              options={deliveryMethodOptions}
              error={errors.delivery_method}
            />
          </TwoColumnGrid>

          {showCustomPaymentTerms && (
            <FormField
              name="custom_payment_terms"
              label="Custom Payment Terms"
              value={formData.custom_payment_terms}
              onChange={handleInputChange}
              className="mt-4"
              error={errors.custom_payment_terms}
              required
            />
          )}

          {showCustomDeliveryMethod && (
            <FormField
              name="custom_delivery_method"
              label="Custom Delivery Method"
              value={formData.custom_delivery_method}
              onChange={handleInputChange}
              className="mt-4"
              error={errors.custom_delivery_method}
              required
            />
          )}
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

        {/* Notes Section */}
        <FormSection title="Notes & Terms">
          <FormField
            name="customer_notes"
            label="Customer Notes"
            as="textarea"
            value={formData.customer_notes}
            onChange={handleInputChange}
            placeholder="Notes visible to the customer"
            rows={3}
            error={errors.customer_notes}
          />

          <FormField
            name="terms_conditions"
            label="Terms & Conditions"
            as="textarea"
            value={formData.terms_conditions}
            onChange={handleInputChange}
            placeholder="Terms and conditions for this sales order"
            rows={3}
            className="mt-4"
            error={errors.terms_conditions}
          />

          <FormField
            name="internal_notes"
            label="Internal Notes"
            as="textarea"
            value={formData.internal_notes}
            onChange={handleInputChange}
            placeholder="Private notes (not visible to customer)"
            rows={3}
            className="mt-4"
            error={errors.internal_notes}
          />
        </FormSection>

        {/* Form Actions */}
        <div className="mt-6">
          {isEditing ? (
            <EditFormActions
              onCancel={onCancel}
              isSubmitting={isLoading}
            />
          ) : (
            <CreateFormActions
              onCancel={onCancel}
              isSubmitting={isLoading}
            />
          )}
        </div>
      </form>
    </FormSidePanel>
  )
}