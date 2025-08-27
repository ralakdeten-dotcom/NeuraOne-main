// Sales module exports
// This module handles customers, quotes, sales orders, invoices, payments received, credit notes

// Shared components and utilities
export * from './shared';

// Sub-module exports
export * from './customers';
export * from './quotes';
export * from './sales-orders';
export * from './invoices';
export * from './payments-received';
export * from './credit-notes';

// Future exports will include:
// export { default as CustomersList } from './customers/pages/CustomersList'
// export { default as CustomerCreate } from './customers/pages/CustomerCreate'
// export { default as QuotesList } from './quotes/pages/QuotesList'
// export { default as NewQuotePage } from './quotes/pages/NewQuotePage'
// export { default as SalesOrdersList } from './sales-orders/pages/SalesOrdersList'
// export { default as InvoicesList } from './invoices/pages/InvoicesList'
// export { default as PaymentsReceivedList } from './payments-received/pages/PaymentsReceivedList'
// export { default as CreditNotesList } from './credit-notes/pages/CreditNotesList'