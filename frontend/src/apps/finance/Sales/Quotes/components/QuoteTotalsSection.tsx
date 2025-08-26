import React from 'react';
import { Info } from 'lucide-react';

interface QuoteTotalsSectionProps {
  subtotal: number;
  formData: {
    discount?: number;
    discount_type?: 'percentage' | 'amount';
    shipping_fee?: number;
    rush_fee?: number;
  };
  discountAmount: number;
  total: number;
  onInputChange: (field: string, value: string | number) => void;
}

export const QuoteTotalsSection: React.FC<QuoteTotalsSectionProps> = ({
  subtotal,
  formData,
  discountAmount,
  total,
  onInputChange,
}) => {
  return (
    <div className="flex justify-end">
      <div className="w-80 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">Sub Total</span>
          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {subtotal.toFixed(2)}
          </span>
        </div>
        
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-700 dark:text-gray-300">Discount</span>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={formData.discount || 0}
              onChange={(e) => onInputChange('discount', parseFloat(e.target.value) || 0)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-right focus:ring-1 focus:ring-blue-500"
            />
            <select
              value={formData.discount_type || 'percentage'}
              onChange={(e) => onInputChange('discount_type', e.target.value)}
              className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:ring-1 focus:ring-blue-500"
            >
              <option value="percentage">%</option>
              <option value="amount">£</option>
            </select>
            <span className="text-sm text-gray-900 dark:text-gray-100">
              {discountAmount.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">Shipping Charges</span>
            <Info className="w-3 h-3 text-gray-400" />
          </div>
          <input
            type="number"
            value={formData.shipping_fee || 0}
            onChange={(e) => onInputChange('shipping_fee', parseFloat(e.target.value) || 0)}
            className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-right focus:ring-1 focus:ring-blue-500"
            step="0.01"
          />
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-700 dark:text-gray-300">Rush Fee</span>
            <Info className="w-3 h-3 text-gray-400" />
          </div>
          <input
            type="number"
            value={formData.rush_fee || 0}
            onChange={(e) => onInputChange('rush_fee', parseFloat(e.target.value) || 0)}
            className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded text-right focus:ring-1 focus:ring-blue-500"
            step="0.01"
          />
        </div>

        <hr className="border-gray-200 dark:border-gray-600" />
        
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">Total ( £ )</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            {total.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};