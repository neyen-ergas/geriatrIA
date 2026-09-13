# Inicio y gestión diaria de Admisión

La agenda permite elegir una familia existente desde un turno libre. Las
candidatas son consultas nuevas o contactadas; el botón de confirmación indica
la familia y la pantalla muestra fecha y franja. Los formularios conservan
`actualizado_en` completo, sin perder microsegundos. La acción existente valida
el turno en el servidor; el índice único de Postgres evita reservas simultáneas.
No hay escritura al abrir o buscar, ni reintentos automáticos tras un error.
Un fallo al leer la disponibilidad interrumpe la carga y nunca muestra «Libre».

La búsqueda por nombre o teléfono se aplica a conteos y listados antes de
paginar. Coincide parcialmente, conserva estado/búsqueda en los enlaces y vuelve
a la primera página al cambiar la búsqueda. Los caracteres de sintaxis de
PostgREST se eliminan de la entrada; solo la aplicación construye el filtro.
Las candidatas descargan únicamente identidad de consulta, nombre, teléfono,
estado y versión. El detalle y las notas siguen en su pantalla específica.

## Panel de Inicio

- Consultas sin llamar: estado `nuevo`, las más antiguas primero.
- Visitas de hoy y mañana: solo `visita_agendada`, según la fecha argentina.
- Cuotas vencidas: `is_overdue`, saldo positivo y sin anulación, sin limitar mes.
  El enlace general abre el listado paginado con `alcance=todas`; los individuales
  abren los movimientos de la cuota. Se incluyen estadías finalizadas y no se
  inventan cuotas para períodos que todavía no fueron creados.
- Ingresos recientes: fecha de admisión entre hoy menos seis días y hoy,
  incluidos reingresos y estadías ya finalizadas. Cada fila abre su cuenta.

Cada grupo obtiene su conteo exacto y hasta cinco filas, con orden e id como
desempate. Son resúmenes, no listados completos; se informa cuántas filas se
muestran y se ofrece acceso a la sección correspondiente. Los grupos se leen
en paralelo y no forman una instantánea conjunta. Un fallo deja el grupo como
no disponible, sin mostrar cero, y permite usar el resto del panel.

Inicio y reserva exigen sesión antes de leer. Las consultas conservan el
cliente administrativo del servidor porque esa tabla aún no tiene lectura
autenticada por RLS; Residentes y Contabilidad usan el cliente autenticado.
Los cambios de visitas, notas, conversiones, estadías, cuotas y pagos invalidan
también Inicio. No hay actualización automática por intervalo ni sincronización
en vivo de pestañas abiertas: volver a consultar recupera el estado actual.

## Verificación y despliegue

Pruebas específicas cubren sesión, ocupación concurrente comunicada por la
acción existente, conservación de versión, búsqueda y paginación por encima
de mil filas, cambios de día/año, resúmenes y errores parciales. La suite SQL
existente verifica versión y turno único. CI ejecuta suite completa, build,
SQL y concurrencia. No requiere nuevas migraciones ni Docker local.
