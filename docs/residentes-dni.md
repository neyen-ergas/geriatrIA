# DNI de residentes

El alta y la edición eliminan puntos y espacios del DNI antes de guardar.
La base aplica la misma normalización a INSERT y UPDATE, incluidas las RPC.
Así, `12.345.678`, `12 345 678` y `12345678` identifican a la misma persona.
Se conserva como texto: no se pierden ceros iniciales ni se modifican letras,
guiones u otros caracteres. Esta entrega no incorpora reglas de longitud ni
verificación documental. Un valor compuesto solo por separadores se rechaza.

Los espacios admitidos son los de `\s` de JavaScript, incluidos tabulaciones,
saltos de línea y espacios no separables. La función SQL usa el mismo conjunto
explícito para no depender del locale de la base.

## Integridad y datos existentes

La migración `20260906020000_normalize_resident_dni.sql` bloquea escrituras de
Residentes mientras audita y normaliza. Si encuentra DNI que quedarían vacíos
o dos fichas con el mismo DNI normalizado, aborta antes de modificar filas.
No fusiona ni elimina personas. Los errores no incluyen los DNI involucrados.

Una vez superada la auditoría, normaliza únicamente los valores que cambian.
El índice UNIQUE existente se conserva y evita duplicados también entre
escrituras concurrentes: el trigger normaliza antes de llegar al índice.
Las políticas RLS y los permisos de tablas permanecen vigentes. Las acciones
conservan el mensaje por campo «Ya existe un residente con este DNI».

## Auditoría previa

Ejecutar en la instalación correcta con acceso administrativo de lectura.
Antes de aplicar la migración, este SQL cuenta colisiones y valores vacíos
sin mostrar datos personales; no necesita la función nueva:

```sql
with normalizados as (
  select translate(dni,
    U&'. \0009\000a\000b\000c\000d\00a0\1680\2000\2001\2002\2003\2004\2005\2006\2007\2008\2009\200a\2028\2029\202f\205f\3000\feff',
    '') as dni
  from public.residents
)
select 'vacios' as problema, count(*) as cantidad
from normalizados where dni = ''
union all
select 'grupos_duplicados', count(*) from (
  select dni from normalizados group by dni having count(*) > 1
) duplicados;
```

Si hay problemas, acordar su resolución con el responsable dentro del entorno
privado de la residencia. No copiar datos personales a Git, tickets o logs.
La migración vuelve a auditar bajo bloqueo; una consulta previa no sustituye
ese control.

## Aplicación y recuperación

1. Aprobar el PR y comprobar CI. Disponer de backup y restauración verificados.
2. Verificar el proyecto vinculado y los pendientes de Admisión y fechas de
   estadías. Coordinar una ventana breve sin escrituras de Residentes.
3. Ejecutar la auditoría y `npx supabase db push --dry-run`. Aplicar al remoto
   solo con autorización expresa y revisando todas las migraciones pendientes.
4. Desplegar el código del PR. El código anterior es compatible con la base
   nueva: la normalización y los mensajes de duplicado siguen funcionando.

En local: `npx supabase migration up --local`, `npm run test:db`,
`npm run db:types:local`, `npm test`, `npm run typecheck` y `npm run build`.

Si la auditoría falla, la migración completa se revierte. Si falla la aplicación,
se puede revertir su código conservando la normalización SQL. Retirar las reglas
requiere una migración nueva que quite `residents_normalize_dni`, el check
`residents_dni_normalized` y las dos funciones de esta entrega, conservando el
UNIQUE y los controles anteriores. Esto vuelve a permitir duplicados por formato.
Los puntos y espacios originales no se pueden reconstruir a partir del DNI
normalizado: revertir código no restaura esa presentación. Preferir conservar
la identidad normalizada y corregir el problema mediante otro PR.
