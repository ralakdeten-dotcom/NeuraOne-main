import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  DataTable, 
  TableControls, 
  ColumnManager,
  PrimaryLinkCell,
  BadgeCell,
  DateCell,
  ValueCell,
  ExportButton,
  useColumnVisibility,
  type ColumnConfig, 
  type ActionConfig,
  type ExportColumn,
  formatDateForExport,
  formatCurrencyForExport
} from '@/shared'
import { usePermissions } from '@/core/auth/usePermissions'
import { useProducts, useDeleteProduct, ProductListItem } from '../api'
import { ProductFormModal } from '../components/ProductFormModal'
import { ProductFormSidePanel } from '../components/ProductFormSidePanel'

export const ProductsListPage: React.FC = () => {
  // State management
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<ProductListItem[]>([])
  const [isModalOpen, setModalOpen] = useState(false)
  const [isCreatePanelOpen, setCreatePanelOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<ProductListItem | undefined>(undefined)
  
  // Hooks
  const navigate = useNavigate()
  const permissions = usePermissions()
  const { data: productsData, isLoading, error, refetch } = useProducts(currentPage, pageSize)
  const deleteProduct = useDeleteProduct()
  
  // Data processing
  const products = productsData?.results || []
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.sku && product.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.manufacturer && product.manufacturer.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.part_number && product.part_number.toLowerCase().includes(searchTerm.toLowerCase()))
  )
  
  // Permission checks
  const canManageProducts = permissions.hasPermission('manage_products') || permissions.hasPermission('all')
  const canViewProducts = canManageProducts || permissions.hasPermission('view_products')
  
  // Export configuration
  const exportColumns: ExportColumn<ProductListItem>[] = [
    { key: 'name', label: 'Product Name' },
    { key: 'sku', label: 'SKU', formatter: (value) => value || '' },
    { key: 'manufacturer', label: 'Manufacturer', formatter: (value) => value || '' },
    { key: 'category', label: 'Category', formatter: (value) => value || '' },
    { key: 'part_number', label: 'Part Number', formatter: (value) => value || '' },
    { key: 'type', label: 'Type', formatter: (value) => value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ') },
    { key: 'product_condition', label: 'Condition', formatter: (value) => value.charAt(0).toUpperCase() + value.slice(1) },
    { key: 'price', label: 'Base Price', formatter: (value) => formatCurrencyForExport(value) },
    { key: 'current_price', label: 'Current Price', formatter: (value) => value ? formatCurrencyForExport(value) : '' },
    { key: 'unit_cost', label: 'Unit Cost', formatter: (value) => value ? formatCurrencyForExport(value) : '' },
    { key: 'margin', label: 'Margin', formatter: (value) => value !== undefined ? formatCurrencyForExport(value) : '' },
    { key: 'margin_percentage', label: 'Margin %', formatter: (value) => value !== undefined ? `${value.toFixed(1)}%` : '' },
    { key: 'stock', label: 'Stock', formatter: (value) => value.toString() },
    { key: 'vendor_name', label: 'Vendor', formatter: (value) => value || '' },
    { key: 'billing_frequency', label: 'Billing Frequency', formatter: (value) => value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ') },
    { key: 'created_at', label: 'Created Date', formatter: (value) => formatDateForExport(value) }
  ]
  
  // Handlers
  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteProduct.mutateAsync(id)
        alert('Product deleted successfully')
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting product: ${errorMessage}`)
      }
    }
  }
  
  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return
    
    const confirmMessage = `Are you sure you want to delete ${selectedProducts.length} product(s)?`
    if (window.confirm(confirmMessage)) {
      try {
        await Promise.all(
          selectedProducts.map(product => deleteProduct.mutateAsync(product.product_id))
        )
        alert(`${selectedProducts.length} product(s) deleted successfully`)
        setSelectedProducts([])
        refetch()
      } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error deleting products: ${errorMessage}`)
      }
    }
  }
  
  const handleNewProduct = () => {
    setCreatePanelOpen(true)
  }
  
  const handleEditProduct = (product: ProductListItem) => {
    setSelectedProduct(product)
    setModalOpen(true)
  }
  
  // Get type badge variant
  const getTypeBadgeVariant = (type: string) => {
    switch (type) {
      case 'inventory':
        return 'blue'
      case 'service':
        return 'green'
      case 'non-inventory':
        return 'yellow'
      default:
        return 'gray'
    }
  }
  
  // Get billing frequency badge variant
  const getBillingBadgeVariant = (frequency: string) => {
    switch (frequency) {
      case 'monthly':
        return 'green'
      case 'yearly':
        return 'blue'
      case 'one-time':
        return 'gray'
      default:
        return 'gray'
    }
  }
  
  // Get condition badge variant
  const getConditionBadgeVariant = (condition: string) => {
    switch (condition) {
      case 'new':
        return 'green'
      case 'used':
        return 'yellow'
      case 'refurbished':
        return 'blue'
      case 'damaged':
        return 'red'
      default:
        return 'gray'
    }
  }
  
  // Column configuration
  const columns: ColumnConfig<ProductListItem>[] = [
    {
      key: 'name',
      title: 'Product Name',
      sortable: true,
      render: (_, product) => (
        <PrimaryLinkCell 
          text={product.name}
          onClick={() => navigate(`/finance/products/${product.product_id}`)}
        />
      )
    },
    {
      key: 'sku',
      title: 'SKU',
      sortable: true,
      render: (value) => value ? (
        <BadgeCell value={value} variant="gray" />
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">No SKU</span>
      )
    },
    {
      key: 'manufacturer',
      title: 'Manufacturer',
      sortable: true,
      render: (value) => value ? (
        <span className="text-gray-900 dark:text-gray-100">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'category',
      title: 'Category',
      sortable: true,
      render: (value) => value ? (
        <BadgeCell value={value} variant="blue" />
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'part_number',
      title: 'Part #',
      sortable: true,
      render: (value) => value ? (
        <span className="text-gray-900 dark:text-gray-100 font-mono text-sm">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'type',
      title: 'Type',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')} 
          variant={getTypeBadgeVariant(value)}
        />
      )
    },
    {
      key: 'product_condition',
      title: 'Condition',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value.charAt(0).toUpperCase() + value.slice(1)} 
          variant={getConditionBadgeVariant(value)}
        />
      )
    },
    {
      key: 'price',
      title: 'Base Price',
      sortable: true,
      render: (value) => <ValueCell value={value} currency="USD" />
    },
    {
      key: 'current_price',
      title: 'Current Price',
      sortable: true,
      render: (value) => value ? (
        <ValueCell value={value} currency="USD" />
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'unit_cost',
      title: 'Unit Cost',
      sortable: true,
      render: (value) => value ? (
        <ValueCell value={value} currency="USD" />
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'stock',
      title: 'Stock',
      sortable: true,
      render: (value) => (
        <span className={`font-medium ${
          value === 0 
            ? 'text-red-600 dark:text-red-400' 
            : value < 10
            ? 'text-yellow-600 dark:text-yellow-400'
            : 'text-green-600 dark:text-green-400'
        }`}>
          {value}
        </span>
      )
    },
    {
      key: 'vendor_name',
      title: 'Vendor',
      sortable: true,
      render: (value) => value ? (
        <span className="text-gray-900 dark:text-gray-100">{value}</span>
      ) : (
        <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      )
    },
    {
      key: 'margin',
      title: 'Margin',
      sortable: true,
      render: (value, product) => {
        if (product.unit_cost && value !== undefined) {
          const isPositive = value >= 0
          return (
            <span className={`font-medium ${
              isPositive 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              ${value.toFixed(2)}
            </span>
          )
        }
        return <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      }
    },
    {
      key: 'margin_percentage',
      title: 'Margin %',
      sortable: true,
      render: (value, product) => {
        if (product.unit_cost && value !== undefined) {
          const isPositive = value >= 0
          return (
            <span className={`font-medium ${
              isPositive 
                ? 'text-green-600 dark:text-green-400' 
                : 'text-red-600 dark:text-red-400'
            }`}>
              {value.toFixed(1)}%
            </span>
          )
        }
        return <span className="text-gray-400 dark:text-gray-500 italic">N/A</span>
      }
    },
    {
      key: 'billing_frequency',
      title: 'Billing',
      sortable: true,
      render: (value) => (
        <BadgeCell 
          value={value.charAt(0).toUpperCase() + value.slice(1).replace('-', ' ')} 
          variant={getBillingBadgeVariant(value)}
        />
      )
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (value) => <DateCell value={value} />
    }
  ]
  
  // Actions configuration
  const actions: ActionConfig<ProductListItem>[] = [
    {
      id: 'view',
      label: 'View',
      onClick: (product) => navigate(`/finance/products/${product.product_id}`),
      variant: 'default'
    },
    {
      id: 'edit',
      label: 'Edit',
      onClick: (product) => handleEditProduct(product),
      variant: 'default',
      hidden: () => !canManageProducts
    },
    {
      id: 'delete',
      label: 'Delete',
      onClick: (product) => handleDelete(product.product_id, product.name),
      variant: 'danger',
      hidden: () => !canManageProducts
    }
  ]
  
  // Column visibility
  const { columnVisibility, updateColumnVisibility } = useColumnVisibility(columns, {
    storageKey: 'products-list',
    defaultVisible: ['name', 'sku', 'manufacturer', 'category', 'type', 'product_condition', 'current_price', 'stock', 'margin', 'created_at']
  })
  
  // Permission check
  if (!canViewProducts) {
    return (
      <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Access Denied
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view products.
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Controls */}
      <TableControls
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search products by name, SKU, manufacturer, category, or part number..."
        filters={
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredProducts.length} of {productsData?.count || 0} products
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <ColumnManager
              columns={columns}
              visibleColumns={columnVisibility}
              onVisibilityChange={updateColumnVisibility}
            />
            <ExportButton
              data={filteredProducts}
              columns={exportColumns}
              filename={`products_${new Date().toISOString().slice(0, 10)}.csv`}
              searchTerm={searchTerm}
            />
            {selectedProducts.length > 0 && canManageProducts && (
              <button
                onClick={handleBulkDelete}
                disabled={deleteProduct.isPending}
                className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Delete Selected ({selectedProducts.length})
              </button>
            )}
            {canManageProducts && (
              <button
                onClick={handleNewProduct}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Product
              </button>
            )}
          </div>
        }
      />
      
      {/* DataTable */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        <DataTable
          data={filteredProducts}
          columns={columns}
          actions={actions}
          keyExtractor={(product) => product.product_id.toString()}
          loading={isLoading}
          error={error ? String(error) : undefined}
          searchTerm={searchTerm}
          showSelection={canManageProducts}
          onSelectionChange={setSelectedProducts}
          columnVisibility={columnVisibility}
          emptyMessage="No products found. Try adjusting your search or create your first product."
        />
        
        {/* Pagination (if needed) */}
        {productsData && productsData.count > pageSize && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, productsData.count)} of {productsData.count} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => prev + 1)}
                  disabled={!productsData.next}
                  className="px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Edit Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedProduct(undefined)
        }}
        product={selectedProduct ? {
          ...selectedProduct,
          tenant: 0,
          updated_at: '',
          description: '',
          term: '',
          url: '',
          image_url: '',
          created_by: undefined,
          updated_by: undefined,
          // Ensure all new fields are properly mapped
          manufacturer: selectedProduct.manufacturer || '',
          category: selectedProduct.category || '',
          part_number: selectedProduct.part_number || '',
          current_price: selectedProduct.current_price,
          stock: selectedProduct.stock || 0,
          vendor_name: selectedProduct.vendor_name || '',
          vendor_price: undefined, // Not available in list view
          product_condition: selectedProduct.product_condition || 'new'
        } : undefined}
        onSuccess={() => {
          setModalOpen(false)
          setSelectedProduct(undefined)
          refetch()
        }}
      />

      {/* Create Side Panel */}
      <ProductFormSidePanel
        isOpen={isCreatePanelOpen}
        onClose={() => setCreatePanelOpen(false)}
        onSuccess={() => {
          setCreatePanelOpen(false)
          refetch()
        }}
      />
    </div>
  )
}