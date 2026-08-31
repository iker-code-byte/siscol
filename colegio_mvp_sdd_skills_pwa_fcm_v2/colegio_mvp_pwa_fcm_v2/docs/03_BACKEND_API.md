# SDD 03 — Backend API

## 1. Principios

- Prefijo: `/api/`.
- JSON.
- HTTP status coherentes.
- Errores con estructura estándar.
- Paginación para listados administrativos.
- Servicios de negocio transaccionales.

## 2. Error estándar

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Los datos enviados no son válidos.",
    "fields": {
      "score": ["Debe ser menor o igual al puntaje máximo."]
    }
  }
}
```

No devolver stack traces al cliente.

## 3. Auth usuarios internos

### POST `/api/auth/login/`

Entrada:

```json
{"username":"docente1","password":"***"}
```

Salida:

```json
{
  "access_token":"...",
  "user":{"id":"...","role":"TEACHER","username":"docente1"}
}
```

Refresh debe ir protegido de acuerdo con la implementación elegida; evitar refresh persistente en localStorage.

### GET `/api/auth/me/`

Devuelve usuario y perfil mínimo.

## 4. Administración académica

CRUD restringido a Admin:

```text
/api/academic-years/
/api/courses/
/api/subjects/
/api/students/
/api/teachers/
/api/guardians/
/api/student-guardians/
/api/enrollments/
/api/teaching-assignments/
```

## 5. Grades

### GET `/api/grades/`

Docente: solo asignaciones propias. Admin: todas.

Filtros:

```text
course_id
subject_id
teaching_assignment_id
term
student_id
```

### POST `/api/grades/bulk/`

```json
{
  "teaching_assignment_id":"...",
  "term":"T1",
  "activity_name":"Evaluación 1",
  "max_score":100,
  "date":"2026-08-29",
  "grades":[
    {"student_id":"...","score":75},
    {"student_id":"...","score":40}
  ]
}
```

Servicio:

1. verificar ownership;
2. verificar matrícula activa;
3. validar scores;
4. guardar transaccionalmente;
5. auditar;
6. lanzar evaluación de alertas tras commit.

### GET `/api/me/grades/`

Ignora cualquier `student_id` proporcionado por cliente; deriva Student desde usuario autenticado.

## 6. Attendance

### POST `/api/attendance/bulk/`

```json
{
  "teaching_assignment_id":"...",
  "date":"2026-08-29",
  "rows":[
    {"student_id":"...","status":"PRESENT"},
    {"student_id":"...","status":"ABSENT"}
  ]
}
```

Aplicar `update_or_create` controlado o upsert equivalente bajo transacción.

## 7. Q&A

### POST `/api/questions/`

El Student se deriva del usuario actual.

```json
{
  "teaching_assignment_id":"...",
  "subject":"Consulta sobre tarea",
  "body":"..."
}
```

### POST `/api/questions/{id}/answers/`

Solo teacher de la asignación o Admin si se decide habilitarlo.

## 8. Tutor: activación

### POST `/api/guardian/activation/verify/`

```json
{"code":"GRM-847291","device_name":"iPhone de mamá"}
```

Backend:

1. rate-limit por IP/device hints;
2. normalizar código;
3. buscar candidatos vigentes;
4. comparar hash en tiempo constante;
5. rechazar expirado/usado/revocado;
6. marcar `used_at`;
7. crear `GuardianDevice`;
8. emitir autorización limitada para ese dispositivo;
9. registrar AuditLog.

Respuesta mínima:

```json
{
  "guardian":{"display_name":"María G."},
  "device":{"id":"..."},
  "push_enabled":false
}
```

No devolver lista completa de estudiantes en la pantalla de activación si no es necesario.

## 9. Tutor: PushSubscription

### POST `/api/guardian/devices/push-subscription/`

```json
{
  "provider":"FCM",
  "token":"<fcm-registration-token>",
  "platform":"IOS_PWA"
}
```

- Solo sesión/dispositivo tutor válido.
- Token se protege y nunca se incluye en respuestas/listados posteriores.
- Si un mismo token cambia de dispositivo, resolver de forma segura y registrar auditoría.

### DELETE `/api/guardian/devices/push-subscription/`

Desactiva la suscripción del dispositivo actual.

## 10. Tutor: Inbox

### GET `/api/guardian/notifications/`

El guardian se deriva de la sesión del dispositivo.

Salida:

```json
{
  "results":[
    {
      "id":"...",
      "category":"ATTENDANCE",
      "student_display":"Juan P.",
      "summary":"Nueva alerta de asistencia",
      "created_at":"...",
      "read":false
    }
  ]
}
```

### GET `/api/guardian/notifications/{id}/`

Debe verificar que `notification.guardian_id` pertenece al dispositivo autorizado actual.

## 11. Reglas y alertas

- `GET /api/notification-rules/`
- `PATCH /api/notification-rules/{id}/`
- `POST /api/alerts/run-evaluation/` Admin
- `GET /api/alerts/` Admin
- `GET /api/notifications/` Admin
- `POST /api/notifications/{id}/retry/` Admin

## 12. Services recomendados

```text
GradeBulkService
AttendanceBulkService
GuardianActivationService
GuardianDeviceService
AlertEvaluationService
NotificationComposer
NotificationDispatchService
FirebasePushProvider
AuditService
```

## 13. Idempotencia

- `AlertEvent.fingerprint` evita duplicar la misma condición.
- `NotificationDelivery(notification, subscription)` UNIQUE evita delivery duplicado.
- Retry solo aumenta `attempt_count`; no crea una nueva notificación salvo regla explícita.
