from rest_framework import serializers
from .models import (
    AcademicYear, Course, Subject, Teacher, Student, Guardian, 
    StudentGuardian, Enrollment, TeachingAssignment
)
from apps.accounts.serializers import UserSerializer

class AcademicYearSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicYear
        fields = ['id', 'name', 'start_date', 'end_date', 'active', 'created_at']

class CourseSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    students_count = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ['id', 'academic_year', 'academic_year_name', 'name', 'parallel', 'students_count', 'created_at']

    def get_students_count(self, obj):
        if hasattr(obj, 'active_students_count'):
            return obj.active_students_count
        return obj.enrollments.filter(status='ACTIVE').count()

class SubjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subject
        fields = ['id', 'name', 'code', 'created_at']

class TeacherSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Teacher
        fields = ['id', 'user', 'user_details', 'first_name', 'last_name', 'full_name', 'document_number', 'created_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class StudentGuardianNestedSerializer(serializers.ModelSerializer):
    guardian_name = serializers.CharField(source='guardian.full_name', read_only=True)
    guardian_phone = serializers.CharField(source='guardian.phone', read_only=True)
    relationship_display = serializers.CharField(source='get_relationship_display', read_only=True)

    class Meta:
        model = StudentGuardian
        fields = [
            'id', 'guardian', 'guardian_name', 'guardian_phone',
            'relationship', 'relationship_display', 'is_primary', 'can_receive_notifications'
        ]

class StudentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    full_name = serializers.SerializerMethodField()
    guardians = StudentGuardianNestedSerializer(source='guardian_links', many=True, read_only=True)
    course_id = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    course_parallel = serializers.SerializerMethodField()

    class Meta:
        model = Student
        fields = [
            'id', 'user', 'user_details', 'code', 'first_name', 'last_name', 'full_name',
            'course_id', 'course_name', 'course_parallel',
            'active', 'guardians', 'created_at'
        ]

    def get_full_name(self, obj):
        return f"{obj.last_name} {obj.first_name}".strip()

    def _get_active_enrollment(self, obj):
        enrs = getattr(obj, 'prefetched_enrollments', None)
        if enrs is not None:
            return enrs[0] if enrs else None
        return obj.enrollments.select_related('course').filter(status='ACTIVE').first()

    def get_course_id(self, obj):
        enr = self._get_active_enrollment(obj)
        return str(enr.course_id) if enr else None

    def get_course_name(self, obj):
        enr = self._get_active_enrollment(obj)
        return enr.course.name if enr else None

    def get_course_parallel(self, obj):
        enr = self._get_active_enrollment(obj)
        return enr.course.parallel if enr else None

class GuardianSerializer(serializers.ModelSerializer):
    students_count = serializers.IntegerField(source='student_links.count', read_only=True)
    students_details = serializers.SerializerMethodField()

    class Meta:
        model = Guardian
        fields = [
            'id', 'full_name', 'phone', 'email',
            'notifications_enabled', 'active', 'students_count', 'students_details', 'created_at'
        ]

    def get_students_details(self, obj):
        items = []
        for link in obj.student_links.all():
            st = link.student
            enrs = getattr(st, 'prefetched_enrollments', None)
            enr = enrs[0] if enrs else st.enrollments.select_related('course').filter(status='ACTIVE').first()
            items.append({
                'link_id': str(link.id),
                'student_id': str(st.id),
                'student_code': st.code,
                'student_name': f"{st.last_name} {st.first_name}".strip(),
                'relationship': link.relationship,
                'relationship_display': link.get_relationship_display(),
                'course_id': str(enr.course_id) if enr else None,
                'course_name': enr.course.name if enr else None,
                'course_parallel': enr.course.parallel if enr else None,
            })
        return items

class StudentGuardianSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_code = serializers.CharField(source='student.code', read_only=True)
    guardian_name = serializers.CharField(source='guardian.full_name', read_only=True)
    guardian_phone = serializers.CharField(source='guardian.phone', read_only=True)
    relationship_display = serializers.CharField(source='get_relationship_display', read_only=True)
    course_id = serializers.SerializerMethodField()
    course_name = serializers.SerializerMethodField()
    course_parallel = serializers.SerializerMethodField()

    class Meta:
        model = StudentGuardian
        fields = [
            'id', 'student', 'student_name', 'student_code',
            'guardian', 'guardian_name', 'guardian_phone',
            'relationship', 'relationship_display',
            'course_id', 'course_name', 'course_parallel',
            'is_primary', 'can_receive_notifications'
        ]

    def get_student_name(self, obj):
        return f"{obj.student.last_name} {obj.student.first_name}".strip()

    def _get_enr(self, obj):
        enrs = getattr(obj.student, 'prefetched_enrollments', None)
        if enrs is not None:
            return enrs[0] if enrs else None
        return obj.student.enrollments.select_related('course').filter(status='ACTIVE').first()

    def get_course_id(self, obj):
        enr = self._get_enr(obj)
        return str(enr.course_id) if enr else None

    def get_course_name(self, obj):
        enr = self._get_enr(obj)
        return enr.course.name if enr else None

    def get_course_parallel(self, obj):
        enr = self._get_enr(obj)
        return enr.course.parallel if enr else None

class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_code = serializers.CharField(source='student.code', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_parallel = serializers.CharField(source='course.parallel', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = Enrollment
        fields = [
            'id', 'student', 'student_name', 'student_code', 
            'course', 'course_name', 'course_parallel', 
            'academic_year', 'academic_year_name', 'status', 'created_at'
        ]

    def get_student_name(self, obj):
        return f"{obj.student.last_name} {obj.student.first_name}".strip()

class TeachingAssignmentSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_parallel = serializers.CharField(source='course.parallel', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)

    class Meta:
        model = TeachingAssignment
        fields = [
            'id', 'teacher', 'teacher_name', 'course', 'course_name', 'course_parallel',
            'subject', 'subject_name', 'subject_code', 'academic_year', 'academic_year_name',
            'active', 'created_at'
        ]

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}"
