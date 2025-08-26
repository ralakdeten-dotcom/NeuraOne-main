import React, { useState } from 'react'
import { SidePanel, type SidePanelProps } from '../modals/SidePanel'
import { Button } from '../buttons/Button'
import { ChevronDown } from 'lucide-react'

// ====================
// ENHANCED FORM FIELD 
// ====================

interface EnhancedFormFieldProps<TName = string> {
  label: string
  name: TName
  type?: 'text' | 'email' | 'tel' | 'password' | 'number' | 'url' | 'date'
  value: string | number | undefined | null
  onChange: (name: TName, value: string | number | undefined) => void
  error?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  min?: number
  max?: number
  step?: string
  rows?: number // For textarea
  as?: 'input' | 'textarea' | 'select'
  options?: { value: string | number; label: string }[] // For select
}

export const EnhancedFormField = <TName = string>({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  min,
  max,
  step,
  rows = 4,
  as = 'input',
  options
}: EnhancedFormFieldProps<TName>) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = e.target.value
    
    if (type === 'number') {
      if (step && step.includes('.')) {
        onChange(name, newValue ? parseFloat(newValue) : undefined)
      } else {
        onChange(name, newValue ? parseInt(newValue) : undefined)
      }
    } else {
      onChange(name, newValue)
    }
  }

  const baseInputClasses = `w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg 
    focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:border-primary-500 dark:focus:border-primary-400 
    focus:outline-none transition-all duration-200 
    bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 
    hover:border-gray-400 dark:hover:border-gray-500
    ${error ? 'border-red-500 dark:border-red-400 focus:ring-red-500 focus:border-red-500' : ''} 
    ${disabled ? 'bg-gray-100 dark:bg-gray-600 cursor-not-allowed opacity-60' : ''} ${className}`

  const displayValue = value === undefined || value === null ? '' : value.toString()

  return (
    <div className="relative p-0.5">
      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
        {label} {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {as === 'textarea' ? (
        <textarea
          value={displayValue}
          onChange={handleChange}
          className={baseInputClasses}
          placeholder={placeholder}
          disabled={disabled}
          rows={rows}
        />
      ) : as === 'select' ? (
        <select
          value={displayValue}
          onChange={handleChange}
          className={baseInputClasses}
          disabled={disabled}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={displayValue}
          onChange={handleChange}
          className={baseInputClasses}
          placeholder={placeholder}
          disabled={disabled}
          min={type === 'number' ? min : undefined}
          max={type === 'number' ? max : undefined}
          step={type === 'number' ? step : undefined}
        />
      )}
      
      {error && (
        <p className="mt-1.5 text-sm text-red-600 dark:text-red-400 flex items-center">
          <svg className="w-4 h-4 mr-1.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ==========================
// CONDITIONAL FORM FIELD
// ==========================

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
        <EnhancedFormField
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

// ====================
// ENHANCED FORM GRID COMPONENTS
// ====================

interface FormGridProps {
  children: React.ReactNode
  cols?: 1 | 2 | 3 | 4
  gap?: 'sm' | 'md' | 'lg'
  className?: string
}

export const FormGrid: React.FC<FormGridProps> = ({
  children,
  cols = 2,
  gap = 'md',
  className = ''
}) => {
  const colClasses = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  }

  const gapClasses = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6'
  }

  return (
    <div className={`grid ${colClasses[cols]} ${gapClasses[gap]} ${className}`}>
      {children}
    </div>
  )
}

// Convenience grid components
export const TwoColumnGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <FormGrid cols={2} gap="md" className={className}>
    {children}
  </FormGrid>
)

export const ThreeColumnGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <FormGrid cols={3} gap="md" className={className}>
    {children}
  </FormGrid>
)

export const SingleColumnGrid: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <FormGrid cols={1} gap="md" className={className}>
    {children}
  </FormGrid>
)

// ======================
// ENHANCED FORM SECTION COMPONENT
// ======================

interface EnhancedFormSectionProps {
  title: string
  subtitle?: string
  children: React.ReactNode
  collapsible?: boolean
  defaultExpanded?: boolean
  alwaysExpanded?: boolean
  className?: string
  headerClassName?: string
  variant?: 'default' | 'card' | 'bordered'
  icon?: React.ReactNode
}

export const EnhancedFormSection: React.FC<EnhancedFormSectionProps> = ({
  title,
  subtitle,
  children,
  collapsible = false,
  defaultExpanded = true,
  alwaysExpanded = false,
  className = "",
  headerClassName = "",
  variant = 'default',
  icon
}) => {
  const [isExpanded, setIsExpanded] = useState(alwaysExpanded || defaultExpanded)

  // If alwaysExpanded is true, force expanded state
  const expanded = alwaysExpanded || isExpanded

  const handleToggle = () => {
    if (!alwaysExpanded && collapsible) {
      setIsExpanded(!isExpanded)
    }
  }

  const variantClasses = {
    default: 'bg-gray-50/50 dark:bg-gray-800/30 rounded-lg p-4 mb-4 overflow-visible',
    card: 'bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 shadow-sm rounded-lg p-4 mb-4 overflow-visible',
    bordered: 'bg-white dark:bg-gray-800 border border-gray-200/60 dark:border-gray-700/60 rounded-lg p-4 mb-4 overflow-visible'
  }

  const sectionClasses = `${variantClasses[variant]} ${className}`.trim()

  return (
    <div className={sectionClasses}>
      <div
        className={`flex items-start justify-between mb-3 ${
          collapsible && !alwaysExpanded ? 'cursor-pointer' : ''
        } ${headerClassName}`}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {icon && (
            <div className="flex-shrink-0 text-gray-500 dark:text-gray-400">
              {React.cloneElement(icon as React.ReactElement, {
                className: 'w-4 h-4'
              })}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight tracking-tight">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
        </div>
        
        {collapsible && !alwaysExpanded && (
          <button
            type="button"
            className="flex-shrink-0 ml-2 p-1 text-gray-400 dark:text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 
                      hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all duration-200 
                      focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 active:scale-95"
            aria-label={expanded ? 'Collapse section' : 'Expand section'}
          >
            <ChevronDown
              className={`w-4 h-4 transition-all duration-300 ease-out ${
                expanded ? 'transform rotate-180' : ''
              }`}
            />
          </button>
        )}
      </div>
      
      <div
        className={`transition-all duration-500 ease-out relative ${
          expanded 
            ? 'opacity-100 max-h-screen transform translate-y-0 overflow-visible' 
            : 'opacity-0 max-h-0 transform -translate-y-1 overflow-hidden'
        }`}
      >
        <div className={`transition-all duration-400 ease-out ${expanded ? 'pt-1' : 'pt-0'}`}>
          <div className="space-y-3">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

// ======================
// ENHANCED FORM ACTIONS COMPONENT
// ======================

interface FormActionsProps {
  children?: React.ReactNode
  className?: string
  position?: 'left' | 'right' | 'center' | 'between'
  spacing?: 'sm' | 'md' | 'lg'
  bordered?: boolean
}

export const FormActions: React.FC<FormActionsProps> = ({
  children,
  className = '',
  position = 'right',
  spacing = 'md',
  bordered = true
}) => {
  const positionClasses = {
    left: 'justify-start',
    right: 'justify-end',
    center: 'justify-center',
    between: 'justify-between'
  }

  const spacingClasses = {
    sm: 'space-x-2',
    md: 'space-x-4',
    lg: 'space-x-6'
  }

  const borderClass = bordered ? 'border-t border-gray-200 dark:border-gray-600' : ''

  return (
    <div className={`flex ${positionClasses[position]} ${spacingClasses[spacing]} pt-4 mt-3 ${borderClass} ${className}`}>
      {children}
    </div>
  )
}

// Pre-built action patterns
interface StandardFormActionsProps {
  onCancel?: () => void
  onSubmit?: () => void
  submitText?: string
  cancelText?: string
  isSubmitting?: boolean
  disabled?: boolean
  submitVariant?: 'primary' | 'secondary' | 'danger'
  submitSize?: 'sm' | 'md' | 'lg'
}

export const StandardFormActions: React.FC<StandardFormActionsProps> = ({
  onCancel,
  onSubmit,
  submitText = 'Save',
  cancelText = 'Cancel',
  isSubmitting = false,
  disabled = false,
  submitVariant = 'primary',
  submitSize = 'lg'
}) => (
  <FormActions>
    {onCancel && (
      <Button
        type="button"
        variant="secondary"
        onClick={onCancel}
        disabled={isSubmitting}
      >
        {cancelText}
      </Button>
    )}
    <Button
      type="submit"
      variant={submitVariant}
      onClick={onSubmit}
      disabled={disabled || isSubmitting}
      loading={isSubmitting}
      size={submitSize}
    >
      {submitText}
    </Button>
  </FormActions>
)

// CRUD-specific action patterns
export const CreateFormActions: React.FC<Omit<StandardFormActionsProps, 'submitText'>> = (props) => (
  <StandardFormActions {...props} submitText="Create" />
)

export const EditFormActions: React.FC<Omit<StandardFormActionsProps, 'submitText'>> = (props) => (
  <StandardFormActions {...props} submitText="Update" />
)

export const SaveFormActions: React.FC<Omit<StandardFormActionsProps, 'submitText'>> = (props) => (
  <StandardFormActions {...props} submitText="Save Changes" />
)

// ========================
// MAIN ENHANCED FORM SIDE PANEL
// ========================

export const FormSidePanel: React.FC<SidePanelProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  className = '',
  size = 'xl',
  showCloseButton = true,
  closeOnBackdrop = false,  // Prevent accidental form loss
  closeOnEscape = false,    // Prevent accidental form loss  
  position = 'right'
}) => {
  return (
    <SidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      showCloseButton={showCloseButton}
      closeOnBackdrop={closeOnBackdrop}
      closeOnEscape={closeOnEscape}
      position={position}
      className={className}
    >
      <div className="bg-white dark:bg-gray-800">
        {/* Form-optimized content wrapper with compact styling */}
        <div className="p-4">
          {children}
        </div>
      </div>
    </SidePanel>
  )
}

