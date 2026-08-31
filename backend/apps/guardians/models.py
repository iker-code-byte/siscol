import uuid
from django.db import models
from django.conf import settings
from apps.academics.models import Guardian

class PlatformChoices(models.TextChoices):
    WEB = 'WEB', 'Web / Navegador'
    ANDROID_PWA = 'ANDROID_PWA', 'PWA Android'
    IOS_PWA = 'IOS_PWA', 'PWA iOS'
    ANDROID_APP = 'ANDROID_APP', 'App Nativa Android (APK)'
    IOS_APP = 'IOS_APP', 'App Nativa iOS (Apple)'
    UNKNOWN = 'UNKNOWN', 'Desconocido'

class GuardianActivationCode(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='activation_codes')
    code_hash = models.CharField(max_length=128, db_index=True)
    expires_at = models.DateTimeField()
    used_at = models.DateTimeField(null=True, blank=True)
    revoked_at = models.DateTimeField(null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='generated_activation_codes'
    )
    max_attempts = models.IntegerField(default=5)
    attempt_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'guardian_activation_codes'
        verbose_name = 'Código de Activación de Tutor'
        verbose_name_plural = 'Códigos de Activación de Tutor'
        indexes = [
            models.Index(fields=['guardian', 'expires_at']),
        ]
        ordering = ['-created_at']

    @property
    def is_valid(self):
        from django.utils import timezone
        return (
            self.used_at is None and 
            self.revoked_at is None and 
            self.expires_at > timezone.now() and 
            self.attempt_count < self.max_attempts
        )

    def __str__(self):
        return f"Código para {self.guardian.full_name} ({'Válido' if self.is_valid else 'Inactivo'})"

class GuardianDevice(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='devices')
    name = models.CharField(max_length=150, blank=True, null=True) # e.g. "Samsung Galaxy S22"
    device_token = models.CharField(max_length=128, unique=True, db_index=True)
    platform = models.CharField(max_length=20, choices=PlatformChoices.choices, default=PlatformChoices.WEB)
    is_active = models.BooleanField(default=True)
    linked_at = models.DateTimeField(auto_now_add=True)
    last_seen_at = models.DateTimeField(auto_now=True)
    unlinked_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'guardian_devices'
        verbose_name = 'Dispositivo de Tutor'
        verbose_name_plural = 'Dispositivos de Tutor'
        ordering = ['-linked_at']

    def __str__(self):
        return f"{self.guardian.full_name} - {self.name or 'Dispositivo'} ({'Activo' if self.is_active else 'Inactivo'})"

class PushSubscription(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    guardian_device = models.ForeignKey(GuardianDevice, on_delete=models.CASCADE, related_name='push_subscriptions')
    provider = models.CharField(max_length=20, default='FCM')
    token_encrypted_or_protected = models.TextField()
    token_hash = models.CharField(max_length=64, unique=True, db_index=True)
    is_active = models.BooleanField(default=True)
    last_success_at = models.DateTimeField(null=True, blank=True)
    last_error_at = models.DateTimeField(null=True, blank=True)
    last_error_code = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'push_subscriptions'
        verbose_name = 'Suscripción Push'
        verbose_name_plural = 'Suscripciones Push'
        unique_together = ('provider', 'token_hash')
        ordering = ['-created_at']

    def __str__(self):
        return f"Push {self.provider} ({self.guardian_device.guardian.full_name}) - {'Activa' if self.is_active else 'Inactiva'}"
