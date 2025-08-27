import React, { useState } from 'react';
import { DataTable, type TableColumn } from '@/finance-inventory-shared/table/DataTable';
import { PriceListFormData } from '../api';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { getApiBaseUrl } from '@/utils/tenant';
import { Plus } from 'lucide-react';

// Product interface based on backend Product model
interface Product {
  product_id: number;
  name: string;
  sku?: string;
  price: number;
  unit?: string;
  type: 'inventory' | 'non-inventory' | 'service';
}

interface VolumeRange {
  id: string;
  startQuantity: string;
  endQuantity: string;
  customRate: string;
}

interface ItemsTableSectionProps {
  formData: PriceListFormData;
  itemValues: {
    [itemId: string]: {
      customRate?: string;
      discount?: string;
      volumeRanges?: VolumeRange[];
    };
  };
  onCustomRateChange: (itemId: string, value: string) => void;
  onDiscountChange: (itemId: string, value: string) => void;
}

export const ItemsTableSection: React.FC<ItemsTableSectionProps> = ({
  formData,
  itemValues,
  onCustomRateChange,
  onDiscountChange,
}) => {
  const [volumeRanges, setVolumeRanges] = useState<{[itemId: string]: VolumeRange[]}>({});
  
  // Fetch products from inventory API
  const { data: productsData, isLoading: isLoadingProducts, error: productsError } = useQuery({
    queryKey: ['inventory-products'],
    queryFn: async () => {
      const baseUrl = getApiBaseUrl();
      const response = await axios.get(`${baseUrl}/api/inventory/products/`, {
        params: { page_size: 100 },
        withCredentials: true,
      });
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Debug logging
  console.log('ItemsTableSection - formData:', formData);
  console.log('ItemsTableSection - pricingScheme:', formData.pricingScheme);
  console.log('ItemsTableSection - priceListType:', formData.priceListType);

  // Only show this section for individual items
  if (formData.priceListType !== 'individual_items') {
    return null;
  }

  const addNewRange = (itemId: string) => {
    const newRange: VolumeRange = {
      id: `${itemId}_${Date.now()}`,
      startQuantity: '',
      endQuantity: '',
      customRate: ''
    };

    setVolumeRanges(prev => ({
      ...prev,
      [itemId]: [...(prev[itemId] || []), newRange]
    }));
  };

  const updateVolumeRange = (itemId: string, rangeId: string, field: keyof VolumeRange, value: string) => {
    setVolumeRanges(prev => ({
      ...prev,
      [itemId]: prev[itemId]?.map(range => 
        range.id === rangeId ? { ...range, [field]: value } : range
      ) || []
    }));
  };

  const removeVolumeRange = (itemId: string, rangeId: string) => {
    setVolumeRanges(prev => ({
      ...prev,
      [itemId]: prev[itemId]?.filter(range => range.id !== rangeId) || []
    }));
  };

  const getItemsTableColumns = (): TableColumn[] => {
    // For Volume Pricing, show different columns
    if (formData.pricingScheme === 'volume_pricing') {
      return [
        {
          key: 'code',
          label: 'ITEM DETAILS',
          sortable: false,
          width: '25%',
          align: 'left',
          locked: true,
          render: (value: string, row: any) => (
            <div className="flex items-center gap-2">
              <span className="font-medium">{value}</span>
              <button className="text-blue-600 hover:text-blue-700">
                <span className="text-xs">❓</span>
              </button>
            </div>
          )
        },
        {
          key: 'rate',
          label: 'SALES RATE',
          sortable: false,
          width: '15%',
          align: 'right',
          render: (value: string) => (
            <span className="font-medium">{value}</span>
          )
        },
        {
          key: 'startQuantity',
          label: 'START QUANTITY',
          sortable: false,
          width: '15%',
          align: 'center',
          render: (value: any, row: any) => (
            <div className="text-center">
              {volumeRanges[row.id]?.length ? (
                volumeRanges[row.id].map((range, index) => (
                  <div key={range.id} className={index > 0 ? 'mt-2' : ''}>
                    <input
                      type="number"
                      value={range.startQuantity}
                      onChange={(e) => updateVolumeRange(row.id, range.id, 'startQuantity', e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                      placeholder="0"
                    />
                  </div>
                ))
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          )
        },
        {
          key: 'endQuantity',
          label: 'END QUANTITY',
          sortable: false,
          width: '15%',
          align: 'center',
          render: (value: any, row: any) => (
            <div className="text-center">
              {volumeRanges[row.id]?.length ? (
                volumeRanges[row.id].map((range, index) => (
                  <div key={range.id} className={index > 0 ? 'mt-2' : ''}>
                    <input
                      type="number"
                      value={range.endQuantity}
                      onChange={(e) => updateVolumeRange(row.id, range.id, 'endQuantity', e.target.value)}
                      className="w-20 px-2 py-1 text-sm border border-gray-300 rounded text-center"
                      placeholder="∞"
                    />
                  </div>
                ))
              ) : (
                <span className="text-gray-400">-</span>
              )}
            </div>
          )
        },
        {
          key: 'customRate',
          label: 'CUSTOM RATE',
          sortable: false,
          width: '30%',
          align: 'right',
          render: (value: any, row: any) => (
            <div className="flex flex-col items-end gap-2">
              {volumeRanges[row.id]?.length ? (
                volumeRanges[row.id].map((range, index) => (
                  <div key={range.id} className="flex items-center gap-1">
                    <span className="text-sm">£</span>
                    <input
                      type="text"
                      value={range.customRate}
                      onChange={(e) => updateVolumeRange(row.id, range.id, 'customRate', e.target.value)}
                      className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                      placeholder="0.00"
                    />
                  </div>
                ))
              ) : (
                <div className="flex items-center gap-1">
                  <span className="text-sm">£</span>
                  <input
                    type="text"
                    className="w-24 px-2 py-1 text-sm border border-gray-300 rounded text-right"
                    placeholder="0.00"
                    disabled
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => addNewRange(row.id)}
                className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
              >
                <Plus className="w-4 h-4" />
                Add New Range
              </button>
            </div>
          )
        }
      ];
    }

    // For Unit Pricing (original layout)
    const columns: TableColumn[] = [
      {
        key: 'code',
        label: 'Item Details',
        sortable: false,
        width: '35%',
        align: 'left',
        locked: true,
        render: (value: string) => (
          <div className="flex items-center gap-2">
            <span>{value}</span>
            <button className="text-blue-600 hover:text-blue-700">
              <span className="text-xs">🔍</span>
            </button>
          </div>
        )
      },
      {
        key: 'rate',
        label: 'Sales Rate',
        sortable: false,
        width: '20%',
        align: 'right'
      },
      {
        key: 'customRate',
        label: 'Custom Rate',
        sortable: false,
        width: '20%',
        align: 'right',
        render: (value: any, row: any) => (
          <div className="flex items-center justify-end gap-1">
            <span className="text-sm text-gray-900 dark:text-gray-100">£</span>
            <input
              type="text"
              value={itemValues[row.id]?.customRate || ''}
              onChange={(e) => onCustomRateChange(row.id, e.target.value)}
              className="w-24 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-right"
              placeholder="0.00"
            />
          </div>
        )
      }
    ];

    if (formData.includeDiscount) {
      columns.push({
        key: 'discount',
        label: 'Discount (%)',
        sortable: false,
        width: '25%',
        align: 'right',
        render: (value: any, row: any) => (
          <div className="flex items-center justify-end gap-1">
            <input
              type="text"
              value={itemValues[row.id]?.discount || ''}
              onChange={(e) => onDiscountChange(row.id, e.target.value)}
              className="w-16 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-right"
              placeholder="0"
            />
            <span className="text-sm text-gray-900 dark:text-gray-100">%</span>
          </div>
        )
      });
    }

    return columns;
  };

  const getItemsTableData = () => {
    if (!productsData?.results) return [];
    
    return productsData.results.map((product: Product) => ({
      id: product.product_id,
      code: product.sku || product.name,
      rate: `£${product.price?.toLocaleString() || '0.00'}`,
      customRate: '', // This will be rendered by the custom render function
      discount: '' // This will be rendered by the custom render function if discount is enabled
    }));
  };

  return (
    <div className="col-span-full border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
          Customise Rates in Bulk
        </h3>
        <div className="flex items-center gap-4">
          <button
            type="button"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            📤 Update Rates in Bulk
          </button>
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            Import Price List for Items
            <input
              type="checkbox"
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </div>

      {/* Products Table */}
      <div className="w-full">
        {isLoadingProducts ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-gray-500 dark:text-gray-400">Loading products...</div>
          </div>
        ) : productsError ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-sm text-red-500">Error loading products: {productsError.message}</div>
          </div>
        ) : (
          <DataTable
            columns={getItemsTableColumns()}
            data={getItemsTableData()}
            showCheckboxes={false}
            showActions={false}
            enableColumnCustomization={false}
            emptyMessage="No products available in inventory"
            className="w-full"
          />
        )}
      </div>

      {/* Discount Information */}
      {formData.includeDiscount && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-start gap-2">
            <div className="text-blue-600 dark:text-blue-400 mt-0.5">
              <span className="text-sm">ℹ️</span>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-200">
              When a price list is applied, the discount percentage will be applied only if discount is enabled at the line-item level
            </p>
          </div>
        </div>
      )}
    </div>
  );
};