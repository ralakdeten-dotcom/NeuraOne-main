import React from 'react'

export interface SettingsLayoutProps {
  children: React.ReactNode
  sidebar?: React.ReactNode
}

/**
 * Generic Settings Layout Component
 * 
 * This is a simple layout wrapper for settings pages.
 * Apps can provide their own sidebar component or use it without a sidebar.
 */
export const SettingsLayout: React.FC<SettingsLayoutProps> = ({ 
  children, 
  sidebar 
}) => {
  if (sidebar) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
        {/* App-specific Sidebar */}
        {sidebar}
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {children}
        </div>
      </div>
    )
  }

  // Simple layout without sidebar
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {children}
    </div>
  )
}