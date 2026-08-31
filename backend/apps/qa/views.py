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

class QuestionViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated]

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
            if hasattr(user, 'student_profile'):
                qs = qs.filter(student=user.student_profile)
            else:
                return qs.none()

        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.role != 'STUDENT' or not hasattr(user, 'student_profile') or not user.student_profile:
            raise PermissionDenied("Solo los estudiantes pueden crear preguntas.")

        student = user.student_profile
        assignment = serializer.validated_data['teaching_assignment']

        # Verify active enrollment
        is_enrolled = Enrollment.objects.filter(
            student=student,
            course=assignment.course,
            academic_year=assignment.academic_year,
            status='ACTIVE'
        ).exists()

        if not is_enrolled:
            raise ValidationError({"teaching_assignment": ["No estás matriculado en el curso correspondiente a esta materia."]})

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
        if not hasattr(user, 'student_profile') or not user.student_profile:
            raise NotFound("No se encontró un perfil de estudiante vinculado a esta cuenta.")

        student = user.student_profile
        questions = Question.objects.filter(student=student).select_related(
            'teaching_assignment__course',
            'teaching_assignment__subject',
            'teaching_assignment__teacher'
        ).prefetch_related('answers__teacher').order_by('-created_at')

        serializer = QuestionSerializer(questions, many=True)
        return Response(serializer.data)
