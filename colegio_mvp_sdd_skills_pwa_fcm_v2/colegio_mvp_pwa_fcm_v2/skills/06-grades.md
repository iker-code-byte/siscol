# Skill 06 — Grades

## Objetivo
Implementar registro de notas en planilla y consulta segura.

## Backend
- Grade model.
- `GradeBulkService` transaccional.
- ownership docente.
- validación `0 <= score <= max_score`.
- audit de create/update.
- hook post-commit a evaluación de alertas.

## Frontend
- curso/materia/período;
- lista alumnos;
- inputs por fila;
- guardado masivo;
- error por fila;
- aviso de cambios sin guardar.

## Tests P0
- bulk ok;
- rollback por fila inválida;
- teacher ajeno 403;
- student own-only;
- evento low-grade evaluable.
