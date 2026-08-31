# Skill 13 — Reporting & Alert Engine

## Objetivo
Detectar condiciones académicas sin acoplarse al canal de notificación.

## Tareas
1. NotificationRule CRUD Admin.
2. AlertEvaluationService.
3. `AlertEvent.fingerprint` determinístico.
4. LOW_GRADE.
5. ABSENCE.
6. REPEATED_ABSENCE.
7. Comando `evaluate_alerts`.
8. Endpoint manual de demo Admin.
9. Reporte básico de alertas.

## Regla esencial
`alerts` crea eventos; no importa Firebase ni conoce tokens.

## Tests
- misma condición ejecutada dos veces => un AlertEvent;
- cambio relevante puede crear nuevo fingerprint cuando corresponda;
- rule disabled => no evento nuevo;
- ventanas de asistencia correctas.
