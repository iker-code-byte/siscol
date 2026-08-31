# SDD 10 — Trazabilidad con el proyecto original

## Requisitos conservados

| Fuente conceptual original | Implementación MVP v2 |
|---|---|
| Sistema web para notas y asistencia | React + Django + PostgreSQL |
| Roles administrador/docente/estudiante | Se mantienen como usuarios internos |
| Docente registra notas | `grades` + planilla bulk |
| Docente registra asistencia | `attendance` + planilla bulk |
| Estudiante consulta notas/asistencia | `/student/*` + `/api/me/*` |
| Preguntas y respuestas en flujo docente | módulo `qa` |
| Reporting analiza bajo rendimiento/inasistencias | `alerts` + `NotificationRule` + `AlertEvent` |
| Padres/tutores no ingresan al sistema académico | Guardian sin User/RBAC académico |
| Padres/tutores reciben avisos | PWA + FCM Push |

## Cambio de canal de notificación

El documento original plantea WhatsApp como medio de notificación. En el MVP v2 el canal se sustituye por Firebase Cloud Messaging debido a la dependencia externa de publicación/verificación del negocio en Meta.

La lógica funcional no cambia:

```text
Evento académico
  -> regla
  -> alerta
  -> tutor
```

Solo cambia la capa de delivery:

```text
Antes: WhatsApp
MVP v2: FCM Web Push
Futuro: FCM + WhatsApp + SMS según disponibilidad
```

## Refinamiento del modelo tutor

El MVP v2 convierte la relación simple tutor-estudiante en N:M mediante `StudentGuardian`, porque permite representar de forma natural:

- dos tutores para un estudiante;
- un tutor con varios estudiantes;
- control individual de recepción.

Esto es una decisión arquitectónica de implementación y no modifica el objetivo académico del proyecto.
