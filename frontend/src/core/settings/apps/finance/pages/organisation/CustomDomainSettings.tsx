import React from 'react'
import { AllSettingsHeader } from '../../../../shared/components/AllSettingsHeader'

export const CustomDomainSettings: React.FC = () => {
  const breadcrumbs = [
    { label: 'All Settings' },
    { label: 'Organisation' },
    { label: 'Custom Domain' }
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        title="Custom Domain"
        breadcrumbs={breadcrumbs}
      />
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Custom Domain Page
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            This is the Custom Domain page
          </p>
        </div>
      </div>
    </div>
  )
}