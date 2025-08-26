from django.urls import path

from . import views

app_name = 'attachments'

urlpatterns = [
    # Entity-specific attachment endpoints
    path(
        '<str:entity_type>/<int:entity_id>/',
        views.AttachmentListCreateView.as_view(),
        name='attachment-list-create'
    ),
    path(
        '<str:entity_type>/<int:entity_id>/stats/',
        views.attachment_stats,
        name='attachment-stats'
    ),

    # Individual attachment endpoints
    path(
        '<int:pk>/',
        views.AttachmentDetailView.as_view(),
        name='attachment-detail'
    ),
    path(
        '<int:attachment_id>/download/',
        views.download_attachment,
        name='attachment-download'
    ),
    path(
        '<int:attachment_id>/preview/',
        views.preview_attachment,
        name='attachment-preview'
    ),
]
