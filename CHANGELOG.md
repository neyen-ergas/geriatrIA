# Changelog

Todos los cambios relevantes de este proyecto se documentan acá.

El formato sigue [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/).

## [Sin publicar]

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
