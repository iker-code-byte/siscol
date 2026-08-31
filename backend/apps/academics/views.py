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

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all().select_related('academic_year').order_by('name', 'parallel')
    serializer_class = CourseSerializer
    permission_classes = [IsAdminOrTeacher]

    def get_queryset(self):
        qs = super().get_queryset()
        academic_year_id = self.request.query_params.get('academic_year_id')
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)
        return qs

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all().order_by('name')
    serializer_class = SubjectSerializer
    permission_classes = [IsAdminOrTeacher]

class TeacherViewSet(viewsets.ModelViewSet):
    queryset = Teacher.objects.all().select_related('user').order_by('last_name', 'first_name')
    serializer_class = TeacherSerializer
    permission_classes = [IsAdminRole]

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().select_related('user').prefetch_related('guardian_links__guardian').order_by('last_name', 'first_name')
    serializer_class = StudentSerializer
    permission_classes = [IsAdminOrTeacher]

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get('course_id')
        if course_id:
            qs = qs.filter(enrollments__course_id=course_id, enrollments__status='ACTIVE')
        return qs

class GuardianViewSet(viewsets.ModelViewSet):
    queryset = Guardian.objects.all().prefetch_related('student_links').order_by('full_name')
    serializer_class = GuardianSerializer
    permission_classes = [IsAdminRole]

class StudentGuardianViewSet(viewsets.ModelViewSet):
    queryset = StudentGuardian.objects.all().select_related('student', 'guardian')
    serializer_class = StudentGuardianSerializer
    permission_classes = [IsAdminRole]

class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset = Enrollment.objects.all().select_related('student', 'course', 'academic_year').order_by('student__last_name')
    serializer_class = EnrollmentSerializer
    permission_classes = [IsAdminOrTeacher]

    def get_queryset(self):
        qs = super().get_queryset()
        course_id = self.request.query_params.get('course_id')
        academic_year_id = self.request.query_params.get('academic_year_id')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)
        return qs

class TeachingAssignmentViewSet(viewsets.ModelViewSet):
    serializer_class = TeachingAssignmentSerializer

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAdminOrTeacher()]
        return [IsAdminRole()]

    def get_queryset(self):
        user = self.request.user
        qs = TeachingAssignment.objects.all().select_related('teacher', 'course', 'subject', 'academic_year')
        
        if user.role == 'TEACHER':
            if hasattr(user, 'teacher_profile'):
                qs = qs.filter(teacher=user.teacher_profile, active=True)
            else:
                qs = qs.none()
        
        course_id = self.request.query_params.get('course_id')
        academic_year_id = self.request.query_params.get('academic_year_id')
        if course_id:
            qs = qs.filter(course_id=course_id)
        if academic_year_id:
            qs = qs.filter(academic_year_id=academic_year_id)
            
        return qs.order_by('course__name', 'course__parallel', 'subject__name')
