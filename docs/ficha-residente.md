# Ficha de consulta del residente

El nombre de la persona en Activos y Bajas abre
`/residentes/ficha/[residentId]`. La ficha conserva la identidad del residente
entre ingresos y permite consultar datos personales, todos sus contactos y el
historial de estadías. Cada estadía muestra fechas, habitación, cuota acordada,
vencimiento, observaciones y, si finalizó, fecha y motivo de baja. Enlaza a su
cuenta para consultar cuotas, pagos y comprobantes.

Los datos personales y contactos son los actuales y se comparten entre estadías;
no se presentan como una reconstrucción de cómo eran en cada ingreso. Los
cambios registrados desde la activación de Auditoría se consultan en esa sección
con perfil Administrador. La cuota acordada no representa una deuda: los saldos
se consultan en la cuenta de cada estadía.

Administrador, Gestión y Solo lectura pueden abrir la ficha. Solo los dos primeros
ven las acciones de edición/baja del ingreso activo o reingreso cuando ya no hay
una estadía abierta. Esas acciones reutilizan los flujos existentes, con sus
controles de permisos y estado en servidor y base. La ficha no escribe datos.

Contactos y estadías tienen paginación independiente de 50 filas y conteos
exactos. La navegación conserva la página de la otra sección. El ingreso activo
se consulta directamente, sin inferirlo a partir de una página de historial.
Todas las consultas usan sesión y RLS y filtran por la persona. No hay lecturas
por cada fila ni consultas con `service_role`. Los conteos y filas pueden cambiar
entre pedidos concurrentes; recargar actualiza la ficha.

Identificadores inválidos o personas inexistentes producen no encontrado. Un
error de lectura muestra un estado recuperable, nunca una ficha aparentemente
vacía. Los campos opcionales ausentes dicen «Sin registrar» y los textos se
renderizan escapados. Las tarjetas se adaptan a móvil sin tablas anchas.

No requiere migración ni cambios de permisos. Se verifica con TypeScript,
pruebas dirigidas de consultas y SSR con los tres perfiles y más de 1.000 filas
sintéticas. La suite completa y el build se ejecutan en GitHub CI, sin Docker
local. La gestión de contactos se describe en [familiares.md](familiares.md).
Documentación, salud y pertenencias se describen en [ficha-integral.md](ficha-integral.md).
