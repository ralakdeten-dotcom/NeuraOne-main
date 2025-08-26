import React from 'react'

interface SettingsContentAreaProps {
  children: React.ReactNode
}

export const SettingsContentArea: React.FC<SettingsContentAreaProps> = ({
  children
}) => {
  return (
    <div className="fixed top-16 left-64 right-0 bottom-0 bg-gray-50 dark:bg-gray-900 overflow-y-auto">
      {children}
    </div>
  )
}