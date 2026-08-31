import uuid
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.academics.models import TeachingAssignment, Enrollment
from apps.audit.services import AuditService
from .models import Attendance, AttendanceStatusChoices

class AttendanceBulkService:
    @staticmethod
    def save_bulk_attendance(*, user, teaching_assignment_id, date, rows_data, comments=None, ip_address=None):
        try:
            assignment = TeachingAssignment.objects.select_related('teacher', 'course', 'subject').get(id=teaching_assignment_id)
        except TeachingAssignment.DoesNotExist:
            raise ValidationError({"teaching_assignment_id": ["La asignación docente no existe."]})

        if user.role == 'TEACHER':
            if not hasattr(user, 'teacher_profile') or assignment.teacher_id != user.teacher_profile.id:
                raise PermissionDenied("No tiene permisos para registrar asistencia en esta asignación docente.")

        active_student_ids = set(
            Enrollment.objects.filter(
                course=assignment.course,
                academic_year=assignment.academic_year,
                status='ACTIVE'
            ).values_list('student_id', flat=True)
        )

        valid_statuses = dict(AttendanceStatusChoices.choices).keys()
        saved_rows = []
        validation_errors = {}
        absent_count = 0
        late_count = 0
        present_count = 0
        excused_count = 0

        with transaction.atomic():
            for idx, row in enumerate(rows_data):
                student_id = row.get('student_id')
                status = row.get('status', AttendanceStatusChoices.PRESENT)
                row_comments = row.get('comments', comments or '')

                if not student_id:
                    validation_errors[f"rows[{idx}].student_id"] = ["El ID de estudiante es obligatorio."]
                    continue

                try:
                    student_uuid = uuid.UUID(str(student_id))
                except ValueError:
                    validation_errors[f"rows[{idx}].student_id"] = ["ID de estudiante inválido."]
                    continue

                if student_uuid not in active_student_ids:
                    validation_errors[f"rows[{idx}].student_id"] = ["El estudiante no está matriculado activamente en este curso."]
                    continue

                if status not in valid_statuses:
                    validation_errors[f"rows[{idx}].status"] = [f"Estado inválido. Opciones: {', '.join(valid_statuses)}."]
                    continue

                attendance_obj, created = Attendance.objects.update_or_create(
                    student_id=student_uuid,
                    teaching_assignment=assignment,
                    date=date,
                    defaults={
                        'status': status,
                        'comments': row_comments,
                        'updated_by': user,
                    }
                )
                if created:
                    attendance_obj.created_by = user
                    attendance_obj.save(update_fields=['created_by'])

                if status == AttendanceStatusChoices.PRESENT:
                    present_count += 1
                elif status == AttendanceStatusChoices.ABSENT:
                    absent_count += 1
                elif status == AttendanceStatusChoices.LATE:
                    late_count += 1
                elif status == AttendanceStatusChoices.EXCUSED:
                    excused_count += 1

                saved_rows.append(attendance_obj)

            if validation_errors:
                raise ValidationError(validation_errors)

            AuditService.log(
                action='ATTENDANCE_BULK_SAVE',
                entity='TeachingAssignment',
                entity_id=str(assignment.id),
                actor_user=user,
                metadata={
                    'assignment_id': str(assignment.id),
                    'course': f"{assignment.course.name} {assignment.course.parallel}",
                    'subject': assignment.subject.name,
                    'date': str(date),
                    'total': len(saved_rows),
                    'present': present_count,
                    'absent': absent_count,
                    'late': late_count,
                    'excused': excused_count
                },
                ip_address=ip_address
            )

        # Trigger alert evaluation post-commit
        try:
            from apps.alerts.services import AlertEvaluationService
            AlertEvaluationService.evaluate_attendance(saved_rows)
        except Exception:
            pass

        return saved_rows
