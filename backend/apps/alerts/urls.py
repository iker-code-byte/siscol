from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import NotificationRuleViewSet, AlertEventViewSet, RunAlertEvaluationView

router = DefaultRouter()
router.register(r'notification-rules', NotificationRuleViewSet, basename='notification-rule')
router.register(r'alerts', AlertEventViewSet, basename='alert-event')

urlpatterns = [
    path('alerts/run-evaluation/', RunAlertEvaluationView.as_view(), name='alert-run-evaluation'),
    path('', include(router.urls)),
]
