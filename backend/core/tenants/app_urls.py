from django.urls import path

from .views import UserApplicationsView

urlpatterns = [
    path("user-applications/", UserApplicationsView.as_view(), name="user_applications"),
]
