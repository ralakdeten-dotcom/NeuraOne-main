import React, { useState } from 'react'
import { Plus, MoreHorizontal, Globe, Trash2 } from 'lucide-react'
import { AllSettingsHeader } from '../../../../shared/components/AllSettingsHeader'
import { Button } from '@/shared/components/buttons/Button'
import { CurrencyFormModal } from '../../components/CurrencyFormModal'
import { useCurrencies, useDeleteCurrency, useSetBaseCurrency, Currency } from '../../api/currencyApi'
import { toast } from 'react-hot-toast'

export const CurrencySettings: React.FC = () => {
  const [exchangeRateFeedsEnabled, setExchangeRateFeedsEnabled] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedCurrency, setSelectedCurrency] = useState<Currency | undefined>()

  // API hooks
  const { data: currencies = [], isLoading, error, refetch } = useCurrencies(searchTerm)
  const deleteMutation = useDeleteCurrency()
  const setBaseMutation = useSetBaseCurrency()

  const breadcrumbs = [
    { label: 'All Settings' },
    { label: 'Setup & Configurations' },
    { label: 'Currencies' }
  ]

  const handleNewCurrency = () => {
    setSelectedCurrency(undefined)
    setIsModalOpen(true)
  }

  const handleEditCurrency = (currency: Currency) => {
    setSelectedCurrency(currency)
    setIsModalOpen(true)
  }

  const handleDeleteCurrency = async (currency: Currency) => {
    if (currency.is_base_currency) {
      toast.error('Base currency cannot be deleted')
      return
    }

    if (confirm(`Are you sure you want to delete ${currency.currency_code}? This action cannot be undone.`)) {
      try {
        await deleteMutation.mutateAsync(currency.currency_id)
        toast.success('Currency deleted successfully')
      } catch (error: any) {
        const errorMessage = error.response?.data?.message || 'Failed to delete currency'
        toast.error(errorMessage)
      }
    }
  }

  const handleSetBaseCurrency = async (currency: Currency) => {
    if (currency.is_base_currency) return

    try {
      await setBaseMutation.mutateAsync(currency.currency_id)
      toast.success(`${currency.currency_code} set as base currency`)
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to set base currency'
      toast.error(errorMessage)
    }
  }

  const handleModalSuccess = () => {
    refetch()
  }

  const handleToggleExchangeRates = () => {
    setExchangeRateFeedsEnabled(!exchangeRateFeedsEnabled)
  }

  const rightActions = (
    <div className="flex items-center space-x-3">
      <Button
        variant="secondary"
        size="sm"
        onClick={handleToggleExchangeRates}
      >
        {exchangeRateFeedsEnabled ? 'Disable' : 'Enable'} Exchange Rate Feeds
      </Button>
      <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <MoreHorizontal className="w-5 h-5" />
      </button>
    </div>
  )

  const actions = (
    <Button
      onClick={handleNewCurrency}
      className="bg-blue-600 hover:bg-blue-700 text-white"
      size="sm"
    >
      <Plus className="w-4 h-4 mr-2" />
      New Currency
    </Button>
  )

  return (
    <div className="bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search settings..."
        title="Currencies"
        breadcrumbs={breadcrumbs}
        actions={actions}
        rightActions={rightActions}
      />

      <div className="p-1">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
          {/* Currency Settings Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Currencies</h3>
              <div className="flex items-center space-x-3">
                <Button
                  onClick={handleNewCurrency}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Currency
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleToggleExchangeRates}
                >
                  {exchangeRateFeedsEnabled ? 'Disable' : 'Enable'} Exchange Rate Feeds
                </Button>
                <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
          {/* Loading State */}
          {isLoading && (
            <div className="px-6 py-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400">Loading currencies...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="px-6 py-12 text-center">
              <div className="text-red-500 mb-4">
                <Globe className="w-12 h-12 mx-auto mb-2" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Failed to load currencies
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Please try again or check your connection.
              </p>
              <Button onClick={() => refetch()} variant="secondary">
                Try Again
              </Button>
            </div>
          )}

          {/* Table with Data */}
          {!isLoading && !error && (
            <>
              {/* Table Header */}
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-2 gap-4 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <div>NAME</div>
                  <div>SYMBOL</div>
                </div>
              </div>

              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {currencies.map((currency) => (
                  <div
                    key={currency.currency_id}
                    className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer group"
                    onClick={() => handleEditCurrency(currency)}
                  >
                    <div className="grid grid-cols-2 gap-4 items-center">
                      <div className="flex items-center space-x-2">
                        <span className="text-blue-600 dark:text-blue-400 font-medium">
                          {currency.currency_code}- {currency.currency_name.replace(`${currency.currency_code}- `, '')}
                        </span>
                        {currency.is_base_currency && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500 text-white">
                            Base Currency
                          </span>
                        )}
                        {/* Action buttons - visible on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1 ml-auto">
                          {!currency.is_base_currency && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSetBaseCurrency(currency)
                              }}
                              disabled={setBaseMutation.isPending}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium hover:underline disabled:opacity-50"
                              title="Set as base currency"
                            >
                              Set as Base
                            </button>
                          )}
                          {!currency.is_base_currency && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDeleteCurrency(currency)
                              }}
                              disabled={deleteMutation.isPending}
                              className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded disabled:opacity-50"
                              title="Delete currency"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-gray-900 dark:text-white font-medium">
                        {currency.currency_symbol}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Empty state if no currencies */}
          {!isLoading && !error && currencies.length === 0 && (
            <div className="px-6 py-12 text-center">
              <Globe className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No currencies configured
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Add currencies to support multi-currency transactions.
              </p>
              <Button
                onClick={handleNewCurrency}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Currency
              </Button>
            </div>
          )}

        </div>

        {/* Additional Info */}
       
      </div>

      {/* Currency Form Modal */}
      <CurrencyFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currency={selectedCurrency}
        onSuccess={handleModalSuccess}
      />
    </div>
  )
}