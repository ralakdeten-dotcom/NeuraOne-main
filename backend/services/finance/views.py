from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from core.auth.authentication import JWTAuthentication


class SalesStatusView(APIView):
    """Simple status view for Sales app"""

    authentication_classes = [JWTAuthentication]

    def get(self, request):
        return Response(
            {
                "status": "coming_soon",
                "message": "Sales - Advanced Pipeline Management",
                "description": "Comprehensive sales performance and pipeline tracking",
                "features": [
                    "Advanced sales pipeline visualization",
                    "Sales performance analytics and reporting",
                    "Territory and quota management",
                    "Sales forecasting and predictions",
                ],
            },
            status=status.HTTP_200_OK,
        )
