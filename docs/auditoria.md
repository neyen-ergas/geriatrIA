# Auditoría operativa

Administrador dispone de **Auditoría** en el menú. Puede filtrar por sección,
tipo de cambio, autor y rango de fechas, y abrir el antes/después de cada evento.
Las fechas se interpretan como días completos de Argentina; el listado muestra
50 eventos por página con conteo exacto. Desde el detalle se accede a todos los
cambios del mismo registro, a los del autor y al historial de registros vinculados.
Gestión y Solo lectura no acceden a esta sección ni a sus datos por API.

## Alcance y garantías

`20260914020000_operational_audit.sql` crea `audit_events` y triggers sobre
consultas/visitas, residentes, familiares, estadías, cuotas, pagos, empleados,
accesos/vínculos y conversiones de consulta a ingreso. Se registran altas,
ediciones, bajas y anulaciones con sus motivos. Una eliminación administrativa
de una fila también conserva sus valores anteriores; no se habilita eliminación
desde la aplicación. Una operación que modifica varias tablas produce un evento
por fila modificada, todos dentro de la misma transacción.

Los triggers capturan valores finales normalizados y campos de negocio explícitos.
Ignoran cambios exclusivos de reloj y reenvíos sin diferencias. Si una operación
falla, se revierten tanto el negocio como sus eventos. Si falla la captura,
la escritura de negocio tampoco se confirma. La autoría proviene de `auth.uid()`;
no se acepta `created_by` enviado por el cliente como autor del evento nuevo.
Un alta de landing con `service_role`, sin usuario autenticado, queda identificada
como «Sin usuario identificado». No se inventa un operador humano.

Cada evento conserva identificadores, referencias de nombre/correo, fecha, campos
cambiados y valores anteriores/nuevos. No se serializan Auth, contraseñas, tokens
ni contenido de Storage; del comprobante solo se conserva la ruta. Los datos de
negocio pueden contener información sensible y solo Administrador puede leerlos.
El listado descarga metadatos; los valores completos se leen al abrir el detalle.

RLS y privilegios permiten únicamente lectura administrativa. Ni clientes
autenticados ni `service_role` pueden insertar, modificar o borrar eventos.
La captura se ejecuta como función de trigger con permisos internos. Esta es
inmutabilidad desde la aplicación, no evidencia criptográfica ni protección
contra el propietario de la base. No registra lecturas, descargas, intentos de
login, operaciones rechazadas, cambios de Auth ni cambios hechos directamente
en Storage. No hay purga automática del historial.

## Historial anterior

Se importan los hechos existentes de visitas, permisos y vínculos de cuentas;
creación/anulación de cuotas y pagos; creación/última actualización de empleados;
y conversiones. Cada evento importado lleva origen `historical` y clave de
procedencia única. Las tablas anteriores se conservan; los nuevos cambios se
capturan desde las tablas de negocio para evitar duplicarlos en la vista general.

No se reconstruyen fichas ni ediciones antiguas a partir de valores actuales.
Por ejemplo, una creación de pago previa conserva fecha y autor, pero no presume
sus importes originales. «No registrado» significa desconocido; «Vacío» confirma
que ese campo tenía un valor vacío. Las referencias de nombre/correo importadas
son las disponibles al migrar, no una afirmación sobre cómo eran en la fecha del
evento. El detalle distingue explícitamente estos casos.

## Despliegue y recuperación

Aplicar la migración y registrar su versión antes del código. Es compatible con
el código anterior y empieza a capturar inmediatamente. La migración bloquea
escrituras de las tablas involucradas durante la importación para no dejar una
ventana sin auditoría. En el remoto se ejecuta en una transacción con
`lock_timeout = '5s'`: si hay actividad que impide obtener los bloqueos, se aborta
y se vuelve a intentar en un momento tranquilo. No repetir una migración ya
registrada. Verificar nueve triggers, RLS, privilegios y cantidad de importados.

Ante un problema, revertir la interfaz o aplicar una migración correctiva
conservando eventos y captura; no borrar historial como mecanismo de rollback.
Incluir esta tabla en los backups de la base. Nuevas tablas de negocio deben
incorporarse explícitamente a la lista de campos y a los filtros de esta sección.

## Verificación

Pruebas dirigidas de filtros, límites horarios, permisos previos a lecturas,
errores, paginación por encima de mil eventos y renderizado seguro del detalle.
pgTAP cubre las nueve tablas, autoría, RLS, normalización, no-op, repetición,
anulaciones, borrado administrativo y rollback de negocio/auditoría.
GitHub ejecuta además las pruebas de concurrencia existentes y una regresión de
la migración sobre diez hechos previos ficticios, revirtiendo datos y DDL juntos.
Las pruebas SQL usan exclusivamente la base aislada de CI. Sin Docker local.
