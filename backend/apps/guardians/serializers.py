from rest_framework import serializers
from .models import GuardianActivationCode, GuardianDevice, PushSubscription, PlatformChoices
from apps.academics.models import Guardian

class GuardianActivationCodeSerializer(serializers.ModelSerializer):
    guardian_name = serializers.CharField(source='guardian.full_name', read_only=True)
    created_by_name = serializers.CharField(source='created_by.username', read_only=True, default=None)
    is_valid = serializers.BooleanField(read_only=True)

    class Meta:
        model = GuardianActivationCode
        fields = [
            'id', 'guardian', 'guardian_name', 'expires_at', 
            'used_at', 'revoked_at', 'is_valid', 'created_by_name', 'created_at'
        ]

class GuardianDeviceSerializer(serializers.ModelSerializer):
    guardian_name = serializers.CharField(source='guardian.full_name', read_only=True)
    has_push_subscription = serializers.SerializerMethodField()

    class Meta:
        model = GuardianDevice
        fields = ['id', 'guardian', 'guardian_name', 'name', 'platform', 'is_active', 'has_push_subscription', 'linked_at', 'last_seen_at']

    def get_has_push_subscription(self, obj):
        return obj.push_subscriptions.filter(is_active=True).exists()

class GuardianActivationVerifyRequestSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50, required=True)
    device_name = serializers.CharField(max_length=150, required=False, allow_blank=True, default=None)
    platform = serializers.ChoiceField(choices=PlatformChoices.choices, default=PlatformChoices.WEB)

class PushSubscriptionRequestSerializer(serializers.Serializer):
    token = serializers.CharField(required=True)
    provider = serializers.CharField(default='FCM')
    platform = serializers.CharField(required=False, default='WEB')

class GuardianMeStudentSerializer(serializers.Serializer):
    id = serializers.UUIDField()
    first_name = serializers.CharField()
    last_name = serializers.CharField()
    full_name = serializers.CharField()
    code = serializers.CharField()
    relationship = serializers.CharField()
    can_receive_notifications = serializers.BooleanField()

class GuardianMeResponseSerializer(serializers.Serializer):
    guardian = serializers.DictField()
    device = serializers.DictField()
    push_enabled = serializers.BooleanField()
    students = serializers.ListField(child=serializers.DictField())
