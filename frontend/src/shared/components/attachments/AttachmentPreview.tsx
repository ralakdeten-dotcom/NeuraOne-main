import React, { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { attachmentApi, usePreviewBlob, useDownloadAttachment, type Attachment } from './api'
import { LoadingSpinner } from '@/shared/components/feedback'

interface AttachmentPreviewProps {
  attachment: Attachment
  isOpen: boolean
  onClose: () => void
}

// Removed unused PreviewData interface - using dynamic typing for preview data

export const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({
  attachment,
  isOpen,
  onClose
}) => {
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'original'>('medium')
  const downloadAttachment = useDownloadAttachment()

  // For non-images, get preview metadata
  const { data: previewData, isLoading, error } = useQuery({
    queryKey: ['attachment-preview', attachment.id, imageSize],
    queryFn: () => attachmentApi.previewAttachment(attachment.id, attachment.is_image ? imageSize : undefined),
    enabled: isOpen && attachment.attachment_type === 'file' && !attachment.is_image,
  })

  // For images, get authenticated blob
  const { 
    data: imageBlobUrl, 
    isLoading: imageLoading, 
    error: imageError 
  } = usePreviewBlob(
    attachment.id, 
    imageSize, 
    isOpen && attachment.attachment_type === 'file' && attachment.is_image
  )

  // Clean up blob URLs when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imageBlobUrl) {
        window.URL.revokeObjectURL(imageBlobUrl)
      }
    }
  }, [imageBlobUrl])

  const handleDownload = async () => {
    try {
      await downloadAttachment.mutateAsync(attachment.id)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  if (!isOpen) return null

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const renderPreviewContent = () => {
    // Handle images first with authenticated blob URLs
    if (attachment.attachment_type === 'file' && attachment.is_image) {
      if (imageLoading) {
        return (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )
      }

      if (imageError || !imageBlobUrl) {
        return (
          <div className="text-center py-8 text-red-600 dark:text-red-400">
            <p>Error loading image preview</p>
            <p className="text-sm text-gray-500 mt-1">
              {imageError?.message || 'Failed to load image'}
            </p>
            <button
              onClick={handleDownload}
              disabled={downloadAttachment.isPending}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {downloadAttachment.isPending ? 'Downloading...' : 'Download Image'}
            </button>
          </div>
        )
      }

      return (
        <div className="p-4">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-medium">{attachment.original_filename}</h3>
            <div className="flex items-center gap-2">
              <select
                value={imageSize}
                onChange={(e) => setImageSize(e.target.value as 'small' | 'medium' | 'original')}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="original">Original</option>
              </select>
              <span className="text-sm text-gray-500">{attachment.file_size_human}</span>
            </div>
          </div>
          <div className="text-center bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
            <img
              src={imageBlobUrl}
              alt={attachment.original_filename}
              className="max-w-full max-h-96 mx-auto rounded shadow-lg"
              loading="lazy"
            />
          </div>
        </div>
      )
    }
    if (attachment.attachment_type === 'link') {
      return (
        <div className="text-center py-8">
          <div className="text-blue-600 dark:text-blue-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">{attachment.original_filename}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">External Link</p>
          <a
            href={attachment.link_url!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Link
          </a>
        </div>
      )
    }

    // For non-images, show loading/error states
    if (attachment.attachment_type === 'file' && !attachment.is_image) {
      if (isLoading) {
        return (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )
      }

      if (error || !previewData) {
        return (
          <div className="text-center py-8 text-red-600 dark:text-red-400">
            <p>Error loading preview</p>
            <p className="text-sm text-gray-500 mt-1">
              {error?.message || 'Unknown error occurred'}
            </p>
            <button
              onClick={handleDownload}
              disabled={downloadAttachment.isPending}
              className="mt-4 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              {downloadAttachment.isPending ? 'Downloading...' : 'Download File'}
            </button>
          </div>
        )
      }
    }

    if (previewData && !previewData.preview_available) {
      return (
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-lg font-medium mb-2">{previewData.filename}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{previewData.message}</p>
          <button
            onClick={handleDownload}
            disabled={downloadAttachment.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {downloadAttachment.isPending ? 'Downloading...' : 'Download File'}
          </button>
        </div>
      )
    }

    // Handle different preview types
    switch (previewData.preview_type) {
      case 'text':
        return (
          <div className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-medium">{previewData.filename}</h3>
              <span className="text-sm text-gray-500">{previewData.size}</span>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 max-h-96 overflow-auto">
              <pre className="text-sm whitespace-pre-wrap font-mono">{previewData.content}</pre>
              {previewData.is_truncated && (
                <div className="mt-4 text-center">
                  <p className="text-sm text-gray-500 mb-2">Preview truncated - showing first 10KB</p>
                  <button
                    onClick={handleDownload}
                    disabled={downloadAttachment.isPending}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {downloadAttachment.isPending ? 'Downloading...' : 'Download Full File'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )

      case 'pdf':
        return (
          <div className="p-4 text-center">
            <div className="mb-4">
              <h3 className="text-lg font-medium">{previewData.filename}</h3>
              <span className="text-sm text-gray-500">{previewData.size}</span>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8">
              <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
              <p className="mb-4">PDF Preview</p>
              <button
                onClick={handleDownload}
                disabled={downloadAttachment.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {downloadAttachment.isPending ? 'Downloading...' : 'Open PDF in New Tab'}
              </button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Preview</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {renderPreviewContent()}
        </div>
      </div>
    </div>
  )
}