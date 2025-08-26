import React from 'react'
import { AllSettingsHeader } from '../../../../shared/components/AllSettingsHeader'

export const RoleManagementSettings: React.FC = () => {
  const breadcrumbs = [
    { label: 'All Settings' },
    { label: 'Users' }, 
    { label: 'Role Management' }
  ]

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <AllSettingsHeader
        title="Role Management"
        breadcrumbs={breadcrumbs}
      />
      <div className="p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Role Management Page
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            This is the Role Management page
          </p>
        </div>
      </div>
    </div>
  )
}