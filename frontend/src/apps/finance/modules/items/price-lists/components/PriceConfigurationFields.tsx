import React from 'react';
import { ChevronUp, ChevronDown, Search, Check } from 'lucide-react';
import { PriceListFormData } from '../api';

interface PriceConfigurationFieldsProps {
  formData: PriceListFormData;
  onInputChange: (field: string, value: string | boolean) => void;
  validationErrors: {
    name: string;
    percentage: string;
    roundOffTo: string;
  };
  isRoundOffDropdownOpen: boolean;
  setIsRoundOffDropdownOpen: (open: boolean) => void;
  roundOffSearch: string;
  setRoundOffSearch: (search: string) => void;
  isCurrencyDropdownOpen: boolean;
  setIsCurrencyDropdownOpen: (open: boolean) => void;
  currencySearch: string;
  setCurrencySearch: (search: string) => void;
  selectedCurrency: string;
  roundOffDropdownRef: React.RefObject<HTMLDivElement>;
  currencyDropdownRef: React.RefObject<HTMLDivElement>;
  onSetExamplesModal: (open: boolean) => void;
  isEditMode?: boolean; // Add this to differentiate between new and edit mode
}

const roundOffOptions = [
  { value: 'never_mind', label: 'Never mind' },
  { value: 'nearest_whole', label: 'Nearest whole number' },
  { value: '0.99', label: '0.99' },
  { value: '0.50', label: '0.50' },
  { value: '0.49', label: '0.49' },
  { value: 'decimal_places', label: 'Decimal Places' }
];

const currencyOptions = [
  { value: 'AED', label: 'AED- UAE Dirham' },
  { value: 'AUD', label: 'AUD- Australian Dollar' },
  { value: 'CAD', label: 'CAD- Canadian Dollar' },
  { value: 'CNY', label: 'CNY- Yuan Renminbi' },
  { value: 'EUR', label: 'EUR- Euro' },
  { value: 'GBP', label: 'GBP- Pound Sterling' },
  { value: 'INR', label: 'INR- Indian Rupee' },
  { value: 'JPY', label: 'JPY- Japanese Yen' },
  { value: 'SAR', label: 'SAR- Saudi Riyal' },
  { value: 'USD', label: 'USD- United States Dollar' },
  { value: 'ZAR', label: 'ZAR- South African Rand' }
];

export const PriceConfigurationFields: React.FC<PriceConfigurationFieldsProps> = ({
  formData,
  onInputChange,
  validationErrors,
  isRoundOffDropdownOpen,
  setIsRoundOffDropdownOpen,
  roundOffSearch,
  setRoundOffSearch,
  isCurrencyDropdownOpen,
  setIsCurrencyDropdownOpen,
  currencySearch,
  setCurrencySearch,
  selectedCurrency,
  roundOffDropdownRef,
  currencyDropdownRef,
  onSetExamplesModal,
  isEditMode = false,
}) => {
  const filteredRoundOffOptions = roundOffOptions.filter(option =>
    option.label && option.label.toLowerCase().includes((roundOffSearch || '').toLowerCase())
  );

  const filteredCurrencyOptions = currencyOptions.filter(option =>
    option.label && option.label.toLowerCase().includes((currencySearch || '').toLowerCase())
  );

  const getSelectedRoundOffLabel = () => {
    if (!formData.roundOffTo) {
      return 'Select rounding option...';
    }
    const selected = roundOffOptions.find(option => option.value === formData.roundOffTo);
    return selected ? selected.label : 'Select rounding option...';
  };

  const getSelectedCurrencyLabel = () => {
    const currency = formData.currency || selectedCurrency;
    const selected = currencyOptions.find(option => option.value === currency);
    return selected ? selected.label : 'GBP- Pound Sterling';
  };

  const handleRoundOffSelect = (value: string) => {
    onInputChange('roundOffTo', value);
    setIsRoundOffDropdownOpen(false);
    setRoundOffSearch('');
  };

  const handleCurrencySelect = (value: string) => {
    onInputChange('currency', value);
    setIsCurrencyDropdownOpen(false);
    setCurrencySearch('');
  };

  return (
    <>
      {/* Conditional Fields Based on Price List Type */}
      {formData.priceListType === 'all_items' ? (
        // Fields for "All Items" Price List Type
        <>
          {/* Percentage */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
              Percentage<span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-1 md:col-span-2">
              <div className="flex max-w-full sm:max-w-sm">
                <select 
                  value={formData.markupType}
                  onChange={(e) => onInputChange('markupType', e.target.value)}
                  className={`px-3 py-2 border rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none border-r-0 min-w-0 flex-shrink-0 ${
                  validationErrors.percentage 
                    ? 'border-red-500 focus:border-red-600' 
                    : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                }`}>
                  <option value="markup">Markup</option>
                  <option value="markdown">Markdown</option>
                </select>
                <div className="flex-1 relative min-w-0">
                  <input
                    type="number"
                    value={formData.percentage}
                    onChange={(e) => onInputChange('percentage', e.target.value)}
                    className={`w-full px-3 py-2 border rounded-r-md focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 pr-10 ${
                      validationErrors.percentage 
                        ? 'border-red-500 focus:border-red-600' 
                        : 'border-gray-300 dark:border-gray-600 focus:border-blue-500'
                    }`}
                    required
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <span className="text-gray-500 dark:text-gray-400">%</span>
                  </div>
                </div>
              </div>
              {validationErrors.percentage && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.percentage}</p>
              )}
            </div>
          </div>

          {/* Round Off To */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
              Round Off To<span className="text-red-500">*</span>
            </label>
            <div className="sm:col-span-1 md:col-span-2 relative" ref={roundOffDropdownRef}>
              <button
                type="button"
                onClick={() => setIsRoundOffDropdownOpen(!isRoundOffDropdownOpen)}
                className={`max-w-full sm:max-w-sm w-full px-3 py-2 border-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none flex items-center justify-between ${
                  validationErrors.roundOffTo 
                    ? 'border-red-500' 
                    : 'border-blue-500'
                }`}
              >
                <span>{getSelectedRoundOffLabel()}</span>
                {isRoundOffDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-blue-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-500" />
                )}
              </button>

              {isRoundOffDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full max-w-full sm:max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                  {/* Search Box */}
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={roundOffSearch}
                        onChange={(e) => setRoundOffSearch(e.target.value)}
                        placeholder="Search"
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredRoundOffOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleRoundOffSelect(option.value)}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                          formData.roundOffTo === option.value 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <span>{option.label}</span>
                        {formData.roundOffTo === option.value && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    ))}
                    {filteredRoundOffOptions.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        No options found
                      </div>
                    )}
                  </div>
                </div>
              )}
              {validationErrors.roundOffTo && (
                <p className="mt-1 text-sm text-red-500">{validationErrors.roundOffTo}</p>
              )}
            </div>
          </div>

          {/* View Examples Link */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start -mt-4">
            <div></div>
            <div className="sm:col-span-1 md:col-span-2">
              <button
                type="button"
                onClick={() => onSetExamplesModal(true)}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                View Examples
              </button>
            </div>
          </div>
        </>
      ) : (
        // Fields for "Individual Items" Price List Type
        <>
          {/* Pricing Scheme */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
              Pricing Scheme
              {isEditMode && (
                <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
                  (Cannot be changed)
                </span>
              )}
            </label>
            <div className="sm:col-span-1 md:col-span-2">
              <div className={`flex flex-col sm:flex-row gap-4 sm:gap-6 ${isEditMode ? 'opacity-75' : ''}`}>
                <label className={`flex items-center ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="pricingScheme"
                    value="unit_pricing"
                    checked={formData.pricingScheme === 'unit_pricing'}
                    onChange={(e) => !isEditMode && onInputChange('pricingScheme', e.target.value)}
                    disabled={isEditMode}
                    className={`w-4 h-4 ${isEditMode ? 'text-gray-400 border-gray-300 cursor-not-allowed' : 'text-blue-600 border-gray-300'}`}
                  />
                  <span className={`ml-2 text-sm ${isEditMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    Unit Pricing
                  </span>
                </label>
                <label className={`flex items-center ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="pricingScheme"
                    value="volume_pricing"
                    checked={formData.pricingScheme === 'volume_pricing'}
                    onChange={(e) => !isEditMode && onInputChange('pricingScheme', e.target.value)}
                    disabled={isEditMode}
                    className={`w-4 h-4 ${isEditMode ? 'text-gray-400 border-gray-300 cursor-not-allowed' : 'text-blue-600 border-gray-300'}`}
                  />
                  <span className={`ml-2 text-sm ${isEditMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>
                    Volume Pricing
                  </span>
                </label>
              </div>
              {isEditMode && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  The Pricing Scheme cannot be modified after creation. To change this, please create a new price list.
                </p>
              )}
            </div>
          </div>

          {/* Currency */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
              Currency
            </label>
            <div className="sm:col-span-1 md:col-span-2 relative" ref={currencyDropdownRef}>
              <button
                type="button"
                onClick={() => setIsCurrencyDropdownOpen(!isCurrencyDropdownOpen)}
                className="max-w-full sm:max-w-sm w-full px-3 py-2 border-2 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none flex items-center justify-between border-blue-500"
              >
                <span>{getSelectedCurrencyLabel()}</span>
                {isCurrencyDropdownOpen ? (
                  <ChevronUp className="w-4 h-4 text-blue-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-blue-500" />
                )}
              </button>

              {isCurrencyDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-full max-w-full sm:max-w-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg z-50">
                  {/* Search Box */}
                  <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        value={currencySearch}
                        onChange={(e) => setCurrencySearch(e.target.value)}
                        placeholder="Search currency..."
                        className="w-full pl-10 pr-3 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-md hover:border-blue-500 focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  {/* Options List */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredCurrencyOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => handleCurrencySelect(option.value)}
                        className={`w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center justify-between ${
                          (formData.currency || selectedCurrency) === option.value 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : 'text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <span>{option.label}</span>
                        {(formData.currency || selectedCurrency) === option.value && (
                          <Check className="w-4 h-4 text-white" />
                        )}
                      </button>
                    ))}
                    {filteredCurrencyOptions.length === 0 && (
                      <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        No currencies found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
              Discount
            </label>
            <div className="sm:col-span-1 md:col-span-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.includeDiscount}
                  onChange={(e) => onInputChange('includeDiscount', e.target.checked.toString())}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-gray-100">
                  I want to include discount percentage for the items
                </span>
              </label>
            </div>
          </div>
        </>
      )}
    </>
  );
};