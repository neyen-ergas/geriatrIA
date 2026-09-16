# Changelog

Todos los cambios relevantes de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

### Agregado

- Accesibilidad web transversal y adaptación responsive para pantallas móviles: estilos de foco visible de alto contraste (`focus-visible:ring-2`) en componentes primitivos de UI (`Button`, `Input`, `Textarea`, `Select`), enlaces de navegación y botones de acción. Enlace para saltar directamente al contenido principal (`#contenido-principal`), atributos ARIA semánticos (`aria-invalid`, `aria-describedby`) en formularios y soporte de teclado (`Escape`) y diálogos accesibles (`aria-labelledby`, `aria-describedby`) en modales. Adaptación de tablas de listados a formato de tarjetas móviles para pantallas chicas (< 768px) en Residentes (activos y bajas) y Contabilidad (cuotas), garantizando objetivos táctiles de al menos 44px de altura.
- Módulo de Entrevistas de Admisión (`interviews`) que completa el circuito de ingreso de postulantes (Fase 12 del ROADMAP). Valora autonomía motriz, estado cognitivo, necesidades clínicas y perfil psicosocial con dictamen de aptitud (`apto`, `apto_con_observaciones`, `no_apto`). Invariante en base que exige motivo de exclusión obligatorio para dictámenes no aptos. Interfaz con KPIs, filtros, vinculación a consultas de Admisión y edición integral. Requiere aplicar `20260916000000_admission_interviews.sql`. Alcance en `docs/entrevistas.md`.

- Herramientas de higiene técnica y análisis estático: configuración de Prettier (`.prettierrc`, `.prettierignore`), ESLint para Next.js 15 (`eslint.config.mjs`) y `.editorconfig`. Scripts `npm run format`, `npm run format:check` y `npm run lint` incorporados a la integración continua (CI) en GitHub Actions.
- Pruebas unitarias de funciones puras y type guards en `src/lib/admision.test.ts` (estados de consulta, franjas, transiciones directas y formateo de días con zona horaria).
- Módulo de Turnos del personal (`shifts`) con grilla semanal por empleado, selector de semanas, asignación de turnos (mañana, tarde, noche, guardia, franco) y cobertura de ausencias con reemplazo justificado. Invariante en Postgres que impide turnos superpuestos para el mismo empleado en la misma franja y fecha. Requiere aplicar `20260915000000_employee_shifts.sql`. Alcance en `docs/turnos.md`.
- Reversionado de la pantalla de Inicio con hero contextual según hora y día, cinta de métricas operativas clave (KPIs), streaming instantáneo de bloques con skeletons (`loading.tsx`), agenda semanal de visitas y mejoras en `/login` (spinner de carga y visibilidad de contraseña).
- Ficha integral con documentos privados JPG/PNG/PDF, indicaciones médicas, medicación con vigencia, cuidados especiales y pertenencias por estadía. Consulta paginada, altas/ediciones con versión y archivo con motivo. Auditoría ampliada a las cinco tablas; descargas privadas de corta duración. Requiere `20260914040000_resident_records.sql`. Alcance en `docs/ficha-integral.md`.
- Alta y edición de familiares desde la ficha del residente para Administrador y Gestión. Controles de pertenencia y versión, reenvío de alta sin duplicación y auditoría automática. La edición del ingreso también protege la versión del contacto inicial. Requiere `20260914030000_manage_family_contacts.sql`; tras el despliegue hay que recargar los formularios antiguos de edición de ingreso.
- Ficha de consulta del residente desde Activos y Bajas, con datos personales, contactos y estadías paginadas, motivos de baja y acceso a cada cuenta. Disponible para los tres perfiles; las acciones existentes respetan permisos y estado actual aunque se consulte una página histórica. No requiere migración.
- Auditoría exclusiva de Administrador: filtros, paginación y comparación de valores anteriores/nuevos en nueve tablas operativas. Captura transaccional con autor, motivos de bajas/anulaciones y referencias históricas; importación explícitamente parcial de los hechos previos verificables. Requiere aplicar `20260914020000_operational_audit.sql` antes de la interfaz. Ver `docs/auditoria.md`.
- Vínculo explícito entre cuentas y fichas de empleados, administrado desde la ficha y visible en Accesos. Una cuenta por empleado, versión compartida con los permisos y registro de vínculos/correcciones con autor. Vincular o desvincular conserva el perfil y la habilitación.
- Perfiles Administrador, Gestión y Solo lectura, con pantalla de Accesos para asignar o suspender cuentas existentes. RLS y RPC verifican permisos vigentes; la revocación no depende de renovar el JWT. Protege al último administrador y registra cambios de acceso con autor y versión. Requiere `20260914000000_user_access.sql` antes del despliegue.
- Lecturas de consultas con sesión: el CRM elimina el cliente y la variable `service_role`. Empleados queda exclusivo de Administrador; Solo lectura conserva consultas, residentes, movimientos y comprobantes sin modificarlos.
- Gestión administrativa de Empleados: listado paginado de activos y bajas, ficha, alta, edición y baja con fecha/motivo. DNI único normalizado, fechas coherentes y control de versión para evitar sobrescrituras. Las bajas se conservan como consulta. No crea cuentas ni asigna roles. Requiere aplicar `20260913000000_manage_employees.sql` antes de desplegar la interfaz.
- Reserva de visitas desde un turno libre, con selección y búsqueda de familias, paginación y control existente de versión y turno único. No crea consultas.
- Búsqueda de consultas por nombre o teléfono en Admisión, conservada al cambiar de estado y página, con conteos exactos filtrados en la base.
- Agenda semanal de Admisión con turnos de mañana y tarde, navegación por semana o fecha y apertura de cada consulta para reprogramar, cancelar o registrar el ingreso. Muestra solo visitas agendadas y distingue los días pasados de turnos libres. Los cambios actualizan agenda y detalle. No requiere migración.
- Conversión de consultas a ingresos desde Admisión: alta de persona nueva con contacto sugerido o búsqueda por DNI para reingresar una ficha existente. Guarda estadía, vínculo y cierre de visita en una transacción; repetir el envío recupera la misma cuenta. Impide reabrir consultas vinculadas y conserva sus notas. Requiere `20260912000000_convert_consultation_admission.sql`.
- Comprobantes opcionales JPG, PNG y PDF de hasta 3 MiB al registrar pagos, almacenados en un bucket privado y descargables desde el detalle mediante enlaces temporales. Se conservan tras anular el pago. Requiere la migración `20260911230000_private_payment_receipts.sql` antes de desplegar la interfaz.
- Listado mensual de cuotas con saldo pendiente, con selección de mes y filtro de vencidas, incluidos ingresos finalizados. Muestra vencimiento confirmado, saldo y enlaces a cuenta, movimientos y registro de pago. Paginación y conteos exactos; se actualiza al crear cuotas, registrar pagos o anular movimientos.
- Detalle de pagos por cuota con fecha, importe, medio, referencia, observaciones y estado, incluidos los anulados. Permite anular pagos y cuotas con motivo, conservando el historial y actualizando los saldos. Las cuotas con pagos vigentes no se cancelan. Pruebas SQL y de concurrencia entre cobro y anulación.
- Creación de cuotas desde la cuenta de una estadía, con importe sugerido y vencimiento ajustado al mes. Registro de pagos totales o parciales con fecha, medio, referencia y observaciones; validación de saldo y errores por campo. Los resultados inciertos bloquean el reenvío desde el formulario y piden revisar la cuenta. Pruebas financieras SQL y de concurrencia en CI.
- Contabilidad permite consultar cuentas por estadía activa o finalizada y sus cuotas con importe, pagos vigentes acumulados, saldo, estado y vencimiento. Los listados se paginan de a 50 con totales exactos y errores recuperables.
- Historial de agendados, reprogramaciones, cancelaciones y cierres de visitas, con turno anterior y nuevo, momento y autor de la sesión. El evento y el cambio se guardan juntos; no se reconstruye el historial anterior.
- Sección **Admisión** con las consultas que entran desde la landing de la residencia: bandeja con contadores y filtro por estado, seguimiento del llamado, agendado de la visita presencial (día y franja), reprogramación, cierre como ingreso o descarte, y notas internas del equipo.
- Primera migración versionada (`supabase/migrations`), que toma la propiedad del esquema de la tabla `consulta` que hasta ahora vivía solo en el repositorio de la landing.
- Documentación del circuito, los cinco estados y el contrato compartido con la landing (`docs/admision-consultas-modelo.md`).
- Vitest para pruebas unitarias en Node, comandos `test` y `test:watch`, y ejecución automática en CI.
- Esquema de cuotas y pagos en Supabase con RLS de sólo lectura directa, vista de saldos, escrituras mediante funciones controladas y tipos TypeScript regenerados desde la base remota.
- Reingreso de residentes dados de baja mediante una nueva estadía, sin duplicar la ficha personal ni perder el historial anterior.
- Baja de residentes activos con fecha y motivo, validación en el servidor y vista de historial de ingresos finalizados sin eliminar registros.
- Edición transaccional del residente activo, su contacto inicial y los datos administrativos del ingreso, accesible desde el listado de residentes.
- Formulario del primer ingreso con datos personales, un contacto familiar y condiciones administrativas; incluye validación en TypeScript, mensajes por campo y confirmación al volver al listado de residentes activos.
- Función transaccional `create_initial_admission` para crear el residente, su primer contacto y su primer ingreso sin dejar registros parciales ante un error, disponible únicamente para usuarios autenticados y respetando RLS.
- Listado de residentes activos conectado a Supabase mediante el cliente autenticado, con estados vacío y de error y datos del ingreso vigente.
- Migración inicial de `residents`, `family_contacts` y `admissions`, con validaciones, actualización automática de fechas y políticas RLS para usuarios autenticados.
- Autenticación del dueño con Supabase Auth, sesiones SSR, protección de las pantallas administrativas y cierre de sesión.
- Navegación con `sidebar` y `topbar`, e icono de la app (`src/app/icon.tsx`).

### Corregido

- Manejo defensivo en la página de Turnos para evitar errores de servidor 500 ante fallas de red o demoras en la base de datos, mostrando una tarjeta de reintento amigable.
- Middleware de sesión en Node.js 24 para evitar el error 500 al inicializar Supabase en Edge sin WebSocket. CI comprueba el acceso HTTP al build de producción, incluido el redireccionamiento de visitantes sin sesión.
- Admisión ofrece volver a cargar ante fallos de lectura, sin exponer errores internos. Las escrituras interrumpidas piden revisar la consulta antes de volver a guardar; no se reintentan automáticamente ni se confirma un éxito sin respuesta. Se explican permisos, sesión y conflictos de operaciones.
- Residentes e historial paginados de a 50 con totales exactos. La última baja y la existencia de un ingreso activo se consultan por persona en la base, evitando habilitar reingresos por listas truncadas.
- Admisión muestra páginas de 50 consultas con orden estable por fecha e id, y calcula los contadores en Supabase sin truncarlos a 1.000 registros. La navegación conserva el filtro y ajusta páginas fuera de rango.
- Los DNI con y sin puntos o espacios identifican a la misma persona. Alta, edición y escrituras directas normalizan antes de comprobar unicidad; la migración detecta colisiones existentes y aborta sin fusionar fichas.
- Primer ingreso y edición rechazan fechas anteriores al nacimiento o futuras. La base protege toda la historia contra superposiciones y cambios de nacimiento incompatibles, también con escrituras concurrentes. Conserva bajas y reingresos en el mismo día, con errores claros en los cuatro flujos y auditoría previa sin modificar datos existentes.
- Los cambios de estado, agenda, cancelaciones y notas de Admisión validan el estado y la versión en una función de Postgres. Las consultas desactualizadas o inexistentes no producen sobrescrituras ni confirmaciones falsas.
- Las transiciones se verifican en el servidor y en la base; el CRM no puede modificar consultas con `update` directo. Se mantiene el `insert` de la landing.
- La cuota mensual acepta números simples y formato argentino, y se valida el máximo admitido por Supabase antes de intentar registrar el ingreso.
- La baja de un empleado requiere suspender antes su cuenta vinculada; no se permite rehabilitar una cuenta mientras conserve una ficha inactiva. Las comprobaciones cubren cambios simultáneos.

### Cambiado

- Actualización de la documentación de configuración de Supabase (`docs/supabase-configuracion.md`), autenticación y roles (`docs/autenticacion.md`) y estado del sistema en `README.md`, reflejando la arquitectura actual: RBAC de tres niveles, eliminación de claves administrativas en el CRM, RLS integral, buckets privados de Storage y esquema secuencial versionado.
- Priorización del trabajo pendiente: pruebas e integridad antes de nuevos módulos, seguida de Contabilidad y la conexión Admisión → Residentes.
- Flujo de GitHub documentado con PRs por tarea, squash merge, controles de CI, versiones publicadas y recuperación mediante revert y migraciones nuevas.
- Ajustes de layout y estilos en dashboard, residentes, login y globals.css.

### Seguridad

- La tabla `consulta` se lee con la clave `service_role`, que saltea RLS, así que la autenticación es la única barrera real sobre esos datos. El layout de `(app)` ya protege las pantallas, pero no cubre a las Server Actions: cada una verifica la sesión con `requerirSesion()` antes de tocar la base.
- La clave `service_role` queda aislada en `src/lib/supabase/admin.ts`, marcado `server-only` para que el build falle si llega a importarse desde el cliente.
- Se dejó de trackear `.env.local` en git (claves públicas de Supabase protegidas por RLS, no debían vivir en el repo) y se agregó `.env*.local` al `.gitignore`.

### Quitado (reinicio del proyecto)

- Se eliminó todo lo relacionado con Supabase del prototipo previo: base de datos remota, migraciones antiguas, cliente y middleware obsoletos.
- Se removió el login y control de acceso previo para arrancar con el esquema definitivo.
- Se limpiaron las pantallas mockup generadas durante la exploración inicial.

## [0.1.0] - 2026-07-27

### Agregado

- Demo funcional inicial: eMAR (registro electrónico de administración de medicación) con RLS por rol, pantalla de "tomas del turno" y dashboard del dueño.
- `.gitignore` para ignorar `dev.log`.
