# SDD 09 — Roadmap rápido del MVP

## Objetivo

Llegar a un recorrido demostrable en aproximadamente 10 jornadas de desarrollo concentrado, priorizando el camino crítico.

## Día 1 — Bootstrap + modelo académico

- repositorio;
- Docker Compose;
- Django/DRF;
- React/Vite/TS/Tailwind;
- PostgreSQL;
- models académicos base;
- migrations;
- seed inicial.

**Salida:** proyecto levanta de cero.

## Día 2 — Auth/RBAC + Admin académico

- login;
- roles;
- permisos;
- CRUD de course/subject/student/teacher/guardian;
- TeachingAssignment y Enrollment.

**Salida:** admin puede preparar curso demo.

## Día 3 — Notas

- Grade model/API/service;
- bulk save;
- planilla React;
- validación y auditoría.

**Salida:** docente registra notas.

## Día 4 — Asistencia

- Attendance API/service;
- planilla con PRESENT por defecto;
- consulta estudiante.

**Salida:** docente registra asistencia.

## Día 5 — Portal estudiante + Q&A

- mis notas;
- mi asistencia;
- preguntas;
- respuestas docente.

**Salida:** flujo estudiante completo.

## Día 6 — Alert Engine + Reporting mínimo

- NotificationRule;
- AlertEvent;
- dedupe;
- evaluación manual + management command;
- admin alerts.

**Salida:** una nota/falta produce evento deduplicado.

## Día 7 — Tutor + PWA

- GuardianActivationCode;
- GuardianDevice;
- activation UI;
- inbox;
- manifest/service worker;
- instalación PWA.

**Salida:** tutor vincula teléfono sin cuenta académica.

## Día 8 — Firebase FCM

- Firebase client;
- VAPID;
- PushSubscription;
- Firebase Admin provider;
- Push seguro;
- notification click.

**Salida:** Push real llega al dispositivo.

## Día 9 — Seguridad + QA P0

- tests permissions;
- tests guardian isolation;
- tests alert dedupe;
- payload privacy;
- cache headers;
- error handling;
- retry.

**Salida:** suite P0 verde.

## Día 10 — Deploy + demo

- VPS/staging;
- Nginx/TLS;
- cron;
- backup;
- seed demo;
- walkthrough;
- documentación.

**Salida:** MVP listo para presentar.

## Corte de alcance si falta tiempo

Eliminar primero:

1. reportes avanzados;
2. múltiples respuestas Q&A;
3. retry automático sofisticado;
4. dashboard gráfico;
5. PWA offline shell avanzado.

No eliminar:

- RBAC/ownership;
- notas;
- asistencia;
- estudiante;
- guardian activation;
- Push FCM;
- privacidad del payload;
- dedupe;
- pruebas P0.
