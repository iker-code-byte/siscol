from rest_framework import serializers
from .models import Notification, NotificationDelivery

class NotificationDeliverySerializer(serializers.ModelSerializer):
    device_name = serializers.CharField(source='push_subscription.guardian_device.name', read_only=True, default='Dispositivo')
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = NotificationDelivery
        fields = [
            'id', 'notification', 'push_subscription', 'device_name', 
            'provider', 'status', 'status_display', 'provider_message_id',
            'attempt_count', 'last_attempt_at', 'error_code', 'error_message_redacted'
        ]

class NotificationSerializer(serializers.ModelSerializer):
    guardian_name = serializers.CharField(source='guardian.full_name', read_only=True)
    student_name = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    deliveries = NotificationDeliverySerializer(many=True, read_only=True)
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'alert_event', 'guardian', 'guardian_name', 'student', 'student_name',
            'category', 'category_display', 'safe_title', 'safe_body', 
            'detailed_title', 'detailed_body', 'metadata', 'is_read', 'read_at', 
            'created_at', 'deliveries'
        ]

    def get_student_name(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

class GuardianInboxItemSerializer(serializers.ModelSerializer):
    student_display = serializers.SerializerMethodField()
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'category', 'category_display', 'student_display', 
            'detailed_title', 'safe_title', 'is_read', 'read_at', 'created_at'
        ]

    def get_student_display(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"

class GuardianNotificationDetailSerializer(serializers.ModelSerializer):
    student_display = serializers.SerializerMethodField()
    student_code = serializers.CharField(source='student.code', read_only=True)
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    is_read = serializers.BooleanField(read_only=True)

    class Meta:
        model = Notification
        fields = [
            'id', 'category', 'category_display', 'student_display', 'student_code',
            'detailed_title', 'detailed_body', 'metadata', 'is_read', 'read_at', 'created_at'
        ]

    def get_student_display(self, obj):
        return f"{obj.student.first_name} {obj.student.last_name}"
