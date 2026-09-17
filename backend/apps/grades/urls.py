from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    GradeViewSet, GradeBulkView, StudentMeGradesView,
    AcademicPeriodViewSet, GradebookViewSet, GradeActivityViewSet,
    GradeEntryUpsertView
)

router = DefaultRouter()
router.register(r'academic-periods', AcademicPeriodViewSet, basename='academic-period')
router.register(r'gradebooks', GradebookViewSet, basename='gradebook')
router.register(r'grade-activities', GradeActivityViewSet, basename='grade-activity')
router.register(r'grades', GradeViewSet, basename='grade')

urlpatterns = [
    path('grade-entries/', GradeEntryUpsertView.as_view(), name='grade-entry-upsert'),
    path('grades/bulk/', GradeBulkView.as_view(), name='grade-bulk'),
    path('me/grades/', StudentMeGradesView.as_view(), name='student-me-grades'),
    path('', include(router.urls)),
]

