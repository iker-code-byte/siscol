from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GuardianActivationVerifyView, GuardianMeView, 
    GuardianPushSubscriptionView, GuardianUnlinkView, 
    AdminGuardianCodeViewSet
)

router = DefaultRouter()
router.register(r'admin/guardian-codes', AdminGuardianCodeViewSet, basename='admin-guardian-code')

urlpatterns = [
    path('guardian/activation/verify/', GuardianActivationVerifyView.as_view(), name='guardian-activation-verify'),
    path('guardian/me/', GuardianMeView.as_view(), name='guardian-me'),
    path('guardian/devices/push-subscription/', GuardianPushSubscriptionView.as_view(), name='guardian-push-subscription'),
    path('guardian/device/unlink/', GuardianUnlinkView.as_view(), name='guardian-device-unlink'),
    path('', include(router.urls)),
]
