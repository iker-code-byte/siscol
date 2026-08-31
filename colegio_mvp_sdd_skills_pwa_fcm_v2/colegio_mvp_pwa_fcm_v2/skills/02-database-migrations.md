# Skill 02 — Database & Migrations

## Objetivo
Mantener PostgreSQL reproducible y seguro para iteración rápida.

## Tareas
1. Generar migraciones pequeñas por dominio.
2. Ejecutar `migrate` desde cero.
3. Crear índices descritos en SDD.
4. Crear comando/fixture de seed idempotente.
5. Agregar health check DB.
6. Documentar backup/restore mínimo.

## Restricciones
- No editar migraciones aplicadas en entornos compartidos; crear nueva migración.
- No guardar PII/tokens en datos de seed reales.
- No usar SQLite como referencia de comportamiento de producción si afecta constraints PostgreSQL.

## Verificación
- DB vacía -> migrate -> seed -> tests.
- DB con seed -> seed nuevamente sin duplicación crítica.
