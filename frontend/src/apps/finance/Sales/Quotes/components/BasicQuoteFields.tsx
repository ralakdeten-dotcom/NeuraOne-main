import React, { useRef, useEffect, useState } from 'react';
import { Search, RefreshCw } from 'lucide-react';

interface BasicQuoteFieldsProps {
  formData: {
    account: number;
    customer_name?: string;
    estimate_number?: string;
    po_number?: string;
    estimate_date: string;
    valid_until: string;
  };
  onInputChange: (field: string, value: string | number) => void;
  validationErrors?: {
    account?: string;
    estimate_number?: string;
  };
}

export const BasicQuoteFields: React.FC<BasicQuoteFieldsProps> = ({
  formData,
  onInputChange,
  validationErrors = {},
}) => {
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const customerDropdownRef = useRef<HTMLDivElement>(null);

  // Auto-generate quote number
  const generateQuoteNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `QT-${year}${month}${day}${random}`;
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customerDropdownRef.current && !customerDropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Customer Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 items-start">
        <label className="text-sm font-medium text-red-600 pt-2">
          Customer Name<span className="text-red-500">*</span>
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <div className="flex max-w-full sm:max-w-xs">
            <select 
              value={formData.account || ''}
              onChange={(e) => onInputChange('account', e.target.value)}
              className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                validationErrors.account 
                  ? 'border-red-500 focus:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
              }`}
            >
              <option value="">Select or add a customer</option>
            </select>
            <button
              type="button"
              className="px-3 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
          {validationErrors.account && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.account}</p>
          )}
        </div>
      </div>

      {/* Quote Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 items-start">
        <label className="text-sm font-medium text-red-600 pt-2">
          Quote#<span className="text-red-500">*</span>
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <div className="flex max-w-full sm:max-w-xs">
            <input
              type="text"
              value={formData.estimate_number || ''}
              onChange={(e) => onInputChange('estimate_number', e.target.value)}
              className={`flex-1 px-3 py-2 border rounded-l-md focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                validationErrors.estimate_number 
                  ? 'border-red-500 focus:border-red-600' 
                  : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
              }`}
            />
            <button
              type="button"
              onClick={() => onInputChange('estimate_number', generateQuoteNumber())}
              className="px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-gray-500" />
            </button>
          </div>
          {validationErrors.estimate_number && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.estimate_number}</p>
          )}
        </div>
      </div>

      {/* Reference Number */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 items-start">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Reference#
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <input
            type="text"
            value={formData.po_number || ''}
            onChange={(e) => onInputChange('po_number', e.target.value)}
            className="w-full max-w-full sm:max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Quote Date & Expiry Date - Side by side */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-start">
        <label className="text-sm font-medium text-red-600 pt-2">
          Quote Date<span className="text-red-500">*</span>
        </label>
        <div>
          <input
            type="text"
            value={formData.estimate_date ? new Date(formData.estimate_date).toLocaleDateString('en-GB') : ''}
            onChange={(e) => {
              // Convert from DD/MM/YYYY to YYYY-MM-DD for internal storage
              const dateParts = e.target.value.split('/');
              if (dateParts.length === 3) {
                const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                onInputChange('estimate_date', formattedDate);
              }
            }}
            placeholder="24/08/2025"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            style={{ minWidth: '200px' }}
          />
        </div>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Expiry Date
        </label>
        <div>
          <input
            type="text"
            value={formData.valid_until ? new Date(formData.valid_until).toLocaleDateString('en-GB') : ''}
            onChange={(e) => {
              // Convert from DD/MM/YYYY to YYYY-MM-DD for internal storage
              const dateParts = e.target.value.split('/');
              if (dateParts.length === 3) {
                const formattedDate = `${dateParts[2]}-${dateParts[1].padStart(2, '0')}-${dateParts[0].padStart(2, '0')}`;
                onInputChange('valid_until', formattedDate);
              }
            }}
            placeholder="dd/MM/yyyy"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            style={{ minWidth: '200px' }}
          />
        </div>
      </div>
    </>
  );
};