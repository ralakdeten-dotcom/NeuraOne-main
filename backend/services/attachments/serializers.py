from django.contrib.contenttypes.models import ContentType
from rest_framework import serializers

from .models import Attachment
from .utils import sanitize_filename, validate_file_upload


class AttachmentSerializer(serializers.ModelSerializer):
    """Serializer for Attachment model supporting both files and links."""

    # Read-only fields
    uploaded_by_name = serializers.CharField(source='uploaded_by.get_full_name', read_only=True)
    uploaded_by_email = serializers.CharField(source='uploaded_by.email', read_only=True)
    file_size_human = serializers.CharField(read_only=True)
    file_extension = serializers.CharField(read_only=True)
    is_image = serializers.BooleanField(read_only=True)
    is_document = serializers.BooleanField(read_only=True)
    file_url = serializers.SerializerMethodField()
    download_url = serializers.SerializerMethodField()

    # Entity information (read-only)
    entity_type = serializers.CharField(source='content_type.model', read_only=True)
    entity_id = serializers.IntegerField(source='object_id', read_only=True)

    class Meta:
        model = Attachment
        fields = [
            'id',
            'attachment_type',
            'file',
            'link_url',
            'original_filename',
            'file_size',
            'file_size_human',
            'content_type_header',
            'file_extension',
            'is_image',
            'is_document',
            'description',
            'uploaded_at',
            'updated_at',
            'uploaded_by_name',
            'uploaded_by_email',
            'file_url',
            'download_url',
            'entity_type',
            'entity_id',
            'is_active',
        ]
        read_only_fields = [
            'id',
            'original_filename',
            'file_size',
            'content_type_header',
            'uploaded_at',
            'updated_at',
            'uploaded_by_name',
            'uploaded_by_email',
            'file_size_human',
            'file_extension',
            'is_image',
            'is_document',
            'file_url',
            'download_url',
            'entity_type',
            'entity_id',
        ]

    def get_file_url(self, obj):
        """Get the file URL for direct access or link URL."""
        if obj.attachment_type == 'link' and obj.link_url:
            return obj.link_url
        elif obj.attachment_type == 'file' and obj.file:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def get_download_url(self, obj):
        """Get the secure download URL or external link."""
        if obj.attachment_type == 'link' and obj.link_url:
            return obj.link_url
        else:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(f'/api/attachments/{obj.id}/download/')
            return f'/api/attachments/{obj.id}/download/'

    def validate_file(self, file):
        """Validate uploaded file."""
        file_info = validate_file_upload(file)
        return file

    def create(self, validated_data):
        """Create attachment with proper file handling."""
        file = validated_data['file']

        # Validate and get file metadata
        file_info = validate_file_upload(file)

        # Sanitize filename
        sanitized_filename = sanitize_filename(file_info['original_filename'])

        # Update validated data with file metadata
        validated_data.update({
            'original_filename': sanitized_filename,
            'file_size': file_info['file_size'],
            'content_type_header': file_info['content_type'],
            'uploaded_by': self.context['request'].user,
        })

        return super().create(validated_data)


class AttachmentUploadSerializer(serializers.Serializer):
    """Serializer for file upload and link creation with entity linking."""

    # Attachment type
    attachment_type = serializers.ChoiceField(
        choices=['file', 'link'],
        default='file'
    )

    # File fields (for file attachments)
    file = serializers.FileField(required=False, allow_null=True)

    # Link fields (for link attachments)
    link_url = serializers.URLField(max_length=2000, required=False, allow_null=True, allow_blank=True)
    title = serializers.CharField(max_length=255, required=False, allow_null=True, allow_blank=True)

    # Common fields
    description = serializers.CharField(max_length=1000, required=False, allow_blank=True)
    entity_type = serializers.CharField(max_length=50)
    entity_id = serializers.IntegerField(min_value=1)

    def validate_entity_type(self, value):
        """Validate that entity_type corresponds to a valid CRM model."""
        valid_models = ['account', 'contact', 'lead', 'deal', 'product', 'estimate', 'customer']
        if value.lower() not in valid_models:
            raise serializers.ValidationError(
                f"Invalid entity type. Must be one of: {', '.join(valid_models)}"
            )
        return value.lower()

    def validate_link_url(self, value):
        """Validate link URL format and accessibility."""
        if not value:
            return value

        # Basic URL validation is handled by URLField
        # Additional validation can be added here
        return value

    def validate(self, data):
        """Cross-field validation."""
        attachment_type = data.get('attachment_type', 'file')
        entity_type = data['entity_type']
        entity_id = data['entity_id']

        # Validate attachment type specific requirements
        if attachment_type == 'file':
            if not data.get('file'):
                raise serializers.ValidationError({
                    'file': 'File is required for file attachments.'
                })
            if data.get('link_url'):
                raise serializers.ValidationError({
                    'link_url': 'Link URL should not be provided for file attachments.'
                })
        elif attachment_type == 'link':
            if not data.get('link_url'):
                raise serializers.ValidationError({
                    'link_url': 'Link URL is required for link attachments.'
                })
            if data.get('file'):
                raise serializers.ValidationError({
                    'file': 'File should not be provided for link attachments.'
                })

        # Get the content type for the entity
        try:
            # Map entity types to app labels and models
            entity_map = {
                'account': ('accounts', 'account'),
                'contact': ('contacts', 'contact'),
                'lead': ('leads', 'lead'),
                'deal': ('deals', 'deal'),
                'product': ('products', 'product'),
                'estimate': ('estimates', 'estimate'),
                'customer': ('customers', 'customer'),
            }

            app_label, model_name = entity_map[entity_type]
            content_type = ContentType.objects.get(app_label=app_label, model=model_name)

            # Check if the entity exists
            model_class = content_type.model_class()
            if not model_class.objects.filter(pk=entity_id).exists():
                raise serializers.ValidationError({
                    'entity_id': f"No {entity_type} found with ID {entity_id}"
                })

            data['content_type'] = content_type
            data['object_id'] = entity_id

        except ContentType.DoesNotExist:
            raise serializers.ValidationError({
                'entity_type': f"Invalid entity type: {entity_type}"
            })

        return data

    def create(self, validated_data):
        """Create attachment from upload data - handles both files and links."""
        from urllib.parse import urlparse

        from .models import Attachment
        from .utils import sanitize_filename, validate_file_upload

        # Extract common data
        attachment_type = validated_data.pop('attachment_type', 'file')
        content_type = validated_data.pop('content_type')
        object_id = validated_data.pop('object_id')
        validated_data.pop('entity_type')  # Remove as it's not a model field
        validated_data.pop('entity_id')    # Remove as it's not a model field

        # Base attachment data
        attachment_data = {
            'attachment_type': attachment_type,
            'description': validated_data.get('description', ''),
            'content_type': content_type,
            'object_id': object_id,
            'uploaded_by': self.context['request'].user,
        }

        if attachment_type == 'file':
            # Handle file attachment
            file = validated_data['file']
            file_info = validate_file_upload(file)
            sanitized_filename = sanitize_filename(file_info['original_filename'])

            attachment_data.update({
                'file': file,
                'original_filename': sanitized_filename,
                'file_size': file_info['file_size'],
                'content_type_header': file_info['content_type'],
                'link_url': None,  # Explicitly set to None for files
            })

        elif attachment_type == 'link':
            # Handle link attachment
            link_url = validated_data['link_url']
            title = validated_data.get('title', '')

            # Use provided title or extract from URL
            if not title:
                try:
                    parsed_url = urlparse(link_url)
                    title = parsed_url.netloc or link_url
                except:
                    title = link_url

            attachment_data.update({
                'file': None,  # Explicitly set to None for links
                'link_url': link_url,
                'original_filename': title,
                'file_size': None,  # No file size for links
                'content_type_header': None,  # No content type for links
            })

        # Create the attachment
        attachment = Attachment.objects.create(**attachment_data)
        return attachment


class AttachmentUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating attachment metadata and link URLs."""

    link_url = serializers.URLField(max_length=2000, required=False, allow_null=True, allow_blank=True)

    class Meta:
        model = Attachment
        fields = ['description', 'link_url', 'is_active']

    def validate_link_url(self, value):
        """Validate link URL format and accessibility."""
        if not value:
            return value

        # Basic URL validation is handled by URLField
        # Additional validation can be added here
        return value

    def validate(self, data):
        """Ensure user has permission to update this attachment and validate link_url updates."""
        # Get the attachment instance
        attachment = self.instance

        # If link_url is being updated, ensure this is a link attachment
        if 'link_url' in data and attachment.attachment_type != 'link':
            raise serializers.ValidationError({
                'link_url': 'Cannot update link URL for file attachments.'
            })

        # If this is a link attachment and link_url is being set to None/empty, that's invalid
        if (attachment.attachment_type == 'link' and 'link_url' in data and
            (not data['link_url'] or data['link_url'].strip() == '')):
            raise serializers.ValidationError({
                'link_url': 'Link URL cannot be empty for link attachments.'
            })

        return data
