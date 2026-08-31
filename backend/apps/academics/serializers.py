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

    class Meta:
        model = Course
        fields = ['id', 'academic_year', 'academic_year_name', 'name', 'parallel', 'created_at']

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

    class Meta:
        model = StudentGuardian
        fields = ['id', 'guardian', 'guardian_name', 'guardian_phone', 'relationship', 'is_primary', 'can_receive_notifications']

class StudentSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    full_name = serializers.SerializerMethodField()
    guardians = StudentGuardianNestedSerializer(source='guardian_links', many=True, read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'user', 'user_details', 'code', 'first_name', 'last_name', 'full_name', 'active', 'guardians', 'created_at']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

class GuardianSerializer(serializers.ModelSerializer):
    students_count = serializers.IntegerField(source='student_links.count', read_only=True)

    class Meta:
        model = Guardian
        fields = ['id', 'full_name', 'phone', 'email', 'notifications_enabled', 'active', 'students_count', 'created_at']

class StudentGuardianSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    guardian_name = serializers.CharField(source='guardian.full_name', read_only=True)

    class Meta:
        model = StudentGuardian
        fields = ['id', 'student', 'student_name', 'guardian', 'guardian_name', 'relationship', 'is_primary', 'can_receive_notifications']

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
        return f"{obj.student.first_name} {obj.student.last_name}"

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
