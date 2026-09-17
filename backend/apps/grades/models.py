import uuid
from django.db import models
from django.conf import settings
from apps.academics.models import (
    Student, TeachingAssignment, AcademicYear, Course, Subject, Teacher, AcademicPeriod
)

class GradebookStatusChoices(models.TextChoices):
    OPEN = 'OPEN', 'Abierto'
    CLOSED = 'CLOSED', 'Cerrado'

class GradeActivityTypeChoices(models.TextChoices):
    TASK = 'TASK', 'Tarea'
    EXAM = 'EXAM', 'Examen'
    PRACTICE = 'PRACTICE', 'Práctica'
    PROJECT = 'PROJECT', 'Proyecto'
    PRESENTATION = 'PRESENTATION', 'Exposición'
    PARTICIPATION = 'PARTICIPATION', 'Participación'
    OTHER = 'OTHER', 'Otro'

class Gradebook(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='gradebooks')
    academic_period = models.ForeignKey(AcademicPeriod, on_delete=models.CASCADE, related_name='gradebooks')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='gradebooks')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='gradebooks')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='gradebooks')
    status = models.CharField(
        max_length=20, 
        choices=GradebookStatusChoices.choices, 
        default=GradebookStatusChoices.OPEN
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'gradebooks'
        verbose_name = 'Libro de Calificaciones'
        verbose_name_plural = 'Libros de Calificaciones'
        unique_together = ('academic_year', 'academic_period', 'course', 'subject', 'teacher')
        ordering = ['academic_year', 'academic_period__number', 'course', 'subject']

    def __str__(self):
        return f"{self.course.name} {self.course.parallel} - {self.subject.name} ({self.academic_period.name}) [{self.teacher}]"

    @property
    def is_closed(self):
        return self.status == GradebookStatusChoices.CLOSED or self.academic_period.status == 'CLOSED'

class GradeActivity(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    gradebook = models.ForeignKey(Gradebook, on_delete=models.CASCADE, related_name='activities')
    name = models.CharField(max_length=150)
    description = models.TextField(blank=True, default='')
    activity_type = models.CharField(
        max_length=30, 
        choices=GradeActivityTypeChoices.choices, 
        default=GradeActivityTypeChoices.TASK
    )
    activity_date = models.DateField()
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=45.00)
    weight = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    position = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'grade_activities'
        verbose_name = 'Actividad Calificada'
        verbose_name_plural = 'Actividades Calificadas'
        ordering = ['position', 'created_at']

    def __str__(self):
        return f"{self.name} ({self.gradebook})"

class GradeEntry(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    activity = models.ForeignKey(GradeActivity, on_delete=models.CASCADE, related_name='entries')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grade_entries')
    score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='grade_entries_created'
    )
    updated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='grade_entries_updated'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'grade_entries'
        verbose_name = 'Registro de Calificación'
        verbose_name_plural = 'Registros de Calificaciones'
        unique_together = ('activity', 'student')
        indexes = [
            models.Index(fields=['activity', 'student']),
        ]

    def __str__(self):
        score_str = f"{self.score}" if self.score is not None else "SIN CALIFICAR"
        return f"{self.student}: {score_str} / {self.activity.name}"

# Legacy single-evaluation model retained for existing references/reports
class Grade(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='grades')
    teaching_assignment = models.ForeignKey(TeachingAssignment, on_delete=models.CASCADE, related_name='grades')
    term = models.CharField(max_length=20) # e.g. "T1", "T2", "T3"
    activity_name = models.CharField(max_length=150) # e.g. "Evaluación Continua", "Examen"
    score = models.DecimalField(max_digits=5, decimal_places=2)
    max_score = models.DecimalField(max_digits=5, decimal_places=2, default=45.00)
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

