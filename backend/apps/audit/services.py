from .models import AuditLog

class AuditService:
    @staticmethod
    def log(action: str, entity: str, entity_id: str = None, actor_user=None, actor_guardian_device_id=None, metadata: dict = None, ip_address: str = None):
        return AuditLog.objects.create(
            action=action,
            entity=entity,
            entity_id=str(entity_id) if entity_id else None,
            actor_user=actor_user if getattr(actor_user, 'is_authenticated', False) else None,
            actor_guardian_device_id=actor_guardian_device_id,
            metadata=metadata or {},
            ip_address=ip_address
        )
