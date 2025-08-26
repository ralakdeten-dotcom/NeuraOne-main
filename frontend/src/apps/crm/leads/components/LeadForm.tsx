import React, { useState, useEffect } from 'react'
import { useCreateLead, useUpdateLead, type LeadCreate, type Lead } from '../api'
import { AccountSelect, type AccountSelectOption } from '@/shared/components/selectors/AccountSelect'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { FormField } from '@/shared/components'
import { EditFormActions, CreateFormActions, TwoColumnGrid } from '@/shared/components/forms/FormSidePanel'
import { FormSection } from '@/shared/components/forms/FormSection'
import toast from 'react-hot-toast'
import { useEligibleLeadOwners } from '@/api/tenant'


interface LeadFormProps {
  lead?: Lead
  onSuccess?: () => void
  onCancel?: () => void
}

export const LeadForm: React.FC<LeadFormProps> = ({ 
  lead, 
  onSuccess, 
  onCancel 
}) => {
  const { data: ownersData } = useEligibleLeadOwners()
  
  const [formData, setFormData] = useState<LeadCreate>({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    phone: '',
    description: '',
    lead_status: 'New',
    score: 0,
    lead_source: '',
    industry: '',
    website: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postal_code: '',
    number_of_employees: undefined,
    average_revenue: undefined,
    company_name: '', // Required field
    lead_owner: undefined, // Will be set when eligible owners data loads
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const createLead = useCreateLead()
  const updateLead = useUpdateLead()

  const isEditing = !!lead

  // Lead status options
  const statusOptions = [
    { value: 'New', label: 'New' },
    { value: 'Contacted', label: 'Contacted' },
    { value: 'Qualified', label: 'Qualified' },
    { value: 'Proposal', label: 'Proposal' },
    { value: 'Closed', label: 'Closed' },
  ]

  // Lead source options
  const sourceOptions = [
    { value: 'Website', label: 'Website' },
    { value: 'Phone', label: 'Phone' },
    { value: 'Email', label: 'Email' },
    { value: 'Referral', label: 'Referral' },
    { value: 'Social Media', label: 'Social Media' },
    { value: 'Advertisement', label: 'Advertisement' },
    { value: 'Trade Show', label: 'Trade Show' },
    { value: 'Partner', label: 'Partner' },
  ]

  // Load lead data for editing
  useEffect(() => {
    if (lead) {
      setFormData({
        account: lead.account,
        company_name: lead.company_name || '',
        first_name: lead.first_name || '',
        last_name: lead.last_name || '',
        email: lead.email || '',
        title: lead.title || '',
        phone: lead.phone || '',
        description: lead.description || '',
        lead_status: lead.lead_status || 'New',
        score: lead.score || 0,
        lead_owner: lead.lead_owner,
        lead_source: lead.lead_source || '',
        industry: lead.industry || '',
        website: lead.website || '',
        street: lead.street || '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || '',
        postal_code: lead.postal_code || '',
        number_of_employees: lead.number_of_employees,
        average_revenue: lead.average_revenue,
      })
    }
  }, [lead])

  // Auto-set current user as lead owner for new leads when eligible owners data becomes available
  useEffect(() => {
    if (!lead && ownersData?.users && !formData.lead_owner) {
      // Find the current user in the eligible owners list
      const currentUser = ownersData.users.find(u => u.is_current_user)
      if (currentUser) {
        setFormData(prev => ({
          ...prev,
          lead_owner: currentUser.id
        }))
      }
    }
  }, [ownersData, lead, formData.lead_owner])

  const handleInputChange = (field: keyof LeadCreate, value: string | number | null | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    if (!formData.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    }

    if (formData.score && (formData.score < 0 || formData.score > 100)) {
      newErrors.score = 'Score must be between 0 and 100'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      if (isEditing && lead) {
        await updateLead.mutateAsync({ 
          id: lead.lead_id, 
          data: formData 
        })
        toast.success('Lead updated successfully!')
      } else {
        await createLead.mutateAsync(formData)
        toast.success('Lead created successfully!')
      }
      
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving lead:', error)
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred'
      toast.error(`Error saving lead: ${errorMessage}`)
    }
  }

  const isSubmitting = createLead.isPending || updateLead.isPending

  return (
    <form onSubmit={handleSubmit}>
      {/* Basic Information Section */}
      <FormSection title="Basic Information">
        <TwoColumnGrid>
            <FormField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              error={errors.first_name}
              placeholder="Enter first name"
              required
            />

            <FormField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              error={errors.last_name}
              placeholder="Enter last name"
              required
            />

            <FormField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={errors.email}
              placeholder="Enter email address"
            />

            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
            />

            <FormField
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="e.g., CEO, Marketing Manager"
            />

            <FormField
              label="Lead Status"
              name="lead_status"
              as="select"
              value={formData.lead_status}
              onChange={handleInputChange}
              options={statusOptions}
            />

            <FormField
              label="Lead Source"
              name="lead_source"
              as="select"
              value={formData.lead_source}
              onChange={handleInputChange}
              options={sourceOptions}
              placeholder="Select source"
            />

            <FormField
              label="Score (0-100)"
              name="score"
              type="number"
              value={formData.score}
              onChange={handleInputChange}
              error={errors.score}
              placeholder="0"
              min={0}
              max={100}
            />
        </TwoColumnGrid>

        <div className="mt-4">
          <FormField
            label="Description"
            name="description"
            as="textarea"
            value={formData.description}
            onChange={handleInputChange}
            placeholder="Enter lead description..."
            rows={4}
          />
        </div>
      </FormSection>

      {/* Business Information Section */}
      <FormSection title="Business Information">
        <TwoColumnGrid>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Company Name *
              </label>
              <AccountSelect
                key={lead?.lead_id || 'new'}
                initialSelection={
                  formData.account && formData.company_name
                    ? { accountId: formData.account, accountName: formData.company_name }
                    : formData.company_name
                    ? { accountId: null, accountName: formData.company_name }
                    : undefined
                }
                onChange={(option: AccountSelectOption) => {
                  // Update both account ID and name based on selection
                  if (option.accountId) {
                    // Existing account selected
                    handleInputChange('account', option.accountId)
                    handleInputChange('company_name', option.accountName)
                  } else {
                    // New company name typed - explicitly set to null to unlink
                    handleInputChange('account', null)
                    handleInputChange('company_name', option.accountName)
                  }
                }}
                placeholder="Search existing companies or type new name... (required)"
                className="w-full"
                leadMode={true}
              />
              {errors.company_name && (
                <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
              )}
            </div>

            <FormField
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="e.g., Technology, Healthcare"
            />

            <FormField
              label="Website"
              name="website"
              type="url"
              value={formData.website}
              onChange={handleInputChange}
              error={errors.website}
              placeholder="example.com or https://example.com"
            />

            <FormField
              label="Number of Employees"
              name="number_of_employees"
              type="number"
              value={formData.number_of_employees}
              onChange={handleInputChange}
              placeholder="e.g., 50"
              min={1}
            />

            <FormField
              label="Average Revenue"
              name="average_revenue"
              type="number"
              value={formData.average_revenue}
              onChange={handleInputChange}
              placeholder="e.g., 1000000"
              min={0}
              step="0.01"
            />

            <div>
              <UserSelect
                value={formData.lead_owner}
                onChange={(userId) => handleInputChange('lead_owner', userId)}
                label="Lead Owner"
                requiredPermission="manage_leads"
                placeholder="Select lead owner..."
                className="w-full"
                permissionFilter="manage_leads"
              />
            </div>
        </TwoColumnGrid>
      </FormSection>

      {/* Address Information Section */}
      <FormSection title="Address Information">
        <TwoColumnGrid>
            <FormField
              label="Street Address"
              name="street"
              value={formData.street}
              onChange={handleInputChange}
              placeholder="Enter street address"
            />

            <FormField
              label="City"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              placeholder="Enter city"
            />

            <FormField
              label="State/Province"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              placeholder="Enter state/province"
            />

            <FormField
              label="Country"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              placeholder="Enter country"
            />

            <FormField
              label="ZIP/Postal Code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              placeholder="Enter ZIP/postal code"
            />
        </TwoColumnGrid>
      </FormSection>

      {/* Form Actions */}
      {isEditing ? (
          <EditFormActions
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            disabled={isSubmitting}
          />
        ) : (
          <CreateFormActions
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            disabled={isSubmitting}
          />
        )}
    </form>
  );
}
