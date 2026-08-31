# Skill 12 — Questions & Answers

## Objetivo
Cubrir el tercer flujo del docente y consulta del estudiante.

## Backend
- Question ligada a Student + TeachingAssignment.
- Student solo pregunta en asignaciones matriculadas.
- Teacher solo ve/responde su TeachingAssignment.
- Answer publicada cambia estado a ANSWERED.

## Frontend
Student:
- lista;
- nueva pregunta;
- detalle/respuestas.

Teacher:
- pendientes por asignación;
- responder/publicar.

## Seguridad
Sanitizar/escapar contenido. No renderizar HTML arbitrario.

## DoD
Flujo estudiante pregunta -> docente responde -> estudiante ve respuesta.
