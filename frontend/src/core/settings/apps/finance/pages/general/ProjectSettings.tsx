import React from 'react'
import { AllSettingsHeader } from '../../../../shared/components/AllSettingsHeader'

export const ProjectSettings: React.FC = () => {
  const breadcrumbs = [
    { label: 'All Settings' },
    { label: 'General' },
    { label: 'Projects' }
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        title="Projects"
        breadcrumbs={breadcrumbs}
      />
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Projects Page
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            This is the Projects page
          </p>
        </div>
      </div>
    </div>
  )
}