# Empleados: ficha administrativa

Ficha exclusiva del perfil Administrador: nombre,
apellido, DNI, fecha de nacimiento opcional, teléfono, correo, puesto, fecha de
alta y observaciones. La baja requiere fecha y motivo; conserva la ficha como
solo consulta. El listado separa activos y bajas, con páginas de 50 personas.

`employees` tiene RLS de lectura para Administrador y no permite escrituras directas.
`save_employee` y `terminate_employee` exigen identidad, validan la versión y
serializan cambios de la misma ficha. Se conservan autor de alta, último autor
y fechas. No es todavía un historial completo de cada edición.

El DNI usa el mismo algoritmo normalizador que Residentes (puntos y espacios),
sin vincular ambas identidades. Es único incluso en bajas. Alta y baja no
admiten futuro; nacimiento no puede ser posterior al alta ni baja anterior a
ella. No hay eliminación, reapertura ni recontratación en esta entrega: estas
últimas necesitan modelar períodos laborales sin sobrescribir una baja.

La ficha no crea una cuenta, invita usuarios ni habilita acceso al sistema.
La sección Cuenta de acceso permite vincular una cuenta existente con perfil
asignado. La baja exige suspenderla previamente y conserva esa asociación.
Ver [cuentas-empleados.md](cuentas-empleados.md) para identidad y correcciones.
Salarios, turnos y documentos laborales siguen pendientes. Los perfiles se
administran por separado en Accesos; ver [permisos.md](permisos.md).

Migración aditiva `20260913000000_manage_employees.sql`, antes de la interfaz.
No modifica residentes, consultas ni cuentas de Auth. Para volver al código
anterior, conservar las fichas y la migración; corregir con otra migración.
Pruebas solo con datos ficticios en CI, sin Docker local.

Cada pantalla y acción verifica sesión antes de consultar. Listados con conteo
exacto y orden por apellido, nombre e id; no descargan todas las personas para
contar. El detalle ofrece edición y baja solo mientras la ficha sigue activa.
Errores de carga permiten recargar; errores de escritura conservan el formulario
y no reintentan ni muestran mensajes internos. Una respuesta perdida requiere
revisar la ficha antes de reenviar, también al registrar un alta.

La verificación incluye datos por encima de mil empleados, permisos SQL, errores
por campo y dos sesiones simultáneas: la baja con una versión anterior espera
la edición y se rechaza sin sobrescribirla.
