---
version: 1
slug: "src-app-app-page-tsx"
primary_target: "src/app/(app)/page.tsx"
related_targets: ["src/app/(app)/layout.tsx"]
---

# Inicio y shell de la aplicación

Alcance: rediseño completo del sistema interno (shell, Inicio y todas las secciones). Modo: Operate.

Audiencia y tarea: administración y recepción de una residencia geriátrica, en la PC de la oficina y en el celular durante el día; parte del equipo es mayor o tiene poca experiencia digital y trabaja con interrupciones. Tarea del Inicio: saber qué hay pendiente hoy e ir directo a resolverlo.

Restricciones: componentes web estándar, WCAG 2.2 AA, voseo rioplatense, nada se borra, horario argentino. No tocar lógica, datos ni permisos.

## Direction contract

THESIS: El sistema se lee como el piso de una casona porteña: cada cosa en su baldosa, separadas por juntas finas, y el avance de cada familia por el circuito de admisión se dibuja como una baldosa calcárea que se completa por cuartos. Rechaza el panel SaaS gris con tarjetas flotantes, sombras suaves y un acento esmeralda.

OWN-WORLD: Riel lateral verde inglés profundo con texto hueso; suelo de piedra calcárea gris verdoso claro; superficies blancas apenas cálidas unidas por juntas de 1px en lugar de sombras; esquinas casi rectas (4–6px); ocre de baldosa para lo pendiente y la selección; rojo óxido solo para lo vencido o crítico; carbón para el texto. Atkinson Hyperlegible Next para todo, cifras tabulares.

STORY: Al entrar, la persona ve la fecha y una sola próxima acción, luego lo pendiente agrupado en baldosas con su cantidad; entiende qué toca hoy sin leer todo y entra con un toque a resolverlo.

FIRST VIEWPORT: Riel verde fijo a la izquierda (marca, secciones con texto, rol abajo). Arriba del contenido, la fecha larga a escala grande y, a su lado, la próxima acción como botón primario verde. Debajo, un piso de cinco baldosas unidas por juntas (consultas sin llamar, visitas hoy, visitas mañana, cuotas vencidas, ingresos), cada una con su número grande tabular, su estado en color y sus primeras filas. En celular, el riel pasa a barra inferior y las baldosas se apilan.

FORM: Baldosas calcáreas de casona porteña, posición 3 de mi lista ordenada; seed key 85cf03fc. Movimiento distintivo: la baldosa de progreso (cuatro cuartos que se completan nueva → contactada → visita → ingresó; descartada queda en contorno).

RAISES: De Ikeda datamatics (declinado): rigor tabular, todas las cifras en columnas alineadas con números tabulares. De la señalética amarilla de aeropuerto (declinada): cada pantalla encabeza con una sola próxima decisión, en minúscula de oración, un mensaje por línea. Del catálogo Saville (declinado): un único elemento dominante por pantalla. Del muro de streaming (declinado): el ítem activo se destaca con claridad y el resto se aquieta.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
