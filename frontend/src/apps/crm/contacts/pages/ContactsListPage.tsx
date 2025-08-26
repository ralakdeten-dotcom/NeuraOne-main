import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useContacts, useDeleteContact, useContact, type ContactListItem } from '../api'
import { FormSidePanel } from '@/shared/components/forms/FormSidePanel'
import { ContactForm } from '../components/ContactForm'
import { ContactFormModal } from '../components/ContactFormModal'
import { DataTable, TableControls, ColumnManager, PrimaryLinkCell, ContactInfoCell, DateCell, useColumnVisibility, type ColumnConfig, type ActionConfig, ExportButton, type ExportColumn, formatDateForExport } from '@/shared'

export const ContactsListPage: React.FC = () => {
  const [currentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedContactItems, setSelectedContactItems] = useState<ContactListItem[]>([])
  const [isPanelOpen, setPanelOpen] = useState(false)
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  const [editingContactId, setEditingContactId] = useState<number | null>(null)
  const navigate = useNavigate()
  
  const { data: contactsData, isLoading, error, refetch } = useContacts(currentPage, pageSize)
  const deleteContact = useDeleteContact()
  
  // Fetch contact data for editing (only when editingContactId is set)
  const { data: editingContact } = useContact(editingContactId || 0)
  
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteContact.mutateAsync(id)
        // Contact deleted successfully
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting contact: ${errorMessage}`)
      }
    }
  }

  const handleNewContact = () => {
    setPanelOpen(true)
  }

  const handleEditContact = (contact: ContactListItem) => {
    setEditingContactId(contact.contact_id)
    setEditModalOpen(true)
  }

  const handlePanelClose = () => {
    setPanelOpen(false)
  }

  const handlePanelSuccess = () => {
    setPanelOpen(false)
    refetch()
  }

  const handleEditModalClose = () => {
    setEditModalOpen(false)
    setEditingContactId(null)
  }

  const handleEditModalSuccess = () => {
    setEditModalOpen(false)
    setEditingContactId(null)
    refetch()
  }

  const handleSelectionChange = (selectedItems: ContactListItem[]) => {
    setSelectedContactItems(selectedItems)
  }

  const handleBulkDelete = async () => {
    if (selectedContactItems.length === 0) return
    
    if (window.confirm(`Are you sure you want to delete ${selectedContactItems.length} contacts?`)) {
      try {
        for (const contact of selectedContactItems) {
          await deleteContact.mutateAsync(contact.contact_id)
        }
        // Bulk delete completed successfully
        setSelectedContactItems([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.response?.data?.message || error.message || 'Unknown error'
        alert(`Error deleting contacts: ${errorMessage}`)
      }
    }
  }

  const contacts = contactsData?.results || []

  // DataTable column configuration
  const columns: ColumnConfig<ContactListItem>[] = [
    {
      key: 'full_name',
      title: 'Contact Name',
      sortable: true,
      locked: true, // Lock the Contact Name column as it's required for navigation
      render: (_, contact) => (
        <div>
          <PrimaryLinkCell 
            text={contact.full_name}
            onClick={() => navigate(`/crm/contacts/${contact.contact_id}`)}
          />
          {contact.title && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {contact.title}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'account_name',
      title: 'Account',
      sortable: true,
      render: (_, contact) => {
        if (!contact.account_name) {
          return <span className="text-gray-400 dark:text-gray-500">No Account</span>
        }
        if (contact.account) {
          return (
            <PrimaryLinkCell 
              text={contact.account_name}
              onClick={() => navigate(`/crm/accounts/${contact.account}`)}
            />
          )
        }
        return <span className="text-gray-900 dark:text-gray-100">{contact.account_name}</span>
      }
    },
    {
      key: 'contact_info',
      title: 'Contact Info',
      render: (_, contact) => (
        <ContactInfoCell 
          email={contact.email}
          phone={contact.phone}
        />
      )
    },
    {
      key: 'owner_name',
      title: 'Owner',
      sortable: true,
      render: (value) => value || 'Unassigned'
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => <DateCell value={value} />
    }
  ]

  // DataTable action configuration
  const actions: ActionConfig<ContactListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (contact) => navigate(`/crm/contacts/${contact.contact_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (contact) => handleEditContact(contact),
      variant: 'default'
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (contact) => handleDelete(contact.contact_id, contact.full_name),
      variant: 'danger'
    }
  ]

  // Export configuration
  const exportColumns: ExportColumn<ContactListItem>[] = [
    { key: 'full_name', label: 'Contact Name' },
    { key: 'email', label: 'Email', formatter: (value) => value || '' },
    { key: 'phone', label: 'Phone', formatter: (value) => value || '' },
    { key: 'account_name', label: 'Account', formatter: (value) => value || 'No Account' },
    { key: 'title', label: 'Title', formatter: (value) => value || '' },
    { key: 'owner_name', label: 'Owner', formatter: (value) => value || 'Unassigned' },
    { key: 'created_at', label: 'Created Date', formatter: (value) => formatDateForExport(value) }
  ]

  // Column visibility management
  const {
    columnVisibility,
    updateColumnVisibility,
    resetToDefault
  } = useColumnVisibility(columns, {
    storageKey: 'contacts-list',
    defaultVisible: ['full_name', 'account_name', 'contact_info', 'owner_name', 'created_at']
  })

  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      
      {/* Controls */}
      <TableControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search contacts..."
        filters={
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {contacts.length} of {contactsData?.count} contacts
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ColumnManager
              columns={columns}
              visibleColumns={columnVisibility}
              onVisibilityChange={updateColumnVisibility}
              onReset={resetToDefault}
            />
            <ExportButton
              data={contacts}
              columns={exportColumns}
              filename={`contacts_${new Date().toISOString().slice(0, 10)}.csv`}
              searchTerm={searchTerm}
            />
            {selectedContactItems.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Delete Selected ({selectedContactItems.length})
              </button>
            )}
            <button
              onClick={handleNewContact}
              className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              + New Contact
            </button>
          </div>
        }
      />
      
      {/* DataTable */}
      <DataTable
        data={contacts}
        columns={columns}
        actions={actions}
        keyExtractor={(contact) => contact.contact_id.toString()}
        loading={isLoading}
        error={error ? String(error) : undefined}
        searchTerm={searchTerm}
        showSelection={true}
        onSelectionChange={handleSelectionChange}
        columnVisibility={columnVisibility}
        emptyMessage="No contacts found. Try adjusting your search or filters."
      />
      
      {/* Contact Form Side Panel */}
      <FormSidePanel
        isOpen={isPanelOpen}
        onClose={handlePanelClose}
        title="Create Contact"
        subtitle="Add a new contact to your CRM system"
        size="xl"
      >
        <ContactForm 
          onSuccess={handlePanelSuccess} 
          onCancel={handlePanelClose} 
        />
      </FormSidePanel>

      {/* Edit Contact Modal */}
      <ContactFormModal
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        contact={editingContact}
        onSuccess={handleEditModalSuccess}
      />
    </div>
  )
}