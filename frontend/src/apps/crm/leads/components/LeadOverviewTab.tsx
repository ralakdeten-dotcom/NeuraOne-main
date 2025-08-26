import React from 'react'
import { InlineEditableField, InlineEditableLink } from '@/shared/components'

interface LeadOverviewTabProps {
  data: any
  onFieldUpdate: (field: string, value: any) => Promise<void>
  validateEmail?: (email: string) => boolean | string
  validatePhone?: (phone: string) => boolean | string
  layout?: 'horizontal' | 'vertical'
  onAccountClick?: (accountId: number) => void
}

export const LeadOverviewTab: React.FC<LeadOverviewTabProps> = ({
  data,
  onFieldUpdate,
  validateEmail,
  validatePhone,
  layout = 'horizontal',
  onAccountClick
}) => {
  const isVertical = layout === 'vertical'

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500'
    if (score >= 60) return 'bg-yellow-500'
    if (score >= 40) return 'bg-orange-500'
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
        {/* Lead Information */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lead Information</h3>
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
            
            {/* Third row: Title and Lead Owner */}
            <InlineEditableField
              label="Title"
              value={data.title}
              onSave={(value: string) => onFieldUpdate('title', value)}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            <div className={isVertical ? "inline-field-horizontal" : ""}>
              <label className={`text-sm font-medium text-gray-500 dark:text-gray-400 ${isVertical ? "min-w-24" : ""}`}>Lead Owner</label>
              <div className="flex-1">
                <p className="text-gray-900 dark:text-white">{data.lead_owner_name || 'Not assigned'}</p>
              </div>
            </div>
            
            {/* Fourth row: Lead Score */}
            <InlineEditableField
              label="Lead Score"
              value={data.score}
              type="number"
              onSave={(value: string) => onFieldUpdate('score', parseInt(value))}
              validator={(val: string): boolean | string => {
                const num = parseInt(val)
                if (isNaN(num)) return 'Must be a number'
                if (num < 0 || num > 100) return 'Must be between 0 and 100'
                return true
              }}
              renderValue={(val: any) => {
                const score = val || 0;
                const scoreColor = getScoreColor(score);
                
                return (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm">{score}/100</span>
                    <div className="w-32 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${scoreColor}`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                )
              }}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
          </div>
        </div>

        {/* Business Information */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Business Information</h3>
          <div className={isVertical ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2" : "space-y-3"}>
            {/* First row: Company Name and Industry */}
            <InlineEditableField
              label="Company Name"
              value={data.company_name}
              onSave={(value: string) => onFieldUpdate('company_name', value)}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            <InlineEditableField
              label="Industry"
              value={data.industry}
              onSave={(value: string) => onFieldUpdate('industry', value)}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            {/* Second row: Website and Number of Employees */}
            <InlineEditableLink
              label="Website"
              value={data.website}
              href={data.website ? `https://${data.website.replace(/^https?:\/\//, '')}` : ''}
              type="url"
              onSave={(value: string) => onFieldUpdate('website', value)}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            <InlineEditableField
              label="Number of Employees"
              value={data.number_of_employees}
              type="number"
              onSave={(value: string) => onFieldUpdate('number_of_employees', parseInt(value) || null)}
              formatter={(val) => val ? val.toLocaleString() : ''}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            
            {/* Third row: Average Revenue */}
            <InlineEditableField
              label="Average Revenue"
              value={data.average_revenue}
              type="number"
              onSave={(value: string) => onFieldUpdate('average_revenue', parseFloat(value) || null)}
              formatter={(val) => val ? `$${parseFloat(val).toLocaleString()}` : ''}
              className={isVertical ? "inline-field-horizontal span-full" : ""}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Address Information</h3>
          <div className="space-y-2">
            <InlineEditableField
              label="Address Line"
              value={data.street}
              onSave={(value: string) => onFieldUpdate('street', value)}
              className={isVertical ? "inline-field-horizontal" : ""}
            />
            <div className={isVertical ? "grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
              <InlineEditableField
                label="City"
                value={data.city}
                onSave={(value: string) => onFieldUpdate('city', value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
              <InlineEditableField
                label="State/Province"
                value={data.state}
                onSave={(value: string) => onFieldUpdate('state', value)}
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
                value={data.country}
                onSave={(value: string) => onFieldUpdate('country', value)}
                className={isVertical ? "inline-field-horizontal" : ""}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="mt-8">
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