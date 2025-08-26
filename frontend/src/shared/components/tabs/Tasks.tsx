import React, { useState, useEffect } from 'react'
import { Plus, MoreHorizontal, Eye, Trash2, ChevronDown } from 'lucide-react'
import { CompactDataTable } from '../tables/CompactDataTable'
import { ColumnManager, type ColumnVisibility } from '../tables/ColumnManager'
import type { CompactColumnConfig } from '../tables/CompactDataTable'
import type { ColumnConfig } from '../tables/DataTable'
import { useEntityTasks, useCreateEntityTask, useCreateTask, useUpdateTask, useDeleteTask, type TaskCreate } from '@/shared/api/tasks'

interface TasksTabProps {
  entityId?: number
  entityType?: string
  // Modal state props (managed by parent)
  isCreateTaskOpen?: boolean
  isEditTaskOpen?: boolean
  onOpenCreateTask?: () => void
  onOpenEditTask?: (task: any) => void
  onCloseCreateTask?: () => void
  onCloseEditTask?: () => void
  // Task data for external LogContainers
  taskFormData?: any
  editingTask?: any
  onTaskFormDataChange?: (data: any) => void
  onEditingTaskChange?: (task: any) => void
}

export const TasksTab: React.FC<TasksTabProps> = ({ 
  entityId, 
  entityType,
  isCreateTaskOpen = false,
  isEditTaskOpen = false,
  onOpenCreateTask,
  onOpenEditTask,
  onCloseCreateTask,
  onCloseEditTask,
  taskFormData,
  editingTask,
  onTaskFormDataChange,
  onEditingTaskChange
}) => {
  // Internal state for form data (fallback if not provided by parent)
  const [internalFormData, setInternalFormData] = useState<TaskCreate>({
    title: '',
    description: '',
    priority: '',
    deadline: '',
    tags: [],
  })
  const [internalEditingTask, setInternalEditingTask] = useState<any>(null)
  
  // Use external form data if provided, otherwise use internal
  const formData = taskFormData || internalFormData
  const currentEditingTask = editingTask || internalEditingTask

  // Column visibility state
  const [columnVisibility, setColumnVisibility] = useState<ColumnVisibility>({
    title: true,
    description: true,
    status_display: true,
    priority_display: true,
    created_by_name: true,
    deadline: true,
    actions: true,
  })

  // State for dropdown menus
  const [openDropdownId, setOpenDropdownId] = useState<number | null>(null)
  const [openStatusDropdown, setOpenStatusDropdown] = useState<number | null>(null)
  const [, setSelectedTasks] = useState<any[]>([])
  const [isBulkDeleting, setIsBulkDeleting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // API hooks
  const { data: tasksData, isLoading, error } = useEntityTasks(
    entityType || '', 
    entityId || 0
  )
  const createTaskMutation = useCreateEntityTask()
  const createStandaloneTaskMutation = useCreateTask()
  const updateTaskMutation = useUpdateTask()
  const deleteTaskMutation = useDeleteTask()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      
      // Close action dropdown if clicking outside
      if (openDropdownId !== null && !target.closest('.dropdown-menu')) {
        setOpenDropdownId(null)
      }
      
      // Close status dropdown if clicking outside
      if (openStatusDropdown !== null && !target.closest('.status-dropdown')) {
        setOpenStatusDropdown(null)
      }
    }

    if (openDropdownId !== null || openStatusDropdown !== null) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId, openStatusDropdown])

  // Define column configurations for ColumnManager (with locked property)
  const allTaskColumns: ColumnConfig[] = [
    { key: 'title', title: 'Task Title', width: '200px', locked: true },
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
      key: 'status_display', 
      title: 'Status', 
      width: '14%',
      render: (value: string, item: any) => (
        <div className="relative flex items-center gap-1 status-dropdown">
          {/* Status Badge */}
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300'
          }`}>
            {value}
          </span>

          {/* Dropdown Button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              setOpenStatusDropdown(openStatusDropdown === item.id ? null : item.id)
            }}
            className="p-1 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Change status"
          >
            <ChevronDown size={12} />
          </button>

          {/* Status Options Dropdown - Using fixed positioning to avoid clipping */}
          {openStatusDropdown === item.id && (
            <div 
              className="fixed z-50 min-w-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg py-1"
              ref={(el) => {
                if (el && openStatusDropdown === item.id) {
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
                    el.style.right = 'auto'
                  }
                }
              }}
            >
              {[
                { value: 'pending', label: 'Pending' },
                { value: 'completed', label: 'Completed' }
              ].map((status) => (
                <button
                  key={status.value}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStatusChange(item.id, status.value)
                  }}
                  disabled={updateTaskMutation.isPending}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 ${
                    item.status === status.value ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )
    },
    { 
      key: 'priority_display', 
      title: 'Priority', 
      width: '12%',
      render: (value: string, item: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
          item.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300' :
          item.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300' :
          'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
        }`}>
          {value}
        </span>
      )
    },
    { key: 'created_by_name', title: 'Created By', width: '14%' },
    { 
      key: 'deadline', 
      title: 'Deadline', 
      width: '12%',
      render: (value: string, item: any) => {
        if (!value) return '-'
        const date = new Date(value)
        const isOverdue = item.is_overdue
        return (
          <span className={isOverdue ? 'text-red-600 dark:text-red-400 font-medium' : ''}>
            {date.toLocaleDateString()}
          </span>
        )
      }
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
                      handleEditTask(item)
                      setOpenDropdownId(null)
                    }}
                    disabled={updateTaskMutation.isPending}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Eye size={14} />
                    View
                  </button>
                  <button
                    onMouseDown={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDeleteTask(item)
                      setOpenDropdownId(null)
                    }}
                    disabled={deleteTaskMutation.isPending}
                    className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                    {deleteTaskMutation.isPending ? 'Deleting...' : 'Delete'}
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
  const visibleTaskColumns: CompactColumnConfig[] = allTaskColumns
    .filter(column => columnVisibility[column.key] !== false)
    .map(({ locked, ...column }) => ({
      ...column,
      sortable: column.key !== 'actions' && column.key !== 'description', // All columns except actions and description are sortable
      sortFn: column.key === 'deadline' ? (a: any, b: any) => {
        // Custom sort function for deadline - handle null/empty dates
        const aDate = a.deadline ? new Date(a.deadline).getTime() : 0
        const bDate = b.deadline ? new Date(b.deadline).getTime() : 0
        return aDate - bDate
      } : column.key === 'priority_display' ? (a: any, b: any) => {
        // Custom sort function for priority - urgent > high > medium > low
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
        return aPriority - bPriority
      } : column.key === 'status_display' ? (a: any, b: any) => {
        // Custom sort function for status - completed > pending
        const statusOrder = { completed: 2, pending: 1 }
        const aStatus = statusOrder[a.status as keyof typeof statusOrder] || 0
        const bStatus = statusOrder[b.status as keyof typeof statusOrder] || 0
        return aStatus - bStatus
      } : undefined
    }))

  // Use actual data or empty array
  const taskData = Array.isArray(tasksData) ? tasksData : []
  
  // Debug logging
  if (tasksData && !Array.isArray(tasksData)) {
    console.warn('Tasks data is not an array:', tasksData)
  }

  // Reset column visibility to default
  const resetColumnVisibility = () => {
    setColumnVisibility({
      title: true,
      description: true,
      status_display: true,
      priority_display: true,
      created_by_name: true,
      deadline: true,
      actions: true,
    })
  }

  // Status change handler
  const handleStatusChange = async (taskId: number, newStatus: string) => {
    try {
      await updateTaskMutation.mutateAsync({
        id: taskId,
        data: { status: newStatus as any }
      })
      setOpenStatusDropdown(null)
    } catch (error) {
      console.error('Failed to update task status:', error)
      // Optionally show error message
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        const errorMessage = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message ||
                           axiosError.message ||
                           'Unknown error occurred'
        alert(`Failed to update status: ${errorMessage}`)
      } else {
        alert('Failed to update task status. Please try again.')
      }
    }
  }

  // Action handlers for Edit and Delete
  const handleEditTask = (task: any) => {
    const newFormData = {
      title: task.title || '',
      description: task.description || '',
      priority: task.priority || '',
      deadline: task.deadline ? task.deadline.split('T')[0] : '', // Convert to YYYY-MM-DD format
      tags: task.tags || [],
    }
    
    if (onEditingTaskChange && onTaskFormDataChange) {
      // Use parent state management
      onEditingTaskChange(task)
      onTaskFormDataChange(newFormData)
      onOpenEditTask?.(task)
    } else {
      // Fallback to internal state
      setInternalEditingTask(task)
      setInternalFormData(newFormData)
    }
  }

  const handleDeleteTask = async (task: any) => {
    console.log('Delete button clicked for task:', task)
    if (confirm(`Are you sure you want to delete the task "${task.title}"?`)) {
      try {
        console.log('Deleting task with ID:', task.id, 'Title:', task.title)
        await deleteTaskMutation.mutateAsync(task.id)
        console.log('Task deleted successfully:', task.title)
        // Optionally show success message
        // alert(`Task "${task.title}" has been deleted successfully.`)
      } catch (error) {
        console.error('Failed to delete task:', error)
        
        // More detailed error handling
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as any
          const errorMessage = axiosError.response?.data?.detail || 
                             axiosError.response?.data?.message ||
                             axiosError.message ||
                             'Unknown error occurred'
          console.error('API Error Details:', axiosError.response?.data)
          alert(`Failed to delete task: ${errorMessage}`)
        } else {
          alert('Failed to delete task. Please try again.')
        }
      }
    }
  }

  // Bulk delete handler
  const handleBulkDeleteTasks = async (tasks: any[]) => {
    setIsBulkDeleting(true)
    try {
      // Delete tasks sequentially
      for (const task of tasks) {
        await deleteTaskMutation.mutateAsync(task.id)
      }
      setSelectedTasks([])
      console.log(`Successfully deleted ${tasks.length} task(s)`)
    } catch (error) {
      console.error('Failed to delete tasks:', error)
      
      // More detailed error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        const errorMessage = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message ||
                           axiosError.message ||
                           'Unknown error occurred'
        console.error('API Error Details:', axiosError.response?.data)
        alert(`Failed to delete tasks: ${errorMessage}`)
      } else {
        alert('Failed to delete tasks. Please try again.')
      }
    } finally {
      setIsBulkDeleting(false)
    }
  }

  const handleCreateTask = () => {
    const resetFormData: TaskCreate = {
      title: '',
      description: '',
      priority: '',
      deadline: '',
      tags: [],
    }
    
    if (onTaskFormDataChange && onOpenCreateTask) {
      // Use parent state management
      onTaskFormDataChange(resetFormData)
      onOpenCreateTask()
    } else {
      // Fallback to internal state
      setInternalFormData(resetFormData)
    }
  }

  const handleCloseCreateTask = () => {
    if (onCloseCreateTask) {
      onCloseCreateTask()
    }
  }

  const handleCloseEditTask = () => {
    if (onCloseEditTask) {
      onCloseEditTask()
    }
    if (onEditingTaskChange) {
      onEditingTaskChange(null)
    } else {
      setInternalEditingTask(null)
    }
  }

  const handleInputChange = (field: keyof TaskCreate, value: any) => {
    const newFormData = {
      ...formData,
      [field]: value
    }
    
    if (onTaskFormDataChange) {
      onTaskFormDataChange(newFormData)
    } else {
      setInternalFormData(newFormData)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Task title is required')
      return
    }


    try {
      const taskData: TaskCreate = {
        ...formData,
        // Convert empty strings to undefined for optional fields
        deadline: formData.deadline || undefined,
        description: formData.description || '', // Keep empty string for description
      }

      // Remove entity fields if they exist (they'll be sent via URL for entity-specific creation)
      delete taskData.entity_type
      delete taskData.entity_id
      
      // Ensure status is not sent (backend will use default 'pending')
      delete (taskData as any).status

      console.log('Creating task with data:', JSON.stringify(taskData, null, 2))
      console.log('Entity info:', { entityType, entityId })

      if (entityType && entityId) {
        // Create task for specific entity
        await createTaskMutation.mutateAsync({
          entityType,
          entityId,
          data: taskData
        })
      } else {
        // Create standalone task using the regular createTask API
        await createStandaloneTaskMutation.mutateAsync(taskData)
      }

      handleCloseCreateTask()
      const resetFormData: TaskCreate = {
        title: '',
        description: '',
        priority: '',
        deadline: '',
        tags: [],
      }
      if (onTaskFormDataChange) {
        onTaskFormDataChange(resetFormData)
      } else {
        setInternalFormData(resetFormData)
      }
    } catch (error) {
      console.error('Failed to create task:', error)
      
      // More detailed error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        console.error('Full error response:', {
          status: axiosError.response?.status,
          statusText: axiosError.response?.statusText,
          data: axiosError.response?.data,
          headers: axiosError.response?.headers,
          config: {
            url: axiosError.config?.url,
            method: axiosError.config?.method,
            data: axiosError.config?.data,
          }
        })
        
        const errorMessage = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message ||
                           JSON.stringify(axiosError.response?.data) ||
                           axiosError.message ||
                           'Unknown error occurred'
        alert(`Failed to create task: ${errorMessage}`)
      } else {
        alert('Failed to create task. Please try again.')
      }
    }
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      alert('Task title is required')
      return
    }


    if (!currentEditingTask) {
      alert('No task selected for editing')
      return
    }

    try {
      const taskData = {
        ...formData,
        // Convert empty strings to undefined for optional fields
        deadline: formData.deadline || undefined,
        description: formData.description || '', // Keep empty string for description
      }
      
      // Remove status field - it should only be updated via table dropdown
      delete (taskData as any).status

      console.log('Updating task with ID:', currentEditingTask.id, 'Data:', taskData)

      await updateTaskMutation.mutateAsync({
        id: currentEditingTask.id,
        data: taskData
      })

      handleCloseEditTask()
      const resetFormData: TaskCreate = {
        title: '',
        description: '',
        priority: '',
        deadline: '',
        tags: [],
      }
      if (onTaskFormDataChange) {
        onTaskFormDataChange(resetFormData)
      } else {
        setInternalFormData(resetFormData)
      }
    } catch (error) {
      console.error('Failed to update task:', error)
      
      // More detailed error handling
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as any
        const errorMessage = axiosError.response?.data?.detail || 
                           axiosError.response?.data?.message ||
                           axiosError.message ||
                           'Unknown error occurred'
        console.error('API Error Details:', axiosError.response?.data)
        alert(`Failed to update task: ${errorMessage}`)
      } else {
        alert('Failed to update task. Please try again.')
      }
    }
  }

  return (
    <div className="p-4 pt-2">

      {/* Tasks Table */}
      {!entityType || !entityId ? (
        <div className="text-gray-600 dark:text-gray-400 text-center py-8">
          <p>Tasks are available when viewing specific records.</p>
          <p className="text-sm">Navigate to an Account, Contact, Lead, or Deal to see related tasks.</p>
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 dark:text-red-400 text-center py-8">
          <p>Failed to load tasks.</p>
          <p className="text-sm mt-2">
            Error: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <p className="text-sm">Please try refreshing the page.</p>
        </div>
      ) : (
        <div onClick={(e) => {
          // Only close dropdowns if we're not clicking inside dropdown menus
          const target = e.target as HTMLElement
          if (!target.closest('.dropdown-menu') && !target.closest('.status-dropdown')) {
            setOpenDropdownId(null)
            setOpenStatusDropdown(null)
          }
        }}>
          <CompactDataTable
            data={taskData}
            columns={visibleTaskColumns}
            keyExtractor={(item) => item.id}
            emptyMessage={`No tasks found for this ${entityType}`}
            showHeader={true}
            showSelection={true}
            onSelectionChange={setSelectedTasks}
            bulkActions={{
              delete: {
                onDelete: handleBulkDeleteTasks,
                loading: isBulkDeleting
              }
            }}
            showControls={true}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            searchPlaceholder="Search tasks..."
            controlsActions={
              <>
                <ColumnManager
                  columns={allTaskColumns}
                  visibleColumns={columnVisibility}
                  onVisibilityChange={setColumnVisibility}
                  onReset={resetColumnVisibility}
                />
                <button
                  onClick={handleCreateTask}
                  disabled={!entityType || !entityId}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-[#14235f] hover:bg-[#14235f]/90 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} />
                  New Task
                </button>
              </>
            }
          />
        </div>
      )}

    </div>
  )
}