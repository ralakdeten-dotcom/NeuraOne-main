import React, { useState, useEffect } from 'react'
import { MoreHorizontal, Eye, Trash2, Calendar } from 'lucide-react'
import { CompactDataTable } from '../tables/CompactDataTable'
import { ColumnManager, type ColumnVisibility } from '../tables/ColumnManager'
import type { CompactColumnConfig } from '../tables/CompactDataTable'
import type { ColumnConfig } from '../tables/DataTable'
import { useEntityMeetings, useCreateEntityMeeting, useCreateMeeting, useUpdateMeeting, useDeleteMeeting, type MeetingCreate } from '@/shared/api/meetings'
import { MeetingLogContainers } from './MeetingLogContainers'

interface MeetingsTabProps {
  entityId?: number
  entityType?: string
  // Modal state props (managed by parent)
  isCreateMeetingOpen?: boolean
  isEditMeetingOpen?: boolean
  onOpenCreateMeeting?: () => void
  onOpenEditMeeting?: (meeting: any) => void
  onCloseCreateMeeting?: () => void
  onCloseEditMeeting?: () => void
  // Meeting data for external LogContainers
  meetingFormData?: any
  editingMeeting?: any
  onMeetingFormDataChange?: (data: any) => void
  onEditingMeetingChange?: (meeting: any) => void
  // Entity data for auto-populating contacted field
  entityData?: {
    first_name?: string
    last_name?: string
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

export const MeetingsTab: React.FC<MeetingsTabProps> = ({ 
  entityId, 
  entityType,
  isCreateMeetingOpen = false,
  isEditMeetingOpen = false,
  onOpenCreateMeeting,
  onOpenEditMeeting,
  onCloseCreateMeeting,
  onCloseEditMeeting,
  meetingFormData,
  editingMeeting,
  onMeetingFormDataChange,
  onEditingMeetingChange,
  entityData,
  availableContacts
}) => {
  // Internal state for form data (fallback if not provided by parent)
  const [internalFormData, setInternalFormData] = useState<MeetingCreate>({
    title: '',
    description: '',
    status: 'logged' as const,
    contact_name: '',
    meeting_date: '',
    meeting_time: '',
    duration: undefined,
    tags: [],
  })
  const [internalEditingMeeting, setInternalEditingMeeting] = useState<any>(null)
  
  // Internal modal state (fallback if not provided by parent)
  const [internalCreateModalOpen, setInternalCreateModalOpen] = useState(false)
  const [internalEditModalOpen, setInternalEditModalOpen] = useState(false)
  
  // Use external form data if provided, otherwise use internal
  const formData = meetingFormData || internalFormData
  const currentEditingMeeting = editingMeeting || internalEditingMeeting
  
  // Use external modal state if provided, otherwise use internal
  const isCreateModalOpen = isCreateMeetingOpen || internalCreateModalOpen
  const isEditModalOpen = isEditMeetingOpen || internalEditModalOpen

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    title: true,
    description: true,
    contact_display_name: true,
    status_display: true,
    meeting_date: true,
    meeting_time: true,
    duration_display: true,
    created_by_name: true,
    actions: true,
  })

  // State for dropdown menus
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const [, setSelectedMeetings] = useState<any[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // API hooks
  const { data: meetingsData, isLoading, error } = useEntityMeetings(
    entityType || '', 
    entityId || 0
  )
  const createMeetingMutation = useCreateEntityMeeting()
  const createStandaloneMeetingMutation = useCreateMeeting()
  const updateMeetingMutation = useUpdateMeeting()
  const deleteMeetingMutation = useDeleteMeeting()

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
  const allMeetingColumns: ColumnConfig[] = [
    { key: 'title', title: 'Meeting Purpose', width: '200px', locked: true },
    { 
      key: 'status_display', 
      title: 'Status', 
      width: '12%',
      render: (value: string, item: any) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          item.status === 'logged' 
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}>
          {item.status === 'logged' ? 'Logged' : 'Scheduled'}
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
    { key: 'created_by_name', title: 'Created By', width: '14%' },
    { 
      key: 'meeting_date', 
      title: 'Date', 
      width: '10%',
      render: (value: string) => {
        if (!value) return '-'
        const date = new Date(value)
        return date.toLocaleDateString()
      }
    },
    { 
      key: 'meeting_time', 
      title: 'Time', 
      width: '10%',
      render: (value: string) => {
        if (!value) return '-'
        // Format time (assuming it's in HH:MM:SS format)
        return value.substring(0, 5) // Remove seconds
      }
    },
    { 
      key: 'duration_display', 
      title: 'Duration', 
      width: '10%',
      render: (value: string) => value || 'N/A'
    },
    { 
      key: 'description', 
      title: 'Description', 
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
                className="dropdown-menu fixed z-[9999] min-w-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg py-1"
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
                    handleEditMeeting(item)
                    setOpenDropdownId(null)
                  }}
                  disabled={updateMeetingMutation.isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye size={14} />
                  View
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteMeeting(item)
                    setOpenDropdownId(null)
                  }}
                  disabled={deleteMeetingMutation.isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  {deleteMeetingMutation.isPending ? 'Deleting...' : 'Delete'}
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
  const visibleMeetingColumns: CompactColumnConfig[] = allMeetingColumns
    .filter(column => columnVisibility[column.key] !== false)
    .map(({ locked, ...column }) => ({
      ...column,
      sortable: column.key !== 'actions', // All columns except actions are sortable
      sortFn: column.key === 'meeting_date' ? (a: any, b: any) => {
        // Custom sort function for meeting_date - handle null/empty dates
        const aDate = a.meeting_date ? new Date(a.meeting_date).getTime() : 0
        const bDate = b.meeting_date ? new Date(b.meeting_date).getTime() : 0
        return aDate - bDate
      } : undefined
    }))

  // Use actual data or empty array
  const meetingData = Array.isArray(meetingsData) ? meetingsData : []
  
  // Debug logging
  if (meetingsData && !Array.isArray(meetingsData)) {
    console.warn('Meetings data is not an array:', meetingsData)
  }

  // Reset column visibility to default
  const resetColumnVisibility = () => {
    setColumnVisibility({
      title: true,
      description: true,
      contact_display_name: true,
      status_display: true,
      meeting_date: true,
      meeting_time: true,
      duration_display: true,
      created_by_name: true,
      actions: true,
    })
  }

  // Action handlers for Edit and Delete
  const handleEditMeeting = (meeting: any) => {
    const newFormData = {
      title: meeting.title || '',
      description: meeting.description || '',
      status: meeting.status || 'scheduled',
      contact_name: meeting.contact_display_name || meeting.contact_name || '',
      meeting_date: meeting.meeting_date || '',
      meeting_time: meeting.meeting_time || '',
      duration: meeting.duration || undefined,
      tags: meeting.tags || [],
    }
    
    if (onEditingMeetingChange && onMeetingFormDataChange) {
      // Use parent state management
      onEditingMeetingChange(meeting)
      onMeetingFormDataChange(newFormData)
      onOpenEditMeeting?.(meeting)
    } else {
      // Fallback to internal state
      setInternalEditingMeeting(meeting)
      setInternalFormData(newFormData)
      setInternalEditModalOpen(true)
    }
  }

  const handleDeleteMeeting = async (meeting: any) => {
    if (confirm(`Are you sure you want to delete the meeting "${meeting.title}"?`)) {
      try {
        console.log('Deleting meeting with ID:', meeting.id)
        await deleteMeetingMutation.mutateAsync(meeting.id)
        console.log('Meeting deleted successfully:', meeting.title)
      } catch (error) {
        console.error('Failed to delete meeting:', error)
        
        // More detailed error handling
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any
          const errorMessage = axiosError.response?.data?.detail || 
                             axiosError.response?.data?.message ||
                             axiosError.message ||
                             'Unknown error occurred'
          console.error('API Error Details:', axiosError.response?.data)
          alert(`Failed to delete meeting: ${errorMessage}`)
        } else {
          alert('Failed to delete meeting. Please try again.')
        }
      }
    }
  }

  // Bulk delete handler
  const handleBulkDeleteMeetings = async (meetings: any[]) => {
    setIsBulkDeleting(true)
    try {
      // Delete meetings sequentially
      for (const meeting of meetings) {
        await deleteMeetingMutation.mutateAsync(meeting.id)
      }
      setSelectedMeetings([])
      console.log(`Successfully deleted ${meetings.length} meeting(s)`)
    } catch (error) {
      console.error('Failed to delete meetings:', error)
      
      // More detailed error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        const errorMessage = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message ||
                           axiosError.message ||
                           'Unknown error occurred'
        console.error('API Error Details:', axiosError.response?.data)
        alert(`Failed to delete meetings: ${errorMessage}`)
      } else {
        alert('Failed to delete meetings. Please try again.')
      }
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleCreateMeeting = () => {
    const resetFormData: MeetingCreate = {
      title: '',
      description: '',
      status: 'logged' as const,
      contact_name: '',
      meeting_date: new Date().toISOString().split('T')[0],
      meeting_time: new Date().toTimeString().slice(0, 5),
      duration: undefined,
      tags: [],
    }
    
    if (onMeetingFormDataChange && onOpenCreateMeeting) {
      // Use parent state management
      onMeetingFormDataChange(resetFormData)
      onOpenCreateMeeting()
    } else {
      // Fallback to internal state
      setInternalFormData(resetFormData)
      setInternalCreateModalOpen(true)
    }
  }

  // Internal form handlers
  const handleInternalInputChange = (field: keyof MeetingCreate, value: any) => {
    if (onMeetingFormDataChange) {
      onMeetingFormDataChange({ ...formData, [field]: value })
    } else {
      setInternalFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const handleInternalCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (entityType && entityId) {
        await createMeetingMutation.mutateAsync({
          entityType,
          entityId,
          data: formData
        })
      } else {
        await createStandaloneMeetingMutation.mutateAsync(formData)
      }
      
      // Close modal
      if (onCloseCreateMeeting) {
        onCloseCreateMeeting()
      } else {
        setInternalCreateModalOpen(false)
      }
    } catch (error) {
      console.error('Failed to create meeting:', error)
    }
  }

  const handleInternalEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await updateMeetingMutation.mutateAsync({
        id: currentEditingMeeting.id,
        data: formData
      })
      
      // Close modal
      if (onCloseEditMeeting) {
        onCloseEditMeeting()
      } else {
        setInternalEditModalOpen(false)
      }
    } catch (error) {
      console.error('Failed to update meeting:', error)
    }
  }

  const handleCloseCreateModal = () => {
    if (onCloseCreateMeeting) {
      onCloseCreateMeeting()
    } else {
      setInternalCreateModalOpen(false)
    }
  }

  const handleCloseEditModal = () => {
    if (onCloseEditMeeting) {
      onCloseEditMeeting()
    } else {
      setInternalEditModalOpen(false)
    }
  }

  return (
    <div className="p-4 pt-2">

      {/* Meetings Table */}
      {!entityType || !entityId ? (
        <div className="text-gray-600 dark:text-gray-400 text-center py-8">
          <p>Meetings are available when viewing specific records.</p>
          <p className="text-sm">Navigate to an Account, Contact, Lead, or Deal to see related meetings.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 text-center py-8">
          <p>Failed to load meetings.</p>
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
            data={meetingData}
            columns={visibleMeetingColumns}
            keyExtractor={(item) => item.id}
            emptyMessage={`No meetings found for this ${entityType}`}
            showHeader={true}
            showSelection={true}
            onSelectionChange={setSelectedMeetings}
            bulkActions={{
              delete: {
                onDelete: handleBulkDeleteMeetings,
                loading: isBulkDeleting
              }
            }}
            showControls={true}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search meetings..."
            controlsActions={
              <>
                <ColumnManager
                  columns={allMeetingColumns}
                  visibleColumns={columnVisibility}
                  onVisibilityChange={setColumnVisibility}
                  onReset={resetColumnVisibility}
                />
                <button
                  onClick={handleCreateMeeting}
                  disabled={!entityType || !entityId}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#14235f] hover:bg-[#14235f]/90 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Calendar size={16} />
                  New Meeting
                </button>
              </>
            }
          />
        </div>
      )}

      {/* Meeting Log Containers */}
      <MeetingLogContainers
        isCreateMeetingOpen={isCreateModalOpen}
        onCloseCreateMeeting={handleCloseCreateModal}
        onSubmitCreate={handleInternalCreateSubmit}
        isEditMeetingOpen={isEditModalOpen}
        onCloseEditMeeting={handleCloseEditModal}
        onSubmitEdit={handleInternalEditSubmit}
        formData={formData}
        onInputChange={handleInternalInputChange}
        entityData={entityData}
        entityType={entityType as 'lead' | 'contact'}
        availableContacts={availableContacts}
        isCreatePending={createMeetingMutation.isPending || createStandaloneMeetingMutation.isPending}
        isUpdatePending={updateMeetingMutation.isPending}
      />
    </div>
  )
}