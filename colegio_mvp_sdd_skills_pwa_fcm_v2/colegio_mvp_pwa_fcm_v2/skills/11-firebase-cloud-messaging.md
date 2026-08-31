# Skill 11 — Firebase Cloud Messaging

## Objetivo
Integrar Web Push con FCM en frontend/PWA y backend.

## Frontend
1. Inicializar Firebase client con config pública.
2. Reutilizar ServiceWorkerRegistration.
3. Solicitar Notification permission solo tras click del tutor.
4. Obtener registration token usando VAPID public key.
5. POST token al endpoint de device subscription.
6. Manejar `onMessage` en foreground.
7. Manejar background push en service worker.
8. notification click -> URL interna segura.

## Backend
1. Inicializar Firebase Admin una vez.
2. Implementar `FirebasePushProvider`.
3. Mapear resultado a `DeliveryResult`.
4. Detectar token inválido y desactivar subscription.
5. Redactar errores antes de persistir/loggear.

## Payload
Usar título/body genéricos. Solo ID opaco/deep-link en data.

## Restricciones
- service account nunca en Vite/public.
- token FCM nunca en logs.
- fallo FCM no revierte la nota/asistencia.

## Tests
Mockear provider en CI. La prueba real FCM pertenece a staging/demo checklist.
