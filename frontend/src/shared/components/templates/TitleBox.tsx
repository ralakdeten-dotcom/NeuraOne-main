import React, { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { MoreHorizontal, Edit, Trash2, CheckSquare, Mail, Phone, Calendar } from 'lucide-react'

interface TitleBoxProps {
  children: React.ReactNode
  className?: string
  onEdit?: () => void
  onDelete?: () => void
  onCreateTask?: () => void
  onCreateCall?: () => void
  onCreateEmail?: () => void
  onCreateMeeting?: () => void
  showActions?: boolean
  showQuickActions?: boolean // New prop to control visibility of quick action icons
}

export const TitleBox: React.FC<TitleBoxProps> = ({ 
  children, 
  className = '',
  onEdit,
  onDelete,
  onCreateTask,
  onCreateCall,
  onCreateEmail,
  onCreateMeeting,
  showActions = false,
  showQuickActions = false
}) => {
  console.log('🐛 TitleBox props:', { 
    showActions, 
    showQuickActions, 
    hasOnEdit: !!onEdit, 
    hasOnDelete: !!onDelete,
    hasOnCreateTask: !!onCreateTask,
    hasOnCreateCall: !!onCreateCall,
    hasOnCreateEmail: !!onCreateEmail,
    hasOnCreateMeeting: !!onCreateMeeting
  })
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 })
  const dropdownRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  useEffect(() => {
    if (isDropdownOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        right: window.innerWidth - rect.right
      })
    }
  }, [isDropdownOpen])

  const handleEdit = () => {
    setIsDropdownOpen(false)
    onEdit?.()
  }

  const handleDelete = () => {
    setIsDropdownOpen(false)
    onDelete?.()
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg mb-6 relative ${className}`}>
      <div className="px-6 py-4">
        {children}
      </div>
      
      {/* Quick actions and menu - positioned absolutely and centered vertically */}
      {(showActions && (onEdit || onDelete)) || showQuickActions || onCreateTask ? (
        <div className="absolute top-1/2 right-6 transform -translate-y-1/2 flex items-center space-x-1">
          {/* Quick Action Icons */}
          {showQuickActions && (
            <>
              {console.log('🐛 TitleBox: Rendering quick actions', { 
                showQuickActions, 
                onCreateEmail: !!onCreateEmail, 
                onCreateCall: !!onCreateCall, 
                onCreateMeeting: !!onCreateMeeting, 
                onCreateTask: !!onCreateTask 
              })}
              {/* Create Email Icon */}
              {onCreateEmail && (
                <button
                  onClick={() => {
                    console.log('🐛 TitleBox: Email button clicked!')
                    onCreateEmail()
                  }}
                  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 dark:text-gray-400 dark:hover:text-blue-400 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                  title="New Email"
                >
                  <Mail className="w-5 h-5" />
                </button>
              )}
              
              {/* Create Call Icon */}
              {onCreateCall && (
                <button
                  onClick={() => {
                    console.log('🐛 TitleBox: Call button clicked!')
                    onCreateCall()
                  }}
                  className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 dark:text-gray-400 dark:hover:text-green-400 dark:hover:bg-green-900/20 rounded-md transition-colors"
                  title="New Call"
                >
                  <Phone className="w-5 h-5" />
                </button>
              )}
              
              {/* Create Meeting Icon */}
              {onCreateMeeting && (
                <button
                  onClick={onCreateMeeting}
                  className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 dark:text-gray-400 dark:hover:text-purple-400 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                  title="New Meeting"
                >
                  <Calendar className="w-5 h-5" />
                </button>
              )}
              
              {/* Create Task Icon */}
              {onCreateTask && (
                <button
                  onClick={onCreateTask}
                  className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 dark:text-gray-400 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 rounded-md transition-colors"
                  title="New Task"
                >
                  <CheckSquare className="w-5 h-5" />
                </button>
              )}
            </>
          )}
          
          {/* Standalone Create Task Icon (for backward compatibility) */}
          {!showQuickActions && onCreateTask && (
            <button
              onClick={onCreateTask}
              className="p-2 text-gray-600 hover:text-orange-600 hover:bg-orange-50 dark:text-gray-400 dark:hover:text-orange-400 dark:hover:bg-orange-900/20 rounded-md transition-colors"
              title="New Task"
            >
              <CheckSquare className="w-5 h-5" />
            </button>
          )}
          
          {/* Three-dot menu */}
          {showActions && (onEdit || onDelete) && (
            <button
              ref={buttonRef}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-md transition-colors"
              title="More options"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
          )}
        </div>
      ) : null}
      
      {/* Dropdown Menu - rendered as portal */}
      {isDropdownOpen && showActions && (onEdit || onDelete) && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed w-48 bg-white dark:bg-gray-700 rounded-md shadow-xl border border-gray-200 dark:border-gray-600 z-[9999]"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`
          }}
        >
          <div className="py-1">
            {onEdit && (
              <button
                onClick={handleEdit}
                className="w-full flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Edit className="w-4 h-4 mr-3" />
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={handleDelete}
                className="w-full flex items-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-3" />
                Delete
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  )
} 