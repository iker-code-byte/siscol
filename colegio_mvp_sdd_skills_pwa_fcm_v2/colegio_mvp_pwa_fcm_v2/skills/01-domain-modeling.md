# Skill 01 — Domain Modeling

## Objetivo
Implementar el dominio académico y de tutores exactamente según `docs/02_DATA_MODEL.md`.

## Entidades P0
User, Teacher, Student, Guardian, StudentGuardian, AcademicYear, Course, Subject, Enrollment, TeachingAssignment.

## Tareas
1. Crear modelos y enums.
2. Añadir constraints UNIQUE e índices.
3. Mantener Guardian separado de User.
4. Modelar StudentGuardian N:M con relación y flags.
5. Crear factories/fixtures mínimas.
6. Documentar cualquier campo adicional.

## Reglas
- No poner `guardian_id` directo como única relación en Student.
- No permitir TeachingAssignment duplicada.
- No confiar en validación UI para unicidad.

## Tests mínimos
- constraints de matrícula/asignación;
- relación varios tutores/varios estudiantes;
- User role válido.

## DoD
Migraciones desde DB vacía + tests verdes.
