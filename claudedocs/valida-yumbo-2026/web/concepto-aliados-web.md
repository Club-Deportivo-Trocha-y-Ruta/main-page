# Aliados en la página de la válida — concepto y decisiones

> 7-oct-2026. `ValidaSponsorRibbon.astro` (franja) y `ValidaAllies.astro` (muro) en
> `/copa-valle-yumbo-2026`. Capturas en `capturas/aliados-*.png` (primera versión),
> `capturas/aliados-v2-*.png` (después de la revisión final, `revision-opus-rediseno.md`) y
> `capturas/aliados-v3-*.png` (la banda de tinta, 8-oct).

## El concepto: «el pie del afiche»

El afiche oficial pone a las marcas en una franja de papel blanco, de borde rasgado, con una barra de
tinta debajo. La página hace lo mismo dos veces: **antes de la primera foto**, esa franja tal cual (todas
las marcas a la vista, en casillas iguales); **después de la galería**, un escenario grafito donde cada
marca tiene su placa de papel, su nombre y su enlace. Son los mismos materiales del afiche: papel, tinta
grafito, la trama de puntos lima y reglas finas. No hay degradados, sombras ni vidrio.

## Franja (entre la apertura y las fotos)

- **Papel rasgado sobre la apertura.** El borde se monta sobre el pie de la apertura y no suma alto. El
  papel sigue blanco en el tema oscuro, porque los logos están hechos sobre blanco y cinco traen su fondo
  blanco pegado.
- **Casillas iguales de 5:3, separadas por reglas, en orden alfabético.** Todos los logos ocupan la misma
  superficie: el ancho es `√proporción × lado` (`equalAreaWidth`), así Rapi Wey (4:1) y ASCOMY (0,8:1)
  pesan lo mismo que Café Águila Roja.
- **En el teléfono (menos de 768 px) la fila se mueve con el scroll, no con el reloj.** En 390 px no caben
  16 logos legibles. Una cinta automática le mostraría 3 o 4 marcas a quien baja en dos segundos (con 45 s
  por vuelta) y, sin botón de pausa, choca con WCAG 2.2.2. Ligada al scroll, la fila pasa como las vallas
  de una pista vistas desde la bici, y si el visitante se detiene, la valla también. Es CSS
  (`animation-timeline`), sin JS. La franja mide 134 px en un Pixel 7 (el tope era ~140).
- **La valla es un bucle, para que sea justa** (v2). La primera versión iba de la primera marca a la
  última, y las puntas del alfabeto quedaban contra los bordes de la pantalla: en un Pixel 7, Zuleyma
  Valencia estaba 30 px de scroll a la vista y Centro Integral del Saber 245. En 360×640, Zuleyma terminaba
  metida bajo la cabecera. Ahora la fila va seguida de su eco (la misma fila, `aria-hidden` y sin `alt`,
  que solo existe dentro de la valla) y recorre exactamente una vuelta (`translateX(-50%)`), desde que la
  mitad de la fila entra por abajo hasta que su mitad sale por arriba, sin contar la cabecera
  (`view(block 4rem 0px)`, `entry 50% exit 50%`). Medido cada 5 px de scroll (≥ 90 % del logo a la
  vista, debajo de la cabecera): **las 16 entre 150 y 185 px en Pixel 7 y entre 80 y 120 en 360×640, y
  las 16 se ven enteras en las dos.** Lo que queda de diferencia es la forma: un logo angosto cabe entero
  en la pantalla más rato que uno apaisado.
- **Los logos llegan antes de pasar** (v2). Con `loading="lazy"` dentro de una ventana recortada, el
  navegador pedía cada logo recién cuando entraba a la ventana, en plena pasada: con 4G y caché fría
  pasaban casillas vacías. Ahora van `loading="eager"` con `fetchpriority="low"` (bajan después de la foto
  de la apertura) y en su versión de 320 px: `scripts/prepare-valida-aliados.mjs` genera además
  `<id>-320.webp` (caja de 320×200, calidad 80; **182 KB los 16** contra 446 de los de 640, que siguen
  idénticos). El `srcset` sale de `allyLogoSources` y el `sizes` se calcula por logo (su fracción de la
  casilla en cada tramo). En un Pixel 7 se piden las 16 de 320 px al cargar.
- **Desde 768 px, rejilla quieta de 2 × 8**, como el afiche (191 px en tableta). Sin soporte de animaciones
  de scroll o con movimiento reducido también queda quieta: 2 × 8 desde 640 px y 4 × 4 en el teléfono, con
  todas a la vista (321 px).
- **Una sola parada de tabulación**: el enlace de la barra, «Conoce a los 16 aliados ↓», que lleva al muro.
  Los logos no son enlaces y el lector de pantalla los nombra una vez (medido en el árbol de accesibilidad:
  16 imágenes, no 32).
- **Analítica** (v2). El enlace emitía `sponsor_click` con `sponsor_id: 'franja'`, y en un reporte por
  `sponsor_id` «franja» habría salido como una marca más. Ahora es un salto: `page_nav_click` con
  `content_id: 'aliados'` y `method: 'franja'`. La franja, que es la superficie de marcas que más gente ve,
  se mide con `sponsor_wall_view` y `content_id: 'franja'` cuando pasa entera por la pantalla. En el
  reporte, decir «la franja con las 16 marcas pasó por la pantalla de N personas», no «N vieron tu logo»:
  en el teléfono muestra cuatro a la vez.
- La etiqueta nombra solo los roles que hay (`allyCreditLine`): «Con el patrocinio y el apoyo de».

## La banda de tinta (v3, 8-oct)

El usuario, sobre la primera versión: «Esa línea en negro que dice conocer a los 16 aliados, no es tan
llamativa». En una pantalla ancha era una tira de 44 px con un texto lima chico pegado a la izquierda:
se leía como un pie o un separador, no como una invitación.

- **Composición propia, a todo el ancho de la columna:** a un lado, el número de aliados enorme en lima
  itálica 800 (88 px en escritorio, 44 en el teléfono) y la frase «aliados le apostaron a esta válida» (la
  voz del titular del muro, a donde lleva); debajo, en escritorio y tableta, «Gracias a ellos, tus fotos
  son gratis.» (la promesa de la apertura y del visor, que solo sale si hay fotos publicadas: la página le
  pasa `photos` a la franja). Al otro lado, el botón lima de la página («Conócelos ↓»: fondo `accent`,
  texto grafito, `shadow-pressable`, como «Buscar mis fotos»).
- **Toda la banda es el enlace:** en el teléfono es un blanco de 71 px de alto a todo el ancho, y sigue
  siendo una sola parada de tabulación. El foco se dibuja como un anillo blanco alrededor del botón. Su
  nombre accesible es la frase entera («16 aliados le apostaron a esta válida… Conócelos»). La analítica
  no cambia (`page_nav_click`, `content_id: 'aliados'`, `method: 'franja'`).
- **Filete lima abajo (3 px), un registro corrido de imprenta:** en el tema oscuro la página es casi del
  mismo grafito que la banda (1,25:1) y sin él la banda se disolvía; el filete contra la página da
  10,2:1.
- **Alto:** en el teléfono la banda pasa de 44 a 71 px (+27, por debajo de los 40 que había de margen): el
  botón conserva sus 44 px de área táctil, la banda 12 px de aire arriba y abajo (la sombra dura del
  botón mide 4) y el filete 3. La franja entera mide 160,5 px en Pixel 7 y en 360×640. En escritorio, la
  banda mide 121 px (franja de 346).
- **Sin movimiento propio:** la valla de arriba ya se mueve con el scroll, y una flecha que rebota es el
  aviso de «baja» de cualquier plantilla. Al pasar el mouse, el botón sube 1 px y la flecha baja 2 (solo
  `transform`, quieto con movimiento reducido).
- **Contraste medido** (claro y oscuro): número lima 8,1:1, frase 13,4:1, promesa 8,2:1, texto del botón
  8,1:1, botón contra la banda 8,1:1, anillo de foco 13,4:1.

## Muro (después de la galería)

- **Escenario grafito** (`tone="dark"`): queda entre dos secciones claras (fotos y resultados), y es la
  única sección oscura antes del cierre.
- **Dos grupos con la fórmula del afiche**: «Con el patrocinio de» (15) y «Con el apoyo de» (ASCOMY),
  alfabéticos por dentro (`groupAlliesByRole`). Las tarjetas ya no llevan la píldora de rol, porque el
  rótulo del grupo lo dice. «Con el respaldo de» (las instituciones) es también un `h3` (v2): se veía igual
  que los otros dos rótulos y quien navega por encabezados no lo encontraba.
- **Tarjetas iguales también en el texto** (v2). Las placas eran iguales, las tarjetas no: cuatro marcas
  llevaban descripción y enlace en lima, tres solo el enlace, tres solo la descripción y seis solo el nombre,
  y las siete con enlace lima se leían como destacadas. Ahora la descripción sale por grupo y solo si todas
  las del grupo la tienen (`AllyGroup.taglines`): ASCOMY, sola en su grupo, conserva la suya; en patrocinio
  no sale ninguna. El enlace va en blanco tenue (`text-white/80`) y se vuelve lima al pasar o enfocar.
  **Pendiente del club desde la revisión del 6-oct:** enlace y una línea de qué hace cada una, para las 16,
  antes del lunes 19. Sin enlace, nueve marcas no pueden recibir ni un `sponsor_click` para el reporte del
  25. Y la descripción de Incolmix es su razón social: mejor qué fabrica.
- **Placas de papel más grandes**, con el logo a superficie igual en % de la placa (crece con ella): en
  escritorio, el logo cuadrado pasa de 72 a ~94 px y los quince caben en 3 filas de 5. Con `srcset` y un
  `sizes` por logo, los cuadrados y verticales usan la versión de 320 px.
- **Todo el muro es una sola rejilla (`subgrid`).** El grupo de apoyo comparte fila con el respaldo
  institucional en vez de quedar solo frente a cuatro casillas vacías, y la tarjeta de ASCOMY mide
  exactamente lo mismo que las otras quince.
- **La trama de puntos lima** del afiche en la esquina superior derecha: un semitono de verdad (cambia el
  tamaño del punto, no la opacidad), generado en el build (1,2 KB comprimido). A 360 px quedaba detrás del
  titular: ahora mide 112 px en el teléfono (`size-28`).
- Se conserva lo funcional: `<a>` solo si hay enlace (si no, `<div>`), `sponsor_click` + `sponsor_id`,
  «(se abre en una pestaña nueva)», `alt=""` con el nombre en el `h4` de la tarjeta. `sponsor_wall_view`
  lleva `content_id: 'muro'` cuando el muro llega a la mitad de la pantalla; el mismo script, el único,
  observa también la franja. Una vez cada uno por visita.
- Al saltar al muro (desde la franja o el índice), su borde se pega a la cabecera
  (`scroll-mt-[var(--header-h,4rem)]`, v2): antes asomaban 32 px blancos de la galería encima del grafito.
- La bajada repite la promesa del visor desde el lado de las marcas: «Por ellos las fotos de esta página son
  gratis para todas las familias. Son 16, en orden alfabético.»
- «¿Tu marca en la próxima?» queda como botón de contorno blanco (el `outline` de `Button` es teal oscuro
  y no se lee sobre grafito), igual que el enlace secundario del cierre de la página.

## Alternativas descartadas

1. **Cinta continua por tiempo** (la de `SponsorsBar`): la exposición queda desigual entre marcas, choca con
   WCAG 2.2.2 sin botón de pausa y es el patrón de logos «trusted by» de cualquier plantilla.
2. **Colofón quieto en una fila** (logos chicos en gris): en 140 × 390 px los logos quedan de 25 px,
   ilegibles, y en gris pierden justo la marca que se agradece.
3. **El letrero de dos tablas** de la historia de agencia (cabecera de tinta y tabla de papel con postes):
   en la web es un objeto falso y suma alto sin mostrar más marcas.
4. **Placas con sombra lima corrida** (la del letrero de agencia): dieciséis sombras lima son ruido, y el
   cliente ya leyó «marco + sombra lima» como tarjeta de interfaz.
5. **Valla de punta a punta** (la primera versión): lineal y sin eco, deja las puntas del alfabeto contra
   los bordes (exposición de 30 a 245 px de scroll). La reemplazó el bucle.

## Para confirmar con el usuario

- **La trama lima del muro.** La revisión final la deja («cita la esquina del afiche»); si se lee como
  adorno, sale borrando un `<svg>`.
- **Croki Plátano mide 146 px de origen** y en escritorio se pinta a ~94 px CSS (~190 px reales en
  pantallas retina): se ve suave. Sigue pendiente pedir el original (también para las piezas de redes).
- **«Buscar mis fotos» salta por encima de la franja** (lleva a `#buscar`); la revisión final recomienda
  dejarlo y medir el botón. Quien lo toca tiene el índice («Aliados 16»), el crédito del visor y el muro.

## Actualización del 9-oct: 18 aliados

Entraron Mera Artesanal (patrocinio) y la **Alcaldía de Yumbo (apoyo)**, una sola tarjeta para la entidad y sus cuatro secretarías (`tagline`: «Secretarías de Desarrollo Económico; Gobierno, Seguridad y Convivencia; Infraestructura y Servicios Públicos; y Movilidad»; enlace al sitio oficial `https://www.yumbo.gov.co`, verificado; sin Instagram hasta que el usuario lo dé). El número de la banda pasa a 18 (sale de los datos). La franja pasó de «dos filas de ocho» a dos filas de `ribbonColumns` (nueve con 18); el muro no cambió: el grupo de apoyo ya preveía dos tarjetas. «Alcaldía de Yumbo» salió del texto «Con el respaldo de» para no repetirse. Todo lo medido arriba (150-185 px de scroll a la vista, 182 KB de logos de 320 px) se midió con 16: no se volvió a medir. Pendiente: Instagram de los aliados que el usuario va a dar.

Más tarde ese día entró **Coordinadora** (patrocinio; logo 10,85:1, el más alargado): 19 aliados, franja en dos filas de diez (`ribbonColumns(19) = 10`; la de abajo, de nueve, queda centrada), banda «19». Su logo topa en el 88 % del ancho de la casilla y se ve como una palabra baja: legible, con la menor área de todos (≈40 % de la de un cuadrado). En el muro, con 17 de patrocinio la última fila tiene dos tarjetas en vez de una.
