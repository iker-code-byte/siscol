from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.decorators import action
from django.utils import timezone
from apps.accounts.permissions import IsAdminRole
from apps.academics.models import Guardian, StudentGuardian
from .models import GuardianActivationCode, GuardianDevice, PushSubscription
from .serializers import (
    GuardianActivationCodeSerializer, GuardianDeviceSerializer,
    GuardianActivationVerifyRequestSerializer, PushSubscriptionRequestSerializer
)
from .services import GuardianActivationService

class GuardianActivationVerifyView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = GuardianActivationVerifyRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ip_address = request.META.get('REMOTE_ADDR')
        device, guardian = GuardianActivationService.verify_and_link(
            plain_code=data['code'],
            device_name=data.get('device_name'),
            platform=data.get('platform', 'WEB'),
            ip_address=ip_address
        )

        # Get linked students summary
        links = StudentGuardian.objects.filter(guardian=guardian, can_receive_notifications=True).select_related('student')
        students_summary = [
            {
                "id": str(link.student.id),
                "full_name": f"{link.student.first_name} {link.student.last_name}",
                "relationship": link.get_relationship_display()
            }
            for link in links
        ]

        return Response({
            "message": "Dispositivo vinculado exitosamente.",
            "device_token": device.device_token,
            "guardian": {
                "id": str(guardian.id),
                "display_name": guardian.full_name,
                "phone": guardian.phone
            },
            "device": {
                "id": str(device.id),
                "name": device.name,
                "platform": device.platform
            },
            "students": students_summary,
            "push_enabled": False
        }, status=status.HTTP_200_OK)

class GuardianMeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        device = getattr(request, 'guardian_device', None)
        guardian = getattr(request, 'guardian', None)

        if not device or not guardian:
            return Response({"error": {"code": "UNAUTHORIZED", "message": "Acceso restringido a dispositivos de tutores autorizados."}}, status=status.HTTP_403_FORBIDDEN)

        links = StudentGuardian.objects.filter(guardian=guardian).select_related('student')
        students = [
            {
                "id": str(link.student.id),
                "first_name": link.student.first_name,
                "last_name": link.student.last_name,
                "full_name": f"{link.student.first_name} {link.student.last_name}",
                "code": link.student.code,
                "relationship": link.get_relationship_display(),
                "can_receive_notifications": link.can_receive_notifications
            }
            for link in links
        ]

        has_push = PushSubscription.objects.filter(guardian_device=device, is_active=True).exists()

        return Response({
            "guardian": {
                "id": str(guardian.id),
                "full_name": guardian.full_name,
                "phone": guardian.phone,
                "email": guardian.email,
                "notifications_enabled": guardian.notifications_enabled
            },
            "device": {
                "id": str(device.id),
                "name": device.name,
                "platform": device.platform,
                "linked_at": device.linked_at,
                "last_seen_at": device.last_seen_at
            },
            "push_enabled": has_push,
            "students": students
        })

class GuardianPushSubscriptionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device = getattr(request, 'guardian_device', None)
        if not device:
            return Response({"error": {"code": "UNAUTHORIZED", "message": "Dispositivo no autorizado."}}, status=status.HTTP_403_FORBIDDEN)

        serializer = PushSubscriptionRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ip_address = request.META.get('REMOTE_ADDR')
        sub = GuardianActivationService.register_push_subscription(
            device=device,
            token=data['token'],
            provider=data.get('provider', 'FCM'),
            ip_address=ip_address
        )

        return Response({
            "message": "Suscripción Push registrada exitosamente.",
            "push_enabled": True,
            "provider": sub.provider
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        device = getattr(request, 'guardian_device', None)
        if not device:
            return Response({"error": {"code": "UNAUTHORIZED", "message": "Dispositivo no autorizado."}}, status=status.HTTP_403_FORBIDDEN)

        PushSubscription.objects.filter(guardian_device=device).update(is_active=False)
        return Response({"message": "Suscripción Push desactivada.", "push_enabled": False}, status=status.HTTP_200_OK)

class GuardianUnlinkView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        device = getattr(request, 'guardian_device', None)
        if not device:
            return Response({"error": {"code": "UNAUTHORIZED", "message": "Dispositivo no autorizado."}}, status=status.HTTP_403_FORBIDDEN)

        ip_address = request.META.get('REMOTE_ADDR')
        GuardianActivationService.unlink_device(device=device, ip_address=ip_address)
        return Response({"message": "Dispositivo desvinculado correctamente."}, status=status.HTTP_200_OK)

class AdminGuardianCodeViewSet(viewsets.ModelViewSet):
    queryset = GuardianActivationCode.objects.all().select_related('guardian', 'created_by').order_by('-created_at')
    serializer_class = GuardianActivationCodeSerializer
    permission_classes = [IsAdminRole]

    @action(detail=False, methods=['post'], url_path='generate')
    def generate_code(self, request):
        guardian_id = request.data.get('guardian_id')
        if not guardian_id:
            return Response({"error": {"code": "VALIDATION_ERROR", "message": "El campo guardian_id es requerido."}}, status=status.HTTP_400_BAD_REQUEST)

        try:
            guardian = Guardian.objects.get(id=guardian_id)
        except Guardian.DoesNotExist:
            return Response({"error": {"code": "NOT_FOUND", "message": "El tutor especificado no existe."}}, status=status.HTTP_404_NOT_FOUND)

        code_obj, plain_code = GuardianActivationService.generate_code(
            guardian=guardian,
            created_by=request.user,
            ttl_hours=24
        )

        return Response({
            "message": "Código de activación generado exitosamente.",
            "code_id": str(code_obj.id),
            "plain_code": plain_code,
            "guardian": {
                "id": str(guardian.id),
                "full_name": guardian.full_name
            },
            "expires_at": code_obj.expires_at
        }, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'], url_path='revoke')
    def revoke_code(self, request, pk=None):
        code_obj = self.get_object()
        code_obj.revoked_at = timezone.now()
        code_obj.save(update_fields=['revoked_at'])
        return Response({"message": "Código de activación revocado correctamente."})
