import React from 'react';
import { PriceListFormData } from '../api';

interface BasicFormFieldsProps {
  formData: PriceListFormData;
  onInputChange: (field: string, value: string | boolean) => void;
  validationErrors: {
    name: string;
    percentage: string;
    roundOffTo: string;
  };
  isEditMode?: boolean;
}

export const BasicFormFields: React.FC<BasicFormFieldsProps> = ({
  formData,
  onInputChange,
  validationErrors,
  isEditMode = false,
}) => {
  return (
    <>
      {/* Name Field */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Name<span className="text-red-500">*</span>
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <input
            type="text"
            value={formData.name}
            onChange={(e) => onInputChange('name', e.target.value)}
            className={`w-full max-w-full sm:max-w-sm px-3 py-2 border-2 rounded-md focus:outline-none bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
              validationErrors.name 
                ? 'border-red-500 focus:border-red-600' 
                : 'border-blue-500 focus:border-blue-600'
            }`}
            required
            placeholder="Enter price list name"
          />
          {validationErrors.name && (
            <p className="mt-1 text-sm text-red-500">{validationErrors.name}</p>
          )}
        </div>
      </div>

      {/* Transaction Type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Transaction Type
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
                name="transactionType"
                value="sales"
                checked={formData.transactionType === 'sales'}
                onChange={(e) => !isEditMode && onInputChange('transactionType', e.target.value)}
                disabled={isEditMode}
                className={`w-4 h-4 ${isEditMode ? 'text-gray-400 border-gray-300 cursor-not-allowed' : 'text-blue-600 border-gray-300'}`}
              />
              <span className={`ml-2 text-sm ${isEditMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>Sales</span>
            </label>
            <label className={`flex items-center ${isEditMode ? 'cursor-not-allowed' : 'cursor-pointer'}`}>
              <input
                type="radio"
                name="transactionType"
                value="purchase"
                checked={formData.transactionType === 'purchase'}
                onChange={(e) => !isEditMode && onInputChange('transactionType', e.target.value)}
                disabled={isEditMode}
                className={`w-4 h-4 ${isEditMode ? 'text-gray-400 border-gray-300 cursor-not-allowed' : 'text-blue-600 border-gray-300'}`}
              />
              <span className={`ml-2 text-sm ${isEditMode ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-gray-100'}`}>Purchase</span>
            </label>
          </div>
          {isEditMode && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              The Transaction Type cannot be modified after creation. To change this, please create a new price list.
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Description
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <textarea
            value={formData.description}
            onChange={(e) => onInputChange('description', e.target.value)}
            placeholder="Enter the description"
            rows={3}
            className="w-full max-w-full sm:max-w-sm px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>
      </div>
    </>
  );
};