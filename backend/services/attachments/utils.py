import mimetypes
import os

from django.conf import settings
from django.core.exceptions import ValidationError

# File validation settings
MAX_UPLOAD_SIZE = getattr(settings, 'MAX_UPLOAD_SIZE', 10 * 1024 * 1024)  # 10MB default
ALLOWED_FILE_TYPES = getattr(settings, 'ALLOWED_FILE_TYPES', [
    'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt',  # Documents
    'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',  # Images
    'zip', 'rar', '7z',  # Archives
    'xlsx', 'xls', 'csv',  # Spreadsheets
    'ppt', 'pptx',  # Presentations
])

DANGEROUS_FILE_TYPES = [
    'exe', 'bat', 'cmd', 'com', 'scr', 'pif', 'vbs', 'js', 'jar',
    'app', 'deb', 'pkg', 'dmg', 'sh', 'ps1', 'php', 'asp', 'jsp'
]


def validate_file_upload(uploaded_file):
    """
    Validate uploaded file for security and policy compliance.
    
    Args:
        uploaded_file: Django UploadedFile instance
        
    Returns:
        dict: File metadata including size, content_type, etc.
        
    Raises:
        ValidationError: If file fails validation
    """
    # Check file size
    if uploaded_file.size > MAX_UPLOAD_SIZE:
        raise ValidationError(
            f"File size ({uploaded_file.size} bytes) exceeds maximum allowed size "
            f"({MAX_UPLOAD_SIZE} bytes / {MAX_UPLOAD_SIZE // (1024*1024)}MB)"
        )

    # Get file extension
    filename = uploaded_file.name
    file_extension = os.path.splitext(filename)[1].lower().lstrip('.')

    # Check for dangerous file types
    if file_extension in DANGEROUS_FILE_TYPES:
        raise ValidationError(f"File type '.{file_extension}' is not allowed for security reasons")

    # Check allowed file types
    if file_extension not in ALLOWED_FILE_TYPES:
        raise ValidationError(
            f"File type '.{file_extension}' is not allowed. "
            f"Allowed types: {', '.join(ALLOWED_FILE_TYPES)}"
        )

    # Validate filename
    if not filename or len(filename) > 255:
        raise ValidationError("Invalid filename or filename too long (max 255 characters)")

    # Get MIME type
    content_type = uploaded_file.content_type
    if not content_type:
        content_type, _ = mimetypes.guess_type(filename)
        if not content_type:
            content_type = 'application/octet-stream'

    # Basic content validation - check if file extension matches MIME type
    expected_mime_types = {
        'pdf': ['application/pdf'],
        'doc': ['application/msword'],
        'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
        'jpg': ['image/jpeg'],
        'jpeg': ['image/jpeg'],
        'png': ['image/png'],
        'gif': ['image/gif'],
        'txt': ['text/plain'],
        'zip': ['application/zip'],
        'xlsx': ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
        'csv': ['text/csv', 'application/csv'],
    }

    if file_extension in expected_mime_types:
        expected_types = expected_mime_types[file_extension]
        if content_type not in expected_types:
            # Allow some flexibility for browser inconsistencies
            if not any(mime_part in content_type for expected in expected_types for mime_part in expected.split('/')):
                raise ValidationError(
                    f"File content type '{content_type}' doesn't match extension '.{file_extension}'"
                )

    return {
        'original_filename': filename,
        'file_size': uploaded_file.size,
        'content_type': content_type,
        'file_extension': file_extension,
    }


def sanitize_filename(filename):
    """
    Sanitize filename for safe storage.
    
    Args:
        filename (str): Original filename
        
    Returns:
        str: Sanitized filename
    """
    # Remove path components
    filename = os.path.basename(filename)

    # Replace problematic characters
    unsafe_chars = '<>:"/\\|?*'
    for char in unsafe_chars:
        filename = filename.replace(char, '_')

    # Remove control characters
    filename = ''.join(char for char in filename if ord(char) >= 32)

    # Ensure filename is not empty and not too long
    if not filename:
        filename = 'unnamed_file'

    if len(filename) > 200:  # Leave room for UUID prefix
        name, ext = os.path.splitext(filename)
        filename = name[:200-len(ext)] + ext

    return filename


def get_file_icon(file_extension):
    """
    Get appropriate icon class for file type.
    
    Args:
        file_extension (str): File extension without dot
        
    Returns:
        str: CSS icon class name
    """
    icon_map = {
        # Documents
        'pdf': 'fas fa-file-pdf text-red-500',
        'doc': 'fas fa-file-word text-blue-500',
        'docx': 'fas fa-file-word text-blue-500',
        'txt': 'fas fa-file-alt text-gray-500',
        'rtf': 'fas fa-file-alt text-gray-500',
        'odt': 'fas fa-file-alt text-blue-500',

        # Images
        'jpg': 'fas fa-file-image text-green-500',
        'jpeg': 'fas fa-file-image text-green-500',
        'png': 'fas fa-file-image text-green-500',
        'gif': 'fas fa-file-image text-green-500',
        'bmp': 'fas fa-file-image text-green-500',
        'webp': 'fas fa-file-image text-green-500',

        # Archives
        'zip': 'fas fa-file-archive text-yellow-500',
        'rar': 'fas fa-file-archive text-yellow-500',
        '7z': 'fas fa-file-archive text-yellow-500',

        # Spreadsheets
        'xlsx': 'fas fa-file-excel text-green-600',
        'xls': 'fas fa-file-excel text-green-600',
        'csv': 'fas fa-file-csv text-green-600',

        # Presentations
        'ppt': 'fas fa-file-powerpoint text-orange-500',
        'pptx': 'fas fa-file-powerpoint text-orange-500',
    }

    return icon_map.get(file_extension.lower(), 'fas fa-file text-gray-500')
