import React, { useState, useEffect } from 'react'
import { Plus, MoreHorizontal, Eye, Trash2, ChevronDown, Phone, PhoneCall, PhoneIncoming, PhoneOutgoing } from 'lucide-react'
import { CompactDataTable } from '../tables/CompactDataTable'
import { ColumnManager, type ColumnVisibility } from '../tables/ColumnManager'
import type { CompactColumnConfig } from '../tables/CompactDataTable'
import type { ColumnConfig } from '../tables/DataTable'
import { useEntityCalls, useCreateEntityCall, useCreateCall, useUpdateCall, useDeleteCall, type CallCreate } from '@/shared/api/calls'

interface CallsTabProps {
  entityId?: number
  entityType?: string
  // Modal state props (managed by parent)
  isCreateCallOpen?: boolean
  isEditCallOpen?: boolean
  onOpenCreateCall?: () => void
  onOpenEditCall?: (call: any) => void
  onCloseCreateCall?: () => void
  onCloseEditCall?: () => void
  // Call data for external LogContainers
  callFormData?: any
  editingCall?: any
  onCallFormDataChange?: (data: any) => void
  onEditingCallChange?: (call: any) => void
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

export const CallsTab: React.FC<CallsTabProps> = ({ 
  entityId, 
  entityType,
  isCreateCallOpen = false,
  isEditCallOpen = false,
  onOpenCreateCall,
  onOpenEditCall,
  onCloseCreateCall,
  onCloseEditCall,
  callFormData,
  editingCall,
  onCallFormDataChange,
  onEditingCallChange,
  entityData,
  availableContacts
}) => {
  // Internal state for form data (fallback if not provided by parent)
  const [internalFormData, setInternalFormData] = useState<CallCreate>({
    title: '',
    status: '',
    description: '',
    direction: '',
    contact_name: '',
    call_date: '',
    call_time: '',
    duration: undefined,
    tags: [],
  })
  const [internalEditingCall, setInternalEditingCall] = useState<any>(null)
  
  // Use external form data if provided, otherwise use internal
  const formData = callFormData || internalFormData
  const currentEditingCall = editingCall || internalEditingCall

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    title: true,
    status: true,
    description: true,
    contact_display_name: true,
    contact_phone: true,
    direction_display: true,
    call_date: true,
    call_time: true,
    duration_display: true,
    created_by_name: true,
    actions: true,
  })

  // State for dropdown menus
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const [, setSelectedCalls] = useState<any[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // API hooks
  const { data: callsData, isLoading, error } = useEntityCalls(
    entityType || '', 
    entityId || 0
  )
  const createCallMutation = useCreateEntityCall()
  const createStandaloneCallMutation = useCreateCall()
  const updateCallMutation = useUpdateCall()
  const deleteCallMutation = useDeleteCall()

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
  const allCallColumns: ColumnConfig[] = [
    { key: 'title', title: 'Call Purpose', width: '200px', locked: true },
    { 
      key: 'status', 
      title: 'Status', 
      width: '12%',
      render: (value: string) => (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          value === 'logged' 
            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
        }`}>
          {value === 'logged' ? 'Logged' : 'Scheduled'}
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
      key: 'contact_phone', 
      title: 'Phone', 
      width: '14%',
      render: (value: string, item: any) => (
        <span className="text-sm text-gray-700 dark:text-gray-300">
          {value || item.contact_display_phone || '-'}
        </span>
      )
    },
    { 
      key: 'direction_display', 
      title: 'Direction', 
      width: '12%',
      render: (value: string, item: any) => (
        <div className="flex items-center gap-2">
          {item.direction === 'inbound' ? (
            <PhoneIncoming size={14} className="text-green-600 dark:text-green-400" />
          ) : (
            <PhoneOutgoing size={14} className="text-blue-600 dark:text-blue-400" />
          )}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.direction === 'inbound' 
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
          }`}>
            {value}
          </span>
        </div>
      )
    },
    { key: 'created_by_name', title: 'Created By', width: '14%' },
    { 
      key: 'call_date', 
      title: 'Date', 
      width: '10%',
      render: (value: string) => {
        if (!value) return '-'
        const date = new Date(value)
        return date.toLocaleDateString()
      }
    },
    { 
      key: 'call_time', 
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
                    handleEditCall(item)
                    setOpenDropdownId(null)
                  }}
                  disabled={updateCallMutation.isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Eye size={14} />
                  View
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleDeleteCall(item)
                    setOpenDropdownId(null)
                  }}
                  disabled={deleteCallMutation.isPending}
                  className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Trash2 size={14} />
                  {deleteCallMutation.isPending ? 'Deleting...' : 'Delete'}
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
  const visibleCallColumns: CompactColumnConfig[] = allCallColumns
    .filter(column => columnVisibility[column.key] !== false)
    .map(({ locked, ...column }) => ({
      ...column,
      sortable: column.key !== 'actions', // All columns except actions are sortable
      sortFn: column.key === 'call_date' ? (a: any, b: any) => {
        // Custom sort function for call_date - handle null/empty dates
        const aDate = a.call_date ? new Date(a.call_date).getTime() : 0
        const bDate = b.call_date ? new Date(b.call_date).getTime() : 0
        return aDate - bDate
      } : undefined
    }))

  // Use actual data or empty array
  const callData = Array.isArray(callsData) ? callsData : []
  
  // Debug logging
  if (callsData && !Array.isArray(callsData)) {
    console.warn('Calls data is not an array:', callsData)
  }
  
  // Debug: Check if description field is present in calls data
  // console.log('🔍 Calls data sample:', callData.slice(0, 2))
  // console.log('🔍 Visible columns:', visibleCallColumns.map(col => col.key))
  // console.log('🔍 First call description field:', callData[0]?.description)
  // console.log('🔍 All fields in first call:', callData[0] ? Object.keys(callData[0]) : 'No calls')

  // Reset column visibility to default
  const resetColumnVisibility = () => {
    setColumnVisibility({
      title: true,
      status: true,
      description: true,
      contact_display_name: true,
      contact_phone: true,
      direction_display: true,
      call_date: true,
      call_time: true,
      duration_display: true,
      created_by_name: true,
      actions: true,
    })
  }


  // Action handlers for Edit and Delete
  const handleEditCall = (call: any) => {
    const newFormData = {
      title: call.title || '',
      status: call.status || 'logged',
      description: call.description || '',
      direction: call.direction || '',
      contact_name: call.contact_display_name || call.contact_name || '',
      call_date: call.call_date || '',
      call_time: call.call_time || '',
      duration: call.duration || undefined,
      tags: call.tags || [],
    }
    
    if (onEditingCallChange && onCallFormDataChange) {
      // Use parent state management
      onEditingCallChange(call)
      onCallFormDataChange(newFormData)
      onOpenEditCall?.(call)
    } else {
      // Fallback to internal state
      setInternalEditingCall(call)
      setInternalFormData(newFormData)
    }
  }

  const handleDeleteCall = async (call: any) => {
    if (confirm(`Are you sure you want to delete the call "${call.title}"?`)) {
      try {
        console.log('Deleting call with ID:', call.id)
        await deleteCallMutation.mutateAsync(call.id)
        console.log('Call deleted successfully:', call.title)
      } catch (error) {
        console.error('Failed to delete call:', error)
        
        // More detailed error handling
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any
          const errorMessage = axiosError.response?.data?.detail || 
                             axiosError.response?.data?.message ||
                             axiosError.message ||
                             'Unknown error occurred'
          console.error('API Error Details:', axiosError.response?.data)
          alert(`Failed to delete call: ${errorMessage}`)
        } else {
          alert('Failed to delete call. Please try again.')
        }
      }
    }
  }

  // Bulk delete handler
  const handleBulkDeleteCalls = async (calls: any[]) => {
    setIsBulkDeleting(true)
    try {
      // Delete calls sequentially
      for (const call of calls) {
        await deleteCallMutation.mutateAsync(call.id)
      }
      setSelectedCalls([])
      console.log(`Successfully deleted ${calls.length} call(s)`)
    } catch (error) {
      console.error('Failed to delete calls:', error)
      
      // More detailed error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        const errorMessage = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message ||
                           axiosError.message ||
                           'Unknown error occurred'
        console.error('API Error Details:', axiosError.response?.data)
        alert(`Failed to delete calls: ${errorMessage}`)
      } else {
        alert('Failed to delete calls. Please try again.')
      }
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleCreateCall = () => {
    const resetFormData: CallCreate = {
      title: '',
      status: '',
      description: '',
      direction: '',
      contact_name: '',
      call_date: new Date().toISOString().split('T')[0],
      call_time: new Date().toTimeString().slice(0, 5),
      duration: undefined,
      tags: [],
    }
    
    if (onCallFormDataChange && onOpenCreateCall) {
      // Use parent state management
      onCallFormDataChange(resetFormData)
      onOpenCreateCall()
    } else {
      // Fallback to internal state
      setInternalFormData(resetFormData)
      // TODO: Need to handle opening modal when using internal state
    }
  }

  return (
    <div className="p-4 pt-2">

      {/* Calls Table */}
      {!entityType || !entityId ? (
        <div className="text-gray-600 dark:text-gray-400 text-center py-8">
          <p>Calls are available when viewing specific records.</p>
          <p className="text-sm">Navigate to an Account, Contact, Lead, or Deal to see related calls.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 text-center py-8">
          <p>Failed to load calls.</p>
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
            data={callData}
            columns={visibleCallColumns}
            keyExtractor={(item) => item.id}
            emptyMessage={`No calls found for this ${entityType}`}
            showHeader={true}
            showSelection={true}
            onSelectionChange={setSelectedCalls}
            bulkActions={{
              delete: {
                onDelete: handleBulkDeleteCalls,
                loading: isBulkDeleting
              }
            }}
            showControls={true}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search calls..."
            controlsActions={
              <>
                <ColumnManager
                  columns={allCallColumns}
                  visibleColumns={columnVisibility}
                  onVisibilityChange={setColumnVisibility}
                  onReset={resetColumnVisibility}
                />
                <button
                  onClick={handleCreateCall}
                  disabled={!entityType || !entityId}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#14235f] hover:bg-[#14235f]/90 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Phone size={16} />
                  New Call
                </button>
              </>
            }
          />
        </div>
      )}

    </div>
  )
}