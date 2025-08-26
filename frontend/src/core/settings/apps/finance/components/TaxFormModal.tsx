import React, { useState, useEffect } from 'react'
import { FormModal } from '@/shared/components/modals/FormModal'
import { Button } from '@/shared/components/buttons/Button'
import { Tax, TaxCreate, TaxUpdate, useCreateTax, useUpdateTax } from '../api/taxApi'
import { toast } from 'react-hot-toast'

interface TaxFormModalProps {
  isOpen: boolean
  onClose: () => void
  tax?: Tax
  onSuccess?: () => void
}

export const TaxFormModal: React.FC<TaxFormModalProps> = ({
  isOpen,
  onClose,
  tax,
  onSuccess
}) => {
  const isEdit = !!tax
  const [formData, setFormData] = useState<TaxCreate>({
    tax_name: '',
    tax_percentage: '',
    tax_type: 'tax',
    is_value_added: true,
    is_editable: true,
    is_active: true,
    country: 'United Kingdom',
    country_code: 'UK',
    description: ''
  })

  const createMutation = useCreateTax()
  const updateMutation = useUpdateTax()

  // Reset form when modal opens/closes or tax changes
  useEffect(() => {
    if (isOpen) {
      if (tax) {
        setFormData({
          tax_name: tax.tax_name,
          tax_percentage: tax.tax_percentage,
          tax_type: tax.tax_type,
          is_value_added: tax.is_value_added,
          is_editable: tax.is_editable,
          is_active: tax.is_active,
          country: tax.country || 'United Kingdom',
          country_code: tax.country_code || 'UK',
          description: tax.description || ''
        })
      } else {
        setFormData({
          tax_name: '',
          tax_percentage: '',
          tax_type: 'tax',
          is_value_added: true,
          is_editable: true,
          is_active: true,
          country: 'United Kingdom',
          country_code: 'UK',
          description: ''
        })
      }
    }
  }, [isOpen, tax])

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!formData.tax_name || !formData.tax_percentage) {
      toast.error('Tax name and rate are required')
      return
    }

    const percentage = parseFloat(formData.tax_percentage)
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      toast.error('Tax rate must be between 0 and 100')
      return
    }

    try {
      if (isEdit && tax) {
        await updateMutation.mutateAsync({
          taxId: tax.tax_id,
          data: formData
        })
        toast.success('Tax updated successfully')
      } else {
        await createMutation.mutateAsync(formData)
        toast.success('Tax created successfully')
      }

      onSuccess?.()
      onClose()
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'An error occurred'
      toast.error(errorMessage)
    }
  }

  const isLoading = createMutation.isPending || updateMutation.isPending

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Tax' : 'Create New Tax'}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* VAT Name */}
        <div>
          <label htmlFor="tax_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            VAT Name
          </label>
          <input
            type="text"
            id="tax_name"
            value={formData.tax_name}
            onChange={(e) => handleInputChange('tax_name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., VAT Standard Rate"
            required
          />
        </div>

        {/* Rate (%) */}
        <div>
          <label htmlFor="tax_percentage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Rate (%)
          </label>
          <input
            type="number"
            id="tax_percentage"
            value={formData.tax_percentage}
            onChange={(e) => handleInputChange('tax_percentage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="e.g., 20"
            step="0.01"
            min="0"
            max="100"
            required
          />
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isLoading ? 'Saving...' : (isEdit ? 'Update Tax' : 'Create Tax')}
          </Button>
        </div>
      </form>
    </FormModal>
  )
}