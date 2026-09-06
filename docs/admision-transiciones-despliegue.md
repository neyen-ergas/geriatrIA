# Admisión: aplicación del control de escrituras

La migración `20260906000000_control_consulta_updates.sql` agrega
`update_consulta`, vuelve estrictamente creciente `actualizado_en` y retira
`update` directo a `service_role`. Conserva la lectura del CRM y el `insert`
de la landing. No borra ni transforma registros existentes.

## Compatibilidad

El CRM anterior escribe con `update` directo y dejará de poder guardar cambios
cuando se aplique la migración. El CRM nuevo necesita la función para escribir.
Se requiere una ventana coordinada sin operaciones de Admisión entre ambos
pasos. La landing puede seguir recibiendo consultas.

## Verificación local

Con Docker Desktop en ejecución y reanudado:

```bash
npm ci
npx supabase db start
npm run test:db
npm run db:types:local
npm test
npm run typecheck
npm run build
```

Si ya existe una base local iniciada antes de esta migración, aplicar las
migraciones pendientes con `npx supabase migration up --local`. Los tipos se
generan desde la base local para revisar el cambio antes de aplicarlo al remoto;
no se editan a mano. Los tests no usan credenciales ni registros de producción.

## Instalación en una residencia

1. Revisar y aprobar el PR con sus controles en verde. Comprobar el proyecto
   vinculado y tener disponible el procedimiento de backup y restauración.
2. Planificar la ventana sin escrituras de Admisión. Si el merge dispara el
   despliegue automático, coordinar también ese momento.
3. Ejecutar `npx supabase db push --dry-run` y comprobar que solo estén las
   migraciones previstas para esa instalación.
4. Aplicar mediante `npx supabase db push`, después de la aprobación del PR.
5. Desplegar el CRM del mismo PR. Recargar las pestañas abiertas; los
   formularios anteriores no incluyen la versión requerida.
6. Verificar el circuito con una consulta de prueba autorizada: abrirla en dos
   pestañas, modificarla en una e intentar cambiarla desde la otra. La segunda
   debe pedir recargar y conservar el cambio de la primera.
7. Reabrir el uso normal de Admisión tras verificar lecturas y escrituras.

Cada residencia aplica su propia migración. La configuración local y el CI no
modifican automáticamente ninguna base remota.

## Recuperación

Revertir solo el código no alcanza: el CRM anterior no puede escribir con los
permisos nuevos. Preferir una corrección mediante otro PR que conserve la función
y el control de versión.

Si fuera necesario restaurar la versión anterior, revisar una migración nueva
de compatibilidad que ejecute `grant update on public.consulta to service_role`,
aplicarla en una ventana coordinada y desplegar el código anterior mediante un
PR de revert. Esto restaura también la limitación anterior frente a
sobrescrituras concurrentes; debe retirarse al volver a desplegar la corrección.
No se elimina la función ni se reescribe la migración aplicada. El trigger
creciente es compatible con el código anterior y puede conservarse.
