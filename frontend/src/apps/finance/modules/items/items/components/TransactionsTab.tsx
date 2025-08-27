import React from 'react';
import { type FinanceItem } from '../api';

interface TransactionsTabProps {
  item: FinanceItem;
}

export const TransactionsTab: React.FC<TransactionsTabProps> = ({ item }) => {
  return (
    <div className="text-center py-12">
      <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <div className="text-gray-500 dark:text-gray-400 text-sm">
        There are no transactions available
      </div>
    </div>
  );
};