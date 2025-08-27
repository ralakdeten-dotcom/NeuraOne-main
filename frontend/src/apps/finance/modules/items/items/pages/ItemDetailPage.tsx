import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useFinanceItem, useFinanceItems, type FinanceItem, type FinanceItemListItem } from '../../api/ItemsAPI';
import { ItemsSidebar } from '../components/ItemsSidebar';
import { ItemDetailHeader } from '../components/ItemDetailHeader';
import { ItemDetailContent } from '../components/ItemDetailContent';

interface ItemDetailPageProps {
  isOpen?: boolean;
  onClose?: () => void;
  itemId?: string;
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({ 
  isOpen = true, 
  onClose,
  itemId: propItemId 
}) => {
  const { id: paramItemId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const itemId = propItemId || paramItemId;
  
  // Use the proper detail API for the current item
  const { data: item, isLoading: itemLoading } = useFinanceItem(itemId || '');
  
  // Also get the list for the sidebar
  const { data: itemsData, isLoading: itemsLoading } = useFinanceItems(1, 100);

  const [activeTab, setActiveTab] = useState<'overview' | 'warehouses' | 'transactions' | 'history'>('overview');

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/finance/items');
    }
  };

  const handleEdit = () => {
    navigate(`/finance/items/${itemId}/edit`);
  };

  if (itemLoading || itemsLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-lg font-semibold mb-4">Loading...</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Loading item details...
          </p>
        </div>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md mx-4">
          <h2 className="text-lg font-semibold mb-4">Item Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            The item with ID "{itemId}" was not found.
          </p>
          <button 
            onClick={handleClose}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Convert full item to list item format for components that expect it
  const displayItem: FinanceItemListItem = {
    item_id: item.item_id,
    name: item.name,
    sku: item.sku,
    item_type: item.item_type,
    product_type: item.product_type,
    rate: item.rate,
    purchase_rate: item.purchase_rate,
    stock_on_hand: item.stock_on_hand,
    status: item.status,
    group_name: item.group_name || null,
    vendor_name: item.vendor_name || null,
    is_low_stock: item.is_low_stock || false,
    unit: item.unit,
    reorder_level: item.reorder_level,
    mpn: item.mpn,
    weight: item.weight,
    weight_unit: item.weight_unit,
    sales_description: item.sales_description,
    purchase_description: item.purchase_description,
    image_name: item.image_name
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Left Sidebar */}
      <ItemsSidebar 
        items={itemsData?.results || []} 
        currentItemId={itemId} 
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-800">
        {/* Header */}
        <ItemDetailHeader 
          item={displayItem}
          activeTab={activeTab}
          onTabChange={setActiveTab}
          onClose={handleClose}
          onEdit={handleEdit}
        />

        {/* Content - pass the full item data */}
        <ItemDetailContent 
          item={item}
          activeTab={activeTab}
        />
      </div>
    </div>
  );
};