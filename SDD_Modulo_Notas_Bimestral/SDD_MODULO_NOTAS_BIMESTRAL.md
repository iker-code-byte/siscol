# SDD — Módulo de Notas Bimestral Tipo Excel

**Proyecto:** Sistema Web de Gestión Académica  
**Unidad Educativa:** Colegio Gabriel René Moreno II de Comarapa  
**Módulo:** Gestión de Notas  
**Versión:** 1.0  
**Estado:** Propuesto para MVP  
**Prioridad:** P0

---

## 1. Objetivo

Implementar un módulo de calificaciones bimestral que permita a los docentes gestionar las notas de sus estudiantes mediante una interfaz tipo hoja de cálculo, similar a Excel, optimizada para el registro rápido y masivo de calificaciones.

El docente deberá poder seleccionar gestión académica, periodo académico, curso y materia, y visualizar automáticamente todos los estudiantes inscritos en el curso seleccionado.

Desde una única pantalla podrá crear, editar, ordenar y eliminar actividades cuando corresponda; registrar y modificar notas directamente en una matriz; visualizar el promedio acumulado por estudiante; guardar cambios sin abandonar la pantalla; y trabajar con navegación por teclado.

## 2. Alcance del MVP

El módulo debe cubrir como mínimo:

1. Gestión de periodos académicos.
2. Cuatro bimestres configurados inicialmente.
3. Libro de calificaciones por curso, materia, periodo y profesor.
4. Actividades dinámicas creadas por el docente.
5. Registro de notas mediante tabla tipo Excel.
6. Cálculo automático de promedio.
7. Autoguardado de calificaciones.
8. Validación de permisos en backend.
9. Cierre de periodos.
10. Integración preparada con Alert Engine.
11. Soporte para actualización masiva de notas.
12. Trazabilidad mínima de cambios.

## 3. Cambio respecto al flujo original

El flujo individual de registro de notas se reemplaza por un libro de calificaciones matricial.

### Flujo anterior

```text
Profesor
   ↓
Selecciona curso
   ↓
Selecciona materia
   ↓
Selecciona estudiante
   ↓
Ingresa nota
```

### Nuevo flujo

```text
Profesor
   ↓
Selecciona gestión
   ↓
Selecciona bimestre
   ↓
Selecciona curso
   ↓
Selecciona materia
   ↓
Libro de calificaciones
   ↓
Filas = estudiantes
Columnas = actividades
   ↓
Registro masivo de notas
```

## 4. Concepto de Libro de Calificaciones

Cada combinación de Gestión Académica + Periodo Académico + Curso + Materia + Profesor representará un **Libro de Calificaciones** (`Gradebook`).

Ejemplo:

```text
Gestión: 2026
Periodo: Segundo Bimestre
Curso: 3ro A
Materia: Matemáticas
Profesor: Carlos Pérez
```

El sistema cargará automáticamente los estudiantes matriculados en el curso correspondiente.

## 5. Periodos académicos

El sistema NO debe estar acoplado rígidamente al concepto de bimestre. Se utilizará una entidad `AcademicPeriod`.

Configuración inicial:

| Orden | Nombre |
|---:|---|
| 1 | Primer Bimestre |
| 2 | Segundo Bimestre |
| 3 | Tercer Bimestre |
| 4 | Cuarto Bimestre |

Esto permitirá soportar posteriormente trimestres, semestres, parciales o periodos personalizados.

Estados del periodo:

```text
PLANNED
OPEN
CLOSED
```

- `PLANNED`: aún no disponible para registro.
- `OPEN`: permite registrar/modificar notas.
- `CLOSED`: solo lectura.

## 6. Interfaz principal tipo Excel

La pantalla principal debe utilizar una matriz similar a:

```text
┌────┬──────────────────┬─────────┬─────────┬─────────┬──────────┐
│ #  │ Estudiante       │ Tarea 1 │ Examen  │ Proyecto│ Promedio │
├────┼──────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 1  │ Ana Pérez        │   80    │   75    │   90    │   81.7   │
│ 2  │ Carlos Rojas     │   55    │   70    │   65    │   63.3   │
│ 3  │ María López      │   95    │   90    │   92    │   92.3   │
└────┴──────────────────┴─────────┴─────────┴─────────┴──────────┘
```

Reglas visuales:

- Cada fila representa un estudiante.
- Cada columna dinámica representa una actividad.
- La última columna muestra el promedio calculado.
- Las columnas `#` y `Estudiante` deberán permanecer visibles durante scroll horizontal cuando sea posible.
- La tabla deberá priorizar uso en laptop, desktop y tablet.
- En teléfonos deberá permitir scroll horizontal sin romper la edición.

## 7. Actividades dinámicas

Las actividades NO estarán definidas rígidamente en el código. Cada docente podrá crear actividades diferentes en cada bimestre.

Ejemplos: Tarea 1, Tarea 2, Trabajo práctico, Investigación, Exposición, Examen parcial, Examen bimestral, Proyecto, Participación, Laboratorio u Otro.

Datos mínimos de una actividad:

```text
name
description
activity_type
activity_date
max_score
weight
position
is_active
created_at
updated_at
```

## 8. Tipos de actividad

Para clasificación interna se podrán utilizar:

```text
TASK
EXAM
PRACTICE
PROJECT
PRESENTATION
PARTICIPATION
OTHER
```

El tipo no limita el nombre visible.

## 9. Crear actividad

La interfaz deberá incluir `+ Nueva actividad`.

Formulario mínimo:

- Nombre
- Tipo
- Fecha
- Puntaje máximo
- Descripción

Al guardar la actividad, deberá aparecer inmediatamente como una nueva columna del libro de calificaciones.

## 10. Editar actividad

Cada columna de actividad deberá permitir editar nombre, descripción, fecha, puntaje máximo, tipo, posición y eliminar cuando corresponda.

## 11. Eliminación de actividades

Si una actividad tiene notas registradas, el sistema deberá advertir al profesor antes de eliminarla.

```text
Esta actividad tiene 28 calificaciones registradas.

Si elimina la actividad también afectará las calificaciones asociadas.

¿Desea continuar?

[Cancelar] [Eliminar actividad]
```

Preferentemente utilizar eliminación lógica (`soft delete`) para mantener trazabilidad.

## 12. Orden de actividades

Las actividades tendrán un campo `position`. Para el MVP se podrá permitir mover a la izquierda, mover a la derecha o modificar posición. Drag & Drop queda para una fase posterior.

## 13. Registro de notas

Las notas se registrarán directamente en las celdas. No abrir formularios separados por estudiante.

## 14. Navegación tipo Excel

Debe soportarse como mínimo:

- `TAB`: avanzar a la siguiente celda.
- `SHIFT + TAB`: volver a la celda anterior.
- `ENTER`: confirmar valor.

Opcionalmente, flechas de dirección para moverse entre celdas.

## 15. Autoguardado

Cuando una celda cambie:

```text
Profesor modifica
80 → 85
      ↓
Frontend marca celda dirty
      ↓
Debounce
      ↓
PATCH/PUT API
      ↓
Backend valida
      ↓
PostgreSQL
      ↓
✓ Guardado
```

Estados visibles:

```text
Guardando...
✓ Guardado
⚠ Error al guardar
```

Nunca mostrar como guardada una nota que el backend rechazó.

## 16. Nota vacía vs. nota cero

Una actividad sin calificar debe almacenarse como `NULL`. Nunca convertir automáticamente una nota vacía en `0`.

```text
SIN CALIFICAR != NOTA 0
```

Ejemplo: 80, 70, NULL debe dar promedio `(80 + 70) / 2 = 75`.

## 17. Escala de calificación

Las actividades/calificaciones individuales se evalúan sobre un puntaje máximo de **45 puntos** (configuración `grading_scale_max = 45`).

```text
grading_scale_min = 0
grading_scale_max = 45
```

## 18. Cálculo de promedio

El promedio acumulado/final por estudiante se calcula y expresa en una escala de **0 a 100 puntos** (aprobación $\ge 51.0$), normalizando cada actividad evaluada según su puntaje máximo:

$$\text{Promedio} = \frac{1}{N} \sum_{i=1}^N \left(\frac{\text{nota}_i}{\text{puntaje\_máximo}_i} \times 100\right)$$

Las actividades sin calificar (`NULL`) no participan en el cálculo. El promedio se recalcula automáticamente y en tiempo real tras cada modificación.

## 19. Ponderaciones futuras

No implementar un motor complejo de ponderaciones en el MVP. El modelo deberá quedar preparado con un campo opcional `weight = NULL` para una futura configuración por porcentajes.

## 20. Modelo de datos

### AcademicPeriod

```text
id
academic_year_id
name
period_type
number
start_date
end_date
grade_entry_start
grade_entry_end
status
created_at
updated_at
```

### Gradebook

```text
id
academic_year_id
academic_period_id
course_id
subject_id
teacher_id
status
created_at
updated_at
```

Constraint recomendado:

```text
UNIQUE (
  academic_year_id,
  academic_period_id,
  course_id,
  subject_id,
  teacher_id
)
```

### GradeActivity

```text
id
gradebook_id
name
description
activity_type
activity_date
max_score
weight
position
is_active
created_at
updated_at
```

### GradeEntry

```text
id
activity_id
student_id
score
created_by
updated_by
created_at
updated_at
```

Constraint:

```text
UNIQUE(activity_id, student_id)
```

## 21. Cierre de bimestre

Cuando `AcademicPeriod.status = CLOSED`, el profesor podrá consultar notas, pero no modificarlas. El backend deberá bloquear cualquier intento de modificación. El administrador podrá reabrir un periodo si posteriormente se define esa política institucional.

## 22. Permisos

El profesor solo puede administrar libros asociados a sus asignaciones. La autorización debe aplicarse en backend mediante object-level authorization, aun cuando el usuario intente acceder directamente a la API.

## 23. API propuesta

```http
GET /api/v1/gradebooks/{id}/
GET /api/v1/gradebooks/{id}/matrix/
POST /api/v1/gradebooks/{gradebook_id}/activities/
PATCH /api/v1/grade-activities/{activity_id}/
DELETE /api/v1/grade-activities/{activity_id}/
PUT /api/v1/grade-entries/
PUT /api/v1/gradebooks/{id}/grades/bulk/
```

El endpoint de matriz debe devolver información del libro, actividades, estudiantes, notas y promedios en una respuesta optimizada.

## 24. Copy/Paste desde Excel

No es obligatorio para P0. La arquitectura frontend deberá permitir posteriormente copiar desde Excel y pegar una secuencia de valores directamente en el Gradebook. Clasificación: P2 / MVP+.

## 25. Diseño frontend

Componentes sugeridos:

```text
GradebookPage
│
├── GradebookToolbar
├── AcademicPeriodSelector
├── CourseSelector
├── SubjectSelector
├── GradeGrid
│   ├── StudentColumn
│   ├── ActivityColumn[]
│   ├── GradeCell[]
│   └── AverageColumn
├── CreateActivityDialog
├── EditActivityDialog
└── GradeSaveStatus
```

Mantener TypeScript estricto y separar responsabilidades.

## 26. Validaciones

Backend deberá validar:

- `score >= grading_scale_min`;
- `score <= activity.max_score`;
- profesor autorizado;
- estudiante perteneciente al curso;
- actividad perteneciente al Gradebook;
- periodo abierto;
- integridad de relaciones.

## 27. Integración con Alert Engine

```text
Profesor registra/modifica nota
        ↓
Grade Service
        ↓
Guarda nota
        ↓
Recalcula promedio
        ↓
Alert Engine
        ↓
¿Bajo rendimiento?
    │
    ├── NO → termina
    │
    └── SÍ
         ↓
       Alert
         ↓
 Notification Service
         ↓
 FirebaseProvider
         ↓
        FCM
         ↓
       Tutor
```

El módulo de notas NO debe llamar directamente a Firebase.

## 28. Evitar alertas prematuras

Debe existir una configuración `minimum_graded_activities_for_alert`, por ejemplo `2`, para evitar alertas de bajo rendimiento con información insuficiente.

## 29. Auditoría

Como mínimo registrar `created_by`, `updated_by`, `created_at` y `updated_at`. Dejar preparado el diseño para una futura entidad `GradeAuditLog` con estudiante, actividad, valor anterior, valor nuevo, usuario y fecha de modificación.

## 30. Rendimiento

El endpoint de matriz debe evitar consultas N+1 mediante `select_related`, `prefetch_related`, índices y bulk operations cuando correspondan. El MVP debe soportar al menos 30–40 estudiantes por curso y varias actividades por bimestre con edición fluida.

## 31. Casos de uso principales

### UC-N01 — Visualizar libro
DADO un profesor autenticado y una materia asignada, CUANDO selecciona un bimestre, ENTONCES debe visualizar todos los estudiantes y actividades correspondientes.

### UC-N02 — Crear actividad
DADO un Gradebook abierto, CUANDO el profesor crea `Examen 1`, ENTONCES debe aparecer una nueva columna.

### UC-N03 — Registrar nota
DADO un estudiante y una actividad, CUANDO el profesor registra `85`, ENTONCES debe almacenarse la calificación.

### UC-N04 — Modificar nota
DADO `score = 75`, CUANDO cambia a `80`, ENTONCES el valor persistido debe ser `80`.

### UC-N05 — Promedio
DADO 80, 90 y 70, ENTONCES el promedio debe ser 80.

### UC-N06 — NULL
DADO 80, NULL y 70, ENTONCES el promedio debe ser 75.

### UC-N07 — Periodo cerrado
DADO un bimestre cerrado, CUANDO el profesor intenta modificar una nota, ENTONCES la API debe rechazar la operación.

### UC-N08 — Acceso horizontal
DADO Profesor A, CUANDO intenta modificar un Gradebook de Profesor B, ENTONCES debe recibir `403 Forbidden`.

## 32. Criterio principal de aceptación

El módulo será funcional cuando pueda demostrarse:

```text
Profesor inicia sesión
        ↓
Selecciona Gestión 2026
        ↓
Selecciona Segundo Bimestre
        ↓
Selecciona 3ro A
        ↓
Selecciona Matemáticas
        ↓
Sistema muestra todos los estudiantes
        ↓
Profesor presiona "+ Nueva actividad"
        ↓
Crea "Tarea de ecuaciones"
        ↓
Aparece una nueva columna
        ↓
Profesor registra notas directamente en las celdas
        ↓
Usa TAB para avanzar
        ↓
Sistema guarda automáticamente
        ↓
Promedios se recalculan
        ↓
Profesor crea "Examen bimestral"
        ↓
Registra nuevas calificaciones
        ↓
Alert Engine evalúa bajo rendimiento
```

## 33. Definition of Done

- [ ] Existan 4 bimestres iniciales.
- [ ] Profesor pueda seleccionar gestión.
- [ ] Profesor pueda seleccionar bimestre.
- [ ] Profesor pueda seleccionar curso.
- [ ] Profesor pueda seleccionar materia.
- [ ] Estudiantes se carguen automáticamente.
- [ ] Exista tabla tipo Excel.
- [ ] Profesor pueda crear actividades.
- [ ] Profesor pueda editar actividades.
- [ ] Actividades aparezcan como columnas.
- [ ] Estudiantes aparezcan como filas.
- [ ] Celdas sean editables.
- [ ] Exista navegación por TAB.
- [ ] Las notas sean persistidas.
- [ ] `NULL` sea diferente de `0`.
- [ ] Promedio se calcule automáticamente.
- [ ] Profesor solo pueda modificar materias asignadas.
- [ ] Periodos cerrados bloqueen modificaciones.
- [ ] Backend valide permisos.
- [ ] Existan pruebas unitarias.
- [ ] Existan pruebas de integración.
- [ ] Alert Engine pueda consumir resultados académicos.

## 34. Prioridades de implementación

### P0 — Obligatorio para MVP

- AcademicPeriod
- Gradebook
- GradeActivity
- GradeEntry
- cuatro bimestres
- selección de gestión
- selección de periodo
- selección de curso
- selección de materia
- carga automática de estudiantes
- tabla tipo Excel
- actividades dinámicas
- crear actividad
- editar actividad
- registro inline de notas
- navegación con TAB
- autosave
- NULL diferente de 0
- promedio automático
- RBAC/object-level authorization
- pruebas principales

### P1

- eliminación de actividad;
- cierre de bimestre;
- bulk update;
- integración completa con Alert Engine;
- historial básico de cambios.

### P2

- copy/paste desde Excel;
- drag & drop;
- ponderaciones;
- importación Excel;
- exportación Excel;
- auditoría completa.

## 35. Regla de implementación para el agente

El flujo original de registro individual de notas queda reemplazado por este SDD.

No implementar un flujo donde el profesor tenga que abrir a cada estudiante individualmente.

La experiencia principal DEBE ser un libro de calificaciones tipo Excel:

```text
Filas = Estudiantes
Columnas = Actividades creadas por el profesor
Última columna = Promedio
```

Priorizar primero este vertical slice:

```text
Profesor
↓
Curso
↓
Materia
↓
Bimestre
↓
Gradebook
↓
Crear actividad
↓
Registrar notas tipo Excel
↓
PostgreSQL
↓
Promedio actualizado
↓
Alert Engine
```

No invertir tiempo inicialmente en gráficos, animaciones, exportaciones, ponderaciones complejas, drag & drop o funcionalidades cosméticas.
