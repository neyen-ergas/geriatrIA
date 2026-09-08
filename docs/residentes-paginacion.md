# Paginación de residentes

Activos e historial cargan páginas de 50. El total se calcula con una petición
HEAD con count exacto sobre admissions, filtrada por presencia o ausencia de
baja. El límite de 1.000 filas de la API no trunca el contador.

Activos se ordena por apellido, nombre e id en Postgres antes de paginar, con
la colación de la base. Historial usa baja, ingreso e id descendentes. El id
desempata incluso varias estadías de duración cero el mismo día.

El historial consulta para cada persona dos relaciones: un ingreso activo y la
última baja, con filtros, orden y límite ejecutados en la base. La habilitación
de Reingresar compara la fila contra esa última baja y exige ausencia de activo.
No depende de los residentes ni de las bajas presentes en la página visible.
El formulario usa el mismo orden para elegir la última estadía.

Se utilizan [relaciones y filtros anidados de PostgREST](https://docs.postgrest.org/en/v14/references/api/resource_embedding.html).
Las consultas usan el cliente autenticado y conservan las políticas existentes;
no hay migraciones ni nuevos permisos. Las restricciones de escritura y las
comprobaciones de la acción siguen protegiendo un reingreso concurrente.
El botón refleja la lectura actual, no reserva un derecho a reingresar.

La navegación mantiene Activos/Bajas y vuelve a la primera página al cambiar de
vista. Entradas inválidas se ajustan a la primera página y páginas fuera de rango
a la última. Un error de conteo muestra el error de carga, no un total falso.
Conteos y filas son lecturas separadas; no hay una instantánea entre navegaciones
si otro operador modifica datos.

## Validación y recuperación

Las pruebas usan el cliente real de Supabase contra una API HTTP simulada:
1.255 ingresos activos y 1.258 estadías cerradas, con empates y múltiples bajas
de una persona. Cubren totales, límites, orden, historial completo, ausencia de
duplicados, un activo fuera de las primeras 1.000 filas, y una última baja distinta
de la visible. También se comprobó la sintaxis de las relaciones mediante HEAD
sin devolver filas en la instalación de geriatrIA.

No se usa Docker local ni se escriben datos de producción. La suite y el build
corren en CI. Revertir el PR restaura el comportamiento anterior sin cambios de
base. Los controles de paginación y el cálculo de página se comparten con Admisión.
