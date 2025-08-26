import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useContacts, type ContactListItem } from '@/apps/crm/contacts/api'

export interface ContactSelectProps {
  value?: number
  onChange: (contactId: number | undefined | null, contactName?: string, contactData?: { email?: string; phone?: string }) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  label?: string
  error?: string
  excludeId?: number // Exclude specific contact ID (e.g., current contact being edited)
  accountFilter?: number | null // Filter contacts by account ID (null for new accounts)
  allowCreation?: boolean // Allow creating new contacts by typing
}

export const ContactSelect: React.FC<ContactSelectProps> = ({
  value,
  onChange,
  placeholder = "Select contact...",
  className = "",
  disabled = false,
  label,
  error,
  excludeId,
  accountFilter,
  allowCreation = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [typedContactName, setTypedContactName] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Use single hook to fetch contacts
  const { data: contactsData, isLoading, error: apiError } = useContacts(1, 100)
  const allContacts = contactsData?.results || []

  // Filter by account if accountFilter is provided
  // If accountFilter is provided and > 0, show only contacts from that account
  // If accountFilter is null (new account), show no existing contacts
  // If accountFilter is undefined, show no existing contacts (no account selected yet)
  // This ensures that when creating a new account, we don't show unrelated contacts
  const contacts = accountFilter && accountFilter > 0
    ? allContacts.filter((contact: ContactListItem) => contact.account === accountFilter)
    : [] // For new accounts (null) or no selection (undefined), don't show existing contacts

  // Filter contacts based on search term and exclude specific ID
  const filteredContacts = contacts.filter((contact: ContactListItem) => {
    if (excludeId && contact.contact_id === excludeId) return false
    
    const searchLower = searchTerm.toLowerCase()
    return (
      contact.first_name.toLowerCase().includes(searchLower) ||
      contact.last_name.toLowerCase().includes(searchLower) ||
      contact.full_name.toLowerCase().includes(searchLower) ||
      (contact.email && contact.email.toLowerCase().includes(searchLower)) ||
      (contact.title && contact.title.toLowerCase().includes(searchLower)) ||
      (contact.account_name && contact.account_name.toLowerCase().includes(searchLower))
    )
  })

  // Find selected contact or check if we have a typed contact name
  const selectedContact = contacts.find((contact: ContactListItem) => contact.contact_id === value)
  
  // Check if search term matches exactly with any existing contact
  const exactMatch = searchTerm.trim() && filteredContacts.find((contact: ContactListItem) => 
    contact.full_name.toLowerCase() === searchTerm.trim().toLowerCase()
  )
  
  // Show "Create new contact" option when:
  // 1. allowCreation is true
  // 2. searchTerm is not empty
  // 3. No exact match found
  // 4. searchTerm has at least 2 words (first + last name)
  const canCreateContact = allowCreation && 
                          searchTerm.trim() && 
                          !exactMatch && 
                          searchTerm.trim().split(' ').length >= 2

  // Update dropdown position when it opens
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
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
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleContactSelect = (contact: ContactListItem) => {
    onChange(contact.contact_id, contact.full_name, { 
      email: contact.email || '', 
      phone: contact.phone || '' 
    })
    setIsOpen(false)
    setSearchTerm('')
    setTypedContactName('')
  }

  const handleCreateContact = () => {
    const contactName = searchTerm.trim()
    setTypedContactName(contactName)
    onChange(null, contactName) // null ID indicates new contact
    setIsOpen(false)
    setSearchTerm('')
  }

  const handleClear = () => {
    onChange(undefined, '', { email: '', phone: '' })
    setSearchTerm('')
    setTypedContactName('')
  }

  const handleInputChange = (newValue: string) => {
    setSearchTerm(newValue)
    setIsOpen(true)
    
    // If creation is allowed and user is typing, trigger onChange for real-time updates
    if (allowCreation && newValue.trim()) {
      const nameParts = newValue.trim().split(' ')
      if (nameParts.length >= 2) {
        // Only trigger onChange if it looks like a valid name (first + last)
        onChange(null, newValue.trim())
        setTypedContactName(newValue.trim())
      }
    }
  }

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(true)
      if (inputRef.current) {
        inputRef.current.focus()
      }
    }
  }

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm('')
    } else if (e.key === 'ArrowDown' && filteredContacts.length > 0) {
      e.preventDefault()
      setIsOpen(true)
    }
  }

  // Render dropdown using portal
  const renderDropdown = () => {
    if (!isOpen) return null

    return ReactDOM.createPortal(
      <div 
        ref={dropdownRef}
        className="fixed bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto"
        style={{
          top: `${dropdownPosition.top}px`,
          left: `${dropdownPosition.left}px`,
          width: `${dropdownPosition.width}px`,
          zIndex: 999999
        }}
      >
        {filteredContacts.length === 0 && !canCreateContact ? (
          <div className="px-3 py-2 text-gray-500 dark:text-gray-400 text-sm">
            {searchTerm ? 'No contacts found matching your search' : 'No contacts available'}
            {allowCreation && searchTerm && (
              <div className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Type first and last name to create new contact
              </div>
            )}
          </div>
        ) : (
          <>
            {filteredContacts.map((contact: ContactListItem) => (
              <div
                key={contact.contact_id}
                className="px-3 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-600 last:border-b-0"
                onClick={() => handleContactSelect(contact)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-gray-100">{contact.full_name}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{contact.email}</div>
                    {contact.title && (
                      <div className="text-xs text-gray-400 dark:text-gray-500">{contact.title}</div>
                    )}
                    {contact.account_name && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">@ {contact.account_name}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {canCreateContact && (
              <div
                className="px-3 py-2 hover:bg-green-50 dark:hover:bg-green-900/20 cursor-pointer border-t border-gray-200 dark:border-gray-600 text-green-600 dark:text-green-400 font-medium"
                onClick={handleCreateContact}
              >
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create "{searchTerm.trim()}"
                </div>
              </div>
            )}
          </>
        )}
      </div>,
      document.body
    )
  }

  if (isLoading) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
          Loading contacts...
        </div>
      </div>
    )
  }

  if (apiError) {
    return (
      <div className={className}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="w-full px-3 py-2 border border-red-300 dark:border-red-600 rounded-md bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
          Error loading contacts
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div
        ref={containerRef}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent ${
          disabled ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-700 hover:border-gray-400 dark:hover:border-gray-500'
        } ${error ? 'border-red-500 dark:border-red-500' : ''}`}
        onClick={handleInputClick}
      >
        {isOpen ? (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder={allowCreation ? "Search or type new contact name..." : "Search contacts..."}
            className="w-full outline-none bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            disabled={disabled}
            autoFocus
          />
        ) : (
          <div className="flex items-center justify-between">
            <span className={selectedContact || typedContactName ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}>
              {selectedContact ? (
                <div className="flex items-center">
                  <span className="font-medium">{selectedContact.full_name}</span>
                  {selectedContact.title && (
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">({selectedContact.title})</span>
                  )}
                  {selectedContact.account_name && (
                    <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">@ {selectedContact.account_name}</span>
                  )}
                </div>
              ) : typedContactName ? (
                <div className="flex items-center">
                  <span className="font-medium">{typedContactName}</span>
                  <span className="text-xs text-green-600 dark:text-green-400 ml-2">(New contact)</span>
                </div>
              ) : (
                placeholder
              )}
            </span>
            <div className="flex items-center space-x-1">
              {(selectedContact || typedContactName) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleClear()
                  }}
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 p-1"
                >
                  ×
                </button>
              )}
              <svg
                className="w-5 h-5 text-gray-400 dark:text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {renderDropdown()}
    </div>
  )
}