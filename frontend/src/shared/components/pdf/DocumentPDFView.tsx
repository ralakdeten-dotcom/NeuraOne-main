import React from 'react'

export interface CompanyInfo {
  name: string
  addressLine1?: string
  addressLine2?: string
  addressLine3?: string
  phone?: string
  email?: string
  website?: string
  vatNumber?: string
  registrationNumber?: string
  logo?: string
}

export interface DocumentAddress {
  attention?: string
  street?: string
  city?: string
  stateProvince?: string
  zipPostalCode?: string
  country?: string
  phone?: string
  email?: string
}

export interface DocumentLineItem {
  id: string | number
  name: string
  sku?: string
  type?: string
  description?: string
  quantity: number | string
  unitPrice: number | string
  discountRate?: number | string
  vatRate?: number | string
  vatAmount?: number | string
  lineSubtotal: number | string
  lineTotal: number | string
}

export interface DocumentPDFViewProps {
  // Document Type & Identification
  documentType: 'ESTIMATE' | 'INVOICE' | 'QUOTE' | 'ORDER' | 'RECEIPT'
  documentNumber: string
  documentStatus?: string
  statusVariant?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'paid' | 'overdue' | 'expired'
  
  // Company Information
  companyInfo?: CompanyInfo
  
  // Customer Information
  customerName: string
  billingAddress?: DocumentAddress
  shippingAddress?: DocumentAddress
  
  // Document Dates
  documentDate: string | Date
  dueDate?: string | Date
  validUntil?: string | Date
  
  // Reference Fields
  poNumber?: string
  referenceNumber?: string
  customerNumber?: string
  
  // Line Items
  lineItems: DocumentLineItem[]
  
  // Financial Summary
  subtotal: number | string
  taxAmount?: number | string
  discountAmount?: number | string
  shippingFee?: number | string
  shippingVatRate?: number | string
  shippingVatAmount?: number | string
  rushFee?: number | string
  totalAmount: number | string
  currency?: string
  
  // Additional Content
  notes?: string
  termsConditions?: string
  paymentTerms?: string
  bankDetails?: string
  
  // Customization Options
  showCompanyLogo?: boolean
  showItemImages?: boolean
  accentColor?: string
  dateFormat?: string
  
  // Custom Footer
  footerText?: string
  
  // Flags
  isExpired?: boolean
  isPaid?: boolean
  showSignature?: boolean
  signatureName?: string
  signatureTitle?: string
}

// Default company info for Ralakde Limited
export const RALAKDE_COMPANY_INFO: CompanyInfo = {
  name: 'Ralakde Limited',
  addressLine1: 'Unit 5A Victoria Road',
  addressLine2: 'Stoke On Trent Staffordshire ST4 2HS',
  addressLine3: 'United Kingdom',
  phone: '+441782563377',
  email: 'sales@ralakde.com',
  website: 'www.ralakde.com',
  vatNumber: 'GB246093895'
}

export const DocumentPDFView: React.FC<DocumentPDFViewProps> = ({
  documentType,
  documentNumber,
  documentStatus,
  statusVariant,
  companyInfo = RALAKDE_COMPANY_INFO,
  customerName,
  billingAddress,
  shippingAddress,
  documentDate,
  dueDate,
  validUntil,
  poNumber,
  referenceNumber,
  customerNumber,
  lineItems,
  subtotal,
  taxAmount,
  discountAmount,
  shippingFee,
  shippingVatRate = 20,
  shippingVatAmount,
  rushFee,
  totalAmount,
  currency = '$',
  notes,
  termsConditions,
  paymentTerms,
  bankDetails,
  showCompanyLogo = false,
  accentColor = '#3B82F6',
  dateFormat = 'en-US',
  footerText,
  isExpired = false,
  isPaid = false,
  showSignature = false,
  signatureName,
  signatureTitle
}) => {
  const formatDate = (date: string | Date) => {
    const d = typeof date === 'string' ? new Date(date) : date
    return d.toLocaleDateString(dateFormat, { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatCurrency = (amount: number | string) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount
    return `${currency}${value.toFixed(2)}`
  }

  const getStatusColor = () => {
    switch (statusVariant) {
      case 'accepted':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
      case 'sent':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100'
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
      case 'overdue':
      case 'expired':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'
    }
  }

  const hasDiscounts = lineItems.some(item => item.discountRate && parseFloat(item.discountRate.toString()) > 0)
  const hasVAT = lineItems.some(item => item.vatRate && parseFloat(item.vatRate.toString()) > 0)

  return (
    <div className="bg-white dark:bg-gray-800 shadow-lg mx-auto print-area" style={{ maxWidth: '850px' }}>
      <div className="p-8 space-y-6">
        
        {/* Header Section */}
        <div className="border-b-2 border-gray-300 dark:border-gray-600 pb-6">
          <div className="flex justify-between items-start">
            {/* Company Info */}
            <div className="space-y-1">
              {showCompanyLogo && companyInfo.logo && (
                <img src={companyInfo.logo} alt={companyInfo.name} className="h-12 mb-4" />
              )}
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{companyInfo.name}</h1>
              {companyInfo.addressLine1 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{companyInfo.addressLine1}</p>
              )}
              {companyInfo.addressLine2 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{companyInfo.addressLine2}</p>
              )}
              {companyInfo.addressLine3 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{companyInfo.addressLine3}</p>
              )}
              {companyInfo.phone && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{companyInfo.phone}</p>
              )}
              {companyInfo.email && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{companyInfo.email}</p>
              )}
              {companyInfo.website && (
                <p className="text-sm text-gray-600 dark:text-gray-400">{companyInfo.website}</p>
              )}
              {companyInfo.vatNumber && (
                <p className="text-sm text-gray-600 dark:text-gray-400">VAT {companyInfo.vatNumber}</p>
              )}
              {companyInfo.registrationNumber && (
                <p className="text-sm text-gray-600 dark:text-gray-400">Reg. {companyInfo.registrationNumber}</p>
              )}
            </div>
            
            {/* Document Title */}
            <div className="text-right">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-2" style={{ color: accentColor }}>
                {documentType}
              </h2>
              <div className="space-y-1">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {documentNumber}
                </p>
                {documentStatus && (
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
                    {documentStatus.toUpperCase()}
                  </div>
                )}
                {isExpired && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 ml-2">
                    EXPIRED
                  </div>
                )}
                {isPaid && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 ml-2">
                    PAID
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bill To and Document Details */}
        <div className="grid grid-cols-2 gap-8">
          {/* Bill To Section */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Bill To:
            </h3>
            <div className="space-y-1">
              <p className="text-base font-semibold text-gray-900 dark:text-white">
                {customerName}
              </p>
              {billingAddress && (
                <>
                  {billingAddress.attention && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Attn: {billingAddress.attention}
                    </p>
                  )}
                  {billingAddress.street && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{billingAddress.street}</p>
                  )}
                  {(billingAddress.city || billingAddress.stateProvince || billingAddress.zipPostalCode) && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {[billingAddress.city, billingAddress.stateProvince, billingAddress.zipPostalCode]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                  {billingAddress.country && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{billingAddress.country}</p>
                  )}
                  {billingAddress.phone && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">Tel: {billingAddress.phone}</p>
                  )}
                  {billingAddress.email && (
                    <p className="text-sm text-gray-700 dark:text-gray-300">{billingAddress.email}</p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Document Details */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              {documentType} Details:
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {documentType === 'INVOICE' ? 'Invoice Date:' : `${documentType.charAt(0) + documentType.slice(1).toLowerCase()} Date:`}
                </span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatDate(documentDate)}
                </span>
              </div>
              {dueDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Due Date:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(dueDate)}
                  </span>
                </div>
              )}
              {validUntil && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Valid Until:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatDate(validUntil)}
                  </span>
                </div>
              )}
              {poNumber && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">PO Number:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {poNumber}
                  </span>
                </div>
              )}
              {referenceNumber && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Reference:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {referenceNumber}
                  </span>
                </div>
              )}
              {customerNumber && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Customer #:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {customerNumber}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Ship To Section (if different from billing) */}
        {shippingAddress && (shippingAddress.street || shippingAddress.city) && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Ship To:
            </h3>
            <div className="space-y-1">
              {shippingAddress.attention && (
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {shippingAddress.attention}
                </p>
              )}
              {shippingAddress.street && (
                <p className="text-sm text-gray-700 dark:text-gray-300">{shippingAddress.street}</p>
              )}
              {(shippingAddress.city || shippingAddress.stateProvince || shippingAddress.zipPostalCode) && (
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {[shippingAddress.city, shippingAddress.stateProvince, shippingAddress.zipPostalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
              )}
              {shippingAddress.country && (
                <p className="text-sm text-gray-700 dark:text-gray-300">{shippingAddress.country}</p>
              )}
            </div>
          </div>
        )}

        {/* Line Items Table */}
        <div className="mt-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300 dark:border-gray-600">
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Item
                </th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  SKU
                </th>
                <th className="text-left py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Qty
                </th>
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Unit Price
                </th>
                {hasDiscounts && (
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Disc %
                  </th>
                )}
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Subtotal
                </th>
                {hasVAT && (
                  <th className="text-right py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    VAT
                  </th>
                )}
                <th className="text-right py-3 px-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Total
                </th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item) => (
                <tr key={item.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="py-3 px-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {item.name}
                      </p>
                      {item.type && (
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Type: {item.type}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-xs text-gray-600 dark:text-gray-400">
                    {item.sku || '-'}
                  </td>
                  <td className="py-3 px-2 text-xs text-gray-600 dark:text-gray-400 max-w-xs">
                    {item.description || '-'}
                  </td>
                  <td className="text-right py-3 px-2 text-sm text-gray-900 dark:text-white">
                    {item.quantity}
                  </td>
                  <td className="text-right py-3 px-2 text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.unitPrice)}
                  </td>
                  {hasDiscounts && (
                    <td className="text-right py-3 px-2 text-sm text-gray-900 dark:text-white">
                      {item.discountRate && parseFloat(item.discountRate.toString()) > 0 
                        ? `${item.discountRate}%` 
                        : '-'}
                    </td>
                  )}
                  <td className="text-right py-3 px-2 text-sm text-gray-900 dark:text-white">
                    {formatCurrency(item.lineSubtotal)}
                  </td>
                  {hasVAT && (
                    <td className="text-right py-3 px-2 text-sm text-gray-900 dark:text-white">
                      {item.vatRate && parseFloat(item.vatRate.toString()) > 0 ? (
                        <div>
                          <div className="text-xs text-gray-500">{item.vatRate}%</div>
                          <div className="text-xs">{formatCurrency(item.vatAmount || 0)}</div>
                        </div>
                      ) : '-'}
                    </td>
                  )}
                  <td className="text-right py-3 px-2 text-sm font-semibold text-gray-900 dark:text-white">
                    {formatCurrency(item.lineTotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary Section */}
        <div className="flex justify-end mt-6">
          <div className="w-72">
            <div className="space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatCurrency(subtotal)}
                </span>
              </div>
              {discountAmount && parseFloat(discountAmount.toString()) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Discount:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    -{formatCurrency(discountAmount)}
                  </span>
                </div>
              )}
              {taxAmount && parseFloat(taxAmount.toString()) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Items VAT Total:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(taxAmount)}
                  </span>
                </div>
              )}
              {shippingFee && parseFloat(shippingFee.toString()) > 0 && (
                <>
                  <div className="flex justify-between py-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Shipping Charges:</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {formatCurrency(shippingFee)}
                    </span>
                  </div>
                  {shippingVatAmount && parseFloat(shippingVatAmount.toString()) > 0 && (
                    <div className="flex justify-between py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Shipping VAT [{shippingVatRate}%]:
                      </span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white">
                        {formatCurrency(shippingVatAmount)}
                      </span>
                    </div>
                  )}
                </>
              )}
              {rushFee && parseFloat(rushFee.toString()) > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Rush Fee:</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {formatCurrency(rushFee)}
                  </span>
                </div>
              )}
              <div className="flex justify-between py-3 border-t-2 border-gray-300 dark:border-gray-600">
                <span className="text-base font-semibold text-gray-900 dark:text-white">Total:</span>
                <span className="text-lg font-bold" style={{ color: accentColor }}>
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        {paymentTerms && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Payment Terms:
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {paymentTerms}
            </p>
          </div>
        )}

        {/* Bank Details */}
        {bankDetails && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Bank Details:
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {bankDetails}
            </p>
          </div>
        )}

        {/* Notes Section */}
        {notes && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Notes:
            </h3>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {notes}
            </p>
          </div>
        )}

        {/* Terms & Conditions */}
        {termsConditions && (
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
              Terms & Conditions:
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {termsConditions}
            </p>
          </div>
        )}

        {/* Signature Section */}
        {showSignature && (
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="border-b border-gray-400 dark:border-gray-600 pb-1 mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {signatureName || 'Authorized Signature'}
                  </p>
                </div>
                {signatureTitle && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">{signatureTitle}</p>
                )}
              </div>
              <div>
                <div className="border-b border-gray-400 dark:border-gray-600 pb-1 mb-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Date</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 text-center">
          {footerText ? (
            <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">
              {footerText}
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Thank you for your business!
              </p>
              {validUntil && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  This {documentType.toLowerCase()} is valid until {formatDate(validUntil)}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}