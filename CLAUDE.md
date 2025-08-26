# CLAUDE.md

This file provides guidance to Claude Code when working with this multi-tenant, multi-app platform repository.

## Project Overview

NeuraOne is a production-ready multi-tenant SaaS platform with:
- **CRM**: Customer Relationship Management (Leads, Contacts, Accounts, Deals) - ✅ Complete
- **Finance**: Estimates, Invoices, Sales Orders, Customers - ✅ Complete
- **Inventory**: Product Management and Tracking - ✅ Complete  
- **TeamInbox**: Unified Customer Communications - 🚧 Placeholder
- **Multi-App Architecture**: Platform supports multiple business applications

## Prerequisites

- **Python 3.11+** and **Node.js 18+**
- **PostgreSQL 12+** (required for multi-tenancy)

## Quick Setup

```bash
git clone <repository-url> NeuraOne
cd NeuraOne
make setup  # Complete automated setup
```

## Development Commands

```bash
make setup           # Complete setup for new system
make dev             # Start both backend and frontend servers
make install         # Install all dependencies
make test            # Run all tests
make lint            # Run all linters
make clean           # Clean install (removes venv & node_modules)

# Database Commands
make db-init         # Initialize PostgreSQL database
make db-reset        # Reset database completely
make migrate         # Run Django migrations (shared + tenant)
make seed            # Seed demo data
make superuser       # Create Django superuser
```

### Backend Commands
```bash
# Use full venv path for Python commands (venv activation doesn't work in bash sessions)
/home/ralakdev/Documents/NeuraOne/venv/bin/python /home/ralakdev/Documents/NeuraOne/backend/manage.py runserver
/home/ralakdev/Documents/NeuraOne/venv/bin/python /home/ralakdev/Documents/NeuraOne/backend/manage.py test
/home/ralakdev/Documents/NeuraOne/venv/bin/ruff check backend/
/home/ralakdev/Documents/NeuraOne/venv/bin/black backend/
```

### Frontend Commands
```bash
cd frontend
npm run dev          # Start React dev server (port 3000)
npm run test         # Run tests
npm run lint         # Lint code
npm run type-check   # TypeScript checking
npm run build        # Build for production
```


## Access Points

- **Frontend**: http://localhost:3000
- **App Launcher**: http://localhost:3000/apps
- **CRM App**: http://localhost:3000/crm
- **Finance App**: http://localhost:3000/finance
- **Inventory App**: http://localhost:3000/inventory
- **TeamInbox App**: http://localhost:3000/teaminbox (placeholder)
- **Backend API**: http://127.0.0.1:8000/api/
- **Super Admin**: http://127.0.0.1:8000/superadmin/
- **Tenant Admin**: http://[tenant].localhost:8000/admin/
- **API Documentation (Swagger)**: http://127.0.0.1:8000/api/swagger/ or http://demo.localhost:8000/api/swagger/
- **API Documentation (ReDoc)**: http://127.0.0.1:8000/api/redoc/ or http://demo.localhost:8000/api/redoc/

## Three-Level Architecture

The system implements a complete three-level multi-tenant SaaS architecture:

```
┌─────────────────────────────────────────────────────────┐
│                SUPER ADMIN                              │
│              System Management                         │
│  • Manage all tenants (companies)                      │
│  • Onboard new companies                               │
│  • System monitoring                                   │
│  • Global user management                              │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────┬─────────────────────────────────┐
│   COMPANY A ADMIN   │        COMPANY B ADMIN          │
│   Tenant Management │       Tenant Management         │
│   • Manage company  │       • Manage company          │
│     users & roles   │         users & roles           │
│   • CRM settings    │       • CRM settings            │
│   • Company data    │       • Company data            │
└─────────────────────┴─────────────────────────────────┘
                           │
                           ▼
┌─────────────────────┬─────────────────────────────────┐
│  COMPANY A USERS    │       COMPANY B USERS           │
│  • Sales reps       │       • Sales reps              │
│  • Managers         │       • Managers                │
│  • Viewers          │       • Viewers                 │
│  • CRM operations   │       • CRM operations          │
└─────────────────────┴─────────────────────────────────┘
```

### Level 1: Super Admin (System Management)
**Location**: `core/` modules + `/superadmin/` interface
**Database**: Public schema
- **Models**: User, Client, Domain, Application, ClientApplication
- **Access**: http://127.0.0.1:8000/superadmin/
- **APIs**: `/api/auth/tenants/` (tenant creation, listing)
- **Responsibilities**: Manage all tenants, onboard companies, manage applications, system monitoring

### Level 2: Company Admin (Tenant Management)
**Location**: `core/tenant_core/` + `/admin/` interface
**Database**: Tenant-specific schemas
- **Models**: TenantUser (proxy), Role, UserRole, AuditLog
- **Access**: http://[tenant].localhost:8000/admin/
- **APIs**: `/api/tenant/` endpoints
- **Responsibilities**: Manage company users & roles, configure tenant settings

### Level 3: Company Users (End Users)
**Location**: Frontend multi-app interface
**Database**: Same tenant-specific schemas
- **Models**: TenantUser with role-based permissions + app-specific models
- **Access**: Frontend app launcher → individual apps (CRM, TeamInbox, etc.)
- **APIs**: App-specific APIs (`/api/crm/*`, `/api/teaminbox/*`, etc.)
- **Responsibilities**: Daily operations within assigned permissions and subscribed apps

## Authentication & Authorization

### Authentication Flow
1. User submits credentials to `/api/auth/login/`
2. JWT tokens generated (60min expiry, auto-refresh with expiration validation)
3. `TenantMiddleware` routes requests to correct tenant schema
4. `JWTAuthentication` validates tokens and loads user
5. RBAC system checks permissions per module

### Role-Based Access Control (RBAC)
- **Admin**: Full access to all modules (`all`)
- **Sales Manager**: Team and opportunity management
- **Sales Rep**: Create/edit leads and contacts
- **Account Manager**: Account and contact management
- **Support Agent**: Handle support tickets
- **Viewer**: Read-only access

#### Available Permissions
- **all**: Full Access
- **manage_team**: Team Management
- **manage_opportunities**: Opportunity Management
- **manage_leads**: Lead Management
- **manage_contacts**: Contact Management
- **manage_accounts**: Account Management
- **manage_tickets**: Ticket Management
- **manage_knowledge_base**: Knowledge Base Management
- **manage_campaigns**: Campaign Management
- **manage_reports**: Report Management
- **manage_settings**: Settings Management
- **view_customers**: Customer View
- **view_only**: Read Only Access

## Core Business Modules

**Architecture**: Schema-based multi-tenancy (django-tenants) provides automatic tenant isolation at database level.

### CRM Module
- **Account**: Company/organization records with billing/shipping addresses
- **Contact**: Individual contacts linked to accounts
- **Lead**: Potential customers with qualification workflow  
- **Deal**: Sales opportunities with pipeline stages

### Finance Module
- **Customer**: Finance-specific customer records
- **Estimate**: Quotes and proposals with line items
- **Invoice**: Billing documents with payment tracking
- **Sales Order**: Order management with fulfillment tracking

### Inventory Module  
- **Product**: Service/product catalog with pricing and stock tracking

### Supporting Modules
- **Attachments**: File uploads for all entities
- **Tasks**: Task management across modules
- **Calls/Emails/Meetings**: Activity tracking

### Key Features
- Full CRUD operations with validation
- Lead conversion workflow (Lead → Account + Contact + Deal)
- Estimate to Invoice conversion
- Search, pagination, and statistics
- RBAC with permission-based UI

## Demo Credentials

**Login Credentials**:
- **Superadmin**: admin@neuracrm.com / admin123
- **Demo Admin**: admin@demo.com / demo123 ⭐ **RECOMMENDED FOR TESTING** (Full permissions)
- **Demo Manager**: manager@demo.com / demo123 (Limited permissions - no accounts access)
- **Demo Sales Rep**: sales@demo.com / demo123 (Basic permissions)
- **Demo Support**: support@demo.com / demo123 (Support permissions only)
- **Demo Viewer**: viewer@demo.com / demo123 (View-only permissions)

## Creating New Tenants

### Via Super Admin Interface
1. Access: http://127.0.0.1:8000/superadmin/
2. Login: admin@neuracrm.com / admin123
3. Add Client with:
   - Company name
   - Schema name (letters, numbers, underscores only)
   - Admin user details (email, password, names)
   - Domain auto-creation option

System automatically creates client, admin user, domain, tenant assignment, and assigns all active applications.

## Required Hosts File Entries

```bash
# Add to /etc/hosts for local development
echo "127.0.0.1 demo.localhost" | sudo tee -a /etc/hosts
echo "127.0.0.1 [your_client].localhost" | sudo tee -a /etc/hosts
```

## Security Features

### Multi-Tenant Security
- **User-Tenant Relationship**: Users explicitly assigned to authorized tenants
- **Tenant-Scoped JWT**: Tokens include tenant_schema and validated per request
- **Cross-Tenant Protection**: Tokens from one tenant cannot access another
- **Complete Isolation**: Tenant data isolated at database and application levels
- **Token Expiration Validation**: Automatic cleanup of expired tokens
- **TenantUserManager**: Automatic schema-aware filtering prevents cross-tenant user access
  - Public schema: Shows all users (superuser access)
  - Tenant schema: Shows only current tenant's users
  - Blocks `TenantUser.objects.all()` and `TenantUser.objects.get(id)` cross-tenant access

### Admin Interface Security
- **Tenant Isolation**: Each admin only sees their tenant's data
- **Permission Scoping**: Tenant admins cannot access global settings
- **Auto-Assignment**: New users automatically assigned to current tenant
- **Client Disable**: Inactive tenants blocked with HTTP 503

## Environment Variables

Key variables in `.env`:
- `DB_NAME`, `DB_USER`, `DB_PASSWORD`: Database connection
- `SECRET_KEY`: Django secret key
- `JWT_SECRET_KEY`: JWT signing key
- `DEBUG`: Development mode flag

## Troubleshooting

### Common Issues
```bash
# Reset everything
make clean && make setup

# Database issues  
make db-reset && make migrate
```

- **401 errors**: Clear browser localStorage, use `127.0.0.1:8000` not `localhost:8000`
- **Tenant domains**: Add entries to `/etc/hosts` for `*.localhost` domains

## API Endpoints Available

### Authentication & Platform
- `POST /api/auth/login/` - User authentication
- `POST /api/auth/logout/` - User logout
- `POST /api/auth/refresh/` - Refresh JWT token
- `GET /api/auth/me/` - Current user details
- `POST /api/auth/tenants/` - Create new tenant (superadmin only)

### CRM Module APIs
- `GET/POST /api/crm/leads/` - Lead management
- `GET/POST /api/crm/accounts/` - Account management  
- `GET/POST /api/crm/contacts/` - Contact management
- `GET/POST /api/crm/opportunities/` - Deal management
- `GET /api/crm/accounts/{id}/contacts/` - Account's contacts
- `GET /api/crm/accounts/{id}/deals/` - Account's deals
- `GET /api/crm/accounts/{id}/leads/` - Account's leads
- `GET /api/crm/accounts/summary/` - Account statistics
- `POST /api/crm/leads/{id}/convert/` - Convert lead to account/contact/deal

### Finance Module APIs
- `GET/POST /api/finance/customers/` - Customer management
- `GET/POST /api/finance/estimates/` - Estimate management
- `GET/POST /api/finance/invoices/` - Invoice management
- `GET/POST /api/finance/sales-orders/` - Sales order management
- `POST /api/finance/estimates/{id}/convert-to-invoice/` - Convert estimate to invoice
- `GET/POST /api/finance/accounting/accounts/` - Chart of accounts
- `GET/POST /api/finance/accounting/journal-entries/` - Journal entries

### Inventory Module APIs
- `GET/POST /api/inventory/products/` - Product catalog management
- `GET/POST /api/inventory/items/` - Item management

### Activity APIs
- `GET/POST /api/attachments/` - File attachments
- `GET/POST /api/tasks/` - Task management
- `GET/POST /api/calls/` - Call logs
- `GET/POST /api/emails/` - Email tracking
- `GET/POST /api/meetings/` - Meeting scheduling

### Tenant Management APIs
- `GET /api/tenant/users/` - List tenant users
- `GET /api/tenant/roles/` - List roles
- `POST /api/tenant/users/{id}/roles/` - Assign user roles

### Data Relationships
- **Lead → Account**: Optional (leads can exist without accounts)
- **Contact → Account**: Optional (contacts can be standalone)  
- **Deal → Account**: Required (deals must have accounts)
- **Deal → Contact**: Optional (primary contact)



## Architecture

### Directory Structure
```
backend/
├── core/          # Platform core modules
│   ├── auth/      # Authentication system
│   ├── shared/    # Shared utilities and base models
│   ├── subscriptions/ # Application subscription management
│   ├── tenants/   # Multi-tenancy system
│   └── tenant_core/ # Tenant-specific core
└── services/      # Business logic modules
    ├── crm/       # CRM module (accounts, contacts, leads, deals)
    ├── finance/   # Finance module
    │   ├── accounting/ # Charts of accounts, journal entries
    │   ├── customers/ # Customer management
    │   ├── estimates/ # Quotes and estimates
    │   ├── invoices/  # Invoice management
    │   └── sales_orders/ # Sales orders
    ├── inventory/ # Inventory module
    │   ├── items/    # Item management
    │   └── products/ # Product catalog
    ├── settings/  # Settings module
    │   ├── currencies/ # Currency management
    │   └── inventory/  # Inventory settings
    ├── attachments/ # File management
    ├── tasks/     # Task management
    ├── calls/     # Call tracking
    ├── emails/    # Email tracking
    ├── meetings/  # Meeting management
    ├── campaigns/ # Campaign management
    └── teaminbox/ # TeamInbox (placeholder)

frontend/src/
├── apps/          # Application modules
│   ├── crm/       # CRM application
│   ├── finance/   # Finance application with accounting
│   ├── inventory/ # Inventory application
│   └── teaminbox/ # TeamInbox application
├── platform/      # Platform features
│   └── superadmin/ # Super admin interface
├── core/          # Core functionality
├── shared/        # Reusable components
├── finance-inventory-shared/ # Shared finance/inventory components
└── api/           # API utilities
```

### Applications
- **CRM**: Leads, Contacts, Accounts, Deals (✅ Complete)
- **Finance**: Accounting, Customers, Estimates, Invoices, Sales Orders (✅ Complete)
- **Inventory**: Items, Products, Adjustments (✅ Complete)
- **TeamInbox**: Customer communications (🚧 In Development)

### API Structure
- **Platform**: `/api/auth/*`, `/api/tenant/*`, `/api/apps/*`
- **CRM**: `/api/crm/{leads,accounts,contacts,opportunities}/`
- **Finance**: 
  - `/api/finance/{customers,estimates,invoices,sales-orders}/`
  - `/api/finance/accounting/*` - Charts of accounts, journal entries
- **Inventory**: 
  - `/api/inventory/products/` - Product catalog
  - `/api/inventory/items/` - Item management
- **Settings**: `/api/settings/currencies/` - Currency management
- **Activities**: `/api/{attachments,tasks,calls,emails,meetings,campaigns}/`
- **TeamInbox**: `/api/teaminbox/*` (in development)

## Recent Updates

### Application Architecture
- **Dynamic App Management**: Applications managed via Super Admin interface
- **API Endpoint**: `/api/apps/user-applications/` - fetches tenant-specific applications
- **Four Active Apps**: CRM, Finance, Inventory, TeamInbox (placeholder)
- **Seeding**: Applications automatically assigned to all tenants via `seed_applications.py`

### Security & Multi-Tenancy
- **TenantUserManager**: Automatic tenant-based user filtering for security
- **Schema Isolation**: Database-level tenant data separation
- **JWT Tokens**: Tenant-scoped with 60-minute expiry and auto-refresh

## Tech Stack
- **Backend**: Django 5.1 + DRF, PostgreSQL with django-tenants
- **Frontend**: React 18 + TypeScript, Vite, TanStack Query, Tailwind CSS
- **Authentication**: JWT with tenant-scoped tokens (60min expiry)
- **Features**: RBAC, theme system (light/dark/system), responsive design


## Development Notes
- Use port 8000 for backend, 3000 for frontend
- Schema-based multi-tenancy handles tenant isolation automatically
- Use shared component library for consistency
- Test changes with demo tenant accounts
- Run `make lint` before committing code
- Run `make test` to ensure all tests pass

## Important Reminders for Claude
- Always use virtual environment path for Python commands: `/home/ralakdev/Documents/NeuraOne/venv/bin/python`
- Never create files unless explicitly requested
- Always prefer editing existing files over creating new ones
- Try to implement simple and maintainble solutions over complex ones
- Never proactively create documentation files (*.md) or README files
- Use the shared components library for UI consistency
- Always respect the multi-tenant architecture - never bypass tenant isolation
- Test with admin@demo.com account for full permissions testing
- Refer folder_structure or project_index md for project understanding