# Gestión de familiares y contactos

Desde la ficha del residente, Administrador y Gestión pueden agregar contactos
y editar los existentes, incluido el contacto inicial. Se registran nombre,
apellido, parentesco o vínculo, teléfono, indicación de contacto de emergencia,
responsabilidad de pago y observaciones opcionales. Los cuatro textos de
identificación/contacto son obligatorios; las responsabilidades son independientes
y puede haber varias personas con cada función. No se imponen exclusividades
ni se exige marcar alguna de ellas.

Los contactos pertenecen a la persona y se conservan entre estadías. También se
pueden actualizar sin un ingreso activo. Solo lectura mantiene la consulta de
los contactos, sin acceso a páginas de edición ni permiso de escritura en la
base. No hay eliminación ni cambio de residente asociado desde estos formularios.

## Escritura y versiones

`save_family_contact` exige `operational.write` antes de leer o bloquear filas.
Comprueba la persona y la pertenencia del contacto, y toma los bloqueos en orden
persona → contacto, igual que la edición del ingreso. La edición exige el
`updated_at` leído al abrir el formulario, conservado con sus microsegundos.
El trigger de contactos produce versiones estrictamente crecientes, incluso
para dos cambios dentro de la misma transacción. También conserva `created_at`
para mantener la selección del contacto inicial.

Al abrir un alta se genera un UUID, sin crear filas. Reenviar ese mismo formulario
con los mismos valores después de un alta confirmada devuelve el contacto ya
creado. No duplica filas ni eventos de auditoría. Abrir dos formularios nuevos
genera identificadores distintos: no se deducen identidades por nombre o teléfono.

La edición del ingreso existente envía ahora `p_expected_contact_updated_at`.
Si otro operador modificó el contacto inicial desde cualquiera de las dos
pantallas, el guardado viejo falla con `contact_changed` y revierte también los
otros cambios de ese ingreso. El operador conserva lo escrito y debe volver a
abrir la ficha para revisar la versión actual. No hay reintento automático.
Esta protección cubre el contacto; no agrega control de versión a los demás
campos del formulario de ingreso. El DML directo anterior continúa bajo RLS;
un operador con permiso de escritura directa no queda sujeto a presentar una
versión, aunque su cambio sí incrementa el reloj e invalida formularios abiertos.

Auditoría captura las altas y ediciones confirmadas con la identidad de la sesión
y valores anteriores/nuevos. Los intentos fallidos se revierten y no crean eventos.
No se agregan columnas personales ni se modifica la estructura de la auditoría.

## Despliegue

Aplicar `20260914030000_manage_family_contacts.sql` y registrar su versión antes
de desplegar la interfaz. Reemplaza la firma de `update_active_admission` por una
con la versión del contacto como argumento opcional a nivel de SQL pero obligatorio
para cambiar sus datos. No quedan sobrecargas ambiguas.

Entre la migración y el despliegue, el código anterior puede consultar, dar altas
y editar ingresos si conserva exactamente los datos actuales del contacto. Para
modificar el contacto debe enviar su versión: de lo contrario falla sin guardar
parcialmente. Las pestañas antiguas deben recargarse después de desplegar. Esta
protección impide sobrescrituras silenciosas. Los flujos de
baja, reingreso y contabilidad conservan sus contratos. Ante un problema, usar
una corrección que conserve la comprobación de versión; no restaurar un cliente
antiguo como solución para las ediciones.

Pruebas pgTAP cubren permisos, normalización, idempotencia, pertenencia, versiones,
ambos formularios y auditoría. CI prueba además dos conexiones simultáneas en
ambos órdenes (ficha primero e ingreso primero), con rechazo del segundo
formulario y un solo evento confirmado. Las pruebas de aplicación cubren sesión
previa, campos, preservación de datos, errores seguros, consultas filtradas y SSR.
Datos ficticios únicamente; sin Docker local. No requiere tocar contactos reales
para validar o desplegar.
