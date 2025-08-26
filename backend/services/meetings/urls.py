from django.urls import path

from . import views

app_name = 'meetings'

urlpatterns = [
    # Main meeting endpoints
    path('', views.MeetingListCreateView.as_view(), name='meeting-list-create'),
    path('<int:pk>/', views.MeetingDetailView.as_view(), name='meeting-detail'),
    
    # User-specific endpoints
    path('my/', views.MyMeetingsView.as_view(), name='my-meetings'),
    
    # Entity-specific meetings
    path('<str:entity_type>/<int:entity_id>/', views.EntityMeetingsView.as_view(), name='entity-meetings'),
    
    # Contact-specific meetings
    path('contact/<int:contact_id>/', views.ContactMeetingsView.as_view(), name='contact-meetings'),
    
    # Meeting comments
    path('<int:meeting_id>/comments/', views.MeetingCommentListCreateView.as_view(), name='meeting-comments'),
    path('comments/<int:pk>/', views.MeetingCommentDetailView.as_view(), name='meeting-comment-detail'),
    
    # Statistics and utility endpoints
    path('stats/', views.meeting_stats, name='meeting-stats'),
    path('<int:pk>/status/', views.update_meeting_status, name='update-meeting-status'),
    path('<int:pk>/followup/complete/', views.mark_followup_completed, name='complete-followup'),
    path('followups/', views.upcoming_followups, name='upcoming-followups'),
]