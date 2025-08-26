import React, { useState, useEffect, useRef } from 'react'
import ReactDOM from 'react-dom'
import { useCustomers, type Customer } from '@/apps/finance/Old Sales App/customers/api'
import { ChevronDownIcon, PlusIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { CustomerFormSidePanel } from '@/apps/finance/Old Sales App/customers/components/CustomerFormSidePanel'

export interface CustomerSelectProps {
  value?: number
  onChange: (customerId: number | undefined, customer?: Customer) => void
  label?: string
  placeholder?: string
  disabled?: boolean
  error?: string
  required?: boolean
  className?: string
}

export const CustomerSelect: React.FC<CustomerSelectProps> = ({
  value,
  onChange,
  label = "Customer",
  placeholder = "Select a customer...",
  disabled = false,
  error,
  required = false,
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const { data: customersData, isLoading, refetch } = useCustomers(1, 100)
  const customers = customersData?.results || []

  // Find selected customer
  const selectedCustomer = customers.find(c => c.customer_id === value)

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => {
    const searchLower = searchTerm.toLowerCase()
    return (
      customer.display_name.toLowerCase().includes(searchLower) ||
      (customer.company_name && customer.company_name.toLowerCase().includes(searchLower)) ||
      (customer.primary_contact_email && customer.primary_contact_email.toLowerCase().includes(searchLower))
    )
  })

  // Update dropdown position when it opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width
      })
    }
  }, [isOpen])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Close dropdown on scroll (only if scrolling outside the dropdown)
  useEffect(() => {
    const handleScroll = (event: Event) => {
      if (isOpen) {
        // Only close if the scroll event is not within the dropdown
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }
    }

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true)
      return () => window.removeEventListener('scroll', handleScroll, true)
    }
  }, [isOpen])

  const handleCustomerSelect = (customer: Customer) => {
    onChange(customer.customer_id, customer)
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleCreateNewCustomer = () => {
    setIsOpen(false)
    setShowCreateForm(true)
  }

  const handleCustomerCreated = () => {
    setShowCreateForm(false)
    refetch() // Refresh the customer list
  }

  const handleClear = () => {
    onChange(undefined)
    setSearchTerm('')
  }

  // Render dropdown using portal
  const renderDropdown = () => {
    if (!isOpen || disabled) return null

    return ReactDOM.createPortal(
      <div 
        ref={dropdownRef}
        className="fixed bg-white dark:bg-gray-700 shadow-lg max-h-80 rounded-md py-1 text-base overflow-auto focus:outline-none sm:text-sm border border-gray-200 dark:border-gray-600"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 999999
        }}
      >
        {/* Create New Customer Button */}
        <button
          type="button"
          onClick={handleCreateNewCustomer}
          className="w-full text-left px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-2 border-b border-gray-200 dark:border-gray-600"
        >
          <PlusIcon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-600 dark:text-blue-400 font-medium">Create New Customer</span>
        </button>

        {/* Search Input */}
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-600">
          <input
            type="text"
            className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Customer List */}
        {isLoading ? (
          <div className="px-3 py-2 text-gray-500 dark:text-gray-400">Loading customers...</div>
        ) : filteredCustomers.length === 0 ? (
          <div className="px-3 py-2 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No customers found' : 'No customers available'}
          </div>
        ) : (
          <div className="max-h-48 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.customer_id}
                type="button"
                onClick={() => handleCustomerSelect(customer)}
                className={`
                  w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600
                  ${customer.customer_id === value ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                `}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {customer.customer_type === 'business' ? (
                      <BuildingOfficeIcon className="h-4 w-4 text-gray-400" />
                    ) : (
                      <UserIcon className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {customer.display_name}
                      </span>
                      {customer.customer_status !== 'active' && (
                        <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-600 text-gray-600 dark:text-gray-300">
                          {customer.customer_status}
                        </span>
                      )}
                    </div>
                    {customer.company_name && (
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {customer.company_name}
                      </div>
                    )}
                    {customer.primary_contact_email && (
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {customer.primary_contact_email}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                      {customer.payment_terms} • {customer.currency}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>,
      document.body
    )
  }

  return (
    <>
      <div className={`relative ${className}`}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        {/* Main Select Button/Input */}
        <div className="relative">
          <button
            ref={buttonRef}
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            disabled={disabled}
            className={`
              relative w-full bg-white dark:bg-gray-700 border rounded-md shadow-sm px-3 py-2 text-left cursor-default
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-600'}
              ${error ? 'border-red-300 dark:border-red-600' : 'border-gray-300 dark:border-gray-600'}
              focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500
            `}
          >
            <span className="block truncate">
              {selectedCustomer ? (
                <div className="flex items-center">
                  <span className="font-medium">{selectedCustomer.display_name}</span>
                  {selectedCustomer.company_name && (
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      ({selectedCustomer.company_name})
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-gray-400">{placeholder}</span>
              )}
            </span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <ChevronDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
            </span>
          </button>

          {/* Clear button */}
          {value && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-8 flex items-center pr-2"
            >
              <span className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">×</span>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      {/* Render dropdown using portal */}
      {renderDropdown()}

      {/* Customer Creation Form */}
      {showCreateForm && (
        <CustomerFormSidePanel
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={handleCustomerCreated}
        />
      )}
    </>
  )
}