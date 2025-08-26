from django.conf import settings
from django.conf.urls.static import static
from django.db import connection
from django.http import HttpResponse, HttpResponseRedirect
from django.urls import include, path
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView

from core.tenants.admin import tenant_admin_site
from core.tenants.super_admin import super_admin_site


def debug_view(request):
    schema = getattr(connection, 'schema_name', 'unknown')
    tenant = getattr(request, 'tenant', None)
    tenant_name = tenant.name if tenant else 'None'
    tenant_schema = tenant.schema_name if tenant else 'None'

    return HttpResponse(f"""
    Host: {request.get_host()}
    Schema: {schema}
    Tenant: {tenant_name}
    Tenant Schema: {tenant_schema}
    HTTP_HOST: {request.META.get('HTTP_HOST', 'None')}
    """)

def root_redirect(request):
    """
    Handle root URL requests based on tenant context
    """
    tenant = getattr(request, 'tenant', None)

    if tenant:
        if tenant.schema_name == 'public':
            # Public schema - redirect to superadmin
            return HttpResponseRedirect('/superadmin/')
        else:
            # Tenant schema - redirect to tenant admin
            return HttpResponseRedirect('/admin/')
    else:
        # No tenant resolved - redirect to debug info
        return HttpResponseRedirect('/debug/')

urlpatterns = [
    path("", root_redirect, name="root"),  # Root URL handler
    path("debug/", debug_view),
    path("admin/", tenant_admin_site.urls),  # Tenant admin with proper tenant isolation
    path("superadmin/", super_admin_site.urls),  # Super admin with Client/Domain access (public schema only)
    path("api/auth/", include("core.auth.urls")),  # Core authentication
    path("api/tenant/", include("core.tenants.urls")),  # Tenant management
    path("api/apps/", include("core.tenants.app_urls")),  # Application management

    # Attachments API
    path("api/attachments/", include("services.attachments.urls")),
    
    # Tasks API
    path("api/tasks/", include("services.tasks.urls")),

    # Calls API
    path("api/calls/", include("services.calls.urls")),



    
    # Emails API
    path("api/emails/", include("services.emails.urls")),
    
    # Meetings API
    path("api/meetings/", include("services.meetings.urls")),
    

    # CRM APIs
    path("api/crm/leads/", include("services.crm.leads.urls")),
    path("api/crm/accounts/", include("services.crm.accounts.urls")),
    path("api/crm/contacts/", include("services.crm.contacts.urls")),
    path("api/crm/opportunities/", include("services.crm.deals.urls")),

    # Finance APIs
    path("api/finance/", include("services.finance.urls")),

    # Inventory APIs
    path("api/inventory/", include("services.inventory.urls")),

    # Settings APIs
    path("api/settings/", include("services.settings.urls")),

    # TeamInbox APIs
    # path("api/teaminbox/", include("services.teaminbox.urls")),  # Commented out for new backend

    # Other APIs
    # path("api/subscriptions/", include("services.subscriptions.urls")),  # Commented out for new backend
    # path("api/campaigns/", include("services.campaigns.urls")),  # Commented out for new backend

    # API Documentation - Swagger/OpenAPI
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

    if "debug_toolbar" in settings.INSTALLED_APPS:
        import debug_toolbar
        urlpatterns = [
            path("__debug__/", include(debug_toolbar.urls)),
        ] + urlpatterns
