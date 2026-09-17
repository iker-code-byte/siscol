from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from apps.accounts.permissions import IsAdminOrTeacher, IsStudentRole
from apps.academics.models import AcademicPeriod
from .models import Grade, Gradebook, GradeActivity, GradeEntry
from .serializers import (
    GradeSerializer, GradeBulkRequestSerializer,
    AcademicPeriodSerializer, GradebookSerializer, GradeActivitySerializer,
    GradeEntrySerializer, GradeEntryUpsertSerializer, GradeBulkMatrixUpsertSerializer
)
from .services import GradeBulkService, GradebookService

class AcademicPeriodViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AcademicPeriodSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = AcademicPeriod.objects.all().select_related('academic_year')
        year_id = self.request.query_params.get('academic_year_id')
        if year_id:
            qs = qs.filter(academic_year_id=year_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs.order_by('academic_year', 'number')

class GradebookViewSet(viewsets.ModelViewSet):
    serializer_class = GradebookSerializer
    permission_classes = [IsAdminOrTeacher]

    def get_queryset(self):
        user = self.request.user
        qs = Gradebook.objects.all().select_related(
            'academic_year', 'academic_period', 'course', 'subject', 'teacher'
        ).prefetch_related('activities')

        if user.role == 'TEACHER':
            if hasattr(user, 'teacher_profile'):
                qs = qs.filter(teacher=user.teacher_profile)
            else:
                return qs.none()

        year_id = self.request.query_params.get('academic_year_id')
        period_id = self.request.query_params.get('academic_period_id')
        course_id = self.request.query_params.get('course_id')
        subject_id = self.request.query_params.get('subject_id')

        if year_id:
            qs = qs.filter(academic_year_id=year_id)
        if period_id:
            qs = qs.filter(academic_period_id=period_id)
        if course_id:
            qs = qs.filter(course_id=course_id)
        if subject_id:
            qs = qs.filter(subject_id=subject_id)

        return qs

    @action(detail=False, methods=['post'], url_path='get-or-create')
    def get_or_create_gradebook(self, request):
        academic_year_id = request.data.get('academic_year_id')
        academic_period_id = request.data.get('academic_period_id')
        course_id = request.data.get('course_id')
        subject_id = request.data.get('subject_id')
        teacher_id = request.data.get('teacher_id')

        if not all([academic_year_id, academic_period_id, course_id, subject_id]):
            raise ValidationError("academic_year_id, academic_period_id, course_id y subject_id son obligatorios.")

        gradebook = GradebookService.get_or_create_gradebook(
            user=request.user,
            academic_year_id=academic_year_id,
            academic_period_id=academic_period_id,
            course_id=course_id,
            subject_id=subject_id,
            teacher_id=teacher_id
        )
        return Response(GradebookSerializer(gradebook).data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['get'], url_path='matrix')
    def matrix(self, request, pk=None):
        gradebook = self.get_object()
        data = GradebookService.get_matrix_data(gradebook, request.user)
        return Response(data, status=status.HTTP_200_OK)

    @action(detail=True, methods=['post'], url_path='activities')
    def add_activity(self, request, pk=None):
        gradebook = self.get_object()
        if gradebook.is_closed:
            raise ValidationError("El libro de calificaciones o periodo está cerrado.")

        if request.user.role == 'TEACHER':
            if not hasattr(request.user, 'teacher_profile') or gradebook.teacher_id != request.user.teacher_profile.id:
                raise PermissionDenied("No tiene permisos para modificar este libro de calificaciones.")

        name = request.data.get('name')
        if not name:
            raise ValidationError({"name": ["El nombre de la actividad es obligatorio."]})

        activity_type = request.data.get('activity_type', 'TASK')
        activity_date = request.data.get('activity_date')
        if not activity_date:
            from django.utils import timezone
            activity_date = timezone.now().date().isoformat()

        max_score = request.data.get('max_score', 45.00)
        description = request.data.get('description', '')
        weight = request.data.get('weight')

        # Compute next position
        last_pos = GradeActivity.objects.filter(gradebook=gradebook).order_by('-position').values_list('position', flat=True).first()
        next_pos = (last_pos + 1) if last_pos is not None else 0

        activity = GradeActivity.objects.create(
            gradebook=gradebook,
            name=name,
            description=description,
            activity_type=activity_type,
            activity_date=activity_date,
            max_score=max_score,
            weight=weight,
            position=next_pos,
            is_active=True
        )
        return Response(GradeActivitySerializer(activity).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['put'], url_path='grades/bulk')
    def bulk_matrix_grades(self, request, pk=None):
        serializer = GradeBulkMatrixUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        entries_data = serializer.validated_data['entries']

        ip_address = request.META.get('REMOTE_ADDR')
        results = GradebookService.bulk_upsert_matrix(
            user=request.user,
            gradebook_id=pk,
            entries_data=entries_data,
            ip_address=ip_address
        )
        return Response({
            "message": f"Se actualizaron {len(results)} celdas de calificación.",
            "results": results
        }, status=status.HTTP_200_OK)

class GradeActivityViewSet(viewsets.ModelViewSet):
    serializer_class = GradeActivitySerializer
    permission_classes = [IsAdminOrTeacher]
    http_method_names = ['get', 'patch', 'delete']

    def get_queryset(self):
        user = self.request.user
        qs = GradeActivity.objects.filter(is_active=True).select_related(
            'gradebook__teacher', 'gradebook__academic_period'
        )
        if user.role == 'TEACHER':
            if hasattr(user, 'teacher_profile'):
                qs = qs.filter(gradebook__teacher=user.teacher_profile)
            else:
                return qs.none()
        return qs

    def perform_destroy(self, instance):
        if instance.gradebook.is_closed:
            raise ValidationError("No se puede eliminar la actividad de un periodo cerrado.")
        # Soft delete to preserve historical integrity
        instance.is_active = False
        instance.save(update_fields=['is_active'])

class GradeEntryUpsertView(APIView):
    permission_classes = [IsAdminOrTeacher]

    def put(self, request):
        serializer = GradeEntryUpsertSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        ip_address = request.META.get('REMOTE_ADDR')
        result = GradebookService.upsert_entry(
            user=request.user,
            activity_id=data['activity_id'],
            student_id=data['student_id'],
            score=data.get('score'),
            ip_address=ip_address
        )
        return Response(result, status=status.HTTP_200_OK)

# Legacy viewset & views
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

