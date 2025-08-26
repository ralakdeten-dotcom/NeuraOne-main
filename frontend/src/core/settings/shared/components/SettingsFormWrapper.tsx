import React, { useState, useEffect } from 'react'
import { AlertCircle, CheckCircle } from 'lucide-react'

interface SettingsFormWrapperProps {
  onSubmit: (data: any) => Promise<void>
  initialData?: any
  validationSchema?: any
  children: React.ReactNode
  className?: string
}

export const SettingsFormWrapper: React.FC<SettingsFormWrapperProps> = ({
  onSubmit,
  initialData = {},
  validationSchema,
  children,
  className = ''
}) => {
  const [formData, setFormData] = useState(initialData)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string>('')

  useEffect(() => {
    setFormData(initialData)
  }, [initialData])

  const handleFieldChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    setHasChanges(true)
    setSuccessMessage('')
    
    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    if (!validationSchema) return true

    const newErrors: Record<string, string> = {}

    // Basic validation example - you can extend this with a proper validation library
    Object.keys(validationSchema).forEach(field => {
      const rules = validationSchema[field]
      const value = formData[field]

      if (rules.required && (!value || value.toString().trim() === '')) {
        newErrors[field] = `${rules.label || field} is required`
      } else if (rules.minLength && value && value.length < rules.minLength) {
        newErrors[field] = `${rules.label || field} must be at least ${rules.minLength} characters`
      } else if (rules.maxLength && value && value.length > rules.maxLength) {
        newErrors[field] = `${rules.label || field} must not exceed ${rules.maxLength} characters`
      } else if (rules.pattern && value && !rules.pattern.test(value)) {
        newErrors[field] = rules.message || `${rules.label || field} format is invalid`
      } else if (rules.min && value && parseFloat(value) < rules.min) {
        newErrors[field] = `${rules.label || field} must be at least ${rules.min}`
      } else if (rules.max && value && parseFloat(value) > rules.max) {
        newErrors[field] = `${rules.label || field} must not exceed ${rules.max}`
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      setHasChanges(false)
      setSuccessMessage('Settings saved successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(''), 3000)
    } catch (error: any) {
      console.error('Form submission error:', error)
      setErrors({ general: error.message || 'Failed to save settings. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Clone children and inject form props
  const childrenWithProps = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child as React.ReactElement<any>, {
        formData,
        errors,
        onChange: handleFieldChange,
        isSubmitting
      })
    }
    return child
  })

  return (
    <div className={className}>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* General Error */}
      {errors.general && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {childrenWithProps}
        
        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={() => setFormData(initialData)}
            disabled={!hasChanges || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            Reset
          </button>
          <button
            type="submit"
            disabled={!hasChanges || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 mr-2 inline border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}