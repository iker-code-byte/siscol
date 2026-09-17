from decimal import Decimal
from datetime import date, timedelta
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from apps.accounts.models import RoleChoices
from apps.academics.models import (
    AcademicYear, AcademicPeriod, AcademicPeriodStatusChoices,
    Course, Subject, Teacher, Student, 
    Guardian, StudentGuardian, RelationshipChoices, 
    Enrollment, TeachingAssignment, EnrollmentStatusChoices
)
from apps.alerts.models import NotificationRule, NotificationRuleTypeChoices
from apps.guardians.services import GuardianActivationService
from apps.grades.models import Grade, Gradebook, GradeActivity, GradeEntry
from apps.attendance.models import Attendance, AttendanceStatusChoices

User = get_user_model()

class Command(BaseCommand):
    help = 'Puebla la base de datos con un escenario demo reproducible para el Colegio Gabriel René Moreno II'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Limpia los datos existentes antes de sembrar')

    def handle(self, *args, **options):
        if options['reset']:
            self.stdout.write(self.style.WARNING("Limpiando datos existentes..."))
            GradeEntry.objects.all().delete()
            GradeActivity.objects.all().delete()
            Gradebook.objects.all().delete()
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
            AcademicPeriod.objects.all().delete()
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

        # 2. Teachers (5 Docentes)
        teachers_data = [
            {'username': 'docente1', 'email': 'profesor.carlos@colegio-grm.edu.bo', 'first_name': 'Carlos', 'last_name': 'Mamani Rojas', 'doc': '6284910-SC'},
            {'username': 'docente2', 'email': 'profesora.elena@colegio-grm.edu.bo', 'first_name': 'Elena', 'last_name': 'Morales Gutiérrez', 'doc': '4918234-SC'},
            {'username': 'docente3', 'email': 'profesor.jorge@colegio-grm.edu.bo', 'first_name': 'Jorge', 'last_name': 'Salazar Peña', 'doc': '5321890-SC'},
            {'username': 'docente4', 'email': 'profesora.patricia@colegio-grm.edu.bo', 'first_name': 'Patricia', 'last_name': 'Vaca Terrazas', 'doc': '7104928-SC'},
            {'username': 'docente5', 'email': 'profesor.raul@colegio-grm.edu.bo', 'first_name': 'Raúl', 'last_name': 'Flores Mendoza', 'doc': '6592014-SC'},
        ]

        teachers = []
        for t_info in teachers_data:
            u, _ = User.objects.get_or_create(
                username=t_info['username'],
                defaults={'email': t_info['email'], 'role': RoleChoices.TEACHER, 'is_active': True}
            )
            u.set_password('docente123')
            u.save()

            t, _ = Teacher.objects.get_or_create(
                user=u,
                defaults={'first_name': t_info['first_name'], 'last_name': t_info['last_name'], 'document_number': t_info['doc']}
            )
            teachers.append((u, t))

        teacher1_user, teacher1 = teachers[0]
        teacher2_user, teacher2 = teachers[1]
        teacher3_user, teacher3 = teachers[2]
        teacher4_user, teacher4 = teachers[3]
        teacher5_user, teacher5 = teachers[4]

        # 3. Students (12 Estudiantes en total)
        students_raw = [
            ('estudiante1', 'juan.perez@estudiante.grm.edu.bo', 'Juan', 'Pérez Gómez', 'RUDE-8072001'),
            ('estudiante2', 'sofia.fernandez@estudiante.grm.edu.bo', 'Sofía', 'Fernández Silva', 'RUDE-8072002'),
            ('estudiante3', 'lucas.morales@estudiante.grm.edu.bo', 'Lucas', 'Morales Torrez', 'RUDE-8072003'),
            ('estudiante4', 'valentina.rojas@estudiante.grm.edu.bo', 'Valentina', 'Rojas Mercado', 'RUDE-8072004'),
            ('estudiante5', 'mateo.quispe@estudiante.grm.edu.bo', 'Mateo', 'Quispe Condori', 'RUDE-8072005'),
            ('estudiante6', 'camila.suarez@estudiante.grm.edu.bo', 'Camila', 'Suárez Chávez', 'RUDE-8072006'),
            ('estudiante7', 'sebastian.vargas@estudiante.grm.edu.bo', 'Sebastián', 'Vargas Ortiz', 'RUDE-8072007'),
            ('estudiante8', 'luciana.mendoza@estudiante.grm.edu.bo', 'Luciana', 'Mendoza Castro', 'RUDE-8072008'),
            ('estudiante9', 'diego.flores@estudiante.grm.edu.bo', 'Diego', 'Flores Miranda', 'RUDE-8072009'),
            ('estudiante10', 'mariana.pinto@estudiante.grm.edu.bo', 'Mariana', 'Pinto Soliz', 'RUDE-8072010'),
            ('estudiante11', 'gabriel.alarcon@estudiante.grm.edu.bo', 'Gabriel', 'Alarcón Nuñez', 'RUDE-8072011'),
            ('estudiante12', 'valeria.justiniano@estudiante.grm.edu.bo', 'Valeria', 'Justiniano Rios', 'RUDE-8072012'),
        ]

        students = []
        for username, email, fn, ln, rude in students_raw:
            st_user, _ = User.objects.get_or_create(
                username=username,
                defaults={'email': email, 'role': RoleChoices.STUDENT, 'is_active': True}
            )
            st_user.set_password('estudiante123')
            st_user.save()

            st, _ = Student.objects.get_or_create(
                code=rude,
                defaults={'user': st_user, 'first_name': fn, 'last_name': ln, 'active': True}
            )
            students.append((st_user, st))

        student1 = students[0][1]
        student2 = students[1][1]
        student3 = students[2][1]
        student4 = students[3][1]

        # 4. Guardians (Tutores)
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

        guardian3, _ = Guardian.objects.get_or_create(
            full_name='Carmen Torrez de Morales',
            defaults={
                'phone': '+591 72345678',
                'email': 'carmen.torrez@gmail.com',
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

        StudentGuardian.objects.get_or_create(
            student=student3,
            guardian=guardian3,
            defaults={
                'relationship': RelationshipChoices.MOTHER,
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

        # 6.1 Academic Periods (4 Bimestres as specified by SDD)
        b1, _ = AcademicPeriod.objects.get_or_create(
            academic_year=year_2026,
            number=1,
            defaults={
                'name': 'Primer Bimestre',
                'period_type': 'BIMONTH',
                'start_date': date(2026, 2, 2),
                'end_date': date(2026, 4, 10),
                'status': AcademicPeriodStatusChoices.CLOSED
            }
        )

        b2, _ = AcademicPeriod.objects.get_or_create(
            academic_year=year_2026,
            number=2,
            defaults={
                'name': 'Segundo Bimestre',
                'period_type': 'BIMONTH',
                'start_date': date(2026, 4, 13),
                'end_date': date(2026, 6, 26),
                'status': AcademicPeriodStatusChoices.OPEN
            }
        )

        b3, _ = AcademicPeriod.objects.get_or_create(
            academic_year=year_2026,
            number=3,
            defaults={
                'name': 'Tercer Bimestre',
                'period_type': 'BIMONTH',
                'start_date': date(2026, 7, 13),
                'end_date': date(2026, 9, 18),
                'status': AcademicPeriodStatusChoices.PLANNED
            }
        )

        b4, _ = AcademicPeriod.objects.get_or_create(
            academic_year=year_2026,
            number=4,
            defaults={
                'name': 'Cuarto Bimestre',
                'period_type': 'BIMONTH',
                'start_date': date(2026, 9, 21),
                'end_date': date(2026, 11, 27),
                'status': AcademicPeriodStatusChoices.PLANNED
            }
        )

        course_1a, _ = Course.objects.get_or_create(
            academic_year=year_2026,
            name='1ro de Secundaria',
            parallel='A'
        )

        # Materias
        sub_math, _ = Subject.objects.get_or_create(code='MAT-101', defaults={'name': 'Matemáticas'})
        sub_lang, _ = Subject.objects.get_or_create(code='LEN-101', defaults={'name': 'Lenguaje y Literatura'})
        sub_bio, _ = Subject.objects.get_or_create(code='BIO-101', defaults={'name': 'Ciencias Naturales y Biología'})
        sub_soc, _ = Subject.objects.get_or_create(code='SOC-101', defaults={'name': 'Ciencias Sociales e Historia'})
        sub_fis, _ = Subject.objects.get_or_create(code='FIS-101', defaults={'name': 'Física y Química'})

        # 7. Enrollments (Inscribir a todos los 12 alumnos en 1ro de Secundaria A)
        for _, st in students:
            Enrollment.objects.get_or_create(
                student=st,
                course=course_1a,
                academic_year=year_2026,
                defaults={'status': EnrollmentStatusChoices.ACTIVE}
            )

        # 8. Teaching Assignments (5 Materias con 5 Docentes)
        assignments = [
            (teacher1, sub_math, 'Matemáticas'),
            (teacher2, sub_lang, 'Lenguaje y Literatura'),
            (teacher3, sub_bio, 'Ciencias Naturales y Biología'),
            (teacher4, sub_soc, 'Ciencias Sociales e Historia'),
            (teacher5, sub_fis, 'Física y Química'),
        ]

        for prof, subj, _ in assignments:
            TeachingAssignment.objects.get_or_create(
                teacher=prof,
                course=course_1a,
                subject=subj,
                academic_year=year_2026,
                defaults={'active': True}
            )

        # 8.1 Gradebook Excel SDD Seed (Segundo Bimestre - Matemáticas 1ro A)
        gb_math_b2, _ = Gradebook.objects.get_or_create(
            academic_year=year_2026,
            academic_period=b2,
            course=course_1a,
            subject=sub_math,
            teacher=teacher1,
            defaults={'status': 'OPEN'}
        )

        act1, _ = GradeActivity.objects.get_or_create(
            gradebook=gb_math_b2,
            name='Tarea 1 - Ecuaciones',
            defaults={
                'description': 'Resolución de ecuaciones de primer grado',
                'activity_type': 'TASK',
                'activity_date': date(2026, 4, 20),
                'max_score': Decimal('45.00'),
                'position': 0,
                'is_active': True
            }
        )
        if act1.max_score != Decimal('45.00'):
            act1.max_score = Decimal('45.00')
            act1.save(update_fields=['max_score'])

        act2, _ = GradeActivity.objects.get_or_create(
            gradebook=gb_math_b2,
            name='Práctica en Clase',
            defaults={
                'description': 'Ejercicios grupales en pizarra',
                'activity_type': 'PRACTICE',
                'activity_date': date(2026, 5, 5),
                'max_score': Decimal('45.00'),
                'position': 1,
                'is_active': True
            }
        )
        if act2.max_score != Decimal('45.00'):
            act2.max_score = Decimal('45.00')
            act2.save(update_fields=['max_score'])

        act3, _ = GradeActivity.objects.get_or_create(
            gradebook=gb_math_b2,
            name='Examen Bimestral',
            defaults={
                'description': 'Evaluación integral de álgebra',
                'activity_type': 'EXAM',
                'activity_date': date(2026, 5, 25),
                'max_score': Decimal('45.00'),
                'position': 2,
                'is_active': True
            }
        )
        if act3.max_score != Decimal('45.00'):
            act3.max_score = Decimal('45.00')
            act3.save(update_fields=['max_score'])

        # Seed scores for all 12 students in the Gradebook matrix (Scale 0 to 45)
        student_scores = [
            (students[0][1], Decimal('38.00'), Decimal('40.50'), Decimal('35.00')), # Juan Pérez -> 84.1 / 100
            (students[1][1], Decimal('43.00'), Decimal('44.00'), Decimal('42.00')), # Sofía Fernández -> 95.6 / 100
            (students[2][1], Decimal('20.00'), Decimal('18.00'), Decimal('21.50')), # Lucas Morales -> 44.1 / 100 (Riesgo)
            (students[3][1], Decimal('40.50'), Decimal('38.00'), Decimal('43.00')), # Valentina Rojas -> 90.0 / 100
            (students[4][1], Decimal('31.50'), Decimal('29.00'), Decimal('33.50')), # Mateo Quispe -> 70.0 / 100
            (students[5][1], Decimal('27.00'), Decimal('31.50'), Decimal('29.00')), # Camila Suárez -> 64.8 / 100
            (students[6][1], Decimal('34.00'), Decimal('36.00'), Decimal('31.50')), # Sebastián Vargas -> 75.2 / 100
            (students[7][1], Decimal('21.50'), Decimal('23.00'), Decimal('20.00')), # Luciana Mendoza -> 47.8 / 100 (Riesgo)
            (students[8][1], Decimal('36.00'), None,            Decimal('34.00')), # Diego Flores -> 77.8 / 100 (NULL demo)
            (students[9][1], Decimal('41.50'), Decimal('39.50'), Decimal('40.50')), # Mariana Pinto -> 90.0 / 100
            (students[10][1], Decimal('29.00'), Decimal('27.00'), Decimal('31.50')), # Gabriel Alarcón -> 64.8 / 100
            (students[11][1], Decimal('39.50'), Decimal('40.50'), Decimal('38.00')), # Valeria Justiniano -> 87.4 / 100
        ]

        for st, s1, s2, s3 in student_scores:
            if s1 is not None:
                GradeEntry.objects.update_or_create(activity=act1, student=st, defaults={'score': s1, 'created_by': teacher1_user, 'updated_by': teacher1_user})
            if s2 is not None:
                GradeEntry.objects.update_or_create(activity=act2, student=st, defaults={'score': s2, 'created_by': teacher1_user, 'updated_by': teacher1_user})
            if s3 is not None:
                GradeEntry.objects.update_or_create(activity=act3, student=st, defaults={'score': s3, 'created_by': teacher1_user, 'updated_by': teacher1_user})

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

        # 10. Generate Demo Guardian Activation Code for María Gómez (Madre de Juan)
        code_obj, plain_code = GuardianActivationService.generate_code(
            guardian=guardian1,
            created_by=admin_user,
            ttl_hours=72
        )

        self.stdout.write(self.style.SUCCESS("\n" + "="*70))
        self.stdout.write(self.style.SUCCESS(">>> ESCENARIO DEMO ACTUALIZADO CON ÉXITO (COLEGIO GRM II) <<<"))
        self.stdout.write(self.style.SUCCESS("="*70))
        self.stdout.write(f"[Administrador]  admin / admin123")
        self.stdout.write("-" * 70)
        self.stdout.write("[Plantel Docente (5 Profesores)]")
        for u, t in teachers:
            self.stdout.write(f"  - {u.username} / docente123  -> {t.first_name} {t.last_name}")
        self.stdout.write("-" * 70)
        self.stdout.write(f"[Alumnado Matriculado ({len(students)} Estudiantes en 1ro Sec. A)]")
        for u, s in students:
            self.stdout.write(f"  - {u.username} / estudiante123 -> {s.first_name} {s.last_name} ({s.code})")
        self.stdout.write("-" * 70)
        self.stdout.write(f"[Tutor Demo Principal]  María Gómez de Pérez (Madre de Juan Pérez)")
        self.stdout.write(self.style.NOTICE(f"[CÓDIGO ACTIVACIÓN TELÉFONO]: {plain_code}"))
        self.stdout.write(self.style.SUCCESS("="*70 + "\n"))

