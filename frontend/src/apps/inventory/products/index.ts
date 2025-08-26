// Export pages
export { ProductsListPage } from './pages/ProductsListPage'
export { ProductDetailsPage } from './pages/ProductDetailsPage'
export { ProductDetailsRoute } from './pages/ProductDetailsRoute'
export { EditProductRoute } from './pages/EditProductRoute'

// Export components
export { ProductForm } from './components/ProductForm'
export { ProductFormModal } from './components/ProductFormModal'
export { ProductFormSidePanel } from './components/ProductFormSidePanel'

// Export API hooks and types
export {
  useProducts,
  useProduct,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useProductSummary,
  type Product,
  type ProductListItem,
  type ProductCreate,
  type ProductSummary,
  type PaginatedResponse,
  PRODUCT_TYPE_OPTIONS,
  BILLING_FREQUENCY_OPTIONS,
} from './api'