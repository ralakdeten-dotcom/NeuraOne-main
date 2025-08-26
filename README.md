# NeuraOne

Multi-tenant SaaS platform with CRM, Finance, and Inventory applications.

## Prerequisites
- Python 3.11+
- Django 5.1+
- Node.js 18+  
- PostgreSQL 12+

## Quick Setup
```bash
git clone <repository-url> NeuraOne
cd NeuraOne
make setup  # Complete automated setup
```

## Running the App

### First Time Setup
```bash
make setup  # Complete automated setup (installs deps, creates DB, runs migrations, seeds data)
```

### Start Both Servers
```bash
make dev  # Runs backend (8000) and frontend (3000) concurrently
```

### Or Run Separately
```bash
# Backend (Django)
/home/ralakdev/Documents/NeuraOne/venv/bin/python /home/ralakdev/Documents/NeuraOne/backend/manage.py runserver

# Frontend (React)
cd frontend && npm run dev
```

## Access
- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000/api/
- **API Documentation (ReDoc)**: http://127.0.0.1:8000/api/redoc/
- **Super Admin**: http://127.0.0.1:8000/superadmin/
- **Demo Tenant Admin**: http://demo.localhost:8000/admin/
- **Demo Tenant Frontend**: http://demo.localhost:3000
- **Tenant Admin**: http://[tenant].localhost:8000/admin/


## Login Credentials

### Superadmin
- **Email**: admin@neuracrm.com
- **Password**: admin123

### Demo Tenant Users
- **Admin**: admin@demo.com / demo123 (Full permissions)
- **Manager**: manager@demo.com / demo123 (Limited permissions)
- **Sales Rep**: sales@demo.com / demo123 (Basic permissions)
- **Support**: support@demo.com / demo123 (Support only)
- **Viewer**: viewer@demo.com / demo123 (Read-only)

## Features

- **Multi-tenancy**: Schema-based isolation
- **Custom Roles**: Extensible RBAC system
- **Module Management**: Enable/disable modules per subscription
- **Superadmin**: Monitor and manage all tenants
- **Localhost Deployment**: Optimized for local development

## Architecture

- **Backend**: Django with django-tenants
- **Frontend**: React with TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT with custom roles

## Development

See `CLAUDE.md` for detailed development guidance.


NOTE:
The seed script might not be working because of some migration changes. Hence use the Superadmin page to create a new tenant.
