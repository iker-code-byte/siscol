# SDD 06 — Seguridad y privacidad

## 1. Modelo de confianza

- Navegador/PWA es no confiable.
- Todo `student_id`, `guardian_id`, `assignment_id` enviado por cliente debe revalidarse.
- Firebase confirma entrega técnica, no autorización de lectura.
- El backend es la autoridad de permisos.

## 2. Usuarios internos

### JWT

- access token corto;
- refresh protegido y rotado si la implementación lo permite;
- logout invalida refresh;
- no guardar refresh de larga vida en localStorage.

### RBAC

Roles:

```text
ADMIN
TEACHER
STUDENT
```

Guardian no es Role de User.

## 3. Ownership

### Teacher

Debe probar:

```text
TeachingAssignment.teacher == request.user.teacher
```

antes de leer/modificar grades, attendance o questions.

### Student

Endpoints `/me/*` derivan Student desde request.user. No aceptar `student_id` para cambiar el sujeto.

### GuardianDevice

Backend deriva guardian desde autorización de dispositivo. Nunca aceptar `guardian_id` como parámetro de filtro de seguridad.

## 4. Activation code

- generar con CSPRNG;
- guardar hash, no plaintext;
- expiración;
- single-use;
- revocable;
- contador/limitación de intentos;
- respuesta genérica para códigos inválidos.

## 5. Push privacy

Push visible debe ser genérico.

El detalle se recupera desde API después de autorización.

Evitar incluir en payload:

- score;
- promedio;
- tipo exacto de falta si no es necesario;
- comentarios del docente;
- información disciplinaria;
- documentos personales.

## 6. Service Worker

- no cachear API;
- no cachear inbox/detalle privado;
- no persistir tokens en logs;
- validar URLs de notification click para no crear open redirect.

## 7. Firebase secrets

### Frontend

Firebase web config y VAPID public key son configuración cliente.

### Backend

Service account/private key es secreto crítico:

- fuera de Git;
- montada como secret/file/env seguro;
- mínimo privilegio;
- rotación si se expone.

## 8. HTTP

Producción:

- HTTPS obligatorio;
- HSTS cuando dominio/TLS estén estabilizados;
- `X-Content-Type-Options: nosniff`;
- `Referrer-Policy` restrictiva;
- CSP razonable compatible con Firebase;
- cookies `Secure`, `HttpOnly`, `SameSite` según flujo.

## 9. Cache-Control

API privada:

```text
Cache-Control: no-store
```

Especialmente:

```text
/api/me/*
/api/guardian/*
/api/grades/*
/api/attendance/*
```

## 10. Auditoría mínima

Registrar:

- login fallido relevante;
- cambios de notas;
- cambios de asistencia;
- cambios de reglas;
- generación/revocación/consumo de activation code;
- alta/baja de GuardianDevice;
- alta/baja de PushSubscription;
- retry manual de notification.

No registrar secretos/tokens completos.

## 11. Rate limiting

Prioridades:

1. login;
2. activation verify;
3. notification retry/admin trigger.

## 12. Backups

- backup PostgreSQL diario para demo/producción inicial;
- prueba de restore antes de entrega final;
- backup cifrado si se almacena fuera del servidor.
