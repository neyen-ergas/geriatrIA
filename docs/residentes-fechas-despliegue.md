# Residentes: fechas y estadías

La migración `20260906010000_validate_resident_stays.sql` impide ingresos
anteriores al nacimiento, fechas futuras y superposiciones entre estadías.
No modifica ni elimina registros existentes. La aplicación valida el primer
ingreso y la edición por campo y traduce los rechazos de la base en los cuatro
circuitos: alta, edición, baja y reingreso.

## Reglas de fechas

- Nacimiento, ingreso y baja deben ser fechas finitas y no posteriores al día
  actual en `America/Argentina/Buenos_Aires`, cualquiera sea la zona de la
  conexión SQL. No se implementan reservas ni ingresos programados.
- El nacimiento puede coincidir con el ingreso, pero no ser posterior a ningún
  ingreso de la persona, incluidos los históricos.
- La baja puede coincidir con el ingreso. Se conserva la baja y el reingreso
  en el mismo día, sin exigir un día de separación.
- Dos estadías son compatibles si la baja de una es anterior o igual al ingreso
  de la otra. Una estadía abierta no tiene extremo final.
- Una estadía que empieza y termina el mismo día es válida en los extremos de
  otra estadía, pero no dentro de ella. Puede haber varias estadías sucesivas
  de duración cero el mismo día: las fechas no permiten ordenar horas.
- Se conserva el índice de un único ingreso abierto. El reingreso abierto debe
  empezar a partir de todas las bajas anteriores; tampoco puede coexistir con
  una estadía histórica posterior a su inicio.

## Transacciones y concurrencia

Las funciones existentes de alta y edición siguen siendo `security invoker` y
transaccionales. Las políticas RLS y los permisos de las tablas se conservan.

Antes de escribir una estadía, un trigger actualiza físicamente la fila de su
persona (`id = id`). Esto serializa las estadías con las modificaciones del
nacimiento y actualiza también `residents.updated_at` mediante el trigger ya
existente. Un bloqueo sin escritura no basta con snapshots antiguos de
`REPEATABLE READ`; véase la [documentación de PostgreSQL sobre consistencia](https://www.postgresql.org/docs/17/applevel-consistency.html).

Los constraint triggers diferidos comprueban nacimiento e historia completos
al confirmar la transacción. Así se puede corregir nacimiento e ingreso juntos,
aunque el estado intermedio no sea válido. También hay comprobación posterior
a la escritura de admissions para conservar las garantías si una conexión usa
`SET CONSTRAINTS ALL IMMEDIATE`. En ese modo, el cliente deberá respetar la
coherencia en cada paso.

Los dos helpers internos son `security definer`, tienen `search_path` vacío y
no otorgan ejecución a `public`, `anon`, `authenticated` ni `service_role`.
Solo los triggers los invocan. Esto permite revisar toda la historia sin que
una política de lectura oculte una estadía al validador; las escrituras de la
aplicación siguen sujetas a RLS.

En `READ COMMITTED`, la escritura que espera comprueba la historia ya
confirmada. En `REPEATABLE READ`, una versión obsoleta recibe `40001`.
Operaciones que bloquean varias filas en distinto orden también pueden recibir
`40P01`; ambos casos piden recargar y revisar, sin reintentos automáticos.
Los rechazos revierten toda la operación, incluidos persona y contacto.

## Auditoría previa por instalación

Ejecutar con acceso administrativo de lectura en la instalación correcta.
Esta consulta devuelve cantidades, sin nombres, DNI ni fechas personales:

```sql
with hoy as (
  select (statement_timestamp()
    at time zone 'America/Argentina/Buenos_Aires')::date as fecha
)
select 'nacimientos_invalidos' as problema, count(*) as cantidad
from public.residents r, hoy
where not isfinite(r.birth_date) or r.birth_date > hoy.fecha
union all
select 'fechas_estadias_invalidas', count(*)
from public.admissions a
join public.residents r on r.id = a.resident_id
cross join hoy
where not isfinite(a.admitted_at) or a.admitted_at > hoy.fecha
  or a.admitted_at < r.birth_date
  or (a.discharged_at is not null and (
    not isfinite(a.discharged_at) or a.discharged_at > hoy.fecha
    or a.discharged_at < a.admitted_at
  ))
union all
select 'pares_superpuestos', count(*)
from public.admissions a
join public.admissions b on a.resident_id = b.resident_id and a.id < b.id
where (a.discharged_at is null or b.admitted_at < a.discharged_at)
  and (b.discharged_at is null or a.admitted_at < b.discharged_at);
```

Si hay cantidades distintas de cero, revisar los registros dentro del entorno
privado de la residencia y acordar su corrección con el responsable. No copiar
los registros a logs, Git o tickets. No fusionar, borrar ni ajustar fechas
automáticamente. La migración vuelve a comprobar estas reglas bajo bloqueo de
escrituras y aborta completamente con `resident_stays_require_review` si hay
incompatibilidades. La auditoría puede requerir tiempo según el historial;
planificar una ventana sin escrituras de Residentes.

## Validación local

Con la base local de este proyecto iniciada:

```bash
npx supabase migration up --local
npm run test:db
npm run test:db:concurrency
npm run db:types:local
npm test
npm run typecheck
npm run build
```

pgTAP comprueba límites, duración cero, superposiciones, atomicidad de las RPC
y RLS, y revierte sus datos ficticios. El script de concurrencia usa dos
conexiones al contenedor local indicado en `supabase/config.toml`; comprueba
bloqueos reales y rechazos en ambos niveles de aislamiento y retira únicamente
las filas ficticias que creó. Ambos corren en el job `Database tests` de CI.
Los tipos se regeneran desde la CLI, aunque los nuevos triggers no cambian el
contrato de las RPC que expone TypeScript.

## Aplicación y recuperación

1. Aprobar el PR, comprobar CI y disponer del backup y su procedimiento de
   restauración. Verificar el proyecto vinculado y las migraciones aplicadas.
2. Resolver primero el pendiente de Admisión del PR #19 según
   [su guía](admision-transiciones-despliegue.md). Un merge o un despliegue no
   aplica migraciones remotas; este PR tampoco lo hace.
3. Auditar las fechas existentes y coordinar la ventana sin escrituras.
4. Ejecutar `npx supabase db push --dry-run` y comprobar el conjunto exacto de
   migraciones pendientes. Aplicar al remoto solo con autorización expresa.
5. Aplicar la migración y desplegar el código del PR. La versión anterior sigue
   pudiendo guardar operaciones válidas con estas restricciones, aunque sus
   mensajes ante un rechazo son genéricos. El nuevo validador de formulario
   funciona antes de migrar, pero todavía no garantiza integridad en la base.
6. Verificar alta, edición, baja y reingreso con una ficha ficticia autorizada y
   recargar los formularios abiertos antes de reanudar el uso.

Si falla la prevalidación, se revierte la migración completa y queda pendiente;
no se corrigen datos por efecto de ese intento. Si falla la aplicación, puede
revertirse el código mediante PR conservando las restricciones, con mensajes
menos específicos. Revertir código no revierte el esquema.

Si hiciera falta retirar las restricciones, preparar y revisar una migración
nueva que retire los tres triggers de esta entrega, sus dos funciones internas
y los tres checks nuevos. Conservar los índices, checks, triggers y permisos
anteriores. Coordinar una ventana porque retirar estas garantías vuelve a
permitir fechas incoherentes; preferir una corrección que las mantenga.
