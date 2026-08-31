from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import GradeViewSet, GradeBulkView, StudentMeGradesView

router = DefaultRouter()
router.register(r'grades', GradeViewSet, basename='grade')

urlpatterns = [
    path('grades/bulk/', GradeBulkView.as_view(), name='grade-bulk'),
    path('me/grades/', StudentMeGradesView.as_view(), name='student-me-grades'),
    path('', include(router.urls)),
]
