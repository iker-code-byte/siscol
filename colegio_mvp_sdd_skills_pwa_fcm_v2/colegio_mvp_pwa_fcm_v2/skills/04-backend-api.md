# Skill 04 — Backend API Foundation

## Objetivo
Construir una API REST consistente y modular.

## Tareas
1. Estructura `apps/*` del SDD.
2. Error envelope estándar.
3. Paginación/filtros.
4. Services para negocio transaccional.
5. Serializers para validación de forma.
6. Request IDs/logging básico.
7. `/api/health/`.

## Patrones
View -> Service -> Model/Repository ORM.

Evitar lógica extensa en ViewSet o Serializer.

## Seguridad
- no stack trace en JSON de producción;
- no retornar FCM tokens;
- no aceptar guardian_id/student_id como sustituto de ownership.

## DoD
OpenAPI opcional, pero contratos del SDD deben existir y tener tests.
