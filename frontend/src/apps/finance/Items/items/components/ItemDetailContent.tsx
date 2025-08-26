import React from 'react';
import { type FinanceItem } from '../api';
import { OverviewTab } from './OverviewTab';
import { WarehousesTab } from './WarehousesTab';
import { TransactionsTab } from './TransactionsTab';
import { HistoryTab } from './HistoryTab';

interface ItemDetailContentProps {
  item: FinanceItem;
  activeTab: 'overview' | 'warehouses' | 'transactions' | 'history';
}

export const ItemDetailContent: React.FC<ItemDetailContentProps> = ({ item, activeTab }) => {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      {activeTab === 'overview' && <OverviewTab item={item} />}
      {activeTab === 'warehouses' && <WarehousesTab item={item} />}
      {activeTab === 'transactions' && <TransactionsTab item={item} />}
      {activeTab === 'history' && <HistoryTab item={item} />}
    </div>
  );
};