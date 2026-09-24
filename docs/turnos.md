# Turnos del personal

Asignación, edición, cancelación y cobertura de ausencias. La grilla muestra
cada franja propia y las coberturas en la fila del reemplazante.

| Perfil                                                | Alcance                      |
| ----------------------------------------------------- | ---------------------------- |
| Administrador habilitado                              | Consulta y gestión de turnos |
| Gestión, Solo lectura, cuentas suspendidas y anónimos | Sin acceso                   |

La interfaz y RLS usan `administration`. Los motivos de ausencia y las notas
no quedan expuestos a los otros perfiles mediante consultas directas a la API.

## Horarios

Los horarios corresponden al calendario local de la residencia. `shift_date`
es la fecha de inicio. Los intervalos incluyen el inicio y excluyen el final:
07:00–15:00 y 15:00–23:00 son contiguos y pueden asignarse a la misma persona.

- Mañana: 07:00–15:00.
- Tarde: 15:00–23:00.
- Noche: 23:00–07:00 del día siguiente.
- Guardia: 12 horas desde el inicio elegido explícitamente al asignar; puede
  terminar al día siguiente. No se infiere un horario para guardias anteriores.
- Franco: 00:00–24:00 del día indicado. Impide trabajo y coberturas durante ese
  día, incluso una noche que empezó el día anterior. No admite ausencia/cobertura.

Estas reglas comprueban solapamientos; no implementan límites de jornada,
pausas mínimas ni reglas de convenio.

## Disponibilidad y estados

Cada turno no cancelado reserva su intervalo para el titular. Si está ausente,
reserva además el mismo intervalo para quien lo cubre. El titular ausente sigue
ocupado en ese intervalo: no puede ser reasignado simultáneamente a otro puesto.

`shift_reservations` es una tabla interna sin permisos directos para usuarios.
Una exclusión por empleado e intervalo impide turnos propios, coberturas y
francos superpuestos, aunque dos operaciones lleguen simultáneamente. Su
actualización ocurre en la misma transacción que el turno: un conflicto revierte
la ausencia o edición y conserva las reservas previas. Cambiar de reemplazante
libera al anterior; cancelar un turno programado libera su horario.

- `scheduled`: programado, editable, cancelable y admite cobertura salvo franco.
- `absent`: ausencia con motivo; puede editarse y reasignarse la cobertura.
- `completed`: cumplido, de consulta; todavía no hay una acción para marcarlo.
- `cancelled`: de consulta; no reserva horario.

`save_shift`, `cover_shift` y `cancel_shift` exigen Administrador y comparan
`p_expected_updated_at` bajo bloqueo de fila al modificar. Un formulario viejo
debe recargarse. Los errores se muestran sin exponer mensajes internos de SQL;
un resultado de conexión incierto requiere comprobar la grilla antes de reintentar.

La vigencia laboral se valida contra la fecha de inicio del turno. Quedan
pendientes coordinar bajas laborales simultáneas, idempotencia de altas,
auditoría de antes/después e historial de empleados dados de baja en la grilla.

## Migración y verificación

Aplicar `20260923000000_shift_availability.sql` después de las migraciones
existentes. Coordinar la migración con la aplicación nueva y recargar formularios:
los clientes viejos no envían versión ni inicio de guardia. El preflight del
23/09/2026 encontró cero turnos, sin leer datos personales ni modificar producción.

La migración construye reservas de registros existentes. Si aparecen conflictos,
guardias sin horario o francos con ausencia, falla y revierte todo; no borra ni
reprograma registros para hacerla pasar. Revisar esos casos antes de reintentar.

Pruebas SQL de horarios, permisos y versiones, más pruebas de concurrencia real
para cobertura/cobertura, asignación/cobertura en ambos órdenes y franco/cobertura.
Se ejecutan en GitHub CI, sin Docker local. Los tipos se regeneran desde el esquema.
