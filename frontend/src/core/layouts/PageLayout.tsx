import React, { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface PageLayoutProps {
  children?: React.ReactNode
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const handleMenuClick = () => {
    console.log('Mobile menu clicked')
    setSidebarOpen(true)
  }

  const handleSidebarClose = () => {
    console.log('Sidebar closing')
    setSidebarOpen(false)
  }

  const handleToggleCollapse = () => {
    console.log('Sidebar collapse toggle')
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Single Sidebar - handles mobile/desktop internally */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={handleSidebarClose} 
        isMobile={false}
        collapsed={sidebarCollapsed}
        onToggleCollapse={handleToggleCollapse}
      />

      {/* Main content area */}
      <div className={`flex flex-col flex-1 w-full min-w-0 transition-all duration-300 ease-in-out ${
        sidebarCollapsed ? 'lg:ml-12' : 'lg:ml-52'
      }`}>
        {/* Header */}
        <Header 
          onMenuClick={handleMenuClick} 
        />

        {/* Page content */}
        <main className="flex-1 bg-gray-50 dark:bg-gray-900 w-full min-w-0 overflow-x-auto">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  )
} 