import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { EmptyState, LoadingSpinner } from '@/shared/components'
import { CompactDataTable, type CompactColumnConfig } from '../tables/CompactDataTable'
import { ColumnManager, type ColumnVisibility } from '../tables/ColumnManager'
import { ContactFormModal } from '@/apps/crm/contacts'
import type { ColumnConfig } from '../tables/DataTable'

interface Contact {
  contact_id: number
  first_name: string
  last_name: string
  title?: string
  email?: string
  phone?: string
  account_name?: string
  owner?: string
  owner_name?: string
  created_at: string
}

interface ContactsTabProps {
  data?: Contact[]
  entityId?: number
  entityType?: string
  entityName?: string
  isLoading?: boolean
}

export const ContactsTab: React.FC<ContactsTabProps> = ({ data, entityId, entityType, entityName, isLoading }) => {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isEditContactModalOpen, setIsEditContactModalOpen] = useState(false)
  const [editingContact, setEditingContact] = useState<Contact | null>(null)

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    contact_name: true,
    title: true,
    email: true,
    phone: true,
    owner_name: true,
  })

  if (isLoading) {
    return <LoadingSpinner />
  }

  // Handle different data structures - could be array or object with contacts property
  let contacts: Contact[] = []
  
  if (Array.isArray(data)) {
    contacts = data
  } else if (data && typeof data === 'object') {
    // Try different possible property names
    contacts = data.contacts || data.results || data.data || []
  }

  // Add error handling for invalid data
  if (!Array.isArray(contacts)) {
    console.error('ContactsTab: Expected contacts to be an array, received:', typeof contacts, contacts)
    contacts = []
  }

  const handleContactClick = (contact: Contact) => {
    navigate(`/crm/contacts/${contact.contact_id}`)
  }

  const handleAddContact = () => {
    setIsContactModalOpen(true)
  }

  const handleContactSuccess = () => {
    setIsContactModalOpen(false)
    // Refresh contacts data - this will trigger automatically via React Query
  }

  const handleEditContactSuccess = () => {
    setIsEditContactModalOpen(false)
    setEditingContact(null)
    // Refresh contacts data - this will trigger automatically via React Query
  }

  const handleEditContact = (contact: Contact) => {
    setEditingContact(contact)
    setIsEditContactModalOpen(true)
  }

  // Define column configurations for ColumnManager
  const allContactColumns: ColumnConfig[] = [
    { 
      key: 'contact_name', 
      title: 'Contact Name', 
      width: '20%', 
      locked: true,
      render: (value: any, item: Contact) => (
        <button
          onClick={() => handleContactClick(item)}
          className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 underline cursor-pointer bg-transparent border-none p-0 text-left"
        >
          {item.first_name} {item.last_name}
        </button>
      )
    },
    { key: 'title', title: 'Title', width: '20%' },
    { key: 'email', title: 'Email', width: '20%' },
    { key: 'phone', title: 'Phone', width: '20%' },
    { 
      key: 'owner_name', 
      title: 'Contact Owner', 
      width: '20%',
      render: (value: string, item: Contact) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {item.owner_name || 'Unassigned'}
        </div>
      )
    },
  ]

  // Filter visible columns for CompactDataTable and add sortable functionality
  const visibleContactColumns: CompactColumnConfig[] = allContactColumns
    .filter(column => columnVisibility[column.key] !== false)
    .map(({ locked, ...column }) => ({
      ...column,
      sortable: true, // All columns are sortable
      searchable: true, // All columns are searchable
      render: column.render || ((value: any, item: Contact) => (
        <div className="text-sm text-gray-900 dark:text-white">
          {value || '-'}
        </div>
      ))
    }))

  // Reset column visibility to default
  const resetColumnVisibility = () => {
    setColumnVisibility({
      contact_name: true,
      title: true,
      email: true,
      phone: true,
      owner_name: true,
    })
  }

  if (contacts.length === 0) {
    return (
      <div className="p-4 pt-2">
        <CompactDataTable
          data={[]}
          columns={visibleContactColumns}
          keyExtractor={(item) => item.contact_id}
          emptyMessage={`No contacts found for this ${entityType || 'entity'}.`}
          showHeader={true}
          showSelection={false}
          showControls={true}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          searchPlaceholder="Search contacts..."
          controlsActions={
            <>
              <ColumnManager
                columns={allContactColumns}
                visibleColumns={columnVisibility}
                onVisibilityChange={setColumnVisibility}
                onReset={resetColumnVisibility}
              />
              <button
                onClick={handleAddContact}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#14235f] hover:bg-[#14235f]/90 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
              >
                <Plus size={16} />
                New Contact
              </button>
            </>
          }
        />

        {/* Contact Form Modal */}
        <ContactFormModal 
          isOpen={isContactModalOpen}
          onClose={() => setIsContactModalOpen(false)}
          initialAccount={entityType === 'account' && entityId ? { id: entityId, name: entityName || `Account ${entityId}` } : undefined}
          onSuccess={handleContactSuccess}
        />

        {/* Edit Contact Form Modal */}
        <ContactFormModal 
          isOpen={isEditContactModalOpen}
          onClose={() => setIsEditContactModalOpen(false)}
          contact={editingContact}
          initialAccount={entityType === 'account' && entityId ? { id: entityId, name: entityName || `Account ${entityId}` } : undefined}
          onSuccess={handleEditContactSuccess}
        />
      </div>
    )
  }

  return (
    <div className="p-4 pt-2">
      <CompactDataTable
        data={contacts}
        columns={visibleContactColumns}
        keyExtractor={(item) => item.contact_id}
        emptyMessage={`No contacts found for this ${entityType || 'entity'}.`}
        showHeader={true}
        showSelection={false}
        showControls={true}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search contacts..."
        controlsActions={
          <>
            <ColumnManager
              columns={allContactColumns}
              visibleColumns={columnVisibility}
              onVisibilityChange={setColumnVisibility}
              onReset={resetColumnVisibility}
            />
            <button
              onClick={handleAddContact}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#14235f] hover:bg-[#14235f]/90 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors"
            >
              <Plus size={16} />
              New Contact
            </button>
          </>
        }
      />

      {/* Contact Form Modal */}
      <ContactFormModal 
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        initialAccount={entityType === 'account' && entityId ? { id: entityId, name: entityName || `Account ${entityId}` } : undefined}
        onSuccess={handleContactSuccess}
      />

      {/* Edit Contact Form Modal */}
      <ContactFormModal 
        isOpen={isEditContactModalOpen}
        onClose={() => setIsEditContactModalOpen(false)}
        contact={editingContact}
        initialAccount={entityType === 'account' && entityId ? { id: entityId, name: entityName || `Account ${entityId}` } : undefined}
        onSuccess={handleEditContactSuccess}
      />
    </div>
  )
}