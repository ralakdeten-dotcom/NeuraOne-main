import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MoreHorizontal } from 'lucide-react';
import { type FinanceItemListItem } from '../api';

interface ItemsSidebarProps {
  items: FinanceItemListItem[];
  currentItemId?: string;
}

export const ItemsSidebar: React.FC<ItemsSidebarProps> = ({ items, currentItemId }) => {
  const navigate = useNavigate();

  return (
    <div className="w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Sidebar Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-medium text-gray-900 dark:text-white">All Items</h2>
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => navigate('/finance/items/new')}
            className="w-7 h-7 bg-blue-500 text-white rounded text-sm flex items-center justify-center hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button className="w-7 h-7 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Items List */}
      <div className="flex-1 overflow-y-auto">
        {items.map((listItem: FinanceItemListItem) => {
          const isSelected = String(listItem.item_id) === String(currentItemId);
          const isInactive = Number(listItem.stock_on_hand) === 0 || !listItem.stock_on_hand;
          
          return (
            <div
              key={listItem.item_id}
              onClick={() => navigate(`/finance/items/${listItem.item_id}`)}
              className={`flex items-center px-4 py-3 border-b border-gray-100 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
              }`}
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mr-3">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>

              {/* Item Info */}
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${
                  isSelected ? 'text-blue-600' : 'text-gray-900 dark:text-white'
                }`}>
                  {listItem.sku || listItem.name}
                </div>
              </div>

              {/* Price and Status */}
              <div className="flex-shrink-0 text-right">
                <div className={`text-sm font-medium ${
                  isSelected ? 'text-blue-600' : 'text-gray-900 dark:text-white'
                }`}>
                  £{(Number(listItem.rate) || 0).toFixed(2)}
                </div>
                {isInactive && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    INACTIVE
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};