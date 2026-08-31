import logging
from django.utils import timezone
from django.db import transaction
from apps.academics.models import StudentGuardian
from apps.guardians.models import PushSubscription, GuardianDevice
from apps.audit.services import AuditService
from .models import Notification, NotificationDelivery, DeliveryStatusChoices, NotificationCategoryChoices
from .providers import get_notification_provider

logger = logging.getLogger(__name__)

class NotificationDispatchService:
    @staticmethod
    def dispatch_notification(notification: Notification) -> list[NotificationDelivery]:
        provider = get_notification_provider()
        deliveries = []

        # Find active subscriptions for active devices belonging to the guardian
        active_devices = GuardianDevice.objects.filter(
            guardian=notification.guardian,
            is_active=True
        )
        subscriptions = PushSubscription.objects.filter(
            guardian_device__in=active_devices,
            is_active=True
        ).select_related('guardian_device')

        for sub in subscriptions:
            delivery, created = NotificationDelivery.objects.get_or_create(
                notification=notification,
                push_subscription=sub,
                defaults={
                    'provider': sub.provider,
                    'status': DeliveryStatusChoices.PENDING,
                    'attempt_count': 0
                }
            )

            delivery.attempt_count += 1
            result = provider.send(subscription=sub, notification=notification)

            delivery.status = result.status
            delivery.provider_message_id = result.provider_message_id
            delivery.error_code = result.error_code
            delivery.error_message_redacted = result.error_message
            delivery.last_attempt_at = timezone.now()
            delivery.save()

            if result.success:
                sub.last_success_at = timezone.now()
                sub.save(update_fields=['last_success_at'])
            else:
                sub.last_error_at = timezone.now()
                sub.last_error_code = result.error_code
                if result.invalid_token:
                    sub.is_active = False
                    sub.save(update_fields=['is_active', 'last_error_at', 'last_error_code'])
                else:
                    sub.save(update_fields=['last_error_at', 'last_error_code'])

            deliveries.append(delivery)

        return deliveries

    @staticmethod
    def retry_delivery(delivery: NotificationDelivery) -> NotificationDelivery:
        if delivery.status == DeliveryStatusChoices.INVALID_TOKEN:
            return delivery

        provider = get_notification_provider()
        sub = delivery.push_subscription

        if not sub or not sub.is_active:
            delivery.status = DeliveryStatusChoices.INVALID_TOKEN
            delivery.error_code = 'SUBSCRIPTION_INACTIVE'
            delivery.save(update_fields=['status', 'error_code', 'last_attempt_at'])
            return delivery

        delivery.attempt_count += 1
        result = provider.send(subscription=sub, notification=delivery.notification)

        delivery.status = result.status
        delivery.provider_message_id = result.provider_message_id
        delivery.error_code = result.error_code
        delivery.error_message_redacted = result.error_message
        delivery.last_attempt_at = timezone.now()
        delivery.save()

        if result.invalid_token:
            sub.is_active = False
            sub.save(update_fields=['is_active', 'last_error_at', 'last_error_code'])

        return delivery

class NotificationComposer:
    @staticmethod
    def dispatch_alert_event(alert_event) -> list[Notification]:
        student = alert_event.student
        rule = alert_event.rule
        metadata = alert_event.metadata or {}

        # Resolve category
        category = NotificationCategoryChoices.ACADEMIC_ALERT
        if rule.type in ['ABSENCE', 'REPEATED_ABSENCE', 'LATE']:
            category = NotificationCategoryChoices.ATTENDANCE_ALERT

        # Build detailed messages based on alert type
        if rule.type == 'LOW_GRADE':
            subject_name = metadata.get('subject_name', 'una materia')
            score = metadata.get('score', '')
            max_score = metadata.get('max_score', 100)
            activity = metadata.get('activity_name', 'Evaluación')
            term = metadata.get('term', '')
            detailed_title = f"Alerta de Calificación — {subject_name}"
            detailed_body = f"Se registró una calificación de {score}/{max_score} en {activity} ({term}) para el estudiante {student.first_name} {student.last_name}."

        elif rule.type == 'ABSENCE':
            subject_name = metadata.get('subject_name', 'clases')
            date_str = metadata.get('date', str(timezone.now().date()))
            detailed_title = f"Registro de Falta — {subject_name}"
            detailed_body = f"Se registró una falta para el estudiante {student.first_name} {student.last_name} en fecha {date_str}."

        elif rule.type == 'REPEATED_ABSENCE':
            count = metadata.get('count', 'múltiples')
            period_days = metadata.get('period_days', 15)
            detailed_title = "Alerta de Faltas Reiteradas"
            detailed_body = f"El estudiante {student.first_name} {student.last_name} acumula {count} faltas en los últimos {period_days} días."

        elif rule.type == 'LATE':
            subject_name = metadata.get('subject_name', 'clases')
            date_str = metadata.get('date', str(timezone.now().date()))
            detailed_title = f"Registro de Atraso — {subject_name}"
            detailed_body = f"Se registró un atraso para el estudiante {student.first_name} {student.last_name} en fecha {date_str}."

        else:
            detailed_title = f"Notificación Institucional — {rule.name}"
            detailed_body = f"Aviso para el estudiante {student.first_name} {student.last_name}."

        # Find eligible guardians
        guardian_links = StudentGuardian.objects.filter(
            student=student,
            can_receive_notifications=True,
            guardian__active=True,
            guardian__notifications_enabled=True
        ).select_related('guardian')

        created_notifications = []

        for link in guardian_links:
            guardian = link.guardian

            # Idempotency check: don't duplicate notification for the same alert_event + guardian
            existing = Notification.objects.filter(alert_event=alert_event, guardian=guardian).first()
            if existing:
                continue

            notification = Notification.objects.create(
                alert_event=alert_event,
                guardian=guardian,
                student=student,
                category=category,
                safe_title="Colegio Gabriel René Moreno II",
                safe_body="Tiene una nueva notificación académica.",
                detailed_title=detailed_title,
                detailed_body=detailed_body,
                metadata=metadata
            )

            # Dispatch push deliveries
            NotificationDispatchService.dispatch_notification(notification)
            created_notifications.append(notification)

        return created_notifications
