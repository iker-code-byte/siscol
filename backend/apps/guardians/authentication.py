from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed
from django.utils import timezone
from .models import GuardianDevice

class GuardianAnonymousUser:
    """Represents an authenticated guardian device acting on behalf of a Guardian."""
    def __init__(self, guardian, device):
        self.guardian = guardian
        self.device = device
        self.is_authenticated = True
        self.is_anonymous = False
        self.role = 'GUARDIAN'
        self.username = f"guardian_{guardian.id}"
        self.is_staff = False
        self.is_superuser = False

    def __str__(self):
        return f"GuardianUser({self.guardian.full_name}, device={self.device.id})"

class GuardianDeviceAuthentication(BaseAuthentication):
    def authenticate(self, request):
        auth_header = request.META.get('HTTP_AUTHORIZATION')
        if not auth_header:
            return None

        parts = auth_header.split()
        if len(parts) != 2:
            return None

        prefix, token = parts[0], parts[1]
        
        if prefix.lower() not in ['devicetoken', 'device']:
            # Also allow Bearer if token starts with 'dev_'
            if prefix.lower() == 'bearer' and token.startswith('dev_'):
                pass
            else:
                return None

        try:
            device = GuardianDevice.objects.select_related('guardian').get(
                device_token=token,
                is_active=True,
                guardian__active=True
            )
        except GuardianDevice.DoesNotExist:
            raise AuthenticationFailed("Dispositivo no autorizado o desvinculado.")

        # Update last_seen_at
        device.last_seen_at = timezone.now()
        device.save(update_fields=['last_seen_at'])

        guardian_user = GuardianAnonymousUser(guardian=device.guardian, device=device)
        request.guardian_device = device
        request.guardian = device.guardian

        return (guardian_user, device)
