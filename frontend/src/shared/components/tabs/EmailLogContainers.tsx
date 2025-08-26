import React, { useState, useEffect } from 'react'
import { Download } from 'lucide-react'
import { LogContainer } from '../templates/LogContainer'
import type { EmailCreate } from '@/shared/api/emails'

interface Contact {
  contact_id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface EmailLogContainersProps {
  // Create email modal
  isCreateEmailOpen: boolean
  onCloseCreateEmail: () => void
  onSubmitCreate: (e: React.FormEvent) => Promise<void>
  
  // Edit email modal
  isEditEmailOpen: boolean
  onCloseEditEmail: () => void
  onSubmitEdit: (e: React.FormEvent) => Promise<void>
  
  // Form data
  formData: EmailCreate
  onInputChange: (field: keyof EmailCreate, value: any) => void
  
  // Entity data for auto-populating contact field
  entityData?: {
    first_name?: string
    last_name?: string
    email?: string
  }
  entityType?: 'lead' | 'contact'
  
  // For accounts: provide list of contacts to choose from
  availableContacts?: Contact[]
  
  // For entities with no contacts: provide email suggestions from existing emails
  emailSuggestions?: Array<{
    email_address: string
    contact_name: string
  }>
  
  // Mutation states
  isCreatePending?: boolean
  isUpdatePending?: boolean
}

export const EmailLogContainers: React.FC<EmailLogContainersProps> = ({
  isCreateEmailOpen,
  onCloseCreateEmail,
  onSubmitCreate,
  isEditEmailOpen,
  onCloseEditEmail,
  onSubmitEdit,
  formData,
  onInputChange,
  entityData,
  entityType,
  availableContacts,
  emailSuggestions,
  isCreatePending = false,
  isUpdatePending = false
}) => {

  // State for contact selection (for accounts)
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)
  
  // State for email suggestion selection (when no contacts available)
  const [selectedEmailSuggestion, setSelectedEmailSuggestion] = useState<string>('')

  // Generate the contact name from entity data or selected contact
  const getContactName = () => {
    // For accounts with contact selection - only show name if contact is selected
    if (availableContacts && selectedContactId) {
      const selectedContact = availableContacts.find(c => c.contact_id === selectedContactId)
      if (selectedContact) {
        return `${selectedContact.first_name} ${selectedContact.last_name}`
      }
    }
    
    // For email suggestions - show name from selected suggestion
    if (emailSuggestions && selectedEmailSuggestion) {
      const selectedSuggestion = emailSuggestions.find(s => s.email_address === selectedEmailSuggestion)
      if (selectedSuggestion) {
        return selectedSuggestion.contact_name
      }
    }
    
    // For leads/contacts with auto-populated data
    if (entityData && entityData.first_name && entityData.last_name) {
      return `${entityData.first_name} ${entityData.last_name}`
    }
    
    // For accounts without contact selection, return empty to show placeholder
    if (availableContacts && availableContacts.length > 0) {
      return ''
    }
    
    // Fallback to manual input for other entity types
    return formData.contact_name || ''
  }

  // Generate email address from entity data or form data
  const getEmailAddress = () => {
    // For leads/contacts with auto-populated data (entity email takes precedence)
    if (entityData && entityData.email) {
      return entityData.email
    }
    
    // For email suggestions - use selected suggestion
    if (emailSuggestions && selectedEmailSuggestion) {
      return selectedEmailSuggestion
    }
    
    // For all other cases, use form data (including manual entry)
    return formData.email_address || ''
  }

  const contactName = getContactName()
  const emailAddress = getEmailAddress()


  // Update contact_name when contactName changes
  useEffect(() => {
    if (contactName && contactName !== formData.contact_name) {
      onInputChange('contact_name', contactName)
    }
  }, [contactName, formData.contact_name, onInputChange])

  // Update email_address when emailAddress changes
  useEffect(() => {
    if (emailAddress && emailAddress !== formData.email_address) {
      onInputChange('email_address', emailAddress)
    }
  }, [emailAddress, formData.email_address, onInputChange])

  // Auto-set direction based on status
  useEffect(() => {
    if (formData.status) {
      const defaultDirection = formData.status === 'received' ? 'inbound' : 
                              formData.status === 'draft' ? 'draft' : 'outbound'
      if (formData.direction !== defaultDirection) {
        onInputChange('direction', defaultDirection)
      }
    }
  }, [formData.status, formData.direction, onInputChange])

  // Auto-populate email when contact is selected (only if contact has email)
  useEffect(() => {
    // Only handle contact selection when contacts are available
    if (availableContacts && availableContacts.length > 0) {
      if (selectedContactId) {
        const selectedContact = availableContacts.find(c => c.contact_id === selectedContactId)
        if (selectedContact && selectedContact.email && selectedContact.email !== formData.email_address) {
          onInputChange('email_address', selectedContact.email)
        }
        // Note: If contact has no email, we don't clear the formData.email_address
        // This allows manual entry to persist
      } else {
        // Clear email when no contact is selected from available contacts
        if (formData.email_address && !entityData?.email) {
          onInputChange('email_address', '')
        }
      }
    }
    // For contactless accounts (availableContacts.length === 0), do nothing
    // This allows full manual entry without interference
  }, [selectedContactId, availableContacts, formData.email_address, entityData?.email, onInputChange])

  // Auto-populate email and contact name when email suggestion is selected
  useEffect(() => {
    if (emailSuggestions && selectedEmailSuggestion) {
      const selectedSuggestion = emailSuggestions.find(s => s.email_address === selectedEmailSuggestion)
      if (selectedSuggestion) {
        // Update email address
        if (selectedSuggestion.email_address !== formData.email_address) {
          onInputChange('email_address', selectedSuggestion.email_address)
        }
        // Update contact name
        if (selectedSuggestion.contact_name && selectedSuggestion.contact_name !== formData.contact_name) {
          onInputChange('contact_name', selectedSuggestion.contact_name)
        }
      }
    }
  }, [selectedEmailSuggestion, emailSuggestions, formData.email_address, formData.contact_name, onInputChange])
  
  // Dynamic header logic based on email status
  const getCreateHeaderTitle = () => {
    switch (formData.status) {
      case 'sent':
        return 'Log Sent Email'
      case 'received':
        return 'Log Received Email'
      case 'draft':
        return 'Log Drafted Email'
      default:
        return 'Log New Email'
    }
  }

  const getCreateButtonText = () => {
    switch (formData.status) {
      case 'sent':
        return 'Log Sent Email'
      case 'received':
        return 'Log Received Email'
      case 'draft':
        return 'Log Drafted Email'
      default:
        return 'Log Email'
    }
  }

  // Submit handlers that don't interfere with parent validation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    return onSubmitCreate(e)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    return onSubmitEdit(e)
  }

  return (
    <>
      {/* Create Email LogContainer */}
      <LogContainer
        title={getCreateHeaderTitle()}
        isOpen={isCreateEmailOpen}
        onClose={onCloseCreateEmail}
        width="700px"
        height="600px"
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Email Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => onInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter email subject"
                required
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </label>
              
              {/* For accounts: Show contact selection dropdown and auto-fill email */}
              {availableContacts && availableContacts.length > 0 ? (
                <div className="space-y-2">
                  <select 
                    value={selectedContactId || ''}
                    onChange={(e) => {
                      const contactId = e.target.value ? parseInt(e.target.value) : null
                      setSelectedContactId(contactId)
                    }}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    required
                  >
                    <option value="">Choose Contact</option>
                    {availableContacts.map((contact) => (
                      <option key={contact.contact_id} value={contact.contact_id}>
                        {contact.first_name} {contact.last_name}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => onInputChange('email_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder={
                      selectedContactId 
                        ? (availableContacts?.find(c => c.contact_id === selectedContactId)?.email 
                            ? "Email will auto-fill when contact is selected" 
                            : "Contact has no email - enter manually")
                        : "Email will auto-fill when contact is selected"
                    }
                    required
                  />
                  
                  {/* Helper text for contact without email */}
                  {selectedContactId && availableContacts?.find(c => c.contact_id === selectedContactId) && 
                   !availableContacts.find(c => c.contact_id === selectedContactId)?.email && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Selected contact has no email address - enter manually
                    </p>
                  )}
                </div>
              ) : emailSuggestions && emailSuggestions.length > 0 ? (
                /* For entities with email suggestions but no contacts */
                <div className="space-y-2">
                  <select 
                    value={selectedEmailSuggestion}
                    onChange={(e) => setSelectedEmailSuggestion(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="">Choose from previous emails...</option>
                    {emailSuggestions.map((suggestion, index) => (
                      <option key={index} value={suggestion.email_address}>
                        {suggestion.contact_name} ({suggestion.email_address})
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => onInputChange('email_address', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                    placeholder={
                      selectedEmailSuggestion 
                        ? "Email auto-filled from suggestion"
                        : "Enter email address manually"
                    }
                    required
                  />
                  
                  {selectedEmailSuggestion && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Email auto-filled from previous email logs
                    </p>
                  )}
                  
                  {!selectedEmailSuggestion && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Select from previous emails or enter manually
                    </p>
                  )}
                </div>
              ) : (
                /* For leads/contacts: Show email field with auto-population */
                <input
                  type="email"
                  value={emailAddress}
                  readOnly={!!entityData && !!entityData.email}
                  onChange={(e) => !entityData?.email ? onInputChange('email_address', e.target.value) : undefined}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                    entityData && entityData.email 
                      ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' 
                      : ''
                  }`}
                  placeholder={entityData?.email ? "Auto-filled from contact email" : "Enter the recipient's email address"}
                  required
                />
              )}
              
              {entityData?.email && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Auto-filled from {entityType} email
                </p>
              )}
              
              {/* Show manual entry hint when no contacts are available and no entity email and no email suggestions */}
              {!entityData?.email && availableContacts && availableContacts.length === 0 && (!emailSuggestions || emailSuggestions.length === 0) && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Enter the recipient's email address manually
                </p>
              )}
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name *
              </label>
              
              <input
                type="text"
                value={contactName}
                readOnly={
                  (!!entityData && !!entityData.first_name && !!entityData.last_name) || 
                  (!!selectedEmailSuggestion && !!emailSuggestions)
                }
                onChange={(e) => {
                  // Allow manual entry when:
                  // 1. No entity data (standalone email)
                  // 2. Entity data exists but no auto-filled name (e.g., account without contact details)
                  // 3. Available contacts but none selected (manual entry for account)
                  // 4. No email suggestion selected
                  if (
                    (!entityData || !(entityData.first_name && entityData.last_name)) &&
                    !selectedEmailSuggestion
                  ) {
                    onInputChange('contact_name', e.target.value)
                  }
                }}
                className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                  (entityData && entityData.first_name && entityData.last_name) || 
                  (availableContacts && selectedContactId) ||
                  (emailSuggestions && selectedEmailSuggestion)
                    ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' 
                    : ''
                }`}
                placeholder={entityData ? "Auto-filled from contact name" : "Enter recipient's name (e.g., John Smith)"}
                required
              />
              
              {entityData && entityData.first_name && entityData.last_name && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Auto-filled from {entityType} name
                </p>
              )}
              
              {emailSuggestions && selectedEmailSuggestion && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Contact name auto-filled from previous email logs
                </p>
              )}
              
              {availableContacts && availableContacts.length > 0 ? (
                selectedContactId ? (
                  availableContacts.find(c => c.contact_id === selectedContactId)?.email ? (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Contact name auto-filled - email will be populated above
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Contact name auto-filled - enter email address manually above
                    </p>
                  )
                ) : (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Name will auto-fill when contact is selected above
                  </p>
                )
              ) : availableContacts && availableContacts.length === 0 && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  No contacts available - enter recipient details manually
                </p>
              )}
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
                <option value="">Choose Status</option>
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="draft">Drafted</option>
              </select>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Email Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.email_date}
                  onChange={(e) => onInputChange('email_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Email Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.email_time}
                  onChange={(e) => onInputChange('email_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {/* CC and BCC Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* CC Addresses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CC Addresses
                </label>
                <input
                  type="text"
                  value={formData.cc_addresses || ''}
                  onChange={(e) => onInputChange('cc_addresses', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>

              {/* BCC Addresses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BCC Addresses
                </label>
                <input
                  type="text"
                  value={formData.bcc_addresses || ''}
                  onChange={(e) => onInputChange('bcc_addresses', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            </div>

            {/* Email Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => onInputChange('content', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter email content/body"
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-between items-center pt-4">
              {/* Import Email Button (Placeholder) */}
              <button
                type="button"
                onClick={() => {
                  // Placeholder - functionality to be implemented in future
                  console.log('Import Email functionality - Coming Soon!')
                }}
                disabled={true} // Non-functional for now
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                title="Import Email functionality - Coming Soon!"
              >
                <Download size={16} />
                Import Email
              </button>

              {/* Cancel and Submit Buttons */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={onCloseCreateEmail}
                  disabled={isCreatePending}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatePending || !formData.subject.trim() || !formData.content.trim() || !formData.email_address.trim() || !formData.status || !contactName.trim()}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isCreatePending && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  )}
                  {getCreateButtonText()}
                </button>
              </div>
            </div>
          </form>
        </div>
      </LogContainer>

      {/* Edit Email LogContainer */}
      <LogContainer
        title="View Email"
        isOpen={isEditEmailOpen}
        onClose={onCloseEditEmail}
        width="700px"
        height="600px"
      >
        <div className="space-y-4">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Email Subject */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Subject *
              </label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => onInputChange('subject', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter email subject"
                required
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                value={formData.email_address}
                onChange={(e) => onInputChange('email_address', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter the recipient's email address"
                required
              />
            </div>

            {/* Contact Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Contact Name *
              </label>
              <input
                type="text"
                value={formData.contact_name || ''}
                onChange={(e) => onInputChange('contact_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter recipient's name (e.g., John Smith)"
                required
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status *
              </label>
              <select 
                value={formData.status || 'sent'}
                onChange={(e) => onInputChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="sent">Sent</option>
                <option value="received">Received</option>
                <option value="draft">Drafted</option>
              </select>
            </div>

            {/* Date and Time Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* Email Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.email_date}
                  onChange={(e) => onInputChange('email_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Email Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.email_time}
                  onChange={(e) => onInputChange('email_time', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>
            </div>

            {/* CC and BCC Row */}
            <div className="grid grid-cols-2 gap-4">
              {/* CC Addresses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CC Addresses
                </label>
                <input
                  type="text"
                  value={formData.cc_addresses || ''}
                  onChange={(e) => onInputChange('cc_addresses', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>

              {/* BCC Addresses */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  BCC Addresses
                </label>
                <input
                  type="text"
                  value={formData.bcc_addresses || ''}
                  onChange={(e) => onInputChange('bcc_addresses', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="email1@example.com, email2@example.com"
                />
              </div>
            </div>

            {/* Email Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Content *
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => onInputChange('content', e.target.value)}
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter email content/body"
                required
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCloseEditEmail}
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
                Save Email
              </button>
            </div>
          </form>
        </div>
      </LogContainer>
    </>
  )
}