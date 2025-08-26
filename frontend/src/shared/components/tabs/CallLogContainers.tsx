import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { LogContainer } from '../templates/LogContainer'
import type { CallCreate } from '@/shared/api/calls'

interface Contact {
  contact_id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface CallLogContainersProps {
  // Create call modal
  isCreateCallOpen: boolean
  onCloseCreateCall: () => void
  onSubmitCreate: (e: React.FormEvent) => Promise<void>
  
  // Edit call modal
  isEditCallOpen: boolean
  onCloseEditCall: () => void
  onSubmitEdit: (e: React.FormEvent) => Promise<void>
  
  // Form data
  formData: CallCreate
  onInputChange: (field: keyof CallCreate, value: any) => void
  
  // Entity data for auto-populating contacted field
  entityData?: {
    first_name?: string
    last_name?: string
  }
  entityType?: 'lead' | 'contact'
  
  // For accounts: provide list of contacts to choose from
  availableContacts?: Contact[]
  
  // Mutation states
  isCreatePending?: boolean
  isUpdatePending?: boolean
}

export const CallLogContainers: React.FC<CallLogContainersProps> = ({
  isCreateCallOpen,
  onCloseCreateCall,
  onSubmitCreate,
  isEditCallOpen,
  onCloseEditCall,
  onSubmitEdit,
  formData,
  onInputChange,
  entityData,
  entityType,
  availableContacts,
  isCreatePending = false,
  isUpdatePending = false
}) => {
  // Call purpose templates
  const callPurposeTemplates = [
    "Primary Call",
    "Follow-up Call", 
    "Qualification Call",
    "Proposal Call",
    "Closing Call",
    "Analysis Call",
    "Negotiation Call"
  ]

  // State for call purpose dropdown
  const [isPurposeDropdownOpen, setIsPurposeDropdownOpen] = useState(false)
  const purposeDropdownRef = useRef<HTMLDivElement>(null)

  // State for contact selection (for accounts)
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)


  // Generate the contacted name from entity data or selected contact
  const getContactedName = () => {
    // For accounts with contact selection - only show name if contact is selected
    if (availableContacts && availableContacts.length > 0 && selectedContactId) {
      const selectedContact = availableContacts.find(c => c.contact_id === selectedContactId)
      if (selectedContact) {
        return `${selectedContact.first_name} ${selectedContact.last_name}`
      }
    }
    
    // For leads/contacts with auto-populated data
    if (entityData && entityData.first_name && entityData.last_name) {
      return `${entityData.first_name} ${entityData.last_name}`
    }
    
    // Always return formData.contact_name for manual input (including edit mode)
    // This handles both contactless accounts and accounts with contacts but manual entry
    return formData.contact_name || ''
  }

  const contactedName = getContactedName()

  // Handle clicking outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (purposeDropdownRef.current && !purposeDropdownRef.current.contains(event.target as Node)) {
        setIsPurposeDropdownOpen(false)
      }
    }

    if (isPurposeDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isPurposeDropdownOpen])

  // Reset selectedContactId when modals open
  useEffect(() => {
    if (isCreateCallOpen) {
      setSelectedContactId(null)
    }
  }, [isCreateCallOpen])

  useEffect(() => {
    if (isEditCallOpen) {
      setSelectedContactId(null)
    }
  }, [isEditCallOpen])

  // Update contact_name when contactedName changes, but preserve manual input for contactless accounts
  useEffect(() => {
    // Only auto-update if we have a selected contact or entity data (leads/contacts with names)
    // Don't auto-update for manual input scenarios
    if (selectedContactId || (entityData && entityData.first_name && entityData.last_name)) {
      if (contactedName !== formData.contact_name) {
        onInputChange('contact_name', contactedName)
      }
    }
  }, [contactedName, formData.contact_name, onInputChange, selectedContactId, entityData])

  // Auto-populate phone number when contact is selected
  useEffect(() => {
    if (availableContacts && selectedContactId) {
      const selectedContact = availableContacts.find(c => c.contact_id === selectedContactId)
      if (selectedContact?.phone && selectedContact.phone !== formData.contact_phone) {
        onInputChange('contact_phone', selectedContact.phone)
      }
    }
  }, [selectedContactId, availableContacts, formData.contact_phone, onInputChange])
  
  // Submit handlers that don't interfere with parent validation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    return onSubmitCreate(e)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    return onSubmitEdit(e)
  }
  return (
    <>
      {/* Create Call LogContainer */}
      <LogContainer
        title={
          formData.status === 'logged' 
            ? "Log New Call" 
            : formData.status === 'scheduled' 
            ? "Schedule New Call" 
            : "New Call"
        }
        isOpen={isCreateCallOpen}
        onClose={onCloseCreateCall}
        width="600px"
        height="500px"
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Call Purpose/Title */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Call Purpose *
              </label>
              <div className="relative" ref={purposeDropdownRef}>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => onInputChange('title', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsPurposeDropdownOpen(false)
                    }
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter call purpose or select template"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPurposeDropdownOpen(!isPurposeDropdownOpen)}
                  className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isPurposeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown */}
                {isPurposeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                      Select template or type custom purpose
                    </div>
                    {callPurposeTemplates.map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          onInputChange('title', template)
                          setIsPurposeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                        required
                  >
                        <span>{template}</span>
                        {formData.title === template && (
                          <Check className="w-4 h-4 text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status *
              </label>
              <select 
                value={formData.status || ''}
                onChange={(e) => onInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="">Choose Call Status</option>
                <option value="logged">Logged</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Direction *
              </label>
              <select 
                value={formData.direction}
                onChange={(e) => onInputChange('direction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="">Choose direction</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact *
              </label>
              
              {/* For accounts: Show contact selection dropdown */}
              {availableContacts && availableContacts.length > 0 ? (
                <div>
                  <select 
                    value={selectedContactId || ''}
                    onChange={(e) => {
                      const contactId = e.target.value ? parseInt(e.target.value) : null
                      setSelectedContactId(contactId)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="">Choose Associated Contact</option>
                    {availableContacts.map((contact) => (
                      <option key={contact.contact_id} value={contact.contact_id}>
                        {contact.first_name} {contact.last_name}
                      </option>
                    ))}
                  </select>
                  
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select from {availableContacts.length} contact{availableContacts.length !== 1 ? 's' : ''} in this account
                  </p>
                </div>
              ) : (
                /* For leads/contacts: Show readonly field or manual input */
                <>
                  <input
                    type="text"
                    value={contactedName}
                    readOnly={!!entityData && !!entityData.first_name && !!entityData.last_name}
                    onChange={(e) => {
                      // Allow manual input unless we have specific entity data with first/last name (leads/contacts)
                      if (!(entityData && entityData.first_name && entityData.last_name)) {
                        onInputChange('contact_name', e.target.value)
                      }
                    }}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                      entityData && entityData.first_name && entityData.last_name 
                        ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' 
                        : ''
                    }`}
                    placeholder={entityData && entityData.first_name && entityData.last_name ? "Auto-filled from lead/contact name" : "Enter name of person contacted"}
                    required
                  />
                  {entityData && entityData.first_name && entityData.last_name && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Auto-filled from {entityType} name
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              
              {/* Auto-fill phone from selected contact or allow manual entry */}
              <input
                type="tel"
                value={
                  // Auto-fill from selected contact if available
                  (availableContacts && selectedContactId) 
                    ? availableContacts.find(c => c.contact_id === selectedContactId)?.phone || formData.contact_phone || ''
                    : formData.contact_phone || ''
                }
                onChange={(e) => onInputChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter phone number (optional)"
              />
              
              {/* Helper text */}
              {availableContacts && selectedContactId ? (
                availableContacts.find(c => c.contact_id === selectedContactId)?.phone ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Auto-filled from selected contact
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Contact has no phone number - enter manually if needed
                  </p>
                )
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional - enter phone number if available
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Call Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.call_date}
                  onChange={(e) => onInputChange('call_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Call Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.call_time}
                  onChange={(e) => onInputChange('call_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration || ''}
                  onChange={(e) => onInputChange('duration', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Minutes"
                />
              </div>
            </div>


            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Call Notes/Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => onInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter call notes and description (optional)"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCloseCreateCall}
                disabled={isCreatePending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatePending || !formData.title.trim() || !formData.status || !formData.direction || !contactedName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreatePending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {formData.status === 'logged' 
                  ? "Log Call" 
                  : formData.status === 'scheduled' 
                  ? "New Meeting" 
                  : "New Call"
                }
              </button>
            </div>
          </form>
        </div>
      </LogContainer>

      {/* View Call LogContainer */}
      <LogContainer
        title="View Call"
        isOpen={isEditCallOpen}
        onClose={onCloseEditCall}
        width="600px"
        height="500px"
      >
        <div className="space-y-4">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Call Purpose/Title */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Call Purpose *
              </label>
              <div className="relative" ref={purposeDropdownRef}>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => onInputChange('title', e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setIsPurposeDropdownOpen(false)
                    }
                  }}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Enter call purpose or select template"
                  required
                />
                <button
                  type="button"
                  onClick={() => setIsPurposeDropdownOpen(!isPurposeDropdownOpen)}
                  className="absolute inset-y-0 right-0 flex items-center px-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${isPurposeDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown */}
                {isPurposeDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    <div className="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-600">
                      Select template or type custom purpose
                    </div>
                    {callPurposeTemplates.map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          onInputChange('title', template)
                          setIsPurposeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
                        required
                  >
                        <span>{template}</span>
                        {formData.title === template && (
                          <Check className="w-4 h-4 text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status *
              </label>
              <select 
                value={formData.status || 'logged'}
                onChange={(e) => onInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="logged">Logged</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            {/* Direction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Direction *
              </label>
              <select 
                value={formData.direction}
                onChange={(e) => onInputChange('direction', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="">Choose direction</option>
                <option value="inbound">Inbound</option>
                <option value="outbound">Outbound</option>
              </select>
            </div>

            {/* Contact */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact *
              </label>
              
              {/* For accounts: Show contact selection dropdown */}
              {availableContacts && availableContacts.length > 0 ? (
                <div>
                  <select 
                    value={selectedContactId || ''}
                    onChange={(e) => {
                      const contactId = e.target.value ? parseInt(e.target.value) : null
                      setSelectedContactId(contactId)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="">Choose Associated Contact</option>
                    {availableContacts.map((contact) => (
                      <option key={contact.contact_id} value={contact.contact_id}>
                        {contact.first_name} {contact.last_name}
                      </option>
                    ))}
                  </select>
                  
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Select from {availableContacts.length} contact{availableContacts.length !== 1 ? 's' : ''} in this account
                  </p>
                </div>
              ) : (
                /* For leads/contacts: Show readonly field or manual input */
                <>
                  <input
                    type="text"
                    value={contactedName}
                    readOnly={!!entityData && !!entityData.first_name && !!entityData.last_name}
                    onChange={(e) => {
                      // Allow manual input unless we have specific entity data with first/last name (leads/contacts)
                      if (!(entityData && entityData.first_name && entityData.last_name)) {
                        onInputChange('contact_name', e.target.value)
                      }
                    }}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                      entityData && entityData.first_name && entityData.last_name 
                        ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' 
                        : ''
                    }`}
                    placeholder={entityData && entityData.first_name && entityData.last_name ? "Auto-filled from lead/contact name" : "Enter name of person contacted"}
                    required
                  />
                  {entityData && entityData.first_name && entityData.last_name && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Auto-filled from {entityType} name
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Phone Number
              </label>
              
              {/* Auto-fill phone from selected contact or allow manual entry */}
              <input
                type="tel"
                value={
                  // Auto-fill from selected contact if available
                  (availableContacts && selectedContactId) 
                    ? availableContacts.find(c => c.contact_id === selectedContactId)?.phone || formData.contact_phone || ''
                    : formData.contact_phone || ''
                }
                onChange={(e) => onInputChange('contact_phone', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter phone number (optional)"
              />
              
              {/* Helper text */}
              {availableContacts && selectedContactId ? (
                availableContacts.find(c => c.contact_id === selectedContactId)?.phone ? (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Auto-filled from selected contact
                  </p>
                ) : (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Contact has no phone number - enter manually if needed
                  </p>
                )
              ) : (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Optional - enter phone number if available
                </p>
              )}
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Call Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.call_date}
                  onChange={(e) => onInputChange('call_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Call Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.call_time}
                  onChange={(e) => onInputChange('call_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Duration (min)
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.duration || ''}
                  onChange={(e) => onInputChange('duration', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Minutes"
                />
              </div>
            </div>


            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Call Notes/Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => onInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter call notes and description (optional)"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCloseEditCall}
                disabled={isUpdatePending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatePending}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdatePending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Save Call
              </button>
            </div>
          </form>
        </div>
      </LogContainer>
    </>
  )
}