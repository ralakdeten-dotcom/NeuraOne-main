import React, { useState } from 'react';
import { Info, Upload, Globe } from 'lucide-react';

interface OtherDetailsProps {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
}

export const OtherDetails: React.FC<OtherDetailsProps> = ({ formData, handleInputChange }) => {
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  // Custom icons for modern social media platforms
  const XIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  );

  const SkypeIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.069 18.874c-4.023 0-5.82-1.979-5.82-3.464 0-.765.561-1.296 1.333-1.296 1.723 0 1.273 2.477 4.487 2.477 1.641 0 2.55-.895 2.55-1.811 0-.551-.269-1.16-1.354-1.428l-3.576-.895c-2.88-.724-3.403-2.286-3.403-3.751 0-3.047 2.861-4.191 5.549-4.191 2.471 0 5.393 1.373 5.393 3.199 0 .784-.603 1.22-1.408 1.22-1.505 0-1.228-2.035-4.233-2.035-1.483 0-2.273.734-2.273 1.615 0 .724.782 1.122 1.644 1.354l2.893.786c2.861.765 3.464 2.492 3.464 3.998 0 2.648-2.017 4.221-5.246 4.221z"/>
      <path d="M24 12.073c0 5.989-4.394 10.954-10.13 11.855-.298-.146-.94-.303-.94-.303s.537-.146.895-.303c.179-.078.357-.169.528-.303.298-.236.561-.502.784-.808.223-.298.418-.627.575-.978.146-.357.268-.734.357-1.122.078-.384.134-.784.146-1.199V17.96c-.012-.415-.068-.815-.146-1.199a7.001 7.001 0 0 0-.357-1.122 6.05 6.05 0 0 0-.575-.978 5.082 5.082 0 0 0-.784-.808c-.171-.134-.35-.225-.528-.303-.358-.157-.895-.303-.895-.303s.642-.157.94-.303C19.606 23.027 24 18.062 24 12.073z"/>
      <path d="M12.069 5.126c4.023 0 5.82 1.979 5.82 3.464 0 .765-.561 1.296-1.333 1.296-1.723 0-1.273-2.477-4.487-2.477-1.641 0-2.55.895-2.55 1.811 0 .551.269 1.16 1.354 1.428l3.576.895c2.88.724 3.403 2.286 3.403 3.751 0 3.047-2.861 4.191-5.549 4.191-2.471 0-5.393-1.373-5.393-3.199 0-.784.603-1.22 1.408-1.22 1.505 0 1.228 2.035 4.233 2.035 1.483 0 2.273-.734 2.273-1.615 0-.724-.782-1.122-1.644-1.354l-2.893-.786c-2.861-.765-3.464-2.492-3.464-3.998 0-2.648 2.017-4.221 5.246-4.221z"/>
    </svg>
  );

  const FacebookIcon = () => (
    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>
    </svg>
  );
  
  return (
    <div className="space-y-6">
      {/* VAT Treatment */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <div className="flex items-center space-x-1">
          <label className="text-sm font-medium text-red-500">
            VAT Treatment
          </label>
          <span className="text-red-500">*</span>
        </div>
        <div className="w-[70%]">
          <select
            value={formData.vatTreatment || ''}
            onChange={(e) => handleInputChange('vatTreatment', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select VAT Treatment</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="VAT Exempt">VAT Exempt</option>
            <option value="Out of Scope">Out of Scope</option>
          </select>
        </div>
      </div>

      {/* VAT Registration Number */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          VAT Registration Number
        </label>
        <div className="flex gap-4 w-[70%]">
          <div className="w-32">
            <select
              value={formData.vatCountryCode || 'GB'}
              onChange={(e) => handleInputChange('vatCountryCode', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="GB">GB (United Kingdom)</option>
              <option value="US">US (United States)</option>
              <option value="DE">DE (Germany)</option>
              <option value="FR">FR (France)</option>
            </select>
          </div>
          <div className="flex-1">
            <input
              type="text"
              value={formData.vatRegistrationNumber || ''}
              onChange={(e) => handleInputChange('vatRegistrationNumber', e.target.value)}
              placeholder="Number"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Company Registration Number */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <div className="flex items-center space-x-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Company Registration Number
          </label>
          <Info className="w-4 h-4 text-gray-400" />
        </div>
        <div className="w-[70%]">
          <input
            type="text"
            value={formData.companyRegistrationNumber || ''}
            onChange={(e) => handleInputChange('companyRegistrationNumber', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Currency */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Currency
        </label>
        <div className="w-[70%]">
          <select
            value={formData.currency || 'GBP'}
            onChange={(e) => handleInputChange('currency', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="GBP">GBP- Pound Sterling</option>
            <option value="USD">USD- US Dollar</option>
            <option value="EUR">EUR- Euro</option>
            <option value="INR">INR- Indian Rupee</option>
          </select>
        </div>
      </div>

      {/* Accounts Receivable */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <div className="flex items-center space-x-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Accounts Receivable
          </label>
          <Info className="w-4 h-4 text-gray-400" />
        </div>
        <div className="w-[70%]">
          <select
            value={formData.accountsReceivable || ''}
            onChange={(e) => handleInputChange('accountsReceivable', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select an account</option>
            <option value="1200">1200 - Accounts Receivable</option>
            <option value="1210">1210 - Trade Debtors</option>
          </select>
        </div>
      </div>

      {/* Opening Balance */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Opening Balance
        </label>
        <div className="w-[70%]">
          <div className="flex">
            <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-l-md">
              GBP
            </span>
            <input
              type="number"
              step="0.01"
              value={formData.openingBalance || ''}
              onChange={(e) => handleInputChange('openingBalance', e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </div>

      {/* Payment Terms */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Payment Terms
        </label>
        <div className="w-[70%]">
          <select
            value={formData.paymentTerms || ''}
            onChange={(e) => handleInputChange('paymentTerms', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Payment Terms</option>
            <option value="Due on Receipt">Due on Receipt</option>
            <option value="Net 15">Net 15</option>
            <option value="Net 30">Net 30</option>
            <option value="Net 60">Net 60</option>
            <option value="Net 90">Net 90</option>
          </select>
        </div>
      </div>

      {/* Price List */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Price List
        </label>
        <div className="w-[70%]">
          <select
            value={formData.priceList || ''}
            onChange={(e) => handleInputChange('priceList', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Price List</option>
            <option value="Standard">Standard</option>
            <option value="Wholesale">Wholesale</option>
            <option value="Retail">Retail</option>
          </select>
        </div>
      </div>

      {/* Direct Debit Payment */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Direct Debit Payment
        </label>
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.allowDirectDebit || false}
            onChange={(e) => handleInputChange('allowDirectDebit', e.target.checked)}
            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
          />
          <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            Allow this customer to pay via Direct Debit.
          </label>
        </div>
      </div>

      {/* Enable Portal */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-start">
        <div className="flex items-center space-x-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Enable Portal?
          </label>
          <Info className="w-4 h-4 text-gray-400" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.enablePortal || false}
              onChange={(e) => handleInputChange('enablePortal', e.target.checked)}
              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
            />
            <label className="ml-2 text-sm text-gray-700 dark:text-gray-300">
              Allow portal access for this customer
            </label>
          </div>
        </div>
      </div>

      {/* Portal Language */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <div className="flex items-center space-x-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Portal Language
          </label>
          <Info className="w-4 h-4 text-gray-400" />
        </div>
        <div className="w-[70%]">
          <select
            value={formData.portalLanguage || ''}
            onChange={(e) => handleInputChange('portalLanguage', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select Language</option>
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
          </select>
        </div>
      </div>

      {/* Documents */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-start">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Documents
        </label>
        <div className="w-[70%]">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload File
          </button>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            You can upload a maximum of 10 files, 10MB each
          </p>
        </div>
      </div>

      {/* Add more details link */}
      <div className="pt-4">
        <button
          type="button"
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
        >
          {showMoreDetails ? 'Hide additional details' : 'Add more details'}
        </button>
      </div>

      {/* Additional Details Section */}
      {showMoreDetails && (
        <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          {/* Website URL */}
          <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Website URL
            </label>
            <div className="w-[70%]">
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-l-md">
                  <Globe className="w-4 h-4" />
                </span>
                <input
                  type="url"
                  value={formData.websiteUrl || ''}
                  onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                  placeholder="ex: www.zyiker.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Department */}
          <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Department
            </label>
            <div className="w-[70%]">
              <input
                type="text"
                value={formData.department || ''}
                onChange={(e) => handleInputChange('department', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Designation */}
          <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Designation
            </label>
            <div className="w-[70%]">
              <input
                type="text"
                value={formData.designation || ''}
                onChange={(e) => handleInputChange('designation', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* X (Twitter) */}
          <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              X
            </label>
            <div className="w-[70%]">
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-l-md">
                  <XIcon />
                </span>
                <input
                  type="url"
                  value={formData.twitterUrl || ''}
                  onChange={(e) => handleInputChange('twitterUrl', e.target.value)}
                  placeholder="https://x.com/"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Skype Name/Number */}
          <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Skype Name/Number
            </label>
            <div className="w-[70%]">
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-l-md">
                  <SkypeIcon />
                </span>
                <input
                  type="text"
                  value={formData.skypeId || ''}
                  onChange={(e) => handleInputChange('skypeId', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Facebook */}
          <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Facebook
            </label>
            <div className="w-[70%]">
              <div className="flex">
                <span className="inline-flex items-center px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-600 text-gray-500 dark:text-gray-400 text-sm rounded-l-md">
                  <FacebookIcon />
                </span>
                <input
                  type="url"
                  value={formData.facebookUrl || ''}
                  onChange={(e) => handleInputChange('facebookUrl', e.target.value)}
                  placeholder="http://www.facebook.com/"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Customer Owner */}
          <div className="grid grid-cols-[200px,1fr] gap-4 items-start">
            <label className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Customer Owner:
            </label>
            <div className="w-[70%]">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Assign a user as the customer owner to provide access only to the data of this customer.{' '}
                <a href="#" className="text-blue-600 dark:text-blue-400 hover:underline">
                  Learn More
                </a>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};