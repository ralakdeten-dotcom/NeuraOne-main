import React from 'react'

interface SettingsToggleProps {
  name: string
  label: string
  description?: string
  disabled?: boolean
  className?: string
  // Props injected by SettingsFormWrapper
  formData?: any
  errors?: Record<string, string>
  onChange?: (name: string, value: any) => void
  isSubmitting?: boolean
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  name,
  label,
  description,
  disabled = false,
  className = '',
  formData = {},
  errors = {},
  onChange,
  isSubmitting = false
}) => {
  const checked = Boolean(formData[name])
  
  const handleToggle = () => {
    if (onChange && !disabled && !isSubmitting) {
      onChange(name, !checked)
    }
  }

  return (
    <div className={`flex items-start ${className}`}>
      <div className="flex items-center h-5">
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={handleToggle}
          disabled={disabled || isSubmitting}
          className={`
            relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent 
            transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${checked 
              ? 'bg-blue-600' 
              : 'bg-gray-200 dark:bg-gray-700'
            }
          `}
        >
          <span
            aria-hidden="true"
            className={`
              pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 
              transition duration-200 ease-in-out
              ${checked ? 'translate-x-5' : 'translate-x-0'}
            `}
          />
        </button>
      </div>
      
      <div className="ml-3">
        <label 
          onClick={handleToggle}
          className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>
    </div>
  )
}