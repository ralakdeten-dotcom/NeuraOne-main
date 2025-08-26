from django.urls import path

from . import views

app_name = 'tasks'

urlpatterns = [
    # Main task endpoints
    path('', views.TaskListCreateView.as_view(), name='task-list-create'),
    path('<int:pk>/', views.TaskDetailView.as_view(), name='task-detail'),

    # User-specific endpoints
    path('my-tasks/', views.MyTasksView.as_view(), name='my-tasks'),

    # Entity-specific tasks
    path('<str:entity_type>/<int:entity_id>/', views.EntityTasksView.as_view(), name='entity-tasks'),

    # Task actions
    path('<int:pk>/complete/', views.complete_task, name='complete-task'),

    # Task comments
    path('<int:task_id>/comments/', views.TaskCommentListCreateView.as_view(), name='task-comments'),
    path('comments/<int:pk>/', views.TaskCommentDetailView.as_view(), name='task-comment-detail'),

    # Statistics
    path('stats/', views.task_stats, name='task-stats'),
]
