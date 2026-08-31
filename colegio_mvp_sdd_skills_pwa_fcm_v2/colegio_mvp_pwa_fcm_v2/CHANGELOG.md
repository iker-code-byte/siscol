# Changelog

## v2.0 — 2026-08-29

### Cambio principal
- WhatsApp Cloud API deja de ser dependencia del MVP.
- Firebase Cloud Messaging/Web Push pasa a ser el provider principal.
- React/Vite se convierte en PWA instalable.

### Tutor
- Guardian permanece fuera del RBAC académico.
- Se agrega activación por código temporal de un solo uso.
- Se agrega GuardianDevice y PushSubscription.
- Se agrega inbox del tutor.
- Relación Student-Guardian pasa a N:M.

### Seguridad
- Push sin detalle sensible en lock screen.
- Service worker no cachea APIs/datos académicos.
- Credencial Firebase Admin solo backend.
- Dedupe y lifecycle de tokens.

### Desarrollo
- Se agregan SDD específicos para PWA, FCM, seguridad, testing y deployment.
- Se amplía el set a 20 skills de implementación/release.
