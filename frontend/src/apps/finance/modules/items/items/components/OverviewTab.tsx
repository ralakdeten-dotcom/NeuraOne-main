import React, { useState, useRef } from 'react';
import { ZoomIn, Trash2, X } from 'lucide-react';
import { type FinanceItem } from '../api';

interface OverviewTabProps {
  item: FinanceItem;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ item }) => {
  // Generate unique storage key for this item using item_id (UUID)
  const storageKey = `finance_item_image_${item.item_id}_${item.name.replace(/[^a-zA-Z0-9]/g, '_')}`;
  
  // Initialize with localStorage value if available, otherwise use item.image_name
  const [selectedImage, setSelectedImage] = useState<string | null>(() => {
    const storedImage = localStorage.getItem(storageKey);
    return storedImage || item.image_name || null;
  });
  
  const [isDragOver, setIsDragOver] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addImages = (files: File[], replace = false) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length === 0) return;
    
    const file = imageFiles[0]; // Only take first image
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImage(result);
      // Save to localStorage for persistence
      localStorage.setItem(storageKey, result);
    };
    reader.readAsDataURL(file);
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    addImages(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    addImages(files);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setSelectedImage(null);
    // Remove from localStorage
    localStorage.removeItem(storageKey);
  };

  const handleZoomImage = (imageUrl: string) => {
    setZoomedImage(imageUrl);
  };

  const closeZoom = () => {
    setZoomedImage(null);
  };

  // Helper function to display item type properly
  const getItemTypeDisplay = () => {
    switch(item.item_type) {
      case 'inventory': return 'Inventory Item';
      case 'sales': return 'Sales Item';
      case 'purchases': return 'Purchase Item';
      case 'sales_and_purchases': return 'Sales and Purchase Item';
      default: return item.item_type;
    }
  };

  // Helper function to display product type
  const getProductTypeDisplay = () => {
    return item.product_type === 'goods' ? 'Goods' : 'Service';
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Left Column - Item Details */}
      <div className="space-y-8">
        {/* Basic Information */}
        <div>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Item Type</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {getItemTypeDisplay()}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Product Type</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {getProductTypeDisplay()}
              </span>
            </div>
            {item.sku && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">SKU</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.sku}
                </span>
              </div>
            )}
            {item.mpn && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Manufacturer Part Number</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.mpn}
                </span>
              </div>
            )}
            {item.group_name && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Group</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.group_name}
                </span>
              </div>
            )}
            {item.vendor_name && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Preferred Vendor</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.vendor_name}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Unit</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {item.unit}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
              <span className={`text-sm font-medium ${
                item.status === 'active' ? 'text-green-600' : 'text-gray-500'
              }`}>
                {item.status === 'active' ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Purchase Information */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Purchase Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Cost Price</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                £{(Number(item.purchase_rate) || 0).toFixed(2)}
              </span>
            </div>
            {item.purchase_account_name && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Purchase Account</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.purchase_account_name}
                </span>
              </div>
            )}
            {item.purchase_description && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Purchase Description</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {item.purchase_description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Sales Information */}
        <div>
          <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Sales Information</h3>
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Selling Price</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                £{(Number(item.rate) || 0).toFixed(2)}
              </span>
            </div>
            {item.account_name && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Sales Account</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.account_name}
                </span>
              </div>
            )}
            {item.sales_description && (
              <div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Sales Description</span>
                <p className="text-sm text-gray-900 dark:text-white mt-1">
                  {item.sales_description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Inventory Information */}
        {item.item_type === 'inventory' && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Inventory Information</h3>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Stock on Hand</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.stock_on_hand} {item.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Available Stock</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.available_stock} {item.unit}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Reorder Level</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {item.reorder_level} {item.unit}
                </span>
              </div>
              {item.is_low_stock && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    ⚠️ Low stock alert: Current stock is below reorder level
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Physical Attributes */}
        {(item.weight || item.length || item.width || item.height) && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Physical Attributes</h3>
            <div className="space-y-4">
              {item.weight && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Weight</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.weight} {item.weight_unit || 'kg'}
                  </span>
                </div>
              )}
              {(item.length || item.width || item.height) && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Dimensions (L×W×H)</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.length || 0} × {item.width || 0} × {item.height || 0} {item.dimension_unit || 'cm'}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Identifiers */}
        {(item.upc || item.ean || item.isbn) && (
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Product Identifiers</h3>
            <div className="space-y-4">
              {item.upc && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">UPC</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.upc}
                  </span>
                </div>
              )}
              {item.ean && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">EAN</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.ean}
                  </span>
                </div>
              )}
              {item.isbn && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500 dark:text-gray-400">ISBN</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.isbn}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right Column - Image Upload */}
      <div className="flex justify-center">
        <div 
          className={`w-64 h-48 border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
            !selectedImage ? 'cursor-pointer' : ''
          } ${
            isDragOver 
              ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 bg-gray-50 dark:bg-gray-700'
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={selectedImage ? undefined : handleBrowseClick}
        >
          {selectedImage ? (
            <div className="h-full flex flex-col">
              <div className="flex-1 mb-2 bg-white dark:bg-gray-800 rounded overflow-hidden relative group">
                <img 
                  src={selectedImage} 
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleZoomImage(selectedImage);
                  }}
                  className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center w-full h-full"
                >
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white bg-opacity-90 rounded-full p-2 hover:bg-opacity-100">
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                  </div>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBrowseClick();
                  }}
                  className="text-blue-600 dark:text-blue-400 text-xs hover:underline"
                >
                  Change Image
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage();
                  }}
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="w-8 h-8 text-gray-400 mx-auto mb-2">
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21,15 16,10 5,21"></polyline>
                </svg>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                Drag image(s) here or
              </p>
              <span className="text-blue-600 dark:text-blue-400 text-xs hover:underline">
                Browse images
              </span>
            </>
          )}
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </div>
    </div>
    {/* Image Zoom Modal */}
    {zoomedImage && (
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        onClick={closeZoom}
      >
        <div 
          className="relative bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={closeZoom}
            className="absolute top-4 right-4 bg-gray-800 bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-2 z-10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="p-6">
            <img 
              src={zoomedImage}
              alt="Zoomed image"
              className="w-full h-auto max-h-[80vh] object-contain"
            />
          </div>
        </div>
      </div>
    )}
    </>
  );
};