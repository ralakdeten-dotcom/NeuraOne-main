import React, { useState, useCallback, useMemo } from 'react'
import { 
  Trash2, 
  Plus, 
  Edit2, 
  Package,
  X
} from 'lucide-react'
import { Button, BadgeCell, FormField } from '@/shared'

export interface LineItem {
  id: number | string
  product_id: number
  product_name: string
  product_sku?: string
  description?: string
  quantity: number | string
  unit_price: number | string
  discount_rate: number | string
  vat_rate: number | string
  vat_amount: number | string
  line_subtotal: number | string
  line_total: number | string
}

export interface LineItemFormData {
  product_id: number
  product_name?: string
  description?: string
  quantity: number
  unit_price: number
  discount_rate?: number
  vat_rate?: number
}

interface LineItemsTableProps {
  items: LineItem[]
  onAdd?: (data: LineItemFormData) => Promise<void>
  onUpdate?: (id: number | string, data: Partial<LineItemFormData>) => Promise<void>
  onDelete?: (id: number | string) => Promise<void>
  editable?: boolean
  productSelector?: React.ReactNode
  title?: string
  emptyMessage?: string
  emptyDescription?: string
  shippingFee?: number
  shippingVatRate?: number
  shippingVatAmount?: number
  rushFee?: number
  onUpdateFees?: (fees: { shipping_fee: number; shipping_vat_rate: number; rush_fee: number }) => Promise<void>
}

export const LineItemsTable: React.FC<LineItemsTableProps> = ({
  items = [],
  onAdd,
  onUpdate,
  onDelete,
  editable = true,
  productSelector,
  title = "Line Items",
  emptyMessage = "No items yet",
  emptyDescription = "Add items to get started",
  shippingFee = 0,
  shippingVatRate = 20,  // Default 20% VAT
  shippingVatAmount = 0,
  rushFee = 0,
  onUpdateFees
}) => {
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingItemId, setEditingItemId] = useState<number | string | null>(null)
  const [formData, setFormData] = useState<LineItemFormData>({
    product_id: 0,
    quantity: 1,
    unit_price: 0,
    discount_rate: 0,
    vat_rate: 0
  })
  const [editFormData, setEditFormData] = useState<Partial<LineItemFormData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // State for fees - ensure default rate is 20
  const [feeData, setFeeData] = useState({
    shipping_fee: shippingFee || 0,
    shipping_vat_rate: shippingVatRate || 20,
    rush_fee: rushFee || 0
  })
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Calculate shipping VAT
  const calculatedShippingVat = feeData.shipping_fee * (feeData.shipping_vat_rate / 100)
  
  // Handle fee changes
  const handleFeeChange = (field: string, value: number) => {
    setFeeData(prev => ({ ...prev, [field]: value }))
    setHasUnsavedChanges(true)
  }
  
  // Save fees
  const handleSaveFees = async () => {
    if (onUpdateFees) {
      await onUpdateFees(feeData)
      setHasUnsavedChanges(false)
    }
  }

  // Validation
  const validateForm = useCallback((data: Partial<LineItemFormData>): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!editingItemId && !data.product_id) {
      newErrors.product = 'Product is required'
    }
    
    if (data.quantity !== undefined && data.quantity <= 0) {
      newErrors.quantity = 'Must be > 0'
    }
    
    if (data.unit_price !== undefined && data.unit_price < 0) {
      newErrors.unit_price = 'Cannot be negative'
    }
    
    if (data.discount_rate !== undefined && (data.discount_rate < 0 || data.discount_rate > 100)) {
      newErrors.discount_rate = '0-100%'
    }
    
    if (data.vat_rate !== undefined && (data.vat_rate < 0 || data.vat_rate > 100)) {
      newErrors.vat_rate = '0-100%'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [editingItemId])

  // Handlers
  const handleAdd = useCallback(async () => {
    if (!validateForm(formData) || !onAdd) return
    
    setIsSubmitting(true)
    try {
      await onAdd(formData)
      setShowAddForm(false)
      setFormData({
        product_id: 0,
        quantity: 1,
        unit_price: 0,
        discount_rate: 0,
        vat_rate: 0
      })
      setErrors({})
    } catch (error) {
      console.error('Error adding item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, onAdd, validateForm])

  const handleEditClick = useCallback((item: LineItem) => {
    setEditingItemId(item.id)
    setEditFormData({
      quantity: typeof item.quantity === 'string' ? parseFloat(item.quantity) : item.quantity,
      unit_price: typeof item.unit_price === 'string' ? parseFloat(item.unit_price) : item.unit_price,
      discount_rate: typeof item.discount_rate === 'string' ? parseFloat(item.discount_rate) : item.discount_rate,
      vat_rate: typeof item.vat_rate === 'string' ? parseFloat(item.vat_rate) : item.vat_rate,
      description: item.description
    })
    setErrors({})
  }, [])

  const handleUpdate = useCallback(async () => {
    if (!validateForm(editFormData) || !onUpdate || !editingItemId) return
    
    setIsSubmitting(true)
    try {
      await onUpdate(editingItemId, editFormData)
      setEditingItemId(null)
      setEditFormData({})
      setErrors({})
    } catch (error) {
      console.error('Error updating item:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [editFormData, onUpdate, editingItemId, validateForm])

  const handleCancelEdit = useCallback(() => {
    setEditingItemId(null)
    setEditFormData({})
    setErrors({})
  }, [])

  const handleDelete = useCallback(async (id: number | string, name: string) => {
    if (!onDelete) return
    
    if (window.confirm(`Delete "${name}"?`)) {
      try {
        await onDelete(id)
      } catch (error) {
        console.error('Error deleting item:', error)
      }
    }
  }, [onDelete])

  // Calculations
  const totals = useMemo(() => {
    const subtotal = items.reduce((sum, item) => {
      const value = typeof item.line_subtotal === 'string' ? parseFloat(item.line_subtotal) : item.line_subtotal
      return sum + value
    }, 0)
    
    const vat = items.reduce((sum, item) => {
      const value = typeof item.vat_amount === 'string' ? parseFloat(item.vat_amount) : item.vat_amount
      return sum + value
    }, 0)
    
    const total = items.reduce((sum, item) => {
      const value = typeof item.line_total === 'string' ? parseFloat(item.line_total) : item.line_total
      return sum + value
    }, 0)
    
    return { subtotal, vat, total }
  }, [items])

  return (
    <div className="space-y-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {title}
              </h3>
              {items.length > 0 && (
                <BadgeCell value={`${items.length} items`} variant="gray" />
              )}
            </div>
            {editable && onAdd && (
              <Button 
                onClick={() => setShowAddForm(!showAddForm)} 
                size="sm"
                variant={showAddForm ? "secondary" : "primary"}
              >
                {showAddForm ? (
                  <>
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Item
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        <div className="p-6">
          {/* Add New Item Form - Inline */}
          {showAddForm && editable && (
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-2">
                  {productSelector ? (
                    React.cloneElement(productSelector as React.ReactElement, {
                      value: formData.product_id,
                      onChange: (id: number, product: any) => {
                        setFormData(prev => ({
                          ...prev,
                          product_id: id,
                          product_name: product?.name,
                          unit_price: parseFloat(product?.current_price || product?.price || 0),
                          description: product?.name
                        }))
                      },
                      error: errors.product,
                      required: true,
                      placeholder: "Select product..."
                    })
                  ) : (
                    <FormField
                      name="product_id"
                      label="Product ID"
                      type="number"
                      value={formData.product_id}
                      onChange={(_, value) => setFormData(prev => ({ 
                        ...prev, 
                        product_id: typeof value === 'string' ? parseInt(value) || 0 : value || 0 
                      }))}
                      error={errors.product}
                      required
                    />
                  )}
                </div>
                <div>
                  <FormField
                    name="quantity"
                    label="Qty"
                    type="number"
                    value={formData.quantity}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      quantity: typeof value === 'string' ? parseFloat(value) || 0 : value || 0 
                    }))}
                    error={errors.quantity}
                    min={0.01}
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <FormField
                    name="unit_price"
                    label="Price"
                    type="number"
                    value={formData.unit_price}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      unit_price: typeof value === 'string' ? parseFloat(value) || 0 : value || 0 
                    }))}
                    error={errors.unit_price}
                    min={0}
                    step="0.01"
                    required
                  />
                </div>
                <div>
                  <FormField
                    name="discount_rate"
                    label="Discount %"
                    type="number"
                    value={formData.discount_rate || 0}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      discount_rate: typeof value === 'string' ? parseFloat(value) || 0 : value || 0 
                    }))}
                    error={errors.discount_rate}
                    min={0}
                    max={100}
                    step="0.01"
                  />
                </div>
                <div>
                  <FormField
                    name="vat_rate"
                    label="VAT %"
                    type="number"
                    value={formData.vat_rate || 0}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      vat_rate: typeof value === 'string' ? parseFloat(value) || 0 : value || 0 
                    }))}
                    error={errors.vat_rate}
                    min={0}
                    max={100}
                    step="0.01"
                  />
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-3">
                <div className="md:col-span-4">
                  <FormField
                    name="description"
                    label="Description (Optional)"
                    type="text"
                    value={formData.description || ''}
                    onChange={(_, value) => setFormData(prev => ({ 
                      ...prev, 
                      description: value?.toString() 
                    }))}
                    placeholder="Optional custom description"
                  />
                </div>
                <div className="md:col-span-2 flex items-end justify-end space-x-2">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setShowAddForm(false)
                      setFormData({
                        product_id: 0,
                        quantity: 1,
                        unit_price: 0,
                        discount_rate: 0,
                        vat_rate: 0
                      })
                      setErrors({})
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleAdd}
                    disabled={!formData.product_id || !formData.quantity || !formData.unit_price || isSubmitting}
                    loading={isSubmitting}
                  >
                    Add Item
                  </Button>
                </div>
              </div>
            </div>
          )}

          {items.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                {emptyMessage}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {emptyDescription}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-600">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Product
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Discount
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        VAT
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total
                      </th>
                      {editable && (
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
                    {items.map((item) => (
                      editingItemId === item.id ? (
                        // Edit Mode - Inline
                        <tr key={item.id} className="bg-blue-50 dark:bg-blue-900/20">
                          <td className="px-6 py-4" colSpan={editable ? 7 : 6}>
                            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Quantity
                                </label>
                                <input
                                  type="number"
                                  value={editFormData.quantity || ''}
                                  onChange={(e) => setEditFormData(prev => ({ 
                                    ...prev, 
                                    quantity: parseFloat(e.target.value) || 0 
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                                  min="0.01"
                                  step="0.01"
                                />
                                {errors.quantity && (
                                  <p className="text-xs text-red-600 mt-1">{errors.quantity}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Unit Price
                                </label>
                                <input
                                  type="number"
                                  value={editFormData.unit_price || ''}
                                  onChange={(e) => setEditFormData(prev => ({ 
                                    ...prev, 
                                    unit_price: parseFloat(e.target.value) || 0 
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                                  min="0"
                                  step="0.01"
                                />
                                {errors.unit_price && (
                                  <p className="text-xs text-red-600 mt-1">{errors.unit_price}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Discount %
                                </label>
                                <input
                                  type="number"
                                  value={editFormData.discount_rate || ''}
                                  onChange={(e) => setEditFormData(prev => ({ 
                                    ...prev, 
                                    discount_rate: parseFloat(e.target.value) || 0 
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                />
                                {errors.discount_rate && (
                                  <p className="text-xs text-red-600 mt-1">{errors.discount_rate}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  VAT %
                                </label>
                                <input
                                  type="number"
                                  value={editFormData.vat_rate || ''}
                                  onChange={(e) => setEditFormData(prev => ({ 
                                    ...prev, 
                                    vat_rate: parseFloat(e.target.value) || 0 
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                                  min="0"
                                  max="100"
                                  step="0.01"
                                />
                                {errors.vat_rate && (
                                  <p className="text-xs text-red-600 mt-1">{errors.vat_rate}</p>
                                )}
                              </div>
                              <div>
                                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  value={editFormData.description || ''}
                                  onChange={(e) => setEditFormData(prev => ({ 
                                    ...prev, 
                                    description: e.target.value 
                                  }))}
                                  className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded"
                                  placeholder="Optional"
                                />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2 mt-3">
                              <button
                                type="button"
                                onClick={handleCancelEdit}
                                className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50"
                              >
                                Cancel
                              </button>
                              <button
                                type="button"
                                onClick={handleUpdate}
                                disabled={isSubmitting}
                                className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:opacity-50"
                              >
                                {isSubmitting ? 'Saving...' : 'Save'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        // Display Mode
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {item.product_name}
                              </div>
                              {item.product_sku && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  SKU: {item.product_sku}
                                </div>
                              )}
                              {item.description && item.description !== item.product_name && (
                                <div className="text-xs text-gray-500 dark:text-gray-400 italic mt-1">
                                  {item.description}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                            {parseFloat(String(item.quantity)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                            ${parseFloat(String(item.unit_price)).toFixed(2)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            {parseFloat(String(item.discount_rate)) > 0 ? (
                              <BadgeCell 
                                value={`${parseFloat(String(item.discount_rate)).toFixed(1)}%`} 
                                variant="yellow"
                              />
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <div>
                              <span className="text-gray-900 dark:text-white">
                                {parseFloat(String(item.vat_rate)).toFixed(1)}%
                              </span>
                              {parseFloat(String(item.vat_amount)) > 0 && (
                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                  ${parseFloat(String(item.vat_amount)).toFixed(2)}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white text-right">
                            ${parseFloat(String(item.line_total)).toFixed(2)}
                          </td>
                          {editable && (
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end space-x-2">
                                {onUpdate && (
                                  <button
                                    onClick={() => handleEditClick(item)}
                                    className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 p-1"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </button>
                                )}
                                {onDelete && (
                                  <button
                                    onClick={() => handleDelete(item.id, item.product_name)}
                                    className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 p-1"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          )}
                        </tr>
                      )
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-6">
                <div className="flex justify-end">
                  <div className="w-96 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 dark:text-gray-400">Items Subtotal:</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${totals.subtotal.toFixed(2)}
                      </span>
                    </div>
                    {totals.vat > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Items VAT:</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          ${totals.vat.toFixed(2)}
                        </span>
                      </div>
                    )}
                    
                    {/* Fees Section - clean and consistent */}
                    {editable && onUpdateFees ? (
                      <>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-600 dark:text-gray-400">Shipping Charges:</span>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900 dark:text-white mr-1">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={feeData.shipping_fee}
                              onChange={(e) => handleFeeChange('shipping_fee', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-0.5 text-right border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm font-medium"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-600 dark:text-gray-400">Shipping VAT:</span>
                          <div className="flex items-center space-x-2">
                            <div className="flex items-center">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                value={feeData.shipping_vat_rate}
                                onChange={(e) => handleFeeChange('shipping_vat_rate', parseFloat(e.target.value) || 0)}
                                className="w-16 px-2 py-0.5 text-right border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm font-medium"
                                placeholder="20"
                              />
                              <span className="ml-1 text-gray-500 dark:text-gray-400 text-sm">%</span>
                            </div>
                            <span className="font-medium text-gray-900 dark:text-white">
                              = ${calculatedShippingVat.toFixed(2)}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between text-sm items-center">
                          <span className="text-gray-600 dark:text-gray-400">Rush Fee:</span>
                          <div className="flex items-center">
                            <span className="font-medium text-gray-900 dark:text-white mr-1">$</span>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={feeData.rush_fee}
                              onChange={(e) => handleFeeChange('rush_fee', parseFloat(e.target.value) || 0)}
                              className="w-24 px-2 py-0.5 text-right border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-sm font-medium"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {shippingFee > 0 && (
                          <>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 dark:text-gray-400">Shipping Charges:</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                ${shippingFee.toFixed(2)}
                              </span>
                            </div>
                            {shippingVatAmount > 0 && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600 dark:text-gray-400">
                                  Shipping VAT [{shippingVatRate}%]:
                                </span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  ${shippingVatAmount.toFixed(2)}
                                </span>
                              </div>
                            )}
                          </>
                        )}
                        {rushFee > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600 dark:text-gray-400">Rush Fee:</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              ${rushFee.toFixed(2)}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Save button for fees - subtle inline style */}
                    {editable && onUpdateFees && hasUnsavedChanges && (
                      <div className="flex justify-end">
                        <button
                          onClick={handleSaveFees}
                          className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                        >
                          Save Changes
                        </button>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-lg font-bold border-t border-gray-200 dark:border-gray-600 pt-2">
                      <span className="text-gray-900 dark:text-white">Total:</span>
                      <span className="text-blue-600 dark:text-blue-400">
                        ${(totals.total + (editable ? feeData.shipping_fee + calculatedShippingVat + feeData.rush_fee : shippingFee + shippingVatAmount + rushFee)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}