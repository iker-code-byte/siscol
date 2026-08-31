from rest_framework.permissions import BasePermission
from .models import RoleChoices

class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role == RoleChoices.ADMIN or request.user.is_superuser)
        )

class IsTeacherRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == RoleChoices.TEACHER
        )

class IsStudentRole(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            request.user.role == RoleChoices.STUDENT
        )

class IsAdminOrTeacher(BasePermission):
    def has_permission(self, request, view):
        return bool(
            request.user and 
            request.user.is_authenticated and 
            (request.user.role in (RoleChoices.ADMIN, RoleChoices.TEACHER) or request.user.is_superuser)
        )
