from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuestionViewSet, StudentMeQuestionsView

router = DefaultRouter()
router.register(r'questions', QuestionViewSet, basename='question')

urlpatterns = [
    path('me/questions/', StudentMeQuestionsView.as_view(), name='student-me-questions'),
    path('', include(router.urls)),
]
