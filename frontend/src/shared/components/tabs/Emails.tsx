import React, { useState, useEffect } from 'react'
import { MoreHorizontal, Eye, Trash2, Mail } from 'lucide-react'
import { CompactDataTable } from '../tables/CompactDataTable'
import { ColumnManager, type ColumnVisibility } from '../tables/ColumnManager'
import type { CompactColumnConfig } from '../tables/CompactDataTable'
import type { ColumnConfig } from '../tables/DataTable'
import { useEntityEmails, useCreateEntityEmail, useCreateEmail, useUpdateEmail, useDeleteEmail, type EmailCreate } from '@/shared/api/emails'

interface EmailsTabProps {
  entityId?: number
  entityType?: string
  // Modal state props (managed by parent)
  isCreateEmailOpen?: boolean
  isEditEmailOpen?: boolean
  onOpenCreateEmail?: () => void
  onOpenEditEmail?: (email: any) => void
  onCloseCreateEmail?: () => void
  onCloseEditEmail?: () => void
  // Email data for external LogContainers
  emailFormData?: any
  editingEmail?: any
  onEmailFormDataChange?: (data: any) => void
  onEditingEmailChange?: (email: any) => void
  // Entity data for auto-populating contact field
  entityData?: {
    first_name?: string
    last_name?: string
    email?: string
  }
  // For accounts: provide list of contacts to choose from
  availableContacts?: {
    contact_id: number
    first_name: string
    last_name: string
    email?: string
    phone?: string
  }[]
}

export const EmailsTab: React.FC<EmailsTabProps> = ({ 
  entityId, 
  entityType,
  isCreateEmailOpen = false,
  isEditEmailOpen = false,
  onOpenCreateEmail,
  onOpenEditEmail,
  onCloseCreateEmail,
  onCloseEditEmail,
  emailFormData,
  editingEmail,
  onEmailFormDataChange,
  onEditingEmailChange,
  entityData,
  availableContacts
}) => {
  // Internal state for form data (fallback if not provided by parent)
  const [internalFormData, setInternalFormData] = useState<EmailCreate>({
    subject: '',
    content: '',
    email_address: '',
    direction: 'outbound' as const,
    status: 'sent' as const,
    contact_name: '',
    email_date: '',
    email_time: '',
    tags: [],
  })
  const [internalEditingEmail, setInternalEditingEmail] = useState<any>(null)
  
  // Use external form data if provided, otherwise use internal
  const formData = emailFormData || internalFormData
  const currentEditingEmail = editingEmail || internalEditingEmail

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    subject: true,
    status: true,
    content: true,
    contact_display_name: true,
    email_date: true,
    email_time: true,
    email_address: true,
    created_by_name: true,
    actions: true,
  })

  // State for dropdown menus
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const [, setSelectedEmails] = useState<any[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // API hooks
  const { data: emailsData, isLoading, error } = useEntityEmails(
    entityType || '', 
    entityId || 0
  )
  const createEmailMutation = useCreateEntityEmail()
  const createStandaloneEmailMutation = useCreateEmail()
  const updateEmailMutation = useUpdateEmail()
  const deleteEmailMutation = useDeleteEmail()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Close action dropdown if clicking outside
      if (openDropdownId !== null && !target.closest('.dropdown-menu')) {
        setOpenDropdownId(null)
      }
    }

    if (openDropdownId !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId])

  // Define column configurations for ColumnManager (with locked property)
  const allEmailColumns: ColumnConfig[] = [
    { key: 'subject', title: 'Subject', width: '200px', locked: true },
    { 
      key: 'status', 
      title: 'Status', 
      width: '12%',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'sent' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            : value === 'received'
            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
            : value === 'draft'
            ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
        }`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    { 
      key: 'contact_display_name', 
      title: 'Contact', 
      width: '16%',
      render: (value: string) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {value || 'Unknown Contact'}
        </span>
      )
    },
    { 
      key: 'email_address', 
      title: 'Email Address', 
      width: '18%',
      render: (value: string) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {value || '-'}
        </span>
      )
    },
    { key: 'created_by_name', title: 'Created By', width: '14%' },
    { 
      key: 'email_date', 
      title: 'Date', 
      width: '10%',
      render: (value: string) => {
        if (!value) return '-'
        const date = new Date(value)
        return date.toLocaleDateString()
      }
    },
    { 
      key: 'email_time', 
      title: 'Time', 
      width: '10%',
      render: (value: string) => {
        if (!value) return '-'
        // Format time (assuming it's in HH:MM:SS format)
        return value.substring(0, 5) // Remove seconds
      }
    },
    { 
      key: 'content', 
      title: 'Content', 
      width: '16%',
      render: (value: string) => (
        <div className="max-w-xs">
          <span 
            className="text-sm text-gray-700 dark:text-gray-300"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}
            title={value || ''}
          >
            {value || '-'}
          </span>
        </div>
      )
    },
    { 
      key: 'actions', 
      title: 'Actions', 
      width: '12%', 
      align: 'left',
      locked: true,
      render: (value: any, item: any) => (
        <div className="flex justify-start items-center">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation()
                setOpenDropdownId(openDropdownId === item.id ? null : item.id)
              }}
              className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <MoreHorizontal size={16} />
            </button>

            {openDropdownId === item.id && (
              <div 
                className="fixed z-[9999] min-w-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg py-1"
                ref={(el) => {
                  if (el && openDropdownId === item.id) {
                    const button = el.parentElement?.querySelector('button')
                    if (button) {
                      const rect = button.getBoundingClientRect()
                      const viewportHeight = window.innerHeight
                      const spaceBelow = viewportHeight - rect.bottom
                      const dropdownHeight = 80 // Approximate height of dropdown
                      
                      if (spaceBelow < dropdownHeight) {
                        // Position above button, right-aligned
                        el.style.top = `${rect.top - dropdownHeight}px`
                      } else {
                        // Position below button, right-aligned
                        el.style.top = `${rect.bottom + 2}px`
                      }
                      // Align dropdown to the right of the button
                      el.style.left = `${rect.left}px`
                    }
                  }
                }}
              >
                <div className="py-1">
                <button
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleEditEmail(item)
                    setOpenDropdownId(null)
                  }}
                  disabled={updateEmailMutation.isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye size={14} />
                  View
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteEmail(item)
                    setOpenDropdownId(null)
                  }}
                  disabled={deleteEmailMutation.isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  {deleteEmailMutation.isPending ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
            )}
          </div>
        </div>
      )
    }
  ]

  // Filter visible columns for CompactDataTable and add sortable functionality
  const visibleEmailColumns: CompactColumnConfig[] = allEmailColumns
    .filter(column => columnVisibility[column.key] !== false)
    .map(({ locked, ...column }) => ({
      ...column,
      sortable: column.key !== 'actions', // All columns except actions are sortable
      sortFn: column.key === 'email_date' ? (a: any, b: any) => {
        // Custom sort function for email_date - handle null/empty dates
        const aDate = a.email_date ? new Date(a.email_date).getTime() : 0
        const bDate = b.email_date ? new Date(b.email_date).getTime() : 0
        return aDate - bDate
      } : undefined
    }))

  // Use actual data or empty array
  const emailData = Array.isArray(emailsData) ? emailsData : []
  
  // Debug logging
  if (emailsData && !Array.isArray(emailsData)) {
    console.warn('Emails data is not an array:', emailsData)
  }

  // Reset column visibility to default
  const resetColumnVisibility = () => {
    setColumnVisibility({
      subject: true,
      status: true,
      content: true,
      contact_display_name: true,
      email_date: true,
      email_time: true,
      email_address: true,
      created_by_name: true,
      actions: true,
    })
  }

  // Action handlers for Edit and Delete
  const handleEditEmail = (email: any) => {
    const newFormData = {
      subject: email.subject || '',
      content: email.content || '',
      email_address: email.email_address || '',
      direction: email.direction || '',
      status: email.status || 'sent',
      contact_name: email.contact_display_name || email.contact_name || '',
      email_date: email.email_date || '',
      email_time: email.email_time || '',
      cc_addresses: email.cc_addresses || '',
      bcc_addresses: email.bcc_addresses || '',
      message_id: email.message_id || '',
      thread_id: email.thread_id || '',
      tags: email.tags || [],
    }
    
    if (onEditingEmailChange && onEmailFormDataChange) {
      // Use parent state management
      onEditingEmailChange(email)
      onEmailFormDataChange(newFormData)
      onOpenEditEmail?.(email)
    } else {
      // Fallback to internal state
      setInternalEditingEmail(email)
      setInternalFormData(newFormData)
    }
  }

  const handleDeleteEmail = async (email: any) => {
    if (confirm(`Are you sure you want to delete the email "${email.subject}"?`)) {
      try {
        console.log('Deleting email with ID:', email.id)
        await deleteEmailMutation.mutateAsync(email.id)
        console.log('Email deleted successfully:', email.subject)
      } catch (error) {
        console.error('Failed to delete email:', error)
        
        // More detailed error handling
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any
          const errorMessage = axiosError.response?.data?.detail || 
                             axiosError.response?.data?.message ||
                             axiosError.message ||
                             'Unknown error occurred'
          console.error('API Error Details:', axiosError.response?.data)
          alert(`Failed to delete email: ${errorMessage}`)
        } else {
          alert('Failed to delete email. Please try again.')
        }
      }
    }
  }

  // Bulk delete handler
  const handleBulkDeleteEmails = async (emails: any[]) => {
    setIsBulkDeleting(true)
    try {
      // Delete emails sequentially
      for (const email of emails) {
        await deleteEmailMutation.mutateAsync(email.id)
      }
      setSelectedEmails([])
      console.log(`Successfully deleted ${emails.length} email(s)`)
    } catch (error) {
      console.error('Failed to delete emails:', error)
      
      // More detailed error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        const errorMessage = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message ||
                           axiosError.message ||
                           'Unknown error occurred'
        console.error('API Error Details:', axiosError.response?.data)
        alert(`Failed to delete emails: ${errorMessage}`)
      } else {
        alert('Failed to delete emails. Please try again.')
      }
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleCreateEmail = () => {
    const resetFormData: EmailCreate = {
      subject: '',
      content: '',
      email_address: '',
      direction: 'outbound' as const,
      status: 'sent' as const,
      contact_name: '',
      email_date: new Date().toISOString().split('T')[0],
      email_time: new Date().toTimeString().slice(0, 5),
      tags: [],
    }
    
    if (onEmailFormDataChange && onOpenCreateEmail) {
      // Use parent state management
      onEmailFormDataChange(resetFormData)
      onOpenCreateEmail()
    } else {
      // Fallback to internal state
      setInternalFormData(resetFormData)
      // TODO: Need to handle opening modal when using internal state
    }
  }

  return (
    <div className="p-4 pt-2">

      {/* Emails Table */}
      {!entityType || !entityId ? (
        <div className="text-gray-600 dark:text-gray-400 text-center py-8">
          <p>Emails are available when viewing specific records.</p>
          <p className="text-sm">Navigate to an Account, Contact, Lead, or Deal to see related emails.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 text-center py-8">
          <p>Failed to load emails.</p>
          <p className="text-sm mt-2">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      ) : (
        <div onClick={(e) => {
          // Only close dropdowns if we're not clicking inside dropdown menus
          const target = e.target as HTMLElement
          if (!target.closest('.dropdown-menu')) {
            setOpenDropdownId(null)
          }
        }}>
          <CompactDataTable
            data={emailData}
            columns={visibleEmailColumns}
            keyExtractor={(item) => item.id}
            emptyMessage={`No emails found for this ${entityType}`}
            showHeader={true}
            showSelection={true}
            onSelectionChange={setSelectedEmails}
            bulkActions={{
              delete: {
                onDelete: handleBulkDeleteEmails,
                loading: isBulkDeleting
              }
            }}
            showControls={true}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search emails..."
            controlsActions={
              <>
                <ColumnManager
                  columns={allEmailColumns}
                  visibleColumns={columnVisibility}
                  onVisibilityChange={setColumnVisibility}
                  onReset={resetColumnVisibility}
                />
                <button
                  onClick={handleCreateEmail}
                  disabled={!entityType || !entityId}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#14235f] hover:bg-[#14235f]/90 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Mail size={16} />
                  New Email
                </button>
              </>
            }
          />
        </div>
      )}

    </div>
  )
}