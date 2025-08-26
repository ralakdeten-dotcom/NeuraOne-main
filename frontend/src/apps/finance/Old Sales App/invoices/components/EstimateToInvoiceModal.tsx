import React, { useState } from 'react'
import { FormField, Button } from '@/shared'
import { useCreateFromEstimate, EstimateToInvoiceData } from '../api'

interface EstimateToInvoiceModalProps {
  estimateId: number
  estimateNumber: string
  isOpen: boolean
  onClose: () => void
  onSuccess: (invoiceId: number) => void
}

export const EstimateToInvoiceModal: React.FC<EstimateToInvoiceModalProps> = ({
  estimateId,
  estimateNumber,
  isOpen,
  onClose,
  onSuccess
}) => {
  const createFromEstimate = useCreateFromEstimate()
  
  const [formData, setFormData] = useState<EstimateToInvoiceData>({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    payment_terms: 'net_30',
    status: 'draft'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Auto-calculate due date when payment terms or invoice date changes
  React.useEffect(() => {
    if (formData.invoice_date && formData.payment_terms && !formData.due_date) {
      const invoiceDate = new Date(formData.invoice_date)
      let daysToAdd = 30 // default

      switch (formData.payment_terms) {
        case 'net_15':
          daysToAdd = 15
          break
        case 'net_30':
          daysToAdd = 30
          break
        case 'net_45':
          daysToAdd = 45
          break
        case 'net_60':
          daysToAdd = 60
          break
        case 'due_on_receipt':
          daysToAdd = 0
          break
      }

      const dueDate = new Date(invoiceDate)
      dueDate.setDate(dueDate.getDate() + daysToAdd)
      
      setFormData(prev => ({ ...prev, due_date: dueDate.toISOString().split('T')[0] }))
    }
  }, [formData.invoice_date, formData.payment_terms])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Basic validation
    const newErrors: Record<string, string> = {}
    
    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required'
    }
    
    if (formData.invoice_date && formData.due_date && formData.due_date <= formData.invoice_date) {
      newErrors.due_date = 'Due date must be after invoice date'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    try {
      const result = await createFromEstimate.mutateAsync({
        estimateId,
        data: formData
      })
      alert(`Invoice "${result.invoice_number}" created successfully from estimate "${estimateNumber}"`)
      onSuccess(result.invoice_id)
      onClose()
    } catch (error: any) {
      console.error('Error creating invoice from estimate:', error)
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error occurred'
      alert(`Error creating invoice: ${errorMessage}`)
    }
  }

  const handleChange = (field: keyof EstimateToInvoiceData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const paymentTermsOptions = [
    { value: 'net_15', label: 'Net 15' },
    { value: 'net_30', label: 'Net 30' },
    { value: 'net_45', label: 'Net 45' },
    { value: 'net_60', label: 'Net 60' },
    { value: 'due_on_receipt', label: 'Due on Receipt' },
    { value: 'custom', label: 'Custom Terms' }
  ]

  const statusOptions = [
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' }
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
            Convert Estimate to Invoice
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            Convert estimate "{estimateNumber}" to an invoice. All line items and details will be copied over.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Invoice Number */}
              <FormField
                label="Invoice Number"
                type="text"
                value={formData.invoice_number || ''}
                onChange={(value) => handleChange('invoice_number', value)}
                error={errors.invoice_number}
                placeholder="Auto-generated if empty"
                helpText="Leave empty to auto-generate"
              />

              {/* PO Number */}
              <FormField
                label="PO Number"
                type="text"
                value={formData.po_number || ''}
                onChange={(value) => handleChange('po_number', value)}
                error={errors.po_number}
                placeholder="Purchase order number"
              />

              {/* Invoice Date */}
              <FormField
                label="Invoice Date"
                type="date"
                value={formData.invoice_date}
                onChange={(value) => handleChange('invoice_date', value)}
                error={errors.invoice_date}
                required
              />

              {/* Due Date */}
              <FormField
                label="Due Date"
                type="date"
                value={formData.due_date || ''}
                onChange={(value) => handleChange('due_date', value)}
                error={errors.due_date}
                helpText="Auto-calculated from payment terms"
              />

              {/* Payment Terms */}
              <FormField
                label="Payment Terms"
                type="select"
                value={formData.payment_terms || 'net_30'}
                onChange={(value) => handleChange('payment_terms', value)}
                options={paymentTermsOptions}
                error={errors.payment_terms}
              />

              {/* Status */}
              <FormField
                label="Initial Status"
                type="select"
                value={formData.status || 'draft'}
                onChange={(value) => handleChange('status', value)}
                options={statusOptions}
                error={errors.status}
              />
            </div>

            {/* Custom Payment Terms */}
            {formData.payment_terms === 'custom' && (
              <FormField
                label="Custom Payment Terms"
                type="textarea"
                value={formData.custom_payment_terms || ''}
                onChange={(value) => handleChange('custom_payment_terms', value)}
                error={errors.custom_payment_terms}
                placeholder="Describe custom payment terms"
                rows={2}
              />
            )}

            {/* Reference Number */}
            <FormField
              label="Reference Number"
              type="text"
              value={formData.reference_number || ''}
              onChange={(value) => handleChange('reference_number', value)}
              error={errors.reference_number}
              placeholder="External reference"
            />

            {/* Notes */}
            <FormField
              label="Notes"
              type="textarea"
              value={formData.notes || ''}
              onChange={(value) => handleChange('notes', value)}
              error={errors.notes}
              placeholder="Additional notes for the invoice"
              rows={3}
            />

            {/* Terms & Conditions */}
            <FormField
              label="Terms & Conditions"
              type="textarea"
              value={formData.terms_conditions || ''}
              onChange={(value) => handleChange('terms_conditions', value)}
              error={errors.terms_conditions}
              placeholder="Terms and conditions for the invoice"
              rows={3}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={createFromEstimate.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                disabled={createFromEstimate.isPending}
              >
                {createFromEstimate.isPending ? 'Creating Invoice...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default EstimateToInvoiceModal