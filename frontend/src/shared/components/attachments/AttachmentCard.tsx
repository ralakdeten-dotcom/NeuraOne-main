import React, { useState, useEffect } from 'react'
import { Attachment, useDeleteAttachment, useDownloadAttachment, useUpdateAttachment } from './api'
import { showErrorMessage } from '@/utils/error'
import { AttachmentPreview } from './AttachmentPreview'

interface AttachmentCardProps {
  attachment: Attachment
}

export const AttachmentCard: React.FC<AttachmentCardProps> = ({
  attachment
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editDescription, setEditDescription] = useState(attachment.description || '')
  const [editLinkUrl, setEditLinkUrl] = useState(attachment.link_url || '')
  const [showPreview, setShowPreview] = useState(false)
  
  // Sync local state when attachment prop changes (after successful update)
  useEffect(() => {
    setEditDescription(attachment.description || '')
    setEditLinkUrl(attachment.link_url || '')
  }, [attachment.description, attachment.link_url])
  
  const deleteAttachment = useDeleteAttachment()
  const downloadAttachment = useDownloadAttachment()
  const updateAttachment = useUpdateAttachment()

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${attachment.original_filename}"?`)) {
      try {
        await deleteAttachment.mutateAsync(attachment.id)
      } catch (error: any) {
        showErrorMessage(error, 'deleting attachment')
      }
    }
  }

  const handleDownload = async () => {
    try {
      if (attachment.attachment_type === 'link' && attachment.link_url) {
        // For links, open in new tab
        window.open(attachment.link_url, '_blank', 'noopener,noreferrer')
      } else {
        // For files, download
        await downloadAttachment.mutateAsync(attachment.id)
      }
    } catch (error: any) {
      showErrorMessage(error, 'opening attachment')
    }
  }

  const handleSave = async () => {
    try {
      const updateData: { description: string; link_url?: string } = {
        description: editDescription
      }
      
      // Only include link_url for link attachments
      if (attachment.attachment_type === 'link') {
        updateData.link_url = editLinkUrl
      }
      
      await updateAttachment.mutateAsync({
        id: attachment.id,
        data: updateData
      })
      setIsEditing(false)
    } catch (error: any) {
      showErrorMessage(error, 'updating attachment')
    }
  }

  const getFileIcon = () => {
    if (attachment.attachment_type === 'link') {
      return '🔗'
    }
    
    const ext = attachment.file_extension.toLowerCase()
    const iconMap: Record<string, string> = {
      pdf: '📄',
      doc: '📝',
      docx: '📝',
      txt: '📄',
      jpg: '🖼️',
      jpeg: '🖼️',
      png: '🖼️',
      gif: '🖼️',
      zip: '📦',
      rar: '📦',
      xlsx: '📊',
      xls: '📊',
      csv: '📊',
      ppt: '📊',
      pptx: '📊',
    }
    return iconMap[ext] || '📎'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
      <div className="flex items-center gap-3">
        {/* File Icon */}
        <div className="text-2xl flex-shrink-0">
          {getFileIcon()}
        </div>
        
        {/* File Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {attachment.original_filename}
            </h4>
            <span className="text-xs text-gray-500 dark:text-gray-400 flex-shrink-0">
              {attachment.file_size_human}
            </span>
          </div>
          
          {/* Description and metadata */}
          {isEditing ? (
            <div className="mt-2 space-y-2">
              {/* URL field for link attachments */}
              {attachment.attachment_type === 'link' && (
                <input
                  type="url"
                  value={editLinkUrl}
                  onChange={(e) => setEditLinkUrl(e.target.value)}
                  className="w-full text-xs p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="https://example.com"
                  required
                />
              )}
              {/* Description field for all attachments */}
              <input
                type="text"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full text-xs p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Add description..."
              />
              <div className="flex gap-1">
                <button
                  onClick={handleSave}
                  disabled={updateAttachment.isPending || (attachment.attachment_type === 'link' && !editLinkUrl.trim())}
                  className="px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded disabled:opacity-50"
                >
                  {updateAttachment.isPending ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditDescription(attachment.description || '')
                    setEditLinkUrl(attachment.link_url || '')
                  }}
                  className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-1 space-y-1">
              {attachment.description && (
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                  {attachment.description}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {formatDate(attachment.uploaded_at)} • by {attachment.uploaded_by_name}
              </p>
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowPreview(true)}
              className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded"
              title="Preview"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </button>
            <button
              onClick={handleDownload}
              disabled={downloadAttachment.isPending}
              className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50 rounded"
              title={attachment.attachment_type === 'link' ? 'Open link' : 'Download'}
            >
              {attachment.attachment_type === 'link' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 rounded"
              title={attachment.attachment_type === 'link' ? 'Edit URL and description' : 'Edit description'}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteAttachment.isPending}
              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-50 rounded"
              title="Delete"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
        </div>
      </div>
      
      {/* Preview Modal */}
      <AttachmentPreview
        attachment={attachment}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
      />
    </div>
  )
}