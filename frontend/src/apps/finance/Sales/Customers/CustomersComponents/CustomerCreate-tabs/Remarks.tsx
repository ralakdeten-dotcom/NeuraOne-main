import React from 'react';

interface RemarksProps {
  formData: any;
  handleInputChange: (field: string, value: string) => void;
}

export const Remarks: React.FC<RemarksProps> = ({ formData, handleInputChange }) => {
  return (
    <div className="space-y-6">
      {/* Remarks */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Remarks <span className="text-blue-500">(For Internal Use)</span>
        </label>
        <textarea
          value={formData.remarks || ''}
          onChange={(e) => handleInputChange('remarks', e.target.value)}
          rows={4}
          className="w-[70%] px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
          placeholder="Enter remarks for internal use..."
        />
      </div>
    </div>
  );
};