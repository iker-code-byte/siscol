from django.db.models import Count, Prefetch, Q
from rest_framework import viewsets, permissions
from apps.accounts.permissions import IsAdminRole, IsTeacherRole, IsAdminOrTeacher
from .models import (
    AcademicYear, Course, Subject, Teacher, Student, Guardian, 
    StudentGuardian, Enrollment, TeachingAssignment
)
from .serializers import (
    AcademicYearSerializer, CourseSerializer, SubjectSerializer, 
    TeacherSerializer, StudentSerializer, GuardianSerializer, 
    StudentGuardianSerializer, EnrollmentSerializer, TeachingAssignmentSerializer
)

class AcademicYearViewSet(viewsets.ModelViewSet):
    queryset = AcademicYear.objects.all().order_by('-start_date')
    serializer_class = AcademicYearSerializer
    permission_classes = [IsAdminOrTeacher]
    pagination_class = None

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().select_related('academic_year').annotate(
        active_students_count=Count('enrollments', filter=Q(enrollments__status='ACTIVE'))
    ).order_by('name', 'parallel')
    serializer_class = CourseSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrTeacher()]

    def get_queryset(self):
        qs = super().get_queryset()
        academic_year_id = self.request.query_params.get('academic_year_id')
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)
        return qs

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().order_by('name')
    serializer_class = SubjectSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminOrTeacher()]

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all().select_related('user').order_by('last_name', 'first_name')
    serializer_class = TeacherSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().select_related('user').prefetch_related(
        'guardian_links__guardian',
        Prefetch(
            'enrollments',
            queryset=Enrollment.objects.filter(status='ACTIVE').select_related('course'),
            to_attr='prefetched_enrollments'
        )
    ).order_by('last_name', 'first_name')
    serializer_class = StudentSerializer
    permission_classes = [IsAdminOrTeacher]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get('course_id')
        if course_id:
            qs = qs.filter(enrollments__course_id=course_id, enrollments__status='ACTIVE')
        return qs

class GuardianViewSet(viewsets.ModelViewSet):
    queryset = Guardian.objects.all().prefetch_related(
        Prefetch(
            'student_links',
            queryset=StudentGuardian.objects.select_related('student').prefetch_related(
                Prefetch(
                    'student__enrollments',
                    queryset=Enrollment.objects.filter(status='ACTIVE').select_related('course'),
                    to_attr='prefetched_enrollments'
                )
            )
        )
    ).order_by('full_name')
    serializer_class = GuardianSerializer
    permission_classes = [IsAdminRole]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get('course_id')
        if course_id:
            qs = qs.filter(
                student_links__student__enrollments__course_id=course_id,
                student_links__student__enrollments__status='ACTIVE'
            ).distinct()
        return qs

class StudentGuardianViewSet(viewsets.ModelViewSet):
    queryset = StudentGuardian.objects.all().select_related('student', 'guardian').prefetch_related(
        Prefetch(
            'student__enrollments',
            queryset=Enrollment.objects.filter(status='ACTIVE').select_related('course'),
            to_attr='prefetched_enrollments'
        )
    ).order_by('student__last_name', 'student__first_name')
    serializer_class = StudentGuardianSerializer
    permission_classes = [IsAdminRole]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get('course_id')
        if course_id:
            qs = qs.filter(student__enrollments__course_id=course_id, student__enrollments__status='ACTIVE')
        return qs

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all().select_related('student', 'course', 'academic_year').order_by('student__last_name')
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminOrTeacher]
    pagination_class = None

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get('course_id')
        academic_year_id = self.request.query_params.get('academic_year_id')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)
        return qs

def ensure_student_profile_and_assignments(user):
    """Ensure a STUDENT user always has a linked Student profile, active Enrollment, and course TeachingAssignments."""
    student = getattr(user, 'student_profile', None)
    if not student:
        student = Student.objects.filter(user__isnull=True, active=True).order_by('last_name', 'first_name').first()
        if student:
            student.user = user
            student.save(update_fields=['user'])
        else:
            student, _ = Student.objects.get_or_create(
                user=user,
                defaults={
                    'code': f'RUDE-{user.username.upper()}',
                    'first_name': user.username,
                    'last_name': 'Estudiante',
                    'active': True,
                }
            )

    enrollments = list(
        Enrollment.objects.filter(
            student=student,
            status='ACTIVE'
        ).select_related('course', 'academic_year')
    )
    if not enrollments:
        first_course = Course.objects.select_related('academic_year').order_by('name', 'parallel').first()
        if first_course:
            enr, _ = Enrollment.objects.get_or_create(
                student=student,
                academic_year=first_course.academic_year,
                defaults={'course': first_course, 'status': 'ACTIVE'}
            )
            enrollments = [enr]

    for enr in enrollments:
        if not TeachingAssignment.objects.filter(course=enr.course, active=True).exists():
            canonical_specs = [
                ('Carlos', 'Mamani Rojas', '6284910-SC', 'MAT-101', 'Matemáticas'),
                ('Elena', 'Morales Gutiérrez', '4918234-SC', 'LEN-101', 'Lenguaje y Literatura'),
                ('Jorge', 'Salazar Peña', '5321890-SC', 'BIO-101', 'Ciencias Naturales y Biología'),
                ('Patricia', 'Vaca Terrazas', '7104928-SC', 'SOC-101', 'Ciencias Sociales e Historia'),
                ('Raúl', 'Flores Mendoza', '6592014-SC', 'FIS-101', 'Física y Química'),
            ]
            for t_first, t_last, t_doc, s_code, s_name in canonical_specs:
                prof = Teacher.objects.filter(document_number=t_doc).first() or Teacher.objects.filter(first_name=t_first, last_name=t_last).first()
                if not prof:
                    prof = Teacher.objects.create(first_name=t_first, last_name=t_last, document_number=t_doc)
                subj, _ = Subject.objects.get_or_create(code=s_code, defaults={'name': s_name})
                TeachingAssignment.objects.get_or_create(
                    teacher=prof,
                    course=enr.course,
                    subject=subj,
                    academic_year=enr.academic_year,
                    defaults={'active': True}
                )
    return student, enrollments


class TeachingAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = TeachingAssignmentSerializer
    pagination_class = None

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        return [IsAdminRole()]

    def get_queryset(self):
        user = self.request.user
        qs = TeachingAssignment.objects.all().select_related('teacher', 'course', 'subject', 'academic_year')
        
        if user.role == 'TEACHER':
            if hasattr(user, 'teacher_profile'):
                qs = qs.filter(teacher=user.teacher_profile, active=True)
            else:
                qs = qs.none()
        elif user.role == 'STUDENT':
            _, enrollments = ensure_student_profile_and_assignments(user)
            if enrollments:
                enrolled_course_ids = [e.course_id for e in enrollments]
                course_qs = qs.filter(course_id__in=enrolled_course_ids, active=True)
                qs = course_qs if course_qs.exists() else qs.filter(active=True)
            else:
                qs = qs.filter(active=True)
        
        course_id = self.request.query_params.get('course_id')
        academic_year_id = self.request.query_params.get('academic_year_id')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)
            
        return qs.order_by('course__name', 'course__parallel', 'subject__name')


from pathlib import Path
import tempfile
from django.core.management import call_command
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser


class ImportBjpExcelView(APIView):
    permission_classes = [IsAdminRole]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        uploaded_file = request.FILES.get('file')
        if uploaded_file:
            with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
                for chunk in uploaded_file.chunks():
                    tmp.write(chunk)
                tmp_path = Path(tmp.name)
            try:
                call_command('import_excel_bjp', excel=str(tmp_path))
            finally:
                if tmp_path.exists():
                    tmp_path.unlink()
        else:
            call_command('import_excel_bjp')

        return Response({
            'message': 'Cursos, paralelos, estudiantes y padres de familia importados correctamente.',
            'courses_count': Course.objects.count(),
            'students_count': Student.objects.count(),
            'guardians_count': Guardian.objects.count(),
            'links_count': StudentGuardian.objects.count(),
        })

