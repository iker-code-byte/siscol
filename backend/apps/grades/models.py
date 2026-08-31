import uuid
from django.db import models
from django.conf import settings
from apps.academics.models import Student, TeachingAssignment

class Grade(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    teaching_assignment = models.ForeignKey(TeachingAssignment, on_delete=models.CASCADE, related_name='grades')
    term = models.CharField(max_length=20) # e.g. "T1", "T2", "T3"
    activity_name = models.CharField(max_length=150) # e.g. "Evaluación Continua", "Examen"
    score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=100.00)
    date = models.DateField()
    comments = models.TextField(blank=True, null=True)
    
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='grades_created'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='grades_updated'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'grades'
        verbose_name = 'Calificación'
        verbose_name_plural = 'Calificaciones'
        indexes = [
            models.Index(fields=['student', 'teaching_assignment', 'term']),
            models.Index(fields=['teaching_assignment', 'date']),
        ]
        ordering = ['-date', '-created_at']

    def __str__(self):
        return f"{self.student.first_name} {self.student.last_name} - {self.activity_name}: {self.score}/{self.max_score} ({self.term})"
