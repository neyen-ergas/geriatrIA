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

La migración es aditiva y debe aplicarse antes del despliegue de la interfaz.
No transforma datos previos. Para volver al código anterior conservar la tabla
y sus vínculos; corregir mediante otra migración, sin eliminar estadías.
