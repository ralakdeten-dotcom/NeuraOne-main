/**
 * SALES MODULE - Finance App
 * 
 * This module handles all sales-related functionality within the Finance application.
 * It provides comprehensive sales management capabilities including customer management,
 * quote creation, order processing, invoicing, and payment tracking.
 * 
 * Module Structure:
 * ┌─────────────────────────────────────────────────────────────────────────────┐
 * │                              SALES MODULE                                   │
 * ├─────────────────────────────────────────────────────────────────────────────┤
 * │ Core Sales Management Components:                                           │
 * │                                                                             │
 * │ • Customers         - Customer profile management and CRM integration      │
 * │ • Quotes            - Quote creation, approval, and customer delivery      │
 * │ • SalesOrders       - Order processing and fulfillment tracking           │
 * │ • Invoices          - Invoice generation and payment status tracking       │
 * │ • PaymentsReceived  - Customer payment processing and reconciliation       │
 * │ • CreditNotes       - Credit note management and customer refunds          │
 * └─────────────────────────────────────────────────────────────────────────────┘
 * 
 * Business Flow:
 * 1. Customer Management  → Register and maintain customer information
 * 2. Quote Creation       → Create quotes and proposals for customers
 * 3. Sales Order Process  → Convert approved quotes to sales orders
 * 4. Invoice Generation   → Generate invoices from sales orders
 * 5. Payment Processing   → Track and process customer payments
 * 6. Credit Management    → Handle returns and customer credit notes
 * 
 * Integration Points:
 * - Links with CRM module for customer relationship management
 * - Integrates with Inventory for product availability and pricing
 * - Connects to Accounting for financial reporting and GL entries
 * - Syncs with Purchases module for complete business workflow
 * 
 * Directory Structure:
 * Sales/
 * ├── index.ts                    # This file - main module exports & documentation
 * ├── Customers/                  # Customer management components ✅ Complete
 * │   ├── CustomersComponents/    # Reusable customer components
 * │   └── CustomerCreate-tabs/    # Customer creation form tabs
 * ├── Quotes/                     # Quote management components
 * ├── SalesOrders/                # Sales order processing components
 * ├── Invoices/                   # Invoice management components
 * ├── PaymentsReceived/           # Payment processing components
 * └── CreditNotes/                # Credit note management components
 * 
 * @version 1.0.0
 * @created 2025-01-22
 * @author Claude Code Assistant
 */

// ================================
// CUSTOMER MANAGEMENT SUB-MODULE
// ================================
/**
 * CUSTOMERS SUB-MODULE ✅ COMPLETE
 * 
 * Manages customer information, contact details, addresses, and customer
 * relationship data within the Sales module.
 * 
 * Features:
 * - Customer registration and profile management
 * - Contact person management with detailed information
 * - Billing and shipping address management
 * - VAT and tax information handling
 * - Payment terms and credit limit setup
 * - Portal access and customer communication preferences
 * 
 * Components:
 * - CustomersList.tsx           - Main customer listing page ✅
 * - CustomerCreate.tsx          - Customer creation form with tabs ✅
 * - OtherDetails.tsx           - VAT, payment, portal settings tab ✅
 * - Address.tsx                - Billing and shipping addresses tab ✅
 * - ContactPersons.tsx         - Contact person management tab ✅
 * - AddContactPersonButton.tsx - Reusable contact person button ✅
 */
export { CustomersList } from './Customers/CustomersList';
export { CustomerCreate } from './Customers/CustomerCreate';

// Customer Creation Tab Components
export { OtherDetails } from './Customers/CustomersComponents/CustomerCreate-tabs/OtherDetails';
export { Address } from './Customers/CustomersComponents/CustomerCreate-tabs/Address';
export { ContactPersons } from './Customers/CustomersComponents/CustomerCreate-tabs/ContactPersons';
export { CustomFields } from './Customers/CustomersComponents/CustomerCreate-tabs/CustomFields';
export { ReportingTags } from './Customers/CustomersComponents/CustomerCreate-tabs/ReportingTags';
export { Remarks } from './Customers/CustomersComponents/CustomerCreate-tabs/Remarks';

// Customer Reusable Components
export { AddContactPersonButton } from './Customers/CustomersComponents/AddContactPersonButton';

// ================================
// QUOTES & ESTIMATES SUB-MODULE
// ================================
/**
 * QUOTES SUB-MODULE ✅ ACTIVE
 * 
 * Handles quote creation, approval workflows, customer delivery,
 * and conversion to sales orders within the Sales module.
 * 
 * Features:
 * - Quote listing with comprehensive filtering and sorting
 * - Quote creation with line items and pricing
 * - Multi-level approval workflows
 * - Quote templates and customization
 * - Customer delivery and acceptance tracking
 * - Conversion to sales orders
 * - Quote versioning and revision history
 * 
 * Components:
 * - QuotesList.tsx              - Main quotes listing page ✅
 * - QuoteCreate.tsx             - New quote creation form (planned)
 * - QuoteDetails.tsx            - Quote detail view and editing (planned)
 * - QuoteTemplates.tsx          - Quote template management (planned)
 * - QuoteApproval.tsx           - Approval workflow interface (planned)
 * - api/quotes.ts               - API integration layer (using estimates API)
 */
export { QuotesList } from './Quotes/QuotesList';
// Future exports - components will be added here as they are developed
// export { QuoteCreate } from './Quotes/QuoteCreate';
// export { QuoteDetails } from './Quotes/QuoteDetails';
// export { QuoteTemplates } from './Quotes/QuoteTemplates';
// export { QuoteApproval } from './Quotes/QuoteApproval';
// export * from './Quotes/api/quotes';

// ================================
// SALES ORDERS SUB-MODULE
// ================================
/**
 * SALES ORDERS SUB-MODULE 🚧 PLACEHOLDER
 * 
 * Manages sales order processing, fulfillment tracking, inventory allocation,
 * and integration with shipping within the Sales module.
 * 
 * Features:
 * - Sales order creation and management
 * - Order fulfillment and shipping integration
 * - Inventory allocation and availability checking
 * - Order status tracking and customer notifications
 * - Partial shipment and backorder handling
 * - Integration with invoice generation
 * 
 * Future Components:
 * - SalesOrdersList.tsx         - Main sales orders listing
 * - SalesOrderCreate.tsx        - New sales order creation
 * - SalesOrderDetails.tsx       - Order detail view and editing
 * - OrderFulfillment.tsx        - Fulfillment and shipping interface
 * - OrderTracking.tsx           - Order status and tracking
 * - api/salesOrders.ts          - API integration layer
 */
// Placeholder exports - components will be added here as they are developed
// export { SalesOrdersList } from './SalesOrders/SalesOrdersList';
// export { SalesOrderCreate } from './SalesOrders/SalesOrderCreate';
// export { SalesOrderDetails } from './SalesOrders/SalesOrderDetails';
// export { OrderFulfillment } from './SalesOrders/OrderFulfillment';
// export { OrderTracking } from './SalesOrders/OrderTracking';
// export * from './SalesOrders/api/salesOrders';

// ================================
// INVOICING SUB-MODULE
// ================================
/**
 * INVOICES SUB-MODULE 🚧 PLACEHOLDER
 * 
 * Handles invoice generation, payment status tracking, customer delivery,
 * and integration with accounting within the Sales module.
 * 
 * Features:
 * - Invoice creation from sales orders or standalone
 * - Invoice templates and customization
 * - Payment status tracking and aging reports
 * - Customer invoice delivery (email, portal)
 * - Integration with payment processing
 * - Tax calculation and compliance
 * 
 * Future Components:
 * - InvoicesList.tsx            - Main invoices listing page
 * - InvoiceCreate.tsx           - New invoice creation form
 * - InvoiceDetails.tsx          - Invoice detail view and editing
 * - InvoiceTemplates.tsx        - Invoice template management
 * - PaymentTracking.tsx         - Payment status and aging
 * - api/invoices.ts             - API integration layer
 */
// Placeholder exports - components will be added here as they are developed
// export { InvoicesList } from './Invoices/InvoicesList';
// export { InvoiceCreate } from './Invoices/InvoiceCreate';
// export { InvoiceDetails } from './Invoices/InvoiceDetails';
// export { InvoiceTemplates } from './Invoices/InvoiceTemplates';
// export { PaymentTracking } from './Invoices/PaymentTracking';
// export * from './Invoices/api/invoices';

// ================================
// PAYMENTS RECEIVED SUB-MODULE
// ================================
/**
 * PAYMENTS RECEIVED SUB-MODULE 🚧 PLACEHOLDER
 * 
 * Manages customer payment processing, reconciliation, deposit handling,
 * and integration with banking systems within the Sales module.
 * 
 * Features:
 * - Customer payment recording and processing
 * - Multiple payment methods and channels
 * - Payment matching to invoices and orders
 * - Bank reconciliation and deposit management
 * - Payment reporting and analytics
 * - Integration with accounting and GL
 * 
 * Future Components:
 * - PaymentsReceivedList.tsx    - Main payments listing page
 * - PaymentCreate.tsx           - New payment recording form
 * - PaymentDetails.tsx          - Payment detail view and editing
 * - PaymentMatching.tsx         - Invoice payment matching interface
 * - BankReconciliation.tsx      - Bank reconciliation interface
 * - api/paymentsReceived.ts     - API integration layer
 */
// Placeholder exports - components will be added here as they are developed
// export { PaymentsReceivedList } from './PaymentsReceived/PaymentsReceivedList';
// export { PaymentCreate } from './PaymentsReceived/PaymentCreate';
// export { PaymentDetails } from './PaymentsReceived/PaymentDetails';
// export { PaymentMatching } from './PaymentsReceived/PaymentMatching';
// export { BankReconciliation } from './PaymentsReceived/BankReconciliation';
// export * from './PaymentsReceived/api/paymentsReceived';

// ================================
// CREDIT NOTES SUB-MODULE
// ================================
/**
 * CREDIT NOTES SUB-MODULE 🚧 PLACEHOLDER
 * 
 * Manages credit note creation, customer refund processing, return handling,
 * and integration with customer accounts within the Sales module.
 * 
 * Features:
 * - Credit note creation and processing
 * - Customer refund management and tracking
 * - Product return and restocking workflows
 * - Credit application to customer accounts
 * - Credit memo generation and delivery
 * - Integration with inventory and accounting
 * 
 * Future Components:
 * - CreditNotesList.tsx         - Main credit notes listing
 * - CreditNoteCreate.tsx        - New credit note creation
 * - CreditNoteDetails.tsx       - Credit note detail view and editing
 * - RefundProcessing.tsx        - Refund processing interface
 * - ReturnManagement.tsx        - Product return workflows
 * - api/creditNotes.ts          - API integration layer
 */
// Placeholder exports - components will be added here as they are developed
// export { CreditNotesList } from './CreditNotes/CreditNotesList';
// export { CreditNoteCreate } from './CreditNotes/CreditNoteCreate';
// export { CreditNoteDetails } from './CreditNotes/CreditNoteDetails';
// export { RefundProcessing } from './CreditNotes/RefundProcessing';
// export { ReturnManagement } from './CreditNotes/ReturnManagement';
// export * from './CreditNotes/api/creditNotes';

// ================================
// MODULE METADATA AND CONFIGURATION
// ================================
/**
 * Sales Module Configuration
 * Contains module metadata, feature flags, and configuration settings
 */
export const SalesModuleConfig = {
  moduleName: 'Sales',
  version: '1.0.0',
  description: 'Comprehensive sales management system',
  subModules: {
    customers: {
      name: 'Customers',
      description: 'Customer profile and relationship management',
      status: 'complete',
      completedFeatures: [
        'Customer registration and profiles',
        'Contact person management',
        'Address management (billing/shipping)',
        'VAT and tax information',
        'Payment terms setup',
        'Portal access configuration'
      ]
    },
    quotes: {
      name: 'Quotes',
      description: 'Quote creation and approval workflows',
      status: 'active',
      completedFeatures: [
        'Quote listing with filtering and sorting',
        'Status-based quote visualization',
        'Quote number and reference tracking',
        'Customer and amount display',
        'Date-based organization'
      ],
      plannedFeatures: [
        'Quote creation with line items',
        'Approval workflows',
        'Quote templates',
        'Customer delivery',
        'Sales order conversion'
      ]
    },
    salesOrders: {
      name: 'SalesOrders',
      description: 'Order processing and fulfillment',
      status: 'placeholder',
      plannedFeatures: [
        'Order processing',
        'Fulfillment tracking',
        'Inventory allocation',
        'Shipping integration',
        'Order notifications'
      ]
    },
    invoices: {
      name: 'Invoices',
      description: 'Invoice generation and payment tracking',
      status: 'placeholder',
      plannedFeatures: [
        'Invoice generation',
        'Payment tracking',
        'Customer delivery',
        'Tax calculations',
        'Accounting integration'
      ]
    },
    paymentsReceived: {
      name: 'PaymentsReceived',
      description: 'Customer payment processing and reconciliation',
      status: 'placeholder',
      plannedFeatures: [
        'Payment processing',
        'Multiple payment methods',
        'Invoice matching',
        'Bank reconciliation',
        'Payment reporting'
      ]
    },
    creditNotes: {
      name: 'CreditNotes',
      description: 'Credit notes and customer refund management',
      status: 'placeholder',
      plannedFeatures: [
        'Credit note processing',
        'Refund management',
        'Return workflows',
        'Credit application',
        'Inventory integration'
      ]
    }
  },
  features: {
    customerManagement: true,
    quoteManagement: true,
    orderProcessing: false,
    invoicing: false,
    paymentProcessing: false,
    creditManagement: false,
    reporting: true,
    approvalWorkflows: false,
    integration: {
      crm: true,
      inventory: false,
      accounting: false,
      banking: false
    }
  }
} as const;

// ================================
// TYPE DEFINITIONS
// ================================
/**
 * Common types used across the Sales module
 */
export interface SalesModuleRoutes {
  customers: string;
  quotes: string;
  salesOrders: string;
  invoices: string;
  paymentsReceived: string;
  creditNotes: string;
}

/**
 * Navigation structure for the Sales module
 */
export const SALES_ROUTES: SalesModuleRoutes = {
  customers: '/finance/sales/customers',
  quotes: '/finance/sales/quotes',
  salesOrders: '/finance/sales/sales-orders',
  invoices: '/finance/sales/invoices',
  paymentsReceived: '/finance/sales/payments-received',
  creditNotes: '/finance/sales/credit-notes'
} as const;