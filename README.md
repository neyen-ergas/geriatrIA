# geriatrIA — Demo funcional

Reemplazo digital de la planilla de papel donde el personal de un geriátrico
firma cuando le da la medicación a un residente. Este repo es un **demo
funcional end-to-end** (no el Fase 1 completo): corre contra un proyecto
**Supabase real**, sin mocks, y muestra el flujo completo login → tomas del
turno → registro → dashboard.

Stack: **Next.js 15** (App Router) · TypeScript · Tailwind CSS v4 ·
componentes estilo shadcn/ui · Supabase (Postgres + Auth + RLS).

---

## Cómo correrlo

```bash
npm install
npm run dev
```

Abrir http://localhost:3000 . El archivo `.env.local` ya viene con la URL y el
anon key del proyecto Supabase de demo (`geriatria-dev`), así que funciona sin
configuración extra.

Otros scripts:

```bash
npm run build            # build de producción (compila y typecheckea todo)
npm run typecheck        # solo tsc --noEmit
npm run test:aislamiento # test de aislamiento entre organizaciones (ver abajo)
```

---

## Usuarios demo

Todos con contraseña **`Demo1234!`**.

| Email                    | Rol          | Organización              |
|--------------------------|--------------|---------------------------|
| `owner@aromos.demo`      | `owner`      | Residencia Los Aromos     |
| `enfermera@aromos.demo`  | `enfermeria` | Residencia Los Aromos     |
| `cuidador@aromos.demo`   | `cuidador`   | Residencia Los Aromos     |
| `owner@sanmartin.demo`   | `owner`      | Residencia San Martín *   |

\* La segunda organización existe **solo para el test de aislamiento**; no tiene
UI pensada para recorrer.

En la pantalla de login hay botones **Owner** / **Cuidador** que autocompletan
las credenciales.

**Qué mirar según el rol:**
- **Cuidador** → pantalla "Tomas de mi turno". Puede registrar tomas (3 taps),
  pero **no** puede editar residentes ni corregir una toma ya registrada.
- **Owner** → todo lo anterior + ABM de residentes + dashboard.

---

## Qué se puede ver en el demo

1. **Login** (email + password contra Supabase Auth).
2. **Tomas de mi turno** (la pantalla más importante): tomas de hoy agrupadas
   por horario, con estados visuales claros — *a tiempo / atrasada / vencida /
   administrada / rechazada / omitida*. Registro en 3 taps: tocar la toma →
   confirmar *Administrada*, o *Rechazó* → elegir motivo de una lista corta.
3. **Residentes**: listar, crear y editar (con asignación de habitación).
4. **Dashboard** con 3 números: camas ocupadas/libres, % de cumplimiento de los
   últimos 7 días, tomas omitidas hoy.

Los datos vienen sembrados y "vivos": al loguearte ya hay tomas administradas,
pendientes, atrasadas, una rechazada y una omitida, más 6 días de historia para
que el dashboard tenga números reales.

---

## Modelo de datos y seguridad

Migraciones en `supabase/migrations/` (versionadas en git; la verdad la tiene el
proyecto remoto, aplicadas vía `apply_migration`):

- `sprint1_tenancy_rls` — `organizacion`, `sede`, `usuario_perfil`,
  `usuario_rol`, helpers de auth, `audit_log` + trigger genérico de auditoría.
- `sprint2_residentes` — `residente`, `contacto_residente`, `habitacion`.
- `sprint3_emar` — `medicamento`, `prescripcion`, `administracion_medicamento`,
  y los RPC `generar_tomas_del_dia` y `registrar_toma`.
- `seed_demo_data` — organizaciones, usuarios, residentes, vademécum,
  prescripciones y las tomas de hoy.

### RLS (lo más importante técnicamente)

- **Todas** las tablas con `ENABLE` + `FORCE ROW LEVEL SECURITY`.
- Policies **separadas por operación y por rol**, no solo por organización. Caso
  concreto que se cumple y está testeado: un `cuidador` puede `INSERT` en
  `administracion_medicamento` pero **no** `UPDATE`/`DELETE` directo. Corrige una
  toma vía anotación (rol `enfermeria`), nunca reescribiendo historia clínica.
- Las escrituras clínicas sensibles van por **RPC `SECURITY DEFINER`
  (`registrar_toma`)** con validación de rol y organización adentro: el front
  nunca decide un estado clínico con un `update()` directo.
- Auditoría por **trigger** (no por código de app): no se puede esquivar ni desde
  el SQL editor. `audit_log` es append-only (sin policies de UPDATE/DELETE).

### Test de aislamiento (requisito no negociable del plan)

Script real (login con dos usuarios de dos organizaciones distintas, anon key,
sin mocks) que verifica que **cero** filas de la organización B son visibles
logueado como usuario de la organización A, en cada tabla clínica; y que el
`cuidador` no puede hacer UPDATE directo:

```bash
npm run test:aislamiento
```

---

## Qué está simplificado respecto al plan real (deuda técnica)

Esto es un demo de una sesión, no producción. Si avanza, falta:

- **Resolución de rol/organización por subquery, no por JWT.** El plan real usa
  el *Custom Access Token Hook* de Supabase para inyectar `organizacion_id` y
  `rol` en el JWT, y las policies leen del claim. Acá se usa el approach
  alternativo: helpers `SECURITY DEFINER` (`auth_organizacion_id()`,
  `auth_tiene_rol()`) que consultan `usuario_perfil`/`usuario_rol` a partir de
  `auth.uid()`. Es correcto pero más lento (una subquery por fila); para pocas
  filas no se nota. **Migrar al hook antes de producción.**
- **Usuarios creados por SQL directo** (insert en `auth.users` con password
  hasheado por `pgcrypto`), no por el flujo de invitación por token. No hay
  pantalla de alta/invitación de usuarios.
- **Zona horaria fija `-03:00`** (Argentina no tiene horario de verano hoy). Si
  algún día vuelve el DST, hay que usar tz real.
- **Sin PWA / offline / cola de escritura con IndexedDB.** El plan lo pide para
  el Sprint 4 real (señal irregular en el edificio); acá no está.
- **Sin `pg_cron`.** `generar_tomas_del_dia` y el marcado de tomas `omitida`
  existen como lógica pero no hay job programado; las tomas de hoy se sembraron
  al aplicar el seed.
- **Sin Storage** (foto/documentos de residente), sin exportación a PDF, sin
  historial por residente, sin realtime. Fuera de alcance de este demo.
- Nada de Fase 2 (signos vitales, cuidados, alertas, facturación).

---

## Estructura

```
src/
  app/
    login/                     # login (Supabase Auth)
    (app)/                     # rutas protegidas por middleware
      turno/                   # "Tomas de mi turno" (pantalla estrella)
      residentes/              # ABM de residentes + server actions
      dashboard/               # 3 números
  components/                  # UI (estilo shadcn), turno-lista, form, nav
  lib/
    supabase/                  # clients browser/server + middleware de sesión
    tomas.ts                   # derivación de estado visual + motivos de rechazo
    fecha-ar.ts                # rangos de fecha en zona AR
supabase/migrations/           # SQL versionado (aplicado al proyecto remoto)
scripts/
  test-aislamiento.mjs         # test de aislamiento entre organizaciones
  smoke-registro.mjs           # smoke test del flujo de registro vía RPC
```
