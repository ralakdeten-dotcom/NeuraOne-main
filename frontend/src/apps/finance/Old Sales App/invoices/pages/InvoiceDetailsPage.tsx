import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Calendar, DollarSign, User, Building2, CreditCard, Check, X, Clock, Copy, FileDown, Printer, Download, AlertTriangle } from 'lucide-react'
import { 
  useInvoice, 
  useDeleteInvoice, 
  useDuplicateInvoice,
  useMarkInvoiceSent,
  useMarkInvoicePaid,
  useCancelInvoice,
  useCreateInvoicePayment,
  InvoicePaymentCreate
} from '../api'
import { showErrorMessage } from '@/utils/error'
import { TitleBox, DocumentPDFView } from '@/shared/components'
import { EmailsTab, TimelineTab } from '@/shared/components/tabs'
import { AttachmentsTab } from '@/shared/components/attachments'
import { InvoiceLineItemsList } from '../components/InvoiceLineItemsList'
import { usePermissions } from '@/core/auth/usePermissions'
import PaymentStatusBadge from '../components/PaymentStatusBadge'

interface InvoiceDetailsPageProps {
  invoiceId: number
}

export const InvoiceDetailsPage: React.FC<InvoiceDetailsPageProps> = ({ invoiceId }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'line-items' | 'payments' | 'emails' | 'attachments' | 'timeline'>('overview')
  const [isPDFView, setIsPDFView] = useState(false)
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [paymentData, setPaymentData] = useState<Partial<InvoicePaymentCreate>>({
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'credit_card'
  })
  
  const navigate = useNavigate()
  const permissions = usePermissions()
  
  const { data: invoice, isLoading, error, refetch } = useInvoice(invoiceId)
  const deleteInvoice = useDeleteInvoice()
  const duplicateInvoice = useDuplicateInvoice()
  const markSent = useMarkInvoiceSent()
  const markPaid = useMarkInvoicePaid()
  const cancelInvoice = useCancelInvoice()
  const createPayment = useCreateInvoicePayment()

  const canManageInvoices = permissions.hasPermission('manage_opportunities') || permissions.hasPermission('all')

  const handlePrint = () => {
    const originalTitle = document.title
    document.title = `${invoice?.invoice_number} - Ralakde Limited`
    
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
    window.print()
    document.title = originalTitle
    setTimeout(() => {
      document.head.removeChild(style)
    }, 100)
  }

  const handleDownloadPDF = () => {
    const originalTitle = document.title
    document.title = `${invoice?.invoice_number} - Ralakde Limited`
    
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
    window.print()
    document.title = originalTitle
    setTimeout(() => {
      document.head.removeChild(style)
    }, 100)
  }

  const handleDelete = async () => {
    if (!invoice) return
    
    if (window.confirm(`Are you sure you want to delete invoice "${invoice.invoice_number}"?`)) {
      try {
        await deleteInvoice.mutateAsync(invoiceId)
        alert('Invoice deleted successfully')
        navigate('/finance/invoices')
      } catch (error: any) {
        showErrorMessage(error, 'deleting invoice')
      }
    }
  }

  const handleDuplicate = async () => {
    if (!invoice) return
    
    try {
      const result = await duplicateInvoice.mutateAsync(invoiceId)
      alert('Invoice duplicated successfully')
      navigate(`/finance/invoices/${result.invoice_id}`)
    } catch (error: any) {
      showErrorMessage(error, 'duplicating invoice')
    }
  }

  const handleMarkSent = async () => {
    if (!invoice) return
    try {
      await markSent.mutateAsync(invoice.invoice_id)
      alert('Invoice marked as sent')
      refetch()
    } catch (error: any) {
      showErrorMessage(error, 'marking invoice as sent')
    }
  }

  const handleMarkPaid = async () => {
    if (!invoice) return
    try {
      // Calculate the grand total including all fees
      const grandTotal = parseFloat(invoice.total_amount) + 
        parseFloat(invoice.shipping_fee || '0') + 
        (parseFloat(invoice.shipping_fee || '0') * parseFloat(invoice.shipping_vat_rate || '0') / 100) +
        parseFloat(invoice.rush_fee || '0')
      
      // Calculate the actual remaining amount to pay
      const remainingAmount = grandTotal - parseFloat(invoice.amount_paid)
      
      // Use mark_paid with the grand total amount
      await markPaid.mutateAsync({ 
        id: invoice.invoice_id, 
        amount: remainingAmount 
      })
      
      alert('Invoice marked as paid')
      refetch()
    } catch (error: any) {
      showErrorMessage(error, 'marking invoice as paid')
    }
  }

  const handleCancel = async () => {
    if (!invoice) return
    if (window.confirm(`Are you sure you want to cancel invoice "${invoice.invoice_number}"?`)) {
      try {
        await cancelInvoice.mutateAsync(invoice.invoice_id)
        alert('Invoice cancelled')
        refetch()
      } catch (error: any) {
        showErrorMessage(error, 'cancelling invoice')
      }
    }
  }

  const handleAddPayment = async () => {
    if (!invoice || !paymentData.amount || !paymentData.payment_date) return
    
    try {
      await createPayment.mutateAsync({
        invoice: invoice.invoice_id,
        amount: paymentData.amount,
        payment_date: paymentData.payment_date,
        payment_method: paymentData.payment_method || 'credit_card',
        reference_number: paymentData.reference_number,
        notes: paymentData.notes
      })
      alert('Payment added successfully')
      setShowPaymentForm(false)
      setPaymentData({
        payment_date: new Date().toISOString().split('T')[0],
        payment_method: 'credit_card'
      })
      refetch()
    } catch (error: any) {
      showErrorMessage(error, 'adding payment')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <FileText className="h-5 w-5 text-gray-500" />
      case 'sent':
        return <CreditCard className="h-5 w-5 text-blue-500" />
      case 'paid':
        return <Check className="h-5 w-5 text-green-500" />
      case 'partial':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'overdue':
        return <AlertTriangle className="h-5 w-5 text-red-500" />
      case 'cancelled':
        return <X className="h-5 w-5 text-gray-500" />
      default:
        return <FileText className="h-5 w-5 text-gray-500" />
    }
  }


  if (isLoading) return <div className="p-6">Loading invoice...</div>
  if (error) return <div className="p-6 text-red-600">Error loading invoice: {error.message}</div>
  if (!invoice) return <div className="p-6 text-gray-600">Invoice not found</div>

  const tabs = [
    { 
      key: 'overview', 
      label: 'Overview', 
      content: isPDFView ? (
        <div className="print-area">
          <DocumentPDFView
            documentType="INVOICE"
            documentNumber={invoice.invoice_number}
            documentStatus={invoice.status === 'partial' ? 'Partially Paid' : invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
            statusVariant={invoice.status as any}
            customerName={invoice.account_name}
            billingAddress={{
              attention: invoice.billing_attention,
              street: invoice.billing_street,
              city: invoice.billing_city,
              stateProvince: invoice.billing_state_province,
              zipPostalCode: invoice.billing_zip_postal_code,
              country: invoice.billing_country
            }}
            shippingAddress={{
              attention: invoice.shipping_attention,
              street: invoice.shipping_street,
              city: invoice.shipping_city,
              stateProvince: invoice.shipping_state_province,
              zipPostalCode: invoice.shipping_zip_postal_code,
              country: invoice.shipping_country
            }}
            documentDate={invoice.invoice_date}
            dueDate={invoice.due_date}
            poNumber={invoice.po_number}
            customerNumber={invoice.customer_name}
            lineItems={invoice.line_items.map(item => ({
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
            subtotal={invoice.subtotal}
            taxAmount={invoice.line_items.reduce((sum, item) => sum + parseFloat(item.vat_amount), 0)}
            shippingFee={invoice.shipping_fee}
            shippingVatRate={invoice.shipping_vat_rate}
            shippingVatAmount={invoice.shipping_fee && invoice.shipping_vat_rate ? 
              (parseFloat(invoice.shipping_fee) * parseFloat(invoice.shipping_vat_rate) / 100).toFixed(2) : undefined}
            rushFee={invoice.rush_fee}
            totalAmount={(
              parseFloat(invoice.total_amount) + 
              parseFloat(invoice.shipping_fee || '0') + 
              (parseFloat(invoice.shipping_fee || '0') * parseFloat(invoice.shipping_vat_rate || '0') / 100) +
              parseFloat(invoice.rush_fee || '0')
            ).toFixed(2)}
            notes={invoice.notes}
            termsConditions={invoice.terms_conditions}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* First Row - Basic Info and Financial Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Basic Information */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Invoice Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoice Number</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.invoice_number}</p>
                </div>
                {invoice.po_number && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">PO Number</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.po_number}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
                  <PaymentStatusBadge status={invoice.status} isOverdue={invoice.is_overdue} />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Invoice Date</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(invoice.invoice_date).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Due Date</p>
                  <p className={`text-sm font-medium ${invoice.is_overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                    {new Date(invoice.due_date).toLocaleDateString()}
                    {invoice.is_overdue && <span className="ml-2 text-xs">({invoice.days_overdue} days overdue)</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Payment Terms</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.payment_terms_display}</p>
                </div>
                {invoice.paid_date && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Paid Date</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {new Date(invoice.paid_date).toLocaleDateString()}
                    </p>
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
                    ${parseFloat(invoice.subtotal).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Items VAT:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    ${invoice.line_items.reduce((sum, item) => sum + parseFloat(item.vat_amount), 0).toFixed(2)}
                  </span>
                </div>
                {invoice.shipping_fee && parseFloat(invoice.shipping_fee) > 0 && (
                  <>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Shipping Fee:</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        ${parseFloat(invoice.shipping_fee).toFixed(2)}
                      </span>
                    </div>
                    {invoice.shipping_vat_rate && parseFloat(invoice.shipping_vat_rate) > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Shipping VAT ({invoice.shipping_vat_rate}%):
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          ${(parseFloat(invoice.shipping_fee || '0') * parseFloat(invoice.shipping_vat_rate || '0') / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </>
                )}
                {invoice.rush_fee && parseFloat(invoice.rush_fee) > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Rush Fee:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      ${parseFloat(invoice.rush_fee).toFixed(2)}
                    </span>
                  </div>
                )}
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-semibold text-gray-900 dark:text-white">Total Amount:</span>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      ${(
                        parseFloat(invoice.total_amount) + 
                        parseFloat(invoice.shipping_fee || '0') + 
                        (parseFloat(invoice.shipping_fee || '0') * parseFloat(invoice.shipping_vat_rate || '0') / 100) +
                        parseFloat(invoice.rush_fee || '0')
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Amount Paid:</span>
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                      ${parseFloat(invoice.amount_paid).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">Amount Due:</span>
                    <span className={`text-base font-bold ${invoice.is_overdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
                      ${(
                        parseFloat(invoice.total_amount) + 
                        parseFloat(invoice.shipping_fee || '0') + 
                        (parseFloat(invoice.shipping_fee || '0') * parseFloat(invoice.shipping_vat_rate || '0') / 100) +
                        parseFloat(invoice.rush_fee || '0') -
                        parseFloat(invoice.amount_paid)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Customer & Assignment */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Customer & Assignment</h3>
              <div className="space-y-4">
                {invoice.customer_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Customer</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.customer_name}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Account</p>
                  <a 
                    href={`/crm/accounts/${invoice.account}`}
                    className="text-sm font-medium text-blue-600 hover:text-blue-500"
                  >
                    {invoice.account_name}
                  </a>
                </div>
                {invoice.contact_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Contact</p>
                    <a 
                      href={`/crm/contacts/${invoice.contact}`}
                      className="text-sm font-medium text-blue-600 hover:text-blue-500"
                    >
                      {invoice.contact_name}
                    </a>
                  </div>
                )}
                {invoice.deal_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Related Deal</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.deal_name}</p>
                  </div>
                )}
                {invoice.owner_name && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Owner</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.owner_name}</p>
                  </div>
                )}
                {invoice.estimate_number && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Source Estimate</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.estimate_number}</p>
                  </div>
                )}
                {invoice.sales_order_number && (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Source Sales Order</p>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{invoice.sales_order_number}</p>
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
              {(invoice.billing_street || invoice.billing_city) ? (
                <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                  {invoice.billing_attention && (
                    <p className="font-medium">{invoice.billing_attention}</p>
                  )}
                  {invoice.billing_street && <p>{invoice.billing_street}</p>}
                  {(invoice.billing_city || invoice.billing_state_province || invoice.billing_zip_postal_code) && (
                    <p>
                      {[invoice.billing_city, invoice.billing_state_province, invoice.billing_zip_postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {invoice.billing_country && <p>{invoice.billing_country}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No billing address provided</p>
              )}
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Shipping Address</h3>
              {(invoice.shipping_street || invoice.shipping_city) ? (
                <div className="space-y-1 text-sm text-gray-900 dark:text-white">
                  {invoice.shipping_attention && (
                    <p className="font-medium">{invoice.shipping_attention}</p>
                  )}
                  {invoice.shipping_street && <p>{invoice.shipping_street}</p>}
                  {(invoice.shipping_city || invoice.shipping_state_province || invoice.shipping_zip_postal_code) && (
                    <p>
                      {[invoice.shipping_city, invoice.shipping_state_province, invoice.shipping_zip_postal_code]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {invoice.shipping_country && <p>{invoice.shipping_country}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No shipping address provided</p>
              )}
            </div>
          </div>

          {/* Third Row - Line Items Summary */}
          {invoice.line_items && invoice.line_items.length > 0 && (
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
                      {invoice.line_items.some(item => parseFloat(item.discount_rate) > 0) && (
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Discount
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subtotal
                      </th>
                      {invoice.line_items.some(item => parseFloat(item.vat_rate) > 0) && (
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
                    {invoice.line_items.slice(0, 5).map((item) => (
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
                        {invoice.line_items.some(item => parseFloat(item.discount_rate) > 0) && (
                          <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                            {parseFloat(item.discount_rate) > 0 ? `${item.discount_rate}%` : '-'}
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-900 dark:text-white text-right">
                          ${parseFloat(item.line_subtotal).toFixed(2)}
                        </td>
                        {invoice.line_items.some(item => parseFloat(item.vat_rate) > 0) && (
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
                    {invoice.line_items.length > 5 && (
                      <tr>
                        <td colSpan={9} className="px-3 py-2 text-sm text-center text-gray-500 dark:text-gray-400">
                          ... and {invoice.line_items.length - 5} more items
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
              {invoice.notes ? (
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{invoice.notes}</p>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No internal notes</p>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Terms & Conditions</h3>
              {invoice.terms_conditions ? (
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{invoice.terms_conditions}</p>
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
        <InvoiceLineItemsList
          invoiceId={invoiceId}
          lineItems={invoice.line_items}
          shippingFee={invoice.shipping_fee}
          shippingVatRate={invoice.shipping_vat_rate}
          shippingVatAmount={invoice.shipping_vat_rate}
          rushFee={invoice.rush_fee}
          onUpdate={refetch}
          editable={canManageInvoices && invoice.status === 'draft'}
        />
      ) 
    },
    { 
      key: 'payments', 
      label: 'Payments', 
      content: (
        <div className="space-y-6">
          {canManageInvoices && ['sent', 'partial', 'overdue'].includes(invoice.status) && (
            <div className="flex justify-end">
              <button
                onClick={() => setShowPaymentForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment
              </button>
            </div>
          )}
          
          {invoice.payments && invoice.payments.length > 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">Payment History</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Reference
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Notes
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {invoice.payments.map((payment) => (
                      <tr key={payment.payment_id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {new Date(payment.payment_date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                          ${parseFloat(payment.amount).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                          {payment.payment_method_display}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                          {payment.reference_number || '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {payment.notes || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-12">
              <div className="text-center">
                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No payments yet</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Payments will appear here once recorded.
                </p>
              </div>
            </div>
          )}
        </div>
      ) 
    },
    { key: 'emails', label: 'Emails', content: <EmailsTab /> },
    { 
      key: 'attachments', 
      label: 'Attachments', 
      content: (
        <AttachmentsTab
          entityType="invoice"
          entityId={invoiceId}
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
              {getStatusIcon(invoice.status)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white truncate">
                  {invoice.invoice_number}
                </h1>
                <PaymentStatusBadge 
                  status={invoice.status} 
                  isOverdue={invoice.is_overdue}
                />
              </div>
              <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:space-x-6">
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Building2 className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  {invoice.account_name}
                </div>
                {invoice.contact_name && (
                  <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <User className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {invoice.contact_name}
                  </div>
                )}
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <DollarSign className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  ${parseFloat(invoice.total_amount).toFixed(2)} Total
                </div>
                <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4" />
                  Due {new Date(invoice.due_date).toLocaleDateString()}
                </div>
                {invoice.is_overdue && (
                  <div className="mt-2 flex items-center text-sm text-red-600 dark:text-red-400">
                    <AlertTriangle className="flex-shrink-0 mr-1.5 h-4 w-4" />
                    {invoice.days_overdue} days overdue
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {canManageInvoices && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate(`/finance/invoices/${invoiceId}/edit`)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit
              </button>
              <button
                onClick={handleDuplicate}
                disabled={duplicateInvoice.isPending}
                className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                <Copy className="h-4 w-4 mr-1" />
                Duplicate
              </button>
              {invoice.status === 'draft' && (
                <button
                  onClick={handleMarkSent}
                  disabled={markSent.isPending}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  Mark as Sent
                </button>
              )}
              {['sent', 'partial', 'overdue'].includes(invoice.status) && (
                <button
                  onClick={handleMarkPaid}
                  disabled={markPaid.isPending}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                >
                  <Check className="h-4 w-4 mr-1" />
                  Mark as Paid
                </button>
              )}
              {['draft', 'sent'].includes(invoice.status) && (
                <button
                  onClick={handleCancel}
                  disabled={cancelInvoice.isPending}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50"
                >
                  <X className="h-4 w-4 mr-1" />
                  Cancel
                </button>
              )}
              <button
                onClick={handleDelete}
                disabled={deleteInvoice.isPending}
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
                      title="Print Invoice"
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

      {/* Add Payment Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-4">
                Add Payment
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount</label>
                  <input
                    type="number"
                    value={paymentData.amount || ''}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, amount: parseFloat(e.target.value) }))}
                    max={parseFloat(invoice.amount_due)}
                    step="0.01"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Date</label>
                  <input
                    type="date"
                    value={paymentData.payment_date || ''}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_date: e.target.value }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Method</label>
                  <select
                    value={paymentData.payment_method || ''}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, payment_method: e.target.value as any }))}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                    required
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="paypal">PayPal</option>
                    <option value="stripe">Stripe</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Reference Number</label>
                  <input
                    type="text"
                    value={paymentData.reference_number || ''}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, reference_number: e.target.value }))}
                    placeholder="Transaction reference"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                  <textarea
                    value={paymentData.notes || ''}
                    onChange={(e) => setPaymentData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Payment notes"
                    rows={2}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowPaymentForm(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddPayment}
                  disabled={!paymentData.amount || createPayment.isPending}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {createPayment.isPending ? 'Adding...' : 'Add Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceDetailsPage