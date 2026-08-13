# ROADMAP · geriatrIA

Ruta de trabajo derivada de [SPECS.md](SPECS.md). Se avanza de arriba hacia
abajo: cada fase asume terminada la anterior.

**Cómo se trabaja cada punto**

- Un punto = una rama = un Pull Request. No se mezclan fases en un mismo commit.
- Antes de tocar código, leer [CODESTYLE.md](CODESTYLE.md) y la sección de
  [SPECS.md](SPECS.md) que corresponda.
- Commit al terminar cada punto, no al terminar la fase.
- `npm run typecheck` y `npm run build` pasan antes de cada commit. Si el punto
  tocó la base, además `npm run db:types`.
- Si un punto obliga a cambiar una decisión de SPECS, se actualiza SPECS en el
  mismo Pull Request. SPECS no puede quedar desactualizado.
- Marcar `[x]` acá al cerrar el punto, y anotar en `CHANGELOG.md` lo relevante.

Leyenda: `[x]` terminado · `[ ]` pendiente

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

Va antes que el próximo módulo: son las reglas que después se aplican solas
sobre todo lo que se escriba. Cuanto más código haya, más caro es implantarlas.

- [ ] Agregar Prettier como dependencia de desarrollo con su configuración, y
      scripts `npm run format` (escribe) y `npm run format:check` (verifica).
      Formatear el repositorio entero en un commit `chore:` aparte, sin ningún
      otro cambio, para que el diff sea revisable.
- [ ] Reparar el linting: `npm run lint` ejecuta `next lint`, que no puede
      funcionar porque no hay ESLint instalado ni configurado. Instalarlo con la
      configuración de Next 15, o quitar el script. Hoy es un script roto.
- [ ] Sumar `format:check` y `lint` al workflow de CI.
- [ ] Agregar `.editorconfig` con las mismas reglas que Prettier.
- [ ] Elegir un runner de tests (Vitest) y dejarlo configurado con un test de
      humo, para que las fases siguientes escriban tests desde el día uno.
- [ ] Cubrir con tests la lógica pura que ya existe y no toca la base: los type
      guards de `admision.ts`, `formatearDia` (incluido el corrimiento de día por
      zona horaria), y las validaciones de `primer-ingreso.ts`,
      `baja-residente.ts` y `reingreso-residente.ts`. Son funciones puras: se
      prueban sin levantar nada.
- [ ] Verificar que `.gitignore` cubra los artefactos generados
      (`tsconfig.tsbuildinfo`, `dev.log`, volcados del shell) y sacar del
      índice los que hayan quedado versionados.
- [ ] Ordenar `CHANGELOG.md`: hoy mezcla varias secciones "Agregado" y una de
      "Quitado" del reinicio, y no se lee cronológicamente.

## Fase 6 — Contabilidad, interfaz

La base está lista y sin usar. Es el mayor retorno por trabajo pendiente.

- [ ] `src/lib/pagos.ts` y `src/lib/pagos-datos.ts` sobre la vista
      `monthly_charge_balances`.
- [ ] Pantalla de cuotas de un residente: períodos, importe, pagado y saldo.
- [ ] Crear la cuota de un período, con el importe precargado desde
      `admissions.monthly_fee` y confirmable antes de guardar.
- [ ] Registrar un pago, total o parcial.
- [ ] Anular un pago y cancelar una cuota, con motivo.
- [ ] Listado de vencimientos del mes, usando `due_day`.
- [ ] Bucket **privado** de Supabase Storage para los comprobantes, y carga
      opcional al registrar un pago.
- [ ] Traducir cada error de las funciones de pago a un mensaje entendible.

## Fase 7 — Inicio

- [ ] Reemplazar el placeholder por un panel del día que responda "qué hay
      pendiente ahora": consultas sin llamar, visitas de hoy y mañana, cuotas
      vencidas e ingresos recientes.
- [ ] Cada dato del panel enlaza a la pantalla donde se resuelve.

## Fase 8 — Admisión, segunda entrega

- [ ] Vista de agenda semanal: grilla de días por franja, para ver de un vistazo
      qué turnos quedan libres antes de llamar a una familia. Es el próximo paso
      que pide `docs/admision-consultas-modelo.md`.
- [ ] Agendar la visita directamente desde un hueco libre de la grilla.
- [ ] Búsqueda por nombre o teléfono dentro de la bandeja.
- [ ] Paginación o carga incremental: hoy `listarConsultas()` trae todas las
      filas y `contarPorEstado()` trae una fila por consulta para contarlas en
      memoria. Con volumen real deja de servir.
- [ ] Reemplazar el conteo en memoria por conteos agregados en la base.
- [ ] **Cerrar el circuito Admisión → Residentes**: convertir una consulta en
      estado `ingreso` en un residente con su primer ingreso, precargando lo que
      ya se sabe de la consulta.

## Fase 9 — Empleados y roles

Acá aparece el primer usuario que no es el dueño, y con él la autorización real.

- [ ] Modelo de datos de empleados: datos personales y laborales.
- [ ] Alta, edición y baja de empleados.
- [ ] Modelo de roles y permisos por sección.
- [ ] Reemplazar las políticas actuales, que solo distinguen "hay sesión" de "no
      hay sesión", por políticas por rol.
- [ ] **Sacar `consulta` del acceso con `service_role`** y darle RLS con
      políticas, como el resto de las tablas. Es la última tabla que depende de
      una clave que saltea RLS, y la deuda de seguridad más vieja del proyecto.
- [ ] Vincular cada cuenta de Supabase Auth con su empleado.
- [ ] Registrar quién hizo cada cambio de estado y cada movimiento financiero.
- [ ] Documentar el modelo de roles en `docs/`.

## Fase 10 — Turnos

- [ ] Modelo de turnos del personal.
- [ ] Grilla semanal por empleado.
- [ ] Asignación, reasignación y cobertura de ausencias.
- [ ] Invariante en la base: sin turnos superpuestos para el mismo empleado.

## Fase 11 — Salud y documentación del residente

Cada tabla se diseña al empezar su módulo, no antes.

- [ ] `resident_documents` con bucket privado de Storage.
- [ ] Carga de documentos como imágenes; un documento faltante no bloquea el
      ingreso, queda pendiente.
- [ ] `medical_indications`: indicaciones vigentes e históricas.
- [ ] `medications`: medicamento, dosis, frecuencia, horarios y vigencia.
- [ ] `special_needs`: alimentación, alergias, movilidad y cuidados especiales.
- [ ] `inventory_items`: pertenencias entregadas en cada ingreso.

## Fase 12 — Entrevistas

- [ ] Definir el alcance funcional en `docs/`. Es la sección menos especificada
      del sistema y hoy no tiene modelo acordado.
- [ ] Modelo de datos y pantallas, una vez acordado el alcance.

---

## Transversal

Puntos que no pertenecen a una fase y se atienden cuando corresponda.

- [ ] Accesibilidad: foco visible, etiquetas asociadas y navegación por teclado
      en todos los formularios.
- [ ] Vista usable en pantalla chica; hoy el layout asume escritorio.
- [ ] Guía de instalación de una residencia nueva: crear el proyecto de
      Supabase, aplicar todas las migraciones, cargar variables y crear la
      cuenta del dueño.
- [ ] Procedimiento de backup y restauración de un proyecto.
