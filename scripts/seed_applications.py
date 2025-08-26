#!/usr/bin/env python
"""
Seed default applications and assign them to existing tenants
"""
import os
import sys
import django

# Setup Django
sys.path.append(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'backend'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.dev')
django.setup()

from core.tenants.models import Application, Client, ClientApplication


def seed_applications():
    """Create default applications"""
    print("Seeding applications...")
    
    applications = [
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
    
    created_apps = []
    for app_data in applications:
        app, created = Application.objects.get_or_create(
            code=app_data['code'],
            defaults=app_data
        )
        if created:
            print(f"✅ Created application: {app.name}")
        else:
            print(f"📋 Application already exists: {app.name}")
        created_apps.append(app)
    
    # Assign applications to all active clients
    print("\nAssigning applications to tenants...")
    clients = Client.objects.filter(is_active=True)
    applications = Application.objects.filter(is_active=True)
    
    if not clients.exists():
        print("⚠️  No active clients found. Create tenants first.")
        return
    
    for client in clients:
        print(f"\nProcessing tenant: {client.name}")
        for app in applications:
            client_app, created = ClientApplication.objects.get_or_create(
                client=client,
                application=app,
                defaults={'is_active': True}
            )
            if created:
                print(f"  ✅ Assigned {app.name} to {client.name}")
            else:
                print(f"  📋 {app.name} already assigned to {client.name}")
    
    print(f"\n🎉 Seeding complete!")
    print(f"   Applications created: {len(created_apps)}")
    print(f"   Tenants processed: {clients.count()}")


if __name__ == '__main__':
    seed_applications()