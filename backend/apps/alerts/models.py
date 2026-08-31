import uuid
from django.db import models
from apps.academics.models import Student

class NotificationRuleTypeChoices(models.TextChoices):
    LOW_GRADE = 'LOW_GRADE', 'Calificación Baja'
    ABSENCE = 'ABSENCE', 'Falta Individual'
    REPEATED_ABSENCE = 'REPEATED_ABSENCE', 'Faltas Reiteradas'
    LATE = 'LATE', 'Atraso'

class NotificationRule(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=150)
    type = models.CharField(max_length=30, choices=NotificationRuleTypeChoices.choices)
    enabled = models.BooleanField(default=True)
    threshold_value = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True, default=51.00) # e.g. score < 51 or count >= 3
    period_days = models.IntegerField(null=True, blank=True, default=15) # For aggregates
    cooldown_hours = models.IntegerField(null=True, blank=True, default=24)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'notification_rules'
        verbose_name = 'Regla de Notificación'
        verbose_name_plural = 'Reglas de Notificación'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.get_type_display()}) - {'Habilitada' if self.enabled else 'Deshabilitada'}"

class AlertSourceTypeChoices(models.TextChoices):
    GRADE = 'GRADE', 'Calificación'
    ATTENDANCE = 'ATTENDANCE', 'Asistencia'
    AGGREGATE = 'AGGREGATE', 'Agregado'

class AlertSeverityChoices(models.TextChoices):
    INFO = 'INFO', 'Informativo'
    WARNING = 'WARNING', 'Advertencia'
    CRITICAL = 'CRITICAL', 'Crítico'

class AlertStatusChoices(models.TextChoices):
    OPEN = 'OPEN', 'Abierto'
    RESOLVED = 'RESOLVED', 'Resuelto'

class AlertEvent(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    rule = models.ForeignKey(NotificationRule, on_delete=models.CASCADE, related_name='alert_events')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='alert_events')
    source_type = models.CharField(max_length=20, choices=AlertSourceTypeChoices.choices)
    source_id = models.CharField(max_length=100, null=True, blank=True)
    fingerprint = models.CharField(max_length=200, unique=True, db_index=True)
    severity = models.CharField(max_length=20, choices=AlertSeverityChoices.choices, default=AlertSeverityChoices.WARNING)
    status = models.CharField(max_length=20, choices=AlertStatusChoices.choices, default=AlertStatusChoices.OPEN)
    metadata = models.JSONField(default=dict, blank=True)
    first_detected_at = models.DateTimeField(auto_now_add=True)
    last_detected_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'alert_events'
        verbose_name = 'Evento de Alerta'
        verbose_name_plural = 'Eventos de Alerta'
        indexes = [
            models.Index(fields=['student', 'status']),
            models.Index(fields=['rule', 'status']),
        ]
        ordering = ['-first_detected_at']

    def __str__(self):
        return f"[{self.severity}] {self.rule.name} - {self.student.first_name} {self.student.last_name}"
