# Skill 17 — DevOps & Deployment

## Objetivo
Desplegar el MVP de forma repetible en VPS.

## Tareas
1. Dockerfiles multi-stage.
2. docker-compose para backend/postgres/nginx.
3. build frontend -> Nginx.
4. proxy `/api`.
5. TLS.
6. secret mount Firebase Admin.
7. migrations al deploy.
8. cron de alerts/retry/backup.
9. health check.
10. rollback básico.

## Restricciones
- no meter service account dentro de imagen;
- no exponer PostgreSQL públicamente;
- no activar DEBUG en producción.

## DoD
Deploy limpio desde README + smoke tests.
