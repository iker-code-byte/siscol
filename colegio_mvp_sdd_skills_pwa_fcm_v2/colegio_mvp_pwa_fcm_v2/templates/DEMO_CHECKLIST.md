# Checklist de demo

## Datos

- [ ] Año académico activo
- [ ] Curso y paralelo
- [ ] Materia
- [ ] Docente
- [ ] Estudiante con acceso
- [ ] Tutor vinculado al estudiante
- [ ] Regla LOW_GRADE activa
- [ ] Regla ABSENCE activa

## Tutor/PWA

- [ ] Código de activación generado
- [ ] PWA instalada/agregada a inicio
- [ ] Dispositivo vinculado
- [ ] Permiso de notificaciones concedido
- [ ] PushSubscription FCM activa

## Demo nota baja

- [ ] Docente abre planilla
- [ ] Registra nota bajo umbral
- [ ] AlertEvent aparece
- [ ] Notification aparece
- [ ] Delivery = SENT
- [ ] Push recibido sin dato sensible
- [ ] Click abre detalle autorizado

## Demo asistencia

- [ ] Docente registra ABSENT
- [ ] Se genera alerta según regla
- [ ] Tutor recibe aviso

## Seguridad

- [ ] Student no ve datos ajenos
- [ ] Teacher no modifica asignación ajena
- [ ] Guardian A no abre Notification de Guardian B
- [ ] API privada responde no-store
