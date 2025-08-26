import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreateFormModalpage } from '../../../../finance-inventory-shared';
import { useCreateEstimate, type EstimateCreate } from '../../Old Sales App/estimates/api';
import toast from 'react-hot-toast';
import {
  BasicQuoteFields,
  QuoteDetailsFields,
  QuoteItemsTable,
  QuoteTotalsSection,
} from './components';

interface NewQuotePageProps {
  isOpen?: boolean;
  onClose?: () => void;
}

interface QuoteLineItem {
  id: string;
  product?: number;
  item_details?: string;
  manufacturer?: string;
  lead_time?: string;
  condition?: string;
  quantity: number;
  rate: number;
  vat: number;
  amount: number;
}

export const NewQuotePage: React.FC<NewQuotePageProps> = ({ 
  isOpen = true, 
  onClose 
}) => {
  const navigate = useNavigate();
  const createEstimateMutation = useCreateEstimate();
  
  const [formData, setFormData] = useState<EstimateCreate & {
    customer_name?: string;
    salesperson?: string;
    subject?: string;
    customer_notes?: string;
    terms_conditions?: string;
    discount?: number;
    discount_type?: 'percentage' | 'amount';
    shipping_fee?: number;
    rush_fee?: number;
  }>({
    account: 0,
    customer_name: '',
    estimate_date: '2025-08-24',
    valid_until: '',
    po_number: '',
    salesperson: 'Vishal Paswan',
    subject: 'Let your customer know what this Quote is for',
    customer_notes: 'Thanks in advance for your business.\nValid for 30 days from the date of the quote unless otherwise stated.',
    terms_conditions: `The buyer is responsible for taxes, freight, and customs duties when applicable. All deliveries (Std. Lead) are based on standard ground shipments. Rush delivery may be available upon request. Errors and omissions are excepted. All sales are subject to our terms and conditions of sale which are available on our website or upon request. Returns are subject to a 25% restocking fee and must be in original packaging. Special order items are non-returnable. Prices are subject to change without notice. Payment terms are Net 30 days from invoice date unless otherwise specified.`,
    discount: 0,
    discount_type: 'percentage',
    shipping_fee: 0,
    rush_fee: 0
  });

  const [validationErrors, setValidationErrors] = useState({
    account: '',
    estimate_number: ''
  });

  const [lineItems, setLineItems] = useState<QuoteLineItem[]>([
    {
      id: '1',
      item_details: 'Type or click to select an item.',
      manufacturer: '',
      lead_time: '',
      condition: '',
      quantity: 1.00,
      rate: 0.00,
      vat: 0,
      amount: 0.00
    }
  ]);


  // Auto-generate quote number
  useEffect(() => {
    const generateQuoteNumber = () => {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      return `QT-${year}${month}${day}${random}`;
    };

    setFormData(prev => ({
      ...prev,
      estimate_number: generateQuoteNumber()
    }));
  }, []);

  // Calculate expiry date (30 days from quote date)
  useEffect(() => {
    if (formData.estimate_date) {
      const quoteDate = new Date(formData.estimate_date);
      const expiryDate = new Date(quoteDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      setFormData(prev => ({
        ...prev,
        valid_until: expiryDate.toISOString().split('T')[0]
      }));
    }
  }, [formData.estimate_date]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    const errors = { account: '', estimate_number: '' };
    let hasErrors = false;
    
    // Validate required fields
    if (!formData.account || formData.account === 0) {
      errors.account = 'Customer selection is required';
      hasErrors = true;
    }
    
    if (!formData.estimate_number?.trim()) {
      errors.estimate_number = 'Quote number is required';
      hasErrors = true;
    }
    
    // Set validation errors
    setValidationErrors(errors);
    
    // If there are any errors, don't proceed with saving
    if (hasErrors) {
      toast.error('Please fill in all required fields before saving.');
      return;
    }

    try {
      const estimateData: EstimateCreate = {
        account: formData.account,
        estimate_date: formData.estimate_date,
        valid_until: formData.valid_until,
        po_number: formData.po_number || undefined,
        notes: formData.customer_notes || undefined,
        terms_conditions: formData.terms_conditions || undefined,
        shipping_fee: formData.shipping_fee || undefined,
        rush_fee: formData.rush_fee || undefined
      };

      await createEstimateMutation.mutateAsync(estimateData);
      toast.success('Quote created successfully');
      
      if (onClose) {
        onClose();
      } else {
        navigate('/finance/sales/quotes');
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error('Error creating quote. Please try again.');
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate('/finance/sales/quotes');
    }
  };

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear validation error for this field when user starts typing
    if (validationErrors[field as keyof typeof validationErrors]) {
      setValidationErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const addNewRow = () => {
    const newItem: QuoteLineItem = {
      id: (lineItems.length + 1).toString(),
      item_details: 'Type or click to select an item.',
      manufacturer: '',
      lead_time: '',
      condition: '',
      quantity: 1.00,
      rate: 0.00,
      vat: 0,
      amount: 0.00
    };
    setLineItems([...lineItems, newItem]);
  };

  const removeRow = (id: string) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter(item => item.id !== id));
    }
  };

  const updateLineItem = (id: string, field: keyof QuoteLineItem, value: any) => {
    setLineItems(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        // Recalculate amount when quantity or rate changes
        if (field === 'quantity' || field === 'rate') {
          updated.amount = updated.quantity * updated.rate;
        }
        return updated;
      }
      return item;
    }));
  };

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
  const discountAmount = formData.discount_type === 'percentage' 
    ? subtotal * (formData.discount || 0) / 100 
    : (formData.discount || 0);
  const total = subtotal - discountAmount + (formData.shipping_fee || 0) + (formData.rush_fee || 0);


  return (
    <CreateFormModalpage
      isOpen={isOpen}
      onClose={handleCancel}
      title="New Quote"
      onSubmit={handleSubmit}
      submitLabel="Save and Send"
      cancelLabel="Cancel"
      isSubmitting={createEstimateMutation.isPending}
    >
      <BasicQuoteFields
        formData={formData}
        onInputChange={handleInputChange}
        validationErrors={validationErrors}
      />

      <QuoteDetailsFields
        formData={formData}
        onInputChange={handleInputChange}
      />

      <QuoteItemsTable
        lineItems={lineItems}
        onAddRow={addNewRow}
        onRemoveRow={removeRow}
        onUpdateLineItem={updateLineItem}
      />

      <QuoteTotalsSection
        subtotal={subtotal}
        formData={formData}
        discountAmount={discountAmount}
        total={total}
        onInputChange={handleInputChange}
      />

      {/* Attach Files */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 items-start">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 pt-2">
          Attach File(s) to Quote
        </label>
        <div className="sm:col-span-1 md:col-span-2">
          <button
            type="button"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-left text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Upload File
          </button>
        </div>
      </div>
    </CreateFormModalpage>
  );
};