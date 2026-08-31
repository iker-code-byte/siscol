from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound
from apps.accounts.permissions import IsAdminOrTeacher, IsStudentRole
from .models import Grade
from .serializers import GradeSerializer, GradeBulkRequestSerializer
from .services import GradeBulkService

class GradeViewSet(viewsets.ModelViewSet):
    serializer_class = GradeSerializer
    permission_classes = [IsAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        qs = Grade.objects.all().select_related(
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
        term = self.request.query_params.get('term')
        student_id = self.request.query_params.get('student_id')

        if course_id:
            qs = qs.filter(teaching_assignment__course_id=course_id)
        if subject_id:
            qs = qs.filter(teaching_assignment__subject_id=subject_id)
        if teaching_assignment_id:
            qs = qs.filter(teaching_assignment_id=teaching_assignment_id)
        if term:
            qs = qs.filter(term=term)
        if student_id:
            qs = qs.filter(student_id=student_id)

        return qs.order_by('-date', 'student__last_name')

class GradeBulkView(APIView):
    permission_classes = [IsAdminOrTeacher]

    def post(self, request):
        serializer = GradeBulkRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ip_address = request.META.get('REMOTE_ADDR')
        saved_grades = GradeBulkService.save_bulk_grades(
            user=request.user,
            teaching_assignment_id=data['teaching_assignment_id'],
            term=data['term'],
            activity_name=data['activity_name'],
            max_score=data['max_score'],
            date=data['date'],
            grades_data=data['grades'],
            comments=data.get('comments'),
            ip_address=ip_address
        )

        return Response({
            "message": f"Se guardaron {len(saved_grades)} calificaciones correctamente.",
            "count": len(saved_grades),
            "grades": GradeSerializer(saved_grades, many=True).data
        }, status=status.HTTP_200_OK)

class StudentMeGradesView(APIView):
    permission_classes = [IsStudentRole]

    def get(self, request):
        user = request.user
        if not hasattr(user, 'student_profile') or not user.student_profile:
            raise NotFound("No se encontró un perfil de estudiante vinculado a esta cuenta.")

        student = user.student_profile
        grades = Grade.objects.filter(student=student).select_related(
            'teaching_assignment__course',
            'teaching_assignment__subject',
            'teaching_assignment__teacher'
        ).order_by('-date', 'teaching_assignment__subject__name')

        term = request.query_params.get('term')
        if term:
            grades = grades.filter(term=term)

        serializer = GradeSerializer(grades, many=True)
        return Response({
            "student": {
                "id": str(student.id),
                "name": f"{student.first_name} {student.last_name}",
                "code": student.code
            },
            "results": serializer.data
        })
