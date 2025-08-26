import React from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ArrowLeft, Save, X } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BaseSettingsPageProps {
  title: string
  description?: string
  breadcrumb: BreadcrumbItem[]
  isLoading?: boolean
  hasUnsavedChanges?: boolean
  onSave?: () => void
  onCancel?: () => void
  showActions?: boolean
  children: React.ReactNode
}

export const BaseSettingsPage: React.FC<BaseSettingsPageProps> = ({
  title,
  description,
  breadcrumb,
  isLoading = false,
  hasUnsavedChanges = false,
  onSave,
  onCancel,
  showActions = true,
  children
}) => {
  const navigate = useNavigate()

  const handleBreadcrumbClick = (href: string) => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmed) return
    }
    navigate(href)
  }

  const handleBack = () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmed) return
    }
    navigate(-1)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 py-4 text-sm">
            <button
              onClick={handleBack}
              className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </button>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {breadcrumb.map((item, index) => (
              <React.Fragment key={index}>
                {item.href ? (
                  <button
                    onClick={() => handleBreadcrumbClick(item.href)}
                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {item.label}
                  </button>
                ) : (
                  <span className="text-gray-900 dark:text-white font-medium">
                    {item.label}
                  </span>
                )}
                {index < breadcrumb.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                )}
              </React.Fragment>
            ))}
          </nav>

          {/* Title and Actions */}
          <div className="flex items-center justify-between pb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {title}
              </h1>
              {description && (
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {description}
                </p>
              )}
            </div>

            {showActions && (onSave || onCancel) && (
              <div className="flex items-center space-x-3">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
                  >
                    <X className="w-4 h-4 mr-2 inline" />
                    Cancel
                  </button>
                )}
                {onSave && (
                  <button
                    type="button"
                    onClick={onSave}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="w-4 h-4 mr-2 inline border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2 inline" />
                        Save Changes
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isLoading && (
          <div className="fixed inset-0 bg-black bg-opacity-25 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-xl">
              <div className="flex items-center">
                <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3" />
                <span className="text-gray-900 dark:text-white">Loading...</span>
              </div>
            </div>
          </div>
        )}
        
        {hasUnsavedChanges && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-800">
                  You have unsaved changes. Don't forget to save before leaving this page.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 shadow-sm rounded-lg">
          {children}
        </div>
      </div>
    </div>
  )
}