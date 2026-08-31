from django.core.management.base import BaseCommand
from apps.notifications.models import NotificationDelivery, DeliveryStatusChoices
from apps.notifications.services import NotificationDispatchService

class Command(BaseCommand):
    help = 'Reintenta entregas de notificaciones fallidas o pendientes'

    def handle(self, *args, **options):
        pending_deliveries = NotificationDelivery.objects.filter(
            status__in=[DeliveryStatusChoices.PENDING, DeliveryStatusChoices.FAILED],
            attempt_count__lt=3
        )
        count = pending_deliveries.count()
        self.stdout.write(self.style.NOTICE(f"Reintentando {count} entregas pendientes..."))

        success_count = 0
        for delivery in pending_deliveries:
            updated = NotificationDispatchService.retry_delivery(delivery)
            if updated.status == DeliveryStatusChoices.SENT:
                success_count += 1

        self.stdout.write(self.style.SUCCESS(f"Reintento finalizado: {success_count}/{count} entregadas exitosamente."))
