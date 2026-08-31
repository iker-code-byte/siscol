# Skill 14 — Notification Service

## Objetivo
Convertir AlertEvents en Notifications y deliveries a providers.

## Tareas
1. `NotificationComposer`.
2. Resolver tutores con `can_receive_notifications=true`.
3. Crear una Notification por tutor/evento según dedupe.
4. Resolver PushSubscriptions activas.
5. Crear NotificationDelivery.
6. Ejecutar provider configurado.
7. Retry manual + job simple.
8. Historial Admin.
9. Inbox tutor independiente del delivery.

## Provider config
```text
mock -> desarrollo/tests
fcm  -> staging/producción MVP
```

## Privacidad
`safe_title` y `safe_body` no incluyen detalle académico sensible.

## Tests
- tutor sin dispositivo conserva inbox pero no delivery;
- dos dispositivos => dos deliveries;
- invalid token desactiva solo subscription afectada;
- dedupe evita reenvío.
