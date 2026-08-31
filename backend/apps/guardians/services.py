import hashlib
import secrets
import string
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from rest_framework.exceptions import ValidationError, PermissionDenied
from apps.audit.services import AuditService
from .models import GuardianActivationCode, GuardianDevice, PushSubscription, PlatformChoices
from apps.academics.models import Guardian

def hash_code(code_str: str) -> str:
    cleaned = code_str.strip().upper().replace('-', '').replace(' ', '')
    return hashlib.sha256(cleaned.encode('utf-8')).hexdigest()

def hash_token(token_str: str) -> str:
    return hashlib.sha256(token_str.strip().encode('utf-8')).hexdigest()

class GuardianActivationService:
    @staticmethod
    def generate_code(*, guardian: Guardian, created_by=None, ttl_hours: int = 24) -> tuple[GuardianActivationCode, str]:
        # Generate CSPRNG human-friendly code format: GRM-XXXXXX (6 digits)
        digits = ''.join(secrets.choice(string.digits) for _ in range(6))
        plain_code = f"GRM-{digits}"
        code_hashed = hash_code(plain_code)
        
        expires_at = timezone.now() + timedelta(hours=ttl_hours)
        
        # Deactivate any previous active codes for this guardian
        GuardianActivationCode.objects.filter(
            guardian=guardian, 
            used_at__isnull=True, 
            revoked_at__isnull=True
        ).update(revoked_at=timezone.now())

        code_obj = GuardianActivationCode.objects.create(
            guardian=guardian,
            code_hash=code_hashed,
            expires_at=expires_at,
            created_by=created_by,
            max_attempts=5
        )

        AuditService.log(
            action='GUARDIAN_ACTIVATION_CODE_GENERATED',
            entity='Guardian',
            entity_id=str(guardian.id),
            actor_user=created_by,
            metadata={
                'guardian_name': guardian.full_name,
                'expires_at': str(expires_at),
                'code_id': str(code_obj.id)
            }
        )

        return code_obj, plain_code

    @staticmethod
    def verify_and_link(*, plain_code: str, device_name: str = None, platform: str = 'WEB', ip_address: str = None) -> tuple[GuardianDevice, Guardian]:
        if not plain_code or not plain_code.strip():
            raise ValidationError({"code": ["El código de activación es obligatorio."]})

        cleaned_hash = hash_code(plain_code)
        now = timezone.now()

        # Find active code
        try:
            code_record = GuardianActivationCode.objects.select_related('guardian').get(
                code_hash=cleaned_hash
            )
        except GuardianActivationCode.DoesNotExist:
            raise ValidationError({"code": ["El código de activación ingresado es inválido o no existe."]})

        if code_record.used_at is not None:
            raise ValidationError({"code": ["Este código de activación ya fue utilizado previamente."]})

        if code_record.revoked_at is not None:
            raise ValidationError({"code": ["Este código de activación ha sido revocado."]})

        if code_record.expires_at <= now:
            raise ValidationError({"code": ["El código de activación ha expirado. Solicite un nuevo código a la administración."]})

        if code_record.attempt_count >= code_record.max_attempts:
            raise ValidationError({"code": ["Se excedió el número máximo de intentos para este código."]})

        guardian = code_record.guardian
        if not guardian.active:
            raise ValidationError({"code": ["El registro de este tutor se encuentra inactivo."]})

        with transaction.atomic():
            code_record.used_at = now
            code_record.save(update_fields=['used_at'])

            # Generate secure device authentication token
            device_token = f"dev_{secrets.token_urlsafe(48)}"

            valid_platform = platform if platform in dict(PlatformChoices.choices).keys() else PlatformChoices.WEB

            device = GuardianDevice.objects.create(
                guardian=guardian,
                name=device_name or f"Dispositivo {guardian.devices.count() + 1}",
                device_token=device_token,
                platform=valid_platform,
                is_active=True
            )

            AuditService.log(
                action='GUARDIAN_DEVICE_LINKED',
                entity='GuardianDevice',
                entity_id=str(device.id),
                actor_guardian_device_id=device.id,
                metadata={
                    'guardian_id': str(guardian.id),
                    'guardian_name': guardian.full_name,
                    'device_name': device.name,
                    'platform': device.platform
                },
                ip_address=ip_address
            )

        return device, guardian

    @staticmethod
    def register_push_subscription(*, device: GuardianDevice, token: str, provider: str = 'FCM', ip_address: str = None) -> PushSubscription:
        if not token or not token.strip():
            raise ValidationError({"token": ["El token Push de FCM es obligatorio."]})

        thash = hash_token(token)

        # Deactivate subscription if already exists on other devices
        PushSubscription.objects.filter(token_hash=thash).exclude(guardian_device=device).update(is_active=False)

        subscription, created = PushSubscription.objects.update_or_create(
            guardian_device=device,
            token_hash=thash,
            defaults={
                'provider': provider,
                'token_encrypted_or_protected': token.strip(),
                'is_active': True,
                'last_error_at': None,
                'last_error_code': None,
            }
        )

        AuditService.log(
            action='PUSH_SUBSCRIPTION_REGISTERED',
            entity='PushSubscription',
            entity_id=str(subscription.id),
            actor_guardian_device_id=device.id,
            metadata={
                'device_id': str(device.id),
                'guardian_name': device.guardian.full_name,
                'provider': provider
            },
            ip_address=ip_address
        )

        return subscription

    @staticmethod
    def unlink_device(*, device: GuardianDevice, ip_address: str = None):
        device.is_active = False
        device.unlinked_at = timezone.now()
        device.save(update_fields=['is_active', 'unlinked_at'])

        device.push_subscriptions.update(is_active=False)

        AuditService.log(
            action='GUARDIAN_DEVICE_UNLINKED',
            entity='GuardianDevice',
            entity_id=str(device.id),
            actor_guardian_device_id=device.id,
            metadata={
                'guardian_id': str(device.guardian_id),
                'device_name': device.name
            },
            ip_address=ip_address
        )
