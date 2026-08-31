from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    AcademicYearViewSet, CourseViewSet, SubjectViewSet, 
    TeacherViewSet, StudentViewSet, GuardianViewSet, 
    StudentGuardianViewSet, EnrollmentViewSet, TeachingAssignmentViewSet
)

router = DefaultRouter()
router.register(r'academic-years', AcademicYearViewSet, basename='academic-year')
router.register(r'courses', CourseViewSet, basename='course')
router.register(r'subjects', SubjectViewSet, basename='subject')
router.register(r'teachers', TeacherViewSet, basename='teacher')
router.register(r'students', StudentViewSet, basename='student')
router.register(r'guardians', GuardianViewSet, basename='guardian')
router.register(r'student-guardians', StudentGuardianViewSet, basename='student-guardian')
router.register(r'enrollments', EnrollmentViewSet, basename='enrollment')
router.register(r'teaching-assignments', TeachingAssignmentViewSet, basename='teaching-assignment')

urlpatterns = [
    path('', include(router.urls)),
]
