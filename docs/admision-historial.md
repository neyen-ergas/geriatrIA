# Historial de visitas

Desde esta migración, cada agendado, reprogramación, cancelación y cierre de
una visita conserva un evento en `visit_events`: consulta, acción, fecha y
franja anterior y nueva, estados anterior y nuevo, momento y autor.
El historial sobrescrito antes de instalarla no se puede reconstruir.
No se inventan eventos a partir del estado actual.

Las notas y los cambios de estado sin visita vigente no generan eventos de
agenda. Reprogramar al mismo turno registra igualmente la acción confirmada.
Cerrar como ingreso o descarte conserva las fechas almacenadas y registra el
cambio de estado que libera el turno.

`update_consulta` mantiene el bloqueo, control de versión y restricciones de
turno anteriores. Inserta el evento en la misma transacción: si falla cualquiera
de las dos escrituras, ambas se revierten. Los rechazos por versión antigua,
transición inválida o turno ocupado no generan eventos.

La acción usa ahora el cliente autenticado. El autor sale de `auth.uid()`,
nunca de un campo del formulario. La función exige identidad y corre como
`security definer` con `search_path` vacío. La tabla tiene RLS y lectura para
el perfil autenticado actual (dueño); ningún cliente tiene permisos de escritura
directa. La clave de la landing conserva INSERT en consulta. Las lecturas de
la bandeja siguen usando el cliente administrativo; el cambio completo a roles
sigue pendiente. No se agrega una pantalla de historial en esta entrega.

## Instalación y recuperación

Aplicar después de las tres migraciones del 6 de septiembre. Coordinar una
ventana sin escrituras de Admisión: aplicar la migración y publicar el código
de este PR juntos. El cliente administrativo anterior no lleva identidad y será
rechazado; el cliente nuevo necesita el permiso de ejecución nuevo.
Recargar los formularios abiertos.

Auditar el proyecto vinculado y las migraciones pendientes con dry-run antes
de aplicar. Esta entrega agrega una tabla vacía y no modifica datos históricos.
Validar con datos ficticios mediante las pruebas SQL de Admisión en CI.
El CI también genera los tipos del esquema como artefacto descargable para
incorporarlos al PR sin necesitar Docker en la computadora del desarrollador.

Preferir corregir hacia adelante. Revertir solo el código impide guardar:
una recuperación necesita una nueva migración que restituya la función anterior
y después el despliegue anterior, durante una ventana coordinada.
Conservar siempre `visit_events`; volver a la función anterior deja de registrar
nuevos eventos. No borrar ni reescribir migraciones aplicadas.
