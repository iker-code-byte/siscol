from decimal import Decimal
from datetime import timedelta
from django.utils import timezone
from django.db import transaction
from apps.grades.models import Grade
from apps.attendance.models import Attendance, AttendanceStatusChoices
from apps.academics.models import Student
from .models import NotificationRule, AlertEvent, AlertSeverityChoices, AlertStatusChoices

class AlertEvaluationService:
    @staticmethod
    def evaluate_grades(grades_list: list[Grade]) -> list[AlertEvent]:
        active_rules = NotificationRule.objects.filter(type='LOW_GRADE', enabled=True)
        if not active_rules.exists() or not grades_list:
            return []

        generated_events = []

        for rule in active_rules:
            threshold = rule.threshold_value or Decimal('51.00')

            for grade in grades_list:
                # Calculate percentage score if max_score > 0
                max_sc = grade.max_score if grade.max_score and grade.max_score > 0 else Decimal('100.00')
                percentage = (Decimal(str(grade.score)) / Decimal(str(max_sc))) * Decimal('100.00')

                if percentage < threshold:
                    fingerprint = f"LOW_GRADE:{grade.student_id}:{grade.id}"
                    
                    event, created = AlertEvent.objects.get_or_create(
                        fingerprint=fingerprint,
                        defaults={
                            'rule': rule,
                            'student': grade.student,
                            'source_type': 'GRADE',
                            'source_id': str(grade.id),
                            'severity': AlertSeverityChoices.WARNING if percentage >= 35 else AlertSeverityChoices.CRITICAL,
                            'status': AlertStatusChoices.OPEN,
                            'metadata': {
                                'grade_id': str(grade.id),
                                'score': float(grade.score),
                                'max_score': float(grade.max_score),
                                'percentage': float(round(percentage, 1)),
                                'activity_name': grade.activity_name,
                                'term': grade.term,
                                'date': str(grade.date),
                                'subject_name': grade.teaching_assignment.subject.name,
                                'course_name': f"{grade.teaching_assignment.course.name} {grade.teaching_assignment.course.parallel}",
                                'teacher_name': f"{grade.teaching_assignment.teacher.first_name} {grade.teaching_assignment.teacher.last_name}"
                            }
                        }
                    )

                    if created:
                        generated_events.append(event)
                        # Dispatch notification
                        try:
                            from apps.notifications.services import NotificationComposer
                            NotificationComposer.dispatch_alert_event(event)
                        except Exception:
                            pass

        return generated_events

    @staticmethod
    def evaluate_attendance(attendance_list: list[Attendance]) -> list[AlertEvent]:
        if not attendance_list:
            return []

        absence_rules = NotificationRule.objects.filter(type='ABSENCE', enabled=True)
        late_rules = NotificationRule.objects.filter(type='LATE', enabled=True)
        repeated_rules = NotificationRule.objects.filter(type='REPEATED_ABSENCE', enabled=True)

        generated_events = []
        affected_student_ids = set()

        for att in attendance_list:
            affected_student_ids.add(att.student_id)

            if att.status == AttendanceStatusChoices.ABSENT and absence_rules.exists():
                for rule in absence_rules:
                    fingerprint = f"ABSENCE:{att.student_id}:{att.id}"
                    event, created = AlertEvent.objects.get_or_create(
                        fingerprint=fingerprint,
                        defaults={
                            'rule': rule,
                            'student': att.student,
                            'source_type': 'ATTENDANCE',
                            'source_id': str(att.id),
                            'severity': AlertSeverityChoices.WARNING,
                            'status': AlertStatusChoices.OPEN,
                            'metadata': {
                                'attendance_id': str(att.id),
                                'date': str(att.date),
                                'status': att.status,
                                'subject_name': att.teaching_assignment.subject.name,
                                'course_name': f"{att.teaching_assignment.course.name} {att.teaching_assignment.course.parallel}",
                                'teacher_name': f"{att.teaching_assignment.teacher.first_name} {att.teaching_assignment.teacher.last_name}"
                            }
                        }
                    )
                    if created:
                        generated_events.append(event)
                        try:
                            from apps.notifications.services import NotificationComposer
                            NotificationComposer.dispatch_alert_event(event)
                        except Exception:
                            pass

            elif att.status == AttendanceStatusChoices.LATE and late_rules.exists():
                for rule in late_rules:
                    fingerprint = f"LATE:{att.student_id}:{att.id}"
                    event, created = AlertEvent.objects.get_or_create(
                        fingerprint=fingerprint,
                        defaults={
                            'rule': rule,
                            'student': att.student,
                            'source_type': 'ATTENDANCE',
                            'source_id': str(att.id),
                            'severity': AlertSeverityChoices.INFO,
                            'status': AlertStatusChoices.OPEN,
                            'metadata': {
                                'attendance_id': str(att.id),
                                'date': str(att.date),
                                'status': att.status,
                                'subject_name': att.teaching_assignment.subject.name,
                                'course_name': f"{att.teaching_assignment.course.name} {att.teaching_assignment.course.parallel}",
                            }
                        }
                    )
                    if created:
                        generated_events.append(event)
                        try:
                            from apps.notifications.services import NotificationComposer
                            NotificationComposer.dispatch_alert_event(event)
                        except Exception:
                            pass

        # Check repeated absences for affected students
        if repeated_rules.exists():
            now = timezone.now().date()
            for rule in repeated_rules:
                threshold_count = int(rule.threshold_value or 3)
                period_days = int(rule.period_days or 15)
                start_date = now - timedelta(days=period_days)

                for student_id in affected_student_ids:
                    recent_absences_count = Attendance.objects.filter(
                        student_id=student_id,
                        status=AttendanceStatusChoices.ABSENT,
                        date__gte=start_date,
                        date__lte=now
                    ).count()

                    if recent_absences_count >= threshold_count:
                        # Fingerprint incorporates start_date window to allow new events after cooldown period
                        fingerprint = f"REPEATED_ABSENCE:{student_id}:{rule.id}:{start_date}"
                        student = Student.objects.get(id=student_id)

                        event, created = AlertEvent.objects.get_or_create(
                            fingerprint=fingerprint,
                            defaults={
                                'rule': rule,
                                'student': student,
                                'source_type': 'AGGREGATE',
                                'severity': AlertSeverityChoices.CRITICAL,
                                'status': AlertStatusChoices.OPEN,
                                'metadata': {
                                    'count': recent_absences_count,
                                    'period_days': period_days,
                                    'start_date': str(start_date),
                                    'end_date': str(now)
                                }
                            }
                        )
                        if created:
                            generated_events.append(event)
                            try:
                                from apps.notifications.services import NotificationComposer
                                NotificationComposer.dispatch_alert_event(event)
                            except Exception:
                                pass

        return generated_events

    @staticmethod
    def run_full_evaluation() -> dict:
        recent_grades = list(Grade.objects.all().order_by('-date')[:200])
        recent_attendance = list(Attendance.objects.all().order_by('-date')[:200])

        grade_events = AlertEvaluationService.evaluate_grades(recent_grades)
        att_events = AlertEvaluationService.evaluate_attendance(recent_attendance)

        return {
            "grade_events_created": len(grade_events),
            "attendance_events_created": len(att_events),
            "total_new_events": len(grade_events) + len(att_events)
        }
