from django.urls import path

from . import views

urlpatterns = [
    # Main email endpoints
    path('', views.EmailListCreateView.as_view(), name='email-list-create'),
    path('<int:pk>/', views.EmailDetailView.as_view(), name='email-detail'),
    
    # User-specific endpoints
    path('me/', views.MyEmailsView.as_view(), name='my-emails'),
    
    # Entity-linked email endpoints
    path('<str:entity_type>/<int:entity_id>/', views.EntityEmailsView.as_view(), name='entity-emails'),
    
    # Contact-specific endpoints
    path('contact/<int:contact_id>/', views.ContactEmailsView.as_view(), name='contact-emails'),
    
    # Email comments
    path('<int:email_id>/comments/', views.EmailCommentListCreateView.as_view(), name='email-comment-list'),
    path('comments/<int:pk>/', views.EmailCommentDetailView.as_view(), name='email-comment-detail'),
    
    # Statistics and utility endpoints
    path('stats/', views.email_stats, name='email-stats'),
    path('<int:pk>/update-status/', views.update_email_status, name='update-email-status'),
    path('<int:pk>/mark-followup-completed/', views.mark_followup_completed, name='mark-email-followup-completed'),
    path('upcoming-followups/', views.upcoming_followups, name='upcoming-email-followups'),
]