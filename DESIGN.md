---
name: LocaLisT
description: La lista de la compra de la familia, ordenada por pasillos, escrita en la pizarra de un puesto del mercado.
colors:
  board: "#1f3a2d"
  board-deep: "#16291f"
  chalk: "#f3f1e7"
  chalk-muted: "#bccabe"
  chalk-yellow: "#f2d45c"
  chalk-dust: "#e9eee9"
  row: "#ffffff"
  row-pressed: "#f1f5f1"
  ink: "#13201a"
  ink-muted: "#3f5247"
  done-ink: "#56685c"
  line: "#cad5cc"
  danger: "#a3261d"
  board-night: "#10201a"
  board-night-deep: "#0b1712"
  ground-night: "#16261e"
  row-night: "#1d3027"
  row-night-pressed: "#243a2f"
  done-ink-night: "#95a99b"
  line-night: "#2f4639"
  danger-night: "#ffb4a9"
typography:
  display:
    fontFamily: "ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.01em"
  title:
    fontFamily: "ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1rem"
    fontWeight: 800
    lineHeight: 1.4
  body:
    fontFamily: "ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  label:
    fontFamily: "ui-rounded, 'SF Pro Rounded', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 700
    lineHeight: 1.4
    fontFeature: "'tnum'"
rounded:
  sm: "10px"
  md: "14px"
  lg: "22px"
  full: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  row: "3.5rem"
components:
  button-primary:
    backgroundColor: "{colors.board}"
    textColor: "{colors.chalk}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "3.25rem"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "3.25rem"
  button-danger:
    backgroundColor: "transparent"
    textColor: "{colors.danger}"
    rounded: "{rounded.md}"
    padding: "0 20px"
    height: "3.25rem"
  input:
    backgroundColor: "{colors.row}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 14px"
    height: "3.25rem"
  list-row:
    backgroundColor: "{colors.row}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    height: "{spacing.row}"
  tab-bar:
    backgroundColor: "{colors.board}"
    textColor: "{colors.chalk-muted}"
    typography: "{typography.label}"
    height: "3.5rem"
  route-stop:
    backgroundColor: "transparent"
    textColor: "{colors.chalk}"
    rounded: "{rounded.full}"
    size: "2.75rem"
  route-stop-next:
    backgroundColor: "{colors.chalk-yellow}"
    textColor: "{colors.ink}"
    rounded: "{rounded.full}"
    size: "2.75rem"
---

# Design System: LocaLisT

## Overview

**Creative North Star: "La pizarra de Vegueta"**

La lista es la pizarra de un puesto del Mercado de Vegueta: un tablero verde, palabras en tiza y, cuando algo se coge, un trazo a mano que lo tacha. El mundo entra en la app por cuatro sitios y solo por ellos: la paleta (pizarra y tiza), una sola tipografía redondeada de cartel, la densidad generosa de un cartel que se lee de lejos, y un gesto propio, el tachado de tiza. La organización de las pantallas, la navegación y los controles son los de una app de móvil corriente; nadie debe tener que aprender nada.

Está pensada para una persona de pie en un pasillo, con el carro en una mano, gafas de cerca y luz de fluorescentes. Por eso el texto es grande por defecto, cada objetivo táctil mide al menos 48 px, lo importante vive en el tercio inferior (al alcance del pulgar) y el estado de cada producto se lee por su marca, no por su color.

En claro, la pizarra es el marco (cabecera y pestañas) y las filas son tinta sobre papel blanco encima de un fondo de polvo de tiza. En oscuro, toda la pantalla es la pizarra y el texto es tiza.

**Key Characteristics:**
- Pizarra verde como marco; tiza como texto sobre ella; un único amarillo tiza para "aquí, ahora".
- Una tipografía redondeada para todo; la jerarquía sale del tamaño y el peso.
- Filas de 56 px, letra base de ~19 px, objetivos de 48 px como mínimo.
- El tachado de tiza es la firma: se dibuja al coger un producto.
- El recorrido del súper se dibuja como paradas de tiza unidas por una línea.

## Colors

Pizarra y tiza, con un solo acento amarillo que significa siempre lo mismo.

### Primary
- **Verde pizarra** (board): el marco de la app. Cabecera, barra de pestañas, botón principal en claro, números de pasillo y la bienvenida a pantalla completa.
- **Amarillo tiza** (chalk-yellow): "aquí, ahora". El siguiente pasillo del recorrido, la cifra de lo que queda por coger, la pestaña activa, la acción de los avisos ("Deshacer") y el foco en oscuro. Nunca decora.

### Neutral
- **Tiza** (chalk): texto e iconos sobre la pizarra; texto principal en oscuro; botón principal en oscuro.
- **Tiza gastada** (chalk-muted): texto secundario sobre la pizarra, pestañas inactivas, paradas ya hechas.
- **Polvo de tiza** (chalk-dust): fondo de trabajo en claro, bajo las filas.
- **Papel** (row): filas, hojas inferiores y paneles en claro.
- **Tinta** (ink): texto principal en claro.
- **Tinta suave** (ink-muted): títulos de sección y texto secundario en claro (contraste 7:1 sobre el polvo de tiza).
- **Tinta tachada** (done-ink): nombres ya cogidos y relleno de su marca; sigue legible (5,6:1 sobre papel).
- **Raya** (line): separadores entre filas y bordes de campos.
- **Rojo de aviso** (danger): solo para quitar o salir. En oscuro, su versión clara (danger-night).

Las variantes `*-night` son el mismo papel de cada color en el tema oscuro.

### Named Rules
**The One Yellow Rule.** El amarillo tiza solo marca lo que toca ahora (siguiente pasillo, lo pendiente, la pestaña activa, la acción del aviso). Si algo amarillo no es "aquí, ahora", sobra.

**The Mark Over Colour Rule.** El estado nunca depende solo del color: aro vacío = pendiente; aro relleno con ✓ y tachado = en el carro; aro discontinuo = sin pasillo en este súper.

## Typography

**Display Font:** SF Pro Rounded en iPhone (ui-rounded), con system-ui como respaldo.
**Body Font:** la misma.

**Character:** una sola voz de cartel de mercado, redondeada y amable, que respeta el tamaño de texto elegido en Ajustes del iPhone (Dynamic Type mediante `-apple-system-body`).

### Hierarchy
- **Display** (800, 2.25rem, 1.15): solo el nombre de la app en la bienvenida.
- **Headline** (800, 1.5rem, 1.15): título de la cabecera (nombre de la familia o del súper, a 1.25rem en el modo compra).
- **Title** (800, 1rem): títulos de sección y de pasillo; los títulos de hoja suben a 1.375rem.
- **Body** (600, 1.125rem, 1.4): nombres de producto y texto de trabajo. Lo ya cogido baja a 500.
- **Label** (700, 0.8125rem, cifras tabulares): etiquetas de pestaña; las cifras de recuentos usan siempre números tabulares.

### Named Rules
**The One Voice Rule.** Una sola familia tipográfica. La jerarquía se hace con tamaño y peso, nunca con una segunda fuente decorativa ni con letra "de tiza" que cueste leer.

**The Reading Glasses Rule.** Ningún texto de trabajo por debajo de 1.125rem; nada por debajo de 0.8125rem en ningún caso.

## Layout

Una sola columna de 640 px como máximo, centrada, con 16 px de margen lateral. Arriba, la cabecera de pizarra fija; abajo, el "dock" fijo: avisos, sugerencias, campo de añadir y pestañas, en ese orden de arriba abajo. El contenido reserva abajo exactamente lo que ocupa el dock (se mide en vivo) y, en iPhone, el dock sube con el teclado. Las zonas seguras del iPhone (isla y barra de inicio) se respetan con `env(safe-area-inset-*)`.

El ritmo: 8 px dentro de un grupo, 16 px entre bloques, 20–28 px entre secciones, y más aire encima de un título que debajo.

### Named Rules
**The Thumb Zone Rule.** Lo que se hace a menudo (apuntar, cambiar de pestaña, terminar compra) vive en el tercio inferior. Arriba solo se lee.

**The Still Rows Rule.** Lo que hacen otros miembros no mueve lo que tienes bajo el dedo: las filas se ordenan por nombre y solo tu propio "coger" desplaza una fila.

## Elevation & Depth

Casi plano. La profundidad la dan los tonos (papel sobre polvo de tiza, pizarra sobre todo) y dos sombras con función: una muy suave bajo los bloques de filas, para separarlos del fondo, y una más marcada bajo lo que flota (avisos y aviso de versión nueva). Las hojas inferiores se separan con un velo oscuro, no con sombra.

### Named Rules
**The Only Floaters Cast Shadows Rule.** Solo lo que flota sobre el contenido (avisos) proyecta una sombra clara; lo que está en su sitio apenas se despega del fondo.

## Shapes

Esquinas suaves y constantes: 14 px en botones, campos, bloques de filas y paneles; 22 px arriba en las hojas inferiores; círculos perfectos para marcas, números de pasillo y paradas del recorrido. Los bordes son trazos de 2 px (campos, botones secundarios) o de 2,5 px en las marcas, como un trazo de tiza. Las secciones de filas son un solo bloque con separadores de 1 px, nunca tarjetas sueltas.

## Components

### Buttons
- **Shape:** esquinas suaves (14 px), 3.25rem de alto, ancho completo en hojas y formularios.
- **Primary:** pizarra con texto tiza en claro; tiza con texto tinta en oscuro. Peso 700.
- **Pressed:** se encoge al 97 % (120 ms); nunca cambia de color.
- **Outline:** transparente con borde de 2 px color raya; texto tinta.
- **Quiet:** texto subrayado en tinta suave, para acciones de escape ("Volver", "Salir de la familia").
- **Danger:** borde y texto rojo de aviso; solo para quitar o salir, siempre con confirmación o Deshacer.

### Inputs / Fields
- **Style:** papel con borde de 2 px color raya y esquinas de 14 px; 3.25rem de alto (3.5rem en el campo de añadir). Texto de 1.125rem para que iOS no haga zoom.
- **Focus:** el borde pasa al color de foco (pizarra en claro, amarillo tiza en oscuro), sin halo.
- **Error:** mensaje en rojo de aviso, peso 700, debajo del campo, solo después de intentar guardar.

### List rows
- **Style:** fila de 56 px dentro de un bloque de papel; toda la fila (marca + nombre) es un único botón que mete el producto en el carro; a la derecha, la cantidad como pastilla (solo si es más de 1) y un botón ⋯ de 48 px para los detalles.
- **States:** pendiente (aro vacío), en el carro (aro relleno con ✓, nombre en tinta tachada con el trazo de tiza), sin pasillo (aro discontinuo).

### Navigation
- **Tab bar:** pizarra, tres pestañas (Lista, Comprar, Familia) con icono propio y etiqueta; la activa en tiza con el icono amarillo. Centrada y limitada a 12rem por pestaña en pantallas anchas; se oculta mientras el teclado está abierto.
- **Sheets:** hojas inferiores sobre `<dialog>` modal para detalles, confirmaciones y elecciones; se cierran tocando fuera o con Escape.

### Chalk strike (signature)
Un trazo SVG a mano, del color de la tinta en claro y de la tiza en oscuro, que cruza el nombre de lado a lado. Se dibuja en 360 ms al coger el producto (con un toque de vibración) y después queda fijo; con movimiento reducido aparece sin animar.

### Route strip (signature)
En el modo compra, bajo el nombre del súper: los pasillos como paradas circulares de 2.75rem unidas por una línea de tiza. Pendiente = aro de tiza con su número; siguiente = relleno amarillo tiza; hecho = relleno tiza gastada con ✓; sin nada = aro discontinuo apagado; sin pasillo = aro discontinuo amarillo con interrogación. Tocar una parada lleva a su pasillo; la siguiente se mantiene siempre a la vista.

## Do's and Don'ts

### Do:
- **Do** usar la pizarra (board) como marco de cada pantalla: cabecera arriba, pestañas abajo.
- **Do** reservar el amarillo tiza para "aquí, ahora" (The One Yellow Rule).
- **Do** dar a cada estado su propia marca además de su color (The Mark Over Colour Rule).
- **Do** mantener cualquier control táctil en 48 px o más y el texto de trabajo en 1.125rem o más.
- **Do** ofrecer Deshacer en todo lo que quita algo de la lista.
- **Do** dibujar los iconos como SVG de 24 px con trazo de 2 px y extremos redondeados.

### Don't:
- **Don't** usar texturas de tiza, letras manuscritas ni marcos de madera: el mundo está en la paleta y el gesto, no en el disfraz.
- **Don't** usar emojis ni caracteres de texto como iconos.
- **Don't** usar un segundo acento de color ni el amarillo como decoración.
- **Don't** usar ventanas de `alert`/`confirm`/`prompt` del navegador: las decisiones van en hojas inferiores.
- **Don't** dejar que lo que hacen otros miembros mueva filas bajo el dedo de quien está usando la app.
