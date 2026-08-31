import uuid
from django.db import models
from django.conf import settings
from apps.academics.models import Student, TeachingAssignment

class AttendanceStatusChoices(models.TextChoices):
    PRESENT = 'PRESENT', 'Presente'
    ABSENT = 'ABSENT', 'Falta'
    LATE = 'LATE', 'Atraso'
    EXCUSED = 'EXCUSED', 'Licencia / Justificado'

class Attendance(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    teaching_assignment = models.ForeignKey(TeachingAssignment, on_delete=models.CASCADE, related_name='attendances')
    date = models.DateField()
    status = models.CharField(
        max_length=20, 
        choices=AttendanceStatusChoices.choices, 
        default=AttendanceStatusChoices.PRESENT
    )
    comments = models.TextField(blank=True, null=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='attendances_created'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='attendances_updated'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'attendances'
        verbose_name = 'Asistencia'
        verbose_name_plural = 'Asistencias'
        unique_together = ('student', 'teaching_assignment', 'date')
        indexes = [
            models.Index(fields=['student', 'date']),
            models.Index(fields=['teaching_assignment', 'date']),
        ]
        ordering = ['-date', 'student__last_name']

    def __str__(self):
        return f"{self.date} - {self.student.first_name} {self.student.last_name}: {self.get_status_display()}"
