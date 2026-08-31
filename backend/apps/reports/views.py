from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from django.db.models import Avg, Count, Q
from apps.accounts.permissions import IsAdminRole, IsTeacherRole, IsAdminOrTeacher
from apps.academics.models import Student, Teacher, Guardian, TeachingAssignment, Enrollment
from apps.grades.models import Grade
from apps.attendance.models import Attendance, AttendanceStatusChoices
from apps.guardians.models import GuardianDevice
from apps.alerts.models import AlertEvent
from apps.notifications.models import Notification, NotificationDelivery
from apps.qa.models import Question

class AdminOverviewReportView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request):
        total_students = Student.objects.filter(active=True).count()
        total_teachers = Teacher.objects.count()
        total_guardians = Guardian.objects.filter(active=True).count()
        total_devices = GuardianDevice.objects.filter(is_active=True).count()
        open_alerts = AlertEvent.objects.filter(status='OPEN').count()
        total_notifications = Notification.objects.count()
        total_deliveries = NotificationDelivery.objects.count()
        sent_deliveries = NotificationDelivery.objects.filter(status='SENT').count()

        delivery_rate = round((sent_deliveries / total_deliveries) * 100, 1) if total_deliveries > 0 else 100.0

        # Recent open alerts
        recent_alerts = AlertEvent.objects.filter(status='OPEN').select_related('rule', 'student').order_by('-first_detected_at')[:5]
        alerts_summary = [
            {
                "id": str(al.id),
                "rule_name": al.rule.name,
                "student_name": f"{al.student.first_name} {al.student.last_name}",
                "severity": al.severity,
                "date": al.first_detected_at.strftime('%Y-%m-%d %H:%M')
            }
            for al in recent_alerts
        ]

        return Response({
            "metrics": {
                "total_students": total_students,
                "total_teachers": total_teachers,
                "total_guardians": total_guardians,
                "linked_devices": total_devices,
                "open_alerts": open_alerts,
                "total_notifications": total_notifications,
                "delivery_success_rate": delivery_rate
            },
            "recent_alerts": alerts_summary
        })

class TeacherCourseSummaryReportView(APIView):
    permission_classes = [IsAdminOrTeacher]

    def get(self, request):
        user = request.user
        assignment_id = request.query_params.get('teaching_assignment_id')

        if not assignment_id:
            return Response({"error": {"code": "VALIDATION_ERROR", "message": "El parámetro teaching_assignment_id es requerido."}}, status=400)

        try:
            assignment = TeachingAssignment.objects.select_related('course', 'subject', 'teacher').get(id=assignment_id)
        except TeachingAssignment.DoesNotExist:
            raise NotFound("Asignación docente no encontrada.")

        if user.role == 'TEACHER':
            if not hasattr(user, 'teacher_profile') or assignment.teacher_id != user.teacher_profile.id:
                raise PermissionDenied("No tiene permisos para consultar reportes de esta asignación.")

        enrolled_students_count = Enrollment.objects.filter(
            course=assignment.course,
            academic_year=assignment.academic_year,
            status='ACTIVE'
        ).count()

        grades = Grade.objects.filter(teaching_assignment=assignment)
        avg_grade = grades.aggregate(avg=Avg('score'))['avg']
        avg_grade_val = round(float(avg_grade), 1) if avg_grade else 0.0

        # Percentage calculation for pass / fail
        total_evals = grades.count()
        failing_grades_count = grades.filter(score__lt=51).count()
        passing_grades_count = grades.filter(score__gte=51).count()

        # Attendance stats for this assignment
        attendances = Attendance.objects.filter(teaching_assignment=assignment)
        total_att = attendances.count()
        presents = attendances.filter(status=AttendanceStatusChoices.PRESENT).count()
        absences = attendances.filter(status=AttendanceStatusChoices.ABSENT).count()
        lates = attendances.filter(status=AttendanceStatusChoices.LATE).count()
        att_rate = round((presents / total_att) * 100, 1) if total_att > 0 else 100.0

        # Pending questions
        pending_questions = Question.objects.filter(teaching_assignment=assignment, status='OPEN').count()

        return Response({
            "assignment": {
                "id": str(assignment.id),
                "course_name": f"{assignment.course.name} {assignment.course.parallel}",
                "subject_name": assignment.subject.name,
                "teacher_name": f"{assignment.teacher.first_name} {assignment.teacher.last_name}"
            },
            "students_count": enrolled_students_count,
            "grades": {
                "total_evaluations": total_evals,
                "average_score": avg_grade_val,
                "passing_count": passing_grades_count,
                "failing_count": failing_grades_count
            },
            "attendance": {
                "total_records": total_att,
                "attendance_rate": att_rate,
                "present_count": presents,
                "absent_count": absences,
                "late_count": lates
            },
            "pending_questions": pending_questions
        })
