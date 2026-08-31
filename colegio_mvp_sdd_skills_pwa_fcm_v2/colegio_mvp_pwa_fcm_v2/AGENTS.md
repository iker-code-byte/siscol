# AGENTS.md — Reglas de implementación

## Fuente de verdad

La fuente de verdad técnica es `docs/00_SDD_MASTER.md`. Los demás SDD detallan dominios específicos. Si una skill contradice el SDD master, prevalece el SDD master.

## Principios obligatorios

1. Construir un **monolito modular**, no microservicios.
2. No crear un API Gateway independiente en el MVP.
3. Mantener una única base PostgreSQL.
4. Administrador, Docente y Estudiante son usuarios internos autenticados.
5. Padre/Tutor **no es un usuario académico**. Se representa como `Guardian` y se autoriza por dispositivo vinculado.
6. Firebase FCM es el provider de producción del MVP; `MockNotificationProvider` debe existir para desarrollo y pruebas.
7. WhatsApp/SMS no deben bloquear ni condicionar el MVP.
8. No guardar secretos de Firebase Admin ni JWT en el repositorio.
9. Los payloads Push no deben contener notas, porcentajes, faltas concretas ni datos sensibles visibles en lock screen.
10. No cachear respuestas API con información académica en el service worker.
11. Aplicar permisos/ownership en backend, no solo en frontend.
12. Implementar primero el camino feliz P0 antes de optimizaciones.

## Política de cambios

Antes de crear una entidad, endpoint o dependencia nueva:

- comprobar si ya existe una abstracción en el SDD;
- preferir reutilización sobre duplicación;
- documentar cualquier desviación arquitectónica en un ADR corto;
- no introducir Celery/Redis, Kubernetes, WebSockets ni microservicios sin necesidad explícita.

## Definition of Done por módulo

Un módulo termina cuando:

- migraciones aplican desde cero;
- API valida permisos y datos;
- UI cubre el flujo P0;
- existen pruebas automáticas del caso feliz y del acceso no autorizado;
- no quedan secretos hardcodeados;
- lint/build/test pasan;
- el README o SDD afectado está actualizado.
