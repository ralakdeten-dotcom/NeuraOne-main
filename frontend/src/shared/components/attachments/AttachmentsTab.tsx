import React, { useState } from 'react'
import { AttachmentList } from './AttachmentList'
import { AttachmentUpload } from './AttachmentUpload'
import { useAttachments } from './api'

interface AttachmentsTabProps {
  entityType: string
  entityId: number
  className?: string
}

export const AttachmentsTab: React.FC<AttachmentsTabProps> = ({
  entityType,
  entityId,
  className = ''
}) => {
  const [showUpload, setShowUpload] = useState(false)
  const { data: attachments = [], refetch } = useAttachments(entityType, entityId)

  const handleUploadSuccess = () => {
    refetch()
    setShowUpload(false) // Auto-hide after upload
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Simple Header with Upload Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {attachments.length} {attachments.length === 1 ? 'attachment' : 'attachments'}
        </span>
        <button
          onClick={() => setShowUpload(!showUpload)}
          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
        >
          {showUpload ? 'Cancel' : '+ Add files or links'}
        </button>
      </div>

      {/* Upload Area */}
      {showUpload && (
        <AttachmentUpload
          entityType={entityType}
          entityId={entityId}
          onUploadSuccess={handleUploadSuccess}
          className="mb-4"
        />
      )}

      {/* Attachments List */}
      <AttachmentList
        entityType={entityType}
        entityId={entityId}
        onRequestUpload={() => setShowUpload(true)}
      />
    </div>
  )
}