from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GuardianNotificationViewSet, AdminNotificationViewSet, 
    AdminNotificationDeliveryViewSet, AdminNotificationRetryView
)

router = DefaultRouter()
router.register(r'guardian/notifications', GuardianNotificationViewSet, basename='guardian-notification')
router.register(r'notifications', AdminNotificationViewSet, basename='admin-notification')
router.register(r'notification-deliveries', AdminNotificationDeliveryViewSet, basename='admin-notification-delivery')

urlpatterns = [
    path('notifications/<uuid:pk>/retry/', AdminNotificationRetryView.as_view(), name='admin-notification-retry'),
    path('', include(router.urls)),
]
