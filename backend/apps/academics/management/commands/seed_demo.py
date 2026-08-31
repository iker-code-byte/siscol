from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.accounts.models import RoleChoices
from apps.academics.models import (
    AcademicYear, Course, Subject, Teacher, Student, 
    Guardian, StudentGuardian, RelationshipChoices, 
    Enrollment, TeachingAssignment, EnrollmentStatusChoices
)
from apps.alerts.models import NotificationRule, NotificationRuleTypeChoices
from apps.guardians.services import GuardianActivationService
from apps.grades.models import Grade
from apps.attendance.models import Attendance, AttendanceStatusChoices

User = get_user_model()

class Command(BaseCommand):
    help = 'Puebla la base de datos con un escenario demo reproducible para el Colegio Gabriel René Moreno II'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Limpia los datos existentes antes de sembrar')

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING("Limpiando datos existentes..."))
            Grade.objects.all().delete()
            Attendance.objects.all().delete()
            TeachingAssignment.objects.all().delete()
            Enrollment.objects.all().delete()
            StudentGuardian.objects.all().delete()
            Guardian.objects.all().delete()
            Student.objects.all().delete()
            Teacher.objects.all().delete()
            Subject.objects.all().delete()
            Course.objects.all().delete()
            AcademicYear.objects.all().delete()
            NotificationRule.objects.all().delete()
            User.objects.all().delete()

        self.stdout.write(self.style.NOTICE("Sembrando usuarios internos..."))

        # 1. Admin
        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@colegio-grm.edu.bo',
                'role': RoleChoices.ADMIN,
                'is_staff': True,
                'is_superuser': True,
                'is_active': True
            }
        )
        admin_user.set_password('admin123')
        admin_user.save()

        # 2. Teacher
        teacher_user, _ = User.objects.get_or_create(
            username='docente1',
            defaults={
                'email': 'profesor.carlos@colegio-grm.edu.bo',
                'role': RoleChoices.TEACHER,
                'is_active': True
            }
        )
        teacher_user.set_password('docente123')
        teacher_user.save()

        teacher, _ = Teacher.objects.get_or_create(
            user=teacher_user,
            defaults={
                'first_name': 'Carlos',
                'last_name': 'Mamani Rojas',
                'document_number': '6284910-SC'
            }
        )

        # 3. Students
        student1_user, _ = User.objects.get_or_create(
            username='estudiante1',
            defaults={
                'email': 'juan.perez@estudiante.grm.edu.bo',
                'role': RoleChoices.STUDENT,
                'is_active': True
            }
        )
        student1_user.set_password('estudiante123')
        student1_user.save()

        student1, _ = Student.objects.get_or_create(
            code='RUDE-8072001',
            defaults={
                'user': student1_user,
                'first_name': 'Juan',
                'last_name': 'Pérez Gómez',
                'active': True
            }
        )

        student2_user, _ = User.objects.get_or_create(
            username='estudiante2',
            defaults={
                'email': 'sofia.fernandez@estudiante.grm.edu.bo',
                'role': RoleChoices.STUDENT,
                'is_active': True
            }
        )
        student2_user.set_password('estudiante123')
        student2_user.save()

        student2, _ = Student.objects.get_or_create(
            code='RUDE-8072002',
            defaults={
                'user': student2_user,
                'first_name': 'Sofía',
                'last_name': 'Fernández Silva',
                'active': True
            }
        )

        # 4. Guardians (No user account!)
        guardian1, _ = Guardian.objects.get_or_create(
            full_name='María Gómez de Pérez',
            defaults={
                'phone': '+591 71234567',
                'email': 'maria.gomez@gmail.com',
                'notifications_enabled': True,
                'active': True
            }
        )

        guardian2, _ = Guardian.objects.get_or_create(
            full_name='Roberto Fernández Vargas',
            defaults={
                'phone': '+591 79876543',
                'email': 'roberto.fernandez@gmail.com',
                'notifications_enabled': True,
                'active': True
            }
        )

        # 5. StudentGuardian Links
        StudentGuardian.objects.get_or_create(
            student=student1,
            guardian=guardian1,
            defaults={
                'relationship': RelationshipChoices.MOTHER,
                'is_primary': True,
                'can_receive_notifications': True
            }
        )

        StudentGuardian.objects.get_or_create(
            student=student2,
            guardian=guardian2,
            defaults={
                'relationship': RelationshipChoices.FATHER,
                'is_primary': True,
                'can_receive_notifications': True
            }
        )

        # 6. Academic Structure
        year_2026, _ = AcademicYear.objects.get_or_create(
            name='Gestión 2026',
            defaults={
                'start_date': date(2026, 2, 2),
                'end_date': date(2026, 11, 30),
                'active': True
            }
        )

        course_1a, _ = Course.objects.get_or_create(
            academic_year=year_2026,
            name='1ro de Secundaria',
            parallel='A'
        )

        sub_math, _ = Subject.objects.get_or_create(
            code='MAT-101',
            defaults={'name': 'Matemáticas'}
        )

        sub_lang, _ = Subject.objects.get_or_create(
            code='LEN-101',
            defaults={'name': 'Lenguaje y Comunicación'}
        )

        # 7. Enrollments
        Enrollment.objects.get_or_create(
            student=student1,
            course=course_1a,
            academic_year=year_2026,
            defaults={'status': EnrollmentStatusChoices.ACTIVE}
        )

        Enrollment.objects.get_or_create(
            student=student2,
            course=course_1a,
            academic_year=year_2026,
            defaults={'status': EnrollmentStatusChoices.ACTIVE}
        )

        # 8. Teaching Assignments
        assign_math, _ = TeachingAssignment.objects.get_or_create(
            teacher=teacher,
            course=course_1a,
            subject=sub_math,
            academic_year=year_2026,
            defaults={'active': True}
        )

        assign_lang, _ = TeachingAssignment.objects.get_or_create(
            teacher=teacher,
            course=course_1a,
            subject=sub_lang,
            academic_year=year_2026,
            defaults={'active': True}
        )

        # 9. Notification Rules
        rule_low_grade, _ = NotificationRule.objects.get_or_create(
            name='Alerta de Calificación Baja (< 51)',
            type=NotificationRuleTypeChoices.LOW_GRADE,
            defaults={
                'enabled': True,
                'threshold_value': Decimal('51.00'),
                'cooldown_hours': 24
            }
        )

        rule_absence, _ = NotificationRule.objects.get_or_create(
            name='Alerta de Falta a Clase',
            type=NotificationRuleTypeChoices.ABSENCE,
            defaults={
                'enabled': True,
                'cooldown_hours': 12
            }
        )

        rule_repeated_absence, _ = NotificationRule.objects.get_or_create(
            name='Alerta de Faltas Reiteradas (>= 3 en 15 días)',
            type=NotificationRuleTypeChoices.REPEATED_ABSENCE,
            defaults={
                'enabled': True,
                'threshold_value': Decimal('3.00'),
                'period_days': 15,
                'cooldown_hours': 24
            }
        )

        # 10. Generate Demo Guardian Activation Code for María Gómez
        code_obj, plain_code = GuardianActivationService.generate_code(
            guardian=guardian1,
            created_by=admin_user,
            ttl_hours=48
        )

        self.stdout.write(self.style.SUCCESS("\n" + "="*60))
        self.stdout.write(self.style.SUCCESS(">>> SEED DEMO COMPLETADO CON EXITO <<<"))
        self.stdout.write(self.style.SUCCESS("="*60))
        self.stdout.write(f"[Admin]       admin / admin123")
        self.stdout.write(f"[Docente]     docente1 / docente123 (Prof. Carlos Mamani)")
        self.stdout.write(f"[Alumno 1]    estudiante1 / estudiante123 (Juan Perez)")
        self.stdout.write(f"[Alumno 2]    estudiante2 / estudiante123 (Sofia Fernandez)")
        self.stdout.write(f"[Tutor demo]  Maria Gomez de Perez (Madre de Juan)")
        self.stdout.write(self.style.NOTICE(f"[CODIGO ACTIVACION PWA]: {plain_code}"))
        self.stdout.write(self.style.SUCCESS("="*60 + "\n"))
