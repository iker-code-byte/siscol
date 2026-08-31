import uuid
from django.db import models
from django.conf import settings

class AcademicYear(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=50) # e.g. "Gestión 2026"
    start_date = models.DateField()
    end_date = models.DateField()
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'academic_years'
        verbose_name = 'Año Académico'
        verbose_name_plural = 'Años Académicos'
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.name} ({'Activo' if self.active else 'Inactivo'})"

class Course(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='courses')
    name = models.CharField(max_length=100) # e.g. "1ro Secundaria", "6to Primaria"
    parallel = models.CharField(max_length=10) # e.g. "A", "B"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'courses'
        verbose_name = 'Curso'
        verbose_name_plural = 'Cursos'
        unique_together = ('academic_year', 'name', 'parallel')
        ordering = ['name', 'parallel']

    def __str__(self):
        return f"{self.name} - {self.parallel} ({self.academic_year.name})"

class Subject(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100) # e.g. "Matemáticas", "Lenguaje"
    code = models.CharField(max_length=20, unique=True) # e.g. "MAT-01"
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'subjects'
        verbose_name = 'Materia'
        verbose_name_plural = 'Materias'
        ordering = ['name']

    def __str__(self):
        return f"{self.name} ({self.code})"

class Teacher(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='teacher_profile'
    )
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    document_number = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teachers'
        verbose_name = 'Docente'
        verbose_name_plural = 'Docentes'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

class Student(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='student_profile'
    )
    code = models.CharField(max_length=50, unique=True) # RUDE o código de estudiante
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'students'
        verbose_name = 'Estudiante'
        verbose_name_plural = 'Estudiantes'
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.code})"

class Guardian(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=200)
    phone = models.CharField(max_length=50, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    notifications_enabled = models.BooleanField(default=True)
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'guardians'
        verbose_name = 'Tutor / Padre de Familia'
        verbose_name_plural = 'Tutores / Padres de Familia'
        ordering = ['full_name']

    def __str__(self):
        return self.full_name

class RelationshipChoices(models.TextChoices):
    MOTHER = 'MOTHER', 'Madre'
    FATHER = 'FATHER', 'Padre'
    TUTOR = 'TUTOR', 'Tutor Legal'
    OTHER = 'OTHER', 'Otro'

class StudentGuardian(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='guardian_links')
    guardian = models.ForeignKey(Guardian, on_delete=models.CASCADE, related_name='student_links')
    relationship = models.CharField(max_length=20, choices=RelationshipChoices.choices, default=RelationshipChoices.TUTOR)
    is_primary = models.BooleanField(default=False)
    can_receive_notifications = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'student_guardians'
        verbose_name = 'Relación Estudiante-Tutor'
        verbose_name_plural = 'Relaciones Estudiante-Tutor'
        unique_together = ('student', 'guardian')

    def __str__(self):
        return f"{self.guardian.full_name} -> {self.student.first_name} {self.student.last_name} ({self.get_relationship_display()})"

class EnrollmentStatusChoices(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Activo'
    WITHDRAWN = 'WITHDRAWN', 'Retirado'
    COMPLETED = 'COMPLETED', 'Completado'

class Enrollment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='enrollments')
    status = models.CharField(max_length=20, choices=EnrollmentStatusChoices.choices, default=EnrollmentStatusChoices.ACTIVE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'enrollments'
        verbose_name = 'Matrícula'
        verbose_name_plural = 'Matrículas'
        unique_together = ('student', 'course', 'academic_year')

    def __str__(self):
        return f"{self.student.first_name} {self.student.last_name} en {self.course} ({self.academic_year.name})"

class TeachingAssignment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    teacher = models.ForeignKey(Teacher, on_delete=models.CASCADE, related_name='teaching_assignments')
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='teaching_assignments')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE, related_name='teaching_assignments')
    academic_year = models.ForeignKey(AcademicYear, on_delete=models.CASCADE, related_name='teaching_assignments')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'teaching_assignments'
        verbose_name = 'Asignación Docente'
        verbose_name_plural = 'Asignaciones Docentes'
        unique_together = ('teacher', 'course', 'subject', 'academic_year')

    def __str__(self):
        return f"{self.teacher} - {self.subject.name} ({self.course.name} {self.course.parallel})"
