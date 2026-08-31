from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import User, RoleChoices

class UserSerializer(serializers.ModelSerializer):
    profile = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'role', 'is_active', 'created_at', 'profile']
        read_only_fields = ['id', 'created_at', 'profile']

    def get_profile(self, obj):
        if obj.role == RoleChoices.TEACHER:
            if hasattr(obj, 'teacher_profile'):
                teacher = obj.teacher_profile
                return {
                    'id': str(teacher.id),
                    'first_name': teacher.first_name,
                    'last_name': teacher.last_name,
                    'full_name': f"{teacher.first_name} {teacher.last_name}",
                    'document_number': teacher.document_number,
                }
        elif obj.role == RoleChoices.STUDENT:
            if hasattr(obj, 'student_profile'):
                student = obj.student_profile
                return {
                    'id': str(student.id),
                    'code': student.code,
                    'first_name': student.first_name,
                    'last_name': student.last_name,
                    'full_name': f"{student.first_name} {student.last_name}",
                }
        return None

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user
        
        if not user.is_active:
            raise serializers.ValidationError({"detail": "La cuenta se encuentra inactiva."})

        user_data = UserSerializer(user).data
        data['user'] = user_data
        data['access_token'] = data.pop('access')
        data['refresh_token'] = data.pop('refresh')
        return data

class UserCreateSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'role', 'is_active']
        read_only_fields = ['id']

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        return user
