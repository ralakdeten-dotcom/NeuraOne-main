import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { useUploadAttachment } from './api'
import { showErrorMessage } from '@/utils/error'

interface AttachmentUploadProps {
  entityType: string
  entityId: number
  onUploadSuccess?: () => void
  multiple?: boolean
  maxSize?: number // in bytes
  accept?: Record<string, string[]>
  className?: string
}

export const AttachmentUpload: React.FC<AttachmentUploadProps> = ({
  entityType,
  entityId,
  onUploadSuccess,
  multiple = true,
  maxSize = 10 * 1024 * 1024, // 10MB default
  accept = {
    'application/pdf': ['.pdf'],
    'application/msword': ['.doc'],
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    'text/plain': ['.txt'],
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/gif': ['.gif'],
    'application/zip': ['.zip'],
    'application/vnd.ms-excel': ['.xls'],
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    'text/csv': ['.csv'],
  },
  className = ''
}) => {
  const [mode, setMode] = useState<'file' | 'link'>('file')
  const [uploading, setUploading] = useState<Record<string, number>>({}) // filename -> progress
  const [linkData, setLinkData] = useState({
    url: '',
    title: '',
    description: ''
  })
  
  const uploadAttachment = useUploadAttachment()

  const uploadFile = async (file: File, description: string = '') => {
    const fileKey = `${file.name}_${file.size}_${file.lastModified}`
    
    try {
      setUploading(prev => ({ ...prev, [fileKey]: 0 }))
      
      await uploadAttachment.mutateAsync({
        attachment_type: 'file',
        file,
        description,
        entity_type: entityType,
        entity_id: entityId,
      })

      setUploading(prev => {
        const newState = { ...prev }
        delete newState[fileKey]
        return newState
      })

      onUploadSuccess?.()
    } catch (error: any) {
      setUploading(prev => {
        const newState = { ...prev }
        delete newState[fileKey]
        return newState
      })
      showErrorMessage(error, 'uploading file')
    }
  }

  const uploadLink = async () => {
    if (!linkData.url.trim()) {
      showErrorMessage(new Error('URL is required'), 'adding link')
      return
    }

    const linkKey = `link_${linkData.url}`
    
    try {
      setUploading(prev => ({ ...prev, [linkKey]: 0 }))
      
      await uploadAttachment.mutateAsync({
        attachment_type: 'link',
        link_url: linkData.url,
        title: linkData.title || undefined,
        description: linkData.description || undefined,
        entity_type: entityType,
        entity_id: entityId,
      })

      setUploading(prev => {
        const newState = { ...prev }
        delete newState[linkKey]
        return newState
      })

      // Reset link form
      setLinkData({ url: '', title: '', description: '' })
      
      onUploadSuccess?.()
    } catch (error: any) {
      setUploading(prev => {
        const newState = { ...prev }
        delete newState[linkKey]
        return newState
      })
      showErrorMessage(error, 'adding link')
    }
  }

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    for (const file of acceptedFiles) {
      await uploadFile(file)
    }
  }, [entityType, entityId])

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple,
    disabled: uploadAttachment.isPending
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getAcceptedExtensions = () => {
    return Object.values(accept).flat().join(', ')
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Mode Toggle */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={() => setMode('file')}
          className={`px-3 py-1 rounded ${
            mode === 'file'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          📎 Upload Files
        </button>
        <button
          onClick={() => setMode('link')}
          className={`px-3 py-1 rounded ${
            mode === 'link'
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
          }`}
        >
          🔗 Add Link
        </button>
      </div>

      {mode === 'file' ? (
        /* File Upload Mode */
        <div
          {...getRootProps()}
          className={`
            border border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${uploadAttachment.isPending ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="space-y-2">
            {isDragActive ? (
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">
                Drop files here
              </p>
            ) : (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Drag files here or <span className="text-blue-600 dark:text-blue-400 font-medium">browse</span>
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Max {formatFileSize(maxSize)} • {getAcceptedExtensions()}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Link Mode */
        <div className="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              URL *
            </label>
            <input
              type="url"
              value={linkData.url}
              onChange={(e) => setLinkData(prev => ({ ...prev, url: e.target.value }))}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title (optional)
            </label>
            <input
              type="text"
              value={linkData.title}
              onChange={(e) => setLinkData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Link title"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optional)
            </label>
            <textarea
              value={linkData.description}
              onChange={(e) => setLinkData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Brief description of this link"
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
          
          <button
            onClick={uploadLink}
            disabled={!linkData.url.trim() || uploadAttachment.isPending}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium disabled:cursor-not-allowed"
          >
            {uploadAttachment.isPending ? 'Adding...' : 'Add Link'}
          </button>
        </div>
      )}

      {/* File Rejections */}
      {fileRejections.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
            Some files were rejected:
          </h4>
          <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
            {fileRejections.map(({ file, errors }) => (
              <li key={`${file.name}_${file.size}`}>
                <strong>{file.name}</strong>:
                <ul className="ml-4 list-disc">
                  {errors.map(error => (
                    <li key={error.code}>
                      {error.code === 'file-too-large' 
                        ? `File too large (max ${formatFileSize(maxSize)})`
                        : error.code === 'file-invalid-type'
                        ? 'File type not supported'
                        : error.message
                      }
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Progress */}
      {Object.keys(uploading).length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Uploading files...
          </h4>
          <div className="space-y-2">
            {Object.entries(uploading).map(([fileKey, progress]) => {
              const filename = fileKey.split('_')[0]
              return (
                <div key={fileKey} className="flex items-center gap-3">
                  <span className="text-sm text-blue-700 dark:text-blue-300 flex-1 truncate">
                    {filename}
                  </span>
                  <div className="w-32 bg-blue-200 dark:bg-blue-800 rounded-full h-2">
                    <div 
                      className="bg-blue-600 dark:bg-blue-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-blue-600 dark:text-blue-400 w-10 text-right">
                    {progress}%
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}