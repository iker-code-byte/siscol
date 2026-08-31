from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from django.utils import timezone
from apps.accounts.permissions import IsAdminRole
from .models import Notification, NotificationDelivery
from .serializers import (
    NotificationSerializer, NotificationDeliverySerializer,
    GuardianInboxItemSerializer, GuardianNotificationDetailSerializer
)
from .services import NotificationDispatchService

class GuardianNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    """Bandeja de notificaciones y detalle exclusivo para el tutor del dispositivo autenticado."""
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return GuardianNotificationDetailSerializer
        return GuardianInboxItemSerializer

    def get_queryset(self):
        guardian = getattr(self.request, 'guardian', None)
        if not guardian:
            return Notification.objects.none()

        return Notification.objects.filter(guardian=guardian).select_related('student').order_by('-created_at')

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        # Mark as read if not already read
        if not instance.read_at:
            instance.read_at = timezone.now()
            instance.save(update_fields=['read_at'])

        serializer = self.get_serializer(instance)
        return Response(serializer.data)

class AdminNotificationViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Notification.objects.all().select_related('guardian', 'student', 'alert_event').prefetch_related('deliveries__push_subscription__guardian_device').order_by('-created_at')
    serializer_class = NotificationSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = super().get_queryset()
        guardian_id = self.request.query_params.get('guardian_id')
        student_id = self.request.query_params.get('student_id')
        category = self.request.query_params.get('category')
        if guardian_id:
            qs = qs.filter(guardian_id=guardian_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        if category:
            qs = qs.filter(category=category)
        return qs

class AdminNotificationDeliveryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = NotificationDelivery.objects.all().select_related('notification__guardian', 'push_subscription__guardian_device').order_by('-last_attempt_at')
    serializer_class = NotificationDeliverySerializer
    permission_classes = [IsAdminRole]

class AdminNotificationRetryView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, pk=None):
        try:
            notification = Notification.objects.get(pk=pk)
        except Notification.DoesNotExist:
            raise NotFound("La notificación solicitada no existe.")

        deliveries = NotificationDispatchService.dispatch_notification(notification)
        return Response({
            "message": f"Reintento ejecutado. Entregas procesadas: {len(deliveries)}",
            "deliveries": NotificationDeliverySerializer(deliveries, many=True).data
        }, status=status.HTTP_200_OK)
