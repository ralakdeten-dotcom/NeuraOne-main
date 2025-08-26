import React from 'react'

interface RightPanelProps {
  isCollapsed: boolean
  onToggle: () => void
  children?: React.ReactNode
  title?: string
}

export const RightPanel: React.FC<RightPanelProps> = ({
  isCollapsed,
  onToggle,
  children,
  title = 'Panel'
}) => {
  // Size matches collapsed sidebar width (48px = w-12)
  const collapsedWidth = '48px'

  return (
    <>
      {/* Desktop Right Panel (fixed) - Only show when not collapsed */}
      {!isCollapsed && (
        <div 
          className="hidden lg:flex lg:fixed lg:inset-y-0 lg:right-0 lg:flex-col transition-all duration-300 ease-out"
          style={{ 
            top: '2.95rem', // Position slightly above to align with header border
            width: collapsedWidth,
            overflow: 'hidden',
            zIndex: 15 // Higher z-index than header to overwrite its border
          }}
        >
          <div className="h-full flex flex-col bg-[#14235f] dark:bg-gray-800 border-l border-gray-200 dark:border-gray-600 overflow-hidden relative">
            {/* Full-width divider line positioned to match header border */}
            <div 
              className="w-full border-b border-gray-400 dark:border-gray-600 border-opacity-40" 
              style={{ height: '1px' }}
            ></div>
            
            {/* Content Area - Always collapsed */}
            <div className="flex-1 overflow-hidden">
              {/* Empty content area */}
            </div>

            {/* Toggle button at bottom */}
            <div className="px-1 py-1">
              <div className="flex justify-center">
                <button
                  onClick={onToggle}
                  className="text-white dark:text-gray-200 hover:text-white dark:hover:text-gray-300 hover:text-opacity-70 p-2 transition-colors rounded-lg border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10"
                  title="Collapse panel"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Open Panel Button - Show when collapsed */}
      {isCollapsed && (
        <button
          onClick={onToggle}
          className="fixed bottom-2 right-2 z-40 text-white dark:text-gray-200 p-2 rounded-lg border border-white border-opacity-20 bg-[#14235f] dark:bg-gray-800 hover:bg-[#2c396f] dark:hover:bg-gray-700 transition-colors shadow-lg"
          title="Open panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* Mobile Right Panel (overlay) - Hidden for now since only 2 modes required */}
      <div className="lg:hidden">
        {/* Mobile implementation can be added later if needed */}
      </div>
    </>
  )
}