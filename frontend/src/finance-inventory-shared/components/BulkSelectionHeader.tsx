import React from 'react';
import { X, ChevronDown } from 'lucide-react';

interface BulkSelectionHeaderProps {
  selectedCount: number;
  onClearSelection: () => void;
  bulkActions?: Array<{
    label: string;
    action: string;
    icon?: React.ReactNode;
  }>;
  onBulkAction?: (action: string) => void;
}

export const BulkSelectionHeader: React.FC<BulkSelectionHeaderProps> = ({
  selectedCount,
  onClearSelection,
  bulkActions = [],
  onBulkAction
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  console.log('BulkSelectionHeader rendered with selectedCount:', selectedCount);
  console.log('BulkSelectionHeader props:', { selectedCount, bulkActions: bulkActions.length });

  if (selectedCount === 0) {
    console.log('BulkSelectionHeader: returning null because selectedCount is 0');
    return null;
  }
  
  console.log('BulkSelectionHeader: rendering component');

  return (
    <div className="absolute top-0 left-0 right-0 z-40 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Individual action buttons */}
          <button className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
            Bulk Update
          </button>
          
          <div className="relative">
            <button 
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
            >
              New Transaction
              <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg min-w-48 z-10">
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white first:rounded-t-md transition-colors">
                  Quote
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white transition-colors">
                  Sales Order
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white transition-colors">
                  Invoice
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white transition-colors">
                  Purchase Order
                </button>
                <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-500 hover:text-white last:rounded-b-md transition-colors">
                  Bill
                </button>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => onBulkAction?.('mark_active')}
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            Mark as Active
          </button>
          
          <button 
            onClick={() => onBulkAction?.('mark_inactive')}
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            Mark as Inactive
          </button>
          
          <button 
            onClick={() => onBulkAction?.('delete')}
            className="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors"
          >
            Delete
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {selectedCount} Selected
          </span>
          
          <button
            onClick={onClearSelection}
            className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <span>Esc</span>
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};