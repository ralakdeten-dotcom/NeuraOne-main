import React, { useState, useEffect, useMemo } from 'react'
import { useCreateDeal, useUpdateDeal, type DealCreate, type Deal } from '../api'
import { UserSelect, ContactSelect, AccountSelect } from '@/shared'
import { useEligibleLeadOwners } from '@/api/tenant'
import toast from 'react-hot-toast'
import { 
  EnhancedFormField,
  EnhancedFormSection,
  TwoColumnGrid,
  SingleColumnGrid,
  CreateFormActions,
  EditFormActions
} from '@/shared/components/forms/FormSidePanel'

interface DealFormProps {
  deal?: Deal
  initialAccount?: { id: number; name: string }
  initialContact?: { id: number; name: string }
  onSuccess?: () => void
  onCancel?: () => void
}

export const DealForm: React.FC<DealFormProps> = ({ 
  deal, 
  initialAccount,
  initialContact,
  onSuccess, 
  onCancel 
}) => {
  const [formData, setFormData] = useState<DealCreate>({
    deal_name: '',
    stage: 'Prospecting',
    amount: '',
    close_date: '',
    account: 0,
    primary_contact: undefined,
    description: '',
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [selectedOwner, setSelectedOwner] = useState<number | undefined>()
  const [selectedAccount, setSelectedAccount] = useState<{ accountId: number | null; accountName: string } | undefined>()

  const { data: ownersData } = useEligibleLeadOwners()

  const createDeal = useCreateDeal()
  const updateDeal = useUpdateDeal()

  const isEditing = !!deal

  // Memoize initial values to prevent unnecessary re-renders
  const initialAccountMemo = useMemo(() => initialAccount, [initialAccount?.id, initialAccount?.name])
  const initialContactMemo = useMemo(() => initialContact, [initialContact?.id, initialContact?.name])

  // Set default owner to current user on new deals
  useEffect(() => {
    if (!isEditing && ownersData?.users) {
      const currentUser = ownersData.users.find(user => user.is_current_user)
      if (currentUser && !selectedOwner) {
        setSelectedOwner(currentUser.id)
      }
    }
  }, [ownersData, isEditing, selectedOwner])

  // Load deal data for editing or set initial account and contact
  useEffect(() => {
    if (deal) {
      setFormData({
        deal_name: deal.deal_name || '',
        stage: deal.stage || 'Prospecting',
        amount: deal.amount || '',
        close_date: deal.close_date || '',
        account: deal.account || 0,
        primary_contact: deal.primary_contact || undefined,
        description: deal.description || '',
      })
      // Set owner for editing
      setSelectedOwner(deal.owner)
      // Set account for editing - we'll need to fetch the account name
      if (deal.account) {
        setSelectedAccount({
          accountId: deal.account,
          accountName: deal.account_name || '' // Assuming this is provided
        })
      }
    } else {
      // Set initial values for new deals
      const newFormData: any = {}
      
      if (initialAccountMemo) {
        newFormData.account = initialAccountMemo.id
        setSelectedAccount({
          accountId: initialAccountMemo.id,
          accountName: initialAccountMemo.name
        })
      }
      
      if (initialContactMemo) {
        newFormData.primary_contact = initialContactMemo.id
      }
      
      // Only update if there are changes
      if (Object.keys(newFormData).length > 0) {
        setFormData(prev => ({
          ...prev,
          ...newFormData
        }))
      }
    }
  }, [deal, initialAccountMemo, initialContactMemo, ownersData])

  const handleInputChange = (field: keyof DealCreate, value: string | number | undefined) => {
    // Debug log to see what FormField returns
    console.log('[DealForm] handleInputChange - field:', field, 'type:', typeof value, 'value:', value)
    
    setFormData(prev => {
      const newData = { ...prev, [field]: value }
      
      // Clear primary contact when account changes
      if (field === 'account' && value !== prev.account) {
        newData.primary_contact = undefined
      }
      
      return newData
    })
    
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

  const handleAccountChange = (option: { accountId: number | null; accountName: string }) => {
    setSelectedAccount(option)
    setFormData(prev => ({
      ...prev,
      account: option.accountId || 0,
      // Clear primary contact when account changes
      primary_contact: undefined
    }))
    // Clear account error if set
    if (errors.account) {
      setErrors(prev => ({ ...prev, account: '' }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Debug log to check amount type
    console.log('[DealForm] validateForm - amount type:', typeof formData.amount, 'value:', formData.amount)

    if (!formData.deal_name.trim()) {
      newErrors.deal_name = 'Deal name is required'
    }

    if (!formData.stage.trim()) {
      newErrors.stage = 'Stage is required'
    }

    // Handle amount validation for both string and number types
    const amountValue = formData.amount
    if (!amountValue || (typeof amountValue === 'string' && !amountValue.trim())) {
      newErrors.amount = 'Amount is required'
    } else if (isNaN(Number(amountValue)) || Number(amountValue) <= 0) {
      newErrors.amount = 'Amount must be a positive number'
    }

    if (!formData.close_date.trim()) {
      newErrors.close_date = 'Close date is required'
    } else {
      const closeDate = new Date(formData.close_date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      if (closeDate < today) {
        newErrors.close_date = 'Close date cannot be in the past'
      }
    }

    if (!formData.account || formData.account === 0) {
      newErrors.account = 'Account is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      // Include owner in the data and ensure amount is a string
      const dealData = {
        ...formData,
        amount: String(formData.amount),
        owner: selectedOwner
      }

      // Debug log the data being sent
      console.log('[DealForm] Submitting deal data:', dealData)
      console.log('[DealForm] Data types:', {
        amount: typeof dealData.amount,
        account: typeof dealData.account,
        primary_contact: typeof dealData.primary_contact,
        owner: typeof dealData.owner
      })
      console.log('[DealForm] Specific values:', {
        account: dealData.account,
        primary_contact: dealData.primary_contact,
        owner: dealData.owner
      })

      if (isEditing && deal) {
        await updateDeal.mutateAsync({
          dealId: deal.deal_id,
          dealData: dealData
        })
        toast.success('Deal updated successfully!')
      } else {
        await createDeal.mutateAsync(dealData)
        toast.success('Deal created successfully!')
      }
      
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving deal:', error)
      console.error('Error response:', error.response?.data)
      toast.error(`Error saving deal: ${error.response?.data?.detail || error.response?.data?.error || error.message}`)
    }
  }

  const isSubmitting = createDeal.isPending || updateDeal.isPending

  const stageOptions = [
    { value: 'Prospecting', label: 'Prospecting' },
    { value: 'Analysis', label: 'Analysis' },
    { value: 'Proposal', label: 'Proposal' },
    { value: 'Negotiation', label: 'Negotiation' },
    { value: 'Closed', label: 'Closed' },
    { value: 'Closed Won', label: 'Closed Won' },
    { value: 'Closed Lost', label: 'Closed Lost' }
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Basic Information Section */}
      <EnhancedFormSection
        title="Basic Information"
        subtitle="Essential deal details"
        alwaysExpanded={true}
        variant="card"
      >
        <TwoColumnGrid>
          <EnhancedFormField
            label="Deal Name"
            name="deal_name"
            value={formData.deal_name}
            onChange={handleInputChange}
            error={errors.deal_name}
            placeholder="Enter deal name"
            disabled={isSubmitting}
            required
          />

          <EnhancedFormField
            label="Stage"
            name="stage"
            as="select"
            value={formData.stage}
            onChange={handleInputChange}
            error={errors.stage}
            options={stageOptions}
            disabled={isSubmitting}
            required
          />
        </TwoColumnGrid>

        <TwoColumnGrid className="mt-4">
          <EnhancedFormField
            label="Amount"
            name="amount"
            type="number"
            value={formData.amount}
            onChange={handleInputChange}
            error={errors.amount}
            placeholder="0.00"
            min={0}
            step="0.01"
            disabled={isSubmitting}
            required
          />

          <EnhancedFormField
            label="Close Date"
            name="close_date"
            type="date"
            value={formData.close_date}
            onChange={handleInputChange}
            error={errors.close_date}
            disabled={isSubmitting}
            required
          />
        </TwoColumnGrid>
      </EnhancedFormSection>

      {/* Account Information Section */}
      <EnhancedFormSection
        title="Account Information"
        subtitle="Associate deal with account and contact"
        alwaysExpanded={true}
        variant="card"
      >
        <SingleColumnGrid>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account <span className="text-red-500">*</span>
            </label>
            <AccountSelect
              initialSelection={selectedAccount}
              onChange={handleAccountChange}
              placeholder="Select an account..."
              disabled={isSubmitting}
              className=""
            />
            {errors.account && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.account}</p>
            )}
          </div>
        </SingleColumnGrid>
        
        <SingleColumnGrid className="mt-4">
          <div>
            <ContactSelect
              value={formData.primary_contact}
              onChange={(contactId) => handleInputChange('primary_contact', contactId || undefined)}
              label="Primary Contact"
              accountFilter={formData.account && formData.account > 0 ? formData.account : undefined}
              placeholder={
                !formData.account || formData.account === 0 
                  ? "Select an account first..." 
                  : "Select primary contact..."
              }
              disabled={!formData.account || formData.account === 0 || isSubmitting}
            />
            {(!formData.account || formData.account === 0) && (
              <p className="mt-1 text-sm text-gray-500">
                Select an account to choose a contact
              </p>
            )}
          </div>
        </SingleColumnGrid>
      </EnhancedFormSection>

      {/* Deal Details Section */}
      <EnhancedFormSection
        title="Deal Details"
        subtitle="Ownership and additional information"
        alwaysExpanded={true}
        variant="card"
      >
        <SingleColumnGrid>
          <UserSelect
            value={selectedOwner}
            onChange={handleOwnerChange}
            label="Deal Owner *"
            requiredPermission="manage_opportunities"
            placeholder="Select deal owner..."
            error={errors.owner}
            permissionFilter="manage_opportunities"
            disabled={isSubmitting}
          />
        </SingleColumnGrid>
        
        <SingleColumnGrid className="mt-4">
          <EnhancedFormField
            label="Description"
            name="description"
            as="textarea"
            value={formData.description}
            onChange={handleInputChange}
            error={errors.description}
            placeholder="Enter deal description or notes..."
            disabled={isSubmitting}
            rows={3}
          />
        </SingleColumnGrid>
      </EnhancedFormSection>

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