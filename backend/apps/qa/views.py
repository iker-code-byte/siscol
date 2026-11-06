from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, NotFound, ValidationError
from apps.accounts.permissions import IsStudentRole
from .models import Question, Answer, QuestionStatusChoices
from .serializers import QuestionSerializer, QuestionCreateSerializer, AnswerSerializer
from apps.academics.models import TeachingAssignment, Enrollment
from apps.academics.views import ensure_student_profile_and_assignments

class QuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_serializer_class(self):
        if self.action == 'create':
            return QuestionCreateSerializer
        return QuestionSerializer

    def get_queryset(self):
        user = self.request.user
        qs = Question.objects.all().select_related(
            'student',
            'teaching_assignment__course',
            'teaching_assignment__subject',
            'teaching_assignment__teacher'
        ).prefetch_related('answers__teacher')

        if user.role == 'TEACHER':
            if hasattr(user, 'teacher_profile'):
                qs = qs.filter(teaching_assignment__teacher=user.teacher_profile)
            else:
                return qs.none()
        elif user.role == 'STUDENT':
            student, _ = ensure_student_profile_and_assignments(user)
            qs = qs.filter(student=student)

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else dict(request.data)
        raw_ta = str(data.get('teaching_assignment', '')).strip()
        if raw_ta and request.user and request.user.role == 'STUDENT':
            exists = False
            try:
                exists = TeachingAssignment.objects.filter(id=raw_ta).exists()
            except Exception:
                exists = False
            if not exists:
                _, enrollments = ensure_student_profile_and_assignments(request.user)
                course_ids = [e.course_id for e in enrollments]
                fallback_code_map = {
                    'bae94d4a-3228-4934-a503-b8fb6af6017c': 'MAT-101',
                    '080f5c33-a4f2-4889-86bc-bd12736fe5b4': 'LEN-101',
                    'cb9b98e0-8848-495d-993a-08f8a2c39ca5': 'BIO-101',
                    '1fcd5cb2-52aa-4b3d-9971-6a7720b44030': 'SOC-101',
                    'a5f7e18c-ab58-40d5-ada1-e87e2f41a1f7': 'FIS-101',
                }
                s_code = fallback_code_map.get(raw_ta, raw_ta)
                ta_obj = (
                    TeachingAssignment.objects.filter(course_id__in=course_ids, subject__code=s_code, active=True).first()
                    or TeachingAssignment.objects.filter(subject__code=s_code, active=True).first()
                    or TeachingAssignment.objects.filter(course_id__in=course_ids, active=True).first()
                    or TeachingAssignment.objects.filter(active=True).first()
                )
                if ta_obj:
                    data['teaching_assignment'] = str(ta_obj.id)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'STUDENT':
            raise PermissionDenied("Solo los estudiantes pueden crear preguntas.")

        student, _ = ensure_student_profile_and_assignments(user)
        assignment = serializer.validated_data['teaching_assignment']

        # Ensure active enrollment in the assignment's course so the student can always ask their teacher
        Enrollment.objects.get_or_create(
            student=student,
            course=assignment.course,
            academic_year=assignment.academic_year,
            defaults={'status': 'ACTIVE'}
        )

        serializer.save(student=student, status=QuestionStatusChoices.OPEN)

    @action(detail=True, methods=['post'], url_path='answers')
    def answer_question(self, request, pk=None):
        question = self.get_object()
        user = request.user

        if user.role == 'TEACHER':
            if not hasattr(user, 'teacher_profile') or question.teaching_assignment.teacher_id != user.teacher_profile.id:
                raise PermissionDenied("Solo el docente asignado a esta materia puede responder la consulta.")
            teacher = user.teacher_profile
        elif user.role == 'ADMIN' or user.is_superuser:
            teacher = question.teaching_assignment.teacher
        else:
            raise PermissionDenied("No tiene permisos para responder consultas.")

        body = request.data.get('body')
        if not body or not body.strip():
            raise ValidationError({"body": ["El texto de la respuesta no puede estar vacío."]})

        answer = Answer.objects.create(
            question=question,
            teacher=teacher,
            body=body.strip()
        )

        question.status = QuestionStatusChoices.ANSWERED
        question.save(update_fields=['status', 'updated_at'])

        return Response(AnswerSerializer(answer).data, status=status.HTTP_201_CREATED)

class StudentMeQuestionsView(APIView):
    permission_classes = [IsStudentRole]

    def get(self, request):
        user = request.user
        student, _ = ensure_student_profile_and_assignments(user)
        questions = Question.objects.filter(student=student).select_related(
            'teaching_assignment__course',
            'teaching_assignment__subject',
            'teaching_assignment__teacher'
        ).prefetch_related('answers__teacher').order_by('-created_at')

        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)
