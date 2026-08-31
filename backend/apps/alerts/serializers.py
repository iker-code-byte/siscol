from rest_framework import serializers
from .models import NotificationRule, AlertEvent

class NotificationRuleSerializer(serializers.ModelSerializer):
    type_display = serializers.CharField(source='get_type_display', read_only=True)

    class Meta:
        model = NotificationRule
        fields = [
            'id', 'name', 'type', 'type_display', 'enabled', 
            'threshold_value', 'period_days', 'cooldown_hours', 
            'created_at', 'updated_at'
        ]

class AlertEventSerializer(serializers.ModelSerializer):
    rule_name = serializers.CharField(source='rule.name', read_only=True)
    student_name = serializers.SerializerMethodField()
    student_code = serializers.CharField(source='student.code', read_only=True)
    severity_display = serializers.CharField(source='get_severity_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = AlertEvent
        fields = [
            'id', 'rule', 'rule_name', 'student', 'student_name', 'student_code',
            'source_type', 'source_id', 'fingerprint', 'severity', 'severity_display',
            'status', 'status_display', 'metadata', 'first_detected_at', 'last_detected_at'
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
