import uuid
from django.db import models
from apps.academics.models import Student, Teacher, TeachingAssignment

class QuestionStatusChoices(models.TextChoices):
    OPEN = 'OPEN', 'Abierta'
    ANSWERED = 'ANSWERED', 'Respondida'
    CLOSED = 'CLOSED', 'Cerrada'

class Question(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='questions')
    teaching_assignment = models.ForeignKey(TeachingAssignment, on_delete=models.CASCADE, related_name='questions')
    subject = models.CharField(max_length=200)
    body = models.TextField()
    status = models.CharField(
        max_length=20, 
        choices=QuestionStatusChoices.choices, 
        default=QuestionStatusChoices.OPEN
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'questions'
        verbose_name = 'Pregunta'
        verbose_name_plural = 'Preguntas'
        indexes = [
            models.Index(fields=['teaching_assignment', 'status', 'created_at']),
        ]
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.subject} ({self.student.first_name} {self.student.last_name})"

class Answer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='answers')
    body = models.TextField()
    published_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'answers'
        verbose_name = 'Respuesta'
        verbose_name_plural = 'Respuestas'
        ordering = ['published_at']

    def __str__(self):
        return f"Respuesta de {self.teacher} a '{self.question.subject}'"
