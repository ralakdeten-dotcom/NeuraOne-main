import React from 'react'

interface TimelineTabProps {
  data?: any
  entityId?: number
  entityType?: string
  auditFields?: {
    createdAt?: string
    createdBy?: string
    updatedAt?: string
    updatedBy?: string
  }
}

export const TimelineTab: React.FC<TimelineTabProps> = ({ data, auditFields }) => {
  const showAuditInfo = auditFields && data && (
    (auditFields.createdAt && data[auditFields.createdAt]) || 
    (auditFields.updatedAt && data[auditFields.updatedAt])
  )

  return (
    <div className="space-y-6">
      {/* Audit Information */}
      {showAuditInfo && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Record Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {auditFields?.createdAt && data[auditFields.createdAt] && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(data[auditFields.createdAt]).toLocaleDateString()} at {new Date(data[auditFields.createdAt]).toLocaleTimeString()}
                  {auditFields.createdBy && data[auditFields.createdBy] && ` by ${data[auditFields.createdBy]}`}
                </p>
              </div>
            )}
            {auditFields?.updatedAt && data[auditFields.updatedAt] && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="text-gray-900 dark:text-white">
                  {new Date(data[auditFields.updatedAt]).toLocaleDateString()} at {new Date(data[auditFields.updatedAt]).toLocaleTimeString()}
                  {auditFields.updatedBy && data[auditFields.updatedBy] && ` by ${data[auditFields.updatedBy]}`}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Future Activity Timeline */}
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <p>Activity timeline coming soon</p>
        <p className="text-sm mt-2">This will show chronological activity history</p>
      </div>
    </div>
  )
}