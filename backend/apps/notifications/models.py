import uuid
from django.db import models
from apps.academics.models import Guardian, Student
from apps.guardians.models import PushSubscription

class NotificationCategoryChoices(models.TextChoices):
    ACADEMIC_ALERT = 'ACADEMIC_ALERT', 'Alerta Académica'
    ATTENDANCE_ALERT = 'ATTENDANCE_ALERT', 'Alerta de Asistencia'
    GENERAL = 'GENERAL', 'Comunicado General'

class Notification(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    alert_event = models.ForeignKey(
        'alerts.AlertEvent', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='notifications'
    )
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='notifications')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='notifications')
    category = models.CharField(
        max_length=30, 
        choices=NotificationCategoryChoices.choices, 
        default=NotificationCategoryChoices.ACADEMIC_ALERT
    )
    # Safe generic payload for lock-screen push
    safe_title = models.CharField(max_length=200, default='Colegio Gabriel René Moreno II')
    safe_body = models.TextField(default='Tiene una nueva notificación académica.')
    
    # Detailed content only authorized after opening the app/PWA
    detailed_title = models.CharField(max_length=200)
    detailed_body = models.TextField()
    metadata = models.JSONField(default=dict, blank=True)

    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'
        verbose_name = 'Notificación'
        verbose_name_plural = 'Notificaciones'
        indexes = [
            models.Index(fields=['guardian', '-created_at']),
            models.Index(fields=['student', '-created_at']),
        ]
        ordering = ['-created_at']

    @property
    def is_read(self):
        return self.read_at is not None

    def __str__(self):
        return f"Notif para {self.guardian.full_name} ({self.detailed_title})"

class DeliveryStatusChoices(models.TextChoices):
    PENDING = 'PENDING', 'Pendiente'
    SENT = 'SENT', 'Enviado'
    FAILED = 'FAILED', 'Fallido'
    INVALID_TOKEN = 'INVALID_TOKEN', 'Token Inválido'
    SKIPPED = 'SKIPPED', 'Omitido'

class NotificationDelivery(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    notification = models.ForeignKey(Notification, on_delete=models.CASCADE, related_name='deliveries')
    push_subscription = models.ForeignKey(
        PushSubscription, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='deliveries'
    )
    provider = models.CharField(max_length=30, default='FCM')
    status = models.CharField(
        max_length=30, 
        choices=DeliveryStatusChoices.choices, 
        default=DeliveryStatusChoices.PENDING
    )
    provider_message_id = models.CharField(max_length=200, null=True, blank=True)
    attempt_count = models.IntegerField(default=0)
    last_attempt_at = models.DateTimeField(auto_now=True)
    error_code = models.CharField(max_length=100, null=True, blank=True)
    error_message_redacted = models.TextField(null=True, blank=True)

    class Meta:
        db_table = 'notification_deliveries'
        verbose_name = 'Entrega de Notificación'
        verbose_name_plural = 'Entregas de Notificación'
        indexes = [
            models.Index(fields=['status', '-last_attempt_at']),
        ]
        ordering = ['-last_attempt_at']

    def __str__(self):
        return f"Delivery [{self.status}] {self.provider} - Notif {self.notification_id}"
