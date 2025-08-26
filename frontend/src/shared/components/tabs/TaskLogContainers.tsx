import React from 'react'
import { LogContainer } from '../templates/LogContainer'
import type { TaskCreate } from '@/shared/api/tasks'

interface TaskLogContainersProps {
  // Create task modal
  isCreateTaskOpen: boolean
  onCloseCreateTask: () => void
  onSubmitCreate: (e: React.FormEvent) => Promise<void>
  
  // Edit task modal
  isEditTaskOpen: boolean
  onCloseEditTask: () => void
  onSubmitEdit: (e: React.FormEvent) => Promise<void>
  
  // Form data
  formData: TaskCreate
  onInputChange: (field: keyof TaskCreate, value: any) => void
  
  // Mutation states
  isCreatePending?: boolean
  isUpdatePending?: boolean
}

export const TaskLogContainers: React.FC<TaskLogContainersProps> = ({
  isCreateTaskOpen,
  onCloseCreateTask,
  onSubmitCreate,
  isEditTaskOpen,
  onCloseEditTask,
  onSubmitEdit,
  formData,
  onInputChange,
  isCreatePending = false,
  isUpdatePending = false
}) => {
  return (
    <>
      {/* Create Task LogContainer */}
      <LogContainer
        title="New Task"
        isOpen={isCreateTaskOpen}
        onClose={onCloseCreateTask}
        width="600px"
        height="500px"
      >
        <div className="space-y-4">
          <form onSubmit={onSubmitCreate} className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => onInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => onInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter task description (optional)"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority *
              </label>
              <select 
                value={formData.priority}
                onChange={(e) => onInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="">Choose priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => onInputChange('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCloseCreateTask}
                disabled={isCreatePending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatePending || !formData.title.trim() || !formData.priority}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isCreatePending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Create New Task
              </button>
            </div>
          </form>
        </div>
      </LogContainer>

      {/* View Task LogContainer */}
      <LogContainer
        title="View Task"
        isOpen={isEditTaskOpen}
        onClose={onCloseEditTask}
        width="600px"
        height="500px"
      >
        <div className="space-y-4">
          <form onSubmit={onSubmitEdit} className="space-y-4">
            {/* Task Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Task Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => onInputChange('title', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter task title"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => onInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                placeholder="Enter task description (optional)"
              />
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Priority *
              </label>
              <select 
                value={formData.priority}
                onChange={(e) => onInputChange('priority', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                required
              >
                <option value="">Choose priority</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Deadline */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Deadline
              </label>
              <input
                type="date"
                value={formData.deadline}
                onChange={(e) => onInputChange('deadline', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              />
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onCloseEditTask}
                disabled={isUpdatePending}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUpdatePending || !formData.title.trim() || !formData.priority}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isUpdatePending && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                )}
                Save Task
              </button>
            </div>
          </form>
        </div>
      </LogContainer>
    </>
  )
}