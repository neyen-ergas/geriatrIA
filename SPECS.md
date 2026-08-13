# SPECS · geriatrIA

Especificación técnica del sistema. Es la fuente de verdad: si este documento y
el código no coinciden, uno de los dos está mal y hay que resolverlo antes de
seguir.

Documentos derivados: [ROADMAP.md](ROADMAP.md) (qué falta y en qué orden),
[CODESTYLE.md](CODESTYLE.md) (cómo se escribe el código),
[CONTRIBUTING.md](CONTRIBUTING.md) (cómo se integra un cambio).

---

## 1. Producto

geriatrIA es el sistema de gestión interno de una residencia geriátrica. Lo usa
el equipo de la residencia, no las familias ni los residentes.

El recorrido del negocio, y el orden en que se construye el sistema:

```text
consulta de una familia ──> visita presencial ──> ingreso ──> estadía ──> baja
     (Admisión)                (Admisión)        (Residentes)  (Contabilidad,  (Residentes)
                                                                Turnos)
```

| Sección | Qué resuelve | Estado |
| --- | --- | --- |
| Inicio | Panel del día: qué hay pendiente ahora. | Placeholder |
| Admisión | Consultas entrantes, llamados y agenda de visitas. | Funcionando |
| Residentes | Personas, familiares, ingresos, bajas y reingresos. | Funcionando |
| Contabilidad | Cuotas mensuales, pagos y saldos. | Base lista, sin interfaz |
| Empleados | Personal de la residencia y sus datos laborales. | Placeholder |
| Turnos | Grilla de turnos del personal. | Placeholder |
| Entrevistas | Entrevistas de admisión. | Placeholder, sin diseñar |

### Multi-instalación

Cada residencia tiene **su propio proyecto de Supabase**. El código y las
migraciones son idénticos en todas las instalaciones; los datos, los usuarios y
las credenciales quedan separados por construcción.

Consecuencia de diseño: **ninguna tabla lleva `organization_id`**. La separación
es por instancia, no por fila. Toda migración nueva se aplica a todas las
instalaciones para que el esquema no diverja.

---

## 2. Stack

| Capa | Elección | Versión |
| --- | --- | --- |
| Framework | Next.js, App Router | 15.5 |
| Lenguaje | TypeScript, `strict` | 5.7 |
| UI | React | 19.0 |
| Estilos | Tailwind CSS | 4.0 |
| Componentes | Primitivas propias estilo shadcn/ui | `src/components/ui.tsx` |
| Iconos | lucide-react | 0.468 |
| Base de datos y auth | Supabase (Postgres + Auth) | `@supabase/ssr` 0.12 |
| Deploy | Vercel | — |

Sin librería de estado global, sin cliente de datos (React Query o similar) y
sin ORM. Los datos se leen en Server Components y se escriben con Server
Actions. Ese es el patrón por defecto y no se abandona sin un motivo escrito.

### Decisiones de arquitectura

1. **Server-first.** Todo lo que puede resolverse en el servidor se resuelve en
   el servidor. `"use client"` solo cuando hace falta interactividad real, y en
   el componente más chico posible.
2. **Las invariantes viven en la base.** Restricciones `check`, índices únicos
   parciales, claves foráneas y triggers. La validación de la aplicación es para
   dar buenos mensajes por campo, no para garantizar consistencia: dos
   operadores concurrentes derrotan cualquier validación previa hecha desde el
   código.
3. **Las escrituras que tocan varias tablas van en funciones de Postgres.** Un
   primer ingreso afecta `residents`, `family_contacts` y `admissions`. Postgres
   confirma las tres o revierte todas. La aplicación no orquesta transacciones
   de varios pasos desde TypeScript.
4. **Los tipos se generan desde la base**, no se escriben a mano. `npm run
   db:types` produce `src/types/database.ts`, y el código deriva de ahí con
   `Tables<"residents">` y `Database["public"]["Functions"][...]["Args"]`. Si
   cambia una columna, el build rompe.
5. **Nada se elimina.** No hay `DELETE` en ningún flujo: se descarta, se da de
   baja o se anula. Las claves foráneas usan `on delete restrict`.
6. **Componentes de UI propios.** Sin dependencia de un CLI interactivo ni de
   una librería de componentes externa.

---

## 3. Estructura del repositorio

```text
src/
  app/
    (app)/                    Pantallas autenticadas; el layout exige sesión.
      admision/               Bandeja de consultas.
      residentes/             Listado, alta, edición, baja y reingreso.
        nuevo/
        [admissionId]/editar/
        [admissionId]/baja/
        reingreso/[residentId]/
      contabilidad/           Placeholder.
      empleados/ turnos/ entrevistas/   Placeholders.
      layout.tsx              Sidebar + topbar + verificación de sesión.
      page.tsx                Inicio.
    login/                    Acceso; sin registro público.
    layout.tsx, icon.tsx, globals.css
  components/                 UI compartida entre módulos.
    ui.tsx                    Button, Card, Input, Label, Badge, Avatar, StatCard.
    sidebar.tsx, topbar.tsx, nav-link.tsx, placeholder-page.tsx
  lib/
    supabase/                 client.ts, server.ts, middleware.ts, admin.ts
    auth.ts                   requerirSesion()
    nav.ts                    Definición de la navegación
    utils.ts                  cn()
    admision.ts               Tipos y etiquetas de admisión (isomórfico)
    admision-datos.ts         Lecturas de admisión (server-only)
    residentes-datos.ts       Lecturas de residentes (server-only)
    primer-ingreso.ts         Validación y armado del alta
    baja-residente.ts         Validación de la baja
    reingreso-residente.ts    Validación del reingreso
  types/database.ts           Generado por `npm run db:types`. No se edita.
  middleware.ts               Renovación de sesión
supabase/migrations/          Migraciones versionadas
docs/                         Documentación funcional por módulo
```

### Convención de archivos por módulo

- **`<modulo>.ts`** — tipos, constantes, type guards y etiquetas en español.
  Isomórfico: lo importan servidor y cliente. **No importa nada de Supabase.**
- **`<modulo>-datos.ts`** — lecturas. Empieza con `import "server-only"`.
- **`<caso-de-uso>.ts`** — validación y armado de los argumentos de una
  escritura concreta (`primer-ingreso.ts`, `baja-residente.ts`). Puro y
  testeable; lo comparten la Server Action y el formulario cliente.
- **`app/(app)/<modulo>/actions.ts`** — Server Actions. Empieza con
  `"use server"`.

---

## 4. Autenticación

Supabase Auth con correo y contraseña.

- **No hay registro público.** `enable_signup = false` en
  `supabase/config.toml` y desactivado en el panel del proyecto remoto.
- Las cuentas las crea a mano un administrador desde el panel de Supabase.
- Toda pantalla de `(app)` exige sesión; el layout redirige a `/login`.
- **Nunca se decide autorización con `getSession()`.** El servidor usa
  `getClaims()`, que valida la firma del JWT. `getSession()` confía en el
  contenido de la cookie.
- **El layout no alcanza.** Las Server Actions se invocan por POST contra su
  propia ruta y no pasan por el layout. Cada acción llama a `requerirSesion()`
  como primera línea.

Hoy existe un solo perfil: el dueño o administrador. **No hay modelo de roles.**
Las políticas RLS actuales solo distinguen "hay sesión" de "no hay sesión". El
modelo de roles se diseña cuando entren empleados con distintos niveles de
acceso.

---

## 5. Seguridad y acceso a datos

El sistema guarda datos de salud y datos personales de terceros.

### Tres patrones de acceso, uno por generación de tabla

| Tablas | RLS | Cómo escribe la aplicación |
| --- | --- | --- |
| `consulta` | Activada **sin políticas**; `anon` y `authenticated` revocados | Cliente `service_role`, que saltea RLS |
| `residents`, `family_contacts`, `admissions` | Activada con políticas para `authenticated` | Cliente autenticado; altas y ediciones vía funciones transaccionales |
| `monthly_charges`, `payments` | Activada, **solo lectura** para `authenticated` | Exclusivamente vía funciones `security definer`; sin `insert`, `update` ni `delete` directos |

La dirección es clara y no se revierte: **cada tabla nueva usa RLS con políticas
y escrituras por función controlada**. El acceso con `service_role` es una
excepción heredada, limitada a `consulta`, y está en el ROADMAP para eliminarse.

### La clave `service_role`

- **Saltea RLS.** Nunca lleva el prefijo `NEXT_PUBLIC_`, nunca se importa desde
  código que corra en el navegador y se usa exclusivamente desde
  `src/lib/supabase/admin.ts`, que declara `import "server-only"` para que el
  build falle si alguien la arrastra al cliente.
- Mientras `consulta` se lea así, **la autenticación del CRM es la única barrera
  sobre esos datos**. Por eso cada Server Component y cada Server Action del
  módulo de admisión verifica la sesión, sin confiar solo en el middleware.

### Reglas que no se negocian

- Toda tabla expuesta tiene RLS activada antes de contener datos reales.
- Ninguna tabla otorga `delete` a `authenticated`.
- Los documentos e imágenes van a un bucket **privado** de Supabase Storage.
- **No se usan datos reales de residentes ni de familias en pruebas.**
- Ni `.env.local`, ni claves, ni contraseñas, ni datos reales entran a Git.
- Ningún mensaje de error ni log incluye datos personales.

### Variables de entorno

```text
NEXT_PUBLIC_SUPABASE_URL              URL del proyecto
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  Clave publicable (sb_publishable_...)
SUPABASE_SERVICE_ROLE_KEY             service_role clásica, solo servidor
```

Advertencia conocida: el proyecto **no acepta el formato nuevo de claves
secretas** (`sb_secret_...`); PostgREST responde `Invalid API key`. Va la
`service_role` clásica, que es además la que usa la landing.

---

## 6. Modelo de datos

Cinco migraciones aplicadas, en `supabase/migrations/`.

### 6.1 `consulta` — admisión

Excepción de nomenclatura documentada: **está en español** porque ya vivía en
producción, escrita por la landing de la residencia, antes de que existiera este
CRM. Renombrarla rompería el formulario a cambio de consistencia cosmética.

Campos que escribe la landing: `nombre` (2-80), `telefono` (6-30),
`momento_llamado` (`manana` \| `tarde` \| `indistinto`), `mensaje` (≤1000),
`origen` (default `landing`).

Campos que escribe el CRM: `estado`, `notas_internas`, `visita_fecha`,
`visita_franja` (`manana` \| `tarde`), más `id`, `creado_en` y `actualizado_en`.

**Estados y transiciones:**

```text
nuevo ──> contactado ──> visita_agendada ──> ingreso
  │            │                │
  └────────────┴────────────────┴──────────> descartada ──> nuevo
```

`visita_agendada` **no se alcanza cambiando el estado a mano**: el estado y las
dos columnas de la visita se mueven en el mismo `update`. Por eso
`ESTADOS_DIRECTOS` lo excluye y existe una acción propia. Cancelar la visita
devuelve la consulta a `contactado` y borra día y franja.

**Invariantes en la base:**

- `consulta_visita_completa` — `(visita_fecha is null) = (visita_franja is
  null)`. Una fecha sin franja no sirve.
- `consulta_visita_unica` — índice único parcial sobre `(visita_fecha,
  visita_franja) where estado = 'visita_agendada'`. Un turno por día y franja.
  Vive en la base a propósito: si dos operadores agendan en simultáneo, una
  validación previa desde el código deja pasar a las dos. Salir de
  `visita_agendada` libera el turno.

La aplicación traduce el error `23505` a **"Ese turno ya está ocupado por otra
consulta"**, nunca a un error técnico.

**Reglas:** una consulta entra siempre desde afuera, el CRM no las crea; nunca
se elimina, se descarta; la familia no reserva el turno, solo indica cuándo le
queda cómodo que la llamen.

**Contrato con la landing.** Los valores de `momento_llamado` están escritos en
tres lugares: el `check` de la tabla, `lib/content.ts` de la landing y las
etiquetas del CRM. Cambiar un valor obliga a tocar los tres. Es duplicación
deliberada: dos aplicaciones deployadas por separado que no comparten código.
`visita_franja` no existe en la landing.

**Propiedad del esquema:** geriatrIA es el sistema de registro. La landing solo
inserta filas.

### 6.2 `residents`, `family_contacts`, `admissions`

Nombres en inglés, acordados en su documento de diseño.

**Por qué residente e ingreso están separados:** `residents` es la persona y
conserva sus datos aunque deje la institución. `admissions` es cada estadía.
Permite dar de baja y reingresar sin duplicar identidad ni perder historia.

- `residents` — `first_name`, `last_name`, `dni` (**único**), `birth_date`,
  `phone`, `address`, `notes`. Los campos de texto obligatorios tienen `check`
  de no-vacío.
- `family_contacts` — `resident_id`, nombre, `relationship`, `phone`,
  `is_emergency_contact`, `is_payment_responsible`, `notes`.
- `admissions` — `resident_id`, `admitted_at`, `room`, `monthly_fee`
  (`numeric(12,2)`, ≥ 0), `currency` (`^[A-Z]{3}$`, default `ARS`), `due_day`
  (1-31), `administrative_notes`, `discharged_at`, `discharge_reason`.

**Invariantes en la base:**

- `admissions_one_active_per_resident_idx` — índice único parcial sobre
  `resident_id where discharged_at is null`. Un solo ingreso activo.
- `admissions_discharge_date_valid` — `discharged_at >= admitted_at`.
- `dni` único.
- Claves foráneas `on delete restrict`: no se puede borrar una persona con
  historia.
- Trigger `set_updated_at()` en las tres tablas.

**El estado activo no se guarda.** Se deriva de la ausencia de `discharged_at`.
Dos fuentes para el mismo dato terminan contradiciéndose.

**Funciones transaccionales:**

- `create_initial_admission(...)` — crea residente, primer contacto y primer
  ingreso en una sola transacción. No deja registros parciales ante un error.
- `update_active_admission(...)` — edita las mismas tres entidades juntas.

Ambas corren con los permisos del usuario autenticado: **las políticas RLS
siguen vigentes**, no son un `security definer` que las saltee.

**Reglas:** un residente puede ingresar más de una vez; una baja no elimina
nada; el formulario exige al menos un contacto al crear el primer ingreso; la
falta de un documento no impide el ingreso.

### 6.3 `monthly_charges`, `payments` — base lista, sin interfaz

- Una cuota pertenece a una **estadía**, no a la persona: cada reingreso
  mantiene su propia cuenta.
- **El importe se congela al crear la cuota**, copiado de
  `admissions.monthly_fee`. Cambiar la cuota vigente no altera períodos
  históricos.
- `monthly_charges_one_current_period_idx` — índice único parcial: una cuota
  vigente por estadía y período. Una cuota anulada puede reemplazarse.
- Una cuota admite varios pagos parciales.
- **Los errores se corrigen anulando, no borrando.** La aplicación no elimina
  filas.
- `monthly_charge_balances` — vista que calcula importe pagado, saldo, estado y
  vencimiento. No se guarda estado redundante que pueda quedar desactualizado.
- Escrituras solo por función: `create_monthly_charge`, `record_payment`,
  `void_payment`, `cancel_monthly_charge`. Son `security definer` con
  comprobación de `auth.uid()`, lo que permite **retirar los permisos directos
  de escritura** sobre las tablas.

Fuera de alcance de esta versión: facturación fiscal, egresos, sueldos,
conciliaciones, reintegros automáticos, pasarelas de pago y recordatorios de
deuda. Los comprobantes en bucket privado están pendientes.

### 6.4 Sin diseñar

La forma exacta se define al empezar cada módulo, no antes.

| Tabla | Alcance |
| --- | --- |
| `resident_documents` | Metadatos y ruta de la imagen privada en Storage. |
| `medical_indications` | Indicaciones médicas vigentes e históricas. |
| `medications` | Medicamento, dosis, frecuencia, horarios y vigencia. |
| `special_needs` | Alimentación, alergias, movilidad, cuidados especiales. |
| `inventory_items` | Pertenencias entregadas en cada ingreso. |
| `employees`, `shifts` | Personal y grilla de turnos. |

---

## 7. Migraciones

- Toda estructura se versiona en `supabase/migrations/`. **Nada se cambia a mano
  desde Table Editor o SQL Editor.**
- Una migración aplicada **no se reescribe**: se crea otra que haga el cambio.
- Toda tabla expuesta incluye RLS y sus políticas en la misma migración que la
  crea.
- Después de aplicar, **regenerar los tipos**: `npm run db:types`.
- Antes de aplicar, verificar contra qué proyecto está vinculada la CLI.

```bash
npx supabase login
npx supabase link --project-ref ID_DEL_PROYECTO
npx supabase db push --dry-run
# aplicar al remoto solo después de aprobar el Pull Request
```

La primera migración (`20260804201106_consulta.sql`) es idempotente porque
reproduce un esquema que ya estaba aplicado a mano.

---

## 8. Idioma

- **Interfaz, documentación, commits y comentarios: español.**
- **Código de la aplicación: español.** Rutas (`/admision`), tipos (`Consulta`,
  `ResidenteActivo`), funciones (`listarConsultas`, `requerirSesion`).
- **Esquema de base: inglés**, salvo `consulta` y sus columnas, que quedaron
  heredadas de la landing. Las funciones de Postgres van en inglés
  (`create_initial_admission`, `record_payment`).
- **Vocabulario del framework y de las librerías: como venga.** `page.tsx`,
  `searchParams`, `revalidatePath`, `className`. No se traduce.

El detalle está en [CODESTYLE.md](CODESTYLE.md).

---

## 9. Verificación

```bash
npm run typecheck   # tsc --noEmit
npm run build       # compila y typecheckea todo
npm run db:types    # regenera src/types/database.ts desde la base vinculada
```

GitHub Actions repite `typecheck` y `build` sobre cada Pull Request a `master` y
sobre cada push a `master`.

No hay suite de tests automatizados, ni formateador, ni linter configurado.
Son carencias conocidas y están al principio del [ROADMAP](ROADMAP.md).

---

## 10. Definición de terminado

Un cambio está terminado cuando cumple el alcance acordado, `typecheck` y
`build` pasan, el diff fue leído completo, los tipos están regenerados si tocó
la base, la documentación afectada está actualizada, el `CHANGELOG` refleja lo
relevante y el Pull Request puede integrarse sin pasos manuales ocultos.
