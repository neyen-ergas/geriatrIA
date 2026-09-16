# Turnos del personal

Gestión de la grilla semanal de turnos de los empleados de la residencia:
asignación, reasignación y cobertura de ausencias.

| Perfil                    | Alcance                                                               |
| ------------------------- | --------------------------------------------------------------------- |
| Administrador (`admin`)   | Consulta, asignación, reasignación, cancelación y cobertura de turnos |
| Gestión (`management`)    | Consulta de la grilla de turnos y disponibilidades operativas         |
| Solo lectura (`readonly`) | Consulta de la grilla semanal                                         |

## Franjas horarias y estados

Los turnos se organizan por día (`shift_date`) y franja (`shift_type`):

- `manana`: Mañana (07:00 a 15:00)
- `tarde`: Tarde (15:00 a 23:00)
- `noche`: Noche (23:00 a 07:00)
- `guardia`: Guardia especial / 12 horas
- `franco`: Descanso programado

Estados posibles (`status`):

- `scheduled`: Asignado y programado.
- `completed`: Turno cumplido.
- `absent`: Ausencia registrada (enfermedad, fuerza mayor o imprevisto).
- `cancelled`: Turno cancelado antes de su inicio (libera la franja).

## Garantías en la base de datos

1. **Sin turnos superpuestos:**
   Un empleado no puede tener dos turnos activos en la misma fecha y franja horaria.
   Garantizado por el índice único parcial en Postgres:
   `unique (employee_id, shift_date, shift_type) where (status <> 'cancelled')`.
2. **Vigencia del empleado:**
   Un turno no puede asignarse a una persona antes de su fecha de contratación
   (`shift_date >= hired_at`) ni posterior a su baja (`shift_date <= terminated_at`).
3. **Cobertura coherente:**
   Si se registra una ausencia con cobertura (`covered_by_employee_id`), el empleado
   reemplazante debe ser diferente al titular del turno (`covered_by_employee_id <> employee_id`)
   y debe justificarse el motivo (`absence_reason is not null`).
4. **Nada se elimina:**
   Cancelar un turno marca `status = 'cancelled'`, conservando la trazabilidad de la
   planificación previa.

## Funciones transaccionales y RPC

- `save_shift(...)`: Asigna o actualiza un turno verificando sesión, permisos y vigencia laboral.
- `cover_shift(...)`: Registra la ausencia y vincula al empleado que cubre el horario en una única transacción.
- `cancel_shift(...)`: Cancela un turno programado liberando el horario.

## Migración

Migración `20260915000000_employee_shifts.sql`. Crea la tabla `shifts`, sus índices,
políticas RLS y funciones controladas con comprobación de `auth.uid()`.
