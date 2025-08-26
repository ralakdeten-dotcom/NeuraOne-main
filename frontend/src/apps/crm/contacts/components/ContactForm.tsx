import React, { useState, useEffect } from 'react'
import { useCreateContact, useUpdateContact, type ContactCreate, type Contact } from '../api'
import { AccountSelect, type AccountSelectOption } from '@/shared/components/selectors/AccountSelect'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { EssentialInfoSection, RelationshipsSection, AddressSection } from '@/shared/components/forms/FormSection'
import { FormField } from '@/shared/components'
import { EditFormActions, CreateFormActions } from '@/shared/components/forms/FormSidePanel'
import toast from 'react-hot-toast'
import { useEligibleLeadOwners } from '@/api/tenant'

interface ContactFormProps {
  contact?: Contact
  initialAccount?: { id: number; name: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export const ContactForm: React.FC<ContactFormProps> = ({ 
  contact, 
  initialAccount,
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<ContactCreate>({
    first_name: '',
    last_name: '',
    email: '',
    title: '',
    phone: '',
    description: '',
    mailing_street: '',
    mailing_city: '',
    mailing_state_province: '',
    mailing_country: '',
    postal_code: '',
  })
  
  // Additional state for UI components
  const [accountName, setAccountName] = useState('')
  const [shouldCreateAccount, setShouldCreateAccount] = useState(false)
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>(undefined)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const { data: ownersData } = useEligibleLeadOwners()

  const createContact = useCreateContact()
  const updateContact = useUpdateContact()

  const isEditing = !!contact

  // Set default owner to current user on new contacts
  useEffect(() => {
    if (!isEditing && ownersData?.users) {
      const currentUser = ownersData.users.find(user => user.is_current_user)
      if (currentUser && !selectedOwner) {
        setSelectedOwner(currentUser.id)
        setFormData(prev => ({ ...prev, owner: currentUser.id }))
      }
    }
  }, [ownersData, isEditing, selectedOwner])

  // Load contact data for editing or set initial account
  useEffect(() => {
    if (contact) {
      setFormData({
        account: contact.account,
        first_name: contact.first_name || '',
        last_name: contact.last_name || '',
        email: contact.email || '',
        title: contact.title || '',
        phone: contact.phone || '',
        description: contact.description || '',
        mailing_street: contact.mailing_street || '',
        mailing_city: contact.mailing_city || '',
        mailing_state_province: contact.mailing_state_province || '',
        mailing_country: contact.mailing_country || '',
        postal_code: contact.postal_code || '',
        owner: contact.owner,
        // Note: Using only 'owner' field - removing redundant 'contact_owner'
      })
      
      // Set UI state
      setAccountName(contact.account_name || '')
      setSelectedOwner(contact.owner)
    } else if (initialAccount) {
      setFormData(prev => ({
        ...prev,
        account: initialAccount.id
      }))
      setAccountName(initialAccount.name)
    }
  }, [contact, initialAccount])

  const handleInputChange = (field: keyof ContactCreate, value: string | number | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  // Handle account selection from AccountSelect
  const handleAccountChange = (option: AccountSelectOption) => {
    setAccountName(option.accountName)
    // Update both account ID and name based on selection
    if (option.accountId) {
      // Existing account selected - use the account ID
      setFormData(prev => ({ ...prev, account: option.accountId || undefined }))
      setShouldCreateAccount(false)
    } else {
      // New account name typed - clear account ID, backend will create new account
      setFormData(prev => ({ ...prev, account: undefined }))
      setShouldCreateAccount(true)
    }
  }

  // Handle owner selection from UserSelect
  const handleOwnerChange = (userId: number) => {
    setSelectedOwner(userId)
    setFormData(prev => ({ ...prev, owner: userId }))
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

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    // Clean up form data - convert empty strings to undefined for optional fields
    const cleanedData = {
      ...formData,
      email: formData.email?.trim() || undefined,
      phone: formData.phone?.trim() || undefined,
      title: formData.title?.trim() || undefined,
      description: formData.description?.trim() || undefined,
      mailing_street: formData.mailing_street?.trim() || undefined,
      mailing_city: formData.mailing_city?.trim() || undefined,
      mailing_state_province: formData.mailing_state_province?.trim() || undefined,
      mailing_country: formData.mailing_country?.trim() || undefined,
      postal_code: formData.postal_code?.trim() || undefined,
      // Include account_name for new account creation
      ...(shouldCreateAccount && accountName?.trim() && { account_name: accountName.trim() }),
    }

    try {
      if (isEditing && contact) {
        await updateContact.mutateAsync({ 
          id: contact.contact_id, 
          data: cleanedData 
        })
        toast.success('Contact updated successfully!')
      } else {
        await createContact.mutateAsync(cleanedData)
        toast.success('Contact created successfully!')
      }
      
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving contact:', error)
      const errorMessage = error.response?.data?.message || error.message || 'An unexpected error occurred'
      toast.error(`Error saving contact: ${errorMessage}`)
    }
  }

  const isSubmitting = createContact.isPending || updateContact.isPending

  return (
    <form onSubmit={handleSubmit}>
        
        {/* Essential Information Section */}
        <EssentialInfoSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleInputChange}
              error={errors.first_name}
              placeholder="Enter first name"
              disabled={isSubmitting}
              required
            />

            <FormField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleInputChange}
              error={errors.last_name}
              placeholder="Enter last name"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
              required
            />

            <FormField
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              error={errors.phone}
              placeholder="+1 (555) 123-4567"
              disabled={isSubmitting}
            />

            <div className="md:col-span-2">
              <FormField
                label="Job Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="e.g., Sales Manager, CEO, Developer"
                disabled={isSubmitting}
              />
            </div>
          </div>
        </EssentialInfoSection>

        {/* Company & Relationships Section */}
        <RelationshipsSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <AccountSelect
                key={contact?.contact_id || 'new'}
                initialSelection={
                  formData.account && accountName
                    ? { accountId: formData.account, accountName: accountName }
                    : accountName
                    ? { accountId: null, accountName: accountName }
                    : undefined
                }
                onChange={handleAccountChange}
                placeholder="Search existing company or create new..."
                disabled={isSubmitting}
                className="w-full"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional - Link contact to a company account
              </p>
            </div>

            <div className="md:col-span-2">
              <UserSelect
                value={selectedOwner}
                onChange={handleOwnerChange}
                placeholder="Select contact owner..."
                requiredPermission="manage_contacts"
                label="Contact Owner"
                disabled={isSubmitting}
                className="w-full"
                permissionFilter="manage_contacts"
              />
              <p className="mt-1 text-sm text-gray-500">
                The user responsible for managing this contact
              </p>
            </div>
          </div>
        </RelationshipsSection>

        {/* Address & Details Section */}
        <AddressSection>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <FormField
                label="Street Address"
                name="mailing_street"
                value={formData.mailing_street}
                onChange={handleInputChange}
                placeholder="Enter street address"
                disabled={isSubmitting}
              />
            </div>

            <FormField
              label="City"
              name="mailing_city"
              value={formData.mailing_city}
              onChange={handleInputChange}
              placeholder="Enter city"
              disabled={isSubmitting}
            />

            <FormField
              label="State/Province"
              name="mailing_state_province"
              value={formData.mailing_state_province}
              onChange={handleInputChange}
              placeholder="Enter state/province"
              disabled={isSubmitting}
            />

            <FormField
              label="Country"
              name="mailing_country"
              value={formData.mailing_country}
              onChange={handleInputChange}
              placeholder="Enter country"
              disabled={isSubmitting}
            />

            <FormField
              label="ZIP/Postal Code"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleInputChange}
              placeholder="Enter ZIP/postal code"
              disabled={isSubmitting}
            />

            <div className="md:col-span-2">
              <FormField
                label="Description"
                name="description"
                as="textarea"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Enter contact description or notes..."
                disabled={isSubmitting}
                rows={4}
              />
            </div>
          </div>
        </AddressSection>

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
  )
}