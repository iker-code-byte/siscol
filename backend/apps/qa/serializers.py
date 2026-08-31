from rest_framework import serializers
from .models import Question, Answer
from apps.academics.models import TeachingAssignment

class AnswerSerializer(serializers.ModelSerializer):
    teacher_name = serializers.SerializerMethodField()

    class Meta:
        model = Answer
        fields = ['id', 'question', 'teacher', 'teacher_name', 'body', 'published_at']
        read_only_fields = ['id', 'teacher', 'teacher_name', 'published_at']

    def get_teacher_name(self, obj):
        return f"{obj.teacher.first_name} {obj.teacher.last_name}"

class QuestionSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    subject_name = serializers.CharField(source='teaching_assignment.subject.name', read_only=True)
    course_name = serializers.CharField(source='teaching_assignment.course.name', read_only=True)
    course_parallel = serializers.CharField(source='teaching_assignment.course.parallel', read_only=True)
    teacher_name = serializers.SerializerMethodField()
    answers = AnswerSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Question
        fields = [
            'id', 'student', 'student_name', 'teaching_assignment',
            'subject_name', 'course_name', 'course_parallel', 'teacher_name',
            'subject', 'body', 'status', 'status_display', 'answers',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'student', 'student_name', 'status_display', 'answers', 'created_at', 'updated_at']

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

    def get_teacher_name(self, obj):
        return f"{obj.teaching_assignment.teacher.first_name} {obj.teaching_assignment.teacher.last_name}"

class QuestionCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['teaching_assignment', 'subject', 'body']
