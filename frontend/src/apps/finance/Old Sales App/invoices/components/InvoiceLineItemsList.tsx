import React from 'react'
import { 
  InvoiceLineItem, 
  useCreateInvoiceLineItem, 
  useUpdateInvoiceLineItem, 
  useDeleteInvoiceLineItem,
  useUpdateInvoice
} from '../api'
import { ProductSelector } from '../../estimates/components/ProductSelector'
import { LineItemsTable, LineItem, LineItemFormData } from '@/shared'

interface InvoiceLineItemsListProps {
  invoiceId: number
  lineItems: InvoiceLineItem[]
  shippingFee?: string
  shippingVatRate?: string
  shippingVatAmount?: string
  rushFee?: string
  onUpdate?: () => void
  editable?: boolean
}

export const InvoiceLineItemsList: React.FC<InvoiceLineItemsListProps> = ({
  invoiceId,
  lineItems,
  shippingFee = '0',
  shippingVatRate = '20',
  shippingVatAmount = '0',
  rushFee = '0',
  onUpdate,
  editable = true
}) => {
  const createLineItem = useCreateInvoiceLineItem()
  const updateLineItem = useUpdateInvoiceLineItem()
  const deleteLineItem = useDeleteInvoiceLineItem()
  const updateInvoice = useUpdateInvoice()

  // Transform InvoiceLineItem to LineItem for the table
  const transformedItems: LineItem[] = lineItems.map(item => ({
    id: item.line_item_id,
    product_id: item.product,
    product_name: item.product_name,
    product_sku: item.product_sku,
    description: item.description,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_rate: item.discount_rate,
    vat_rate: item.vat_rate,
    vat_amount: item.vat_amount,
    line_subtotal: item.line_subtotal,
    line_total: item.line_total
  }))

  const handleAdd = async (data: LineItemFormData) => {
    await createLineItem.mutateAsync({
      invoice: invoiceId,
      product: data.product_id,
      description: data.description,
      quantity: data.quantity,
      unit_price: data.unit_price,
      discount_rate: data.discount_rate || 0,
      vat_rate: data.vat_rate || 0,
      sort_order: lineItems.length + 1
    })
    onUpdate?.()
  }

  const handleUpdate = async (id: number | string, data: Partial<LineItemFormData>) => {
    await updateLineItem.mutateAsync({ 
      id: Number(id), 
      data: {
        product: data.product_id,
        description: data.description,
        quantity: data.quantity,
        unit_price: data.unit_price,
        discount_rate: data.discount_rate,
        vat_rate: data.vat_rate
      }
    })
    onUpdate?.()
  }

  const handleDelete = async (id: number | string) => {
    await deleteLineItem.mutateAsync(Number(id))
    onUpdate?.()
  }
  
  const handleUpdateFees = async (fees: { shipping_fee: number; shipping_vat_rate: number; rush_fee: number }) => {
    try {
      await updateInvoice.mutateAsync({
        id: invoiceId,
        data: fees
      })
      onUpdate?.()
    } catch (error) {
      console.error('Error updating fees:', error)
    }
  }

  return (
    <LineItemsTable
      items={transformedItems}
      onAdd={editable ? handleAdd : undefined}
      onUpdate={editable ? handleUpdate : undefined}
      onDelete={editable ? handleDelete : undefined}
      onUpdateFees={editable ? handleUpdateFees : undefined}
      loading={createLineItem.isPending || updateLineItem.isPending || deleteLineItem.isPending}
      productSelector={<ProductSelector />}
      shippingFee={parseFloat(shippingFee)}
      shippingVatRate={parseFloat(shippingVatRate)}
      rushFee={parseFloat(rushFee)}
      editable={editable}
    />
  )
}

export default InvoiceLineItemsList