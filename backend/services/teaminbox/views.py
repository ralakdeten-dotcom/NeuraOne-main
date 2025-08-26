from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.auth.authentication import JWTAuthentication


class TeamInboxStatusView(APIView):
    """Simple status view for TeamInbox app"""

    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return Response(
            {
                "status": "coming_soon",
                "message": "TeamInbox - Unified Customer Communications",
                "description": "Manage all your customer conversations in one place",
                "features": [
                    "Unified inbox for emails, chats, and social messages",
                    "Team collaboration and assignment",
                    "Response templates and automation",
                    "Customer context from CRM",
                ],
            },
            status=status.HTTP_200_OK,
        )
