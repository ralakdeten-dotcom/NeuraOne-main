import React from 'react'
import { InlineEditableField, InlineEditableLink } from '@/shared/components'

interface ContactOverviewTabProps {
  data: any
  onFieldUpdate: (field: string, value: any) => Promise<void>
  validateEmail?: (email: string) => boolean | string
  validatePhone?: (phone: string) => boolean | string
  layout?: 'horizontal' | 'vertical'
  onAccountClick?: (accountId: number) => void
}

export const ContactOverviewTab: React.FC<ContactOverviewTabProps> = ({
  data,
  onFieldUpdate,
  validateEmail,
  validatePhone,
  layout = 'horizontal',
  onAccountClick
}) => {
  const isVertical = layout === 'vertical'

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
        {/* Contact Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact Information</h3>
          <div className={isVertical ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2" : "space-y-3"}>
            {/* First row: First Name and Last Name */}
            <InlineEditableField
              label="First Name"
              value={data.first_name}
              onSave={(value: string) => onFieldUpdate('first_name', value)}
              required
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            <InlineEditableField
              label="Last Name"
              value={data.last_name}
              onSave={(value: string) => onFieldUpdate('last_name', value)}
              required
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            {/* Second row: Phone and Email */}
            <InlineEditableLink
              label="Phone"
              value={data.phone}
              href={`tel:${data.phone}`}
              type="tel"
              onSave={(value: string) => onFieldUpdate('phone', value)}
              validator={validatePhone}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            <InlineEditableLink
              label="Email"
              value={data.email}
              href={`mailto:${data.email}`}
              type="email"
              onSave={(value: string) => onFieldUpdate('email', value)}
              validator={validateEmail}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            {/* Third row: Title and Account */}
            <InlineEditableField
              label="Title"
              value={data.title}
              onSave={(value: string) => onFieldUpdate('title', value)}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            {/* Account field for contacts */}
            <div className={isVertical ? "inline-field-horizontal" : ""}>
              <label className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${isVertical ? "min-w-24" : ""}`}>Account</label>
              <div className="flex-1">
                {data.account && onAccountClick ? (
                  <button
                    onClick={() => onAccountClick(data.account)}
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline transition-colors"
                  >
                    {data.account_name || 'View Account'}
                  </button>
                ) : (
                  <p className="text-gray-900 dark:text-white">{data.account_name || 'No account'}</p>
                )}
              </div>
            </div>
            
            {/* Contact Owner */}
            <div className={isVertical ? "inline-field-horizontal" : ""}>
              <label className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${isVertical ? "min-w-24" : ""}`}>Contact Owner</label>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white">{data.owner_name || 'Not assigned'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div className={isVertical ? "mb-8 mt-6" : "mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"}>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address Information</h3>
          <div className="space-y-2">
            <InlineEditableField
              label="Address Line"
              value={data.mailing_street}
              onSave={(value: string) => onFieldUpdate('mailing_street', value)}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            <div className={isVertical ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
              <InlineEditableField
                label="City"
                value={data.mailing_city}
                onSave={(value: string) => onFieldUpdate('mailing_city', value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
              <InlineEditableField
                label="State/Province"
                value={data.mailing_state_province}
                onSave={(value: string) => onFieldUpdate('mailing_state_province', value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
              <InlineEditableField
                label="Postal Code"
                value={data.postal_code}
                onSave={(value: string) => onFieldUpdate('postal_code', value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
              <InlineEditableField
                label="Country"
                value={data.mailing_country}
                onSave={(value: string) => onFieldUpdate('mailing_country', value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            </div>  
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className={isVertical ? "mb-8 mt-6" : "mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
        <InlineEditableField
          label="Description"
          value={data.description}
          type="textarea"
          onSave={(value: string) => onFieldUpdate('description', value)}
          className={isVertical ? "inline-field-horizontal" : ""}
        />
      </div>
    </div>
  )
}