// Purchases module exports
// This module handles vendors, expenses, recurring expenses, purchase orders, bills, recurring bills, payments made, vendor credits

// Shared components and utilities
export * from './shared';

// Sub-module exports
export { VendorsList, VendorCreate } from './vendors';

// Future exports will include:
// export { default as ExpensesList } from './expenses/pages/ExpensesList'
// export { default as RecurringExpensesList } from './recurring-expenses/pages/RecurringExpensesList'
// export { default as PurchaseOrdersList } from './purchase-orders/pages/PurchaseOrdersList'
// export { default as BillsList } from './bills/pages/BillsList'
// export { default as RecurringBillsList } from './recurring-bills/pages/RecurringBillsList'
// export { default as PaymentsMadeList } from './payments-made/pages/PaymentsMadeList'
// export { default as VendorCreditsList } from './vendor-credits/pages/VendorCreditsList'