# Skill 09 — Guardian Device Enrollment

## Objetivo
Permitir que un tutor reciba y consulte notificaciones sin crear una cuenta académica.

## Lee
- `docs/02_DATA_MODEL.md`
- `docs/03_BACKEND_API.md`
- `docs/05_NOTIFICATIONS_FCM.md`
- `docs/06_SECURITY_PRIVACY.md`

## Backend
1. `GuardianActivationCode` con hash, expiry, used_at, revoked_at.
2. Servicio CSPRNG para códigos.
3. Endpoint Admin para generar/revocar.
4. `GuardianActivationService.verify_and_link()` transaccional.
5. Crear `GuardianDevice`.
6. Emitir autorización limitada para dispositivo.
7. Endpoint unlink.
8. Audit.

## Frontend
- `/guardian/activate`.
- campo code.
- éxito -> onboarding Push.
- error genérico.
- settings para unlink.

## Seguridad
- nunca guardar código plano en DB/log;
- single-use;
- rate limit;
- no aceptar guardian_id desde cliente;
- dispositivo inactivo pierde inbox.

## Tests P0
válido, expirado, usado, revocado, brute-force/rate-limit, guardian isolation.
