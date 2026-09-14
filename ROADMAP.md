# ROADMAP · geriatrIA

Ruta de trabajo derivada de [SPECS.md](SPECS.md) y de la revisión del código.
Las fases conservan sus números para mantener las referencias existentes. El
orden de ejecución lo define la cola priorizada; no el número de fase.

**Cómo se trabaja cada punto**

- Un punto = una rama = un Pull Request hacia `master`. Cada corrección incluye
  sus pruebas y documentación; no se mezclan tareas independientes.
- Antes de tocar código, leer [CODESTYLE.md](CODESTYLE.md) y la sección de
  [SPECS.md](SPECS.md) que corresponda.
- Commit al terminar cada punto, no al terminar la fase.
- `npm run typecheck`, `npm test` y `npm run build` pasan antes de cada commit.
  Si el punto tocó la base, además pruebas SQL y tipos generados desde la base
  local (`npm run db:types:local`) o vinculada (`npm run db:types`).
- Si un punto obliga a cambiar una decisión de SPECS, se actualiza SPECS en el
  mismo Pull Request. SPECS no puede quedar desactualizado.
- Marcar `[x]` en el PR que completa el punto, y anotar en `CHANGELOG.md` lo
  relevante. Solo se considera terminado cuando ese PR está integrado.
- Seguir [CONTRIBUTING.md](CONTRIBUTING.md) para revisión, integración,
  publicaciones y recuperación. No hacer push directo ni force-push a `master`.

Leyenda: `[x]` terminado · `[ ]` pendiente

## Cola priorizada

Revisión: 2026-09-05. P0 corrige o protege lo existente; P1 completa el circuito
administrativo; P2 amplía el producto. Cada fila agrupa PRs, no es un único PR.

| Orden | Prioridad | Trabajo | Condición de salida |
| --- | --- | --- | --- |
| 1 | P0 | Fase 5: runner de tests y CI. | Una validación existente tiene una prueba real y corre en CI. |
| 2 | P0 | Fase 5A: estados, fechas, DNI e historial de visitas, en PRs separados. | Cada fallo tiene una prueba de regresión y las reglas de integridad se garantizan en la base. |
| 3 | P0 | Fase 5A: paginación, conteos y errores. | Listados y totales se comprueban con más de 1.000 registros sintéticos. |
| 4 | P0 | Fase 5: lint, formato y protección de `master`. | Los controles están en CI y un administrador verifica la protección. |
| 5 | P1 | Fase 6: Contabilidad. | Cuotas, pagos parciales, anulaciones, vencimientos y comprobantes son operables. |
| 6 | P1 | Fase 8: conversión Admisión → Residentes. | La consulta queda vinculada a la estadía sin duplicaciones ni escrituras parciales. |
| 7 | P1 | Fases 8 y 7: agenda, búsqueda e Inicio. | El equipo encuentra disponibilidad y resuelve pendientes desde el panel. |
| 8 | P1 | Fase 9: roles, empleados y acceso a datos. | Permisos verificados antes de habilitar cuentas con responsabilidades distintas. |
| 9 | P2 | Fase 11: ficha, contactos, documentos y salud. | Cada módulo tiene alcance, permisos y pruebas acordes a sus datos. |
| 10 | P2 | Fases 10 y 12: Turnos y Entrevistas. | Turnos sin superposiciones y entrevistas con alcance definido. |

Accesibilidad y móvil se verifican en cada pantalla modificada. La guía de
instalación debe estar lista antes de abrir una nueva residencia; el backup y
la restauración, antes de ejecutar cambios sobre datos existentes. Si entran
empleados antes de lo previsto, roles y permisos pasan a P0.

---

## Fase 0 — Base del proyecto ✅

- [x] Next.js 15 con App Router, TypeScript `strict` y Tailwind 4.
- [x] Layout de aplicación: sidebar, topbar y las siete secciones navegables.
- [x] Primitivas de UI propias estilo shadcn/ui (`src/components/ui.tsx`).
- [x] Integración con Supabase: clientes de navegador, servidor y admin.
- [x] Tipos generados desde el esquema remoto (`npm run db:types`).
- [x] CI en GitHub Actions con `typecheck` y `build` sobre cada PR.
- [x] `CONTRIBUTING.md`, `CHANGELOG.md` y plantilla de Pull Request.

## Fase 1 — Autenticación ✅

- [x] Login con correo y contraseña, sin registro público.
- [x] Renovación de sesión en `src/middleware.ts`.
- [x] Protección de todas las pantallas en el layout de `(app)`.
- [x] `requerirSesion()` con `getClaims()`, no con `getSession()`.
- [x] Cierre de sesión.

## Fase 2 — Admisión, primera entrega ✅

- [x] Migración versionada de `consulta`, con RLS, restricciones e índices.
- [x] Bandeja ordenada, contadores y filtro por estado.
- [x] Seguimiento del llamado.
- [x] Agendado de la visita: día y franja, en un solo `update`.
- [x] Reprogramación y cancelación, liberando el turno.
- [x] Cierre como ingreso o descarte, y notas internas.
- [x] Traducción del choque del índice único a un mensaje entendible.

## Fase 3 — Residentes, ciclo completo ✅

- [x] Migración de `residents`, `family_contacts` y `admissions` con RLS,
      restricciones, triggers e índice único de ingreso activo.
- [x] Función transaccional `create_initial_admission`.
- [x] Función transaccional `update_active_admission`.
- [x] Listado de residentes activos, con estados vacío y de error.
- [x] Formulario del primer ingreso, con validación y mensajes por campo.
- [x] Validación del formato de la cuota mensual.
- [x] Edición del residente activo, su contacto y los datos del ingreso.
- [x] Baja con fecha y motivo, conservando el historial.
- [x] Reingreso sin duplicar la ficha personal.

## Fase 4 — Contabilidad, base ✅

- [x] Diseño funcional del módulo (`docs/pagos-modelo-inicial.md`).
- [x] Tablas `monthly_charges` y `payments`, con importe congelado por período.
- [x] Vista `monthly_charge_balances` que calcula pagado, saldo y estado.
- [x] Funciones `create_monthly_charge`, `record_payment`, `void_payment` y
      `cancel_monthly_charge`.
- [x] RLS de solo lectura: los usuarios autenticados no escriben directo.

---

## Fase 5 — Higiene técnica

Primero se habilitan pruebas para acompañar las correcciones de la Fase 5A.
El formato global va después de esas correcciones y en un commit propio.

- [x] Configurar Vitest con scripts de ejecución local y CI, una prueba real
      de validación existente y ejecución automática en GitHub Actions.
- [ ] Agregar Prettier como dependencia de desarrollo con su configuración, y
      scripts `npm run format` (escribe) y `npm run format:check` (verifica).
      Formatear el repositorio entero en un commit `chore:` aparte, sin ningún
      otro cambio, para que el diff sea revisable.
- [ ] Reparar el linting: `npm run lint` ejecuta `next lint` y abre un asistente
      porque no hay ESLint instalado ni configurado. Configurar ESLint para
      Next 15 y dejar un comando que termine sin interacción en local y CI.
- [ ] Sumar `format:check` y `lint` al workflow de CI.
- [ ] Agregar `.editorconfig` con las mismas reglas que Prettier.
- [ ] Cubrir con tests la lógica pura que ya existe y no toca la base: los type
      guards de `admision.ts`, `formatearDia` (incluido el corrimiento de día por
      zona horaria), y las validaciones de `primer-ingreso.ts`,
      `baja-residente.ts` y `reingreso-residente.ts`. Son funciones puras: se
      prueban sin levantar nada.
- [x] Verificar que `.gitignore` cubra los artefactos generados
      (`tsconfig.tsbuildinfo`, `dev.log`, volcados del shell) y sacar del
      índice los que hayan quedado versionados. Revisado: no están versionados.
- [ ] Verificar con un administrador la protección de `master`: PR obligatorio,
      controles de CI requeridos y bloqueo de force-push y eliminación. La
      cuenta conectada en esta revisión tiene push, pero no administración;
      estas protecciones no se consideran verificadas ni configuradas.
- [ ] Ordenar `CHANGELOG.md`: hoy mezcla varias secciones "Agregado" y una de
      "Quitado" del reinicio, y no se lee cronológicamente.

## Fase 5A — Correcciones de integridad y confiabilidad

Cada punto es un PR independiente, con pruebas de regresión. Las migraciones se
prueban localmente con datos sintéticos antes de planificar su aplicación.

- [x] Validar transiciones de Admisión en el servidor y en una escritura
      controlada en la base. Comprobar el estado esperado y la fila modificada;
      una pantalla desactualizada no debe reabrir ni sobrescribir una consulta
      cerrada por otro operador. Cubrir cambios de estado, agenda y cancelación.
- [x] Validar fechas de primer ingreso y edición: impedir ingresos anteriores
      al nacimiento y estadías históricas superpuestas. Definir explícitamente
      el tratamiento de ingresos futuros para que no aparezcan como activos
      antes de tiempo; mantener coherencia con bajas y reingresos.
- [x] Normalizar DNI en aplicación y base. Detectar colisiones existentes
      antes de migrar; no fusionar ni eliminar residentes automáticamente.
      Probar que formatos con y sin puntos no creen identidades duplicadas.
- [x] Conservar eventos de agenda: fecha y franja anterior y nueva, acción,
      momento y autor. Guardar el evento y el cambio en una transacción.
      Aclarar que el historial ya sobrescrito no se puede reconstruir.
- [x] Paginar consultas y calcular contadores en la base, con orden estable.
      Verificar filtros y totales por encima del límite local de 1.000 filas.
- [x] Paginar residentes e historial. Resolver en la base la última baja y la
      existencia de un ingreso activo para que un listado truncado no habilite
      un reingreso incorrecto.
- [x] Dar una respuesta recuperable ante errores de carga de Admisión y
      traducir errores de escritura sin exponer mensajes técnicos al usuario.

## Fase 6 — Contabilidad, interfaz

La consulta de cuentas y movimientos, la creación de cuotas, los pagos y las
anulaciones ya usan la base existente. Los vencimientos mensuales están disponibles;
los comprobantes privados están implementados y requieren aplicar su migración
antes del despliegue (ver `docs/comprobantes-privados.md`).

- [x] `src/lib/pagos.ts` y `src/lib/pagos-datos.ts` sobre la vista
      `monthly_charge_balances`.
- [x] Pantalla de cuotas de un residente: períodos, importe, pagado y saldo.
- [x] Crear la cuota de un período, con el importe precargado desde
      `admissions.monthly_fee` y confirmable antes de guardar.
- [x] Registrar un pago, total o parcial.
- [x] Anular un pago y cancelar una cuota, con motivo y detalle de movimientos.
- [x] Listado de vencimientos del mes, usando la fecha confirmada de cada cuota
      (sugerida desde `due_day` al crearla), con filtro de vencidas y saldo pendiente.
- [x] Bucket **privado** de Supabase Storage para los comprobantes, y carga
      opcional al registrar un pago.
- [x] Traducir cada error de las funciones de pago a un mensaje entendible.
- [x] Probar las funciones financieras con datos sintéticos: pagos parciales,
      concurrencia, exceso de saldo, anulaciones y acceso sin sesión. Estas
      pruebas acompañan los PRs que incorporan cada operación a la interfaz.
      CI cubre creación, pagos, anulaciones, auditoría, reemplazo de cuotas y
      concurrencia entre pagos y cancelaciones en el aislamiento de la API.

## Fase 7 — Inicio

- [x] Reemplazar el placeholder por un panel del día que responda "qué hay
      pendiente ahora": consultas sin llamar, visitas de hoy y mañana, cuotas
      vencidas e ingresos recientes.
- [x] Cada dato del panel enlaza a la pantalla donde se resuelve.

## Fase 8 — Admisión, segunda entrega

- [x] **Cerrar el circuito Admisión → Residentes**, antes de la agenda y del
      panel de Inicio: vincular la consulta al residente y su estadía,
      precargar datos, evitar conversiones duplicadas y guardar la conversión
      en una transacción. Contemplar personas que ya tienen ficha.
- [x] Vista de agenda semanal: grilla de lunes a domingo por franja, navegación
      entre semanas y apertura de cada consulta para gestionar la visita.
- [x] Agendar la visita directamente desde un hueco libre de la grilla.
- [x] Búsqueda por nombre o teléfono dentro de la bandeja.

## Fase 9 — Empleados y roles

Acá aparece el primer usuario que no es el dueño, y con él la autorización real.

- [x] Modelo inicial de empleados: ficha personal y laboral, sin cuentas de acceso.
- [x] Alta, edición de activos y baja de empleados; ficha dada de baja solo de consulta.
- [x] Modelo de roles y permisos por sección: Administrador, Gestión y Solo lectura.
- [x] Políticas restrictivas por rol, RPC autorizadas y administración de accesos.
- [x] Sacar `consulta` del acceso con `service_role`: lecturas con sesión y RLS.
- [x] Vincular cuentas de Supabase Auth con empleados, con unicidad e historial.
- [x] Autoría de creación y anulación de movimientos financieros en el esquema.
- [x] Extender la auditoría de Admisión de la Fase 5A a los demás cambios
      operativos, incluidos los datos de residentes, y ofrecer su consulta.
- [x] Documentar el modelo de roles en `docs/permisos.md`.

## Fase 10 — Turnos

- [ ] Modelo de turnos del personal.
- [ ] Grilla semanal por empleado.
- [ ] Asignación, reasignación y cobertura de ausencias.
- [ ] Invariante en la base: sin turnos superpuestos para el mismo empleado.

## Fase 11 — Salud y documentación del residente

Cada tabla se diseña al empezar su módulo, no antes.

- [x] Ficha de consulta del residente con todas sus estadías y contactos.
- [x] Gestión de familiares adicionales al contacto inicial desde la ficha.
- [x] `resident_documents` con bucket privado de Storage.
- [x] Carga de documentos como imágenes; un documento faltante no bloquea el
      ingreso, queda pendiente.
- [x] `medical_indications`: indicaciones vigentes e históricas.
- [x] `medications`: medicamento, dosis, frecuencia, horarios y vigencia.
- [x] `special_needs`: alimentación, alergias, movilidad y cuidados especiales.
- [x] `inventory_items`: pertenencias entregadas en cada ingreso.

## Fase 12 — Entrevistas

- [ ] Definir el alcance funcional en `docs/`. Es la sección menos especificada
      del sistema y hoy no tiene modelo acordado.
- [ ] Modelo de datos y pantallas, una vez acordado el alcance.

---

## Transversal

Puntos que no pertenecen a una fase y se atienden cuando corresponda.

- [ ] Accesibilidad: foco visible, etiquetas asociadas y navegación por teclado
      en todos los formularios.
- [ ] Revisar las tablas de residentes en pantalla chica. Ya existe navegación
      móvil; falta verificar la usabilidad de tablas y formularios completos.
- [ ] Actualizar `docs/supabase-configuracion.md` y los textos de autenticación
      que describen estados anteriores del proyecto.
- [ ] Guía de instalación de una residencia nueva: crear el proyecto de
      Supabase, aplicar todas las migraciones, cargar variables y crear la
      cuenta del dueño.
- [ ] Procedimiento de backup y restauración de un proyecto.
