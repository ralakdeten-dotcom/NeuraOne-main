import React from 'react';
import { X, Edit, ChevronDown } from 'lucide-react';
import { type FinanceItemListItem } from '../api';

interface ItemDetailHeaderProps {
  item: FinanceItemListItem;
  activeTab: 'overview' | 'warehouses' | 'transactions' | 'history';
  onTabChange: (tab: 'overview' | 'warehouses' | 'transactions' | 'history') => void;
  onClose: () => void;
  onEdit?: () => void;
}

export const ItemDetailHeader: React.FC<ItemDetailHeaderProps> = ({ 
  item, 
  activeTab, 
  onTabChange, 
  onClose,
  onEdit
}) => {
  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'warehouses', label: 'Warehouses' },
    { key: 'transactions', label: 'Transactions' },
    { key: 'history', label: 'History' }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {item.sku || item.name}
        </h1>
        <div className="flex items-center gap-2">
          <button 
            onClick={onEdit}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button className="px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded transition-colors">
            Adjust Stock
          </button>
          <button className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-1">
            More
            <ChevronDown className="w-3 h-3" />
          </button>
          <button 
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex mt-4 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onTabChange(tab.key as any)}
            className={`px-0 py-2 mr-8 text-sm font-medium border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'text-blue-500 border-blue-500'
                : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};