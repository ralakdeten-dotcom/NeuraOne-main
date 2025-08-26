import React from 'react'

interface AttachmentsTabProps {
  data?: any
  entityId?: number
  entityType?: string
}

export const AttachmentsTab: React.FC<AttachmentsTabProps> = ({ data, entityId, entityType }) => {
  return (
    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
      <p>File attachments coming soon</p>
      <p className="text-sm mt-2">This will show uploaded files and documents</p>
    </div>
  )
}