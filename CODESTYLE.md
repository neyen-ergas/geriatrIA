# CODESTYLE · geriatrIA

Cómo se escribe el código de este proyecto. No son preferencias: son las reglas
que hacen que el código siga siendo legible y depurable dentro de un año.

Un cambio que rompe una regla de acá no se integra hasta arreglarlo.

---

## 1. Idioma

**Español** en todo lo que escribimos nosotros:

- Interfaz, mensajes de error y textos visibles.
- Nombres de variables, funciones, tipos y archivos de la aplicación.
- Comentarios, documentación y mensajes de commit.

```ts
// Bien
export async function listarResidentesActivos(): Promise<ResidenteActivo[]>
export function requerirSesion(): Promise<void>
const ETIQUETAS_ESTADO: Record<Estado, string>

// Mal
export async function fetchActiveResidents(): Promise<ActiveResident[]>
```

**Inglés** en el esquema de base: tablas, columnas y funciones de Postgres
(`residents`, `monthly_charges`, `create_initial_admission`, `record_payment`).
La interfaz que ve el usuario va en español igual.

**Excepción documentada:** la tabla `consulta` y sus columnas están en español
porque las escribe la landing desde antes de que existiera el CRM. Renombrarla
rompería el formulario. No se agregan excepciones nuevas sin escribir el motivo
en `SPECS.md`.

**Se deja como viene** el vocabulario del framework y de las librerías:
`page.tsx`, `layout.tsx`, `actions.ts`, `searchParams`, `revalidatePath`,
`className`, `useActionState`, `formData`. Traducirlos rompe la convención de
Next y confunde más de lo que ayuda.

Sin `ñ` ni acentos en identificadores ni en nombres de archivo: `admision.ts`,
no `admisión.ts`. Los acentos van en los textos visibles, donde corresponden.

---

## 2. Comentarios

Regla general: **el código dice qué hace; el comentario dice por qué**.

Se comenta cuando:

- Una decisión tiene una alternativa razonable que fue descartada, y hay que
  explicar por qué.
- Hay una trampa que muerde a quien no la conoce: zonas horarias, concurrencia,
  claves que saltean RLS, contratos duplicados entre repositorios.
- Una restricción vive en la base y el código depende de ella.

```ts
/**
 * `visita_fecha` es un `date` sin horario. Pasarlo directo a `new Date()` lo
 * interpreta como UTC y en Argentina lo corre un día para atrás.
 */
export function formatearDia(fecha: string): string {
```

No se comenta:

- Lo que el nombre ya dice. `// listar consultas` arriba de `listarConsultas()`
  es ruido.
- Cambios ni historial. Para eso está Git. Nada de `// agregado 12/03`,
  `// antes usábamos X` ni código comentado "por las dudas". Se borra.
- Encabezados decorativos vacíos ni banners que separan por separar.

Formato:

- `/** ... */` para módulos, funciones exportadas y tipos que necesitan
  explicación. Es lo que ve el editor al pasar el mouse.
- `//` para una aclaración puntual dentro de una función.
- Separadores `-- ── Sección ──` solo en las migraciones SQL, donde un archivo
  largo sin secciones se vuelve ilegible. En TypeScript no se usan.

Cada comentario que se agrega hay que poder defenderlo. Ante la duda, no va.

---

## 3. Estructura

### Archivos por módulo

| Archivo | Responsabilidad | Marca obligatoria |
| --- | --- | --- |
| `src/lib/<modulo>.ts` | Tipos, constantes, type guards, etiquetas, formateadores | ninguna; es isomórfico |
| `src/lib/<modulo>-datos.ts` | Lecturas contra la base | `import "server-only"` |
| `src/lib/<caso-de-uso>.ts` | Validación y armado de una escritura concreta | ninguna; puro |
| `src/app/(app)/<modulo>/actions.ts` | Server Actions | `"use server"` |

Ejemplos vigentes: `admision.ts` + `admision-datos.ts`; `residentes-datos.ts` +
`primer-ingreso.ts`, `baja-residente.ts`, `reingreso-residente.ts`.

`<modulo>.ts` y los archivos de caso de uso **no importan nada de Supabase**.
Los consumen componentes cliente, y todo lo que importen termina en el bundle
del navegador. Además son funciones puras: es la lógica que se puede testear sin
levantar nada.

`<modulo>-datos.ts` toca la base y lleva `server-only` sin excepción. En el caso
de admisión usa además la clave `service_role`, que saltea RLS: arrastrarlo al
cliente filtraría una credencial con acceso total.

Las pantallas van en `src/app/(app)/<modulo>/`. Los componentes que usa un solo
módulo viven junto a su `page.tsx`; los que comparten dos o más suben a
`src/components/`.

### Tamaño

- Un archivo que pasa las ~300 líneas probablemente hace dos cosas. Partirlo por
  responsabilidad, no por cantidad de líneas.
- Una función que no entra en pantalla es candidata a partirse.
- Los helpers privados van al final del archivo, después de lo exportado.

### Orden de los imports

1. React y Next.
2. Librerías externas.
3. Internos con alias `@/`.
4. Relativos (`./`).

Siempre alias `@/` para cruzar carpetas. `../../lib/algo` no se usa.

---

## 4. TypeScript

- `strict` activado. **`any` no se usa.** Si un valor externo llega como
  `unknown`, se lo estrecha con un type guard.

- **Los tipos de la base se derivan de `src/types/database.ts`, nunca se
  escriben a mano.** Ese archivo lo genera `npm run db:types` y **no se edita**.
  Si cambia una columna y el código no se adaptó, el build rompe. Eso es lo que
  queremos.

```ts
import type { Database, Tables } from "@/types/database";

type DatosResidente = Pick<Tables<"residents">, "id" | "first_name" | "dni">;

type ArgumentosPrimerIngreso =
  Database["public"]["Functions"]["create_initial_admission"]["Args"];
```

- Tipos derivados, no duplicados:

```ts
export const ESTADOS = ["nuevo", "contactado", "visita_agendada", "ingreso", "descartada"] as const;
export type Estado = (typeof ESTADOS)[number];
```

- Todo dato que entra desde afuera —`formData`, `searchParams`, respuestas de la
  base— se valida con un type guard antes de usarse:

```ts
export function esEstado(valor: unknown): valor is Estado {
  return ESTADOS.includes(valor as Estado);
}
```

- Un subconjunto de otro tipo se declara con `satisfies` para que el compilador
  avise si el original cambia:

```ts
export const ESTADOS_DIRECTOS = [...] as const satisfies readonly Estado[];
```

- `type` para objetos y uniones; `interface` solo cuando hace falta extender.
- Las funciones exportadas declaran su tipo de retorno.
- `Record<Clave, Valor>` para los mapas de etiquetas: si se agrega un estado, el
  compilador exige su etiqueta.

---

## 5. Datos y mutaciones

**Server-first.** Se lee en Server Components y se escribe con Server Actions.
`"use client"` se agrega solo cuando hay interactividad real, y en el componente
más chico posible, no en la página entera.

Toda Server Action sigue el mismo esquema:

```ts
export async function agendarVisita(
  _previo: Resultado,
  formData: FormData,
): Promise<Resultado> {
  await requerirSesion();        // 1. sesión, siempre primero
  // 2. leer y validar la entrada
  // 3. escribir
  // 4. traducir el error de la base
  revalidatePath("/admision");   // 5. revalidar
  return OK;
}
```

Reglas que se aplican sin excepción:

1. **`requerirSesion()` es la primera línea.** El layout de `(app)` no protege
   las acciones: se invocan por POST contra su propia ruta y no pasan por él.
2. **Los errores se devuelven, no se lanzan.** Una Server Action devuelve
   `{ error, ok }` y el formulario lo muestra. Lanzar rompe la pantalla.
3. **Cada mutación termina en `revalidatePath()`**, o la pantalla queda mostrando
   datos viejos.
4. Un módulo `"use server"` solo puede exportar funciones `async`. Las
   constantes de estado inicial del formulario van en el componente cliente.

### Una escritura que toca varias tablas va en una función de Postgres

No se encadenan inserts desde TypeScript. Un error en el tercero deja los dos
primeros escritos, y no hay forma de revertirlos desde la aplicación. Postgres
confirma todo o no confirma nada.

Es el patrón de `create_initial_admission`, `update_active_admission`,
`record_payment` y `void_payment`. Para las tablas financieras se llega más
lejos: son `security definer` con comprobación de `auth.uid()`, y eso permite
**retirar los permisos directos de `insert` y `update`** sobre las tablas.

Toda escritura financiera o multi-tabla nueva sigue este camino.

### Las invariantes viven en la base

Restricciones `check`, índices únicos parciales, claves foráneas y triggers. **La
validación desde el código no garantiza nada** cuando hay dos operadores
trabajando al mismo tiempo: los dos pasan la validación y los dos escriben.

La aplicación valida para dar buenos mensajes. La base garantiza.

Y cuando la base rechaza, el usuario lee una explicación, nunca un error
técnico:

```ts
if (error.code === UNIQUE_VIOLATION) {
  return falla("Ese turno ya está ocupado por otra consulta.");
}
```

### Validación por campo

Los formularios largos devuelven un error por campo, no un mensaje global que
obliga a adivinar cuál está mal:

```ts
export type ErroresPrimerIngreso = Partial<Record<CampoPrimerIngreso, string>>;
```

Esa validación vive en el archivo de caso de uso, es pura, y la comparten la
Server Action y el componente cliente. Una sola definición de qué es válido.

### Nada se elimina

No hay `DELETE` en ningún flujo. Una consulta se descarta, un residente se da de
baja, un pago se anula. Las claves foráneas usan `on delete restrict` y las
tablas no otorgan `delete` a `authenticated`.

---

## 6. Depurable

El objetivo es que un error en producción se entienda leyendo el mensaje.

- **Los mensajes de error dicen qué falló y con qué dato.** `"No se pudieron
  leer las consultas: <motivo>"`, no `"Error"` ni `"Algo salió mal"`.
- **Ningún error se traga.** Sin `catch {}` vacíos y sin `?.` usado para tapar
  un valor que no debería faltar.
- Los códigos de error de Postgres se declaran como constante con nombre:
  `const UNIQUE_VIOLATION = "23505";`. Un `"23505"` suelto en un `if` no se
  entiende sin buscarlo.
- Las funciones puras se separan de las que tocan la base o el pedido HTTP.
- **Nada de `console.log` en el código integrado.** Sirven mientras se desarrolla
  y se borran antes del commit.
- Ningún mensaje de error ni log incluye datos personales de familias o
  residentes.

---

## 7. Estilos

- Tailwind, escrito en el `className`. Sin CSS suelto salvo lo que ya vive en
  `globals.css`.
- Clases condicionales siempre con `cn()`, nunca con concatenación de strings.
- Las primitivas están en `src/components/ui.tsx`. Antes de escribir un botón o
  una tarjeta, usar la que existe. Si falta una variante, se agrega a la
  primitiva.
- La paleta de un módulo se declara como mapa junto a su tipo
  (`COLORES_ESTADO`), no repartida por las pantallas.
- Móvil primero: la clase base es la de pantalla chica y los prefijos `lg:`
  agregan escritorio.

---

## 8. SQL y migraciones

- Un archivo por migración, con su timestamp. **Una migración aplicada no se
  reescribe**: se crea otra que haga el cambio.
- Encabezado que explica qué hace la migración y por qué, con el enlace al
  documento del módulo.
- SQL en minúsculas, columnas alineadas, secciones separadas con
  `-- ── Sección ──`.
- Las migraciones que crean varios objetos van entre `begin;` y `commit;`.
- Cada restricción no obvia lleva un comentario explicando qué garantiza y por
  qué está en la base y no en la aplicación.
- Las restricciones se nombran: `admissions_discharge_date_valid` dice qué se
  violó; una restricción anónima no.
- Toda tabla expuesta activa RLS **en la misma migración que la crea**, con sus
  políticas y sus `grant` explícitos. Nunca se otorga `delete`.
- Las funciones declaran `set search_path = ''` y usan nombres calificados.
- **Después de aplicar una migración, regenerar los tipos**: `npm run db:types`.
  Los cambios de esquema y los tipos viajan en el mismo Pull Request.

---

## 9. Formato

El repositorio está siempre formateado. **Se formatea antes de cada commit**, y
el formato nunca viaja mezclado con lógica: si hace falta reformatear archivos
que no se tocaron, va en un commit `chore:` propio.

Convenciones vigentes: dos espacios de indentación, comillas dobles, punto y
coma, comas finales en multilínea, ancho de 80 columnas.

> Prettier todavía no está instalado y `npm run lint` apunta a un ESLint que no
> existe. Está en la Fase 5 del [ROADMAP](ROADMAP.md). Hasta entonces, el formato
> se respeta a mano siguiendo el estilo del código que ya está.

---

## 10. Commits

Conventional commits, en español, en imperativo y en minúscula:

```text
feat: agrega el reingreso de residentes
fix: valida el formato de la cuota mensual
docs: define el modelo inicial de pagos
chore: genera los tipos de Supabase
refactor: separa el acceso a datos del modulo de admision
```

Prefijos: `feat`, `fix`, `docs`, `chore`, `refactor`, `test`, `style`.

- Un commit = un cambio coherente. Nada de `cambios`, `arreglos` ni `avance`.
- `typecheck` y `build` pasan antes de commitear.
- Nunca entran a Git: `.env.local`, claves, contraseñas, datos reales de
  residentes o de familias, ni archivos generados fuera de
  `src/types/database.ts`.

---

## 11. Antes de dar algo por terminado

- [ ] Cumple el alcance acordado, sin agregados que nadie pidió.
- [ ] `npm run typecheck` y `npm run build` pasan.
- [ ] Si tocó la base: migración versionada y `npm run db:types` corrido.
- [ ] Está formateado.
- [ ] Sin `any`, sin `console.log`, sin código comentado.
- [ ] Cada Server Action nueva empieza con `requerirSesion()`.
- [ ] Cada error de base se traduce a un mensaje entendible.
- [ ] Las invariantes nuevas están en la base, no solo en el código.
- [ ] Las escrituras multi-tabla pasan por una función de Postgres.
- [ ] `SPECS.md`, `ROADMAP.md`, `docs/` y `CHANGELOG.md` reflejan el cambio.
- [ ] El diff se leyó entero.
