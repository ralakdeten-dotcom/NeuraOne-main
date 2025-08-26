import React, { useState, useEffect } from 'react'
import { FormModal } from '@/shared/components/modals/FormModal'
import { Button } from '@/shared/components/buttons/Button'
import { Currency, CurrencyCreate, CurrencyUpdate, useCreateCurrency, useUpdateCurrency } from '../api/currencyApi'
import { toast } from 'react-hot-toast'

interface CurrencyFormModalProps {
  isOpen: boolean
  onClose: () => void
  currency?: Currency
  onSuccess?: () => void
}

export const CurrencyFormModal: React.FC<CurrencyFormModalProps> = ({
  isOpen,
  onClose,
  currency,
  onSuccess
}) => {
  const isEdit = !!currency
  const [formData, setFormData] = useState<CurrencyCreate | CurrencyUpdate>({
    currency_code: '',
    currency_symbol: '',
    currency_name: '',
    price_precision: 2,
    currency_format: '1,234,567.89',
    is_base_currency: false,
    exchange_rate: '1.0',
    effective_date: ''
  })

  const createMutation = useCreateCurrency()
  const updateMutation = useUpdateCurrency()

  // Reset form when modal opens/closes or currency changes
  useEffect(() => {
    if (isOpen) {
      if (currency) {
        setFormData({
          currency_code: currency.currency_code,
          currency_symbol: currency.currency_symbol,
          currency_name: currency.currency_name,
          price_precision: currency.price_precision,
          currency_format: currency.currency_format,
          is_base_currency: currency.is_base_currency,
          exchange_rate: currency.exchange_rate,
          effective_date: currency.effective_date || ''
        })
      } else {
        setFormData({
          currency_code: '',
          currency_symbol: '',
          currency_name: '',
          price_precision: 2,
          currency_format: '1,234,567.89',
          is_base_currency: false,
          exchange_rate: '1.0',
          effective_date: ''
        })
      }
    }
  }, [isOpen, currency])

  const handleInputChange = (field: keyof typeof formData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Basic validation
    if (!formData.currency_code || !formData.currency_symbol) {
      toast.error('Currency code and symbol are required')
      return
    }

    try {
      if (isEdit && currency) {
        await updateMutation.mutateAsync({
          currencyId: currency.currency_id,
          data: formData
        })
        toast.success('Currency updated successfully')
      } else {
        await createMutation.mutateAsync(formData as CurrencyCreate)
        toast.success('Currency created successfully')
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
      title={isEdit ? 'Edit Currency' : 'Add New Currency'}
      subtitle={isEdit ? 'Update currency information' : 'Add a new currency to your organization'}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Currency Code */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency Code *
          </label>
          <input
            type="text"
            value={formData.currency_code}
            onChange={(e) => handleInputChange('currency_code', e.target.value.toUpperCase())}
            placeholder="e.g., USD, EUR, GBP"
            maxLength={10}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
            required
            disabled={isLoading}
          />
        </div>

        {/* Currency Symbol */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency Symbol *
          </label>
          <input
            type="text"
            value={formData.currency_symbol}
            onChange={(e) => handleInputChange('currency_symbol', e.target.value)}
            placeholder="e.g., $, €, £"
            maxLength={4}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
            required
            disabled={isLoading}
          />
        </div>

        {/* Currency Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency Name
          </label>
          <input
            type="text"
            value={formData.currency_name}
            onChange={(e) => handleInputChange('currency_name', e.target.value)}
            placeholder="e.g., USD- United States Dollar"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isLoading}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Will be auto-generated if not provided
          </p>
        </div>

        {/* Price Precision */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Price Precision (Decimal Places)
          </label>
          <select
            value={formData.price_precision}
            onChange={(e) => handleInputChange('price_precision', parseInt(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value={0}>0 (e.g., ¥1234)</option>
            <option value={1}>1 (e.g., $123.4)</option>
            <option value={2}>2 (e.g., $123.45)</option>
            <option value={3}>3 (e.g., $123.456)</option>
            <option value={4}>4 (e.g., $123.4567)</option>
          </select>
        </div>

        {/* Currency Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Currency Format
          </label>
          <select
            value={formData.currency_format}
            onChange={(e) => handleInputChange('currency_format', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          >
            <option value="1,234,567.89">1,234,567.89 (US/UK format)</option>
            <option value="1.234.567,89">1.234.567,89 (European format)</option>
            <option value="1,23,45,678.90">1,23,45,678.90 (Indian format)</option>
            <option value="1,234,567">1,234,567 (No decimals)</option>
          </select>
        </div>

        {/* Exchange Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Exchange Rate
          </label>
          <input
            type="number"
            step="0.0001"
            min="0"
            value={formData.exchange_rate}
            onChange={(e) => handleInputChange('exchange_rate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading || formData.is_base_currency}
          />
          {formData.is_base_currency && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Base currency exchange rate is always 1.0
            </p>
          )}
        </div>

        {/* Effective Date */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Effective Date
          </label>
          <input
            type="date"
            value={formData.effective_date}
            onChange={(e) => handleInputChange('effective_date', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
        </div>

        {/* Base Currency Toggle */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="is_base_currency"
            checked={formData.is_base_currency}
            onChange={(e) => {
              const isBase = e.target.checked
              handleInputChange('is_base_currency', isBase)
              if (isBase) {
                handleInputChange('exchange_rate', '1.0')
              }
            }}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded 
                     focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 
                     dark:bg-gray-700 dark:border-gray-600"
            disabled={isLoading}
          />
          <label htmlFor="is_base_currency" className="text-sm text-gray-700 dark:text-gray-300">
            Set as base currency
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
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
          >
            {isLoading ? 'Saving...' : isEdit ? 'Update Currency' : 'Add Currency'}
          </Button>
        </div>
      </form>
    </FormModal>
  )
}