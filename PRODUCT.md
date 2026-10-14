# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

El equipo de una residencia geriátrica. Ni las familias ni los residentes
acceden al sistema.

- **Administración y recepción:** atienden las consultas que llegan desde la web,
  llaman a las familias, agendan visitas, dan de alta ingresos y registran cuotas
  y pagos. Trabajan sobre todo en la computadora de la oficina.
- **Dueños o dirección:** miran qué hay pendiente, el estado de las cuentas y del
  personal. Administran empleados, turnos, accesos y entrevistas de admisión.
- **Uso en el celular durante el día:** el mismo equipo retoma tareas desde el
  teléfono mientras recorre la residencia, habla con familias o cobra.

Tres roles con permisos distintos: Administrador (todo), Gestión (operación
diaria) y Solo lectura (consulta sin cambios). Empleados, Turnos, Accesos,
Entrevistas y Auditoría son exclusivas del Administrador.

## Product Purpose

Sistema de gestión interno que acompaña el recorrido completo de una persona por
la residencia: la consulta que deja su familia en la web, la visita presencial,
el ingreso, la estadía (cuotas, pagos, turnos del personal, ficha clínica y
documentación) y la baja.

Éxito: el equipo sabe en todo momento qué hay pendiente hoy, ninguna consulta ni
cuota se pierde, y la historia de cada residente queda completa y confiable sin
papeles.

## Positioning

Pensado desde el circuito real de una residencia argentina, no como un sistema
genérico: la familia no reserva turnos (indica cuándo la pueden llamar y el
equipo agenda), una consulta nunca se borra sino que se descarta, y la persona
está separada de sus estadías para que una baja o un reingreso no pierdan
historia. Las reglas que no pueden fallar (un turno por franja, un solo ingreso
activo) las garantiza la base de datos aunque dos personas trabajen a la vez.

## Operating Context

- Circuito: consulta → llamado → visita agendada → ingreso → estadía → baja.
- Las consultas entran desde la landing de la residencia, que escribe en la
  tabla `consulta`.
- El trabajo se hace entre otras tareas: teléfono, familias, urgencias. Las
  pantallas se leen de un vistazo y se retoman a mitad de camino.
- Varias personas pueden estar operando al mismo tiempo; los conflictos se
  avisan en lugar de pisar cambios.
- Fechas y horarios siempre en hora de Argentina.

## Capabilities and Constraints

- Secciones: Inicio (panel del día), Admisión (bandeja y agenda de visitas),
  Residentes (ficha, familiares, ingresos, bajas, reingresos, registros
  clínicos y documentos), Contabilidad (cuotas, pagos, vencimientos,
  comprobantes), Empleados, Turnos, Entrevistas, Accesos y Auditoría.
- Nada se elimina: se descarta, se da de baja o se anula, y queda auditado.
- Documentos y comprobantes en almacenamiento privado, con enlaces de descarga
  temporales.
- Cada residencia tiene su propia instalación (su propio proyecto de Supabase);
  el código es el mismo para todas.
- Next.js 15, React 19, Tailwind CSS 4 y componentes propios estilo shadcn/ui en
  `src/components/ui.tsx`. Íconos de lucide-react.
- Hoy lo usa una residencia; la intención es ofrecerlo después a otras. **Sin
  decidir:** cómo conviven la marca geriatrIA y la de cada residencia en la
  interfaz.
- **Sin decidir:** el "IA" del nombre no corresponde a ninguna función actual de
  inteligencia artificial; no se debe prometer ni sugerir una. La descripción de
  metadatos ("Registro de medicación sin papel") no refleja el alcance actual.

## Brand Commitments

- Nombre del producto: **geriatrIA**.
- Idioma: español rioplatense con voseo ("Volvé a cargar", "Intentá
  nuevamente"), en todos los textos visibles. Ver `CODESTYLE.md`.
- Mensajes claros y sin culpa para el usuario; nunca se muestran detalles
  internos ni identificadores técnicos en los errores.

## Evidence on Hand

- Documentación funcional: `README.md`, `SPECS.md`, `ROADMAP.md` y `docs/`.
- No hay testimonios, clientes, métricas de uso ni casos publicados. No se deben
  inventar.

## Product Principles

1. **Lo pendiente primero.** Cada pantalla responde qué hay que hacer ahora y
   lleva directo a donde se resuelve.
2. **Obvio para quien recién empieza.** Parte del equipo tiene poca experiencia
   digital: acciones con nombre claro, un camino principal por pantalla y
   errores que dicen qué hacer a continuación.
3. **Se lee de un vistazo, se retoma sin perderse.** Pensado para usarse con
   apuro y con interrupciones, en la computadora y en el celular.
4. **La historia nunca se pierde.** Nada se borra; cada cambio queda registrado y
   se puede reconstruir.
5. **Confiable con varias personas a la vez.** El sistema avisa los conflictos
   en lugar de sobrescribir el trabajo de otro.

## Accessibility & Inclusion

- WCAG 2.2 AA como mínimo.
- Hay usuarios mayores: texto legible sin zoom, contraste alto, objetivos
  táctiles amplios en el celular.
- Poca experiencia digital: no depender de íconos sin texto, gestos ocultos ni
  atajos como única forma de hacer algo.
- Uso con apuro: estados y prioridades visibles sin tener que leer todo; el
  progreso de un formulario no se pierde ante una interrupción.
