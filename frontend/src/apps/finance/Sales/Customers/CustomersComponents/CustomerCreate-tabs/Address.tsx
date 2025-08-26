import React from 'react';
import { Copy } from 'lucide-react';

interface AddressProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
}

export const Address: React.FC<AddressProps> = ({ formData, handleInputChange }) => {
  
  const copyBillingToShipping = () => {
    // Copy all billing address fields to shipping address fields
    const billingFields = [
      'billingAttention',
      'billingCountryRegion', 
      'billingAddress',
      'billingAddress2',
      'billingCity',
      'billingStateCounty',
      'billingPostalCode',
      'billingPhone',
      'billingFax'
    ];
    
    billingFields.forEach(field => {
      const shippingField = field.replace('billing', 'shipping');
      const billingValue = formData[field] || '';
      handleInputChange(shippingField, billingValue);
    });
  };

  return (
    <div className="space-y-8">
      {/* Two Column Layout for Billing and Shipping */}
      <div className="grid grid-cols-2 gap-8">
        {/* Billing Address Column */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Billing Address</h3>
          
          <div className="space-y-6">
            {/* Attention */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Attention
              </label>
              <input
                type="text"
                value={formData.billingAttention || ''}
                onChange={(e) => handleInputChange('billingAttention', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Country/Region */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Country/Region
              </label>
              <select
                value={formData.billingCountryRegion || ''}
                onChange={(e) => handleInputChange('billingCountryRegion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select or type to add</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="India">India</option>
              </select>
            </div>

            {/* Address */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-start">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                Address
              </label>
              <div className="space-y-3">
                <textarea
                  value={formData.billingAddress || ''}
                  onChange={(e) => handleInputChange('billingAddress', e.target.value)}
                  placeholder="Street 1"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
                <textarea
                  value={formData.billingAddress2 || ''}
                  onChange={(e) => handleInputChange('billingAddress2', e.target.value)}
                  placeholder="Street 2"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* City */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                City
              </label>
              <input
                type="text"
                value={formData.billingCity || ''}
                onChange={(e) => handleInputChange('billingCity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* State/County */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                State/County
              </label>
              <select
                value={formData.billingStateCounty || ''}
                onChange={(e) => handleInputChange('billingStateCounty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select or type to add</option>
                <option value="England">England</option>
                <option value="Scotland">Scotland</option>
                <option value="Wales">Wales</option>
                <option value="Northern Ireland">Northern Ireland</option>
                <option value="California">California</option>
                <option value="New York">New York</option>
                <option value="Texas">Texas</option>
              </select>
            </div>

            {/* Postal/ZIP Code */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Postal/ZIP Code
              </label>
              <input
                type="text"
                value={formData.billingPostalCode || ''}
                onChange={(e) => handleInputChange('billingPostalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Phone */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <div className="flex">
                <select
                  value={formData.billingPhoneCountryCode || '+44'}
                  onChange={(e) => handleInputChange('billingPhoneCountryCode', e.target.value)}
                  className="flex-shrink-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-r-0"
                >
                  <option value="+44">+44</option>
                  <option value="+1">+1</option>
                  <option value="+91">+91</option>
                  <option value="+49">+49</option>
                </select>
                <input
                  type="tel"
                  value={formData.billingPhone || ''}
                  onChange={(e) => handleInputChange('billingPhone', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Fax Number */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fax Number
              </label>
              <input
                type="text"
                value={formData.billingFax || ''}
                onChange={(e) => handleInputChange('billingFax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Shipping Address Column */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
              Shipping Address ( 
              <button
                type="button"
                onClick={copyBillingToShipping}
                className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
              >
                <Copy className="w-3 h-3 mr-1" />
                Copy billing address
              </button>
              )
            </h3>
          </div>

          <div className="space-y-6">
            {/* Attention */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Attention
              </label>
              <input
                type="text"
                value={formData.shippingAttention || ''}
                onChange={(e) => handleInputChange('shippingAttention', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Country/Region */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Country/Region
              </label>
              <select
                value={formData.shippingCountryRegion || ''}
                onChange={(e) => handleInputChange('shippingCountryRegion', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select or type to add</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="India">India</option>
              </select>
            </div>

            {/* Address */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-start">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
                Address
              </label>
              <div className="space-y-3">
                <textarea
                  value={formData.shippingAddress || ''}
                  onChange={(e) => handleInputChange('shippingAddress', e.target.value)}
                  placeholder="Street 1"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
                <textarea
                  value={formData.shippingAddress2 || ''}
                  onChange={(e) => handleInputChange('shippingAddress2', e.target.value)}
                  placeholder="Street 2"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                />
              </div>
            </div>

            {/* City */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                City
              </label>
              <input
                type="text"
                value={formData.shippingCity || ''}
                onChange={(e) => handleInputChange('shippingCity', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* State/County */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                State/County
              </label>
              <select
                value={formData.shippingStateCounty || ''}
                onChange={(e) => handleInputChange('shippingStateCounty', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select or type to add</option>
                <option value="England">England</option>
                <option value="Scotland">Scotland</option>
                <option value="Wales">Wales</option>
                <option value="Northern Ireland">Northern Ireland</option>
                <option value="California">California</option>
                <option value="New York">New York</option>
                <option value="Texas">Texas</option>
              </select>
            </div>

            {/* Postal/ZIP Code */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Postal/ZIP Code
              </label>
              <input
                type="text"
                value={formData.shippingPostalCode || ''}
                onChange={(e) => handleInputChange('shippingPostalCode', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            {/* Phone */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Phone
              </label>
              <div className="flex">
                <select
                  value={formData.shippingPhoneCountryCode || '+44'}
                  onChange={(e) => handleInputChange('shippingPhoneCountryCode', e.target.value)}
                  className="flex-shrink-0 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-r-0"
                >
                  <option value="+44">+44</option>
                  <option value="+1">+1</option>
                  <option value="+91">+91</option>
                  <option value="+49">+49</option>
                </select>
                <input
                  type="tel"
                  value={formData.shippingPhone || ''}
                  onChange={(e) => handleInputChange('shippingPhone', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* Fax Number */}
            <div className="grid grid-cols-[80px,1fr] gap-8 items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Fax Number
              </label>
              <input
                type="text"
                value={formData.shippingFax || ''}
                onChange={(e) => handleInputChange('shippingFax', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Note Section */}
      <div className="mt-8 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
        <h4 className="text-sm font-medium text-orange-800 dark:text-orange-200 mb-2">Note:</h4>
        <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
          <li>• Add and manage additional addresses from this Customers and Vendors details section.</li>
          <li>• You can customise how customers' addresses are displayed in transaction PDFs. To do this, go to Settings &gt; Preferences &gt; Customers and Vendors, and navigate to the Address Format sections.</li>
        </ul>
      </div>
    </div>
  );
};