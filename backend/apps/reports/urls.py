from django.urls import path
from .views import AdminOverviewReportView, TeacherCourseSummaryReportView

urlpatterns = [
    path('reports/admin-overview/', AdminOverviewReportView.as_view(), name='report-admin-overview'),
    path('reports/teacher-course-summary/', TeacherCourseSummaryReportView.as_view(), name='report-teacher-course-summary'),
]
