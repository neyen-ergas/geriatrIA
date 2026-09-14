# Cuentas vinculadas a empleados

Un Administrador puede vincular una cuenta existente con una ficha de empleado
desde Empleados → ficha → Cuenta de acceso. El selector ofrece cuentas con
perfil asignado y sin otro vínculo, incluidas las suspendidas. Accesos muestra
el nombre del empleado y un enlace de vuelta a la ficha.

La relación es opcional: el titular puede administrar sin tener una ficha
laboral. Cada cuenta tiene como máximo un empleado y cada empleado, una cuenta.
La elección es explícita; no se infiere identidad por correo o DNI. El correo
laboral sigue siendo un dato de contacto independiente del inicio de sesión.

## Operación

1. Crear la cuenta por el procedimiento administrativo de Supabase y asignarle
   un perfil desde Accesos. Puede permanecer suspendida mientras se prepara.
2. Abrir la ficha del empleado activo y elegir esa cuenta. Vincular conserva el
   perfil y la habilitación; no crea usuarios ni concede acceso adicional.
3. Antes de registrar una baja, suspender la cuenta vinculada desde Accesos.
   La base rechaza la baja mientras siga habilitada. Se conserva el vínculo
   suspendido y no se permite habilitarlo con una ficha dada de baja.
4. Para corregir una asociación equivocada, usar «Corregir vínculo» y
   «Desvincular cuenta». Eso separa identidades sin cambiar el perfil ni
   suspender/habilitar el acceso. Se registra el vínculo anterior. Después
   puede asignarse la cuenta a la ficha correcta, siempre que esté activa.

La protección del último Administrador sigue vigente: antes de suspender su
cuenta debe quedar otro habilitado. Las cuentas sin ficha conservan los mismos
permisos que ya tenían. La desvinculación es una corrección administrativa
explícita, también disponible para asociaciones históricas; no es un paso de
la baja ni edita los datos laborales de una ficha inactiva.

## Base y concurrencia

`20260914010000_link_employee_accounts.sql` agrega `user_access.employee_id`,
con FK restrictiva y restricción única. No completa vínculos existentes.
`employee_account_events` conserva cuenta, ficha anterior/nueva, fecha y autor;
solo Administrador puede leerlo y el cliente no puede escribirlo directamente.
El historial visual se consulta en [Auditoría](auditoria.md), sección Accesos y cuentas.

`set_employee_account` exige Administrador y la versión exacta del acceso,
rechaza cuentas sin perfil y evita reemplazar silenciosamente otra asociación.
Actualiza la versión compartida con Accesos: un cambio de perfil invalida un
formulario de vínculo anterior y viceversa. La desvinculación usa el mismo RPC.

Permisos, vínculo, edición y baja de empleados adquieren el mismo bloqueo de
transacción antes de comprobar permisos y tomar bloqueos de filas. Así una
baja simultánea con una vinculación o habilitación se resuelve en un orden
consistente. `validate_employee_account` impide asignar fichas inactivas o
habilitar cuentas vinculadas a ellas. `terminate_employee` comprueba que no
queda una cuenta habilitada para esa ficha antes de darla de baja.

Las lecturas usan la sesión y RLS. La cuenta puede leer su propio vínculo en
`user_access`, pero eso no le concede lectura de Empleados ni del historial.
Solo Administrador accede a la ficha y al listado de cuentas con su empleado.
No se crean credenciales ni se modifican filas de Auth al vincular.

## Despliegue y recuperación

Aplicar y registrar la migración antes del nuevo código. Las columnas nuevas de
`list_user_access` son adicionales y el código anterior las ignora. La relación
arranca vacía; se revisa cada identidad desde la interfaz, sin asignaciones
automáticas sobre datos reales. Regenerar tipos desde el esquema actualizado.

Para recuperar, conservar vínculos e historial y usar una migración correctiva.
El código anterior sigue operando con las restricciones nuevas, aunque no
muestra ni permite corregir vínculos. No retirar el control de baja ni habilitar
una cuenta asociada a una ficha inactiva como mecanismo de recuperación.

Pruebas pgTAP con datos ficticios cubren unicidad, perfiles, versión, baja,
rehabilitación, correcciones y auditoría. CI prueba además vínculo/baja y
habilitación/baja en ambos órdenes, con conexiones simultáneas. TypeScript y
pruebas dirigidas locales; suite completa, build, SQL y tipos generados en
GitHub. Sin Docker local ni cambios de identidad sobre datos reales para probar.
