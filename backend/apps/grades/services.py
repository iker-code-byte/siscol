from decimal import Decimal
from django.db import transaction
from rest_framework.exceptions import PermissionDenied, ValidationError
from apps.academics.models import TeachingAssignment, Enrollment, Student
from apps.audit.services import AuditService
from .models import Grade, Gradebook, GradeActivity, GradeEntry

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


class GradebookService:

    @staticmethod
    def get_or_create_gradebook(*, user, academic_year_id, academic_period_id, course_id, subject_id, teacher_id=None):
        from apps.academics.models import Course, Subject, Teacher, AcademicYear, AcademicPeriod
        
        try:
            year = AcademicYear.objects.get(id=academic_year_id)
            period = AcademicPeriod.objects.get(id=academic_period_id, academic_year=year)
            course = Course.objects.get(id=course_id, academic_year=year)
            subject = Subject.objects.get(id=subject_id)
        except Exception as e:
            raise ValidationError(f"Parámetros inválidos para libro de calificaciones: {str(e)}")

        if user.role == 'TEACHER':
            if not hasattr(user, 'teacher_profile'):
                raise PermissionDenied("Usuario no tiene perfil docente asignado.")
            teacher = user.teacher_profile
        else:
            if teacher_id:
                teacher = Teacher.objects.get(id=teacher_id)
            else:
                # Find teacher assigned to this teaching assignment
                assignment = TeachingAssignment.objects.filter(
                    academic_year=year, course=course, subject=subject, active=True
                ).first()
                if not assignment:
                    raise ValidationError("No existe asignación docente para este curso y materia.")
                teacher = assignment.teacher

        gradebook, created = Gradebook.objects.get_or_create(
            academic_year=year,
            academic_period=period,
            course=course,
            subject=subject,
            teacher=teacher,
            defaults={'status': 'OPEN'}
        )
        return gradebook

    @staticmethod
    def get_matrix_data(gradebook: Gradebook, user):
        # RBAC Check: Teacher can only view their own gradebook
        if user.role == 'TEACHER':
            if not hasattr(user, 'teacher_profile') or gradebook.teacher_id != user.teacher_profile.id:
                raise PermissionDenied("No tiene permisos para acceder a este libro de calificaciones.")

        # 1. Enrolled students
        enrollments = Enrollment.objects.filter(
            course=gradebook.course,
            academic_year=gradebook.academic_year,
            status='ACTIVE'
        ).select_related('student').order_by('student__last_name', 'student__first_name')

        students_data = [
            {
                'id': str(enr.student.id),
                'code': enr.student.code,
                'first_name': enr.student.first_name,
                'last_name': enr.student.last_name,
                'full_name': f"{enr.student.first_name} {enr.student.last_name}"
            }
            for enr in enrollments
        ]

        # 2. Dynamic activities
        activities = list(
            GradeActivity.objects.filter(gradebook=gradebook, is_active=True)
            .order_by('position', 'created_at')
        )

        from .serializers import GradeActivitySerializer, GradebookSerializer
        activities_data = GradeActivitySerializer(activities, many=True).data

        # 3. Entries
        activity_ids = [act.id for act in activities]
        entries = GradeEntry.objects.filter(activity_id__in=activity_ids)

        # Build matrix: { [student_id]: { [activity_id]: score_number_or_null } }
        matrix = {s['id']: {} for s in students_data}
        for entry in entries:
            s_id = str(entry.student_id)
            a_id = str(entry.activity_id)
            if s_id in matrix:
                matrix[s_id][a_id] = float(entry.score) if entry.score is not None else None

        # Map activity max_scores:
        act_max_scores = {
            str(act.id): float(act.max_score) if (act.max_score and act.max_score > 0) else 45.0
            for act in activities
        }

        # 4. Averages: Simple average of normalized scores (0 to 100 scale)
        # Individual activities are scored up to 45 (or act.max_score).
        # The cumulative/final average is expressed on a 0-100 scale (is_passing >= 51.0).
        averages = {}
        for s in students_data:
            s_id = s['id']
            percentages = []
            for a_id, score_val in matrix[s_id].items():
                if score_val is not None:
                    max_sc = act_max_scores.get(a_id, 45.0)
                    pct = (score_val / max_sc) * 100.0 if max_sc > 0 else 0.0
                    percentages.append(pct)

            if percentages:
                avg = round(sum(percentages) / len(percentages), 1)
                averages[s_id] = {
                    'average': avg,
                    'graded_count': len(percentages),
                    'is_passing': avg >= 51.0
                }
            else:
                averages[s_id] = {
                    'average': None,
                    'graded_count': 0,
                    'is_passing': None
                }

        return {
            'gradebook': GradebookSerializer(gradebook).data,
            'is_closed': gradebook.is_closed,
            'students': students_data,
            'activities': activities_data,
            'matrix': matrix,
            'averages': averages,
            'grading_scale_min': 0,
            'grading_scale_max': 45
        }

    @staticmethod
    def upsert_entry(*, user, activity_id, student_id, score, ip_address=None):
        try:
            activity = GradeActivity.objects.select_related(
                'gradebook__academic_period', 
                'gradebook__teacher', 
                'gradebook__course'
            ).get(id=activity_id, is_active=True)
        except GradeActivity.DoesNotExist:
            raise ValidationError({"activity_id": ["La actividad calificada no existe o fue eliminada."]})

        gradebook = activity.gradebook
        if gradebook.is_closed:
            raise ValidationError("El periodo o libro de calificaciones está cerrado. No se permiten modificaciones.")

        # RBAC Check
        if user.role == 'TEACHER':
            if not hasattr(user, 'teacher_profile') or gradebook.teacher_id != user.teacher_profile.id:
                raise PermissionDenied("No tiene permisos para modificar este libro de calificaciones.")

        # Validate score bounds (score can be None for unrated)
        score_dec = None
        if score is not None and score != '':
            try:
                score_dec = Decimal(str(score))
            except Exception:
                raise ValidationError({"score": ["La calificación debe ser un valor numérico válido."]})

            if score_dec < Decimal('0') or score_dec > activity.max_score:
                raise ValidationError({"score": [f"La nota debe estar entre 0 y {activity.max_score}."]})

        # Validate student belongs to course
        try:
            student = Student.objects.get(id=student_id)
        except Student.DoesNotExist:
            raise ValidationError({"student_id": ["El estudiante especificado no existe."]})

        is_enrolled = Enrollment.objects.filter(
            course=gradebook.course,
            academic_year=gradebook.academic_year,
            student=student,
            status='ACTIVE'
        ).exists()

        if not is_enrolled:
            raise ValidationError({"student_id": ["El estudiante no está matriculado activamente en este curso."]})

        # Upsert entry
        entry, created = GradeEntry.objects.update_or_create(
            activity=activity,
            student=student,
            defaults={
                'score': score_dec,
                'updated_by': user
            }
        )
        if created:
            entry.created_by = user
            entry.save(update_fields=['created_by'])

        # Recalculate student average normalized to 0-100 scale
        all_student_entries = GradeEntry.objects.filter(
            activity__gradebook=gradebook,
            activity__is_active=True,
            student=student,
            score__isnull=False
        ).select_related('activity')
        graded_count = all_student_entries.count()
        if graded_count > 0:
            percentages = []
            for e in all_student_entries:
                max_sc = float(e.activity.max_score) if (e.activity.max_score and e.activity.max_score > 0) else 45.0
                pct = (float(e.score) / max_sc) * 100.0 if max_sc > 0 else 0.0
                percentages.append(pct)
            avg_val = round(sum(percentages) / graded_count, 1)
        else:
            avg_val = None

        # Alert Engine Evaluation (Section 27 & 28 of SDD)
        # Minimum 2 graded activities required to avoid premature alerts
        if graded_count >= 2 and avg_val is not None and avg_val < 51.0:
            try:
                GradebookService._trigger_low_performance_alert(
                    gradebook=gradebook,
                    student=student,
                    average=avg_val,
                    graded_count=graded_count
                )
            except Exception:
                pass

        return {
            'student_id': str(student.id),
            'activity_id': str(activity.id),
            'score': float(entry.score) if entry.score is not None else None,
            'average': avg_val,
            'graded_count': graded_count,
            'is_passing': avg_val >= 51.0 if avg_val is not None else None
        }

    @staticmethod
    def bulk_upsert_matrix(*, user, gradebook_id, entries_data, ip_address=None):
        try:
            gradebook = Gradebook.objects.select_related('academic_period', 'teacher', 'course').get(id=gradebook_id)
        except Gradebook.DoesNotExist:
            raise ValidationError({"gradebook_id": ["El libro de calificaciones no existe."]})

        if gradebook.is_closed:
            raise ValidationError("El libro de calificaciones está cerrado. No se permiten modificaciones.")

        if user.role == 'TEACHER':
            if not hasattr(user, 'teacher_profile') or gradebook.teacher_id != user.teacher_profile.id:
                raise PermissionDenied("No tiene permisos para modificar este libro de calificaciones.")

        updated_results = []
        with transaction.atomic():
            for item in entries_data:
                res = GradebookService.upsert_entry(
                    user=user,
                    activity_id=item['activity_id'],
                    student_id=item['student_id'],
                    score=item.get('score'),
                    ip_address=ip_address
                )
                updated_results.append(res)

        return updated_results

    @staticmethod
    def _trigger_low_performance_alert(*, gradebook: Gradebook, student: Student, average: float, graded_count: int):
        from apps.alerts.models import NotificationRule, AlertEvent, AlertSeverityChoices, AlertStatusChoices
        rules = NotificationRule.objects.filter(type='LOW_GRADE', enabled=True)
        if not rules.exists():
            return

        rule = rules.first()
        fingerprint = f"LOW_AVG:{gradebook.id}:{student.id}:{gradebook.academic_period_id}"
        
        event, created = AlertEvent.objects.get_or_create(
            fingerprint=fingerprint,
            defaults={
                'rule': rule,
                'student': student,
                'source_type': 'GRADE',
                'source_id': str(gradebook.id),
                'severity': AlertSeverityChoices.CRITICAL if average < 35 else AlertSeverityChoices.WARNING,
                'status': AlertStatusChoices.OPEN,
                'metadata': {
                    'gradebook_id': str(gradebook.id),
                    'average': average,
                    'graded_count': graded_count,
                    'course_name': f"{gradebook.course.name} {gradebook.course.parallel}",
                    'subject_name': gradebook.subject.name,
                    'period_name': gradebook.academic_period.name,
                    'teacher_name': f"{gradebook.teacher.first_name} {gradebook.teacher.last_name}"
                }
            }
        )
        if created:
            try:
                from apps.notifications.services import NotificationComposer
                NotificationComposer.dispatch_alert_event(event)
            except Exception:
                pass
