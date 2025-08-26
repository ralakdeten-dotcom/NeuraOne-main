import React from 'react'
import { AllSettingsHeader } from '../../../../shared/components/AllSettingsHeader'

export const DelugeComponentsUsageSettings: React.FC = () => {
  const breadcrumbs = [
    { label: 'All Settings' },
    { label: 'Developer' },
    { label: 'Deluge Components Usage' }
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        title="Deluge Components Usage"
        breadcrumbs={breadcrumbs}
      />
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Deluge Components Usage Page
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            This is the Deluge Components Usage page
          </p>
        </div>
      </div>
    </div>
  )
}