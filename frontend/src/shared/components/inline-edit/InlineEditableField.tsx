import React, { useState, useEffect, useRef } from 'react'
import { Pencil, Check, X } from 'lucide-react'

interface InlineEditableFieldProps {
  label: string
  value: string | number | null | undefined
  onSave: (value: string) => Promise<void>
  type?: 'text' | 'email' | 'tel' | 'number' | 'url' | 'textarea'
  placeholder?: string
  required?: boolean
  disabled?: boolean
  formatter?: (value: any) => string
  parser?: (value: string) => any
  validator?: (value: string) => boolean | string
  className?: string
  renderValue?: (value: any) => React.ReactNode
}

export const InlineEditableField: React.FC<InlineEditableFieldProps> = ({
  label,
  value,
  onSave,
  type = 'text',
  placeholder = '',
  required = false,
  disabled = false,
  formatter,
  parser,
  validator,
  className = '',
  renderValue
}) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [error, setError] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null)

  const displayValue = formatter ? formatter(value) : (value || '')
  const isEmpty = !value || value === ''

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const handleEdit = () => {
    if (disabled) return
    setIsEditing(true)
    setEditValue(String(value || ''))
    setError('')
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue('')
    setError('')
  }

  const handleSave = async () => {
    const trimmedValue = editValue.trim()

    // Validation
    if (required && !trimmedValue) {
      setError('This field is required')
      return
    }

    if (validator) {
      const validationResult = validator(trimmedValue)
      if (validationResult !== true) {
        setError(typeof validationResult === 'string' ? validationResult : 'Invalid value')
        return
      }
    }

    // Don't save if value hasn't changed
    if (trimmedValue === String(value || '')) {
      handleCancel()
      return
    }

    setIsSaving(true)
    try {
      const valueToSave = parser ? parser(trimmedValue) : trimmedValue
      await onSave(valueToSave)
      setIsEditing(false)
      setEditValue('')
      setError('')
    } catch (err) {
      setError('Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault()
      handleSave()
    } else if (e.key === 'Escape') {
      handleCancel()
    }
  }

  const renderInput = () => {
    const commonProps = {
      ref: inputRef as any,
      value: editValue,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setEditValue(e.target.value),
      onKeyDown: handleKeyDown,
      className: 'w-full px-3 py-1.5 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:bg-gray-700 dark:text-white dark:border-blue-400',
      disabled: isSaving,
      placeholder: placeholder
    }

    if (type === 'textarea') {
      return (
        <textarea
          {...commonProps}
          rows={3}
          className={`${commonProps.className} resize-none`}
        />
      )
    }

    return <input {...commonProps} type={type} />
  }

  if (isEditing) {
    return (
      <div className={`space-y-1 ${className}`}>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            {renderInput()}
            {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
          </div>
          <div className="flex space-x-1 pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded disabled:opacity-50"
              title="Save"
            >
              <Check className="w-4 h-4" />
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded disabled:opacity-50"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`group relative ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{label}</label>
      <div className="flex items-center justify-between py-1 px-2 -mx-2 rounded transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
        <div className={`flex-1 ${isEmpty ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-900 dark:text-white'}`}>
          {renderValue ? (
            renderValue(value) || (isEmpty ? <span className="text-base font-semibold">–</span> : null)
          ) : (
            isEmpty ? <span className="text-base font-semibold">–</span> : displayValue
          )}
        </div>
        {!disabled && (
          <button
            onClick={handleEdit}
            className={`ml-2 p-1 rounded transition-all duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            } hover:bg-gray-200 dark:hover:bg-gray-600`}
            title={`Edit ${label}`}
          >
            <Pencil className="w-3 h-3 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  )
}

// Specialized variants
export const InlineEditableLink: React.FC<InlineEditableFieldProps & { href?: string }> = (props) => {
  const { href, ...rest } = props
  
  return (
    <InlineEditableField
      {...rest}
      renderValue={(val) => 
        val ? (
          <a 
            href={href || val} 
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
            target={props.type === 'url' ? '_blank' : undefined}
            rel={props.type === 'url' ? 'noopener noreferrer' : undefined}
          >
            {val}
          </a>
        ) : undefined
      }
    />
  )
}

export const InlineEditableSelect: React.FC<InlineEditableFieldProps & {
  options: Array<{ value: string; label: string }>
}> = ({ options, ...props }) => {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleEdit = () => {
    if (props.disabled) return
    setIsEditing(true)
    setEditValue(String(props.value || ''))
  }

  const handleCancel = () => {
    setIsEditing(false)
    setEditValue('')
  }

  const handleSave = async () => {
    if (editValue === String(props.value || '')) {
      handleCancel()
      return
    }

    setIsSaving(true)
    try {
      await props.onSave(editValue)
      setIsEditing(false)
      setEditValue('')
    } catch (err) {
      console.error(err)
    } finally {
      setIsSaving(false)
    }
  }

  const selectedOption = options.find(opt => opt.value === props.value)

  if (isEditing) {
    return (
      <div className={`space-y-1 ${props.className}`}>
        <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{props.label}</label>
        <div className="flex items-center space-x-2">
          <select
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className="flex-1 px-3 py-1.5 border-2 border-blue-500 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm dark:bg-gray-700 dark:text-white dark:border-blue-400"
            disabled={isSaving}
          >
            <option value="">Select {props.label}</option>
            {options.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className={`group relative ${props.className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <label className="text-sm font-medium text-gray-500 dark:text-gray-400">{props.label}</label>
      <div className="flex items-center justify-between py-1 px-2 -mx-2 rounded transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
        <div className={`flex-1 ${!selectedOption ? 'text-gray-400 dark:text-gray-500 italic' : 'text-gray-900 dark:text-white'}`}>
          {selectedOption?.label || <span className="text-base font-semibold">–</span>}
        </div>
        {!props.disabled && (
          <button
            onClick={handleEdit}
            className={`ml-2 p-1 rounded transition-all duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-0'
            } hover:bg-gray-200 dark:hover:bg-gray-600`}
          >
            <Pencil className="w-3 h-3 text-gray-600 dark:text-gray-300" />
          </button>
        )}
      </div>
    </div>
  )
}