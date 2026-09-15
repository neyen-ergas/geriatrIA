# Changelog

Todos los cambios relevantes de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Agregado
- Módulo de Turnos del personal (`shifts`) con grilla semanal por empleado, selector de semanas,
  asignación de turnos (mañana, tarde, noche, guardia, franco) y cobertura de ausencias con
  reemplazo justificado. Invariante en Postgres que impide turnos superpuestos para el mismo
  empleado en la misma franja y fecha. Requiere aplicar `20260915000000_employee_shifts.sql`.
  Alcance en `docs/turnos.md`.

### Corregido
- Middleware de sesión en Node.js 24 para evitar el error 500 al inicializar
  Supabase en Edge sin WebSocket. CI comprueba el acceso HTTP al build de
  producción, incluido el redireccionamiento de visitantes sin sesión.

### Agregado
- Ficha integral con documentos privados JPG/PNG/PDF, indicaciones médicas,
  medicación con vigencia, cuidados especiales y pertenencias por estadía.
  Consulta paginada, altas/ediciones con versión y archivo con motivo. Auditoría
  ampliada a las cinco tablas; descargas privadas de corta duración. Requiere
  `20260914040000_resident_records.sql`. Alcance en `docs/ficha-integral.md`.

### Agregado
- Alta y edición de familiares desde la ficha del residente para Administrador
  y Gestión. Controles de pertenencia y versión, reenvío de alta sin duplicación
  y auditoría automática. La edición del ingreso también protege la versión del
  contacto inicial. Requiere `20260914030000_manage_family_contacts.sql`; tras el
  despliegue hay que recargar los formularios antiguos de edición de ingreso.

### Agregado
- Ficha de consulta del residente desde Activos y Bajas, con datos personales,
  contactos y estadías paginadas, motivos de baja y acceso a cada cuenta.
  Disponible para los tres perfiles; las acciones existentes respetan permisos
  y estado actual aunque se consulte una página histórica. No requiere migración.

### Agregado
- Auditoría exclusiva de Administrador: filtros, paginación y comparación de
  valores anteriores/nuevos en nueve tablas operativas. Captura transaccional
  con autor, motivos de bajas/anulaciones y referencias históricas; importación
  explícitamente parcial de los hechos previos verificables. Requiere aplicar
  `20260914020000_operational_audit.sql` antes de la interfaz. Ver `docs/auditoria.md`.

### Agregado
- Vínculo explícito entre cuentas y fichas de empleados, administrado desde la
  ficha y visible en Accesos. Una cuenta por empleado, versión compartida con
  los permisos y registro de vínculos/correcciones con autor. Vincular o
  desvincular conserva el perfil y la habilitación.
- La baja de un empleado requiere suspender antes su cuenta vinculada; no se
  permite rehabilitar una cuenta mientras conserve una ficha inactiva. Las
  comprobaciones cubren cambios simultáneos. Requiere aplicar
  `20260914010000_link_employee_accounts.sql` antes de la interfaz.

### Agregado
- Perfiles Administrador, Gestión y Solo lectura, con pantalla de Accesos para
  asignar o suspender cuentas existentes. RLS y RPC verifican permisos vigentes;
  la revocación no depende de renovar el JWT. Protege al último administrador
  y registra cambios de acceso con autor y versión. Requiere
  `20260914000000_user_access.sql` antes del despliegue.
- Lecturas de consultas con sesión: el CRM elimina el cliente y la variable
  `service_role`. Empleados queda exclusivo de Administrador; Solo lectura
  conserva consultas, residentes, movimientos y comprobantes sin modificarlos.

### Agregado
- Gestión administrativa de Empleados: listado paginado de activos y bajas,
  ficha, alta, edición y baja con fecha/motivo. DNI único normalizado, fechas
  coherentes y control de versión para evitar sobrescrituras. Las bajas se
  conservan como consulta. No crea cuentas ni asigna roles. Requiere aplicar
  `20260913000000_manage_employees.sql` antes de desplegar la interfaz.

### Agregado
- Reserva de visitas desde un turno libre, con selección y búsqueda de familias,
  paginación y control existente de versión y turno único. No crea consultas.
- Búsqueda de consultas por nombre o teléfono en Admisión, conservada al cambiar
  de estado y página, con conteos exactos filtrados en la base.
- Inicio muestra consultas sin llamar, visitas de hoy y mañana, cuotas vencidas
  de todos los meses e ingresos de los últimos siete días, con enlaces a cada
  pendiente. Cada grupo tiene conteo exacto y un resumen de hasta cinco filas;
  los errores de carga no se presentan como ceros y no ocultan los demás grupos.
- Acceso paginado a todas las cuotas vencidas, incluidos meses anteriores y
  estadías finalizadas. Los cambios de Admisión, Residentes y Contabilidad
  actualizan Inicio. Sin cambios de esquema ni migraciones.

### Agregado
- Agenda semanal de Admisión con turnos de mañana y tarde, navegación por semana
  o fecha y apertura de cada consulta para reprogramar, cancelar o registrar el
  ingreso. Muestra solo visitas agendadas y distingue los días pasados de turnos
  libres. Los cambios actualizan agenda y detalle. No requiere migración.

### Agregado
- Conversión de consultas a ingresos desde Admisión: alta de persona nueva con
  contacto sugerido o búsqueda por DNI para reingresar una ficha existente.
  Guarda estadía, vínculo y cierre de visita en una transacción; repetir el
  envío recupera la misma cuenta. Impide reabrir consultas vinculadas y conserva
  sus notas. Requiere `20260912000000_convert_consultation_admission.sql`.

### Agregado
- Comprobantes opcionales JPG, PNG y PDF de hasta 3 MiB al registrar pagos,
  almacenados en un bucket privado y descargables desde el detalle mediante
  enlaces temporales. Se conservan tras anular el pago. Requiere la migración
  `20260911230000_private_payment_receipts.sql` antes de desplegar la interfaz.

### Agregado
- Listado mensual de cuotas con saldo pendiente, con selección de mes y filtro
  de vencidas, incluidos ingresos finalizados. Muestra vencimiento confirmado,
  saldo y enlaces a cuenta, movimientos y registro de pago. Paginación y conteos
  exactos; se actualiza al crear cuotas, registrar pagos o anular movimientos.

### Agregado
- Detalle de pagos por cuota con fecha, importe, medio, referencia, observaciones
  y estado, incluidos los anulados. Permite anular pagos y cuotas con motivo,
  conservando el historial y actualizando los saldos. Las cuotas con pagos
  vigentes no se cancelan. Pruebas SQL y de concurrencia entre cobro y anulación.

### Agregado
- Creación de cuotas desde la cuenta de una estadía, con importe sugerido y
  vencimiento ajustado al mes. Registro de pagos totales o parciales con fecha,
  medio, referencia y observaciones; validación de saldo y errores por campo.
  Los resultados inciertos bloquean el reenvío desde el formulario y piden
  revisar la cuenta. Pruebas financieras SQL y de concurrencia en CI.

### Agregado
- Contabilidad permite consultar cuentas por estadía activa o finalizada y sus
  cuotas con importe, pagos vigentes acumulados, saldo, estado y vencimiento.
  Los listados se paginan de a 50 con totales exactos y errores recuperables.

### Corregido
- Admisión ofrece volver a cargar ante fallos de lectura, sin exponer errores
  internos. Las escrituras interrumpidas piden revisar la consulta antes de
  volver a guardar; no se reintentan automáticamente ni se confirma un éxito
  sin respuesta. Se explican permisos, sesión y conflictos de operaciones.

### Corregido
- Residentes e historial paginados de a 50 con totales exactos. La última baja
  y la existencia de un ingreso activo se consultan por persona en la base,
  evitando habilitar reingresos por listas truncadas.

### Corregido
- Admisión muestra páginas de 50 consultas con orden estable por fecha e id,
  y calcula los contadores en Supabase sin truncarlos a 1.000 registros.
  La navegación conserva el filtro y ajusta páginas fuera de rango.

### Agregado
- Historial de agendados, reprogramaciones, cancelaciones y cierres de visitas,
  con turno anterior y nuevo, momento y autor de la sesión. El evento y el
  cambio se guardan juntos; no se reconstruye el historial anterior.

### Corregido
- Los DNI con y sin puntos o espacios identifican a la misma persona. Alta,
  edición y escrituras directas normalizan antes de comprobar unicidad; la
  migración detecta colisiones existentes y aborta sin fusionar fichas.
- Primer ingreso y edición rechazan fechas anteriores al nacimiento o futuras.
  La base protege toda la historia contra superposiciones y cambios de
  nacimiento incompatibles, también con escrituras concurrentes. Conserva
  bajas y reingresos en el mismo día, con errores claros en los cuatro flujos
  y auditoría previa sin modificar datos existentes.
- Los cambios de estado, agenda, cancelaciones y notas de Admisión validan el
  estado y la versión en una función de Postgres. Las consultas desactualizadas
  o inexistentes no producen sobrescrituras ni confirmaciones falsas.
- Las transiciones se verifican en el servidor y en la base; el CRM no puede
  modificar consultas con `update` directo. Se mantiene el `insert` de la landing.
- La cuota mensual acepta números simples y formato argentino, y se valida el
  máximo admitido por Supabase antes de intentar registrar el ingreso.

### Agregado (módulo de admisión)
- Sección **Admisión** con las consultas que entran desde la landing de la
  residencia: bandeja con contadores y filtro por estado, seguimiento del
  llamado, agendado de la visita presencial (día y franja), reprogramación,
  cierre como ingreso o descarte, y notas internas del equipo.
- Primera migración versionada (`supabase/migrations`), que toma la propiedad
  del esquema de la tabla `consulta` que hasta ahora vivía solo en el
  repositorio de la landing.
- Documentación del circuito, los cinco estados y el contrato compartido con la
  landing (`docs/admision-consultas-modelo.md`).

### Seguridad
- La tabla `consulta` se lee con la clave `service_role`, que saltea RLS, así
  que la autenticación es la única barrera real sobre esos datos. El layout de
  `(app)` ya protege las pantallas, pero no cubre a las Server Actions: cada una
  verifica la sesión con `requerirSesion()` antes de tocar la base.
- La clave `service_role` queda aislada en `src/lib/supabase/admin.ts`, marcado
  `server-only` para que el build falle si llega a importarse desde el cliente.

### Quitado (reinicio del proyecto)
- Se eliminó todo lo relacionado con Supabase: proyecto/base de datos remota,
  migraciones (`supabase/migrations`), cliente y middleware de conexión
  (`src/lib/supabase/`), y los scripts de test que dependían de él.
- Se sacó el login y el control de acceso por rol (`src/app/login`,
  `src/middleware.ts`, `src/lib/roles.ts`, `src/components/logout-button.tsx`).
- Se borraron todas las pantallas funcionales generadas hasta el momento
  (dashboard, residentes, turno) para arrancar de cero.

### Agregado
- Vitest para pruebas unitarias en Node, comandos `test` y `test:watch`, y
  ejecución automática en CI. La suite inicial verifica fechas y formato de
  cuota del reingreso con datos sintéticos, sin conexión a Supabase.
- Esquema de cuotas y pagos en Supabase con RLS de sólo lectura directa, vista
  de saldos, escrituras mediante funciones controladas y tipos TypeScript
  regenerados desde la base remota.
- Diseño funcional del módulo de pagos mensuales, con cuotas por período, pagos
  parciales, saldos calculados, anulaciones auditables y comprobantes privados.
- Reingreso de residentes dados de baja mediante una nueva estadía, sin
  duplicar la ficha personal ni perder el historial anterior.
- Baja de residentes activos con fecha y motivo, validación en el servidor y
  vista de historial de ingresos finalizados sin eliminar registros.
- Edición transaccional del residente activo, su contacto inicial y los datos
  administrativos del ingreso, accesible desde el listado de residentes.
- Formulario del primer ingreso con datos personales, un contacto familiar y
  condiciones administrativas; incluye validación en TypeScript, mensajes por
  campo y confirmación al volver al listado de residentes activos.
- Función transaccional `create_initial_admission` para crear el residente, su
  primer contacto y su primer ingreso sin dejar registros parciales ante un
  error, disponible únicamente para usuarios autenticados y respetando RLS.
- Listado de residentes activos conectado a Supabase mediante el cliente
  autenticado, con estados vacío y de error y datos del ingreso vigente.
- Tipos TypeScript generados desde el esquema remoto de Supabase y clientes
  compartidos configurados para validar tablas y columnas durante el desarrollo.
- Migración inicial de `residents`, `family_contacts` y `admissions`, con
  validaciones, actualización automática de fechas y políticas RLS para
  usuarios autenticados.
- Autenticación del dueño con Supabase Auth, sesiones SSR, protección de las
  pantallas administrativas y cierre de sesión.
- Configuración inicial de Supabase con cliente para navegador y servidor, CLI
  local, variables de entorno de ejemplo y guía de instalación.
- Documentación del alcance, las reglas y el modelo de datos inicial del módulo
  de residentes.
- Sidebar reducida a seis secciones fijas, cada una como lienzo en blanco:
  Inicio, Residentes, Empleados, Turnos, Contabilidad, Entrevistas.
  Todas accesibles sin login.

### Agregado
- Navegación con `sidebar` y `topbar`.
- Helper de control de roles (`src/lib/roles.ts`).
- Icono de la app (`src/app/icon.tsx`).
- Repositorio publicado en GitHub (privado).

### Cambiado
- Priorización del trabajo pendiente: pruebas e integridad antes de nuevos
  módulos, seguida de Contabilidad y la conexión Admisión → Residentes.
- Flujo de GitHub documentado con PRs por tarea, squash merge, controles de CI,
  versiones publicadas y recuperación mediante revert y migraciones nuevas.
- Ajustes de layout y estilos en dashboard, residentes, login y globals.css.

### Seguridad
- Se dejó de trackear `.env.local` en git (claves públicas de Supabase protegidas
  por RLS, no debían vivir en el repo) y se agregó `.env*.local` al `.gitignore`.

## [0.1.0] - 2026-07-27

### Agregado
- Demo funcional inicial: eMAR (registro electrónico de administración de
  medicación) con RLS por rol, pantalla de "tomas del turno" y dashboard
  del dueño. Ver `ESTADO-ACTUAL.md` para el detalle completo de qué hace
  la app en esta versión.
- `.gitignore` para ignorar `dev.log`.
