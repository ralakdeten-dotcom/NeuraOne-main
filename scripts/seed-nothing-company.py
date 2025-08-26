#!/usr/bin/env python
"""
Demo Data Seeder for 'Nothing' Company
Creates a tenant with demo CRM data for testing purposes
"""
import os
import sys
import django
from django.db import transaction
from django.core.management import call_command

# Add project root to path
backend_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'backend')
sys.path.insert(0, backend_path)
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')

django.setup()

from django_tenants.utils import tenant_context, schema_context
from apps.core.models import User, Client, Domain
from apps.tenant_core.models import Role, UserRole
from apps.accounts.models import Account
from apps.contacts.models import Contact
from apps.leads.models import Lead
from apps.opportunities.models import Deal

def create_nothing_company():
    """Create Nothing company with demo data"""
    print("🏢 Creating 'Nothing' company tenant...")
    
    with transaction.atomic():
        # Create client (tenant)
        tenant, created = Client.objects.get_or_create(
            name="Nothing",
            defaults={
                'schema_name': 'nothing',
                'is_active': True
            }
        )
        
        if created:
            print("  ✓ Tenant created: Nothing")
        else:
            print("  ✓ Tenant already exists: Nothing")
        
        # Create domain
        domain, created = Domain.objects.get_or_create(
            domain='nothing.localhost',
            defaults={
                'tenant': tenant,
                'is_primary': True
            }
        )
        
        if created:
            print("  ✓ Domain created: nothing.localhost")
        else:
            print("  ✓ Domain already exists: nothing.localhost")
    
    # Run migrations for the tenant
    print("🔄 Running tenant migrations...")
    call_command('migrate_schemas', '--tenant', verbosity=0)
    
    # Create demo data in tenant context
    with schema_context(tenant.schema_name):
        create_roles()
        admin_user = create_admin_user()
        create_demo_users(tenant, admin_user)
        create_crm_data(admin_user)
    
    print_success_message()

def create_roles():
    """Create roles in the tenant"""
    print("👥 Creating roles in Nothing company...")
    
    roles_data = [
        {'name': 'Admin', 'permissions': ['all']},
        {'name': 'Sales Manager', 'permissions': ['manage_team', 'manage_opportunities', 'manage_leads', 'manage_contacts', 'manage_accounts']},
        {'name': 'Sales Rep', 'permissions': ['manage_leads', 'manage_contacts']},
        {'name': 'Support Agent', 'permissions': ['manage_tickets', 'view_customers']},
        {'name': 'Viewer', 'permissions': ['view_only']},
        {'name': 'Account Manager', 'permissions': ['manage_accounts', 'manage_contacts', 'manage_opportunities']},
    ]
    
    for role_data in roles_data:
        role, created = Role.objects.get_or_create(
            name=role_data['name'],
            defaults={'permissions': role_data['permissions']}
        )
        if created:
            print(f"  ✓ Role created: {role.name}")

def create_admin_user():
    """Create admin user for Nothing company"""
    print("👤 Creating admin user...")
    
    # Get the Nothing tenant
    tenant = Client.objects.get(schema_name='nothing')
    
    # Create admin user
    admin_user, created = User.objects.get_or_create(
        email='admin@nothing.com',
        defaults={
            'username': 'admin_nothing',
            'first_name': 'Admin',
            'last_name': 'Nothing',
            'is_active': True,
            'is_superadmin': False
        }
    )
    
    if created:
        admin_user.set_password('crm@1234')
        admin_user.save()
        print("  ✓ Admin user created: admin@nothing.com")
    else:
        print("  ✓ Admin user already exists: admin@nothing.com")
    
    # Add user to tenant
    admin_user.tenants.add(tenant)
    
    # Assign admin role
    admin_role = Role.objects.get(name='Admin')
    UserRole.objects.get_or_create(
        user=admin_user,
        role=admin_role
    )
    
    return admin_user

def create_demo_users(tenant, admin_user):
    """Create demo users for Nothing company"""
    print("👥 Creating demo users...")
    
    demo_users = [
        {
            'email': 'manager@nothing.com',
            'username': 'manager_nothing',
            'first_name': 'Sarah',
            'last_name': 'Manager',
            'role': 'Sales Manager'
        },
        {
            'email': 'sales@nothing.com',
            'username': 'sales_nothing',
            'first_name': 'Alex',
            'last_name': 'Sales',
            'role': 'Sales Rep'
        },
        {
            'email': 'support@nothing.com',
            'username': 'support_nothing',
            'first_name': 'Jordan',
            'last_name': 'Support',
            'role': 'Support Agent'
        },
        {
            'email': 'viewer@nothing.com',
            'username': 'viewer_nothing',
            'first_name': 'Casey',
            'last_name': 'Viewer',
            'role': 'Viewer'
        }
    ]
    
    for user_data in demo_users:
        user, created = User.objects.get_or_create(
            email=user_data['email'],
            defaults={
                'username': user_data['username'],
                'first_name': user_data['first_name'],
                'last_name': user_data['last_name'],
                'is_active': True,
                'is_superadmin': False
            }
        )
        
        if created:
            user.set_password('crm@1234')
            user.save()
            print(f"  ✓ User created: {user.email}")
        
        # Add to tenant
        user.tenants.add(tenant)
        
        # Assign role
        role = Role.objects.get(name=user_data['role'])
        UserRole.objects.get_or_create(user=user, role=role)

def create_crm_data(admin_user):
    """Create sample CRM data"""
    print("📊 Creating sample CRM data...")
    
    tenant = Client.objects.get(schema_name='nothing')
    
    # Create accounts
    accounts_data = [
        {
            'account_name': 'Nothing Tech Solutions',
            'industry': 'Technology',
            'website': 'https://nothingtech.com',
            'number_of_employees': 50,
            'description': 'Leading technology solutions provider specializing in innovative software development.'
        },
        {
            'account_name': 'Zero Point Industries',
            'industry': 'Manufacturing',
            'website': 'https://zeropoint.com',
            'number_of_employees': 150,
            'description': 'Advanced manufacturing company focusing on precision engineering and automation.'
        },
        {
            'account_name': 'Void Enterprises',
            'industry': 'Consulting',
            'website': 'https://void.com',
            'number_of_employees': 25,
            'description': 'Strategic consulting firm helping businesses optimize their operations.'
        },
        {
            'account_name': 'Empty Corp',
            'industry': 'Software',
            'website': 'https://empty.com',
            'number_of_employees': 200,
            'description': 'Enterprise software company developing cutting-edge business applications.'
        }
    ]
    
    accounts = []
    for account_data in accounts_data:
        account = Account.objects.create(
            tenant=tenant,
            owner=admin_user,
            created_by=admin_user,
            updated_by=admin_user,
            **account_data
        )
        accounts.append(account)
        print(f"  ✓ Account created: {account.account_name}")
    
    # Create contacts
    contacts_data = [
        {
            'first_name': 'Emma',
            'last_name': 'Wilson',
            'email': 'emma.wilson@nothingtech.com',
            'phone': '555-0101',
            'title': 'CEO',
            'account': accounts[0]
        },
        {
            'first_name': 'Liam',
            'last_name': 'Johnson',
            'email': 'liam.johnson@zeropoint.com',
            'phone': '555-0102',
            'title': 'CTO',
            'account': accounts[1]
        },
        {
            'first_name': 'Sophia',
            'last_name': 'Davis',
            'email': 'sophia.davis@void.com',
            'phone': '555-0103',
            'title': 'VP Sales',
            'account': accounts[2]
        },
        {
            'first_name': 'Noah',
            'last_name': 'Brown',
            'email': 'noah.brown@empty.com',
            'phone': '555-0104',
            'title': 'Product Manager',
            'account': accounts[3]
        }
    ]
    
    contacts = []
    for contact_data in contacts_data:
        contact = Contact.objects.create(
            tenant=tenant,
            owner=admin_user,
            created_by=admin_user,
            updated_by=admin_user,
            **contact_data
        )
        contacts.append(contact)
        print(f"  ✓ Contact created: {contact.first_name} {contact.last_name}")
    
    # Create leads
    leads_data = [
        {
            'first_name': 'Maya',
            'last_name': 'Chen',
            'email': 'maya.chen@prospect1.com',
            'phone': '555-0201',
            'company_name': 'Prospect One LLC',
            'lead_status': 'New',
            'industry': 'Technology',
            'score': 80
        },
        {
            'first_name': 'Ethan',
            'last_name': 'Martinez',
            'email': 'ethan.martinez@prospect2.com',
            'phone': '555-0202',
            'company_name': 'Second Prospect Inc',
            'lead_status': 'Qualified',
            'industry': 'Healthcare',
            'score': 90
        },
        {
            'first_name': 'Olivia',
            'last_name': 'Garcia',
            'email': 'olivia.garcia@prospect3.com',
            'phone': '555-0203',
            'company_name': 'Third Prospect Corp',
            'lead_status': 'Working',
            'industry': 'Finance',
            'score': 70
        }
    ]
    
    for lead_data in leads_data:
        lead = Lead.objects.create(
            tenant=tenant,
            lead_owner=admin_user,
            created_by=admin_user,
            updated_by=admin_user,
            **lead_data
        )
        print(f"  ✓ Lead created: {lead.first_name} {lead.last_name}")
    
    # Create deals/opportunities
    deals_data = [
        {
            'deal_name': 'Nothing Tech Software License',
            'account': accounts[0],
            'primary_contact': contacts[0],
            'stage': 'Prospecting',
            'amount': 75000,
            'close_date': '2025-09-30'
        },
        {
            'deal_name': 'Zero Point Implementation',
            'account': accounts[1],
            'primary_contact': contacts[1],
            'stage': 'Needs Analysis',
            'amount': 150000,
            'close_date': '2025-10-15'
        },
        {
            'deal_name': 'Void Consulting Contract',
            'account': accounts[2],
            'primary_contact': contacts[2],
            'stage': 'Proposal',
            'amount': 50000,
            'close_date': '2025-08-31'
        },
        {
            'deal_name': 'Empty Corp Integration',
            'account': accounts[3],
            'primary_contact': contacts[3],
            'stage': 'Negotiation',
            'amount': 200000,
            'close_date': '2025-11-30'
        }
    ]
    
    for deal_data in deals_data:
        deal = Deal.objects.create(
            tenant=tenant,
            owner=admin_user,
            created_by=admin_user,
            updated_by=admin_user,
            **deal_data
        )
        print(f"  ✓ Deal created: {deal.deal_name}")

def print_success_message():
    """Print success message with credentials"""
    print("\n" + "="*60)
    print("✅ Nothing Company Demo Data Created Successfully!")
    print("="*60)
    print()
    print("🔑 Login Credentials:")
    print("   Admin:       admin@nothing.com / crm@1234")
    print("   Manager:     manager@nothing.com / crm@1234")
    print("   Sales Rep:   sales@nothing.com / crm@1234")
    print("   Support:     support@nothing.com / crm@1234")
    print("   Viewer:      viewer@nothing.com / crm@1234")
    print()
    print("🌐 Access URLs:")
    print("   Admin Panel: http://nothing.localhost:8000/admin/")
    print("   Frontend:    http://nothing.localhost:3000")
    print()
    print("⚙️  Configuration:")
    print("   Add to /etc/hosts: 127.0.0.1 nothing.localhost")
    print("   Tenant schema: nothing")
    print()
    print("📊 Demo Data Created:")
    print("   Accounts: 4")
    print("   Contacts: 4")
    print("   Leads: 3")
    print("   Deals: 4")
    print("   Users: 5 (including admin)")
    print("   Roles: 6")

if __name__ == "__main__":
    print("🚀 Starting Nothing Company Demo Data Seeder...")
    try:
        create_nothing_company()
    except Exception as e:
        print(f"❌ Error creating Nothing company: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)