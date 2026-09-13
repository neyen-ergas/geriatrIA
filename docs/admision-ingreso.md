# Conversión de consulta en ingreso

La consulta se vincula a una única estadía mediante `consultation_admissions`.
`convert_consultation_admission` bloquea la consulta, verifica su versión y
registra persona/contacto/estadía, vínculo y cierre de visita en una transacción.
Si ya existe un vínculo, devuelve la estadía anterior sin repetir escrituras.

Se permite convertir consultas con visita agendada y consultas históricas en
estado ingreso sin vínculo. No se inventan relaciones para el historial previo.
Una persona nueva usa el alta existente; una persona identificada por DNI usa
su ficha y contactos, y abre otra estadía si no tiene un ingreso activo. El
reingreso no puede ser anterior a la última baja. Los controles existentes de
fechas, DNI y superposición siguen aplicándose.

Los vínculos conservan usuario y momento de conversión y no se editan ni borran
desde el cliente. Una consulta vinculada no vuelve a un estado anterior; la
baja se gestiona en Residentes. Las notas siguen editables.

La tarjeta ofrece «Registrar ingreso» para visitas agendadas o ingresos previos
sin vínculo. El formulario precarga nombre y teléfono del contacto de la
consulta; pide revisar nombre/apellido y completar los datos de la persona.
La búsqueda por DNI normalizado recupera la ficha para reingresar, conservando
identidad y contactos. Una ficha con estadía activa no permite un nuevo ingreso.
Al confirmar se abre la cuenta de la estadía; luego la tarjeta muestra «Ver
cuenta del ingreso». Ante una respuesta incierta, volver a abrir la consulta
permite recuperar ese vínculo antes de reenviar. No hay reintentos automáticos.

Las lecturas del vínculo usan el cliente autenticado y solo los ids de la
página actual. La consulta original mantiene su lectura administrativa en el
servidor, detrás de sesión, como el resto de Admisión. La política de lectura
del vínculo corresponde a los perfiles operativos. La conversión exige Gestión
o Administrador; ver [permisos.md](permisos.md).

Validación: pruebas de acciones para sesión, versión, recuperación y errores;
SQL para reversión completa, reingreso y protección del vínculo; dos conexiones
simultáneas en la base aislada de CI verifican una sola estadía, persona,
contacto y evento de cierre. Las pruebas SQL no se ejecutan contra datos reales.

La migración es aditiva y debe aplicarse antes del despliegue de la interfaz.
No transforma datos previos. Para volver al código anterior conservar la tabla
y sus vínculos; corregir mediante otra migración, sin eliminar estadías.
