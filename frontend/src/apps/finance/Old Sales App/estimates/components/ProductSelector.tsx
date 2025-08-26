import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useProducts, ProductListItem } from '@/apps/inventory/products/api'
import { Plus, Search, Package, X } from 'lucide-react'
import { debounce } from '@/utils/debounce'

interface ProductSelectorProps {
  label?: string
  value?: number
  onChange: (productId: number | undefined, product?: ProductListItem) => void
  error?: string
  placeholder?: string
  required?: boolean
}

export const ProductSelector: React.FC<ProductSelectorProps> = ({
  label = 'Product',
  value,
  onChange,
  error,
  placeholder = 'Select a product...',
  required = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)
  const [showCreateOption, setShowCreateOption] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  
  const { data: productsData, isLoading } = useProducts(1, 100) // Get more products for selection
  const products = productsData?.results || []
  
  // Debounce search term
  const debouncedSearch = useMemo(
    () => debounce((value: string) => {
      setDebouncedSearchTerm(value)
      setShowCreateOption(value.length > 0)
    }, 300),
    []
  )

  useEffect(() => {
    debouncedSearch(searchTerm)
  }, [searchTerm, debouncedSearch])

  const filteredProducts = useMemo(() => {
    if (!debouncedSearchTerm) return products
    
    const term = debouncedSearchTerm.toLowerCase()
    return products.filter(product =>
      product.name.toLowerCase().includes(term) ||
      (product.sku && product.sku.toLowerCase().includes(term)) ||
      (product.manufacturer && product.manufacturer.toLowerCase().includes(term))
    )
  }, [products, debouncedSearchTerm])

  const selectedProduct = products.find(p => p.product_id === value)

  const handleProductSelect = useCallback((product: ProductListItem) => {
    onChange(product.product_id, product)
    setIsOpen(false)
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setHighlightedIndex(-1)
  }, [onChange])

  const handleClear = useCallback(() => {
    onChange(undefined)
    setSearchTerm('')
    setDebouncedSearchTerm('')
    setHighlightedIndex(-1)
  }, [onChange])

  const handleCreateProduct = useCallback(() => {
    // This will be implemented to open a product creation modal
    console.log('Create new product:', searchTerm)
    alert(`Feature coming soon: Create product "${searchTerm}"`)
    setIsOpen(false)
  }, [searchTerm])

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
        setHighlightedIndex(0)
      }
      return
    }

    const itemCount = filteredProducts.length + (showCreateOption ? 1 : 0) + (selectedProduct ? 1 : 0)
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => (prev + 1) % itemCount)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => (prev - 1 + itemCount) % itemCount)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightedIndex >= 0) {
          const clearIndex = selectedProduct ? 0 : -1
          const createIndex = filteredProducts.length + (selectedProduct ? 1 : 0)
          
          if (selectedProduct && highlightedIndex === clearIndex) {
            handleClear()
          } else if (showCreateOption && highlightedIndex === createIndex) {
            handleCreateProduct()
          } else {
            const productIndex = selectedProduct ? highlightedIndex - 1 : highlightedIndex
            if (productIndex >= 0 && productIndex < filteredProducts.length) {
              handleProductSelect(filteredProducts[productIndex])
            }
          }
        }
        break
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
      case 'Tab':
        setIsOpen(false)
        setHighlightedIndex(-1)
        break
    }
  }, [isOpen, filteredProducts, showCreateOption, selectedProduct, highlightedIndex, handleClear, handleCreateProduct, handleProductSelect])

  // Scroll highlighted item into view
  useEffect(() => {
    if (highlightedIndex >= 0 && itemRefs.current[highlightedIndex]) {
      itemRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      })
    }
  }, [highlightedIndex])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={`relative w-full bg-white dark:bg-gray-700 border rounded-md pl-3 pr-10 py-2 text-left cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm ${
            error 
              ? 'border-red-300 dark:border-red-600' 
              : 'border-gray-300 dark:border-gray-600'
          }`}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate">
            {selectedProduct ? (
              <span className="flex items-center">
                <span className="font-medium">{selectedProduct.name}</span>
                {selectedProduct.sku && (
                  <span className="ml-2 text-gray-500 dark:text-gray-400">({selectedProduct.sku})</span>
                )}
              </span>
            ) : (
              <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
            )}
          </span>
          <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
            {isOpen ? (
              <svg className="h-5 w-5 text-gray-400 transform rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            ) : (
              <svg className="h-5 w-5 text-gray-400 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            )}
          </span>
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg max-h-80 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none" role="listbox">
            <div className="sticky top-0 z-10 bg-white dark:bg-gray-700 p-2 border-b border-gray-200 dark:border-gray-600">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
            
            {selectedProduct && (
              <button
                ref={(el) => itemRefs.current[0] = el}
                type="button"
                onClick={handleClear}
                onMouseEnter={() => setHighlightedIndex(0)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center space-x-2 ${
                  highlightedIndex === 0
                    ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                    : 'text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                }`}
                role="option"
                aria-selected={highlightedIndex === 0}
              >
                <X className="h-4 w-4" />
                <span>Clear selection</span>
              </button>
            )}
            
            {isLoading ? (
              <div className="px-3 py-8 text-center">
                <div className="inline-flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Loading products...</span>
                </div>
              </div>
            ) : filteredProducts.length === 0 && !showCreateOption ? (
              <div className="px-3 py-8 text-center">
                <Package className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {debouncedSearchTerm ? 'No products found' : 'No products available'}
                </p>
              </div>
            ) : (
              filteredProducts.map((product, index) => {
                const itemIndex = selectedProduct ? index + 1 : index
                return (
                  <button
                    key={product.product_id}
                    ref={(el) => itemRefs.current[itemIndex] = el}
                    type="button"
                    onClick={() => handleProductSelect(product)}
                    onMouseEnter={() => setHighlightedIndex(itemIndex)}
                    className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                      highlightedIndex === itemIndex
                        ? 'bg-blue-50 dark:bg-blue-900/30'
                        : value === product.product_id 
                          ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-900 dark:text-blue-100' 
                          : 'text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                    role="option"
                    aria-selected={value === product.product_id || highlightedIndex === itemIndex}
                  >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{product.name}</div>
                      {product.sku && (
                        <div className="text-gray-500 dark:text-gray-400 text-xs">SKU: {product.sku}</div>
                      )}
                      {product.manufacturer && (
                        <div className="text-gray-500 dark:text-gray-400 text-xs">{product.manufacturer}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        ${parseFloat(product.current_price || product.price || 0).toFixed(2)}
                      </div>
                      {product.type && (
                        <div className="text-gray-500 dark:text-gray-400 text-xs capitalize">{product.type}</div>
                      )}
                    </div>
                  </div>
                  </button>
                )
              })
            )}
            
            {/* Create New Product Option */}
            {showCreateOption && debouncedSearchTerm && filteredProducts.length < 5 && (
              <div className="border-t border-gray-200 dark:border-gray-600">
                <button
                  ref={(el) => {
                    const index = filteredProducts.length + (selectedProduct ? 1 : 0)
                    itemRefs.current[index] = el
                  }}
                  type="button"
                  onClick={handleCreateProduct}
                  onMouseEnter={() => setHighlightedIndex(filteredProducts.length + (selectedProduct ? 1 : 0))}
                  className={`w-full text-left px-3 py-3 text-sm flex items-center space-x-2 transition-colors ${
                    highlightedIndex === filteredProducts.length + (selectedProduct ? 1 : 0)
                      ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20'
                  }`}
                  role="option"
                  aria-selected={highlightedIndex === filteredProducts.length + (selectedProduct ? 1 : 0)}
                >
                  <Plus className="h-4 w-4" />
                  <span>Create "{String(debouncedSearchTerm)}" as new product</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}