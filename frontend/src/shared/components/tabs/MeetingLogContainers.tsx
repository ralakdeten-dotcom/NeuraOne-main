import React, { useState, useEffect, useRef } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { LogContainer } from '../templates/LogContainer'
import type { MeetingCreate } from '@/shared/api/meetings'

interface Contact {
  contact_id: number
  first_name: string
  last_name: string
  email?: string
  phone?: string
}

interface MeetingLogContainersProps {
  // Create meeting modal
  isCreateMeetingOpen: boolean
  onCloseCreateMeeting: () => void
  onSubmitCreate: (e: React.FormEvent) => Promise<void>
  
  // Edit meeting modal
  isEditMeetingOpen: boolean
  onCloseEditMeeting: () => void
  onSubmitEdit: (e: React.FormEvent) => Promise<void>
  
  // Form data
  formData: MeetingCreate
  onInputChange: (field: keyof MeetingCreate, value: any) => void
  
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

export const MeetingLogContainers: React.FC<MeetingLogContainersProps> = ({
  isCreateMeetingOpen,
  onCloseCreateMeeting,
  onSubmitCreate,
  isEditMeetingOpen,
  onCloseEditMeeting,
  onSubmitEdit,
  formData,
  onInputChange,
  entityData,
  entityType,
  availableContacts,
  isCreatePending = false,
  isUpdatePending = false
}) => {
  // Meeting purpose templates
  const meetingPurposeTemplates = [
    "Initial Meeting",
    "Follow-up Meeting", 
    "Proposal Meeting",
    "Contract Meeting",
    "Review Meeting",
    "Kickoff Meeting",
    "Planning Meeting"
  ]

  // State for meeting purpose dropdown
  const [isPurposeDropdownOpen, setIsPurposeDropdownOpen] = useState(false)
  const purposeDropdownRef = useRef<HTMLDivElement>(null)

  // State for contact selection (for accounts)
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)

  // Generate the contacted name from entity data or selected contact
  const getContactedName = () => {
    // For accounts with contact selection - only show name if contact is selected
    if (availableContacts && selectedContactId) {
      const selectedContact = availableContacts.find(c => c.contact_id === selectedContactId)
      if (selectedContact) {
        return `${selectedContact.first_name} ${selectedContact.last_name}`
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

  // Update contact_name when contactedName changes
  useEffect(() => {
    if (contactedName && contactedName !== formData.contact_name) {
      onInputChange('contact_name', contactedName)
    }
  }, [contactedName, formData.contact_name, onInputChange])
  
  // Submit handlers that don't interfere with parent validation
  const handleCreateSubmit = async (e: React.FormEvent) => {
    return onSubmitCreate(e)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    return onSubmitEdit(e)
  }

  return (
    <>
      {/* Create Meeting LogContainer */}
      <LogContainer
        title={
          formData.status === 'logged' 
            ? "Log New Meeting" 
            : formData.status === 'scheduled' 
            ? "Schedule New Meeting" 
            : "New Meeting"
        }
        isOpen={isCreateMeetingOpen}
        onClose={onCloseCreateMeeting}
        width="600px"
        height="500px"
      >
        <div className="space-y-4">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            {/* Meeting Purpose/Title */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meeting Purpose *
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
                  placeholder="Enter meeting purpose or select template"
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
                    {meetingPurposeTemplates.map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          onInputChange('title', template)
                          setIsPurposeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
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
                <option value="">Choose Meeting Status</option>
                <option value="logged">Logged</option>
                <option value="scheduled">Scheduled</option>
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
                    onChange={(e) => !entityData ? onInputChange('contact_name', e.target.value) : undefined}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                      entityData && entityData.first_name && entityData.last_name 
                        ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' 
                        : ''
                    }`}
                    placeholder={entityData ? "Auto-filled from lead/contact name" : "Enter name of person to meet with"}
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

            <div className="grid grid-cols-3 gap-4">
              {/* Meeting Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.meeting_date}
                  onChange={(e) => onInputChange('meeting_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Meeting Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.meeting_time}
                  onChange={(e) => onInputChange('meeting_time', e.target.value)}
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
                Meeting Notes/Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => onInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter meeting notes and description (optional)"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCloseCreateMeeting}
                disabled={isCreatePending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatePending || !formData.title.trim() || !formData.status || !contactedName.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreatePending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                {formData.status === 'logged' 
                  ? "Log Meeting" 
                  : formData.status === 'scheduled' 
                  ? "Schedule Meeting" 
                  : "New Meeting"
                }
              </button>
            </div>
          </form>
        </div>
      </LogContainer>

      {/* View Meeting LogContainer */}
      <LogContainer
        title="View Meeting"
        isOpen={isEditMeetingOpen}
        onClose={onCloseEditMeeting}
        width="600px"
        height="500px"
      >
        <div className="space-y-4">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            {/* Meeting Purpose/Title */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Meeting Purpose *
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
                  placeholder="Enter meeting purpose or select template"
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
                    {meetingPurposeTemplates.map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          onInputChange('title', template)
                          setIsPurposeDropdownOpen(false)
                        }}
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-between"
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
                    onChange={(e) => !entityData ? onInputChange('contact_name', e.target.value) : undefined}
                    className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100 ${
                      entityData && entityData.first_name && entityData.last_name 
                        ? 'bg-gray-50 dark:bg-gray-600 cursor-not-allowed' 
                        : ''
                    }`}
                    placeholder={entityData ? "Auto-filled from lead/contact name" : "Enter name of person to meet with"}
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

            <div className="grid grid-cols-3 gap-4">
              {/* Meeting Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.meeting_date}
                  onChange={(e) => onInputChange('meeting_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                />
              </div>

              {/* Meeting Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Time
                </label>
                <input
                  type="time"
                  value={formData.meeting_time}
                  onChange={(e) => onInputChange('meeting_time', e.target.value)}
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
                Meeting Notes/Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => onInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter meeting notes and description (optional)"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCloseEditMeeting}
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
                Save Meeting
              </button>
            </div>
          </form>
        </div>
      </LogContainer>
    </>
  )
}