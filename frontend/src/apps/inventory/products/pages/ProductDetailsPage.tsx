import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePermissions } from '@/core/auth/usePermissions'
import { LoadingSpinner, ErrorAlert, TitleBox } from '@/shared'
import { TabContainer } from '@/shared/components/templates'
import { AttachmentsTab } from '@/shared/components/attachments'
import { InlineEditableField, InlineEditableSelect, InlineEditableLink } from '@/shared/components/inline-edit/InlineEditableField'
import { useProduct, useDeleteProduct, useUpdateProduct, PRODUCT_TYPE_OPTIONS, PRODUCT_CONDITION_OPTIONS, BILLING_FREQUENCY_OPTIONS } from '../api'
import { ProductFormModal } from '../components/ProductFormModal'

interface ProductDetailsPageProps {
  productId: number
}

export const ProductDetailsPage: React.FC<ProductDetailsPageProps> = ({ productId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'attachments' | 'related'>('overview')
  const [isEditModalOpen, setEditModalOpen] = useState(false)
  
  const navigate = useNavigate()
  const permissions = usePermissions()
  
  const { data: product, isLoading, error, refetch } = useProduct(productId)
  const deleteProduct = useDeleteProduct()
  const updateProduct = useUpdateProduct()
  
  // Permission checks
  const canManageProducts = permissions.hasPermission('manage_products') || permissions.hasPermission('all')
  const canViewProducts = canManageProducts || permissions.hasPermission('view_products')
  
  
  const handleDelete = async () => {
    if (!product) return
    
    if (window.confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      try {
        await deleteProduct.mutateAsync(product.product_id)
        alert('Product deleted successfully')
        navigate('/finance/products')
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting product: ${errorMessage}`)
      }
    }
  }
  
  const handleEdit = () => {
    setEditModalOpen(true)
  }

  const handleFieldUpdate = async (field: string, value: any) => {
    if (!product) return
    
    try {
      await updateProduct.mutateAsync({
        id: product.product_id,
        data: { [field]: value }
      })
    } catch (error: any) {
      throw new Error(error.message || `Failed to update ${field}`)
    }
  }
  
  // Permission check
  if (!canViewProducts) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view this product.
          </p>
        </div>
      </div>
    )
  }
  
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <LoadingSpinner />
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <ErrorAlert message={String(error)} />
      </div>
    )
  }
  
  if (!product) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Product Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            The product you're looking for doesn't exist or has been deleted.
          </p>
          <button 
            onClick={() => navigate('/finance/products')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
          >
            Back to Products
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="w-full p-6">
      

      {/* Title Box */}
      <TitleBox>
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.name}
                  className="h-12 w-12 rounded-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    target.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <span className={`text-white font-bold text-lg ${product.image_url ? 'hidden' : ''}`}>
                {product.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-baseline space-x-2">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {product.name}
                </h1>
                {product.sku && (
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    (SKU: {product.sku})
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                {product.manufacturer && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                    {product.manufacturer}
                  </span>
                )}
                {product.category && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                    {product.category}
                  </span>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  {product.type.charAt(0).toUpperCase() + product.type.slice(1).replace('-', ' ')}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  {product.product_condition.charAt(0).toUpperCase() + product.product_condition.slice(1)}
                </span>
              </div>
            </div>
          </div>
          {/* Actions */}
          {canManageProducts && (
            <div className="flex space-x-2">
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white rounded-md transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteProduct.isPending}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white rounded-md transition-colors disabled:opacity-50"
              >
                {deleteProduct.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          )}
        </div>
      </TitleBox>
      
      {/* Tab Container */}
      <div className="mb-6 min-h-[600px]">
        <TabContainer
          tabs={[
            { 
              key: 'overview', 
              label: 'Overview', 
              content: (
                <div>
                  <style>{`
                    .inline-field-horizontal {
                      display: flex !important;
                      flex-direction: row !important;
                      align-items: center !important;
                      gap: 1rem !important;
                    }
                    .inline-field-horizontal > label {
                      min-width: 6rem !important;
                      flex-shrink: 0 !important;
                      margin-bottom: 0 !important;
                    }
                    .inline-field-horizontal > div:last-child {
                      flex: 1 !important;
                    }
                  `}</style>
                  <div className="space-y-8">
                    {/* Product Information */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <InlineEditableField
                          label="Name"
                          value={product.name}
                          onSave={(value) => handleFieldUpdate('name', value)}
                          required
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableField
                          label="SKU"
                          value={product.sku}
                          onSave={(value) => handleFieldUpdate('sku', value || null)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableField
                          label="Manufacturer"
                          value={product.manufacturer}
                          onSave={(value) => handleFieldUpdate('manufacturer', value || null)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableField
                          label="Category"
                          value={product.category}
                          onSave={(value) => handleFieldUpdate('category', value || null)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableField
                          label="Part Number"
                          value={product.part_number}
                          onSave={(value) => handleFieldUpdate('part_number', value || null)}
                          disabled={!canManageProducts}
                          renderValue={(val) => val ? <span className="font-mono">{val}</span> : undefined}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableSelect
                          label="Type"
                          value={product.type}
                          options={PRODUCT_TYPE_OPTIONS}
                          onSave={(value) => handleFieldUpdate('type', value)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableSelect
                          label="Condition"
                          value={product.product_condition}
                          options={PRODUCT_CONDITION_OPTIONS}
                          onSave={(value) => handleFieldUpdate('product_condition', value)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />

                        <InlineEditableField
                          label="Unit"
                          value={product.unit}
                          onSave={(value) => handleFieldUpdate('unit', value || null)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                      </div>
                    </div>

                    {/* Pricing & Inventory */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing & Inventory</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <InlineEditableField
                          label="Base Price"
                          value={product.price}
                          type="number"
                          onSave={(value) => handleFieldUpdate('price', parseFloat(value) || 0)}
                          disabled={!canManageProducts}
                          formatter={(val) => `$${Number(val || 0).toFixed(2)}`}
                          parser={(val) => val.replace('$', '')}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableField
                          label="Current Price"
                          value={product.current_price}
                          type="number"
                          onSave={(value) => handleFieldUpdate('current_price', value ? parseFloat(value) : null)}
                          disabled={!canManageProducts}
                          formatter={(val) => val ? `$${Number(val).toFixed(2)}` : ''}
                          parser={(val) => val.replace('$', '')}
                          renderValue={(val) => val ? (
                            <span className="text-blue-600 dark:text-blue-400 font-medium">
                              ${Number(val).toFixed(2)}
                            </span>
                          ) : undefined}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableField
                          label="Unit Cost"
                          value={product.unit_cost}
                          type="number"
                          onSave={(value) => handleFieldUpdate('unit_cost', value ? parseFloat(value) : null)}
                          disabled={!canManageProducts}
                          formatter={(val) => val ? `$${Number(val).toFixed(2)}` : ''}
                          parser={(val) => val.replace('$', '')}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableField
                          label="Stock"
                          value={product.stock}
                          type="number"
                          onSave={(value) => handleFieldUpdate('stock', parseInt(value) || 0)}
                          disabled={!canManageProducts}
                          formatter={(val) => `${val} units`}
                          parser={(val) => val.replace(' units', '')}
                          renderValue={(val) => (
                            <span className={`font-medium ${
                              val === 0 
                                ? 'text-red-600 dark:text-red-400' 
                                : val < 10
                                ? 'text-yellow-600 dark:text-yellow-400'
                                : 'text-green-600 dark:text-green-400'
                            }`}>
                              {val} units
                            </span>
                          )}
                          className="inline-field-horizontal"
                        />
                        
                        {product.margin !== undefined && (
                          <div className="inline-field-horizontal">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[8rem] flex-shrink-0 mr-4">Margin</label>
                            <div className={`font-medium ${
                              (product.margin || 0) >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              ${Number(product.margin || 0).toFixed(2)}
                            </div>
                          </div>
                        )}
                        
                        {product.margin_percentage !== undefined && (
                          <div className="inline-field-horizontal">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[8rem] flex-shrink-0 mr-4">Margin %</label>
                            <div className={`font-medium ${
                              (product.margin_percentage || 0) >= 0 
                                ? 'text-green-600 dark:text-green-400' 
                                : 'text-red-600 dark:text-red-400'
                            }`}>
                              {Number(product.margin_percentage || 0).toFixed(1)}%
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Vendor Information */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Vendor Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <InlineEditableField
                          label="Vendor"
                          value={product.vendor_name}
                          onSave={(value) => handleFieldUpdate('vendor_name', value || null)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableField
                          label="Vendor Price"
                          value={product.vendor_price}
                          type="number"
                          onSave={(value) => handleFieldUpdate('vendor_price', value ? parseFloat(value) : null)}
                          disabled={!canManageProducts}
                          formatter={(val) => val ? `$${Number(val).toFixed(2)}` : ''}
                          parser={(val) => val.replace('$', '')}
                          className="inline-field-horizontal"
                        />
                      </div>
                    </div>

                    {/* Billing Information */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Billing Information</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                        <InlineEditableSelect
                          label="Billing Frequency"
                          value={product.billing_frequency}
                          options={BILLING_FREQUENCY_OPTIONS}
                          onSave={(value) => handleFieldUpdate('billing_frequency', value)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableField
                          label="Term"
                          value={product.term}
                          onSave={(value) => handleFieldUpdate('term', value || null)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h3>
                      <div className="space-y-2">
                        <InlineEditableField
                          label="Description"
                          value={product.description}
                          type="textarea"
                          onSave={(value) => handleFieldUpdate('description', value || null)}
                          disabled={!canManageProducts}
                          renderValue={(val) => val ? (
                            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{val}</p>
                          ) : undefined}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableLink
                          label="Product URL"
                          value={product.url}
                          type="url"
                          onSave={(value) => handleFieldUpdate('url', value || null)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                        
                        <InlineEditableLink
                          label="Image URL"
                          value={product.image_url}
                          type="url"
                          onSave={(value) => handleFieldUpdate('image_url', value || null)}
                          disabled={!canManageProducts}
                          className="inline-field-horizontal"
                        />
                        
                        {product.image_url && (
                          <div className="inline-field-horizontal">
                            <label className="text-sm font-medium text-gray-500 dark:text-gray-400 min-w-[8rem] flex-shrink-0 mr-4">Preview</label>
                            <div className="max-w-xs">
                              <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-auto max-h-32 object-contain rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement
                                  target.style.display = 'none'
                                  target.nextElementSibling?.classList.remove('hidden')
                                }}
                              />
                              <div className="hidden w-full h-20 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center">
                                <span className="text-gray-500 dark:text-gray-400 text-sm">Image not available</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            },
            { 
              key: 'attachments', 
              label: 'Attachments', 
              content: <AttachmentsTab entityType="product" entityId={productId} />
            },
            { 
              key: 'related', 
              label: 'Related', 
              content: (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Related Information
                  </h3>
                  <div className="text-center py-12">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                      Coming Soon
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      Related deals, orders, and analytics will be displayed here.
                    </p>
                  </div>
                </div>
              )
            }
          ]}
          activeTab={activeTab}
          onTabChange={(tabKey: string) => setActiveTab(tabKey as 'overview' | 'attachments' | 'related')}
        />
      </div>
      
      {/* Edit Modal */}
      <ProductFormModal
        isOpen={isEditModalOpen}
        onClose={() => setEditModalOpen(false)}
        product={product}
        onSuccess={() => {
          setEditModalOpen(false)
          refetch()
        }}
      />
    </div>
  )
}