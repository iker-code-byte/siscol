# Skill 03 — Authentication & RBAC

## Objetivo
Implementar autenticación de usuarios internos y autorización por rol/ownership.

## Roles
ADMIN, TEACHER, STUDENT.

## Tareas
1. Login/refresh/logout/me.
2. Permission classes reutilizables.
3. Helpers para TeachingAssignment ownership.
4. Endpoints `/me/*` que deriven identidad del token.
5. Evitar enumeración/fuga en errores.
6. Rate limit de login si infraestructura disponible.

## Guardian
No agregar rol GUARDIAN. Su autorización pertenece a `skills/09-guardian-device-enrollment.md`.

## Tests P0
- Student -> admin = 403.
- Teacher A -> assignment B = 403.
- `/me/grades` ignora student_id manipulable.
- usuario inactive no autentica.

## DoD
No existe endpoint académico cuyo aislamiento dependa solo del frontend.
