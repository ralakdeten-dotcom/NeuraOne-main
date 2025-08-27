// Accountant module exports
// This module handles manual journals, bulk update, currency adjustments, chart of accounts, budgets, transaction locking

// Shared components and utilities
export * from './shared';

// Sub-module exports
export * from './chart-of-accounts';
export * from './budgets';
export * from './bulk-update';
export * from './currency-adjustments';
export * from './manual-journals';
export * from './transaction-locking';

// Legacy direct exports for backwards compatibility
export { AccountsList, AccountDetails, AccountCreate } from './chart-of-accounts';

// API exports
export * from './api/chartOfAccounts'
export * from './api/currencies'
export * from './api/transactions'

// Future exports (placeholder sub-modules):
// export { default as ManualJournalsList } from './manual-journals/pages/ManualJournalsList'
// export { default as BulkUpdatePage } from './bulk-update/pages/BulkUpdatePage'
// export { default as CurrencyAdjustmentsPage } from './currency-adjustments/pages/CurrencyAdjustmentsPage'
// export { default as BudgetsList } from './budgets/pages/BudgetsList'
// export { default as TransactionLockingPage } from './transaction-locking/pages/TransactionLockingPage'