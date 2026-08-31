# SDD 04 — Frontend y PWA

## 1. Objetivo

Mantener una sola aplicación React/Vite/TypeScript, con áreas por rol y un modo PWA para tutores.

## 2. Rutas

```text
/
/login

/admin
/admin/students
/admin/guardians
/admin/teachers
/admin/courses
/admin/subjects
/admin/assignments
/admin/alert-rules
/admin/notifications

/teacher
/teacher/grades
/teacher/attendance
/teacher/questions
/teacher/reports

/student
/student/grades
/student/attendance
/student/questions

/guardian/activate
/guardian/inbox
/guardian/notifications/:id
/guardian/settings
```

## 3. Componentes P0

### Comunes

- AppShell
- TopBar
- SideNav
- DataTable
- FormField
- Select
- LoadingState
- EmptyState
- ErrorState
- ConfirmDialog
- Toast

### Grades

- AssignmentSelector
- GradeSheet
- GradeRow
- BulkSaveBar

### Attendance

- AttendanceSheet
- AttendanceStatusToggle
- BulkAttendanceActions

### Guardian

- GuardianActivationForm
- InstallPwaHelp
- PushPermissionCard
- NotificationInbox
- NotificationCard
- NotificationDetail
- DeviceSettings

## 4. UX notas

- Planilla, no formulario alumno por alumno.
- Guardar masivo.
- Mostrar errores por fila.
- Advertir cambios sin guardar.
- No recalcular ni alterar notas silenciosamente.

## 5. UX asistencia

- Todos `PRESENT` por defecto en una nueva fecha.
- Docente marca únicamente excepciones.
- Filtros/contador de presentes/faltas/atrasos.
- Confirmación de guardado.

## 6. PWA

### Manifest

Debe definir como mínimo:

```text
name
short_name
start_url=/guardian/inbox
display=standalone
icons
background_color/theme_color según branding
```

### Service Worker

Responsabilidades:

- precache del app shell;
- actualizar assets estáticos;
- recibir Push FCM en background;
- mostrar notification segura;
- abrir/focalizar PWA al hacer click.

Prohibiciones:

- no cachear `/api/**`;
- no almacenar notas/asistencia/inbox en Cache Storage;
- no escribir tokens FCM en console logs;
- no meter credenciales Firebase Admin en el bundle.

## 7. Flujo de activación tutor

Pantalla 1:

```text
Colegio Gabriel René Moreno II
Vincule este teléfono para recibir avisos.

Código de activación: [________]
[ Vincular dispositivo ]
```

Pantalla 2 después de activación:

```text
Dispositivo vinculado correctamente.

Para recibir avisos aun cuando no tenga abierta la aplicación:
[ Activar notificaciones ]
```

La solicitud `Notification.requestPermission()` solo se dispara después de una acción explícita del usuario.

## 8. Registro FCM

Flujo frontend:

```text
obtener ServiceWorkerRegistration
  -> solicitar permiso
  -> inicializar Firebase client
  -> getToken con VAPID public key
  -> POST token al backend
  -> mostrar estado Push activo
```

Si el usuario niega permiso:

- no bloquear la PWA;
- mostrar inbox manual;
- explicar cómo reactivar permisos.

## 9. Click de Push

Payload debe incluir deep-link interno, por ejemplo:

```text
/guardian/notifications/<opaque-id>
```

Service worker:

1. buscar ventana abierta del mismo origin;
2. focus + navigate si existe;
3. abrir nueva ventana si no existe.

El detalle siempre se carga desde API y se autoriza en backend.

## 10. Estado y datos

Para MVP:

- React Query/TanStack Query es opcional; usarlo solo si ya se domina.
- Estado global mínimo: usuario actual, sesión tutor y UI.
- No duplicar entidades del backend en stores globales innecesarios.

## 11. Responsive

Prioridades:

- Teacher/admin optimizados para desktop/tablet.
- Guardian optimizado primero para móvil.
- Student responsive móvil/desktop.

## 12. Accesibilidad mínima

- labels en formularios;
- focus visible;
- botones con nombres accesibles;
- estados no dependientes solo de color;
- modales navegables por teclado.
