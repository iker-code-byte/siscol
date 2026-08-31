from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.academics.models import TeachingAssignment, Enrollment, Student
from apps.audit.services import AuditService
from .models import Grade

class GradeBulkService:
    @staticmethod
    def save_bulk_grades(*, user, teaching_assignment_id, term, activity_name, max_score, date, grades_data, comments=None, ip_address=None):
        try:
            assignment = TeachingAssignment.objects.select_related('teacher', 'course', 'subject').get(id=teaching_assignment_id)
        except TeachingAssignment.DoesNotExist:
            raise ValidationError({"teaching_assignment_id": ["La asignación docente no existe."]})

        if user.role == 'TEACHER':
            if not hasattr(user, 'teacher_profile') or assignment.teacher_id != user.teacher_profile.id:
                raise PermissionDenied("No tiene permisos para calificar en esta asignación docente.")

        try:
            max_score_dec = Decimal(str(max_score))
            if max_score_dec <= 0:
                raise ValidationError({"max_score": ["El puntaje máximo debe ser mayor a 0."]})
        except Exception:
            raise ValidationError({"max_score": ["Puntaje máximo inválido."]})

        active_student_ids = set(
            Enrollment.objects.filter(
                course=assignment.course,
                academic_year=assignment.academic_year,
                status='ACTIVE'
            ).values_list('student_id', flat=True)
        )

        saved_grades = []
        created_count = 0
        updated_count = 0
        validation_errors = {}

        with transaction.atomic():
            for idx, row in enumerate(grades_data):
                student_id = row.get('student_id')
                score_raw = row.get('score')
                row_comments = row.get('comments', comments or '')
                row_id = row.get('id') # existing grade id if edit

                if not student_id:
                    validation_errors[f"grades[{idx}].student_id"] = ["El ID de estudiante es obligatorio."]
                    continue

                import uuid
                try:
                    student_uuid = uuid.UUID(str(student_id))
                except ValueError:
                    validation_errors[f"grades[{idx}].student_id"] = ["ID de estudiante inválido."]
                    continue

                if student_uuid not in active_student_ids:
                    validation_errors[f"grades[{idx}].student_id"] = ["El estudiante no está matriculado activamente en este curso."]
                    continue

                if score_raw is None or score_raw == '':
                    continue

                try:
                    score_dec = Decimal(str(score_raw))
                except Exception:
                    validation_errors[f"grades[{idx}].score"] = ["La calificación debe ser un valor numérico."]
                    continue

                if score_dec < 0 or score_dec > max_score_dec:
                    validation_errors[f"grades[{idx}].score"] = [f"La nota debe estar entre 0 y {max_score_dec}."]
                    continue

                if row_id:
                    try:
                        grade_obj = Grade.objects.get(id=row_id, student_id=student_uuid, teaching_assignment=assignment)
                        grade_obj.score = score_dec
                        grade_obj.max_score = max_score_dec
                        grade_obj.term = term
                        grade_obj.activity_name = activity_name
                        grade_obj.date = date
                        grade_obj.comments = row_comments
                        grade_obj.updated_by = user
                        grade_obj.save()
                        saved_grades.append(grade_obj)
                        updated_count += 1
                    except Grade.DoesNotExist:
                        grade_obj = Grade.objects.create(
                            student_id=student_uuid,
                            teaching_assignment=assignment,
                            term=term,
                            activity_name=activity_name,
                            score=score_dec,
                            max_score=max_score_dec,
                            date=date,
                            comments=row_comments,
                            created_by=user,
                            updated_by=user
                        )
                        saved_grades.append(grade_obj)
                        created_count += 1
                else:
                    grade_obj, created = Grade.objects.update_or_create(
                        student_id=student_uuid,
                        teaching_assignment=assignment,
                        term=term,
                        activity_name=activity_name,
                        date=date,
                        defaults={
                            'score': score_dec,
                            'max_score': max_score_dec,
                            'comments': row_comments,
                            'updated_by': user,
                        }
                    )
                    if created:
                        grade_obj.created_by = user
                        grade_obj.save(update_fields=['created_by'])
                        created_count += 1
                    else:
                        updated_count += 1
                    saved_grades.append(grade_obj)

            if validation_errors:
                raise ValidationError(validation_errors)

            AuditService.log(
                action='GRADE_BULK_SAVE',
                entity='TeachingAssignment',
                entity_id=str(assignment.id),
                actor_user=user,
                metadata={
                    'assignment_id': str(assignment.id),
                    'course': f"{assignment.course.name} {assignment.course.parallel}",
                    'subject': assignment.subject.name,
                    'term': term,
                    'activity_name': activity_name,
                    'created_count': created_count,
                    'updated_count': updated_count,
                    'total': len(saved_grades)
                },
                ip_address=ip_address
            )

        # Trigger alert evaluation asynchronously/post-commit
        try:
            from apps.alerts.services import AlertEvaluationService
            AlertEvaluationService.evaluate_grades(saved_grades)
        except Exception:
            pass

        return saved_grades
