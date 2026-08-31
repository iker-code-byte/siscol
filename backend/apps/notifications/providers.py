import os
import logging
from dataclasses import dataclass
from typing import Optional
from django.conf import settings

logger = logging.getLogger(__name__)

@dataclass
class DeliveryResult:
    success: bool
    status: str # SENT, FAILED, INVALID_TOKEN
    provider_message_id: Optional[str] = None
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    invalid_token: bool = False

class NotificationProviderProtocol:
    def send(self, *, subscription, notification) -> DeliveryResult:
        raise NotImplementedError

class MockNotificationProvider(NotificationProviderProtocol):
    def send(self, *, subscription, notification) -> DeliveryResult:
        import uuid
        msg_id = f"mock-msg-{uuid.uuid4().hex[:12]}"
        logger.info(
            f"[MOCK PUSH] Sent to Guardian '{subscription.guardian_device.guardian.full_name}' "
            f"Device '{subscription.guardian_device.name}': Title='{notification.safe_title}', Body='{notification.safe_body}'"
        )
        return DeliveryResult(
            success=True,
            status='SENT',
            provider_message_id=msg_id
        )

class FirebasePushProvider(NotificationProviderProtocol):
    _initialized = False

    @classmethod
    def _init_firebase(cls):
        if cls._initialized:
            return
        try:
            import firebase_admin
            from firebase_admin import credentials

            cred_path = getattr(settings, 'GOOGLE_APPLICATION_CREDENTIALS', None)
            if cred_path and os.path.exists(cred_path):
                cred = credentials.Certificate(cred_path)
                firebase_admin.initialize_app(cred)
            else:
                # Default application credentials or initialize without explicit creds
                try:
                    firebase_admin.get_app()
                except ValueError:
                    firebase_admin.initialize_app()
            cls._initialized = True
        except Exception as e:
            logger.warning(f"No se pudo inicializar Firebase Admin SDK: {e}. Se usará fallback mock.")
            cls._initialized = False

    def send(self, *, subscription, notification) -> DeliveryResult:
        self._init_firebase()
        if not self._initialized:
            # Fallback to Mock provider if Firebase credentials not present in dev
            mock = MockNotificationProvider()
            return mock.send(subscription=subscription, notification=notification)

        try:
            from firebase_admin import messaging

            token = subscription.token_encrypted_or_protected
            if not token:
                return DeliveryResult(
                    success=False,
                    status='INVALID_TOKEN',
                    error_code='EMPTY_TOKEN',
                    error_message='Token no encontrado.',
                    invalid_token=True
                )

            # Build safe message with generic title/body and multi-platform native + webpush config
            message = messaging.Message(
                notification=messaging.Notification(
                    title=notification.safe_title,
                    body=notification.safe_body,
                ),
                data={
                    "notification_id": str(notification.id),
                    "url": f"/guardian/notifications/{notification.id}",
                    "category": notification.category,
                    "click_action": "FLUTTER_NOTIFICATION_CLICK",
                },
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        title=notification.safe_title,
                        body=notification.safe_body,
                        channel_id='colegio_grm_alerts',
                        sound='default',
                        click_action='FLUTTER_NOTIFICATION_CLICK',
                        default_vibrate_timings=True,
                        priority='high',
                    ),
                    ttl=86400,
                ),
                apns=messaging.APNSConfig(
                    headers={'apns-priority': '10'},
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            alert=messaging.ApsAlert(
                                title=notification.safe_title,
                                body=notification.safe_body,
                            ),
                            sound='default',
                            badge=1,
                        )
                    )
                ),
                token=token,
                webpush=messaging.WebpushConfig(
                    notification=messaging.WebpushNotification(
                        title=notification.safe_title,
                        body=notification.safe_body,
                        icon="/icon-192x192.png",
                        badge="/badge-72x72.png",
                    ),
                    fcm_options=messaging.WebpushFCMOptions(
                        link=f"/guardian/notifications/{notification.id}"
                    )
                )
            )

            response = messaging.send(message)
            return DeliveryResult(
                success=True,
                status='SENT',
                provider_message_id=str(response)
            )

        except Exception as exc:
            err_str = str(exc)
            err_code = "FIREBASE_ERROR"
            invalid_token = False

            if "registration-token-not-registered" in err_str.lower() or "invalid-registration-token" in err_str.lower():
                err_code = "INVALID_REGISTRATION_TOKEN"
                invalid_token = True
                status_val = 'INVALID_TOKEN'
            else:
                status_val = 'FAILED'

            return DeliveryResult(
                success=False,
                status=status_val,
                error_code=err_code,
                error_message=err_str[:255],
                invalid_token=invalid_token
            )

def get_notification_provider() -> NotificationProviderProtocol:
    provider_type = getattr(settings, 'NOTIFICATION_PROVIDER', 'mock').lower()
    if provider_type == 'fcm':
        return FirebasePushProvider()
    return MockNotificationProvider()
