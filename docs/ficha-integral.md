# Documentación, salud y pertenencias del residente

La ficha ofrece cinco apartados, con consulta paginada para los tres perfiles.
Administrador y Gestión pueden agregar, editar y archivar con motivo; Solo lectura
consulta y descarga documentos. Los contactos continúan en la misma ficha.

## Alcance funcional

| Apartado             | Datos y comportamiento                                                                                                                                                                     |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Documentos           | Título, tipo, fecha opcional, observaciones y archivo privado JPG/PNG/PDF de hasta 3 MiB. No es obligatorio tener documentos para registrar un ingreso.                                    |
| Indicaciones médicas | Título, texto de la indicación, profesional e inicio/fin de vigencia.                                                                                                                      |
| Medicación           | Nombre, dosis/vía, frecuencia, horarios o pauta, profesional, vigencia y observaciones. Transcripción de la indicación profesional, sin cálculos de dosis ni registro de administraciones. |
| Cuidados especiales  | Alimentación, alergias, movilidad o cuidados especiales, con texto descriptivo.                                                                                                            |
| Pertenencias         | Descripción, cantidad entera, recepción y devolución, observaciones y estadía de origen. Se agregan desde la estadía elegida en la ficha.                                                  |

La vigencia médica incluye ambos extremos: antes del inicio se muestra Programado;
entre inicio y fin, Vigente; después del fin, Vigencia finalizada. Un fin vacío
indica vigencia abierta. No se interpreta ni valida clínicamente el contenido de
una pauta, ni se infieren medicamentos, frecuencias o profesionales.

Archivar conserva el registro y su motivo como solo de consulta. La pestaña
Sin archivar incluye registros cuya vigencia terminó, para permitir revisar su
historia sin hacerlos pasar por vigentes. Archivados es una selección separada.
Las pertenencias devueltas permanecen visibles con estado Devuelto. No se elimina
ningún registro, no se reasigna una pertenencia a otra estadía y no se reemplaza
el archivo original de un documento: una nueva imagen requiere otro documento.

## Modelo y garantías

`20260914040000_resident_records.sql` crea `resident_documents`,
`medical_indications`, `medications`, `special_needs` e `inventory_items`, con
`resident_id`, autor/fecha de creación y edición, versión y archivo con motivo.
Las fechas médicas y de devolución son coherentes; la cantidad es un entero
positivo; la recepción debe ser posterior o igual al ingreso y recepción/devolución
no pueden estar en el futuro. La estadía debe pertenecer al mismo residente.

RLS habilita lectura por `operational.read`. Se retiran escrituras directas de
clientes y `service_role`. `save_resident_record` exige `operational.write` antes
de leer, usa bloqueos persona → registro y comprueba versión exacta. Las tablas y
campos permitidos proceden de una lista cerrada interna; se rechazan campos de
metadatos enviados por el cliente. El SQL dinámico usa identificadores escapados
y parámetros de valores, nunca fragmentos aportados por el usuario.

Una edición o archivo simultáneo invalida el otro formulario; no se reintenta.
Cada formulario nuevo recibe un UUID: reenviarlo no crea otro registro. Si una
respuesta fue incierta, se debe revisar el listado antes de reabrir un alta.
Registros archivados son inmutables desde la RPC, también si se conoce su versión.
Las cinco tablas se incorporan a Auditoría con campos explícitos y referencias
del residente. El evento se confirma o revierte junto con la escritura.

Los listados filtran persona y estado en la base, con conteos exactos y páginas de
50 filas. No se truncan historiales a 1.000 ni se usan clientes administrativos.
Las lecturas no forman una única instantánea entre consultas; recargar refleja
cambios concurrentes. Las rutas verifican sesión, sección y pertenencia.

## Archivos privados

El bucket `resident-documents` no es público. Cada ruta tiene
`usuario/residente/archivo-aleatorio.ext`; solo quien sube puede registrar esa
carga. Se comprueban residencia, existencia del objeto y unicidad de la ruta.
Otro usuario operativo puede leerlo una vez registrado. Un archivo sin registrar
solo es legible por su autor operativo. Las políticas no conceden sobrescritura
ni eliminación, y Solo lectura no puede subir.

La aplicación verifica tamaño, tipo y firma inicial de JPG/PNG/PDF antes de subir.
Esto no es análisis antivirus. La base/Storage limitan tamaño y MIME; un cliente
que use Storage directamente no pasa por la validación de firma de la aplicación.
El nombre original no se incorpora a las rutas. La descarga valida pertenencia,
genera una URL firmada por 60 segundos y responde sin caché ni referrer. Una URL
ya emitida puede seguir funcionando hasta vencer después de revocar el acceso.

Storage y Postgres no comparten una transacción: si la subida termina pero falla
el registro, puede quedar una carga privada sin asociar. No se borra automáticamente
para evitar retirar un archivo cuyo guardado se confirmó con respuesta incierta.
La limpieza administrativa debe comparar rutas registradas y antigüedad antes de
retirar objetos; no se incluyen borrados automáticos en esta entrega.

## Despliegue y verificación

Aplicar y registrar la migración antes del código. Es aditiva, no escribe registros
personales preexistentes, mantiene los triggers de auditoría anteriores y suma
cinco nuevos. Incluir metadatos y objetos de Storage en el procedimiento de backup;
un backup de Postgres por sí solo no recupera los archivos binarios.

Revertir la interfaz conserva los datos y el esquema. Si falla una regla, usar
una migración correctiva que preserve permisos, historial y archivos. No eliminar
tablas o buckets como recuperación.

Validaciones locales dirigidas de formularios, permisos, vigencias, paginación,
archivos y SSR. GitHub corre suite completa, build, pgTAP con datos ficticios y
concurrencia entre edición/archivo en ambos órdenes. Las pruebas SQL nunca se
ejecutan sobre datos de residentes reales. Sin Docker local.
