"""
API views for tenant management (Super Admin only)
"""
import logging

from django.contrib.auth import get_user_model
from django.db import transaction
from django_tenants.utils import schema_context
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Client, Domain

logger = logging.getLogger(__name__)
User = get_user_model()


class IsSuperAdmin(permissions.BasePermission):
    """
    Custom permission to only allow superadmins to access tenant management
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_superuser


@api_view(['POST'])
@permission_classes([IsSuperAdmin])
def create_tenant(request):
    """
    Create a new tenant with admin user
    """
    try:
        # Extract data
        company_name = request.data.get('company_name')
        schema_name = request.data.get('schema_name')
        domain_url = request.data.get('domain_url')
        admin_email = request.data.get('admin_email')
        admin_password = request.data.get('admin_password')
        admin_first_name = request.data.get('admin_first_name', 'Admin')
        admin_last_name = request.data.get('admin_last_name', company_name)

        # Validate required fields
        if not all([company_name, schema_name, admin_email, admin_password]):
            return Response({
                'error': 'Missing required fields',
                'required': ['company_name', 'schema_name', 'admin_email', 'admin_password']
            }, status=status.HTTP_400_BAD_REQUEST)

        # Validate schema name (only lowercase letters, numbers, and underscores)
        import re
        if not re.match(r'^[a-z][a-z0-9_]*$', schema_name):
            return Response({
                'error': 'Invalid schema name. Must start with lowercase letter and contain only lowercase letters, numbers, and underscores'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if schema already exists
        if Client.objects.filter(schema_name=schema_name).exists():
            return Response({
                'error': f'Schema {schema_name} already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Check if domain already exists
        if domain_url and Domain.objects.filter(domain=domain_url).exists():
            return Response({
                'error': f'Domain {domain_url} already exists'
            }, status=status.HTTP_400_BAD_REQUEST)

        # Create everything in a transaction
        with transaction.atomic():
            # Create the client
            client = Client.objects.create(
                name=company_name,
                schema_name=schema_name,
                description=f'{company_name} tenant',
                is_active=True
            )

            # Create domain if provided, otherwise use schema_name.localhost
            if not domain_url:
                domain_url = f'{schema_name}.localhost'

            domain = Domain.objects.create(
                domain=domain_url,
                tenant=client,
                is_primary=True
            )

            # Create admin user in public schema
            with schema_context('public'):
                # Check if user already exists
                if User.objects.filter(email=admin_email).exists():
                    # User exists, just assign to tenant
                    admin_user = User.objects.get(email=admin_email)
                else:
                    # Create new user
                    admin_user = User.objects.create_user(
                        username=f'admin_{schema_name}',
                        email=admin_email,
                        password=admin_password,
                        first_name=admin_first_name,
                        last_name=admin_last_name,
                        is_staff=True,
                        is_active=True
                    )

                # Assign user to tenant
                admin_user.tenants.add(client)

            # Create admin role in tenant schema and assign to user
            with schema_context(client.schema_name):
                from core.tenant_core.models import Role, UserRole

                # Create admin role if it doesn't exist
                admin_role, created = Role.objects.get_or_create(
                    name='Admin',
                    role_type='admin',
                    defaults={
                        'description': 'Full administrative access',
                        'permissions': ['all'],  # Full access
                        'is_active': True
                    }
                )

                # Assign admin role to user
                UserRole.objects.get_or_create(
                    user=admin_user,
                    role=admin_role,
                    defaults={
                        'is_active': True,
                        'assigned_by': admin_user  # Self-assigned during creation
                    }
                )

            # Create tenant schema
            # This happens automatically when saving the Client model

            # Assign CRM application to the tenant
            from .models import Application, ClientApplication
            try:
                crm_app = Application.objects.get(code='crm')
                ClientApplication.objects.create(
                    client=client,
                    application=crm_app,
                    is_active=True
                )
            except Application.DoesNotExist:
                logger.warning(f"CRM application not found, skipping assignment for {schema_name}")

            return Response({
                'message': 'Tenant created successfully',
                'tenant': {
                    'id': client.id,
                    'name': client.name,
                    'schema_name': client.schema_name,
                    'domain': domain.domain,
                    'admin_email': admin_email
                }
            }, status=status.HTTP_201_CREATED)

    except Exception as e:
        logger.error(f"Error creating tenant: {str(e)}")
        return Response({
            'error': 'Failed to create tenant',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsSuperAdmin])
def list_tenants(request):
    """
    List all tenants
    """
    try:
        # Get all clients with their domains
        clients = Client.objects.all().order_by('-created_on')

        tenant_list = []
        for client in clients:
            # Get primary domain
            domain = Domain.objects.filter(tenant=client, is_primary=True).first()

            # Count users
            user_count = client.users.count()

            tenant_list.append({
                'id': client.id,
                'name': client.name,
                'schema_name': client.schema_name,
                'domain': domain.domain if domain else None,
                'is_active': client.is_active,
                'user_count': user_count,
                'created_on': client.created_on
            })

        return Response({
            'count': len(tenant_list),
            'results': tenant_list
        }, status=status.HTTP_200_OK)

    except Exception as e:
        logger.error(f"Error listing tenants: {str(e)}")
        return Response({
            'error': 'Failed to list tenants',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
