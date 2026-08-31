from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsAdminRole
from .models import NotificationRule, AlertEvent
from .serializers import NotificationRuleSerializer, AlertEventSerializer
from .services import AlertEvaluationService

class NotificationRuleViewSet(viewsets.ModelViewSet):
    queryset = NotificationRule.objects.all().order_by('name')
    serializer_class = NotificationRuleSerializer
    permission_classes = [IsAdminRole]

class AlertEventViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AlertEvent.objects.all().select_related('rule', 'student').order_by('-first_detected_at')
    serializer_class = AlertEventSerializer
    permission_classes = [IsAdminRole]

    def get_queryset(self):
        qs = super().get_queryset()
        student_id = self.request.query_params.get('student_id')
        severity = self.request.query_params.get('severity')
        status_param = self.request.query_params.get('status')
        if student_id:
            qs = qs.filter(student_id=student_id)
        if severity:
            qs = qs.filter(severity=severity)
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

class RunAlertEvaluationView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request):
        result = AlertEvaluationService.run_full_evaluation()
        return Response({
            "message": "Evaluación de reglas ejecutada exitosamente.",
            "results": result
        }, status=status.HTTP_200_OK)
