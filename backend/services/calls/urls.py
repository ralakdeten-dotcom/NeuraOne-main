from django.urls import path

from . import views

app_name = 'calls'

urlpatterns = [
    # Main call endpoints
    path('', views.CallListCreateView.as_view(), name='call-list-create'),
    path('<int:pk>/', views.CallDetailView.as_view(), name='call-detail'),

    # User-specific endpoints
    path('my/', views.MyCallsView.as_view(), name='my-calls'),

    # Entity-specific calls
    path('<str:entity_type>/<int:entity_id>/', views.EntityCallsView.as_view(), name='entity-calls'),

    # Contact-specific calls
    path('contact/<int:contact_id>/', views.ContactCallsView.as_view(), name='contact-calls'),

    # Call comments
    path('<int:call_id>/comments/', views.CallCommentListCreateView.as_view(), name='call-comments'),
    path('comments/<int:pk>/', views.CallCommentDetailView.as_view(), name='call-comment-detail'),

    # Statistics and utility endpoints
    path('stats/', views.call_stats, name='call-stats'),
    path('<int:pk>/status/', views.update_call_status, name='update-call-status'),
    path('<int:pk>/followup/complete/', views.mark_followup_completed, name='complete-followup'),
    path('followups/', views.upcoming_followups, name='upcoming-followups'),
]
