# SDD 05 — Alertas, Tutores y Firebase Cloud Messaging

## 1. Objetivo

Implementar notificaciones reales al tutor sin WhatsApp como requisito del MVP.

## 2. Separación de responsabilidades

```text
Grade/Attendance
   ↓
AlertEvaluationService
   ↓
AlertEvent
   ↓
NotificationComposer
   ↓
Notification
   ↓
NotificationDispatchService
   ↓
NotificationProvider
   ↓
FirebasePushProvider
```

Ningún módulo académico debe conocer tokens FCM.

## 3. NotificationProvider

Contrato conceptual:

```python
class NotificationProvider(Protocol):
    def send(self, *, subscription, notification) -> DeliveryResult: ...
```

Implementaciones:

```text
MockNotificationProvider   desarrollo/tests
FirebasePushProvider       MVP producción
WhatsAppProvider           futuro
SmsProvider                futuro
```

## 4. Reglas MVP sugeridas

### LOW_GRADE

Detecta una nota o promedio por debajo de un umbral configurable.

### ABSENCE

Puede generar evento por falta individual si la institución lo desea.

### REPEATED_ABSENCE

Detecta N faltas dentro de X días.

### LATE

Opcional para MVP; mismo patrón que ausencia.

## 5. Deduplicación

Crear `fingerprint` estable. Ejemplos conceptuales:

```text
LOW_GRADE:<student>:<grade>
ABSENCE:<student>:<attendance>
REPEATED_ABSENCE:<student>:<rule>:<period-start>
```

Una misma `AlertEvent` no genera múltiples Notifications al mismo tutor salvo política explícita de reminder.

## 6. Activación del tutor

### Generación Admin

- Seleccionar tutor.
- Generar código aleatorio de alta entropía human-friendly.
- Guardar solo hash.
- TTL recomendado configurable, p.ej. 24 horas para demo/operación.
- Mostrar código una sola vez.
- Permitir revocar.

### Consumo

- Tutor abre PWA.
- Ingresa código.
- Backend valida vigencia/uso.
- Crea GuardianDevice.
- Código queda usado.
- El dispositivo recibe una autorización restringida al guardian.

## 7. Firebase — cliente

El frontend necesita configuración pública de Firebase y VAPID public key. Esos valores no equivalen a una service account privada.

Variables conceptuales:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

## 8. Firebase — servidor

Django usa Firebase Admin SDK con credencial de servicio fuera del repositorio.

Ejemplo conceptual:

```env
FIREBASE_PROJECT_ID=
GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase-service-account.json
NOTIFICATION_PROVIDER=fcm
```

Para tests/local:

```env
NOTIFICATION_PROVIDER=mock
```

## 9. Payload Push seguro

### Permitido

```json
{
  "title":"Colegio Gabriel René Moreno II",
  "body":"Tienes una nueva notificación académica.",
  "data":{
    "notification_id":"opaque-id",
    "url":"/guardian/notifications/opaque-id"
  }
}
```

### No permitido

```text
"Juan obtuvo 32/100 en Matemáticas"
"Juan faltó hoy sin justificación"
"Promedio actual: 48%"
```

Razón: el lock screen puede ser visible a terceros.

## 10. Entrega

Por cada Notification:

1. resolver Guardian asociado al Student;
2. excluir tutores sin `can_receive_notifications`;
3. resolver PushSubscription activas;
4. crear NotificationDelivery `PENDING`;
5. enviar FCM;
6. `SENT` si provider acepta;
7. `FAILED` si error temporal;
8. `INVALID_TOKEN` y desactivar subscription si token dejó de ser válido.

## 11. Retry

MVP:

- manual desde Admin;
- job periódico para `FAILED` con `attempt_count < MAX_RETRIES`;
- backoff simple;
- no reintentar `INVALID_TOKEN`.

## 12. Inbox tutor

El inbox del tutor no depende de que FCM haya llegado. La Notification se crea en DB primero; FCM es delivery.

Esto permite:

- ver avisos si el permiso Push está deshabilitado;
- reintentar deliveries;
- mantener historial.

## 13. Casos borde

- Tutor con dos teléfonos: ambos pueden recibir.
- Tutor con dos estudiantes: inbox unificado autorizado.
- Estudiante con dos tutores: ambos reciben si están habilitados.
- Token cambia: registrar token nuevo y desactivar duplicados.
- PWA reinstalada: volver a vincular si se perdió la autorización local.
- Código filtrado: single-use + TTL + revocación + rate limit reducen riesgo.
