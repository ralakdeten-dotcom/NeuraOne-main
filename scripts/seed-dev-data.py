#!/usr/bin/env python
"""
Script to seed development data
"""
import os
import sys
import django
from django.core.management import execute_from_command_line

# Add the project root to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from django.contrib.auth import get_user_model
from core.tenants.models import Client, Domain
from django_tenants.utils import schema_context, get_public_schema_name

User = get_user_model()


def create_public_schema_domain():
    """Create public schema domain for superadmin access"""
    print("🌐 Setting up public schema domain...")
    
    # Get public schema name
    public_schema_name = get_public_schema_name()
    
    # Create or get public schema client
    try:
        public_client = Client.objects.get(schema_name=public_schema_name)
        print(f"  ✓ Public client already exists: {public_client}")
    except Client.DoesNotExist:
        public_client = Client.objects.create(
            schema_name=public_schema_name,
            name='Public Schema'
        )
        print(f"  ✓ Public client created: {public_client}")
    
    # Create domain for 127.0.0.1 if it doesn't exist
    try:
        domain = Domain.objects.get(domain='127.0.0.1')
        print(f"  ✓ Domain already exists: {domain}")
    except Domain.DoesNotExist:
        domain = Domain.objects.create(
            domain='127.0.0.1',
            tenant=public_client,
            is_primary=True
        )
        print(f"  ✓ Domain created: {domain}")
    
    return public_client


def create_superadmin():
    """Create a superadmin user"""
    email = "admin@neuracrm.com"
    password = "admin123"
    
    if User.objects.filter(email=email).exists():
        print(f"✓ Superadmin user already exists: {email}")
        return User.objects.get(email=email)
    
    user = User.objects.create_user(
        username="admin",
        email=email,
        password=password,
        first_name="Super",
        last_name="Admin",
        is_superadmin=True,
        is_staff=True,
        is_superuser=True
    )
    
    print(f"✓ Superadmin user created: {email} / {password}")
    return user


def create_default_roles(tenant_schema):
    """Create default roles in tenant schema"""
    from core.tenant_core.models import Role
    
    roles_data = [
        {
            "name": "Admin", 
            "role_type": "admin",
            "description": "Full access to all modules",
            "permissions": ["all"]
        },
        {
            "name": "Sales Manager",
            "role_type": "manager", 
            "description": "Manage sales team and opportunities",
            "permissions": ["manage_team", "manage_opportunities", "manage_leads", "manage_contacts", "view_customers"]
        },
        {
            "name": "Sales Rep",
            "role_type": "sales",
            "description": "Sales representative access", 
            "permissions": ["manage_leads", "manage_contacts", "view_customers"]
        },
        {
            "name": "Support Agent",
            "role_type": "support",
            "description": "Customer support access",
            "permissions": ["manage_tickets", "manage_knowledge_base", "view_customers"]
        },
        {
            "name": "Viewer",
            "role_type": "viewer",
            "description": "Read-only access",
            "permissions": ["view_only"]
        },
        {
            "name": "Account Manager", 
            "role_type": "custom",
            "description": "Manage customer accounts",
            "permissions": ["manage_accounts", "manage_contacts", "view_customers", "manage_opportunities"]
        }
    ]
    
    with schema_context(tenant_schema):
        created_roles = []
        for role_data in roles_data:
            role, created = Role.objects.get_or_create(
                name=role_data["name"],
                role_type=role_data["role_type"],
                defaults={
                    "description": role_data["description"],
                    "permissions": role_data["permissions"]
                }
            )
            
            if created:
                print(f"  ✓ Role created: {role.name}")
            else:
                print(f"  ✓ Role already exists: {role.name}")
            
            created_roles.append(role)
        
        return created_roles


def create_demo_tenant():
    """Create a demo tenant"""
    tenant_name = "Demo Company"
    domain_name = "demo.localhost"
    
    # Check if tenant already exists
    if Client.objects.filter(name=tenant_name).exists():
        print(f"✓ Demo tenant already exists: {tenant_name}")
        return Client.objects.get(name=tenant_name)
    
    # Create tenant
    tenant = Client.objects.create(
        name=tenant_name,
        schema_name="demo_company",
        description="Demo tenant for testing"
    )
    
    # Create domain
    domain = Domain.objects.create(
        domain=domain_name,
        tenant=tenant,
        is_primary=True
    )
    
    print(f"✓ Demo tenant created: {tenant_name}")
    print(f"  Domain: {domain_name}")
    print(f"  Add '127.0.0.1 {domain_name}' to your hosts file")
    
    return tenant


def create_demo_admin_user(tenant):
    """Create admin user for demo tenant"""
    from core.tenant_core.models import Role, UserRole
    
    # Create admin user in public schema
    admin_email = "admin@demo.com"
    admin_password = "demo123"
    
    # Check if admin user already exists for this tenant
    with schema_context('public'):
        if User.objects.filter(email=admin_email, tenants=tenant).exists():
            print(f"  👤 Admin user already exists: {admin_email}")
            admin_user = User.objects.get(email=admin_email)
            
            # Still ensure proper role assignment
            with schema_context(tenant.schema_name):
                admin_role = Role.objects.filter(role_type="admin").first()
                if admin_role:
                    user_role, role_created = UserRole.objects.get_or_create(
                        user=admin_user,
                        role=admin_role,
                        defaults={"assigned_by": User.objects.filter(is_superadmin=True).first()}
                    )
                    if role_created:
                        print(f"    → Admin role assigned: {admin_role.name}")
                    else:
                        print(f"    ⏭️  Admin role already assigned: {admin_role.name}")
            
            return admin_user
    
    # Create new admin user
    admin_user, user_created = User.objects.get_or_create(
        email=admin_email,
        defaults={
            "username": f"admin_{tenant.schema_name}",
            "first_name": "Demo",
            "last_name": "Admin",
            "is_staff": True,  # Enable Django admin access
            "is_superuser": True  # Required for tenant admin access
        }
    )
    
    if user_created:
        admin_user.set_password(admin_password)
        admin_user.save()
        print(f"  ✓ Demo admin user created: {admin_email}")
    else:
        print(f"  ⏭️  Demo admin user already exists: {admin_email}")
        # Ensure existing user has is_staff=True and is_superuser=True
        updated = False
        if not admin_user.is_staff:
            admin_user.is_staff = True
            updated = True
            print(f"    → Updated is_staff=True for admin access")
        if not admin_user.is_superuser:
            admin_user.is_superuser = True
            updated = True
            print(f"    → Updated is_superuser=True for tenant admin access")
        if updated:
            admin_user.save()
    
    # Add user to tenant (ensure public schema context)
    with schema_context('public'):
        if tenant not in admin_user.tenants.all():
            admin_user.tenants.add(tenant)
            print(f"    → Added to tenant: {tenant.name}")
        else:
            print(f"    ⏭️  Already in tenant: {tenant.name}")
    
    # Assign admin role in tenant schema
    with schema_context(tenant.schema_name):
        admin_role = Role.objects.filter(role_type="admin").first()
        superadmin = User.objects.filter(is_superadmin=True).first()
        
        if admin_role:
            user_role, role_created = UserRole.objects.get_or_create(
                user=admin_user,
                role=admin_role,
                defaults={"assigned_by": superadmin}
            )
            
            if role_created:
                print(f"    → Admin role assigned: {admin_role.name}")
            else:
                print(f"    ⏭️  Admin role already assigned: {admin_role.name}")
        else:
            print(f"    ✗ Admin role not found in tenant schema")
    
    return admin_user


def create_demo_users(tenant):
    """Create demo users and assign them to tenant"""
    from core.tenant_core.models import Role, UserRole
    
    users_data = [
        {
            "email": "manager@demo.com",
            "password": "demo123", 
            "first_name": "John",
            "last_name": "Manager",
            "role_type": "manager"
        },
        {
            "email": "sales@demo.com",
            "password": "demo123",
            "first_name": "Jane", 
            "last_name": "Sales",
            "role_type": "sales"
        },
        {
            "email": "support@demo.com",
            "password": "demo123",
            "first_name": "Mike",
            "last_name": "Support", 
            "role_type": "support"
        },
        {
            "email": "viewer@demo.com",
            "password": "demo123",
            "first_name": "Bob",
            "last_name": "Viewer",
            "role_type": "viewer"
        }
    ]
    
    created_users = []
    superadmin = User.objects.filter(is_superadmin=True).first()
    
    # Use public schema context for user operations
    with schema_context('public'):
        for user_data in users_data:
            # Create or get user in public schema
            user, user_created = User.objects.get_or_create(
                email=user_data["email"],
                defaults={
                    "username": user_data["email"].split("@")[0] + f"_{tenant.schema_name}",
                    "first_name": user_data["first_name"],
                    "last_name": user_data["last_name"]
                }
            )
            
            if user_created:
                user.set_password(user_data["password"])
                user.save()
                print(f"  ✓ User created: {user.email}")
            else:
                print(f"  ⏭️  User already exists: {user.email}")
            
            # Add user to tenant
            if tenant not in user.tenants.all():
                user.tenants.add(tenant)
                print(f"    → Added to tenant: {tenant.name}")
            else:
                print(f"    ⏭️  Already in tenant: {tenant.name}")
            
            created_users.append(user)
    
    # Assign roles in tenant schema
    with schema_context(tenant.schema_name):
        for i, user_data in enumerate(users_data):
            user = created_users[i]
            try:
                # Get the first role of this type (in case of duplicates)
                role = Role.objects.filter(role_type=user_data["role_type"]).first()
                if role:
                    user_role, role_created = UserRole.objects.get_or_create(
                        user=user,
                        role=role,
                        defaults={"assigned_by": superadmin}
                    )
                    
                    if role_created:
                        print(f"    → Role assigned to {user.email}: {role.name}")
                    else:
                        print(f"    ⏭️  Role already assigned to {user.email}: {role.name}")
                else:
                    print(f"    ✗ Role not found: {user_data['role_type']}")
                    
            except Exception as e:
                print(f"    ✗ Error assigning role to {user.email}: {e}")
    
    return created_users


def ensure_migrations():
    """Ensure all migrations are applied"""
    print("Checking migrations...")
    
    try:
        # Run shared migrations
        print("  → Running shared schema migrations...")
        execute_from_command_line(['manage.py', 'migrate_schemas', '--shared'])
        
        # Run tenant migrations  
        print("  → Running tenant schema migrations...")
        execute_from_command_line(['manage.py', 'migrate_schemas', '--tenant'])
        
        print("  ✓ Migrations completed")
    except SystemExit:
        # Django management commands sometimes exit, but that's okay
        print("  ✓ Migration commands completed")


def cleanup_duplicate_roles(tenant_schema):
    """Remove duplicate roles keeping the first one"""
    from core.tenant_core.models import Role
    
    with schema_context(tenant_schema):
        role_types = Role.objects.values('role_type').distinct()
        
        for rt in role_types:
            role_type = rt['role_type']
            roles = Role.objects.filter(role_type=role_type).order_by('created_at')
            
            if roles.count() > 1:
                # Keep the first role, delete the rest
                keep_role = roles.first()
                duplicate_roles = roles.exclude(id=keep_role.id)
                
                print(f"  → Removing {duplicate_roles.count()} duplicate {role_type} roles")
                duplicate_roles.delete()


def check_existing_data(tenant_schema):
    """Check if CRM data already exists in tenant"""
    from services.crm.accounts.models import Account
    from services.crm.contacts.models import Contact
    from services.crm.leads.models import Lead
    from services.crm.deals.models import Deal
    
    with schema_context(tenant_schema):
        counts = {
            'accounts': Account.objects.count(),
            'contacts': Contact.objects.count(),
            'leads': Lead.objects.count(),
            'deals': Deal.objects.count()
        }
        
        total = sum(counts.values())
        
        if total > 0:
            print(f"  📊 Existing CRM data found:")
            for model, count in counts.items():
                if count > 0:
                    print(f"    {model.capitalize()}: {count}")
            return True
        
        return False


def create_sample_crm_data(tenant, users):
    """Create sample CRM data for testing"""
    from services.crm.accounts.models import Account
    from services.crm.contacts.models import Contact
    from services.crm.leads.models import Lead
    from services.crm.deals.models import Deal
    from datetime import date, timedelta
    
    # Check if data already exists
    if check_existing_data(tenant.schema_name):
        print(f"  ⏭️  Skipping CRM data creation - data already exists in {tenant.name}")
        
        # Return existing data for summary
        with schema_context(tenant.schema_name):
            return {
                "accounts": list(Account.objects.all()),
                "contacts": list(Contact.objects.all()),
                "leads": list(Lead.objects.all()),
                "deals": list(Deal.objects.all())
            }
    
    with schema_context(tenant.schema_name):
        # Tenant isolation handled by schema context, no FK reference needed
        
        # Get a sales user for ownership
        sales_user = next((u for u in users if u.email == "sales@demo.com"), users[0])
        manager_user = next((u for u in users if u.email == "manager@demo.com"), users[0])
        
        # Create sample accounts
        accounts_data = [
            {"name": "Acme Corporation", "industry": "Technology", "website": "https://acme.com"},
            {"name": "Global Industries", "industry": "Manufacturing", "website": "https://global.com"},
            {"name": "TechStart Inc", "industry": "Software", "website": "https://techstart.com"},
        ]
        
        created_accounts = []
        for acc_data in accounts_data:
            account, created = Account.objects.get_or_create(
                account_name=acc_data["name"],
                defaults={
                    "industry": acc_data["industry"],
                    "website": acc_data["website"],
                    "owner": sales_user,
                    "created_by": sales_user,
                    "billing_city": "New York",
                    "billing_country": "USA"
                }
            )
            if created:
                print(f"  ✓ Account created: {account.account_name}")
            else:
                print(f"  ⏭️  Account already exists: {account.account_name}")
            created_accounts.append(account)
        
        # Create sample contacts
        contacts_data = [
            {"first_name": "John", "last_name": "Doe", "email": "john@acme.com", "title": "CEO"},
            {"first_name": "Jane", "last_name": "Smith", "email": "jane@global.com", "title": "CTO"},
            {"first_name": "Mike", "last_name": "Johnson", "email": "mike@techstart.com", "title": "VP Sales"},
        ]
        
        created_contacts = []
        for i, contact_data in enumerate(contacts_data):
            contact, created = Contact.objects.get_or_create(
                email=contact_data["email"],
                defaults={
                    "first_name": contact_data["first_name"],
                    "last_name": contact_data["last_name"],
                    "title": contact_data["title"],
                    "account": created_accounts[i] if i < len(created_accounts) else None,
                    "owner": sales_user,
                    "created_by": sales_user,
                    "mailing_city": "New York",
                    "mailing_country": "USA"
                }
            )
            if created:
                print(f"  ✓ Contact created: {contact.first_name} {contact.last_name}")
            else:
                print(f"  ⏭️  Contact already exists: {contact.first_name} {contact.last_name}")
            created_contacts.append(contact)
        
        # Create sample leads (for testing conversion)
        leads_data = [
            {"first_name": "Alice", "last_name": "Wilson", "email": "alice@prospect.com", "status": "new"},
            {"first_name": "Bob", "last_name": "Brown", "email": "bob@potential.com", "status": "qualified"},
            {"first_name": "Carol", "last_name": "Davis", "email": "carol@interested.com", "status": "working"},
        ]
        
        created_leads = []
        for lead_data in leads_data:
            lead, created = Lead.objects.get_or_create(
                email=lead_data["email"],
                defaults={
                    "first_name": lead_data["first_name"],
                    "last_name": lead_data["last_name"],
                    "lead_status": lead_data["status"],
                    "lead_owner": sales_user,
                    "created_by": sales_user,
                    "industry": "Technology",
                    "city": "San Francisco",
                    "country": "USA",
                    "score": 75
                }
            )
            if created:
                print(f"  ✓ Lead created: {lead.first_name} {lead.last_name}")
            else:
                print(f"  ⏭️  Lead already exists: {lead.first_name} {lead.last_name}")
            created_leads.append(lead)
        
        # Create sample deals
        deals_data = [
            {"name": "Enterprise Software License", "amount": 50000, "stage": "prospecting"},
            {"name": "Cloud Migration Project", "amount": 75000, "stage": "qualification"},
            {"name": "Annual Support Contract", "amount": 25000, "stage": "negotiation"},
        ]
        
        created_deals = []
        for i, deal_data in enumerate(deals_data):
            deal, created = Deal.objects.get_or_create(
                deal_name=deal_data["name"],
                defaults={
                    "stage": deal_data["stage"],
                    "amount": deal_data["amount"],
                    "close_date": date.today() + timedelta(days=30),
                    "account": created_accounts[i] if i < len(created_accounts) else created_accounts[0],
                    "owner": manager_user,
                    "created_by": manager_user
                }
            )
            if created:
                print(f"  ✓ Deal created: {deal.deal_name}")
            else:
                print(f"  ⏭️  Deal already exists: {deal.deal_name}")
            created_deals.append(deal)
        
        return {
            "accounts": created_accounts,
            "contacts": created_contacts,
            "leads": created_leads,
            "deals": created_deals
        }


def main():
    print("=" * 60)
    print("🌱 NeuraCRM Development Data Seeder")
    print("=" * 60)
    
    try:
        # Ensure migrations are applied
        ensure_migrations()
        
        print("\n📋 Creating base data...")
        
        # Create public schema domain for superadmin access
        create_public_schema_domain()
        
        # Create superadmin
        superadmin = create_superadmin()
        
        # Create demo tenant
        print("\n🏢 Creating demo tenant...")
        demo_tenant = create_demo_tenant()
        
        # Seed applications
        print("\n📱 Seeding applications...")
        # Import and run application seeding inline to avoid path issues
        from core.tenants.models import Application, ClientApplication
        
        # Create default applications
        applications_data = [
            {
                'code': 'crm',
                'name': 'CRM',
                'description': 'Manage customers, leads, deals, and grow your business',
                'icon': '📊',
                'url_prefix': '/crm',
            },
            {
                'code': 'finance',
                'name': 'Finance',
                'description': 'Handle estimates, invoices, sales orders, and financial operations',
                'icon': '💰',
                'url_prefix': '/finance',
            },
            {
                'code': 'inventory',
                'name': 'Inventory',
                'description': 'Manage products, stock levels, and inventory tracking',
                'icon': '📦',
                'url_prefix': '/inventory',
            },
            {
                'code': 'teaminbox', 
                'name': 'Team Inbox',
                'description': 'Collaborate on customer communications across your team',
                'icon': '📧',
                'url_prefix': '/teaminbox',
            }
        ]
        
        for app_data in applications_data:
            app, created = Application.objects.get_or_create(
                code=app_data['code'],
                defaults=app_data
            )
            if created:
                print(f"  ✅ Created application: {app.name}")
            else:
                print(f"  📋 Application already exists: {app.name}")
        
        # Assign applications to all active clients (including demo tenant)
        clients = Client.objects.filter(is_active=True)
        applications = Application.objects.filter(is_active=True)
        
        print(f"  📊 Assigning {applications.count()} applications to {clients.count()} tenants...")
        for client in clients:
            for app in applications:
                client_app, created = ClientApplication.objects.get_or_create(
                    client=client,
                    application=app,
                    defaults={'is_active': True}
                )
                if created:
                    print(f"    ✅ Assigned {app.name} to {client.name}")
        
        print(f"  🎉 Applications seeded successfully!")
        
        # Clean up any duplicate roles first
        print(f"\n🧹 Cleaning up duplicate roles in {demo_tenant.name}...")
        cleanup_duplicate_roles(demo_tenant.schema_name)
        
        # Create default roles in demo tenant
        print(f"\n👥 Creating roles in {demo_tenant.name}...")
        roles = create_default_roles(demo_tenant.schema_name)
        
        # Create demo admin user
        print(f"\n👤 Creating admin user in {demo_tenant.name}...")
        demo_admin = create_demo_admin_user(demo_tenant)
        
        # Create demo users 
        print(f"\n👤 Creating regular users in {demo_tenant.name}...")
        demo_users = create_demo_users(demo_tenant)
        
        # Create sample CRM data
        print(f"\n📊 Creating sample CRM data in {demo_tenant.name}...")
        all_demo_users = [demo_admin] + demo_users
        crm_data = create_sample_crm_data(demo_tenant, all_demo_users)
        
        print("\n" + "=" * 60)
        print("✅ Development data seeded successfully!")
        print("=" * 60)
        
        print("\n🔑 Login Credentials:")
        print("   Super Admin: admin@neuracrm.com / admin123")
        print("   Demo Admin:  admin@demo.com / demo123 ⭐ RECOMMENDED FOR TESTING")
        print("   Manager:     manager@demo.com / demo123")
        print("   Sales Rep:   sales@demo.com / demo123") 
        print("   Support:     support@demo.com / demo123")
        print("   Viewer:      viewer@demo.com / demo123")
        
        print("\n🌐 Access URLs:")
        print("   Super Admin: http://127.0.0.1:8000/superadmin/")
        print("   Demo Admin:  http://demo.localhost:8000/admin/")
        print("   Frontend:    http://localhost:3000")
        
        print("\n⚙️  Configuration:")
        print("   Add to /etc/hosts: 127.0.0.1 demo.localhost")
        print("   Demo tenant schema: demo_company")
        print(f"   Total roles created: {len(roles)}")
        print(f"   Total users created: {len(all_demo_users)}")
        
        print("\n📊 CRM Sample Data Created:")
        print(f"   Accounts: {len(crm_data['accounts'])}")
        print(f"   Contacts: {len(crm_data['contacts'])}")
        print(f"   Leads: {len(crm_data['leads'])} (ready for conversion testing)")
        print(f"   Deals: {len(crm_data['deals'])}")
        
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()