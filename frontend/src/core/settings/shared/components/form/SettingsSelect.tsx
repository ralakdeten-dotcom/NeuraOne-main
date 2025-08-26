import React from 'react'
import { AlertCircle } from 'lucide-react'

interface SelectOption {
  value: string | number
  label: string
  disabled?: boolean
}

interface SettingsSelectProps {
  name: string
  label: string
  options: SelectOption[]
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  description?: string
  // Props injected by SettingsFormWrapper
  formData?: any
  errors?: Record<string, string>
  onChange?: (name: string, value: any) => void
  isSubmitting?: boolean
}

export const SettingsSelect: React.FC<SettingsSelectProps> = ({
  name,
  label,
  options,
  placeholder = 'Select an option...',
  required = false,
  disabled = false,
  className = '',
  description,
  formData = {},
  errors = {},
  onChange,
  isSubmitting = false
}) => {
  const value = formData[name] || ''
  const error = errors[name]
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onChange) {
      onChange(name, e.target.value)
    }
  }

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
        <select
          id={name}
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled || isSubmitting}
          className={`
            block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
            focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm
            dark:bg-gray-700 dark:border-gray-600 dark:text-white
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}
          `}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
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