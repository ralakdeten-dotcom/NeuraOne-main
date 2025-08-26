import React from 'react';
import { Plus, Minus, Info } from 'lucide-react';

interface QuoteLineItem {
  id: string;
  product?: number;
  item_details?: string;
  manufacturer?: string;
  lead_time?: string;
  condition?: string;
  quantity: number;
  rate: number;
  vat: number;
  amount: number;
}

interface QuoteItemsTableProps {
  lineItems: QuoteLineItem[];
  onAddRow: () => void;
  onRemoveRow: (id: string) => void;
  onUpdateLineItem: (id: string, field: keyof QuoteLineItem, value: any) => void;
}

export const QuoteItemsTable: React.FC<QuoteItemsTableProps> = ({
  lineItems,
  onAddRow,
  onRemoveRow,
  onUpdateLineItem,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Item Table</h3>
        <button
          type="button"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
        >
          <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">?</span>
          Bulk Actions
        </button>
      </div>

      {/* Table Header */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200 dark:border-gray-600 rounded-lg">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[200px]">
                Item Details
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[120px]">
                Manufacturer <Info className="w-3 h-3 inline ml-1" />
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                Lead Time
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                Condition
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                Quantity
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                Rate <Info className="w-3 h-3 inline ml-1" />
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[80px]">
                VAT
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider min-w-[100px]">
                Amount
              </th>
              <th className="px-4 py-3 w-8"></th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
            {lineItems.map((item, index) => (
              <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-600 rounded border-2 border-dashed border-gray-300 dark:border-gray-500 flex items-center justify-center">
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21,15 16,10 5,21"></polyline>
                      </svg>
                    </div>
                    <input
                      type="text"
                      value={item.item_details}
                      onChange={(e) => onUpdateLineItem(item.id, 'item_details', e.target.value)}
                      placeholder="Type or click to select an item."
                      className="flex-1 text-sm border-none bg-transparent text-gray-500 dark:text-gray-400 focus:outline-none"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={item.manufacturer}
                    onChange={(e) => onUpdateLineItem(item.id, 'manufacturer', e.target.value)}
                    className="w-full text-sm border-none bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
                  >
                    <option value="">Select</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="text"
                    value={item.lead_time}
                    onChange={(e) => onUpdateLineItem(item.id, 'lead_time', e.target.value)}
                    className="w-full text-sm border-none bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none text-center"
                  />
                </td>
                <td className="px-4 py-3">
                  <select 
                    value={item.condition}
                    onChange={(e) => onUpdateLineItem(item.id, 'condition', e.target.value)}
                    className="w-full text-sm border-none bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
                  >
                    <option value="">Select</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => onUpdateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="w-full text-sm border-none bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none text-right"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <input
                    type="number"
                    value={item.rate}
                    onChange={(e) => onUpdateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    step="0.01"
                    className="w-full text-sm border-none bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none text-right"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <select 
                    value={item.vat}
                    onChange={(e) => onUpdateLineItem(item.id, 'vat', parseFloat(e.target.value) || 0)}
                    className="w-full text-sm border-none bg-transparent text-gray-900 dark:text-gray-100 focus:outline-none"
                  >
                    <option value={0}>Select a VAT</option>
                    <option value={0}>0%</option>
                    <option value={20}>20%</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {item.amount.toFixed(2)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {index > 0 && (
                    <button
                      type="button"
                      onClick={() => onRemoveRow(item.id)}
                      className="text-red-500 hover:text-red-700 text-sm"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Row Buttons */}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onAddRow}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add New Row
        </button>
        <button
          type="button"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <Plus className="w-4 h-4" />
          Add Items in Bulk
        </button>
      </div>
    </div>
  );
};