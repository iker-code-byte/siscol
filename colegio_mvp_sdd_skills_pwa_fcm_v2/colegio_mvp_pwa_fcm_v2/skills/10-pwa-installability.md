# Skill 10 — PWA Installability

## Objetivo
Convertir el frontend existente en PWA sin crear una app móvil separada.

## Tareas
1. Web App Manifest.
2. Iconos del proyecto.
3. Service worker.
4. Registro SW desde frontend.
5. Start URL guardian.
6. UI de ayuda para instalación.
7. Estrategia de actualización del SW.

## Cache policy
Permitido:
- HTML shell;
- JS/CSS versionados;
- iconos/assets públicos.

Prohibido:
- `/api/**`;
- notas;
- asistencia;
- notification detail;
- tokens.

## Tests
- manifest válido;
- app installable en entorno HTTPS;
- offline puede mostrar shell/error, no datos privados viejos;
- nueva versión se actualiza de forma controlada.
