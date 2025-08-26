import React from 'react';
import { Check } from 'lucide-react';
import { PriceListFormData } from '../api';

interface PriceListTypeSelectorProps {
  formData: PriceListFormData;
  onInputChange: (field: string, value: string | boolean) => void;
  isEditMode?: boolean;
}

export const PriceListTypeSelector: React.FC<PriceListTypeSelectorProps> = ({
  formData,
  onInputChange,
  isEditMode = false,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
        Price List Type
        {isEditMode && (
          <span className="text-xs text-gray-500 dark:text-gray-400 block mt-1">
            (Cannot be changed)
          </span>
        )}
      </label>
      <div className="sm:col-span-1 md:col-span-3">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div 
            className={`p-4 border-2 rounded-lg transition-colors ${
              isEditMode 
                ? 'cursor-not-allowed opacity-75' 
                : 'cursor-pointer'
            } ${
              formData.priceListType === 'all_items' 
                ? isEditMode 
                  ? 'border-blue-300 bg-blue-25 dark:bg-blue-900/10' 
                  : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
            }`}
            onClick={() => !isEditMode && onInputChange('priceListType', 'all_items')}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.priceListType === 'all_items' 
                  ? isEditMode 
                    ? 'border-blue-300 bg-blue-300' 
                    : 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {formData.priceListType === 'all_items' && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div>
                <h4 className={`font-medium ${isEditMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>All Items</h4>
                <p className={`text-sm mt-1 ${isEditMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  Mark up or mark down the rates of all items
                </p>
              </div>
            </div>
          </div>

          <div 
            className={`p-4 border-2 rounded-lg transition-colors ${
              isEditMode 
                ? 'cursor-not-allowed opacity-75' 
                : 'cursor-pointer'
            } ${
              formData.priceListType === 'individual_items' 
                ? isEditMode 
                  ? 'border-blue-300 bg-blue-25 dark:bg-blue-900/10' 
                  : 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-blue-300'
            }`}
            onClick={() => !isEditMode && onInputChange('priceListType', 'individual_items')}
          >
            <div className="flex items-start gap-3">
              <div className={`mt-1 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                formData.priceListType === 'individual_items' 
                  ? isEditMode 
                    ? 'border-blue-300 bg-blue-300' 
                    : 'border-blue-500 bg-blue-500'
                  : 'border-gray-300'
              }`}>
                {formData.priceListType === 'individual_items' && (
                  <Check className="w-3 h-3 text-white" />
                )}
              </div>
              <div>
                <h4 className={`font-medium ${isEditMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>Individual Items</h4>
                <p className={`text-sm mt-1 ${isEditMode ? 'text-gray-400 dark:text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                  Customize the rate of each item
                </p>
              </div>
            </div>
          </div>
        </div>
        {isEditMode && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            The Price List Type cannot be modified after creation. To change this, please create a new price list.
          </p>
        )}
      </div>
    </div>
  );
};