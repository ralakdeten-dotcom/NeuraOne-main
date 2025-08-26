import React, { ReactNode, memo } from 'react'

interface TabItem {
  key: string
  label: string
  content: ReactNode
}

// Memoized tab content wrapper to prevent unnecessary re-renders
const TabContentWrapper = memo<{ children: ReactNode; isActive: boolean }>(
  ({ children, isActive }) => {
    return (
      <div style={{ display: isActive ? 'block' : 'none' }}>
        {children}
      </div>
    )
  }
)

interface TabContainerProps {
  tabs: TabItem[]
  activeTab: string
  onTabChange: (tabKey: string) => void
  className?: string
  headerContent?: ReactNode
  preserveTabState?: boolean // New property to control state preservation
}

export const TabContainer: React.FC<TabContainerProps> = ({
  tabs,
  activeTab,
  onTabChange,
  className = '',
  headerContent,
  preserveTabState = false
}) => {
  const activeTabContent = tabs.find(tab => tab.key === activeTab)?.content

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg ${className}`}>
      {/* Header Content (optional) */}
      {headerContent && (
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          {headerContent}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {preserveTabState ? (
          // Preserve state mode: render all tabs but show only the active one
          <>
            {tabs.map((tab) => (
              <TabContentWrapper
                key={tab.key}
                isActive={activeTab === tab.key}
              >
                {tab.content}
              </TabContentWrapper>
            ))}
          </>
        ) : (
          // Default mode: only render active tab content
          activeTabContent || (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No content available for this tab</p>
            </div>
          )
        )}
      </div>
    </div>
  )
}