from rest_framework import serializers
from .models import Grade

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
    max_score = serializers.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    date = serializers.DateField(required=True)
    comments = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    grades = serializers.ListField(child=GradeBulkItemSerializer(), allow_empty=False)
