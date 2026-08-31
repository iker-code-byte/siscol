from rest_framework import serializers
from .models import Attendance, AttendanceStatusChoices

class AttendanceSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_code = serializers.CharField(source='student.code', read_only=True)
    subject_name = serializers.CharField(source='teaching_assignment.subject.name', read_only=True)
    course_name = serializers.CharField(source='teaching_assignment.course.name', read_only=True)
    course_parallel = serializers.CharField(source='teaching_assignment.course.parallel', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Attendance
        fields = [
            'id', 'student', 'student_name', 'student_code',
            'teaching_assignment', 'subject_name', 'course_name', 'course_parallel',
            'date', 'status', 'status_display', 'comments', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at', 'status_display']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

class AttendanceBulkRowSerializer(serializers.Serializer):
    student_id = serializers.UUIDField(required=True)
    status = serializers.ChoiceField(choices=AttendanceStatusChoices.choices, default=AttendanceStatusChoices.PRESENT)
    comments = serializers.CharField(required=False, allow_blank=True, allow_null=True)

class AttendanceBulkRequestSerializer(serializers.Serializer):
    teaching_assignment_id = serializers.UUIDField(required=True)
    date = serializers.DateField(required=True)
    comments = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    rows = serializers.ListField(child=AttendanceBulkRowSerializer(), allow_empty=False)
