import React, { useState, useEffect } from 'react'
import { Lead } from '../api'
import { AccountSelect, type AccountSelectOption } from '@/shared/components/selectors/AccountSelect'
import { UserSelect } from '@/shared/components/selectors/UserSelect'
import { EssentialInfoSection, RelationshipsSection, AddressSection } from '@/shared/components/forms/FormSection'
import { FormField, Button } from '@/shared/components'
import { useEligibleLeadOwners } from '@/api/tenant'

interface ConversionData {
  account_data: {
    company_name: string
    industry?: string
    website?: string
    phone?: string
    number_of_employees?: number
    description?: string
    // Address
    country?: string
    street?: string
    city?: string
    state_province?: string
    zip_postal_code?: string
    owner?: number
  }
  contact_data: {
    first_name: string
    last_name: string
    title?: string
    email?: string
    phone?: string
    description?: string
    // Mailing Address
    mailing_street?: string
    mailing_city?: string
    mailing_state_province?: string
    mailing_country?: string
    postal_code?: string
    owner?: number
  }
  create_deal: boolean
  deal_data?: {
    deal_name?: string
    stage?: string
    amount?: number
    close_date?: string
    description?: string
    owner?: number
  }
}

interface LeadConversionModalProps {
  lead: Lead
  companyName?: string
  isOpen: boolean
  onClose: () => void
  onConvert: (data: ConversionData) => Promise<void>
  isConverting: boolean
}

const DEAL_STAGES = [
  'Prospecting',
  'Qualification', 
  'Proposal',
  'Negotiation',
  'Closed Won',
  'Closed Lost'
]

export const LeadConversionModal: React.FC<LeadConversionModalProps> = ({
  lead,
  companyName,
  isOpen,
  onClose,
  onConvert,
  isConverting
}) => {
  const [conversionData, setConversionData] = useState<ConversionData>({
    account_data: {
      company_name: '',
      industry: '',
      website: '',
      phone: '',
      number_of_employees: undefined,
      description: '',
      country: '',
      street: '',
      city: '',
      state_province: '',
      zip_postal_code: '',
      owner: undefined
    },
    contact_data: {
      first_name: '',
      last_name: '',
      title: '',
      email: '',
      phone: '',
      description: '',
      mailing_street: '',
      mailing_city: '',
      mailing_state_province: '',
      mailing_country: '',
      postal_code: '',
      owner: undefined
    },
    create_deal: true,
    deal_data: {
      deal_name: '',
      stage: 'Prospecting',
      amount: undefined,
      close_date: '',
      description: '',
      owner: undefined
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const { data: ownersData } = useEligibleLeadOwners()

  // Set default owners to current user
  useEffect(() => {
    if (isOpen && ownersData?.users) {
      const currentUser = ownersData.users.find(user => user.is_current_user)
      if (currentUser) {
        setConversionData(prev => ({
          ...prev,
          account_data: { ...prev.account_data, owner: currentUser.id },
          contact_data: { ...prev.contact_data, owner: currentUser.id },
          deal_data: prev.deal_data ? { ...prev.deal_data, owner: currentUser.id } : undefined
        }))
      }
    }
  }, [isOpen, ownersData])

  // Pre-fill form data when modal opens
  useEffect(() => {
    if (isOpen && lead) {
      const defaultCloseDate = new Date()
      defaultCloseDate.setMonth(defaultCloseDate.getMonth() + 3)
      
      setConversionData(prev => ({
        account_data: {
          ...prev.account_data,
          company_name: companyName || lead.company_name || `${lead.first_name} ${lead.last_name} Company`,
          industry: lead.industry || '',
          website: lead.website || '',
          phone: lead.phone || '',
          number_of_employees: lead.number_of_employees || undefined,
          description: lead.description || '',
          street: lead.street || '',
          city: lead.city || '',
          state_province: lead.state || '',
          country: lead.country || '',
          zip_postal_code: lead.postal_code || ''
        },
        contact_data: {
          ...prev.contact_data,
          first_name: lead.first_name,
          last_name: lead.last_name,
          title: lead.title || '',
          email: lead.email || undefined,
          phone: lead.phone || '',
          description: lead.description || '',
          mailing_street: lead.street || '',
          mailing_city: lead.city || '',
          mailing_state_province: lead.state || '',
          mailing_country: lead.country || '',
          postal_code: lead.postal_code || ''
        },
        create_deal: true,
        deal_data: {
          deal_name: `Deal for ${lead.first_name} ${lead.last_name}`,
          stage: 'Prospecting',
          amount: undefined,
          close_date: defaultCloseDate.toISOString().split('T')[0],
          description: lead.description || '',
          owner: prev.deal_data?.owner
        }
      }))
      setErrors({})
    }
  }, [isOpen, lead, companyName, lead?.company_name, lead?.industry, lead?.website, lead?.phone, lead?.number_of_employees, lead?.description, lead?.street, lead?.city, lead?.state, lead?.country, lead?.postal_code])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    // Account validation
    if (!conversionData.account_data.company_name.trim()) {
      newErrors.company_name = 'Company name is required'
    }

    // Contact validation
    if (!conversionData.contact_data.first_name.trim()) {
      newErrors.first_name = 'First name is required'
    }
    if (!conversionData.contact_data.last_name.trim()) {
      newErrors.last_name = 'Last name is required'
    }

    // Deal validation (if creating deal)
    if (conversionData.create_deal && conversionData.deal_data) {
      if (!conversionData.deal_data.deal_name?.trim()) {
        newErrors.deal_name = 'Deal name is required'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    // Clean the data - remove empty strings from contact_data
    const cleanedContactData: any = {}
    Object.entries(conversionData.contact_data).forEach(([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        cleanedContactData[key] = value
      }
    })
    
    const cleanedData: ConversionData = {
      ...conversionData,
      contact_data: cleanedContactData
    }

    try {
      await onConvert(cleanedData)
    } catch (error) {
      console.error('Conversion error:', error)
    }
  }

  const updateAccountData = (field: string, value: any) => {
    setConversionData(prev => ({
      ...prev,
      account_data: {
        ...prev.account_data,
        [field]: value
      }
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const updateContactData = (field: string, value: any) => {
    setConversionData(prev => ({
      ...prev,
      contact_data: {
        ...prev.contact_data,
        [field]: value
      }
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const updateDealData = (field: string, value: any) => {
    setConversionData(prev => ({
      ...prev,
      deal_data: {
        ...prev.deal_data!,
        [field]: value
      }
    }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleAccountOwnerChange = (userId: number) => {
    updateAccountData('owner', userId)
  }

  const handleContactOwnerChange = (userId: number) => {
    updateContactData('owner', userId)
  }

  const handleDealOwnerChange = (userId: number) => {
    updateDealData('owner', userId)
  }

  const handleAccountNameChange = (option: AccountSelectOption) => {
    updateAccountData('company_name', option.accountName)
    // Note: For lead conversion, we only store the company name as it will create a new account
    // The accountId is not used in conversion since we're creating new accounts
  }

  const toggleCreateDeal = () => {
    setConversionData(prev => ({
      ...prev,
      create_deal: !prev.create_deal
    }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Convert Lead: {lead.first_name} {lead.last_name}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Review and edit the information before converting this lead to a customer
            </p>
          </div>

          <div className="px-6 py-6 space-y-8">
            {/* Account Information */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Account Information</h3>
                <span className="ml-2 text-sm text-red-500">*Required</span>
              </div>
              
              <EssentialInfoSection>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Company Name *
                    </label>
                    <AccountSelect
                      key={lead?.lead_id || 'new'}
                      initialSelection={
                        conversionData.account_data.company_name
                          ? { 
                              accountId: lead?.account || null, 
                              accountName: conversionData.account_data.company_name 
                            }
                          : undefined
                      }
                      onChange={handleAccountNameChange}
                      placeholder="Search existing companies or type new name... (required)"
                      className="w-full"
                      leadMode={true}
                    />
                    {errors.company_name && (
                      <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>
                    )}
                  </div>

                  <UserSelect
                    value={conversionData.account_data.owner}
                    onChange={handleAccountOwnerChange}
                    label="Account Owner *"
                    placeholder="Select account owner..."
                    error={errors.account_owner}
                    permissionFilter="manage_accounts"
                  />

                  <FormField
                    label="Industry"
                    name="industry"
                    value={conversionData.account_data.industry}
                    onChange={updateAccountData}
                    placeholder="e.g., Technology, Healthcare"
                  />

                  <FormField
                    label="Website"
                    name="website"
                    type="url"
                    value={conversionData.account_data.website}
                    onChange={updateAccountData}
                    placeholder="https://company.com"
                  />

                  <FormField
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={conversionData.account_data.phone}
                    onChange={updateAccountData}
                    placeholder="(555) 123-4567"
                  />

                  <FormField
                    label="Number of Employees"
                    name="number_of_employees"
                    type="number"
                    value={conversionData.account_data.number_of_employees}
                    onChange={updateAccountData}
                    placeholder="e.g., 100"
                    min={1}
                  />
                </div>

                <div className="mt-6">
                  <FormField
                    label="Description"
                    name="description"
                    as="textarea"
                    value={conversionData.account_data.description}
                    onChange={updateAccountData}
                    placeholder="Enter account description..."
                    rows={4}
                  />
                </div>
              </EssentialInfoSection>

              {/* Address */}
              <AddressSection>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      label="Street Address"
                      name="street"
                      value={conversionData.account_data.street}
                      onChange={updateAccountData}
                      placeholder="Enter street address"
                    />
                  </div>

                  <FormField
                    label="City"
                    name="city"
                    value={conversionData.account_data.city}
                    onChange={updateAccountData}
                    placeholder="Enter city"
                  />

                  <FormField
                    label="State/Province"
                    name="state_province"
                    value={conversionData.account_data.state_province}
                    onChange={updateAccountData}
                    placeholder="Enter state/province"
                  />

                  <FormField
                    label="Country"
                    name="country"
                    value={conversionData.account_data.country}
                    onChange={updateAccountData}
                    placeholder="Enter country"
                  />

                  <FormField
                    label="ZIP/Postal Code"
                    name="zip_postal_code"
                    value={conversionData.account_data.zip_postal_code}
                    onChange={updateAccountData}
                    placeholder="Enter ZIP/postal code"
                  />
                </div>
              </AddressSection>
            </section>

            {/* Contact Information */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Contact Information</h3>
                <span className="ml-2 text-sm text-red-500">*Required</span>
              </div>
              
              <EssentialInfoSection>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    label="First Name"
                    name="first_name"
                    value={conversionData.contact_data.first_name}
                    onChange={updateContactData}
                    error={errors.first_name}
                    placeholder="Enter first name"
                    required
                  />

                  <FormField
                    label="Last Name"
                    name="last_name"
                    value={conversionData.contact_data.last_name}
                    onChange={updateContactData}
                    error={errors.last_name}
                    placeholder="Enter last name"
                    required
                  />

                  <FormField
                    label="Email"
                    name="email"
                    type="email"
                    value={conversionData.contact_data.email}
                    onChange={updateContactData}
                    placeholder="email@company.com"
                  />

                  <FormField
                    label="Phone"
                    name="phone"
                    type="tel"
                    value={conversionData.contact_data.phone}
                    onChange={updateContactData}
                    placeholder="(555) 123-4567"
                  />

                  <div className="md:col-span-2">
                    <FormField
                      label="Job Title"
                      name="title"
                      value={conversionData.contact_data.title}
                      onChange={updateContactData}
                      placeholder="e.g., CEO, CTO, Manager"
                    />
                  </div>
                </div>
              </EssentialInfoSection>

              {/* Contact Relationships */}
              <RelationshipsSection>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <UserSelect
                      value={conversionData.contact_data.owner}
                      onChange={handleContactOwnerChange}
                      placeholder="Select contact owner..."
                      label="Contact Owner *"
                      className="w-full"
                      permissionFilter="manage_contacts"
                    />
                  </div>
                </div>
              </RelationshipsSection>

              {/* Contact Address & Details */}
              <AddressSection>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <FormField
                      label="Street Address"
                      name="mailing_street"
                      value={conversionData.contact_data.mailing_street}
                      onChange={updateContactData}
                      placeholder="Enter street address"
                    />
                  </div>

                  <FormField
                    label="City"
                    name="mailing_city"
                    value={conversionData.contact_data.mailing_city}
                    onChange={updateContactData}
                    placeholder="Enter city"
                  />

                  <FormField
                    label="State/Province"
                    name="mailing_state_province"
                    value={conversionData.contact_data.mailing_state_province}
                    onChange={updateContactData}
                    placeholder="Enter state/province"
                  />

                  <FormField
                    label="Country"
                    name="mailing_country"
                    value={conversionData.contact_data.mailing_country}
                    onChange={updateContactData}
                    placeholder="Enter country"
                  />

                  <FormField
                    label="ZIP/Postal Code"
                    name="postal_code"
                    value={conversionData.contact_data.postal_code}
                    onChange={updateContactData}
                    placeholder="Enter ZIP/postal code"
                  />

                  <div className="md:col-span-2">
                    <FormField
                      label="Description"
                      name="description"
                      as="textarea"
                      value={conversionData.contact_data.description}
                      onChange={updateContactData}
                      placeholder="Enter contact description or notes..."
                      rows={4}
                    />
                  </div>
                </div>
              </AddressSection>
            </section>

            {/* Deal Information (Optional) */}
            <section>
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="create_deal"
                    checked={conversionData.create_deal}
                    onChange={toggleCreateDeal}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="create_deal" className="text-lg font-medium text-gray-900 dark:text-white">
                    Also create Deal
                  </label>
                  <span className="text-sm text-gray-500 dark:text-gray-400">Optional</span>
                </div>
              </div>

              {conversionData.create_deal && (
                <div className="pl-11">
                  <EssentialInfoSection>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        label="Deal Name"
                        name="deal_name"
                        value={conversionData.deal_data?.deal_name || ''}
                        onChange={updateDealData}
                        error={errors.deal_name}
                        placeholder="Deal name"
                        required
                      />

                      <UserSelect
                        value={conversionData.deal_data?.owner}
                        onChange={handleDealOwnerChange}
                        label="Deal Owner *"
                        placeholder="Select deal owner..."
                        error={errors.deal_owner}
                        permissionFilter="manage_opportunities"
                      />

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Stage
                        </label>
                        <select
                          value={conversionData.deal_data?.stage || 'Prospecting'}
                          onChange={(e) => updateDealData('stage', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {DEAL_STAGES.map(stage => (
                            <option key={stage} value={stage}>{stage}</option>
                          ))}
                        </select>
                      </div>

                      <FormField
                        label="Amount"
                        name="amount"
                        type="number"
                        value={conversionData.deal_data?.amount}
                        onChange={updateDealData}
                        placeholder="e.g., 50000"
                        min={0}
                        step="0.01"
                      />

                      <FormField
                        label="Expected Close Date"
                        name="close_date"
                        type="date"
                        value={conversionData.deal_data?.close_date || ''}
                        onChange={updateDealData}
                      />

                      <div className="md:col-span-2">
                        <FormField
                          label="Description"
                          name="description"
                          as="textarea"
                          value={conversionData.deal_data?.description || ''}
                          onChange={updateDealData}
                          placeholder="Enter deal description..."
                          rows={4}
                        />
                      </div>
                    </div>
                  </EssentialInfoSection>
                </div>
              )}
            </section>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-end space-x-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isConverting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isConverting}
              loading={isConverting}
              size="lg"
            >
              Convert Lead
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}