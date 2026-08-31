import uuid
from django.db import models
from django.conf import settings

class AuditLog(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    actor_user = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='audit_actions'
    )
    actor_guardian_device_id = models.UUIDField(null=True, blank=True)
    action = models.CharField(max_length=100) # e.g. GRADE_BULK_SAVE, ATTENDANCE_BULK_SAVE, GUARDIAN_ACTIVATION
    entity = models.CharField(max_length=100) # e.g. Grade, Attendance, GuardianActivationCode
    entity_id = models.CharField(max_length=100, null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    ip_address = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'audit_logs'
        verbose_name = 'Registro de Auditoría'
        verbose_name_plural = 'Registros de Auditoría'
        ordering = ['-created_at']

    def __str__(self):
        return f"[{self.created_at.strftime('%Y-%m-%d %H:%M')}] {self.action} on {self.entity} by {self.actor_user or self.actor_guardian_device_id or 'System'}"
