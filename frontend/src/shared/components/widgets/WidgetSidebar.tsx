import React, { useState } from 'react'
import { WidgetManager, WidgetConfig } from './WidgetManager'
import { useWidgetContext } from '@/core/contexts/WidgetContext'

interface WidgetSidebarProps {
  isOpen: boolean
  onToggle: () => void
  onClose?: () => void
  children?: React.ReactNode
  title?: string
  width?: string
  className?: string
  widgets?: WidgetConfig[]
  onWidgetVisibilityChange?: (widgetId: string, isVisible: boolean) => void
}

interface WidgetLayoutProps {
  isOpen: boolean
  onToggle: () => void
  onClose?: () => void
  title?: string
  width?: string
  className?: string
  widgets?: WidgetConfig[]
  onWidgetVisibilityChange?: (widgetId: string, isVisible: boolean) => void
  sidebarContent?: React.ReactNode
  children: React.ReactNode
}

// Function to get the numeric width value
const getWidthValue = (width: string): number => {
  return parseInt(width) || 320
}

export const WidgetSidebar: React.FC<WidgetSidebarProps> = ({
  isOpen,
  onToggle,
  onClose,
  children,
  title = 'Widgets',
  width = '320px',
  className = '',
  widgets = [],
  onWidgetVisibilityChange
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false)
  
  // Try to use widget context if available, otherwise default to true
  let isWidgetToggleVisible = true
  try {
    const context = useWidgetContext()
    isWidgetToggleVisible = context.isWidgetToggleVisible
  } catch (error) {
    // Context not available, use default
  }

  const handleToggleCollapse = () => {
    // When collapsing, fully close the sidebar instead of just collapsing
    if (!isCollapsed) {
      onToggle() // Close the sidebar completely
    } else {
      setIsCollapsed(false) // This case shouldn't happen since collapsed sidebar is hidden
    }
  }

  const handleClose = () => {
    if (onClose) {
      onClose()
    } else {
      onToggle()
    }
  }

  const widthValue = getWidthValue(width)

  return (
    <>
      {/* Mobile Sidebar (overlay) */}
      <div className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div 
          className={`fixed inset-0 bg-gray-600 transition-opacity duration-300 ${isOpen ? 'bg-opacity-50' : 'bg-opacity-0'}`} 
          onClick={handleClose} 
        />
        <div 
          className={`fixed inset-y-0 right-0 flex flex-col transform transition-transform duration-300 ease-in-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ width }}
        >
          <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Header */}
            <div 
              className="flex items-center justify-between pl-4 pr-2 py-1 border-b border-gray-200 dark:border-gray-600 bg-[#14235f] dark:bg-gray-800" 
              style={{ minHeight: '2.5rem' }}
            >
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-medium text-white">
                  {title}
                </h3>
                {widgets.length > 0 && onWidgetVisibilityChange && (
                  <WidgetManager
                    widgets={widgets}
                    onWidgetVisibilityChange={onWidgetVisibilityChange}
                  />
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-white text-opacity-90 hover:text-white hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                title="Close sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {children || (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <p>No widgets available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sidebar (fixed - pushes content) */}
      <div 
        className="hidden lg:flex lg:fixed lg:inset-y-0 lg:right-0 lg:flex-col transition-all duration-300 ease-out"
        style={{ 
          top: '2.95rem',
          width: isOpen ? `${widthValue}px` : '0px',
          overflow: 'hidden'
        }}
      >
        {isOpen && (
          <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-600 overflow-hidden">
            {/* Header */}
            <div 
              className="flex items-center justify-between pl-4 pr-2 py-1 border-b border-gray-200 dark:border-gray-600 bg-[#14235f] dark:bg-gray-800" 
              style={{ minHeight: '2.5rem' }}
            >
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-medium text-white">
                  {title}
                </h3>
                {widgets.length > 0 && onWidgetVisibilityChange && (
                  <WidgetManager
                    widgets={widgets}
                    onWidgetVisibilityChange={onWidgetVisibilityChange}
                  />
                )}
              </div>
              <button
                onClick={handleClose}
                className="p-1 text-white text-opacity-90 hover:text-white hover:bg-black hover:bg-opacity-10 rounded transition-colors"
                title="Close sidebar"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
              <div className="p-4">
                {children || (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-8">
                    <p>No widgets available</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Open Sidebar Button - Button at rightmost edge */}
      {!isOpen && isWidgetToggleVisible && (
        <button
          onClick={onToggle}
          className="fixed right-0 z-40 text-white dark:text-gray-200 p-1.5 rounded-l-md border border-white border-opacity-20 border-r-0 bg-[#14235f] dark:bg-gray-800 hover:bg-[#2c396f] dark:hover:bg-gray-700 transition-colors"
          style={{
            top: '3.2rem'
          }}
          title="Open widgets"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
          </svg>
        </button>
      )}
    </>
  )
}

// WidgetLayout component that handles content pushing like the left sidebar
export const WidgetLayout: React.FC<WidgetLayoutProps> = ({
  isOpen,
  onToggle,
  onClose,
  title = 'Widgets',
  width = '320px',
  className = '',
  widgets = [],
  onWidgetVisibilityChange,
  sidebarContent,
  children
}) => {
  const widthValue = getWidthValue(width)

  return (
    <div className="min-h-screen">
      {/* Main content area */}
      <div 
        className="transition-all duration-300 ease-in-out"
        style={{ 
          marginRight: isOpen ? `${widthValue}px` : '0px'
        }}
      >
        {children}
      </div>

      {/* Widget Sidebar */}
      <WidgetSidebar
        isOpen={isOpen}
        onToggle={onToggle}
        onClose={onClose}
        title={title}
        width={width}
        className={className}
        widgets={widgets}
        onWidgetVisibilityChange={onWidgetVisibilityChange}
      >
        {sidebarContent}
      </WidgetSidebar>
    </div>
  )
}