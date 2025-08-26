import React from 'react'
import { X } from 'lucide-react'

interface VendorFiltersProps {
  filters: Record<string, string>
  onFilterChange: (key: string, value: string) => void
  onClearFilters: () => void
}

export const VendorFilters: React.FC<VendorFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <div className="flex items-center gap-2">
      {/* Type Filter */}
      <select
        value={filters.customer_type || ''}
        onChange={(e) => onFilterChange('customer_type', e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      >
        <option value="">All Types</option>
        <option value="business">Business</option>
        <option value="individual">Individual</option>
      </select>

      {/* Status Filter */}
      <select
        value={filters.status || ''}
        onChange={(e) => onFilterChange('status', e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      >
        <option value="">All Status</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>

      {/* Currency Filter */}
      <select
        value={filters.currency || ''}
        onChange={(e) => onFilterChange('currency', e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      >
        <option value="">All Currencies</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
        <option value="GBP">GBP</option>
      </select>

      {/* Payment Terms Filter */}
      <select
        value={filters.payment_terms || ''}
        onChange={(e) => onFilterChange('payment_terms', e.target.value)}
        className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
      >
        <option value="">All Terms</option>
        <option value="immediate">Immediate</option>
        <option value="net15">Net 15</option>
        <option value="net30">Net 30</option>
        <option value="net60">Net 60</option>
        <option value="net90">Net 90</option>
      </select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      )}
    </div>
  )
}