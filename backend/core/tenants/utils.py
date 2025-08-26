from django.contrib.auth import get_user_model
from django.db import connection

from core.tenant_core.models import AuditLog

User = get_user_model()


def create_audit_log(user, action, model_name, object_id, changes=None, request=None):
    """
    Create audit log entry for tenant-specific actions
    """
    try:
        # Skip if we're in public schema
        if connection.schema_name == 'public':
            return None

        # Get IP address and user agent from request
        ip_address = None
        user_agent = ""

        if request:
            ip_address = get_client_ip(request)
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:500]  # Limit length

        # Create audit log entry
        audit_log = AuditLog.objects.create(
            user=user,
            action=action,
            model_name=model_name,
            object_id=object_id,
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent
        )

        return audit_log

    except Exception as e:
        # Log the error but don't fail the main operation
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to create audit log: {e}")
        return None


def get_client_ip(request):
    """
    Get client IP address from request headers
    """
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip