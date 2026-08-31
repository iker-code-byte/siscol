from django.core.management.base import BaseCommand
from apps.academics.models import Guardian
from apps.guardians.services import GuardianActivationService

class Command(BaseCommand):
    help = 'Genera un nuevo código de activación temporal para un tutor'

    def add_arguments(self, parser):
        parser.add_argument('guardian_id', type=str, help='UUID o nombre parcial del tutor')
        parser.add_argument('--hours', type=int, default=24, help='Horas de vigencia del código')

    def handle(self, *args, **options):
        guardian_id = options['guardian_id']
        hours = options['hours']

        guardian = None
        import uuid
        try:
            guid = uuid.UUID(guardian_id)
            guardian = Guardian.objects.filter(id=guid).first()
        except ValueError:
            guardian = Guardian.objects.filter(full_name__icontains=guardian_id).first()

        if not guardian:
            self.stdout.write(self.style.ERROR(f"No se encontró un tutor con identificador '{guardian_id}'."))
            return

        code_obj, plain_code = GuardianActivationService.generate_code(
            guardian=guardian,
            ttl_hours=hours
        )

        self.stdout.write(self.style.SUCCESS(f"Código generado para {guardian.full_name}:"))
        self.stdout.write(self.style.NOTICE(f"  Código:     {plain_code}"))
        self.stdout.write(f"  Expira en:  {code_obj.expires_at} ({hours} horas)")
