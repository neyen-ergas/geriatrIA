# Empleados: ficha administrativa

Primera entrega para el perfil único actual (dueño/administrador): nombre,
apellido, DNI, fecha de nacimiento opcional, teléfono, correo, puesto, fecha de
alta y observaciones. La baja requiere fecha y motivo; conserva la ficha como
solo consulta. El listado separa activos y bajas, con páginas de 50 personas.

`employees` tiene RLS de lectura autenticada y no permite escrituras directas.
`save_employee` y `terminate_employee` exigen identidad, validan la versión y
serializan cambios de la misma ficha. Se conservan autor de alta, último autor
y fechas. No es todavía un historial completo de cada edición.

El DNI usa el mismo algoritmo normalizador que Residentes (puntos y espacios),
sin vincular ambas identidades. Es único incluso en bajas. Alta y baja no
admiten futuro; nacimiento no puede ser posterior al alta ni baja anterior a
ella. No hay eliminación, reapertura ni recontratación en esta entrega: estas
últimas necesitan modelar períodos laborales sin sobrescribir una baja.

La ficha no crea una cuenta, invita usuarios ni habilita acceso al sistema.
Roles, vínculo con Supabase Auth, salarios, turnos y documentos laborales siguen
pendientes. Antes de habilitar cuentas con distintas responsabilidades deben
implementarse los permisos de la fase 9. Las políticas actuales corresponden
exclusivamente al perfil único definido en SPECS.

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
