import React from 'react'
import { InlineEditableField, InlineEditableLink } from '@/shared/components'

interface OverviewTabProps {
  data: any
  onFieldUpdate: (field: string, value: any) => Promise<void>
  validateEmail?: (email: string) => boolean | string
  validatePhone?: (phone: string) => boolean | string
  layout?: 'horizontal' | 'vertical'
  onAccountClick?: (accountId: number) => void
  fields?: {
    contact?: {
      firstName?: string
      lastName?: string
      email?: string
      phone?: string
      title?: string
      company?: string
      owner?: string
      score?: string
      account?: string
      accountId?: string
    }
    account?: {
      company?: string
      owner?: string
      source?: string
      industry?: string
      website?: string
      employees?: string
      revenue?: string
      score?: string
    }
    business?: {
      status?: string
      source?: string
      industry?: string
      website?: string
      employees?: string
      revenue?: string
      score?: string
    }
    accountInfo?: {
      company?: string
      phone?: string
      owner?: string
      industry?: string
      website?: string
      employees?: string
      revenue?: string
    }
    address?: {
      street?: string
      city?: string
      state?: string
      postalCode?: string
      country?: string
    }
    description?: string
  }
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  data,
  onFieldUpdate,
  validateEmail,
  validatePhone,
  layout = 'horizontal',
  onAccountClick,
  fields = {}
}) => {
  const {
    contact = {},
    accountInfo = {},
    business = {},
    address = {},
    description = 'description'
  } = fields

  const isVertical = layout === 'vertical'

  // Get color for score based on range
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 30) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  return (
    <div>
      {isVertical && (
        <style>{`
          .inline-field-horizontal {
            display: flex !important;
            flex-direction: row !important;
            align-items: center !important;
            gap: 1rem !important;
          }
          .inline-field-horizontal > label {
            min-width: 6rem !important;
            flex-shrink: 0 !important;
            margin-bottom: 0 !important;
          }
          .inline-field-horizontal > div:last-child {
            flex: 1 !important;
          }
          .description-field-vertical > label {
            display: none !important;
          }
          .description-field-vertical > div:last-child {
            width: 100% !important;
          }
        `}</style>
      )}
      <div className={isVertical ? "space-y-8" : "grid grid-cols-1 md:grid-cols-2 gap-8"}>
        {/* Contact Information - only show if accountInfo is not being used */}
        {!accountInfo.company && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {contact.accountId ? 'Contact Information' : 'Lead Information'}
          </h3>
          <div className={isVertical ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2" : "space-y-3"}>
            {/* First row: First Name and Last Name */}
            {contact.firstName && (
              <InlineEditableField
                label="First Name"
                value={data[contact.firstName]}
                onSave={(value: string) => onFieldUpdate(contact.firstName!, value)}
                required
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {contact.lastName && (
              <InlineEditableField
                label="Last Name"
                value={data[contact.lastName]}
                onSave={(value: string) => onFieldUpdate(contact.lastName!, value)}
                required
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {/* Second row: Phone and Email */}
            {contact.phone && (
              <InlineEditableLink
                label="Phone"
                value={data[contact.phone]}
                href={`tel:${data[contact.phone]}`}
                type="tel"
                onSave={(value: string) => onFieldUpdate(contact.phone!, value)}
                validator={validatePhone}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {contact.email && (
              <InlineEditableLink
                label="Email"
                value={data[contact.email]}
                href={`mailto:${data[contact.email]}`}
                type="email"
                onSave={(value: string) => onFieldUpdate(contact.email!, value)}
                validator={validateEmail}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {/* Third row: Title and Account/Owner */}
            {contact.title && (
              <InlineEditableField
                label="Title"
                value={data[contact.title]}
                onSave={(value: string) => onFieldUpdate(contact.title!, value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {/* Show Account field for contacts only */}
            {contact.company && contact.accountId && (
              <div className={isVertical ? "inline-field-horizontal" : ""}>
                <label className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${isVertical ? "min-w-24" : ""}`}>Account</label>
                <div className="flex-1">
                  {data[contact.accountId] && onAccountClick ? (
                    <button
                      onClick={() => onAccountClick(data[contact.accountId])}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                    >
                      {data[contact.company] || 'View Account'}
                    </button>
                  ) : (
                    <p className="text-gray-900 dark:text-white">{data[contact.company] || 'No account'}</p>
                  )}
                </div>
              </div>
            )}
            
            {contact.owner && (
              <div className={isVertical ? "inline-field-horizontal" : ""}>
                <label className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${isVertical ? "min-w-24" : ""}`}>
                  {contact.accountId ? 'Contact Owner' : 'Lead Owner'}
                </label>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white">{data[contact.owner] || 'Not assigned'}</p>
                </div>
              </div>
            )}
            
            {/* Fifth row: Lead Score (if applicable) */}
            {contact.score && (
              <InlineEditableField
                label="Lead Score"
                value={data[contact.score]}
                type="number"
                onSave={(value: string) => onFieldUpdate(contact.score!, parseInt(value))}
                validator={(val: string): boolean | string => {
                  const num = parseInt(val)
                  if (isNaN(num)) return 'Must be a number'
                  if (num < 0 || num > 100) return 'Must be between 0 and 100'
                  return true
                }}
                renderValue={(val: any) => (
                  <div className="flex items-center space-x-2">
                    <span>{val || 0}/100</span>
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${getScoreColor(val || 0)}`}
                        style={{ width: `${val || 0}%` }}
                      />
                    </div>
                  </div>
                )}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
          </div>
        </div>
        )}


      </div>

      {/* Account Information (merged contact + business fields for accounts) */}
      {(accountInfo.company || accountInfo.phone || accountInfo.owner || accountInfo.industry || accountInfo.website || accountInfo.employees || accountInfo.revenue) && (
        <div className={isVertical ? "mb-8" : "mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h3>
          <div className={isVertical ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2" : "space-y-3"}>
            {/* First row: Account Name and Industry */}
            {accountInfo.company && (
              <InlineEditableField
                label="Account Name"
                value={data[accountInfo.company]}
                onSave={(value: string) => onFieldUpdate(accountInfo.company!, value)}
                required
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {accountInfo.industry && (
              <InlineEditableField
                label="Industry"
                value={data[accountInfo.industry]}
                onSave={(value: string) => onFieldUpdate(accountInfo.industry!, value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {/* Second row: Phone and Website */}
            {accountInfo.phone && (
              <InlineEditableLink
                label="Phone"
                value={data[accountInfo.phone]}
                href={`tel:${data[accountInfo.phone]}`}
                type="tel"
                onSave={(value: string) => onFieldUpdate(accountInfo.phone!, value)}
                validator={validatePhone}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {accountInfo.website && (
              <InlineEditableLink
                label="Website"
                value={data[accountInfo.website]}
                type="url"
                onSave={(value: string) => onFieldUpdate(accountInfo.website!, value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {/* Third row: Employees and Revenue */}
            {accountInfo.employees && (
              <InlineEditableField
                label="Employees"
                value={data[accountInfo.employees]}
                type="number"
                onSave={(value: string) => onFieldUpdate(accountInfo.employees!, parseInt(value))}
                formatter={(val) => val ? val.toLocaleString() : ''}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {accountInfo.revenue && (
              <InlineEditableField
                label="Revenue"
                value={data[accountInfo.revenue]}
                type="number"
                onSave={(value: string) => onFieldUpdate(accountInfo.revenue!, parseFloat(value))}
                formatter={(val) => val ? `$${val.toLocaleString()}` : ''}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            
            {/* Fourth row: Account Owner (full width) */}
            {accountInfo.owner && (
              <div className={isVertical ? "md:col-span-2 flex items-center space-x-4" : ""}>
                <label className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${isVertical ? "min-w-24" : ""}`}>Account Owner</label>
                <p className="text-gray-900 dark:text-white">{data[accountInfo.owner] || 'Not assigned'}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Address Information */}
      {(address.street || address.city || address.state || address.postalCode || address.country) && (
        <div className={isVertical ? "mb-8 mt-6" : "mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address Information</h3>
          <div className="space-y-2">
            {address.street && (
              <InlineEditableField
                label="Address Line"
                value={data[address.street]}
                onSave={(value: string) => onFieldUpdate(address.street!, value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            )}
            <div className={isVertical ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
              {address.city && (
                <InlineEditableField
                  label="City"
                  value={data[address.city]}
                  onSave={(value: string) => onFieldUpdate(address.city!, value)}
                  className={isVertical ? "inline-field-horizontal" : ""}
                />
              )}
              {address.state && (
                <InlineEditableField
                  label="State/Province"
                  value={data[address.state]}
                  onSave={(value: string) => onFieldUpdate(address.state!, value)}
                  className={isVertical ? "inline-field-horizontal" : ""}
                />
              )}
              {address.postalCode && (
                <InlineEditableField
                  label="Postal Code"
                  value={data[address.postalCode]}
                  onSave={(value: string) => onFieldUpdate(address.postalCode!, value)}
                  className={isVertical ? "inline-field-horizontal" : ""}
                />
              )}
              {address.country && (
                <InlineEditableField
                  label="Country"
                  value={data[address.country]}
                  onSave={(value: string) => onFieldUpdate(address.country!, value)}
                  className={isVertical ? "inline-field-horizontal" : ""}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Additional Information */}
      {description && (
        <div className={isVertical ? "mb-8" : "mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
          <InlineEditableField
            label="Description"
            value={data[description]}
            type="textarea"
            onSave={(value: string) => onFieldUpdate(description, value)}
            className={isVertical ? "inline-field-horizontal" : ""}
          />
        </div>
      )}

    </div>
  )
}