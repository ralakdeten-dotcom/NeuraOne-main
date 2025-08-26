import React from 'react';
import { type FinanceItem } from '../api';

interface HistoryTabProps {
  item: FinanceItem;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ item }) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        No history records found for this item.
      </div>
    </div>
  );
};