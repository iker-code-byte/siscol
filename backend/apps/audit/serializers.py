from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    actor_username = serializers.CharField(source='actor_user.username', read_only=True, default=None)

    class Meta:
        model = AuditLog
        fields = ['id', 'actor_user', 'actor_username', 'actor_guardian_device_id', 'action', 'entity', 'entity_id', 'metadata', 'ip_address', 'created_at']
