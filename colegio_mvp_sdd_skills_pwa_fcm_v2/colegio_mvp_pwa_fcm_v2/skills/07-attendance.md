# Skill 07 — Attendance

## Objetivo
Registrar asistencia con mínima fricción docente.

## Backend
- UNIQUE student + assignment + date.
- bulk service transaccional.
- estados PRESENT/ABSENT/LATE/EXCUSED.
- ownership.
- audit.
- post-commit alert evaluation.

## Frontend
- fecha actual por defecto;
- todos PRESENT inicialmente;
- marcar excepciones;
- contador por estado;
- save masivo.

## Tests P0
- no duplicación por fecha;
- teacher ajeno 403;
- student own-only;
- ausencia genera evento según regla.
