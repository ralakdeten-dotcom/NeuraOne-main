import React, { useState } from 'react'
import { Settings, Eye, EyeOff } from 'lucide-react'

export interface WidgetConfig {
  id: string
  name: string
  isVisible: boolean
}

interface WidgetManagerProps {
  widgets: WidgetConfig[]
  onWidgetVisibilityChange: (widgetId: string, isVisible: boolean) => void
  className?: string
}

export const WidgetManager: React.FC<WidgetManagerProps> = ({
  widgets,
  onWidgetVisibilityChange,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)

  const handleToggleWidget = (widgetId: string, currentVisibility: boolean) => {
    onWidgetVisibilityChange(widgetId, !currentVisibility)
  }

  return (
    <div className={`relative ${className}`}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 text-white text-opacity-90 hover:text-white hover:bg-black hover:bg-opacity-10 rounded transition-colors"
        title="Manage widgets"
      >
        <Settings className="w-4 h-4" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Menu */}
          <div className="absolute left-0 top-full mt-1 w-48 bg-white dark:bg-gray-700 rounded-md shadow-lg border border-gray-200 dark:border-gray-600 z-20">
            <div className="py-2">
              <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-600">
                Widget Visibility
              </div>
              
              {widgets.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                  No widgets available
                </div>
              ) : (
                widgets.map((widget) => (
                  <button
                    key={widget.id}
                    onClick={() => handleToggleWidget(widget.id, widget.isVisible)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <span>{widget.name}</span>
                    <div className="flex items-center">
                      {widget.isVisible ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}