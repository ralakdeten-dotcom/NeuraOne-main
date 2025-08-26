import React, { useState } from 'react'
import { useAttachments } from './api'
import { AttachmentCard } from './AttachmentCard'
import { LoadingSpinner } from '@/shared/components/feedback'

interface AttachmentListProps {
  entityType: string
  entityId: number
  className?: string
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  entityType,
  entityId,
  className = ''
}) => {
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'size'>('date')
  const [filterType, setFilterType] = useState<string>('all')
  const [attachmentTypeFilter, setAttachmentTypeFilter] = useState<'all' | 'file' | 'link'>('all')
  
  const { data: attachments = [], isLoading, error } = useAttachments(entityType, entityId)

  // Filter attachments by type
  const filteredAttachments = React.useMemo(() => {
    let filtered = [...attachments]
    
    // Filter by attachment type (file/link)
    if (attachmentTypeFilter !== 'all') {
      filtered = filtered.filter(att => att.attachment_type === attachmentTypeFilter)
    }
    
    // Filter by file type (only for files)
    if (filterType !== 'all') {
      filtered = filtered.filter(att => {
        if (att.attachment_type === 'link') return filterType === 'links'
        
        switch (filterType) {
          case 'images':
            return att.is_image
          case 'documents':
            return att.is_document
          case 'other':
            return !att.is_image && !att.is_document
          default:
            return att.file_extension === filterType
        }
      })
    }

    // Sort attachments
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.original_filename.localeCompare(b.original_filename)
          break
        case 'date':
          comparison = new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime() // Recent first
          break
        case 'size':
          comparison = (b.file_size || 0) - (a.file_size || 0) // Largest first
          break
      }
      
      return comparison
    })

    return filtered
  }, [attachments, filterType, sortBy, attachmentTypeFilter])

  // Get unique file types for filter
  const fileTypes = React.useMemo(() => {
    const types = new Set<string>()
    attachments.forEach(att => {
      if (att.is_image) types.add('images')
      else if (att.is_document) types.add('documents')
      else types.add('other')
      
      types.add(att.file_extension)
    })
    return Array.from(types).sort()
  }, [attachments])

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center py-8 ${className}`}>
        <LoadingSpinner size="md" />
      </div>
    )
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-red-600 dark:text-red-400">
          Error loading attachments: {error.message}
        </div>
      </div>
    )
  }

  if (attachments.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-gray-400 dark:text-gray-500 mb-3">
          <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No attachments yet
        </p>
      </div>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Simple sort/filter for larger lists */}
      {attachments.length > 3 && (
        <div className="flex items-center gap-3 text-sm flex-wrap">
          {/* Attachment Type Filter */}
          <select
            value={attachmentTypeFilter}
            onChange={(e) => setAttachmentTypeFilter(e.target.value as 'all' | 'file' | 'link')}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All types</option>
            <option value="file">📎 Files</option>
            <option value="link">🔗 Links</option>
          </select>
          
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date' | 'size')}
            className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="date">Recent first</option>
            <option value="name">Name A-Z</option>
            <option value="size">Size</option>
          </select>
          
          {/* File Type Filter - only show if there are files */}
          {fileTypes.length > 2 && attachments.some(att => att.attachment_type === 'file') && (
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-xs border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="all">All formats</option>
              {fileTypes.includes('images') && <option value="images">Images</option>}
              {fileTypes.includes('documents') && <option value="documents">Documents</option>}
              {fileTypes.includes('other') && <option value="other">Other</option>}
            </select>
          )}
        </div>
      )}

      {/* Attachments List */}
      <div className="space-y-2">
        {filteredAttachments.map(attachment => (
          <AttachmentCard
            key={attachment.id}
            attachment={attachment}
          />
        ))}
      </div>
    </div>
  )
}