---
name: geriatrIA
description: Sistema interno de una residencia geriátrica, leído como el piso de una casona porteña.
colors:
  white: "oklch(0.995 0.002 120)"
  piedra-50: "oklch(0.977 0.004 140)"
  piedra-100: "oklch(0.953 0.006 140)"
  piedra-200: "oklch(0.905 0.009 142)"
  piedra-300: "oklch(0.845 0.011 145)"
  piedra-500: "oklch(0.52 0.014 150)"
  piedra-600: "oklch(0.44 0.015 152)"
  piedra-700: "oklch(0.37 0.015 155)"
  piedra-900: "oklch(0.22 0.011 160)"
  piedra-950: "oklch(0.16 0.009 160)"
  casona-50: "oklch(0.966 0.018 158)"
  casona-100: "oklch(0.928 0.036 158)"
  casona-300: "oklch(0.765 0.075 158)"
  casona-700: "oklch(0.39 0.073 161)"
  casona-800: "oklch(0.325 0.06 162)"
  casona-900: "oklch(0.265 0.048 164)"
  casona-950: "oklch(0.205 0.038 165)"
  ocre-50: "oklch(0.975 0.025 88)"
  ocre-100: "oklch(0.943 0.055 86)"
  ocre-200: "oklch(0.895 0.095 84)"
  ocre-300: "oklch(0.835 0.125 80)"
  ocre-400: "oklch(0.775 0.143 75)"
  ocre-500: "oklch(0.71 0.146 70)"
  ocre-800: "oklch(0.435 0.095 58)"
  ocre-950: "oklch(0.265 0.055 55)"
  oxido-50: "oklch(0.972 0.016 30)"
  oxido-200: "oklch(0.872 0.068 32)"
  oxido-600: "oklch(0.53 0.163 35)"
  oxido-700: "oklch(0.465 0.145 34)"
  oxido-800: "oklch(0.4 0.12 33)"
  cobalto-50: "oklch(0.97 0.014 250)"
  cobalto-200: "oklch(0.87 0.052 252)"
  cobalto-800: "oklch(0.35 0.1 263)"
typography:
  display:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 700
    lineHeight: 1
  headline:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 700
    lineHeight: 1.2
  numeral:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "tnum"
  title:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.556
  body:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Atkinson Hyperlegible Next, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.429
rounded:
  sm: "4px"
  md: "6px"
spacing:
  junta: "1px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.casona-700}"
    textColor: "{colors.white}"
    typography: "{typography.label}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.casona-800}"
  button-outline:
    backgroundColor: "{colors.white}"
    textColor: "{colors.piedra-900}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-outline-hover:
    backgroundColor: "{colors.piedra-50}"
  button-danger:
    backgroundColor: "{colors.oxido-700}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: "0 16px"
    height: "44px"
  button-ghost-hover:
    backgroundColor: "{colors.piedra-200}"
    textColor: "{colors.piedra-950}"
  boton-proxima-accion:
    backgroundColor: "{colors.ocre-300}"
    textColor: "{colors.casona-950}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "48px"
  banda-proxima-accion:
    backgroundColor: "{colors.casona-900}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: "24px"
  card:
    backgroundColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: "20px"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.piedra-950}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "44px"
  badge-nueva:
    backgroundColor: "{colors.ocre-100}"
    textColor: "{colors.ocre-950}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-contactada:
    backgroundColor: "{colors.cobalto-50}"
    textColor: "{colors.cobalto-800}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  badge-ingreso:
    backgroundColor: "{colors.casona-700}"
    textColor: "{colors.white}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
  nav-riel:
    backgroundColor: "{colors.casona-900}"
    textColor: "{colors.casona-50}"
    width: "256px"
  nav-item-activo:
    backgroundColor: "{colors.ocre-300}"
    textColor: "{colors.casona-950}"
    rounded: "{rounded.md}"
    height: "44px"
  filtro-activo:
    backgroundColor: "{colors.ocre-300}"
    textColor: "{colors.casona-950}"
    rounded: "{rounded.md}"
    height: "44px"
---

# Design System: geriatrIA

## Overview

**Creative North Star: "El piso de la casona"**

La aplicación se lee como el piso de una casona porteña: un suelo de piedra calcárea gris verdoso, sobre el que cada cosa ocupa su baldosa blanca, separada de la vecina por una junta fina de 1px. A la izquierda corre un riel verde inglés profundo con texto hueso; arriba del contenido, cada pantalla encabeza con una sola próxima decisión. El avance de cada familia por el circuito de admisión se dibuja como una baldosa calcárea que se completa por cuartos.

La densidad es de oficina, pero pensada para un equipo con parte de sus integrantes mayores: tipografía Atkinson Hyperlegible Next en todo, base de 16px que respeta el zoom, objetivos táctiles de 44px como mínimo, etiquetas en minúscula de oración y cifras tabulares. El color dice estado, no decora: ocre para lo pendiente y la selección, óxido solo para lo vencido o crítico, cobalto para lo informativo, verde para la acción principal y lo resuelto.

El sistema rechaza el panel SaaS gris de tarjetas flotantes con sombras suaves y acento esmeralda. Por eso la paleta por defecto de Tailwind está anulada (`--color-*: initial`): ninguna pantalla puede volver por costumbre a los grises y verdes genéricos.

**Key Characteristics:**

- Suelo de piedra, superficies blancas, juntas de 1px en lugar de sombras.
- Riel verde inglés a la izquierda en escritorio; barra inferior verde en el celular.
- Ocre como única marca de "estás acá" y "esto espera".
- Esquinas casi rectas (4–6px).
- Una sola tipografía, Atkinson Hyperlegible Next, con cifras tabulares.
- La baldosa de progreso como firma: cuatro cuartos, nueva → contactada → visita → ingresó.

## Colors

Cinco familias propias, en OKLCH, con once pasos cada una (50–950) en `src/app/globals.css`; el frontmatter recoge los pasos que la app usa de forma reiterada.

### Primary

- **Verde casona** (`casona-700`): relleno de la acción principal de cada pantalla, del botón "Llamar" cuando la consulta espera un llamado, del estado "Ingresó" y del anillo de foco, el cursor de texto y el `accent-color`. `casona-800` es su hover y su borde; `casona-800` también es el color de los enlaces de texto ("Abrir", "Ver cuenta del ingreso").
- **Verde riel** (`casona-900`): el riel lateral, la barra inferior del celular y la banda de la próxima acción en Inicio. `casona-950` es el texto sobre ocre y el fondo de la marca.
- **Verde lavado** (`casona-50`, `casona-100`): fondos de lo agendado y lo resuelto (visita en la agenda, hover de enlaces "Abrir"). `casona-300` y `casona-200` son texto secundario sobre el riel.

### Secondary

- **Ocre de baldosa** (`ocre-300`): ítem activo del riel y de la barra inferior, filtro activo, marca "Hoy" en agenda y turnos, botón de la próxima acción sobre la banda verde, y el "IA" de la marca. `ocre-200` es el resaltado de selección de texto y el hover del botón de próxima acción.
- **Ocre pendiente** (`ocre-100` fondo, `ocre-400` borde, `ocre-950`/`ocre-800` texto): avisos de algo que falta hacer (cuotas sin crear), la insignia "Nueva" y la cantidad de consultas sin llamar. `ocre-500` rellena los cuartos de la baldosa de progreso; `ocre-50` tiñe la columna del día actual.

### Tertiary

- **Rojo óxido** (`oxido-700`): cantidad de cuotas vencidas, mensajes de error de carga y el botón destructivo. `oxido-600` es el texto de error de formularios y el borde de `aria-invalid`; `oxido-50` y `oxido-200` son fondo y borde de los avisos críticos; `oxido-800` es el texto de "Descartar" y el hover de "Cerrar sesión".
- **Cobalto** (`cobalto-50` fondo, `cobalto-200` borde, `cobalto-800` texto): estados intermedios e informativos, como "Contactada", los turnos de tarde y noche y los grados de dependencia en entrevistas.

### Neutral

- **Piedra suelo** (`piedra-100`): el fondo de la app, de la topbar en escritorio y de los botones secundarios.
- **Blanco cálido** (`white`): toda superficie de trabajo (baldosas, tarjetas, campos, tablas).
- **Junta** (`piedra-200`): bordes de tarjeta, divisores de fila y el fondo que asoma entre baldosas. `piedra-500` es el borde de los campos (contraste 3:1 sobre blanco) y `piedra-300` el de los botones de contorno; `piedra-50` es la baldosa secundaria (accesos rápidos, encabezados de tabla, hover de fila).
- **Carbón** (`piedra-950` títulos, `piedra-900` texto, `piedra-700` bajadas, `piedra-600` detalle secundario, `piedra-500` metadatos y placeholder). `piedra-500` es el tono más claro permitido para texto: mide 5,4:1 sobre blanco y 4,8:1 sobre `piedra-100`.

### Named Rules

**La regla del óxido.** El óxido marca solo lo vencido, lo crítico, los errores y la acción destructiva. Nunca decora ni distingue categorías.

**La regla del ocre.** El ocre dice "estás acá" (ítem activo, filtro activo, hoy, selección) o "esto espera" (pendiente). No se usa para nada más.

**La regla del verde único.** En cada pantalla hay un solo relleno `casona-700` dominante: la acción principal. Las demás acciones van en contorno o como enlace.

**La regla de la paleta cerrada.** Solo existen piedra, casona, ocre, óxido y cobalto. Los nombres de color de Tailwind por defecto no compilan y no deben reintroducirse.

## Typography

- **Display Font:** Atkinson Hyperlegible Next (con `ui-sans-serif, system-ui`)
- **Body Font:** Atkinson Hyperlegible Next
- **Label/Mono Font:** la misma; las cifras usan `tabular-nums`

**Character:** Una sola familia, diseñada para baja visión, que distingue 1/l/I y 0/O. La jerarquía sale del tamaño y el peso (600 y 700), no de cambiar de familia ni de usar mayúsculas.

### Hierarchy

- **Display** (700, 2,25rem en celular a 3rem desde `sm`, interlineado 1): solo la fecha larga de Inicio ("Hoy, miércoles, 14 de octubre").
- **Headline** (700, 1,875rem, 1,2): título de cada sección (Admisión, Turnos del personal) y el título de las pantallas de acceso. La próxima acción de Inicio usa 1,5rem a 1,875rem.
- **Numeral** (700, 2,25rem, interlineado 1, tabular): la cantidad de cada baldosa de Inicio, coloreada según su tono (ocre-800 pendiente, óxido-700 crítico, casona-700 agenda, piedra-800 neutro). Las tarjetas de estadística usan 1,875rem.
- **Title** (700, 1,125rem): nombre de cada baldosa y de cada consulta; 1,25rem para títulos de bloque como "Resumen del día".
- **Body** (400, 1rem, 1,5): texto corriente, mensajes de familias (con `leading-relaxed` y un ancho máximo de 70ch), avisos y errores de carga.
- **Label** (600, 0,875rem): etiquetas de campo en `piedra-800`, grupos del riel en `casona-300`, encabezados de tabla. Los textos de apoyo comparten el tamaño con peso 400.

Botones y enlaces de acción van en 600 a 0,9375rem–1rem; las insignias, en 600 a 0,8125rem, que es el tamaño mínimo de texto en uso.

### Named Rules

**La regla de la minúscula de oración.** Etiquetas, grupos, botones e insignias van en minúscula de oración. No hay versalitas, mayúsculas sostenidas ni tracking abierto en ninguna parte del sistema.

**La regla de las cifras tabulares.** Toda cantidad, contador o importe que se compare con otros lleva `tabular-nums`.

## Layout

En escritorio (desde 1024px) la app es un riel fijo de 256px a la izquierda, a toda la altura, y una columna de contenido con una topbar de 64px sobre el suelo de piedra. El contenido se centra con un ancho máximo de 72rem (1152px) y márgenes laterales de 16px, 24px desde 640px y 32px desde 1024px. Las secciones de una pantalla se apilan cada 24px.

Debajo de 1024px el riel desaparece: la topbar se vuelve blanca con la marca sobre una pastilla verde, y la navegación pasa a una barra inferior fija de cuatro destinos más "Más", con ícono y nombre, alto mínimo de 56px y respeto por el área segura. El contenido deja 112px abajo para no quedar tapado.

El piso de baldosas es la grilla característica: un contenedor con borde `piedra-200` y fondo `piedra-200`, con espacio de 1px entre celdas blancas, de modo que la junta es el fondo que asoma. En Inicio pasa de una columna a dos desde 768px y a tres desde 1280px; la bandeja de Admisión es una lista en una columna con la misma junta; la agenda semanal usa 2, 4 y 7 columnas en 640, 1024 y 1536px. Cada baldosa lleva 20px de relleno interior. Los grupos de botones y filtros se separan cada 8px.

## Elevation & Depth

El sistema es plano. La profundidad se arma con tono y junta: suelo `piedra-100`, superficie blanca, borde o espacio de 1px en `piedra-200`, y fondos `piedra-50` para lo secundario. Ninguna tarjeta, baldosa ni botón lleva sombra en reposo ni en hover.

### Shadow Vocabulary

- **Capa flotante** (`box-shadow: 0 12px 32px -8px oklch(0.2 0.04 165 / 0.35)`): solo para lo que flota sobre otra capa, como el menú "Más" de la barra inferior. La sombra va teñida del verde del riel, no en negro.

### Named Rules

**La regla de la junta.** Dos superficies se separan con una línea de 1px o con el suelo que asoma entre ellas, nunca con una sombra.

## Shapes

Esquinas casi rectas: 6px (`rounded-md`) para tarjetas, campos, botones, filtros, bandas e ítems de navegación; 4px (`rounded-sm`) para insignias, marcas "Hoy" y los pasos del circuito. Los bordes son de 1px, sólidos; las celdas libres de agenda y turnos usan borde punteado `piedra-300` para leerse como un lugar vacío que se puede ocupar. La baldosa y la marca dibujan sus propias esquinas a 2–3px sobre un lienzo de 40×40.

## Components

### Buttons

- **Shape:** esquinas casi rectas (6px), borde de 1px siempre presente, ícono a 8px del texto.
- **Primary:** relleno `casona-700`, borde `casona-800`, texto blanco en 600; alto mínimo de 44px y 16px de relleno lateral. Hover `casona-800`, activo `casona-900`.
- **Hover / Focus:** transición solo de color, en 150ms. Foco visible con anillo de 2px `casona-700` separado 2px del fondo. Deshabilitado al 50% de opacidad.
- **Outline:** fondo blanco, borde `piedra-300`, texto `piedra-900`; hover con borde `piedra-400` y fondo `piedra-50`. Es la variante para las acciones secundarias y los cambios de estado.
- **Secondary:** fondo `piedra-100`, borde `piedra-300`.
- **Danger:** relleno `oxido-700` con borde `oxido-800`, solo para acciones destructivas.
- **Ghost:** sin borde visible ni fondo; hover con `piedra-200` al 70%. "Cerrar sesión" pasa a `oxido-50` con texto `oxido-800` al hover.
- **Tamaños:** `sm` 36px, `md` 44px, `lg` 48px.

### Chips

- **Filtros de estado:** alto 44px, borde `piedra-200`, fondo blanco y texto `piedra-700` con la cantidad tabular en `piedra-600`. Activo en ocre: fondo `ocre-300`, borde `ocre-400`, texto `casona-950`.
- **Insignias de estado:** borde de 1px, 4px de radio, texto 600 a 0,8125rem; los colores vienen de `COLORES_ESTADO` (nueva en ocre, contactada en cobalto, visita agendada en contorno ocre sobre blanco, ingresó en relleno `casona-700`, descartada en piedra).

### Cards / Containers

- **Corner Style:** 6px.
- **Background:** blanco; `piedra-50` para la baldosa secundaria de accesos rápidos.
- **Shadow Strategy:** ninguna (ver Elevation & Depth).
- **Border:** 1px `piedra-200`.
- **Internal Padding:** 20px; 24px en el detalle de una consulta desde 640px.
- **Avisos:** pendiente con fondo `ocre-100` y borde `ocre-400`; crítico con `oxido-50` y `oxido-200`; agendado con `casona-50` y `casona-200`.

### Inputs / Fields

- **Style:** fondo blanco, borde 1px `piedra-500`, 6px de radio, 14px de relleno lateral, texto de 16px en `piedra-950`, placeholder `piedra-500`; alto mínimo de 44px (112px en áreas de texto). Hover con borde `piedra-700`.
- **Focus:** borde `casona-700` y anillo de 2px `casona-600` al 40%.
- **Error / Disabled:** `aria-invalid` cambia el borde a `oxido-600`; deshabilitado con fondo `piedra-100` y texto `piedra-500`. Las casillas y radios miden 20px y toman el verde por `accent-color`.

### Navigation

- **Riel:** fondo `casona-900`, marca en una franja de 64px con junta `casona-800`, grupos "Trabajo diario" y "Más secciones" con su título en `casona-300`, ítems de 44px con ícono de 20px y texto 600 a 1rem en `casona-50`. Hover `casona-800`. Activo en `ocre-300` con texto `casona-950`. Al pie, el rol de la sesión.
- **Barra inferior:** mismo verde, ítems apilados ícono sobre nombre a 0,8125rem, activo en ocre. "Más" abre una lista blanca flotante con ítems de 48px; el activo dentro de la lista va en `ocre-100`.
- **Topbar:** 64px, junta inferior `piedra-200`, solo la salida a la derecha en escritorio.

### Baldosa de progreso

Firma del sistema. Un cuadrado de 40×40 con cuatro hojas que forman una flor y cuatro triángulos en las esquinas; cada paso del circuito de admisión completa un cuarto en sentido horario. Los cuartos llenos van en `ocre-500` mientras el circuito sigue y pasan a `casona-600` al ingresar; los vacíos quedan en `piedra-100` con contorno `piedra-300`. Una consulta descartada conserva la baldosa en contorno punteado, sin relleno. Mide 28px en las filas, 36px en la bandeja y 56px en el detalle y la próxima acción. Siempre va acompañada del estado en texto o en `aria-label`. La marca geriatrIA es la misma baldosa completa en los colores del riel.

### Banda de la próxima acción

En Inicio, una banda `casona-900` de 6px de radio con la baldosa a la izquierda, la acción en 700 a 1,5–1,875rem en blanco, el detalle en `casona-100` y un botón ocre (`ocre-300`, texto `casona-950`, 48px) a la derecha. Toda la banda es un único enlace. Sin pendientes, la misma banda dice "Todo al día".

## Do's and Don'ts

### Do:

- **Do** separar superficies con juntas de 1px `piedra-200` y con el suelo que asoma en grillas de `gap-px`.
- **Do** reservar el relleno `casona-700` para la única acción principal de la pantalla.
- **Do** marcar lo activo, lo de hoy y lo pendiente con ocre, y lo vencido o crítico con óxido.
- **Do** dar a todo control un alto mínimo de 44px (36px solo en botones `sm` dentro de grillas densas).
- **Do** usar `tabular-nums` en cantidades, importes y horarios.
- **Do** acompañar cada baldosa de progreso con el estado escrito o en `aria-label`.
- **Do** usar el componente `Input`, `Select` o `Textarea` de `ui.tsx` para todo campo, con su foco verde.

### Don't:

- **Don't** poner sombras en tarjetas, baldosas o botones; la única sombra es la de capas flotantes, teñida de verde.
- **Don't** reintroducir la paleta por defecto de Tailwind ni grises o esmeraldas genéricos.
- **Don't** usar el óxido para decorar ni para categorías que no sean urgentes.
- **Don't** escribir etiquetas en mayúsculas sostenidas ni con tracking abierto.
- **Don't** redondear más de 6px las superficies de trabajo.
- **Don't** usar un tono más claro que `piedra-500` para texto.
