import React, { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  Building2, 
  User, 
  Globe, 
  Mail, 
  Lock,
  ArrowLeft,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { superAdminApi, type CreateTenantRequest } from '../api'
import { Button } from '@/shared/components/buttons/Button'

// Simple Card component for layout
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <div className={`bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 ${className}`}>
    {children}
  </div>
)

// Simple FormField component
const FormField: React.FC<{
  label: string;
  required?: boolean;
  error?: string;
  description?: string;
  children: React.ReactNode;
}> = ({ label, required, error, description, children }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
      {label}
      {required && <span className="text-red-500 ml-1">*</span>}
    </label>
    {children}
    {error && (
      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
    )}
    {description && !error && (
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
    )}
  </div>
)

export const CreateTenantPage: React.FC = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  
  const [formData, setFormData] = useState<CreateTenantRequest>({
    company_name: '',
    schema_name: '',
    domain_url: '',
    admin_email: '',
    admin_password: '',
    admin_first_name: '',
    admin_last_name: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createTenantMutation = useMutation({
    mutationFn: superAdminApi.createTenant,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] })
      navigate('/superadmin/tenants', {
        state: { 
          successMessage: `Tenant "${data.tenant.name}" created successfully!` 
        }
      })
    },
    onError: (error: any) => {
      const errorData = error.response?.data
      if (errorData?.error) {
        setErrors({ general: errorData.error })
      } else {
        setErrors({ general: 'Failed to create tenant. Please try again.' })
      }
    }
  })

  // Auto-generate schema name from company name
  const handleCompanyNameChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      company_name: value,
      schema_name: value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '')
        .substring(0, 30)
    }))
    
    if (errors.company_name) {
      setErrors(prev => ({ ...prev, company_name: '' }))
    }
  }

  const handleInputChange = (field: keyof CreateTenantRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    }

    if (!formData.schema_name.trim()) {
      newErrors.schema_name = 'Schema name is required'
    } else if (!/^[a-z][a-z0-9_]*$/.test(formData.schema_name)) {
      newErrors.schema_name = 'Schema name must start with lowercase letter and contain only lowercase letters, numbers, and underscores'
    }

    if (!formData.admin_email.trim()) {
      newErrors.admin_email = 'Admin email is required'
    } else if (!/\S+@\S+\.\S+/.test(formData.admin_email)) {
      newErrors.admin_email = 'Please enter a valid email address'
    }

    if (!formData.admin_password.trim()) {
      newErrors.admin_password = 'Admin password is required'
    } else if (formData.admin_password.length < 8) {
      newErrors.admin_password = 'Password must be at least 8 characters long'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData = {
      ...formData,
      admin_first_name: formData.admin_first_name || 'Admin',
      admin_last_name: formData.admin_last_name || formData.company_name
    }

    createTenantMutation.mutate(submitData)
  }

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center space-x-4 mb-6">
        <Button
          variant="secondary"
          onClick={() => navigate('/superadmin/tenants')}
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tenants</span>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create New Tenant
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Set up a new organization with admin user
          </p>
        </div>
      </div>

      <div className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Error */}
          {errors.general && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <span className="text-sm text-red-700 dark:text-red-300">{errors.general}</span>
              </div>
            </div>
          )}

          {/* Company Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Company Information
                </h3>
              </div>
              
              <div className="space-y-4">
                <FormField
                  label="Company Name"
                  required
                  error={errors.company_name}
                >
                  <input
                    type="text"
                    value={formData.company_name}
                    onChange={(e) => handleCompanyNameChange(e.target.value)}
                    placeholder="e.g., Acme Corporation"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </FormField>

                <FormField
                  label="Schema Name"
                  required
                  error={errors.schema_name}
                  description="Database schema identifier (auto-generated, lowercase letters, numbers, and underscores only)"
                >
                  <input
                    type="text"
                    value={formData.schema_name}
                    onChange={(e) => handleInputChange('schema_name', e.target.value)}
                    placeholder="e.g., acme_corp"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  />
                </FormField>

                <FormField
                  label="Domain URL"
                  error={errors.domain_url}
                  description="Optional custom domain (defaults to schema_name.localhost)"
                >
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                      <Globe className="h-4 w-4 mr-2" />
                    </span>
                    <input
                      type="text"
                      value={formData.domain_url}
                      onChange={(e) => handleInputChange('domain_url', e.target.value)}
                      placeholder="acme.localhost"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </FormField>
              </div>
            </div>
          </Card>

          {/* Admin User Information */}
          <Card>
            <div className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                  Admin User
                </h3>
              </div>
              
              <div className="space-y-4">
                <FormField
                  label="Email"
                  required
                  error={errors.admin_email}
                >
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                      <Mail className="h-4 w-4" />
                    </span>
                    <input
                      type="email"
                      value={formData.admin_email}
                      onChange={(e) => handleInputChange('admin_email', e.target.value)}
                      placeholder="admin@company.com"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </FormField>

                <FormField
                  label="Password"
                  required
                  error={errors.admin_password}
                >
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
                      <Lock className="h-4 w-4" />
                    </span>
                    <input
                      type="password"
                      value={formData.admin_password}
                      onChange={(e) => handleInputChange('admin_password', e.target.value)}
                      placeholder="Minimum 8 characters"
                      className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </FormField>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    label="First Name"
                    error={errors.admin_first_name}
                  >
                    <input
                      type="text"
                      value={formData.admin_first_name}
                      onChange={(e) => handleInputChange('admin_first_name', e.target.value)}
                      placeholder="Admin (default)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </FormField>

                  <FormField
                    label="Last Name"
                    error={errors.admin_last_name}
                  >
                    <input
                      type="text"
                      value={formData.admin_last_name}
                      onChange={(e) => handleInputChange('admin_last_name', e.target.value)}
                      placeholder="Company name (default)"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                    />
                  </FormField>
                </div>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button
              type="submit"
              variant="primary"
              disabled={createTenantMutation.isPending}
              className="flex items-center space-x-2"
            >
              {createTenantMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Create Tenant</span>
                </>
              )}
            </Button>
            
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/superadmin/tenants')}
              disabled={createTenantMutation.isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}