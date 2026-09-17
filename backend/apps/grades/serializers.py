from rest_framework import serializers
from apps.academics.models import AcademicPeriod
from .models import Grade, Gradebook, GradeActivity, GradeEntry

class AcademicPeriodSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AcademicPeriod
        fields = [
            'id', 'academic_year', 'academic_year_name', 'name', 
            'period_type', 'number', 'start_date', 'end_date', 
            'grade_entry_start', 'grade_entry_end', 'status', 'status_display'
        ]

class GradeActivitySerializer(serializers.ModelSerializer):
    activity_type_display = serializers.CharField(source='get_activity_type_display', read_only=True)
    entries_count = serializers.SerializerMethodField()

    class Meta:
        model = GradeActivity
        fields = [
            'id', 'gradebook', 'name', 'description', 'activity_type',
            'activity_type_display', 'activity_date', 'max_score', 'weight',
            'position', 'is_active', 'entries_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'entries_count']

    def get_entries_count(self, obj):
        return obj.entries.filter(score__isnull=False).count()

class GradeEntrySerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_code = serializers.CharField(source='student.code', read_only=True)

    class Meta:
        model = GradeEntry
        fields = [
            'id', 'activity', 'student', 'student_name', 'student_code',
            'score', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

class GradeEntryUpsertSerializer(serializers.Serializer):
    activity_id = serializers.UUIDField(required=True)
    student_id = serializers.UUIDField(required=True)
    score = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)

class GradeBulkMatrixItemSerializer(serializers.Serializer):
    activity_id = serializers.UUIDField(required=True)
    student_id = serializers.UUIDField(required=True)
    score = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)

class GradeBulkMatrixUpsertSerializer(serializers.Serializer):
    entries = serializers.ListField(child=GradeBulkMatrixItemSerializer(), allow_empty=False)

class GradebookSerializer(serializers.ModelSerializer):
    academic_year_name = serializers.CharField(source='academic_year.name', read_only=True)
    academic_period_name = serializers.CharField(source='academic_period.name', read_only=True)
    academic_period_number = serializers.IntegerField(source='academic_period.number', read_only=True)
    course_name = serializers.CharField(source='course.name', read_only=True)
    course_parallel = serializers.CharField(source='course.parallel', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    subject_code = serializers.CharField(source='subject.code', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    is_closed = serializers.BooleanField(read_only=True)
    activities_count = serializers.SerializerMethodField()

    class Meta:
        model = Gradebook
        fields = [
            'id', 'academic_year', 'academic_year_name',
            'academic_period', 'academic_period_name', 'academic_period_number',
            'course', 'course_name', 'course_parallel',
            'subject', 'subject_name', 'subject_code',
            'teacher', 'teacher_name', 'status', 'is_closed',
            'activities_count', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'is_closed', 'activities_count']

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}"

    def get_activities_count(self, obj):
        return obj.activities.filter(is_active=True).count()

# Legacy single serializers
class GradeSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_code = serializers.CharField(source='student.code', read_only=True)
    subject_name = serializers.CharField(source='teaching_assignment.subject.name', read_only=True)
    course_name = serializers.CharField(source='teaching_assignment.course.name', read_only=True)
    course_parallel = serializers.CharField(source='teaching_assignment.course.parallel', read_only=True)
    percentage = serializers.SerializerMethodField()

    class Meta:
        model = Grade
        fields = [
            'id', 'student', 'student_name', 'student_code',
            'teaching_assignment', 'subject_name', 'course_name', 'course_parallel',
            'term', 'activity_name', 'score', 'max_score', 'percentage',
            'date', 'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'percentage']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_percentage(self, obj):
        if obj.max_score and obj.max_score > 0:
            return round((float(obj.score) / float(obj.max_score)) * 100, 1)
        return 0

class GradeBulkItemSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=False, allow_null=True)
    student_id = serializers.UUIDField(required=True)
    score = serializers.DecimalField(max_digits=5, decimal_places=2, required=False, allow_null=True)
    comments = serializers.CharField(required=False, allow_blank=True, allow_null=True)

class GradeBulkRequestSerializer(serializers.Serializer):
    teaching_assignment_id = serializers.UUIDField(required=True)
    term = serializers.CharField(max_length=20, required=True)
    activity_name = serializers.CharField(max_length=150, required=True)
    max_score = serializers.DecimalField(max_digits=5, decimal_places=2, default=45.00)
    date = serializers.DateField(required=True)
    comments = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    grades = serializers.ListField(child=GradeBulkItemSerializer(), allow_empty=False)

