from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AttendanceViewSet, AttendanceBulkView, StudentMeAttendanceView

router = DefaultRouter()
router.register(r'attendance', AttendanceViewSet, basename='attendance')

urlpatterns = [
    path('attendance/bulk/', AttendanceBulkView.as_view(), name='attendance-bulk'),
    path('me/attendance/', StudentMeAttendanceView.as_view(), name='student-me-attendance'),
    path('', include(router.urls)),
]
