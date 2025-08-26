import React, { useState } from 'react'
import { FormField } from './FormField'

interface ConditionalFormFieldProps<TName = string> {
  label: string
  name: TName
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'url' | 'date'
  value: string | number | undefined | null
  onChange: (name: TName, value: string | number | undefined) => void
  error?: string
  placeholder?: string
  disabled?: boolean
  className?: string
  min?: number
  max?: number
  step?: string
  rows?: number
  as?: 'input' | 'textarea' | 'select'
  options?: { value: string | number; label: string }[]
  checkboxLabel?: string
  defaultEnabled?: boolean
}

export const ConditionalFormField = <TName = string>({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  className = '',
  min,
  max,
  step,
  rows = 4,
  as = 'input',
  options,
  checkboxLabel,
  defaultEnabled = false
}: ConditionalFormFieldProps<TName>) => {
  const [isEnabled, setIsEnabled] = useState(defaultEnabled || !!value)

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const enabled = e.target.checked
    setIsEnabled(enabled)
    
    // Clear the field value when disabled
    if (!enabled) {
      onChange(name, undefined)
    }
  }

  return (
    <div className="space-y-2.5 p-0.5">
      <div className="flex items-center space-x-2.5">
        <div className="relative p-0.5">
          <input
            type="checkbox"
            id={`${String(name)}_checkbox`}
            checked={isEnabled}
            onChange={handleCheckboxChange}
            className="h-4 w-4 text-primary-600 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 
                       border-2 border-gray-300 dark:border-gray-600 rounded 
                       bg-white dark:bg-gray-800 transition-all duration-200
                       hover:border-primary-400 dark:hover:border-primary-500"
          />
        </div>
        <label 
          htmlFor={`${String(name)}_checkbox`}
          className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer 
                     hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200
                     select-none"
        >
          {checkboxLabel || `Enable ${label}`}
        </label>
      </div>
      
      {isEnabled && (
        <FormField
          label={label}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          error={error}
          placeholder={placeholder}
          disabled={disabled}
          className={className}
          min={min}
          max={max}
          step={step}
          rows={rows}
          as={as}
          options={options}
        />
      )}
    </div>
  )
}