import React, { useState, useEffect } from 'react'
import { useCreateAccount, useUpdateAccount, type AccountCreate, type Account } from '../api'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { FormField } from '@/shared/components'
import { EditFormActions, CreateFormActions, TwoColumnGrid } from '@/shared/components/forms/FormSidePanel'
import { FormSection } from '@/shared/components/forms/FormSection'
import toast from 'react-hot-toast'
import { useEligibleLeadOwners } from '@/api/tenant'

interface AccountFormProps {
  account?: Account
  onSuccess?: () => void
  onCancel?: () => void
}

export const AccountForm: React.FC<AccountFormProps> = ({ 
  account, 
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<AccountCreate>({
    account_name: '',
    account_owner_alias: '',
    description: '',
    industry: '',
    website: '',
    phone: '',
    number_of_employees: undefined,
    billing_country: '',
    billing_street: '',
    billing_city: '',
    billing_state_province: '',
    billing_zip_postal_code: '',
    shipping_country: '',
    shipping_street: '',
    shipping_city: '',
    shipping_state_province: '',
    shipping_zip_postal_code: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>()

  const { data: ownersData } = useEligibleLeadOwners()

  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()

  const isEditing = !!account

  // Set default owner to current user on new accounts
  useEffect(() => {
    if (!isEditing && ownersData?.users) {
      const currentUser = ownersData.users.find(user => user.is_current_user)
      if (currentUser && !selectedOwner) {
        setSelectedOwner(currentUser.id)
      }
    }
  }, [ownersData, isEditing, selectedOwner])

  // Load account data for editing
  useEffect(() => {
    if (account) {
      setFormData({
        account_name: account.account_name || '',
        account_owner_alias: account.account_owner_alias || '',
        description: account.description || '',
        industry: account.industry || '',
        website: account.website || '',
        phone: account.phone || '',
        number_of_employees: account.number_of_employees || undefined,
        billing_country: account.billing_country || '',
        billing_street: account.billing_street || '',
        billing_city: account.billing_city || '',
        billing_state_province: account.billing_state_province || '',
        billing_zip_postal_code: account.billing_zip_postal_code || '',
        shipping_country: account.shipping_country || '',
        shipping_street: account.shipping_street || '',
        shipping_city: account.shipping_city || '',
        shipping_state_province: account.shipping_state_province || '',
        shipping_zip_postal_code: account.shipping_zip_postal_code || '',
      })
      // Set owner for editing
      setSelectedOwner(account.owner)
    }
  }, [account, ownersData])

  const handleInputChange = (field: keyof AccountCreate, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleOwnerChange = (userId: number) => {
    setSelectedOwner(userId)
    // Clear owner error if set
    if (errors.owner) {
      setErrors(prev => ({ ...prev, owner: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.account_name.trim()) {
      newErrors.account_name = 'Account name is required'
    }

    if (formData.phone && !/^[\d\s\-+()]+$/.test(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      // Include owner in the data
      const accountData = {
        ...formData,
        owner: selectedOwner
      }

      if (isEditing && account) {
        await updateAccount.mutateAsync({ 
          id: account.account_id, 
          data: accountData 
        })
        toast.success('Account updated successfully!')
      } else {
        await createAccount.mutateAsync(accountData)
        toast.success('Account created successfully!')
      }
      
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving account:', error)
      
      // Check for duplicate account name error
      if (error.response?.data?.account_name) {
        // This is the validation error from the serializer
        const accountNameError = error.response.data.account_name[0]
        if (accountNameError?.includes('similar name already exists')) {
          toast.error('Account with this name already exists')
        } else {
          toast.error(accountNameError)
        }
      } else {
        // Handle other errors
        const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred'
        toast.error(`Error saving account: ${errorMessage}`)
      }
    }
  }

  const isSubmitting = createAccount.isPending || updateAccount.isPending

  return (
    <div className="bg-white dark:bg-gray-800">
      <form onSubmit={handleSubmit} className="p-4">
        {/* Basic Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Account Name"
              name="account_name"
              value={formData.account_name}
              onChange={handleInputChange}
              error={errors.account_name}
              placeholder="Enter account name"
              required
            />

            <UserSelect
              value={selectedOwner}
              onChange={handleOwnerChange}
              label="Account Owner *"
              requiredPermission="manage_accounts"
              placeholder="Select account owner..."
              error={errors.owner}
              permissionFilter="manage_accounts"
            />

            <FormField
              label="Industry"
              name="industry"
              value={formData.industry}
              onChange={handleInputChange}
              placeholder="e.g., Technology, Healthcare, Finance"
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
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
            />

            <FormField
              label="Number of Employees"
              name="number_of_employees"
              type="number"
              value={formData.number_of_employees}
              onChange={handleInputChange}
              placeholder="e.g., 100"
              min={1}
            />
          </div>

          <div className="mt-6">
            <FormField
              label="Description"
              name="description"
              as="textarea"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter account description..."
              rows={4}
            />
          </div>
        </div>

        {/* Business Information Section */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Business Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Billing Country"
              name="billing_country"
              value={formData.billing_country}
              onChange={handleInputChange}
              placeholder="Enter country"
            />

            <FormField
              label="Billing Street Address"
              name="billing_street"
              value={formData.billing_street}
              onChange={handleInputChange}
              placeholder="Enter street address"
            />

            <FormField
              label="Billing City"
              name="billing_city"
              value={formData.billing_city}
              onChange={handleInputChange}
              placeholder="Enter city"
            />

            <FormField
              label="Billing State/Province"
              name="billing_state_province"
              value={formData.billing_state_province}
              onChange={handleInputChange}
              placeholder="Enter state/province"
            />

            <FormField
              label="Billing ZIP/Postal Code"
              name="billing_zip_postal_code"
              value={formData.billing_zip_postal_code}
              onChange={handleInputChange}
              placeholder="Enter ZIP/postal code"
            />
          </div>
        </div>

      {/* Shipping Address Section */}
      <FormSection title="Shipping Address">
        <TwoColumnGrid>
            <FormField
              label="Shipping Country"
              name="shipping_country"
              value={formData.shipping_country}
              onChange={handleInputChange}
              placeholder="Enter country"
            />

            <FormField
              label="Shipping Street Address"
              name="shipping_street"
              value={formData.shipping_street}
              onChange={handleInputChange}
              placeholder="Enter street address"
            />

            <FormField
              label="Shipping City"
              name="shipping_city"
              value={formData.shipping_city}
              onChange={handleInputChange}
              placeholder="Enter city"
            />

            <FormField
              label="Shipping State/Province"
              name="shipping_state_province"
              value={formData.shipping_state_province}
              onChange={handleInputChange}
              placeholder="Enter state/province"
            />

            <FormField
              label="Shipping ZIP/Postal Code"
              name="shipping_zip_postal_code"
              value={formData.shipping_zip_postal_code}
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
    </div>
  )
}