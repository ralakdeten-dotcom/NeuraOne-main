import mimetypes
import os
import tempfile

from django.contrib.contenttypes.models import ContentType
from django.http import FileResponse, Http404, HttpResponse
from django.utils.encoding import smart_str
from PIL import Image
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response

from core.tenants.permissions import IsTenantUser

from .models import Attachment
from .serializers import (
    AttachmentSerializer,
    AttachmentUpdateSerializer,
    AttachmentUploadSerializer,
)


class AttachmentListCreateView(generics.ListCreateAPIView):
    """
    List attachments for a specific entity or upload new attachments.
    URL: /api/attachments/{entity_type}/{entity_id}/
    """
    serializer_class = AttachmentSerializer
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]
    parser_classes = [MultiPartParser, FormParser]

    def get_queryset(self):
        """Get attachments for specific entity."""
        entity_type = self.kwargs.get('entity_type')
        entity_id = self.kwargs.get('entity_id')

        # Map entity types to content types
        entity_map = {
            'account': ('accounts', 'account'),
            'contact': ('contacts', 'contact'),
            'lead': ('leads', 'lead'),
            'deal': ('deals', 'deal'),
            'product': ('products', 'product'),
            'estimate': ('estimates', 'estimate'),
            'customer': ('customers', 'customer'),
        }

        if entity_type not in entity_map:
            return Attachment.objects.none()

        try:
            app_label, model = entity_map[entity_type]
            content_type = ContentType.objects.get(app_label=app_label, model=model)

            return Attachment.objects.filter(
                content_type=content_type,
                object_id=entity_id,
                is_active=True
            ).select_related('uploaded_by', 'content_type')

        except ContentType.DoesNotExist:
            return Attachment.objects.none()

    def perform_create(self, serializer):
        """Handle file upload and link creation with entity linking."""
        entity_type = self.kwargs.get('entity_type')
        entity_id = self.kwargs.get('entity_id')

        # Use upload serializer for validation - now supports both files and links
        attachment_type = self.request.data.get('attachment_type', 'file')

        upload_data = {
            'attachment_type': attachment_type,
            'link_url': self.request.data.get('link_url'),
            'title': self.request.data.get('title'),
            'description': self.request.data.get('description', ''),
            'entity_type': entity_type,
            'entity_id': int(entity_id),
        }

        # Only include file field for file attachments
        if attachment_type == 'file':
            upload_data['file'] = self.request.FILES.get('file')

        upload_serializer = AttachmentUploadSerializer(
            data=upload_data,
            context={'request': self.request}
        )
        upload_serializer.is_valid(raise_exception=True)
        return upload_serializer.save()

    def create(self, request, *args, **kwargs):
        """Override create to handle file upload properly."""
        try:
            attachment = self.perform_create(None)
            serializer = self.get_serializer(attachment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class AttachmentDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    Retrieve, update, or delete a specific attachment.
    URL: /api/attachments/{id}/
    """
    queryset = Attachment.objects.all()
    permission_classes = [permissions.IsAuthenticated, IsTenantUser]

    def get_serializer_class(self):
        """Use different serializers for different actions."""
        if self.request.method in ['PUT', 'PATCH']:
            return AttachmentUpdateSerializer
        return AttachmentSerializer

    def get_object(self):
        """Get attachment and check permissions."""
        obj = super().get_object()

        # Additional permission check: user should have access to the related entity
        # This will be expanded based on your existing permission system
        return obj

    def perform_destroy(self, instance):
        """Soft delete by setting is_active=False, or hard delete."""
        # For audit purposes, you might want to soft delete
        # instance.is_active = False
        # instance.save()

        # Or hard delete (removes file from storage too)
        instance.delete()


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def download_attachment(request, attachment_id):
    """
    Secure file download endpoint.
    URL: /api/attachments/{id}/download/
    """
    try:
        attachment = Attachment.objects.get(id=attachment_id, is_active=True)
    except Attachment.DoesNotExist:
        raise Http404("Attachment not found")

    # Check if file exists
    if not attachment.file or not os.path.exists(attachment.file.path):
        return Response(
            {'error': 'File not found on server'},
            status=status.HTTP_404_NOT_FOUND
        )

    try:
        # Create file response
        response = FileResponse(
            open(attachment.file.path, 'rb'),
            content_type=attachment.content_type_header
        )

        # Set headers for download
        response['Content-Disposition'] = f'attachment; filename="{smart_str(attachment.original_filename)}"'
        response['Content-Length'] = attachment.file_size

        return response

    except OSError:
        return Response(
            {'error': 'Error reading file'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def attachment_stats(request, entity_type, entity_id):
    """
    Get attachment statistics for an entity.
    URL: /api/attachments/{entity_type}/{entity_id}/stats/
    """
    # Map entity types to content types
    entity_map = {
        'account': ('accounts', 'account'),
        'contact': ('contacts', 'contact'),
        'lead': ('leads', 'lead'),
        'deal': ('deals', 'deal'),
        'product': ('products', 'product'),
        'estimate': ('estimates', 'estimate'),
        'customer': ('customers', 'customer'),
    }

    if entity_type not in entity_map:
        return Response({'error': 'Invalid entity type'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        app_label, model = entity_map[entity_type]
        content_type = ContentType.objects.get(app_label=app_label, model=model)

        attachments = Attachment.objects.filter(
            content_type=content_type,
            object_id=entity_id,
            is_active=True
        )

        total_count = attachments.count()
        total_size = sum(att.file_size for att in attachments if att.file_size is not None)

        # Count by file type
        type_counts = {}
        for att in attachments:
            file_type = att.file_extension or 'unknown'
            type_counts[file_type] = type_counts.get(file_type, 0) + 1

        # Human readable total size
        total_size_human = _format_file_size(total_size)

        return Response({
            'total_count': total_count,
            'total_size': total_size,
            'total_size_human': total_size_human,
            'type_counts': type_counts,
        })

    except ContentType.DoesNotExist:
        return Response({'error': 'Invalid entity type'}, status=status.HTTP_400_BAD_REQUEST)


def _format_file_size(size_bytes):
    """Convert bytes to human readable format."""
    if size_bytes == 0:
        return "0 B"

    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} PB"


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated, IsTenantUser])
def preview_attachment(request, attachment_id):
    """
    Preview attachment endpoint for supported file types.
    URL: /api/attachments/{id}/preview/
    """
    try:
        attachment = Attachment.objects.get(id=attachment_id, is_active=True)
    except Attachment.DoesNotExist:
        raise Http404("Attachment not found")

    # Only preview file attachments, not links
    if attachment.attachment_type != 'file' or not attachment.file:
        return Response(
            {'error': 'Preview not available for this attachment type'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check if file exists
    if not os.path.exists(attachment.file.path):
        return Response(
            {'error': 'File not found on server'},
            status=status.HTTP_404_NOT_FOUND
        )

    file_path = attachment.file.path
    file_ext = attachment.file_extension.lower()
    mime_type = attachment.content_type_header or mimetypes.guess_type(file_path)[0]

    # Handle different file types
    try:
        # Images - serve directly or create thumbnails
        if attachment.is_image:
            # For preview, we might want to create thumbnails for large images
            max_size = request.GET.get('size', 'original')

            if max_size in ['thumb', 'small', 'medium']:
                return _create_image_thumbnail(file_path, max_size, mime_type)
            else:
                # Serve original image
                with open(file_path, 'rb') as f:
                    response = HttpResponse(f.read(), content_type=mime_type)
                    response['Content-Disposition'] = f'inline; filename="{attachment.original_filename}"'
                    return response

        # Text files - return content as JSON for preview
        elif file_ext in ['.txt', '.md', '.csv', '.json', '.xml', '.log']:
            return _preview_text_file(file_path, attachment)

        # PDFs - return metadata for preview (frontend can use PDF.js)
        elif file_ext == '.pdf':
            return _preview_pdf_metadata(file_path, attachment)

        # Office documents - return metadata
        elif file_ext in ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx']:
            return _preview_office_metadata(file_path, attachment)

        # Default: return file metadata for unsupported previews
        else:
            return Response({
                'preview_available': False,
                'filename': attachment.original_filename,
                'size': attachment.file_size_human,
                'type': mime_type,
                'message': 'Preview not available for this file type. Download to view.'
            })

    except Exception as e:
        return Response(
            {'error': f'Error generating preview: {str(e)}'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def _create_image_thumbnail(file_path, size, mime_type):
    """Create and serve image thumbnail."""
    size_map = {
        'thumb': (150, 150),
        'small': (300, 300),
        'medium': (600, 600)
    }

    target_size = size_map.get(size, (300, 300))

    try:
        with Image.open(file_path) as img:
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')

            img.thumbnail(target_size, Image.Resampling.LANCZOS)

            # Save to temporary buffer
            with tempfile.NamedTemporaryFile(suffix='.jpg', delete=False) as temp_file:
                img.save(temp_file, format='JPEG', quality=85, optimize=True)
                temp_file.flush()

                # Serve the thumbnail
                with open(temp_file.name, 'rb') as f:
                    response = HttpResponse(f.read(), content_type='image/jpeg')
                    response['Content-Disposition'] = 'inline'
                    return response

    except Exception:
        # Fallback to original file if thumbnail creation fails
        with open(file_path, 'rb') as f:
            response = HttpResponse(f.read(), content_type=mime_type)
            response['Content-Disposition'] = 'inline'
            return response


def _preview_text_file(file_path, attachment):
    """Preview text-based files."""
    try:
        # Limit preview to first 10KB for safety
        max_size = 10 * 1024  # 10KB

        with open(file_path, encoding='utf-8', errors='ignore') as f:
            content = f.read(max_size)

        is_truncated = len(content) == max_size

        return Response({
            'preview_available': True,
            'preview_type': 'text',
            'content': content,
            'is_truncated': is_truncated,
            'filename': attachment.original_filename,
            'size': attachment.file_size_human,
            'encoding': 'utf-8'
        })

    except UnicodeDecodeError:
        return Response({
            'preview_available': False,
            'filename': attachment.original_filename,
            'size': attachment.file_size_human,
            'message': 'Binary file - preview not available'
        })


def _preview_pdf_metadata(file_path, attachment):
    """Return PDF metadata for frontend preview."""
    try:
        # Basic PDF info - frontend can use PDF.js for actual rendering
        file_size = os.path.getsize(file_path)

        return Response({
            'preview_available': True,
            'preview_type': 'pdf',
            'filename': attachment.original_filename,
            'size': attachment.file_size_human,
            'pages': None,  # Could use PyPDF2 to get page count if needed
            'download_url': f'/api/attachments/{attachment.id}/download/',
            'message': 'PDF preview will be rendered in browser'
        })

    except Exception:
        return Response({
            'preview_available': False,
            'filename': attachment.original_filename,
            'size': attachment.file_size_human,
            'message': 'PDF preview not available'
        })


def _preview_office_metadata(file_path, attachment):
    """Return Office document metadata."""
    return Response({
        'preview_available': False,
        'preview_type': 'office',
        'filename': attachment.original_filename,
        'size': attachment.file_size_human,
        'message': 'Office document preview not available. Download to view.',
        'download_url': f'/api/attachments/{attachment.id}/download/'
    })
