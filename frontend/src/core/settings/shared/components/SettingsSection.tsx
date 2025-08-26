import React from 'react'

interface SettingsSectionProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

export const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  description,
  children,
  className = ''
}) => {
  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 pb-8 last:border-b-0 last:pb-0 ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white">
          {title}
        </h3>
        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
      
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}