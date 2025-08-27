import React from 'react';
import { X, Info } from 'lucide-react';

interface QuoteDetailsFieldsProps {
  formData: {
    salesperson?: string;
    subject?: string;
    customer_notes?: string;
    terms_conditions?: string;
  };
  onInputChange: (field: string, value: string) => void;
}

export const QuoteDetailsFields: React.FC<QuoteDetailsFieldsProps> = ({
  formData,
  onInputChange,
}) => {
  return (
    <>
      {/* Salesperson */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 items-start">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Salesperson
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <input
            type="text"
            value={formData.salesperson || ''}
            onChange={(e) => onInputChange('salesperson', e.target.value)}
            className="w-full max-w-full sm:max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Subject */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 items-start">
        <label className="flex items-center gap-1 text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Subject
          <Info className="w-4 h-4 text-gray-400" />
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <textarea
            value={formData.subject || ''}
            onChange={(e) => onInputChange('subject', e.target.value)}
            rows={2}
            className="w-full max-w-full sm:max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          />
        </div>
      </div>

      {/* Customer Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 items-start">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Customer Notes
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <textarea
            value={formData.customer_notes || ''}
            onChange={(e) => onInputChange('customer_notes', e.target.value)}
            rows={3}
            className="w-full max-w-full sm:max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-1 sm:gap-2 items-start">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Terms & Conditions
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <textarea
            value={formData.terms_conditions || ''}
            onChange={(e) => onInputChange('terms_conditions', e.target.value)}
            rows={4}
            className="w-full max-w-full sm:max-w-xs px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>
      </div>
    </>
  );
};