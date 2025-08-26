import React, { useState, useEffect } from 'react'
import { FormField, FormSection, ConditionalFormField, FormGrid, TwoColumnGrid, ThreeColumnGrid, EditFormActions, CreateFormActions, FormSidePanel } from '@/shared'
import { validateUrl } from '@/shared/utils/validation'
import { useCreateProduct, useUpdateProduct, Product, ProductCreate, PRODUCT_TYPE_OPTIONS, PRODUCT_CONDITION_OPTIONS, UNIT_OPTIONS } from '../api'

interface ProductFormProps {
  product?: Product
  onSuccess?: () => void
  onCancel?: () => void
  isOpen: boolean
  onClose: () => void
}

export const ProductForm: React.FC<ProductFormProps> = ({ 
  product, 
  onSuccess, 
  onCancel,
  isOpen,
  onClose
}) => {
  // State management
  const [formData, setFormData] = useState<ProductCreate>({
    name: '',
    sku: '',
    description: '',
    manufacturer: '',
    category: '',
    part_number: '',
    unit: '',
    price: 0,
    current_price: undefined,
    unit_cost: undefined,
    type: 'inventory',
    stock: 0,
    vendor_name: '',
    vendor_price: undefined,
    product_condition: 'new',
    url: '',
    image_url: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // API hooks
  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const isEditing = !!product
  
  // Load data for editing
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        sku: product.sku || '',
        description: product.description || '',
        manufacturer: product.manufacturer || '',
        category: product.category || '',
        part_number: product.part_number || '',
        unit: product.unit || '',
        price: product.price || 0,
        current_price: product.current_price || undefined,
        unit_cost: product.unit_cost || undefined,
        type: product.type || 'inventory',
        stock: product.stock || 0,
        vendor_name: product.vendor_name || '',
        vendor_price: product.vendor_price || undefined,
        product_condition: product.product_condition || 'new',
        url: product.url || '',
        image_url: product.image_url || '',
      })
    }
  }, [product])
  
  // Form handling
  const handleInputChange = (field: keyof ProductCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }
  
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    // Required fields
    if (!formData.name?.trim()) {
      newErrors.name = 'Product name is required'
    }
    
    if (!formData.type) {
      newErrors.type = 'Product type is required'
    }
    
    // Optional price validation - only validate if provided
    if (formData.price !== undefined && formData.price < 0) {
      newErrors.price = 'Price cannot be negative'
    }
    
    // URL validation
    if (formData.url) {
      const urlValidation = validateUrl(formData.url)
      if (!urlValidation.isValid) {
        newErrors.url = urlValidation.error || 'Please enter a valid URL'
      }
    }
    
    if (formData.image_url) {
      const imageUrlValidation = validateUrl(formData.image_url)
      if (!imageUrlValidation.isValid) {
        newErrors.image_url = imageUrlValidation.error || 'Please enter a valid image URL'
      }
    }
    
    // Unit cost validation
    if (formData.unit_cost !== undefined && formData.unit_cost < 0) {
      newErrors.unit_cost = 'Unit cost cannot be negative'
    }
    
    // Current price validation
    if (formData.current_price !== undefined && formData.current_price < 0) {
      newErrors.current_price = 'Current price cannot be negative'
    }
    
    // Stock validation
    if (formData.stock !== undefined && formData.stock < 0) {
      newErrors.stock = 'Stock cannot be negative'
    }
    
    // Vendor price validation
    if (formData.vendor_price !== undefined && formData.vendor_price < 0) {
      newErrors.vendor_price = 'Vendor price cannot be negative'
    }
    
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    
    setIsSubmitting(true)
    
    try {
      // Clean up form data
      const submitData = {
        ...formData,
        sku: formData.sku?.trim() || undefined,
        description: formData.description?.trim() || undefined,
        manufacturer: formData.manufacturer?.trim() || undefined,
        category: formData.category?.trim() || undefined,
        part_number: formData.part_number?.trim() || undefined,
        unit: formData.unit?.trim() || undefined,
        vendor_name: formData.vendor_name?.trim() || undefined,
        url: formData.url?.trim() || undefined,
        image_url: formData.image_url?.trim() || undefined,
        unit_cost: formData.unit_cost || undefined,
        current_price: formData.current_price || undefined,
        vendor_price: formData.vendor_price || undefined,
        stock: formData.stock || 0,
      }
      
      if (isEditing && product) {
        await updateProduct.mutateAsync({ id: product.product_id, data: submitData })
        alert('Product updated successfully!')
      } else {
        await createProduct.mutateAsync(submitData)
        alert('Product created successfully!')
      }
      onSuccess?.()
    } catch (error: any) {
      console.error('Error saving product:', error)
      alert(`Error saving product: ${error.message}`)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Calculate margin for display (use current_price if available, otherwise price)
  const calculateMargin = () => {
    const sellPrice = parseFloat(formData.current_price || formData.price || '0')
    const unitCost = parseFloat(formData.unit_cost || '0')
    
    if (sellPrice > 0 && unitCost > 0) {
      const margin = sellPrice - unitCost
      const marginPercentage = (margin / sellPrice) * 100
      return { margin, marginPercentage, sellPrice }
    }
    return null
  }
  
  const marginData = calculateMargin()
  
  return (
    <FormSidePanel
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Create New Product'}
      subtitle={isEditing ? 'Update product information' : 'Add a new product to your catalog'}
    >
      <form onSubmit={handleSubmit}>
        {/* Basic Information Section */}
        <FormSection title="Basic Information">
          <TwoColumnGrid>
            <FormField
              label="Product Type"
              name="type"
              as="select"
              value={formData.type}
              onChange={handleInputChange}
              error={errors.type}
              options={PRODUCT_TYPE_OPTIONS as any}
              required
            />
            
            <FormField
              label="Product Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              error={errors.name}
              placeholder="Enter product name"
              required
            />
          </TwoColumnGrid>
          
          <ThreeColumnGrid className="mt-4">
            <FormField
              label="SKU"
              name="sku"
              value={formData.sku}
              onChange={handleInputChange}
              error={errors.sku}
              placeholder="Enter product SKU (optional)"
            />
            
            <FormField
              label="Manufacturer"
              name="manufacturer"
              value={formData.manufacturer}
              onChange={handleInputChange}
              error={errors.manufacturer}
              placeholder="e.g., Apple, Dell, Nike"
            />
            
            <FormField
              label="Condition"
              name="product_condition"
              as="select"
              value={formData.product_condition}
              onChange={handleInputChange}
              error={errors.product_condition}
              options={PRODUCT_CONDITION_OPTIONS as any}
            />
          </ThreeColumnGrid>
          
          <TwoColumnGrid className="mt-4">
            <ConditionalFormField
              label="Part Number"
              name="part_number"
              value={formData.part_number}
              onChange={handleInputChange}
              error={errors.part_number}
              placeholder="Manufacturer part number"
              checkboxLabel="Add Part Number"
              defaultEnabled={!!formData.part_number}
            />
            
            <ConditionalFormField
              label="Category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              error={errors.category}
              placeholder="e.g., Electronics, Clothing"
              checkboxLabel="Add Category"
              defaultEnabled={!!formData.category}
            />
          </TwoColumnGrid>
          
          <FormGrid cols={1} className="mt-4">
            <FormField
              label="Unit"
              name="unit"
              as="select"
              value={formData.unit}
              onChange={handleInputChange}
              error={errors.unit}
              options={UNIT_OPTIONS as any}
              placeholder="Select unit of measurement"
            />
          </FormGrid>
        </FormSection>
        
        {/* Pricing & Classification Section */}
        <FormSection title="Pricing & Classification" collapsible defaultExpanded={false}>
          <ThreeColumnGrid>
            <FormField
              label="Base Price"
              name="price"
              type="number"
              value={formData.price || ''}
              onChange={handleInputChange}
              error={errors.price}
              placeholder="0.00 (optional)"
              min={0}
              step="0.01"
            />
            
            <FormField
              label="Current Price"
              name="current_price"
              type="number"
              value={formData.current_price || ''}
              onChange={handleInputChange}
              error={errors.current_price}
              placeholder="0.00 (optional)"
              min={0}
              step="0.01"
            />
            
            <FormField
              label="Unit Cost"
              name="unit_cost"
              type="number"
              value={formData.unit_cost || ''}
              onChange={handleInputChange}
              error={errors.unit_cost}
              placeholder="0.00 (optional)"
              min={0}
              step="0.01"
            />
          </ThreeColumnGrid>
          
          {/* Margin Display */}
          {marginData && (
            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Selling Price Used
                  </label>
                  <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    ${marginData?.sellPrice?.toFixed(2) || '0.00'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.current_price ? 'Current Price' : 'Base Price'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Profit Margin
                  </label>
                  <p className={`text-lg font-semibold ${(marginData?.margin || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    ${marginData?.margin?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Margin Percentage
                  </label>
                  <p className={`text-lg font-semibold ${(marginData?.marginPercentage || 0) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                    {marginData?.marginPercentage?.toFixed(1) || '0.0'}%
                  </p>
                </div>
              </div>
            </div>
          )}
        </FormSection>
        
        {/* Inventory & Vendor Section */}
        <FormSection title="Inventory & Vendor Information" collapsible defaultExpanded={false}>
          <ThreeColumnGrid>
            <FormField
              label="Stock Quantity"
              name="stock"
              type="number"
              value={formData.stock || 0}
              onChange={handleInputChange}
              error={errors.stock}
              placeholder="0"
              min={0}
              step="1"
            />
            
            <FormField
              label="Vendor Name"
              name="vendor_name"
              value={formData.vendor_name}
              onChange={handleInputChange}
              error={errors.vendor_name}
              placeholder="e.g., Supplier Inc"
            />
            
            <FormField
              label="Vendor Price"
              name="vendor_price"
              type="number"
              value={formData.vendor_price || ''}
              onChange={handleInputChange}
              error={errors.vendor_price}
              placeholder="0.00 (optional)"
              min={0}
              step="0.01"
            />
          </ThreeColumnGrid>
        </FormSection>
        
        {/* Additional Details Section */}
        <FormSection title="Additional Details" collapsible defaultExpanded={false}>
          <TwoColumnGrid>
            <FormField
              label="Product URL"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleInputChange}
              error={errors.url}
              placeholder="example.com/product or https://example.com/product"
            />
            
            <FormField
              label="Image URL"
              name="image_url"
              type="url"
              value={formData.image_url}
              onChange={handleInputChange}
              error={errors.image_url}
              placeholder="example.com/image.jpg or https://example.com/image.jpg"
            />
          </TwoColumnGrid>
          
          <FormGrid cols={1} className="mt-4">
            <FormField
              label="Description"
              name="description"
              as="textarea"
              value={formData.description}
              onChange={handleInputChange}
              error={errors.description}
              placeholder="Enter product description (optional)"
              rows={3}
            />
          </FormGrid>
          
          {/* Image Preview */}
          {formData.image_url && validateUrl(formData.image_url).isValid && (
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Image Preview
              </label>
              <div className="w-32 h-32 border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <img
                  src={formData.image_url}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                  }}
                />
              </div>
            </div>
          )}
        </FormSection>
        
        {/* Form Actions */}
        {isEditing ? (
          <EditFormActions
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            disabled={isSubmitting}
          />
        ) : (
          <CreateFormActions
            onCancel={onCancel}
            isSubmitting={isSubmitting}
            disabled={isSubmitting}
          />
        )}
      </form>
    </FormSidePanel>
  )
}