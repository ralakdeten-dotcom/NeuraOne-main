import React, { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateFormModalpage } from '../../../../finance-inventory-shared';
import { useCreatePriceList, type PriceListFormData } from './api';
import {
  BasicFormFields,
  PriceListTypeSelector,
  PriceConfigurationFields,
  ItemsTableSection,
} from './components';

interface NewPriceListPageProps {
  isOpen?: boolean;
  onClose?: () => void;
}


export const NewPriceListPage: React.FC<NewPriceListPageProps> = ({ 
  isOpen = true, 
  onClose 
}) => {
  const navigate = useNavigate();
  const createPriceListMutation = useCreatePriceList();
  
  const [formData, setFormData] = useState<PriceListFormData>({
    name: '',
    transactionType: 'sales' as const,
    priceListType: 'all_items' as const,
    description: '',
    percentage: '',
    roundOffTo: 'never_mind', // Default to 'Never mind'
    markupType: 'markup' as const, // Add markup/markdown selection
    // Individual Items fields
    pricingScheme: 'unit_pricing' as const,
    currency: 'GBP',
    includeDiscount: false
  });

  const [validationErrors, setValidationErrors] = useState({
    name: '',
    percentage: '',
    roundOffTo: ''
  });

  const [isRoundOffDropdownOpen, setIsRoundOffDropdownOpen] = useState(false);
  const [roundOffSearch, setRoundOffSearch] = useState('');
  const [isExamplesModalOpen, setIsExamplesModalOpen] = useState(false);
  const [isCurrencyDropdownOpen, setIsCurrencyDropdownOpen] = useState(false);
  const [currencySearch, setCurrencySearch] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('GBP');
  
  // State for managing item values (custom rates and discounts)
  const [itemValues, setItemValues] = useState<{
    [itemId: string]: {
      customRate?: string;
      discount?: string;
    };
  }>({});
  const roundOffDropdownRef = useRef<HTMLDivElement>(null);
  const currencyDropdownRef = useRef<HTMLDivElement>(null);

  // Helper functions for item values
  const handleCustomRateChange = (itemId: string, value: string) => {
    setItemValues(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        customRate: value
      }
    }));
  };

  const handleDiscountChange = (itemId: string, value: string) => {
    setItemValues(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        discount: value
      }
    }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    const errors = { name: '', percentage: '', roundOffTo: '' };
    let hasErrors = false;
    
    // Validate required fields
    if (!formData.name.trim()) {
      errors.name = 'Name is required and cannot be empty';
      hasErrors = true;
    }
    
    // Only validate percentage and roundOffTo for "All Items" price list type
    if (formData.priceListType === 'all_items') {
      if (!formData.percentage.trim()) {
        errors.percentage = 'Percentage is required and cannot be empty';
        hasErrors = true;
      } else {
        const percentageValue = parseFloat(formData.percentage);
        if (isNaN(percentageValue) || percentageValue < 0) {
          errors.percentage = 'Percentage must be a valid number greater than or equal to 0';
          hasErrors = true;
        }
      }
      
      if (!formData.roundOffTo) {
        errors.roundOffTo = 'Round Off To selection is required';
        hasErrors = true;
      }
    }
    
    // Set validation errors
    setValidationErrors(errors);
    
    // If there are any errors, don't proceed with saving
    if (hasErrors) {
      alert('Please fill in all required fields before saving.');
      return;
    }

    try {
      // Include item values in form data if it's Individual Items type
      const formDataWithItems = {
        ...formData,
        ...(formData.priceListType === 'individual_items' ? { itemValues } : {})
      };
      
      await createPriceListMutation.mutateAsync(formDataWithItems);
      console.log('Price list created successfully');
      // Navigate back to the price lists page
      navigate('/finance/items/price-lists');
    } catch (error) {
      console.error('Error creating price list:', error);
      alert('Error creating price list. Please try again.');
    }
  };


  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/finance/items/price-lists');
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'includeDiscount' ? (value === 'true' || value === true) : value
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };



  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roundOffDropdownRef.current && !roundOffDropdownRef.current.contains(event.target as Node)) {
        setIsRoundOffDropdownOpen(false);
      }
      if (currencyDropdownRef.current && !currencyDropdownRef.current.contains(event.target as Node)) {
        setIsCurrencyDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <CreateFormModalpage
        isOpen={isOpen}
        onClose={handleCancel}
        title="New Price List"
        onSubmit={handleSubmit}
        submitLabel="Save"
        cancelLabel="Cancel"
      >
        <BasicFormFields
          formData={formData}
          onInputChange={handleInputChange}
          validationErrors={validationErrors}
          isEditMode={false}
        />

        <PriceListTypeSelector
          formData={formData}
          onInputChange={handleInputChange}
          isEditMode={false}
        />

        <PriceConfigurationFields
          formData={formData}
          onInputChange={handleInputChange}
          validationErrors={validationErrors}
          isRoundOffDropdownOpen={isRoundOffDropdownOpen}
          setIsRoundOffDropdownOpen={setIsRoundOffDropdownOpen}
          roundOffSearch={roundOffSearch}
          setRoundOffSearch={setRoundOffSearch}
          isCurrencyDropdownOpen={isCurrencyDropdownOpen}
          setIsCurrencyDropdownOpen={setIsCurrencyDropdownOpen}
          currencySearch={currencySearch}
          setCurrencySearch={setCurrencySearch}
          selectedCurrency={selectedCurrency}
          roundOffDropdownRef={roundOffDropdownRef}
          currencyDropdownRef={currencyDropdownRef}
          onSetExamplesModal={setIsExamplesModalOpen}
          isEditMode={false}
        />

        {formData.priceListType === 'individual_items' && (
          <ItemsTableSection
            formData={formData}
            itemValues={itemValues}
            onCustomRateChange={handleCustomRateChange}
            onDiscountChange={handleDiscountChange}
          />
        )}

    </CreateFormModalpage>

      {/* Rounding Examples Modal */}
      {isExamplesModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" />
          <div className="flex justify-center items-center min-h-screen p-2 sm:p-4">
            <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-xs sm:max-w-md lg:max-w-lg">
              {/* Modal Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-200 dark:border-gray-600">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Rounding Examples
                </h3>
                <button
                  onClick={() => setIsExamplesModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-4 sm:px-6 py-4">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-600">
                        <th className="px-2 sm:px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Round Off To
                        </th>
                        <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Input Value
                        </th>
                        <th className="px-2 sm:px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rounded Value
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                      <tr>
                        <td className="px-2 sm:px-3 py-3">
                          <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                            Never mind
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1000.678
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1000.678
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 sm:px-3 py-3">
                          <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                            Nearest whole number
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1000.678
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1001
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 sm:px-3 py-3">
                          <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                            0.99
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1000.678
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1000.99
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 sm:px-3 py-3">
                          <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                            0.50
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1000.678
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1000.50
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 sm:px-3 py-3">
                          <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                            0.49
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1000.678
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          1000.49
                        </td>
                      </tr>
                      <tr>
                        <td className="px-2 sm:px-3 py-3">
                          <span className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium">
                            Decimal Places
                          </span>
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          -
                        </td>
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-900 dark:text-gray-100">
                          -
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-4 sm:px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                <button
                  type="button"
                  onClick={() => setIsExamplesModalOpen(false)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium w-full sm:w-auto text-center"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};