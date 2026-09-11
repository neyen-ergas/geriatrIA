# Comprobantes privados

El formulario de pago admite un adjunto opcional JPG, PNG o PDF de hasta 3 MiB.
El servidor verifica tamaño, tipo MIME y firma inicial; no usa el nombre original
del archivo ni lo publica. Esto comprueba formato, no reemplaza un análisis
antimalware. La descarga se sirve como adjunto, con nombre genérico.

## Almacenamiento y acceso

La migración `20260911230000_private_payment_receipts.sql` crea el bucket privado
`payment-receipts`, con límites de tamaño y MIME. Las rutas tienen la forma:

`{usuario}/{estadia}/{cuota}/{uuid}.{extension}`

RLS permite insertar archivos en la carpeta del usuario autenticado, para una
cuota existente de esa estadía que no esté anulada. Una carga sin vincular solo
es visible para quien la subió. Una vez registrada, los usuarios autenticados
pueden consultar el comprobante, conforme al acceso financiero actual de la
residencia. Los roles específicos siguen pendientes en la fase de empleados.
No se otorgan políticas para sobrescribir ni eliminar archivos.

El trigger de pagos comprueba dentro de `record_payment` que el archivo exista
en ese bucket y corresponda a usuario, estadía y cuota. No permite reutilizarlo
en otro pago. No cambia firmas de RPC ni requiere regenerar tipos públicos por
cambios de columnas. Los tipos generados se verifican en CI.

## Flujo y errores

Se valida el pago, se carga el adjunto y luego se invoca `record_payment` con
su ruta. Si la carga falla, no se registra el pago; puede seleccionarse de nuevo
el archivo o continuar sin adjunto. El campo de archivo no se puede restaurar
automáticamente después de un error del formulario.

Storage y el pago no forman una transacción única. Si la carga termina pero
el registro falla o pierde la respuesta, el archivo se conserva. Nunca se borra
ante un resultado incierto: podría pertenecer a un pago confirmado. Los archivos
sin vínculo quedan privados para su autor. Una limpieza administrativa futura
debe comprobar que no existan pagos asociados y considerar operaciones todavía
en curso; esta entrega no agrega borrados automáticos ni una tarea programada.

El detalle de movimientos enlaza a una ruta autenticada que verifica estadía,
cuota, pago y ruta antes de firmar una descarga por 60 segundos. La respuesta
no se almacena en caché y no envía referente. El enlace temporal concede acceso
a quien lo tenga durante su vigencia; no se guarda en la base ni en el listado.
Los comprobantes siguen disponibles después de anular el pago.

## Despliegue y recuperación

Aplicar la migración versionada antes de integrar/desplegar la interfaz. Es
aditiva: no transforma pagos previos ni borra objetos. Los pagos sin adjunto
continúan funcionando con el código anterior. Si ya existe un bucket con ese
identificador, la migración se detiene para revisarlo, sin reemplazarlo.
El índice único exige que las rutas existentes no se repitan; comprobarlo antes
de aplicar. Si hay duplicados, se aborta sin modificar los pagos.

Para volver al código anterior, conservar bucket, políticas, archivos y trigger.
No eliminar la migración ni los comprobantes. Si hay que corregir permisos,
hacerlo con una migración nueva. Los archivos de Storage deben incluirse en el
procedimiento de respaldo junto con sus referencias en Postgres.

Las pruebas locales cubren validación de archivos y fallos de subida, escritura
y descarga. CI aplica la migración y verifica RLS, vinculación y conservación
con datos ficticios en `payment_receipts.test.sql`; no usa archivos reales.

Fuentes técnicas: [RLS en Storage](https://supabase.com/docs/guides/storage/security/access-control)
y [límite de Server Actions](https://nextjs.org/docs/app/api-reference/config/next-config-js/serverActions).
