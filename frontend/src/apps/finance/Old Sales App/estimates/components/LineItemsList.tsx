import React from 'react'
import { 
  EstimateLineItem, 
  useCreateLineItem, 
  useUpdateLineItem, 
  useDeleteLineItem,
  useUpdateEstimate
} from '../api'
import { ProductSelector } from './ProductSelector'
import { LineItemsTable, LineItem, LineItemFormData } from '@/shared'

interface LineItemsListProps {
  estimateId: number
  lineItems: EstimateLineItem[]
  shippingFee?: string
  shippingVatRate?: string
  shippingVatAmount?: string
  rushFee?: string
  onUpdate?: () => void
  editable?: boolean
}

export const LineItemsList: React.FC<LineItemsListProps> = ({
  estimateId,
  lineItems,
  shippingFee = '0',
  shippingVatRate = '20',
  shippingVatAmount = '0',
  rushFee = '0',
  onUpdate,
  editable = true
}) => {
  const createLineItem = useCreateLineItem()
  const updateLineItem = useUpdateLineItem()
  const deleteLineItem = useDeleteLineItem()
  const updateEstimate = useUpdateEstimate()

  // Transform EstimateLineItem to LineItem for the table
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
      estimate: estimateId,
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
      await updateEstimate.mutateAsync({
        id: estimateId,
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
      editable={editable}
      loading={createLineItem.isPending || updateLineItem.isPending || deleteLineItem.isPending}
      productSelector={<ProductSelector />}
      title="Estimate Line Items"
      emptyMessage="No line items yet"
      emptyDescription="Add products to this estimate to get started"
      shippingFee={parseFloat(shippingFee)}
      shippingVatRate={parseFloat(shippingVatRate)}
      shippingVatAmount={parseFloat(shippingVatAmount)}
      rushFee={parseFloat(rushFee)}
      onUpdateFees={editable ? handleUpdateFees : undefined}
    />
  )
}