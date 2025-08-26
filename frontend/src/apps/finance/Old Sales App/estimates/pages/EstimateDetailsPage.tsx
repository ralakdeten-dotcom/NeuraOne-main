import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Calendar, DollarSign, User, Building2, Send, Check, X, Clock, Copy, ArrowRight, FileDown, Printer, Download, FileOutput } from 'lucide-react'
import { 
  useEstimate, 
  useDeleteEstimate, 
  useDuplicateEstimate, 
  useConvertToSalesOrder,
  useConvertToInvoice
} from '../api'
import { showErrorMessage } from '@/utils/error'
import { TitleBox, BadgeCell, DocumentPDFView, DropdownMenu } from '@/shared/components'
import { EmailsTab, TimelineTab } from '@/shared/components/tabs'
import { AttachmentsTab } from '@/shared/components/attachments'
import { LineItemsList } from '../components/LineItemsList'
import { usePermissions } from '@/core/auth/usePermissions'
import type { DropdownItem } from '@/shared/components/dropdowns/DropdownMenu'

interface EstimateDetailsPageProps {
  estimateId: number
}

export const EstimateDetailsPage: React.FC<EstimateDetailsPageProps> = ({ estimateId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'line-items' | 'emails' | 'attachments' | 'timeline'>('overview')
  const [isPDFView, setIsPDFView] = useState(false)
  
  const navigate = useNavigate()
  const permissions = usePermissions()
  
  const { data: estimate, isLoading, error, refetch } = useEstimate(estimateId)
  const deleteEstimate = useDeleteEstimate()
  const duplicateEstimate = useDuplicateEstimate()
  const convertToSalesOrder = useConvertToSalesOrder()
  const convertToInvoice = useConvertToInvoice()

  const canManageEstimates = permissions.hasPermission('manage_opportunities') || permissions.hasPermission('all')

  const handlePrint = () => {
    // Store current state
    const originalTitle = document.title
    
    // Set document title for print
    document.title = `${estimate?.estimate_number} - Ralakde Limited`
    
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
    document.title = `${estimate?.estimate_number} - Ralakde Limited`
    
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
    if (!estimate) return
    
    if (window.confirm(`Are you sure you want to delete estimate "${estimate.estimate_number}"?`)) {
      try {
        await deleteEstimate.mutateAsync(estimateId)
        alert('Estimate deleted successfully')
        navigate('/finance/estimates')
      } catch (error: any) {
        showErrorMessage(error, 'deleting estimate')
      }
    }
  }

  const handleDuplicate = async () => {
    if (!estimate) return
    
    try {
      const result = await duplicateEstimate.mutateAsync(estimateId)
      alert('Estimate duplicated successfully')
      navigate(`/finance/estimates/${result.estimate_id}`)
    } catch (error: any) {
      showErrorMessage(error, 'duplicating estimate')
    }
  }

  const handleConvertToSalesOrder = async () => {
    if (!estimate) return

    if (estimate.status !== 'accepted') {
      alert('Only accepted estimates can be converted to sales orders')
      return
    }

    if (window.confirm(`Convert estimate "${estimate.estimate_number}" to a sales order?`)) {
      try {
        const result = await convertToSalesOrder.mutateAsync(estimateId)
        alert(`Estimate converted to sales order: ${result.sales_order_number}`)
        navigate(`/finance/sales-orders/${result.sales_order_id}`)
      } catch (error: any) {
        showErrorMessage(error, 'converting estimate to sales order')
      }
    }
  }

  const handleConvertToInvoice = async () => {
    if (!estimate) return
    
    if (estimate.status !== 'accepted' && estimate.status !== 'sent') {
      alert('Only accepted or sent estimates can be converted to invoices')
      return
    }
    
    if (window.confirm(`Convert estimate "${estimate.estimate_number}" to an invoice?`)) {
      try {
        const result = await convertToInvoice.mutateAsync({ 
          id: estimateId, 
          data: {
            invoice_date: new Date().toISOString().split('T')[0],
            payment_terms: 'net_30'
          }
        })
        alert(`Estimate converted to invoice: ${result.invoice_number}`)
        navigate(`/finance/invoices/${result.invoice_id}`)
      } catch (error: any) {
        showErrorMessage(error, 'converting estimate to invoice')
      }
    }
  }


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />
      case 'sent':
        return <Send className="h-5 w-5 text-blue-500" />
      case 'accepted':
        return <Check className="h-5 w-5 text-green-500" />
      case 'rejected':
        return <X className="h-5 w-5 text-red-500" />
      case 'expired':
        return <Clock className="h-5 w-5 text-yellow-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'draft':
        return 'gray'
      case 'sent':
        return 'blue'
      case 'accepted':
        return 'green'
      case 'rejected':
        return 'red'
      case 'expired':
        return 'yellow'
      default:
        return 'gray'
    }
  }

  const isExpired = estimate && new Date(estimate.valid_until) < new Date() && estimate.status !== 'accepted'

  if (isLoading) return <div className="p-6">Loading estimate...</div>
  if (error) return <div className="p-6 text-red-600">Error loading estimate: {error.message}</div>
  if (!estimate) return <div className="p-6 text-gray-600">Estimate not found</div>

  const tabs = [
    { 
      key: 'overview', 
      label: 'Overview', 
      content: isPDFView ? (
        <div className="print-area">
          <DocumentPDFView
            documentType="ESTIMATE"
            documentNumber={estimate.estimate_number}
            documentStatus={estimate.status_display}
            statusVariant={estimate.status as any}
            customerName={estimate.account_name}
            billingAddress={{
              attention: estimate.billing_attention,
              street: estimate.billing_street,
              city: estimate.billing_city,
              stateProvince: estimate.billing_state_province,
              zipPostalCode: estimate.billing_zip_postal_code,
              country: estimate.billing_country
            }}
            shippingAddress={{
              attention: estimate.shipping_attention,
              street: estimate.shipping_street,
              city: estimate.shipping_city,
              stateProvince: estimate.shipping_state_province,
              zipPostalCode: estimate.shipping_zip_postal_code,
              country: estimate.shipping_country
            }}
            documentDate={estimate.estimate_date}
            validUntil={estimate.valid_until}
            poNumber={estimate.po_number}
            customerNumber={estimate.customer_name}
            lineItems={estimate.line_items.map(item => ({
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
            subtotal={estimate.subtotal}
            taxAmount={estimate.line_items.reduce((sum, item) => sum + parseFloat(item.vat_amount), 0)}
            shippingFee={estimate.shipping_fee}
            shippingVatRate={estimate.shipping_vat_rate}
            shippingVatAmount={estimate.shipping_fee && estimate.shipping_vat_rate ? 
              (parseFloat(estimate.shipping_fee) * parseFloat(estimate.shipping_vat_rate) / 100).toFixed(2) : undefined}
            rushFee={estimate.rush_fee}
            totalAmount={(
              parseFloat(estimate.total_amount) + 
              parseFloat(estimate.shipping_fee || '0') + 
              (parseFloat(estimate.shipping_fee || '0') * parseFloat(estimate.shipping_vat_rate || '0') / 100) +
              parseFloat(estimate.rush_fee || '0')
            ).toFixed(2)}
            notes={estimate.notes}
            termsConditions={estimate.terms_conditions}
            isExpired={new Date(estimate.valid_until) < new Date() && estimate.status !== 'accepted'}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* First Row - Basic Info and Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Estimate Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estimate Number</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{estimate.estimate_number}</p>
                </div>
                {estimate.po_number && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PO Number</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{estimate.po_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <BadgeCell value={estimate.status_display} variant={getStatusBadgeVariant(estimate.status)} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Estimate Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(estimate.estimate_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Valid Until</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(estimate.valid_until).toLocaleDateString()}
                    {isExpired && <span className="ml-2 text-red-600 text-xs">(Expired)</span>}
                  </p>
                </div>
              </div>
            </div>

            {/* Financial Summary */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Financial Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Items Subtotal:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${parseFloat(estimate.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Items VAT:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${estimate.line_items.reduce((sum, item) => sum + parseFloat(item.vat_amount), 0).toFixed(2)}
                  </span>
                </div>
                {estimate.shipping_fee && parseFloat(estimate.shipping_fee) > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Shipping Fee:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${parseFloat(estimate.shipping_fee).toFixed(2)}
                      </span>
                    </div>
                    {estimate.shipping_vat_amount && parseFloat(estimate.shipping_vat_amount) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Shipping VAT ({estimate.shipping_vat_rate}%):
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${parseFloat(estimate.shipping_vat_amount).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {estimate.rush_fee && parseFloat(estimate.rush_fee) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Rush Fee:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${parseFloat(estimate.rush_fee).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ${(
                        parseFloat(estimate.total_amount) + 
                        parseFloat(estimate.shipping_fee || '0') + 
                        (parseFloat(estimate.shipping_fee || '0') * parseFloat(estimate.shipping_vat_rate || '0') / 100) +
                        parseFloat(estimate.rush_fee || '0')
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
                {estimate.line_items && estimate.line_items.length > 0 && (
                  <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {estimate.line_items.length} line item{estimate.line_items.length > 1 ? 's' : ''}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Customer & Assignment */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer & Assignment</h3>
              <div className="space-y-4">
                {estimate.customer_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{estimate.customer_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Account</p>
                  <a 
                    href={`/crm/accounts/${estimate.account}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {estimate.account_name}
                  </a>
                </div>
                {estimate.contact_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
                    <a 
                      href={`/crm/contacts/${estimate.contact}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {estimate.contact_name}
                    </a>
                  </div>
                )}
                {estimate.deal_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Related Deal</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{estimate.deal_name}</p>
                  </div>
                )}
                {estimate.owner_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{estimate.owner_name}</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Second Row - Addresses */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Billing Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Billing Address</h3>
              {(estimate.billing_street || estimate.billing_city) ? (
                <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                  {estimate.billing_attention && (
                    <p className="font-medium">{estimate.billing_attention}</p>
                  )}
                  {estimate.billing_street && <p>{estimate.billing_street}</p>}
                  {(estimate.billing_city || estimate.billing_state_province || estimate.billing_zip_postal_code) && (
                    <p>
                      {[estimate.billing_city, estimate.billing_state_province, estimate.billing_zip_postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {estimate.billing_country && <p>{estimate.billing_country}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No billing address provided</p>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Address</h3>
              {(estimate.shipping_street || estimate.shipping_city) ? (
                <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                  {estimate.shipping_attention && (
                    <p className="font-medium">{estimate.shipping_attention}</p>
                  )}
                  {estimate.shipping_street && <p>{estimate.shipping_street}</p>}
                  {(estimate.shipping_city || estimate.shipping_state_province || estimate.shipping_zip_postal_code) && (
                    <p>
                      {[estimate.shipping_city, estimate.shipping_state_province, estimate.shipping_zip_postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {estimate.shipping_country && <p>{estimate.shipping_country}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No shipping address provided</p>
              )}
            </div>
          </div>

          {/* Third Row - Line Items Summary */}
          {estimate.line_items && estimate.line_items.length > 0 && (
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
                      {estimate.line_items.some(item => parseFloat(item.discount_rate) > 0) && (
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Discount
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subtotal
                      </th>
                      {estimate.line_items.some(item => parseFloat(item.vat_rate) > 0) && (
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
                    {estimate.line_items.slice(0, 5).map((item) => (
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
                        {estimate.line_items.some(item => parseFloat(item.discount_rate) > 0) && (
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                            {parseFloat(item.discount_rate) > 0 ? `${item.discount_rate}%` : '-'}
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                          ${parseFloat(item.line_subtotal).toFixed(2)}
                        </td>
                        {estimate.line_items.some(item => parseFloat(item.vat_rate) > 0) && (
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
                    {estimate.line_items.length > 5 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">
                          ... and {estimate.line_items.length - 5} more items
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Fourth Row - Notes and Terms */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Internal Notes</h3>
              {estimate.notes ? (
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{estimate.notes}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No internal notes</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Terms & Conditions</h3>
              {estimate.terms_conditions ? (
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{estimate.terms_conditions}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No terms & conditions specified</p>
              )}
            </div>
          </div>
        </div>
      )
    },
    { 
      key: 'line-items', 
      label: 'Line Items', 
      content: (
        <LineItemsList
          estimateId={estimateId}
          lineItems={estimate.line_items}
          shippingFee={estimate.shipping_fee}
          shippingVatRate={estimate.shipping_vat_rate}
          shippingVatAmount={estimate.shipping_vat_amount}
          rushFee={estimate.rush_fee}
          onUpdate={refetch}
          editable={canManageEstimates}
        />
      ) 
    },
    { key: 'emails', label: 'Emails', content: <EmailsTab /> },
    { 
      key: 'attachments', 
      label: 'Attachments', 
      content: (
        <AttachmentsTab
          entityType="estimate"
          entityId={estimateId}
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
              {getStatusIcon(estimate.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {estimate.estimate_number}
                </h1>
                <BadgeCell 
                  value={estimate.status_display} 
                  variant={getStatusBadgeVariant(estimate.status)}
                />
                {isExpired && (
                  <BadgeCell value="EXPIRED" variant="red" />
                )}
              </div>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Building2 className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  {estimate.account_name}
                </div>
                {estimate.contact_name && (
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {estimate.contact_name}
                  </div>
                )}
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  ${parseFloat(estimate.total_amount).toFixed(2)} Total
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  Valid until {new Date(estimate.valid_until).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
          
          {canManageEstimates && (
            <div className="flex items-center space-x-2">
              <button
                  onClick={() => navigate(`/finance/estimates/${estimateId}/edit`)}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Edit
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={duplicateEstimate.isPending}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <Copy className="h-4 w-4 mr-1" />
                  Duplicate
                </button>
                
                {/* Convert To Dropdown */}
                {(estimate.status === 'accepted' || estimate.status === 'sent') && (
                  <DropdownMenu
                    trigger={
                      <div className="inline-flex items-center text-sm font-medium text-white">
                        <FileOutput className="h-4 w-4 mr-1" />
                        Convert to
                      </div>
                    }
                    items={[
                      {
                        id: 'sales-order',
                        label: 'Sales Order',
                        icon: <ArrowRight />,
                        onClick: handleConvertToSalesOrder,
                        disabled: estimate.status !== 'accepted' || convertToSalesOrder.isPending
                      },
                      {
                        id: 'invoice',
                        label: 'Invoice',
                        icon: <FileText />,
                        onClick: handleConvertToInvoice,
                        disabled: (estimate.status !== 'accepted' && estimate.status !== 'sent') || convertToInvoice.isPending
                      }
                    ] as DropdownItem[]}
                    className="!bg-blue-600 !border-blue-600 hover:!bg-blue-700 !text-white"
                    position="right"
                    size="md"
                  />
                )}
                
                <button
                  onClick={handleDelete}
                  disabled={deleteEstimate.isPending}
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
                      title="Print Estimate"
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