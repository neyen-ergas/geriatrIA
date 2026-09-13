# Perfiles y accesos

Cada residencia conserva su propia base y sus cuentas de Supabase Auth.

| Perfil | Admisión, Residentes, Contabilidad e Inicio | Empleados y Accesos |
| --- | --- | --- |
| Administrador (`admin`) | Lectura y gestión | Lectura y gestión |
| Gestión (`management`) | Lectura y gestión | Sin acceso |
| Solo lectura (`readonly`) | Lectura, incluidos movimientos y comprobantes | Sin acceso |

Turnos y Entrevistas siguen siendo placeholders visibles solo al Administrador.
La ficha laboral no crea ni habilita una cuenta. Vincular ambas identidades e
invitar usuarios desde el CRM quedan fuera de esta entrega. Las cuentas se crean
por el procedimiento administrativo de Supabase y aparecen en Accesos, sin
permisos hasta que un Administrador les asigne perfil y las habilite.

## Garantías

- `user_access` almacena el perfil vigente y la habilitación; no usa metadata
  editable por el usuario ni roles congelados en el JWT. El navegador no puede
  escribir esta tabla. Cada usuario puede leer su propio acceso; solo el
  Administrador lista las demás cuentas y sus correos con `list_user_access`.
- `requerirSesion(permiso)` valida identidad y perfil antes de leer datos o
  procesar una acción. Layout y navegación reflejan el perfil. Los enlaces y
  formularios de escritura se ocultan para Solo lectura; eso complementa las
  comprobaciones del servidor y la base.
- Las políticas restrictivas de RLS se combinan con AND con las reglas
  anteriores. Residentes exige permiso de escritura para INSERT/UPDATE;
  finanzas, empleados y consultas conservan sus RPC controladas. Cada RPC
  `security definer` autoriza antes de buscar registros, validar entrada o
  devolver resultados idempotentes. Las funciones invoker de residentes
  también autorizan al entrar y siguen sometidas a RLS.
- El CRM usa exclusivamente la clave publicable y la sesión, también para
  `consulta`. Se elimina `admin.ts` y la dependencia de la clave service_role.
  La landing externa conserva su INSERT existente; no se cambia su integración.
- Storage exige lectura para descargar y gestión para cargar comprobantes.
  Conserva carpeta por usuario/estadía/cuota, vinculación y prohibición de
  sobrescribir o borrar. Suspender bloquea incluso las cargas propias. Los
  enlaces de descarga ya emitidos conservan su vigencia máxima de 60 segundos;
  no se emiten otros después de suspender.
- `set_user_access` bloquea los cambios de permisos entre sí y comprueba de
  nuevo la autorización después de esperar. Usa versión exacta para impedir
  sobrescrituras y no permite suspender o degradar al último admin habilitado.
  Un admin puede cambiarse a sí mismo si queda otro habilitado.
- Las RPC de escritura mantienen un bloqueo compartido sobre el acceso del
  autor. Una revocación espera esas operaciones en curso; después de confirmar,
  los nuevos pedidos quedan denegados aunque usen el mismo JWT. No borra datos
  ya descargados ni interrumpe lecturas iniciadas antes de la revocación.
- `access_events` conserva antes/después, fecha y autor tomado de la sesión.
  Solo admin puede leerlo, nadie escribe directamente desde el cliente. La
  pantalla de historial completo queda pendiente junto a la auditoría general.

## Instalación y recuperación

Migración `20260914000000_user_access.sql`, transaccional y anterior al código:

1. Verificar la instalación y cantidad de cuentas de Auth. Con una sola, la
   migración conserva a ese titular como Administrador. Con más de una aborta
   sin cambios: requiere una migración de inicialización adaptada con la cuenta
   administrativa identificada, nunca elevar todas automáticamente.
2. En una instalación vacía no crea cuentas ni perfiles. Después de crear y
   verificar la primera cuenta, un operador de base asigna explícitamente su
   UUID a `user_access` como `admin` habilitado. No existe un bootstrap público.
3. Aplicar y registrar la migración en una transacción, comprobar RLS y que
   queda un Administrador habilitado; generar los tipos desde ese esquema.
4. Desplegar el CRM actualizado antes de incorporar cuentas adicionales. El
   código anterior conserva funcionamiento para el titular único, pero no es
   apto para convivir con cuentas restringidas porque leía consultas con una
   clave administrativa.
5. Recién entonces habilitar otros perfiles desde Accesos. Un campo secreto
   antiguo de Vercel puede retirarse del CRM después del despliegue; no retirar
   la credencial que usa la landing externa.

Para recuperar un error, conservar tablas, roles e historial y corregir con
otra migración o desplegar el último código compatible con roles. No restaurar
políticas permisivas ni volver al cliente administrativo. Una recuperación de
admin por SQL requiere acceso administrativo a la base y un UUID identificado;
el cliente nunca dispone de ese mecanismo. Si se vuelve a código anterior por
emergencia, suspender primero las cuentas adicionales y conservar al titular.

## Verificación

Pruebas pgTAP con cuentas ficticias cubren permisos de lectura y escritura,
autoelevación, cuentas pendientes, suspensión con el mismo JWT, Storage,
versiones, último admin y autoría. Pruebas concurrentes en GitHub comprueban dos
degradaciones simultáneas y una revocación durante una escritura. Pruebas de
aplicación cubren sesión antes de permisos, fallos cerrados, acciones y controles
de Solo lectura. TypeScript y pruebas dirigidas locales; suite completa, build,
generación de tipos y pruebas SQL en CI. Sin Docker local ni mutaciones de datos
reales para probar permisos.
