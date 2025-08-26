import React from 'react'
import { ChevronRight } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface SettingsHeaderProps {
  title: string
  breadcrumbs?: BreadcrumbItem[]
  actions?: React.ReactNode
  rightActions?: React.ReactNode
  subtitle?: string
}

export const SettingsHeader: React.FC<SettingsHeaderProps> = ({
  title,
  breadcrumbs,
  actions,
  rightActions,
  subtitle
}) => {
  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div className="px-6 py-4">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <ChevronRight className="w-4 h-4" />}
                <span className={index === breadcrumbs.length - 1 ? 'text-gray-900 dark:text-white font-medium' : ''}>
                  {crumb.label}
                </span>
              </React.Fragment>
            ))}
          </nav>
        )}

        {/* Title and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                {subtitle}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-3">
            {actions && (
              <div className="flex items-center space-x-2">
                {actions}
              </div>
            )}
            
            {rightActions && (
              <div className="flex items-center space-x-2">
                {rightActions}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}