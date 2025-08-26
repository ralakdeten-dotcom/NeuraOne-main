import React from 'react'
import { AlertCircle } from 'lucide-react'

interface SettingsTextAreaProps {
  name: string
  label: string
  rows?: number
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  description?: string
  maxLength?: number
  // Props injected by SettingsFormWrapper
  formData?: any
  errors?: Record<string, string>
  onChange?: (name: string, value: any) => void
  isSubmitting?: boolean
}

export const SettingsTextArea: React.FC<SettingsTextAreaProps> = ({
  name,
  label,
  rows = 3,
  placeholder,
  required = false,
  disabled = false,
  className = '',
  description,
  maxLength,
  formData = {},
  errors = {},
  onChange,
  isSubmitting = false
}) => {
  const value = formData[name] || ''
  const error = errors[name]
  
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(name, e.target.value)
    }
  }

  const characterCount = value.length
  const isNearLimit = maxLength && characterCount > maxLength * 0.8
  const isOverLimit = maxLength && characterCount > maxLength

  return (
    <div className={className}>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {description}
        </p>
      )}
      
      <div className="mt-2">
        <textarea
          id={name}
          name={name}
          rows={rows}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          maxLength={maxLength}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 
            focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm resize-vertical
            dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error || isOverLimit ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          `}
        />
        
        {maxLength && (
          <div className="mt-2 flex justify-between items-center">
            <div></div>
            <div className={`text-xs ${
              isOverLimit 
                ? 'text-red-600' 
                : isNearLimit 
                  ? 'text-yellow-600' 
                  : 'text-gray-500'
            }`}>
              {characterCount}/{maxLength} characters
            </div>
          </div>
        )}
      </div>
      
      {error && (
        <div className="mt-2 flex items-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-1 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}