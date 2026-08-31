# Skill 15 — Security & Privacy Review

## Objetivo
Aplicar el baseline obligatorio antes de declarar MVP listo.

## Checklist
- [ ] RBAC backend.
- [ ] Ownership Teacher/Student/GuardianDevice.
- [ ] Activation code hash/TTL/single-use.
- [ ] Rate limit login/activation.
- [ ] HTTPS.
- [ ] CORS/CSRF/cookies coherentes.
- [ ] Secrets fuera de Git.
- [ ] FCM Admin key solo backend.
- [ ] Push payload genérico.
- [ ] `/api` no-store.
- [ ] SW no cachea API.
- [ ] Logs sin tokens/passwords/codes.
- [ ] Audit crítico.
- [ ] Backup/restore probado.

## Prueba adversarial mínima
Intentar modificar IDs en URLs/bodies y comprobar que no permite acceso cruzado.
