# SDD 08 — Deployment y operación

## 1. Docker Compose

Servicios mínimos:

```text
nginx
backend
postgres
```

Frontend se compila en build stage y Nginx sirve estáticos.

No se requiere container Firebase: backend consume servicio cloud.

## 2. Estructura sugerida

```text
repo/
  backend/
  frontend/
  deploy/
    nginx/
    docker-compose.yml
  .env.example
  README.md
```

## 3. Nginx

- `/` -> frontend estático.
- `/api/` -> Gunicorn/Django.
- `/admin/` de Django solo si se decide exponer; preferible restringir.
- HTTPS.
- headers de seguridad.
- `Cache-Control: no-store` para API privada.
- assets con cache largo versionado.

## 4. Variables backend

```env
DJANGO_SECRET_KEY=
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=
DATABASE_URL=
CORS_ALLOWED_ORIGINS=
CSRF_TRUSTED_ORIGINS=
NOTIFICATION_PROVIDER=fcm
GOOGLE_APPLICATION_CREDENTIALS=/run/secrets/firebase-service-account.json
```

## 5. Variables frontend

```env
VITE_API_BASE_URL=/api
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

## 6. Secrets

- `.env` real fuera de Git.
- service account JSON fuera de imagen.
- montar archivo read-only.
- `.env.example` sin credenciales.

## 7. Migrations

Deploy:

```text
backup DB
pull/build
python manage.py migrate
python manage.py collectstatic (si aplica)
restart backend/nginx
smoke test
```

## 8. Cron

Ejemplo conceptual:

```text
01:00 evaluate_alerts
cada 1h retry_notifications
02:00 database backup
```

Para demo puede ejecutarse `run-evaluation` manual desde Admin.

## 9. Health checks

- `/api/health/` comprueba app y DB.
- Firebase no debe volver unhealthy todo el sistema; su fallo se refleja en deliveries.

## 10. Backups

- `pg_dump` diario.
- retención inicial configurable.
- documentar restore.
- prueba de restore antes de feria/entrega.

## 11. Observabilidad mínima

Logs JSON o estructurados con:

```text
timestamp
level
request_id
user/device actor id pseudónimo
module
action
status
```

Nunca token FCM, password, activation code plano o private key.
