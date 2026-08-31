# Colegio Gabriel René Moreno II — Pack MVP v2 (PWA + Firebase Push)

Este paquete sustituye el diseño de notificaciones basado en WhatsApp como dependencia del MVP.

## Decisión principal

El MVP mantiene como usuarios internos a **Administrador, Docente y Estudiante**. El **Padre/Tutor** sigue siendo un actor externo al sistema académico: no recibe una cuenta académica ni permisos para administrar datos. En su lugar, instala la misma aplicación web como **PWA**, vincula su dispositivo mediante un código de activación y recibe notificaciones Push mediante **Firebase Cloud Messaging (FCM)**.

WhatsApp y SMS quedan como providers futuros opcionales detrás de una interfaz `NotificationProvider`.

## Stack MVP

- Frontend: React + Vite + TypeScript
- UI: Tailwind CSS
- PWA: Web App Manifest + Service Worker
- Push: Firebase Cloud Messaging (Web Push)
- Backend: Django + Django REST Framework
- Auth usuarios internos: JWT (access corto + refresh seguro)
- Vinculación tutor: código de activación de un solo uso + sesión/dispositivo limitado
- Base de datos: PostgreSQL
- Scheduler: Django management command + cron
- Proxy/TLS: Nginx
- Contenedores: Docker Compose
- Tests: Pytest/DRF + Vitest

## Estructura

- `docs/00_SDD_MASTER.md`: fuente de verdad del proyecto.
- `docs/01_ARCHITECTURE.md`: arquitectura lógica/física y decisiones.
- `docs/02_DATA_MODEL.md`: entidades, relaciones y restricciones.
- `docs/03_BACKEND_API.md`: contratos REST y servicios backend.
- `docs/04_FRONTEND_PWA.md`: rutas, PWA, UX y service worker.
- `docs/05_NOTIFICATIONS_FCM.md`: alertas, FCM, activación de tutor y payloads.
- `docs/06_SECURITY_PRIVACY.md`: RBAC, privacidad, secretos y controles.
- `docs/07_TESTING_QA.md`: estrategia y pruebas P0/P1.
- `docs/08_DEPLOYMENT_OPERATIONS.md`: Docker, Nginx, TLS, backups y operación.
- `docs/09_MVP_ROADMAP.md`: plan rápido de construcción.
- `docs/10_SOURCE_TRACEABILITY.md`: trazabilidad entre el proyecto original y el MVP.
- `skills/`: skills de implementación para agentes de IA.
- `AGENTS.md`: reglas operativas para agentes de desarrollo.
- `templates/`: ejemplos de variables de entorno y checklist de demo.

## Orden recomendado para un agente

1. Leer `AGENTS.md`.
2. Leer `docs/00_SDD_MASTER.md`.
3. Ejecutar `skills/00-project-orchestrator.md`.
4. Continuar por las skills en orden numérico.
5. No avanzar de fase si fallan las pruebas P0.

## Criterio de éxito del MVP

Debe existir un flujo demostrable de punta a punta:

1. Admin configura año, curso, materia, docente, estudiante y tutor.
2. Docente registra notas y asistencia.
3. Estudiante consulta sus datos.
4. El motor detecta una condición de alerta.
5. Tutor vincula una PWA a su dispositivo.
6. FCM entrega una notificación Push genérica y privada.
7. Al tocarla, el tutor accede únicamente a sus notificaciones autorizadas.
8. El sistema registra auditoría y estado de entrega.
