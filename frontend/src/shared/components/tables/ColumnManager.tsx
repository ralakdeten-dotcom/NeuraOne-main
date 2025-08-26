import { useState, useRef, useEffect } from 'react'
import { Settings, Eye, EyeOff, RotateCcw, Lock } from 'lucide-react'
import type { ColumnConfig } from './DataTable'

export interface ColumnVisibility {
  [key: string]: boolean
}

export interface ColumnManagerProps<T = any> {
  columns: ColumnConfig<T>[]
  visibleColumns: ColumnVisibility
  onVisibilityChange: (visibility: ColumnVisibility) => void
  onReset?: () => void
  className?: string
}

export const ColumnManager = <T extends Record<string, any>>({
  columns,
  visibleColumns,
  onVisibilityChange,
  onReset,
  className = ''
}: ColumnManagerProps<T>) => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isOpen])

  const toggleColumn = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey)
    if (column?.locked) return // Prevent toggling locked columns
    
    onVisibilityChange({
      ...visibleColumns,
      [columnKey]: !visibleColumns[columnKey]
    })
  }

  const showAllColumns = () => {
    const allVisible = columns.reduce((acc, column) => {
      acc[column.key] = true
      return acc
    }, {} as ColumnVisibility)
    onVisibilityChange(allVisible)
  }

  const hideAllColumns = () => {
    const allHidden = columns.reduce((acc, column) => {
      acc[column.key] = false
      return acc
    }, {} as ColumnVisibility)
    
    // Ensure locked columns remain visible
    columns.forEach(column => {
      if (column.locked) {
        allHidden[column.key] = true
      }
    })
    
    onVisibilityChange(allHidden)
  }

  const resetToDefault = () => {
    if (onReset) {
      onReset()
    } else {
      // Fallback: Reset to the original default configuration
      const defaultVisibility: ColumnVisibility = {}
      columns.forEach(column => {
        // Use defaultVisible if provided, otherwise show all columns
        defaultVisibility[column.key] = true // Default to showing all columns
        // Ensure locked columns are always visible
        if (column.locked) {
          defaultVisibility[column.key] = true
        }
      })
      onVisibilityChange(defaultVisibility)
    }
  }

  const visibleCount = Object.values(visibleColumns).filter(Boolean).length
  const totalColumns = columns.length
  const lockedCount = columns.filter(col => col.locked).length
  const isAllVisible = visibleCount === totalColumns
  const isAllHidden = visibleCount === lockedCount // Only locked columns visible
  
  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}

        className="
          flex items-center gap-1.5 px-3 py-2 text-sm font-medium
          text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100
          bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600
          border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500
          rounded-md transition-all duration-200 cursor-pointer
        "

      >
        <Settings size={16} />
        <span>Columns ({visibleCount})</span>
      </button>

      {isOpen && (
        <div
          className="
            absolute right-0 top-full mt-1 min-w-[280px] max-h-[400px] overflow-y-auto z-50
            bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 
            rounded-lg shadow-lg
          "
        >
          {/* Header */}
          <div className="p-3 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Manage Columns
              </h3>
              <button
                onClick={resetToDefault}

                className="
                  flex items-center gap-1 px-2 py-1 text-xs
                  text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200
                  bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700
                  border-none rounded cursor-pointer transition-colors
                "

              >
                <RotateCcw size={12} />
                Reset
              </button>
            </div>
            
            {/* Bulk Actions */}
            <div className="flex gap-2">
              <button
                onClick={showAllColumns}
                className={`px-2 py-1 text-xs border-none rounded cursor-pointer transition-colors ${
                  isAllVisible
                    ? 'text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/30'
                    : 'text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 bg-transparent hover:bg-blue-50 dark:hover:bg-blue-900/20'
                }`}
              >
                Show All
              </button>
              <button
                onClick={hideAllColumns}
                className={`px-2 py-1 text-xs border-none rounded cursor-pointer transition-colors ${
                  isAllHidden
                    ? 'text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Hide All
              </button>
            </div>
          </div>

          {/* Column List */}
          <div className="p-2">
            {columns.map((column) => {
              const isVisible = visibleColumns[column.key] !== false
              const isLocked = column.locked
              
              return (
                <div
                  key={column.key}

                  className="
                    flex items-center justify-between p-2 rounded cursor-pointer
                    hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                  "
                  onClick={() => toggleColumn(column.key)}

                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                        isVisible
                          ? 'bg-blue-600 border-blue-600'
                          : 'border-gray-300 dark:border-gray-500'
                      }`}
                    >
                      {isVisible && (
                        <svg
                          width="10"
                          height="8"
                          viewBox="0 0 10 8"
                          fill="none"
                          className="text-white"
                        >
                          <path
                            d="M9 1L3.5 6.5L1 4"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span className={`text-sm ${
                      isLocked 
                        ? 'text-gray-500 dark:text-gray-400' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {column.title}
                    </span>
                    {isLocked && (
                      <Lock size={12} className="text-gray-400 dark:text-gray-500" />
                    )}
                  </div>
                  
                  <div className="text-gray-400 dark:text-gray-500">
                    {isVisible ? <Eye size={16} /> : <EyeOff size={16} />}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-200 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
            {visibleCount} of {columns.length} columns visible
          </div>
        </div>
      )}
    </div>
  )
}