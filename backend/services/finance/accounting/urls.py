from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ChartOfAccountViewSet, AccountTransactionViewSet

router = DefaultRouter()
router.register(r'chartofaccounts', ChartOfAccountViewSet, basename='chartofaccount')
router.register(r'transactions', AccountTransactionViewSet, basename='accounttransaction')

app_name = 'accounting'

urlpatterns = [
    path('', include(router.urls)),
    
    # Additional custom URLs matching Zoho API structure
    path('chartofaccounts/<int:pk>/active/', 
         ChartOfAccountViewSet.as_view({'post': 'activate'}), 
         name='account-activate'),
    path('chartofaccounts/<int:pk>/inactive/', 
         ChartOfAccountViewSet.as_view({'post': 'deactivate'}), 
         name='account-deactivate'),
    path('chartofaccounts/transactions/', 
         AccountTransactionViewSet.as_view({'get': 'list'}), 
         name='account-transactions-list'),
]