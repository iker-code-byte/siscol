# Skill 18 — Demo & Seed Data

## Objetivo
Garantizar una demostración reproducible sin edición manual de DB.

## Seed mínimo
- 1 admin.
- 1 teacher.
- 2 students.
- 2 guardians.
- 1 academic year.
- 1 course.
- 2 subjects.
- enrollments.
- assignments.
- reglas LOW_GRADE y ABSENCE.

## Comandos sugeridos
```text
python manage.py seed_demo --reset
python manage.py generate_guardian_code <guardian>
```

## Demo
Preparar dos escenarios:
1. Nota baja -> Push.
2. Falta -> Push.

## Privacidad
Usar nombres/datos ficticios en demos públicas.
