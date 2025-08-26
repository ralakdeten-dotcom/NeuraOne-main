import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Calendar, DollarSign, User, Building2, Package, Check, X, Clock, Copy, Truck, FileDown, Printer, Download, ShoppingCart } from 'lucide-react'
import { 
  useSalesOrder, 
  useDeleteSalesOrder, 
  useDuplicateSalesOrder,
  useUpdateSalesOrderStatus,
  useConvertToInvoice
} from '../api'
import { showErrorMessage } from '@/utils/error'
import { TitleBox, BadgeCell, DocumentPDFView } from '@/shared/components'
import { EmailsTab, TimelineTab } from '@/shared/components/tabs'
import { AttachmentsTab } from '@/shared/components/attachments'
import { SalesOrderLineItemsList } from '../components/SalesOrderLineItemsList'
import { usePermissions } from '@/core/auth/usePermissions'

interface SalesOrderDetailsPageProps {
  salesOrderId: number
}

export const SalesOrderDetailsPage: React.FC<SalesOrderDetailsPageProps> = ({ salesOrderId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'line-items' | 'emails' | 'attachments' | 'timeline'>('overview')
  const [isPDFView, setIsPDFView] = useState(false)
  
  const navigate = useNavigate()
  const permissions = usePermissions()
  
  const { data: salesOrder, isLoading, error, refetch } = useSalesOrder(salesOrderId)
  const deleteSalesOrder = useDeleteSalesOrder()
  const duplicateSalesOrder = useDuplicateSalesOrder()
  const updateStatus = useUpdateSalesOrderStatus()
  const convertToInvoice = useConvertToInvoice()

  const canManageSalesOrders = permissions.hasPermission('manage_opportunities') || permissions.hasPermission('all')

  const handlePrint = () => {
    // Store current state
    const originalTitle = document.title
    
    // Set document title for print
    document.title = `${salesOrder?.sales_order_number} - Ralakde Limited`
    
    // Hide all elements except the PDF view
    const style = document.createElement('style')
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-area, .print-area * {
          visibility: visible;
        }
        .print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          size: A4;
          margin: 0;
        }
      }
    `
    document.head.appendChild(style)
    
    // Trigger print
    window.print()
    
    // Restore title and remove style
    document.title = originalTitle
    setTimeout(() => {
      document.head.removeChild(style)
    }, 100)
  }

  const handleDownloadPDF = () => {
    // Store current state
    const originalTitle = document.title
    
    // Set document title for PDF
    document.title = `${salesOrder?.sales_order_number} - Ralakde Limited`
    
    // Create print-specific styles
    const style = document.createElement('style')
    style.innerHTML = `
      @media print {
        body * {
          visibility: hidden;
        }
        .print-area, .print-area * {
          visibility: visible;
        }
        .print-area {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
        }
        @page {
          size: A4;
          margin: 0;
        }
      }
    `
    document.head.appendChild(style)
    
    // Show print dialog with save as PDF option
    window.print()
    
    // Restore title and remove style
    document.title = originalTitle
    setTimeout(() => {
      document.head.removeChild(style)
    }, 100)
  }

  const handleDelete = async () => {
    if (!salesOrder) return
    
    if (window.confirm(`Are you sure you want to delete sales order "${salesOrder.sales_order_number}"?`)) {
      try {
        await deleteSalesOrder.mutateAsync(salesOrderId)
        alert('Sales order deleted successfully')
        navigate('/finance/sales-orders')
      } catch (error: any) {
        showErrorMessage(error, 'deleting sales order')
      }
    }
  }

  const handleDuplicate = async () => {
    if (!salesOrder) return
    
    try {
      const result = await duplicateSalesOrder.mutateAsync(salesOrderId)
      alert('Sales order duplicated successfully')
      navigate(`/finance/sales-orders/${result.sales_order_id}`)
    } catch (error: any) {
      showErrorMessage(error, 'duplicating sales order')
    }
  }

  const handleConvertToInvoice = async () => {
    if (!salesOrder) return
    
    if (salesOrder.status !== 'confirmed' && salesOrder.status !== 'shipped' && salesOrder.status !== 'delivered') {
      alert('Only confirmed, shipped, or delivered sales orders can be converted to invoices')
      return
    }
    
    if (window.confirm(`Convert sales order "${salesOrder.sales_order_number}" to an invoice?`)) {
      try {
        const result = await convertToInvoice.mutateAsync({ 
          id: salesOrderId, 
          data: {
            invoice_date: new Date().toISOString().split('T')[0],
            payment_terms: salesOrder.payment_terms || 'net_30'
          }
        })
        alert(`Sales order converted to invoice: ${result.invoice_number}`)
        navigate(`/finance/invoices/${result.invoice_id}`)
      } catch (error: any) {
        showErrorMessage(error, 'converting sales order to invoice')
      }
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!salesOrder) return

    try {
      console.log('🔄 Updating sales order status:', { id: salesOrderId, status: newStatus })
      const result = await updateStatus.mutateAsync({ id: salesOrderId, status: newStatus })
      console.log('✅ Status update successful:', result)
      alert(`Sales order status updated to ${newStatus}`)
      refetch()
    } catch (error: any) {
      console.error('❌ Status update failed:', {
        error,
        response: error.response,
        data: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText
      })
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail || 
                          error.message || 
                          'Failed to update status'
      
      if (error.response?.status === 401) {
        alert('Authentication error: Please login again')
        window.location.href = '/login'
      } else if (error.response?.status === 403) {
        alert('Permission denied: You do not have permission to update sales order status')
      } else {
        alert(`Error updating status: ${errorMessage}`)
      }
      
      showErrorMessage(error, 'updating sales order status')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />
      case 'confirmed':
        return <Check className="h-5 w-5 text-blue-500" />
      case 'in_progress':
        return <Package className="h-5 w-5 text-yellow-500" />
      case 'shipped':
        return <Truck className="h-5 w-5 text-purple-500" />
      case 'delivered':
        return <Check className="h-5 w-5 text-green-500" />
      case 'cancelled':
        return <X className="h-5 w-5 text-red-500" />
      case 'on_hold':
        return <Clock className="h-5 w-5 text-orange-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'gray'
      case 'confirmed':
        return 'blue'
      case 'in_progress':
        return 'yellow'
      case 'shipped':
        return 'purple'
      case 'delivered':
        return 'green'
      case 'cancelled':
        return 'red'
      case 'on_hold':
        return 'yellow'  // Changed from 'orange' to 'yellow' as orange is not a valid variant
      default:
        return 'gray'
    }
  }

  if (isLoading) return <div className="p-6">Loading sales order...</div>
  if (error) return <div className="p-6 text-red-600">Error loading sales order: {error.message}</div>
  if (!salesOrder) return <div className="p-6 text-gray-600">Sales order not found</div>

  const tabs = [
    { 
      key: 'overview', 
      label: 'Overview', 
      content: isPDFView ? (
        <div className="print-area">
          <DocumentPDFView
            documentType="SALES ORDER"
            documentNumber={salesOrder.sales_order_number}
            documentStatus={salesOrder.status_display}
            statusVariant={salesOrder.status as any}
            customerName={salesOrder.account_name}
            billingAddress={{
              attention: salesOrder.billing_attention,
              street: salesOrder.billing_street,
              city: salesOrder.billing_city,
              stateProvince: salesOrder.billing_state_province,
              zipPostalCode: salesOrder.billing_zip_postal_code,
              country: salesOrder.billing_country
            }}
            shippingAddress={{
              attention: salesOrder.shipping_attention,
              street: salesOrder.shipping_street,
              city: salesOrder.shipping_city,
              stateProvince: salesOrder.shipping_state_province,
              zipPostalCode: salesOrder.shipping_zip_postal_code,
              country: salesOrder.shipping_country
            }}
            documentDate={salesOrder.sales_order_date}
            expectedShipDate={salesOrder.expected_shipment_date}
            poNumber={salesOrder.po_number}
            referenceNumber={salesOrder.reference_number}
            customerNumber={salesOrder.customer_name}
            lineItems={salesOrder.line_items.map(item => ({
              id: item.line_item_id,
              name: item.product_name,
              sku: item.product_sku,
              type: item.product_type,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unit_price,
              discountRate: item.discount_rate,
              vatRate: item.vat_rate,
              vatAmount: item.vat_amount,
              lineSubtotal: item.line_subtotal,
              lineTotal: item.line_total
            }))}
            subtotal={salesOrder.subtotal}
            taxAmount={salesOrder.line_items.reduce((sum, item) => sum + parseFloat(item.vat_amount), 0)}
            shippingFee={salesOrder.shipping_fee}
            shippingVatRate={salesOrder.shipping_vat_rate}
            shippingVatAmount={salesOrder.shipping_fee && salesOrder.shipping_vat_rate ? 
              (parseFloat(salesOrder.shipping_fee) * parseFloat(salesOrder.shipping_vat_rate) / 100).toFixed(2) : undefined}
            rushFee={salesOrder.rush_fee}
            totalAmount={(
              parseFloat(salesOrder.total_amount) + 
              parseFloat(salesOrder.shipping_fee || '0') + 
              (parseFloat(salesOrder.shipping_fee || '0') * parseFloat(salesOrder.shipping_vat_rate || '0') / 100) +
              parseFloat(salesOrder.rush_fee || '0')
            ).toFixed(2)}
            notes={salesOrder.customer_notes}
            termsConditions={salesOrder.terms_conditions}
            paymentTerms={salesOrder.payment_terms === 'custom' ? salesOrder.custom_payment_terms : salesOrder.payment_terms_display}
            deliveryMethod={salesOrder.delivery_method === 'custom' ? salesOrder.custom_delivery_method : salesOrder.delivery_method_display}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* First Row - Basic Info and Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Order Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order Number</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{salesOrder.sales_order_number}</p>
                </div>
                {salesOrder.reference_number && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reference Number</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{salesOrder.reference_number}</p>
                  </div>
                )}
                {salesOrder.po_number && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PO Number</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{salesOrder.po_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <BadgeCell value={salesOrder.status_display} variant={getStatusBadgeVariant(salesOrder.status)} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Order Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(salesOrder.sales_order_date).toLocaleDateString()}
                  </p>
                </div>
                {salesOrder.expected_shipment_date && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Expected Ship Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(salesOrder.expected_shipment_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {salesOrder.estimate_number && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">From Estimate</p>
                    <a 
                      href={`/finance/estimates/${salesOrder.estimate}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {salesOrder.estimate_number}
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Items Subtotal:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${parseFloat(salesOrder.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Items VAT:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${salesOrder.line_items.reduce((sum, item) => sum + parseFloat(item.vat_amount), 0).toFixed(2)}
                  </span>
                </div>
                {salesOrder.shipping_fee && parseFloat(salesOrder.shipping_fee) > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Shipping Fee:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${parseFloat(salesOrder.shipping_fee).toFixed(2)}
                      </span>
                    </div>
                    {salesOrder.shipping_vat_amount && parseFloat(salesOrder.shipping_vat_amount) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Shipping VAT ({salesOrder.shipping_vat_rate}%):
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${parseFloat(salesOrder.shipping_vat_amount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {salesOrder.rush_fee && parseFloat(salesOrder.rush_fee) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Rush Fee:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${parseFloat(salesOrder.rush_fee).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ${(
                        parseFloat(salesOrder.total_amount) + 
                        parseFloat(salesOrder.shipping_fee || '0') + 
                        (parseFloat(salesOrder.shipping_fee || '0') * parseFloat(salesOrder.shipping_vat_rate || '0') / 100) +
                        parseFloat(salesOrder.rush_fee || '0')
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
                {salesOrder.line_items && salesOrder.line_items.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {salesOrder.line_items.length} line item{salesOrder.line_items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer & Assignment */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer & Assignment</h3>
              <div className="space-y-4">
                {salesOrder.customer_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{salesOrder.customer_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Account</p>
                  <a 
                    href={`/crm/accounts/${salesOrder.account}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {salesOrder.account_name}
                  </a>
                </div>
                {salesOrder.contact_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
                    <a 
                      href={`/crm/contacts/${salesOrder.contact}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {salesOrder.contact_name}
                    </a>
                  </div>
                )}
                {salesOrder.deal_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Related Deal</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{salesOrder.deal_name}</p>
                  </div>
                )}
                {salesOrder.owner_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Salesperson</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{salesOrder.owner_name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Second Row - Payment & Delivery and Shipping Status */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Payment & Delivery */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Payment & Delivery</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Terms</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {salesOrder.payment_terms === 'custom' 
                      ? salesOrder.custom_payment_terms 
                      : salesOrder.payment_terms_display}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Method</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {salesOrder.delivery_method === 'custom'
                      ? salesOrder.custom_delivery_method
                      : salesOrder.delivery_method_display}
                  </p>
                </div>
              </div>
            </div>

            {/* Shipping Status */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Status</h3>
              <div className="space-y-4">
                {salesOrder.actual_shipment_date && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Actual Ship Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(salesOrder.actual_shipment_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {salesOrder.delivery_date && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Delivery Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(salesOrder.delivery_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
                {!salesOrder.actual_shipment_date && !salesOrder.delivery_date && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Not yet shipped</p>
                )}
              </div>
            </div>
          </div>

          {/* Third Row - Addresses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Billing Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Billing Address</h3>
              {(salesOrder.billing_street || salesOrder.billing_city) ? (
                <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                  {salesOrder.billing_attention && (
                    <p className="font-medium">{salesOrder.billing_attention}</p>
                  )}
                  {salesOrder.billing_street && <p>{salesOrder.billing_street}</p>}
                  {(salesOrder.billing_city || salesOrder.billing_state_province || salesOrder.billing_zip_postal_code) && (
                    <p>
                      {[salesOrder.billing_city, salesOrder.billing_state_province, salesOrder.billing_zip_postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {salesOrder.billing_country && <p>{salesOrder.billing_country}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No billing address provided</p>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Address</h3>
              {(salesOrder.shipping_street || salesOrder.shipping_city) ? (
                <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                  {salesOrder.shipping_attention && (
                    <p className="font-medium">{salesOrder.shipping_attention}</p>
                  )}
                  {salesOrder.shipping_street && <p>{salesOrder.shipping_street}</p>}
                  {(salesOrder.shipping_city || salesOrder.shipping_state_province || salesOrder.shipping_zip_postal_code) && (
                    <p>
                      {[salesOrder.shipping_city, salesOrder.shipping_state_province, salesOrder.shipping_zip_postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {salesOrder.shipping_country && <p>{salesOrder.shipping_country}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No shipping address provided</p>
              )}
            </div>
          </div>

          {/* Fourth Row - Line Items Summary */}
          {salesOrder.line_items && salesOrder.line_items.length > 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Line Items Summary</h3>
                <button
                  onClick={() => setActiveTab('line-items')}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  View All Items →
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        SKU
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Qty
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Unit Price
                      </th>
                      {salesOrder.line_items.some(item => parseFloat(item.discount_rate) > 0) && (
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Discount
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subtotal
                      </th>
                      {salesOrder.line_items.some(item => parseFloat(item.vat_rate) > 0) && (
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          VAT
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {salesOrder.line_items.slice(0, 5).map((item) => (
                      <tr key={item.line_item_id}>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white">
                          <div>
                            <div className="font-medium">{item.product_name}</div>
                            {item.product_type && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{item.product_type}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                          {item.product_sku || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate">
                          {item.description || '-'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                          {item.quantity}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                          ${parseFloat(item.unit_price).toFixed(2)}
                        </td>
                        {salesOrder.line_items.some(item => parseFloat(item.discount_rate) > 0) && (
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                            {parseFloat(item.discount_rate) > 0 ? `${item.discount_rate}%` : '-'}
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                          ${parseFloat(item.line_subtotal).toFixed(2)}
                        </td>
                        {salesOrder.line_items.some(item => parseFloat(item.vat_rate) > 0) && (
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                            {parseFloat(item.vat_rate) > 0 ? (
                              <div>
                                <div className="text-xs text-gray-500">{item.vat_rate}%</div>
                                <div>${parseFloat(item.vat_amount).toFixed(2)}</div>
                              </div>
                            ) : '-'}
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 dark:text-white text-right">
                          ${parseFloat(item.line_total).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {salesOrder.line_items.length > 5 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">
                          ... and {salesOrder.line_items.length - 5} more items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fifth Row - Notes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Customer Notes */}
            {salesOrder.customer_notes && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer Notes</h3>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{salesOrder.customer_notes}</p>
              </div>
            )}

            {/* Terms & Conditions */}
            {salesOrder.terms_conditions && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Terms & Conditions</h3>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{salesOrder.terms_conditions}</p>
              </div>
            )}

            {/* Internal Notes */}
            {salesOrder.internal_notes && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Internal Notes</h3>
                <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded">
                  <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{salesOrder.internal_notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )
    },
    { 
      key: 'line-items', 
      label: 'Line Items', 
      content: (
        <SalesOrderLineItemsList
          salesOrderId={salesOrderId}
          lineItems={salesOrder.line_items}
          shippingFee={salesOrder.shipping_fee}
          shippingVatRate={salesOrder.shipping_vat_rate}
          shippingVatAmount={salesOrder.shipping_vat_amount}
          rushFee={salesOrder.rush_fee}
          onUpdate={refetch}
          editable={canManageSalesOrders && ['draft', 'confirmed'].includes(salesOrder.status)}
        />
      ) 
    },
    { key: 'emails', label: 'Emails', content: <EmailsTab /> },
    { 
      key: 'attachments', 
      label: 'Attachments', 
      content: (
        <AttachmentsTab
          entityType="sales_order"
          entityId={salesOrderId}
        />
      ) 
    },
    { key: 'timeline', label: 'Timeline', content: <TimelineTab /> },
  ]

  return (
    <div className="w-full p-6">
      {/* Title Box */}
      <TitleBox>
        <div className="flex items-center justify-between">
          <div className="flex items-start space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
              {getStatusIcon(salesOrder.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {salesOrder.sales_order_number}
                </h1>
                <BadgeCell 
                  value={salesOrder.status_display} 
                  variant={getStatusBadgeVariant(salesOrder.status)}
                />
              </div>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Building2 className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  {salesOrder.account_name}
                </div>
                {salesOrder.contact_name && (
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {salesOrder.contact_name}
                  </div>
                )}
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  ${parseFloat(salesOrder.total_amount).toFixed(2)} Total
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  Order Date: {new Date(salesOrder.sales_order_date).toLocaleDateString()}
                </div>
                {salesOrder.expected_shipment_date && (
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Truck className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    Ships: {new Date(salesOrder.expected_shipment_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {canManageSalesOrders && (
            <div className="flex items-center space-x-2">
              {salesOrder.status === 'confirmed' && (
                <button
                  onClick={() => handleStatusUpdate('in_progress')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
                >
                  <Package className="h-4 w-4 mr-1" />
                  Start Processing
                </button>
              )}
              {salesOrder.status === 'in_progress' && (
                <button
                  onClick={() => handleStatusUpdate('shipped')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <Truck className="h-4 w-4 mr-1" />
                  Mark as Shipped
                </button>
              )}
              {salesOrder.status === 'shipped' && (
                <button
                  onClick={() => handleStatusUpdate('delivered')}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark as Delivered
                </button>
              )}
              <button
                onClick={() => navigate(`/finance/sales-orders/${salesOrderId}/edit`)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicateSalesOrder.isPending}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </button>
              {(salesOrder.status === 'confirmed' || salesOrder.status === 'shipped' || salesOrder.status === 'delivered') && (
                <button
                  onClick={handleConvertToInvoice}
                  disabled={convertToInvoice.isPending}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Convert to Invoice
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleteSalesOrder.isPending}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </TitleBox>

      {/* Tabs with custom header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
        {/* Tab Navigation with PDF buttons */}
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center px-6">
            {/* Tab buttons */}
            <nav className="flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as typeof activeTab)}
                  className={`py-3 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            
            {/* PDF buttons - only show on overview tab */}
            {activeTab === 'overview' && (
              <div className="flex items-center space-x-2 py-2">
                <button
                  onClick={() => setIsPDFView(!isPDFView)}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  title={isPDFView ? "Switch to Normal View" : "Switch to PDF View"}
                >
                  <FileDown className="h-3.5 w-3.5 mr-1" />
                  {isPDFView ? 'Normal View' : 'PDF View'}
                </button>
                
                {isPDFView && (
                  <>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Print Sales Order"
                    >
                      <Printer className="h-3.5 w-3.5 mr-1" />
                      Print
                    </button>
                    
                    <button
                      onClick={handleDownloadPDF}
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-xs font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      title="Download as PDF"
                    >
                      <Download className="h-3.5 w-3.5 mr-1" />
                      Download PDF
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Tab Content */}
        <div className="p-6">
          {tabs.find(tab => tab.key === activeTab)?.content || (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No content available for this tab</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}