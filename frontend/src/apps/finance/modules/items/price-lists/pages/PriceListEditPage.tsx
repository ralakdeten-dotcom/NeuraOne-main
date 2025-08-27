import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CreateFormModalpage } from '../../../../../../finance-inventory-shared';
import { usePriceListById, useUpdatePriceList, type PriceListFormData } from '../../api/PriceListAPI';
import {
  BasicFormFields,
  PriceListTypeSelector,
  PriceConfigurationFields,
  ItemsTableSection,
} from '../components';
import { X } from 'lucide-react';

interface PriceListEditPageProps {
  isOpen?: boolean;
  onClose?: () => void;
}

// Round off options for the helper function
const roundOffOptions = [
  { value: 'never_mind', label: 'Never mind' },
  { value: 'nearest_whole', label: 'Nearest whole number' },
  { value: '0.99', label: '0.99' },
  { value: '0.50', label: '0.50' },
  { value: '0.49', label: '0.49' },
  { value: 'decimal_places', label: 'Decimal Places' }
];


export const PriceListEditPage: React.FC<PriceListEditPageProps> = ({ isOpen = true, onClose }) => {
  try {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    
    console.log('EditPriceListPage: Rendering with id:', id);
    
    // API Hooks - Only call the hook if id exists
    const { data: priceList, isLoading: loading, error: loadError } = usePriceListById(id);
    const updatePriceListMutation = useUpdatePriceList();
    
    console.log('EditPriceListPage: Hook results - loading:', loading, 'error:', loadError, 'data:', priceList);
  
  const [formData, setFormData] = useState<PriceListFormData>({
    name: 'ABC Company Ltd',
    transactionType: 'sales' as const,
    priceListType: 'all_items' as const,
    description: '',
    percentage: '20',
    roundOffTo: 'nearest_whole',
    markupType: 'markup' as const,
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


  // Load existing price list data from API
  useEffect(() => {
    console.log('EditPriceListPage: priceList data received:', priceList);
    
    if (priceList) {
      try {
        if (priceList.originalData) {
          // Load the original form data
          setFormData(priceList.originalData);
          console.log('Loaded price list for editing:', priceList);
        } else {
          // Fallback: reconstruct form data from display data
          const isIndividualItems = priceList.details?.includes('Per Item Rate');
          const reconstructedData = {
            name: priceList.name || '',
            transactionType: (priceList.currency === 'GBP' ? 'sales' : 'purchase') as 'sales' | 'purchase',
            priceListType: (isIndividualItems ? 'individual_items' : 'all_items') as 'all_items' | 'individual_items',
            description: priceList.description || '',
            percentage: priceList.details?.match(/(\d+)%/)?.[1] || '0',
            roundOffTo: getRoundOffValueFromLabel(priceList.roundOffPreference || '') || 'never_mind',
            markupType: (priceList.details?.includes('Markdown') ? 'markdown' : 'markup') as 'markup' | 'markdown',
            // Individual Items fields
            pricingScheme: (priceList.pricingScheme?.includes('Volume') ? 'volume_pricing' : 'unit_pricing') as 'unit_pricing' | 'volume_pricing',
            currency: priceList.currency || 'GBP',
            includeDiscount: false // Default as we don't store this info
          };
          
          setFormData(reconstructedData);
          
          // Set currency for dropdown
          setSelectedCurrency(priceList.currency || 'GBP');
          console.log('Reconstructed form data for editing:', reconstructedData);
        }

        // Load any existing item values if available
        if (priceList.originalData?.itemValues) {
          setItemValues(priceList.originalData.itemValues);
        }
      } catch (error) {
        console.error('Error processing price list data:', error);
      }
    }
  }, [priceList]);

  const getRoundOffValueFromLabel = (label: string): string => {
    const option = roundOffOptions.find(opt => opt.label === label);
    return option ? option.value : 'never_mind';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!id || id === '') {
      alert('Price list ID not found.');
      return;
    }
    
    // Clear previous validation errors
    const errors = { name: '', percentage: '', roundOffTo: '' };
    let hasErrors = false;
    
    // Validate required fields
    if (!formData.name.trim()) {
      errors.name = 'Name is required and cannot be empty';
      hasErrors = true;
    }
    
    // Only validate percentage and roundOffTo for 'all_items' type
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
      
      await updatePriceListMutation.mutateAsync({ id, formData: formDataWithItems });
      console.log('Price list updated successfully');
      // Navigate back to the price lists page
      navigate('/finance/items/price-lists');
    } catch (error) {
      console.error('Error updating price list:', error);
      alert('Error updating price list. Please try again.');
    }
  };

  const getRoundOffDisplayName = (value: string) => {
    const option = roundOffOptions.find(opt => opt.value === value);
    return option ? option.label : 'Never mind';
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

  if (loading) {
    return (
      <CreateFormModalpage
        isOpen={isOpen}
        onClose={handleCancel}
        title="Edit Price List"
        onSubmit={() => {}}
        submitLabel="Save"
        cancelLabel="Cancel"
      >
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-500">Loading price list...</div>
        </div>
      </CreateFormModalpage>
    );
  }

  if (!id) {
    return (
      <CreateFormModalpage
        isOpen={isOpen}
        onClose={handleCancel}
        title="Edit Price List"
        onSubmit={() => {}}
        submitLabel="Save"
        cancelLabel="Cancel"
      >
        <div className="flex justify-center items-center py-8">
          <div className="text-red-500">Invalid price list ID. Please try again.</div>
        </div>
      </CreateFormModalpage>
    );
  }

  if (loadError || (!loading && !priceList)) {
    return (
      <CreateFormModalpage
        isOpen={isOpen}
        onClose={handleCancel}
        title="Edit Price List"
        onSubmit={() => {}}
        submitLabel="Save"
        cancelLabel="Cancel"
      >
        <div className="flex justify-center items-center py-8">
          <div className="text-red-500">Error loading price list. Please try again.</div>
        </div>
      </CreateFormModalpage>
    );
  }

  return (
    <>
      <CreateFormModalpage
        isOpen={isOpen}
        onClose={handleCancel}
        title="Edit Price List"
        onSubmit={handleSubmit}
        submitLabel="Save"
        cancelLabel="Cancel"
      >
        <BasicFormFields
          formData={formData}
          onInputChange={handleInputChange}
          validationErrors={validationErrors}
          isEditMode={true}
        />

        <PriceListTypeSelector
          formData={formData}
          onInputChange={handleInputChange}
          isEditMode={true}
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
          isEditMode={true}
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
                        <td className="px-2 sm:px-3 py-3 text-center text-xs sm:text-sm text-gray-100">
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
  } catch (error) {
    console.error('EditPriceListPage: Runtime error:', error);
    return (
      <CreateFormModalpage
        isOpen={isOpen}
        onClose={() => navigate('/finance/items/price-lists')}
        title="Edit Price List"
        onSubmit={() => {}}
        submitLabel="Save"
        cancelLabel="Cancel"
      >
        <div className="flex justify-center items-center py-8">
          <div className="text-red-500">
            An unexpected error occurred. Please check the console for details.
            <br />
            <button 
              onClick={() => navigate('/finance/items/price-lists')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Back to Price Lists
            </button>
          </div>
        </div>
      </CreateFormModalpage>
    );
  }
};