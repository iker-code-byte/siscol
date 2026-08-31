from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.exceptions import PermissionDenied, NotFound
from apps.accounts.permissions import IsAdminOrTeacher, IsStudentRole
from .models import Attendance, AttendanceStatusChoices
from .serializers import AttendanceSerializer, AttendanceBulkRequestSerializer
from .services import AttendanceBulkService

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        qs = Attendance.objects.all().select_related(
            'student',
            'teaching_assignment__course',
            'teaching_assignment__subject',
            'teaching_assignment__teacher'
        )

        if user.role == 'TEACHER':
            if hasattr(user, 'teacher_profile'):
                qs = qs.filter(teaching_assignment__teacher=user.teacher_profile)
            else:
                return qs.none()

        course_id = self.request.query_params.get('course_id')
        subject_id = self.request.query_params.get('subject_id')
        teaching_assignment_id = self.request.query_params.get('teaching_assignment_id')
        date = self.request.query_params.get('date')
        student_id = self.request.query_params.get('student_id')

        if course_id:
            qs = qs.filter(teaching_assignment__course_id=course_id)
        if subject_id:
            qs = qs.filter(teaching_assignment__subject_id=subject_id)
        if teaching_assignment_id:
            qs = qs.filter(teaching_assignment_id=teaching_assignment_id)
        if date:
            qs = qs.filter(date=date)
        if student_id:
            qs = qs.filter(student_id=student_id)

        return qs.order_by('-date', 'student__last_name')

class AttendanceBulkView(APIView):
    permission_classes = [IsAdminOrTeacher]

    def post(self, request):
        serializer = AttendanceBulkRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ip_address = request.META.get('REMOTE_ADDR')
        saved_rows = AttendanceBulkService.save_bulk_attendance(
            user=request.user,
            teaching_assignment_id=data['teaching_assignment_id'],
            date=data['date'],
            rows_data=data['rows'],
            comments=data.get('comments'),
            ip_address=ip_address
        )

        return Response({
            "message": f"Se registró la asistencia para {len(saved_rows)} estudiantes.",
            "count": len(saved_rows),
            "rows": AttendanceSerializer(saved_rows, many=True).data
        }, status=status.HTTP_200_OK)

class StudentMeAttendanceView(APIView):
    permission_classes = [IsStudentRole]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'student_profile') or not user.student_profile:
            raise NotFound("No se encontró un perfil de estudiante vinculado a esta cuenta.")

        student = user.student_profile
        attendances = Attendance.objects.filter(student=student).select_related(
            'teaching_assignment__course',
            'teaching_assignment__subject',
            'teaching_assignment__teacher'
        ).order_by('-date')

        subject_id = request.query_params.get('subject_id')
        if subject_id:
            attendances = attendances.filter(teaching_assignment__subject_id=subject_id)

        total = attendances.count()
        presents = attendances.filter(status=AttendanceStatusChoices.PRESENT).count()
        absences = attendances.filter(status=AttendanceStatusChoices.ABSENT).count()
        lates = attendances.filter(status=AttendanceStatusChoices.LATE).count()
        excused = attendances.filter(status=AttendanceStatusChoices.EXCUSED).count()

        attendance_rate = round((presents / total) * 100, 1) if total > 0 else 100.0

        serializer = AttendanceSerializer(attendances, many=True)
        return Response({
            "student": {
                "id": str(student.id),
                "name": f"{student.first_name} {student.last_name}",
                "code": student.code
            },
            "stats": {
                "total": total,
                "present": presents,
                "absent": absences,
                "late": lates,
                "excused": excused,
                "attendance_rate": attendance_rate
            },
            "results": serializer.data
        })
