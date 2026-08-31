from django.core.management.base import BaseCommand
from apps.alerts.services import AlertEvaluationService

class Command(BaseCommand):
    help = 'Evalúa reglas activas contra calificaciones y asistencias para generar eventos de alerta y notificaciones Push'

    def handle(self, *args, **options):
        self.stdout.write(self.style.NOTICE("Iniciando evaluación de alertas..."))
        result = AlertEvaluationService.run_full_evaluation()
        self.stdout.write(self.style.SUCCESS(
            f"Evaluación completada: {result['grade_events_created']} alertas de notas, "
            f"{result['attendance_events_created']} alertas de asistencia generadas. Total: {result['total_new_events']}"
        ))
