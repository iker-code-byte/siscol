# SDD 07 — Testing y QA

## 1. Objetivo

Priorizar pruebas que eviten fallos de demo, pérdida de datos y fugas entre usuarios.

## 2. Pirámide MVP

- Backend unit/service tests: mayoría.
- API permission tests: obligatorias.
- Frontend unit/component tests: flujos críticos.
- E2E: pocos escenarios de punta a punta.

## 3. P0 Backend

### Auth/RBAC

- credenciales válidas permiten login;
- inválidas fallan;
- Student no accede a endpoints Admin;
- Teacher no modifica asignación ajena;
- Student no ve otro student.

### Grades

- bulk válido guarda todas las filas;
- una fila inválida revierte la transacción;
- score > max_score falla;
- teacher de otra asignación recibe 403.

### Attendance

- bulk guarda;
- UNIQUE evita duplicados;
- teacher ajeno recibe 403;
- Student solo consulta propia.

### Q&A

- Student crea solo en asignación donde está matriculado;
- Teacher responde solo su asignación.

### Guardian activation

- código válido activa una vez;
- usado falla;
- expirado falla;
- revocado falla;
- múltiples intentos se limitan;
- autorización no puede cambiar `guardian_id` por parámetro.

### Guardian inbox

- dispositivo A no abre Notification de guardian B;
- dispositivo desactivado recibe 401/403;
- notification read solo afecta el guardian correcto.

### Alerts

- low grade crea AlertEvent;
- ejecución repetida no duplica fingerprint;
- repeated absence respeta ventana;
- tutor deshabilitado no recibe notification.

### FCM provider

Con provider mock/fake:

- SENT registra delivery;
- error temporal registra FAILED;
- invalid token desactiva subscription;
- payload no contiene score/detalle sensible.

## 4. P0 Frontend

- route guards por rol;
- GradeSheet captura/guarda filas;
- AttendanceSheet usa PRESENT por defecto;
- GuardianActivationForm maneja error/éxito;
- botón Push no solicita permiso automáticamente al cargar;
- estado permiso denied no rompe inbox;
- click de NotificationCard abre detalle.

## 5. P0 PWA

- manifest válido;
- service worker se registra;
- `/api` no se cachea;
- evento push muestra title/body genérico;
- notificationclick abre URL interna permitida;
- app funciona en HTTPS de staging.

## 6. E2E demo

### Escenario 1 — Nota baja

1. Seed demo.
2. Tutor activa dispositivo.
3. Tutor habilita Push.
4. Docente registra nota baja.
5. AlertEvent se crea.
6. Notification se crea.
7. Delivery se envía.
8. Tutor recibe Push.
9. Abre detalle autorizado.

### Escenario 2 — Falta

Mismo flujo con asistencia `ABSENT`.

### Escenario 3 — Aislamiento

Intentar abrir URL de notificación perteneciente a otro tutor y verificar 404/403 sin fuga de contenido.

## 7. Smoke test deployment

```text
GET /
POST /api/auth/login/
GET /api/auth/me/
GET /api/health/
activar tutor
registrar token mock/real
crear alerta demo
ver notification delivery
```
