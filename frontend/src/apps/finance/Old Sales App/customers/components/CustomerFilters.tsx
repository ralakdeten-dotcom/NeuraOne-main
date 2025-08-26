import React, { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface CustomerFiltersProps {
  filters: Record<string, string>
  onFilterChange: (key: string, value: string) => void
  onClearFilters?: () => void
}

export const CustomerFilters: React.FC<CustomerFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(value => value && value !== '').length

  const handleClearAll = () => {
    if (onClearFilters) {
      onClearFilters()
    } else {
      // Clear all filters individually if no clear function provided
      Object.keys(filters).forEach(key => onFilterChange(key, ''))
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md transition-colors ${
          activeFilterCount > 0
            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-600 text-blue-700 dark:text-blue-300'
            : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
        }`}
      >
        <FunnelIcon className="w-4 h-4" />
        <span>Filters</span>
        {activeFilterCount > 0 && (
          <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-medium bg-blue-600 dark:bg-blue-500 text-white rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDownIcon
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-80 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg z-50">
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Filter Customers
              </h3>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.customer_status || ''}
                onChange={(e) => onFilterChange('customer_status', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Customer Type
              </label>
              <select
                value={filters.customer_type || ''}
                onChange={(e) => onFilterChange('customer_type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="business">Business</option>
                <option value="individual">Individual</option>
              </select>
            </div>

            {/* Currency Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <select
                value={filters.currency || ''}
                onChange={(e) => onFilterChange('currency', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Currencies</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>

            {/* Apply/Close Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => setIsOpen(false)}
                className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}