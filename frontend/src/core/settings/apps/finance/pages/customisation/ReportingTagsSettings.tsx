import React from 'react'
import { AllSettingsHeader } from '../../../../shared/components/AllSettingsHeader'

export const ReportingTagsSettings: React.FC = () => {
  const breadcrumbs = [
    { label: 'All Settings' },
    { label: 'Customisation' },
    { label: 'Reporting Tags' }
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        title="Reporting Tags"
        breadcrumbs={breadcrumbs}
      />
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reporting Tags Page
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            This is the Reporting Tags page
          </p>
        </div>
      </div>
    </div>
  )
}