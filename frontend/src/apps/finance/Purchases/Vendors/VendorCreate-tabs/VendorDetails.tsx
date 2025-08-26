import React from 'react';
import { Info, Upload } from 'lucide-react';

interface VendorDetailsProps {
  formData: any;
  handleInputChange: (field: string, value: string | boolean) => void;
}

export const VendorDetails: React.FC<VendorDetailsProps> = ({ formData, handleInputChange }) => {
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

      {/* Accounts Payable */}
      <div className="grid grid-cols-[200px,1fr] gap-4 items-center">
        <div className="flex items-center space-x-1">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Accounts Payable
          </label>
          <Info className="w-4 h-4 text-gray-400" />
        </div>
        <div className="w-[70%]">
          <select
            value={formData.accountsPayable || ''}
            onChange={(e) => handleInputChange('accountsPayable', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select an account</option>
            <option value="2000">2000 - Accounts Payable</option>
            <option value="2010">2010 - Trade Creditors</option>
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
          Payment Terms to Vendor
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
            Allow this vendor to receive payments via Direct Debit.
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
              Allow portal access for this vendor
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
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
            <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </button>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              You can upload a maximum of 10 files, 10MB each
            </p>
          </div>
        </div>
      </div>

      {/* Add more details link */}
      <div className="pt-4">
        <button
          type="button"
          className="text-blue-600 dark:text-blue-400 text-sm hover:underline"
        >
          Add more details
        </button>
      </div>
    </div>
  );
};