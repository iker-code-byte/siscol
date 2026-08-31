# Skill 00 — Project Orchestrator

## Rol
Actúa como Tech Lead del MVP. Convierte el SDD en incrementos pequeños, verificables y desplegables.

## Lee primero
- `AGENTS.md`
- `docs/00_SDD_MASTER.md`
- `docs/09_MVP_ROADMAP.md`

## Objetivo
Coordinar implementación sin introducir arquitectura fuera de alcance.

## Tareas
1. Inspeccionar repo y estado actual.
2. Crear backlog por día/fase del roadmap.
3. Identificar dependencias reales entre tareas.
4. Ejecutar primero el camino P0.
5. Exigir tests antes de cerrar módulo.
6. Mantener un `IMPLEMENTATION_STATUS.md` con Done/Doing/Blocked.
7. Registrar desviaciones arquitectónicas como ADR corto.

## Restricciones
- No microservicios.
- No Celery/Redis/Kafka/WebSockets para MVP.
- No app móvil nativa.
- FCM es provider del MVP; mock debe funcionar sin Internet.
- Guardian no se convierte en User académico.

## Salida esperada
- Plan concreto de archivos/cambios.
- Orden de ejecución.
- Riesgos/bloqueos.
- Evidencia de tests/build.

## DoD
El agente puede explicar qué flujo P0 funciona de punta a punta y qué falta para demo.
