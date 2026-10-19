# Revisión del rediseño de `/copa-valle-yumbo-2026`: franja, muro e índice

> 7-oct-2026 · Dirección creativa, UX, accesibilidad y rendimiento · Vista previa con 420 fotos de prueba.
> Cómo se midió: Chromium (Playwright 1.63) en Pixel 7 (412×839), 360×640 y 1.440×900; temas claro y
> oscuro, movimiento reducido y sin JS; axe-core 4.11 (WCAG 2.2 AA + buenas prácticas) en móvil y
> escritorio, en los dos temas; CLS y LCP con `PerformanceObserver` al cargar y recorriendo la página
> entera; contraste calculado sobre el color compuesto; exposición de cada marca de la franja medida
> cada 5 px de scroll; red 4G lenta (150 ms, 1,6 Mb/s) con caché fría. Los arreglos #1 y #3 se
> probaron como prototipo inyectado en el navegador, sin tocar el repo. Capturas: `capturas/revision-*.png`.

## Veredicto

1. Buena dirección y factura de primer nivel: la franja de papel rasgado y el muro grafito son imprenta, no plantilla; el índice está muy bien resuelto (foco, `<details>`, sin JS, se esconde con el visor), CLS 0 en móvil y escritorio, axe sin fallas propias de la página y contraste mínimo de 5,18:1.
2. Pero la franja móvil, la pieza nueva para darles relevancia a las marcas, hoy rompe «todos al mismo nivel»: Zuleyma Valencia queda 30 px de scroll a la vista y Centro Integral del Saber 245 (8 veces más); en 360×640 Zuleyma nunca se ve entera, y con 4G y caché fría 12 de los 16 logos pasan en blanco.
3. Lo que entierra «lo último» no es la falta de índice sino la vista «Todas»: 9.120 px de galería en Pixel 7 (12.267 en 360 px). Con una tira por categoría baja a 3.689 px y el muro sube de 10.365 a 4.935 px (medido).
4. Con los tres arreglos altos la página queda «TOP»; los medios son de una tarde y los bajos, pulido.

## Hallazgos

| # | Severidad | Dónde | Qué pasa (medido) | Arreglo concreto |
|---|---|---|---|---|
| 1 | **Alta** | `ValidaSponsorRibbon.astro` · valla móvil (`animation-range: cover 0% cover 85%`, `translateX(calc(100cqw - 100%))`) | Exposición desigual. Px de scroll con ≥ 90 % del logo a la vista, Pixel 7: Zuleyma Valencia 30, Alquiequipos Beru 70, Yumbileta 90, ASCOMY 125, contra 200–245 de las del centro del alfabeto. En 360×640 Zuleyma no pasa del 71 % visible (termina el recorrido metida bajo la cabecera) y Yumbileta tiene 40 px. Las puntas del alfabeto coinciden con los bordes de la pantalla. Y el reposo favorece a unas pocas: quien aterriza con la franja arriba ve siempre Ram Bike Atelier, Rapi Wey, Sanin, Yumbileta y Zuleyma Valencia. | Fila en bucle: duplicar los 16 `<li>` (la copia con `aria-hidden="true"`, `alt=""` y clase `valida-ribbon__slot--echo`, `display:none` fuera de la valla y `display:grid` dentro); `@keyframes valida-ribbon-pass { to { transform: translateX(-50%) } }`; `animation-timeline: view(block 4rem 0px)` (la cabecera no cuenta como pantalla) y `animation-range: entry 50% exit 50%`. Sobran `container-type` y `100cqw`. Prototipo medido: las 16 entre 150 y 185 px en Pixel 7 y entre 80 y 120 px en 360×640, todas enteras. |
| 2 | **Alta** | `ValidaSponsorRibbon.astro` · `<img loading="lazy">` dentro de `.valida-ribbon__window { overflow: clip }` · `public/images/valida-yumbo-2026/aliados/` | Al cargar en móvil solo se piden los 4 logos que caben en la ventana; los otros 12 se piden cuando entran a ella, en plena pasada. Con 4G lento y caché fría, a ritmo de dedo, pasan como casillas vacías (`revision-franja-movil-logos-sin-cargar.png`). Los 16 archivos pesan 446 KB (640×400, calidad 86) para pintarse a ≤ 88 px CSS en la franja. | `loading="eager" fetchpriority="low"` en la franja: bajan después del LCP y el muro los reusa de caché. Aligerar: el script de logos genera además `<id>-320.webp` (caja 320×200, calidad 80: **180 KB los 16**, medido) y la franja usa `srcset="…/<id>-320.webp 320w, …/<id>.webp 640w" sizes="6.25rem"`; el muro, `sizes` del logo real (≈ 85 % de la placa: `(min-width: 1280px) 190px, (min-width: 640px) 26vw, 40vw`). |
| 3 | **Alta** | `RacePhotoGallery.tsx` · `GroupSection` con `depth === 'preview'` (vista «Todas») | «Todas» mide 9.120 px en Pixel 7, 12.267 en 360×640 y 6.484 en escritorio: el muro empieza a 10.365 px (12 pantallas) y la página mide 19.734. Además, 3 de 8 mangas terminan con una foto sola en la última fila: 39–44 % del ancho en móvil y 18–20 % en escritorio, donde más se nota (`revision-galeria-escritorio-fila-huerfana.png`). | En «Todas», una tira horizontal por manga en vez de filas justificadas: `<ul role="list" className="-mx-4 flex snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 [scrollbar-width:none] sm:mx-0 sm:gap-3 sm:px-0 [&::-webkit-scrollbar]:hidden">` (más las `--row-h` de hoy) y cada `<li>` con ``style={{ height: 'var(--row-h)', aspectRatio: `${photo.w} / ${photo.h}`, flex: 'none' }}`` + `snap-start`, sin `flexBasis`/`flexGrow`. Se quedan las 12 por manga y «Ver las N fotos de X»; la vista de una categoría (48) sigue justificada. La miniatura cortada en el borde avisa que hay más. Prototipo medido: galería 3.689 px (Pixel 7), 3.816 (360) y 3.730 (escritorio); muro de 10.365 a **4.935 px**; página de 19.734 a 14.303. Sin huérfanas por construcción (`revision-prototipo-todas-en-tiras-movil.png`). |
| 4 | Media | `ValidaAllies.astro` · tarjetas · `aliados.json` | Placas iguales, tarjetas no: 4 marcas llevan descripción y enlace en lima (usuario de Instagram o «Facebook»), 3 solo el enlace, 3 solo la descripción y 6 solo el nombre. En un muro «todos al mismo nivel», las 7 con enlace lima se leen como destacadas, y son las únicas que se levantan al pasar el mouse (`revision-muro-escritorio-tarjetas-desiguales.png`). 9 de 16 siguen sin enlace: cero `sponsor_click` posibles para ellas en el reporte del 25 (pendiente desde la revisión del 6-oct, #10). La descripción de Incolmix es su razón social. | Antes del 19, enlace y una línea de qué hace cada una, para las 16, en `aliados.json`. Mientras falte: descripción solo si todas la tienen (`const showTaglines = allies.every((ally) => ally.tagline)`) y la línea del enlace en neutro, `text-white/80 group-hover:text-accent-light` en vez de `text-accent-light`. Incolmix: qué fabrica, no «S.A.S.». |
| 5 | Media | Analítica: enlace de la franja, script de `ValidaAllies.astro`, botón «Buscar mis fotos» | (a) El enlace de la franja emite `sponsor_click` con `sponsor_id: 'franja'`: mezcla un salto interno con los clics a marcas, y en una exploración de GA4 por `sponsor_id` «franja» sale como una marca más (puede ser la más cliqueada) (el «muro» del visor que lo justificaba ya no existe: el crédito del visor es texto). (b) La franja es la superficie de marcas que más gente ve y no se mide. (c) «Buscar mis fotos» no emite nada: no se sabrá cuántos se saltan la franja. | (a) `data-analytics-event="page_nav_click" data-analytics-content-id="aliados" data-analytics-method="franja"`; en los enlaces del índice, `data-analytics-method="indice"`; ampliar el comentario de `page_nav_click` en `events.ts` («salto dentro de la página; `method` dice desde dónde»). (b) `sponsor_wall_view` con `content_id`: `data-sponsor-wall="franja"` en la `<section>` de la franja (con `threshold: 1`) y `data-sponsor-wall="muro"` en el muro; el script observa los dos y emite una vez cada uno por visita. (c) En el botón, `page_nav_click` con `content_id="buscar"` y `method="apertura"`. Para el reporte: clics por marca = `sponsor_click` con `sponsor_id` dentro de los 16 ids de `aliados.json`. |
| 6 | Media | `RacePhotoGallery.tsx` · `FilterBar` en móvil | En la galería quedan fijos cabecera 64 + filtros 113 + índice 64 = 241 px: el 28,7 % de un Pixel 7 y el 37,7 % de un 360×640 (`revision-galeria-360-tres-barras.png`). La segunda fila (placa + «420 fotos») repite el conteo del chip activo («Todas 420»), salvo cuando hay una placa escrita. | Una sola fila en móvil: `<div className="flex items-center gap-2">` con el campo de placa primero (`w-28 shrink-0`) y el carrusel de chips al lado (`min-w-0 flex-1`); el mensaje visible solo con placa (`placa !== null`) y siempre en `sr-only` dentro del `role="status"`. Barra ≈ 69 px: 23,5 % en Pixel 7 y 30,8 % en 360×640. Si el club decide no etiquetar placas, la segunda fila sobra igual. |
| 7 | Media | `RacePhotoGallery.tsx` · encabezado de `GroupSection` · `mangas.json` | Los títulos repiten manga y categorías completas: «Manga 4 · Élite femenina, Junior femenina, Prejuvenil femenina y Máster femenina» ocupa 3 líneas en móvil (190 px con el conteo y la descripción; `revision-galeria-360-titulo-tres-lineas.png`); Manga 1 y Manga 5, 2 líneas. La familia busca por categoría, que es lo que dice el chip. | `h3` = `chipLabel(group)` («Femeninas») y debajo `<p className="text-text-secondary text-sm">Manga 4 · Élite, Junior, Prejuvenil y Máster · 50 fotos</p>`: campo opcional `detail` en `mangas.json` (si falta, `joinCategories`), omitido cuando es igual al chip (Manga 5). El texto alternativo (`photoAlt`) no cambia. |
| 8 | Media | `RacePhotoGallery.tsx` · filas a 360 px | Con `--row-h: 7rem`, dos fotos horizontales piden 168 + 168 + 8 = 344 px y a 360 px hay 328: cada horizontal ocupa la fila entera (≈ 220 px de alto). Una categoría de 48 fotos dobla su largo; por eso «Todas» llega a 12.267 px. | `[--row-h:6rem] min-[400px]:[--row-h:7rem]` en las filas (y en la tira del #3): dos horizontales por fila desde 360 px. |
| 9 | Baja | `SectionDock.astro` · tramos de avance (`.sdock-seg`, `.sdock-line`, `updateProgress`) | Seis barras con tres estados (vacía, llena, lima a medias) son lo más «de app» del índice (las historias de Instagram): repiten lo que ya dice el ítem actual (fondo, texto blanco, icono lima), «leída» es falso después de un salto y hay que aprender a leerlas (`revision-escritorio-oscuro-riel-cifras.png`). | Quitar tramos y línea (CSS, `--sdock-progress`, `updateProgress`) y marcar el ítem actual con una regla fija de imprenta: `aria-[current=location]:shadow-[inset_0_-2px_0_var(--color-accent)]`. |
| 10 | Baja | `copa-valle-yumbo-2026.astro` · entrada de Fotos | Entre la franja y los chips hay 338 px en Pixel 7 (antetítulo, h2 de dos líneas, bajada de tres, crédito de dos). La bajada repite la promesa de la apertura: «gratis y en calidad original» sale dos veces en pantalla y media. | Bajada: «Toca su categoría, abre la foto y descárgala.» (con placas: «Toca su categoría o escribe su número de placa, abre la foto y descárgala.»). Crédito en una línea, «Fotos: {nombre}», con el enlace en el nombre y sin el @. Unos 100 px menos antes de la primera foto. |
| 11 | Baja | Secciones destino (`scroll-mt-24`) | Al saltar desde el índice o la franja, la sección queda a 96 px y la cabecera mide 64: asoman 32 px de la anterior, una franja blanca encima del muro grafito o una grafito encima de Resultados (medido en #aliados, #resultados, #cifras y #siguiente; `revision-movil-salto-a-aliados-franja-blanca.png`). | `scroll-mt-[var(--header-h,4rem)]`: el borde de la sección se pega a la cabecera y su propio relleno separa el titular. Corregir la regla en docs/04 §31. |
| 12 | Baja | `ValidaAllies.astro` · trama | A 360 px la trama (160 px) queda detrás del final de la primera línea del titular, sobre el trazo lima de «le» (`revision-muro-360-trama.png`). | `size-28 sm:size-56 lg:size-72`. La trama se queda: cita la esquina del afiche y pesa 1,2 KB. |
| 13 | Baja | `ValidaAllies.astro` · «Con el respaldo de» | Se ve igual que «Con el patrocinio de» y «Con el apoyo de», pero es un `<p>`: quien navega por encabezados no lo encuentra. | `<h3>` con las mismas clases. |
| 14 | Baja | `valida.ts` · `pageMeta()` | La descripción, que es el texto de la vista previa en WhatsApp, dice «Busca tu manga»: lo que la página dejó de pedir. | «… Busca su categoría y descarga sus fotos gratis, en calidad original. Gracias a 16 aliados.» |
| 15 | Baja | `ValidaNumbers.astro` · prefijos (`tracking-[0.14em] uppercase`) | Con las etiquetas de `FactGrid` suman diez rótulos de mayúsculas espaciadas en una sección («MÁS DE», «AL MENOS», «CLUBES Y ESCUELAS»): el patrón de plantilla que el usuario rechaza. El prefijo es parte de la cifra y, separado, se lee como etiqueta. | Prefijo en minúscula, pegado a la cifra: `<p class="text-text-secondary text-sm font-semibold">Más de</p>`, sin `tracking` ni `uppercase`. Las etiquetas de `FactGrid` son del sistema: no tocarlas aquí. |
| 16 | Baja | `RacePhotoGallery.tsx` · `GroupSection` y `FamilyCard` | Cada manga es un `<section aria-labelledby>`: 9 regiones con nombre dentro de la galería, unas 20 en la página, y el lector de pantalla las lista todas como puntos de referencia. | `<div>` para las mangas; sus `h3` siguen navegables. |
| 17 | Baja | `evento.json` de prueba · `hero.photoId` | La foto de apertura de prueba es un podio de teteros en primer plano; la regla de la propia página es plano general. | El 19, un plano general de la pista con corredores lejos. |

## Los trade-offs

### 2. «Buscar mis fotos»: se queda en `#buscar`

Primera pantalla después de tocarlo (capturas `revision-movil-tras-buscar-mis-fotos.png`,
`revision-movil-alternativa-aterrizar-en-franja.png`, `revision-escritorio-alternativa-aterrizar-en-franja.png`):

| Destino | Pixel 7 | 1.440×900 |
|---|---|---|
| `#buscar` (hoy) | Filtros arriba y 9 miniaturas (7 enteras). La franja no se ve. | Filtros y 12 miniaturas (11 enteras). |
| La franja | 5 logos, siempre los mismos (Ram Bike Atelier → Zuleyma Valencia); filtros a 547 px; ninguna miniatura entera. | Los 16 logos y los chips; ninguna miniatura. |
| `#fotos` (titular) | Filtros a 434 px, 2 miniaturas enteras, solo el borde de la barra grafito. | — |

**Posición: dejarlo.** En móvil (82 % del tráfico) aterrizar en la valla la congela al final del
alfabeto: a cada familia que toque el botón le mostraría las mismas cinco marcas, que es justo lo que
«todos al mismo nivel» prohíbe, y le quitaría las fotos de la primera pantalla. En escritorio sí
funcionaría, pero un enlace no puede tener dos destinos sin trucos frágiles. Esa visita no se pierde
para las marcas: el índice dice «Aliados 16 ↓» durante toda la galería (es el «siguiente» desde
Fotos), el visor dice «Gratis gracias a 16 aliados de la válida» y el muro mide su vista. Medir el
botón (#5c) y decidir con datos en la próxima válida en casa.

Tampoco conviene recortar la apertura en móvil para subir la franja: hoy empieza a 1.112 px, debajo
del pliegue, y por eso nadie ve su estado quieto; si subiera a la primera pantalla, todas las visitas
verían en reposo las mismas cuatro marcas. La primera miniatura está a 1.800 px (2,15 pantallas; 1.987
con movimiento reducido), pero el botón está en la primera pantalla (y = 461) y la entrada de Fotos
(#10) es donde se puede ahorrar.

### 3. El índice flotante: fijo, y lo que se adelgaza es la barra de filtros

- **Esconderlo al bajar y mostrarlo al subir** va contra lo que pidió el usuario: en la galería se baja
  casi todo el tiempo y quedaría oculto justo donde «lo último» se pierde.
- **Lo que sobra está arriba**: la segunda fila de filtros (#6). Sin ella, 241 → 197 px (23,5 %) en
  Pixel 7 y 30,8 % en 360×640. Con las tiras (#3) además se sale de la galería en 4 pantallas, no en 11.
- **Los tramos del riel sobran** (#9): una regla lima fija bajo el ítem actual dice lo mismo sin
  parecer una app.
- Bien resuelto y no se toca: va en el DOM después de la apertura; aparece al enfocarlo (medido:
  opacidad 1 y y = 775 tras el Tab); la lista cierra con Escape y devuelve el foco; el salto lleva el
  foco al `h2`; se esconde en el pie y con el visor; las dos mitades miden lo mismo; CLS 0.
- Detalle sin consecuencia: en esta página «Volver a Fotos» se ve solo unos 60 px de scroll en móvil,
  porque en la última sección el pie entra enseguida y el índice se aparta.

### 4. La galería en «Todas»: sí vale la pena, y el arreglo es de estructura

Las tiras (#3) resuelven a la vez las huérfanas, el largo y lo que hay que recorrer para llegar al
muro; los títulos van por #7 y los 360 px por #8. Lo que se descartó: bajar a 8 por manga (sigue
dejando huérfanas y ahorra menos de la mitad); recortar a filas completas con JS después de hidratar
(mueve el contenido al montar, CLS, y depende del ancho); estirar la última fila (una foto sola pasa a
380 px de ancho, y si es vertical, a 500 de alto).

### La analítica

`sponsor_click` debe quedar para clics a marcas, que es lo que se le reporta a cada una; el enlace de la
franja es un salto como los del índice: `page_nav_click` con `method="franja"` (#5a). `quiero-patrocinar`
puede quedarse como está, pero el reporte filtra por los 16 ids. Lo que falta medir es lo que más vale
para el reporte del 25: cuántas personas vieron la franja (#5b) y cuántas la saltaron con el botón (#5c).
En el reporte, decir «la franja con las 16 marcas pasó por la pantalla de N personas» y no «N vieron tu
logo»: en móvil la franja muestra cuatro a la vez.

## Lo que está bien y no hay que tocar

- **El concepto de la franja**: el pie del afiche con papel rasgado y barra de tinta, papel blanco
  también en tema oscuro, una sola parada de tabulación, orden alfabético, logos a igual superficie
  (`equalAreaWidth`) y la rejilla 4×4 quieta con movimiento reducido (321 px). La idea de la valla
  ligada al scroll es buena: solo hay que hacerla justa (#1) y que cargue (#2).
- **El muro**: escenario grafito entre dos secciones claras, los rótulos del afiche por rol, `subgrid`
  para que la tarjeta de ASCOMY mida lo mismo que las otras quince, placas blancas, `alt=""` con el nombre
  en el `h4`, `<div>` cuando no hay enlace, `sponsor_wall_view` una vez por visita (medido: se dispara al
  saltar desde el índice) y «¿Tu marca en la próxima?» en contorno blanco.
- **La ingeniería del índice** (ver arriba) y que su «siguiente» desde Fotos sea Aliados: es el punto de
  contacto con las marcas que sí ve quien usó «Buscar mis fotos».
- **El orden de la página**: apertura → franja → fotos → muro → resultados → cifras → pista → próximo
  paso, con los tonos alternados. Quien baja de las fotos a los resultados pasa por el muro, y la apertura
  ya ofrece «Resultados oficiales» a quien no quiere bajar.
- **Rendimiento**: CLS 0 al cargar y al recorrer la página entera, en móvil y escritorio; el LCP es la foto
  de apertura (`fetchpriority="high"`); todo lo nuevo pesa ≈ 9 KB comprimido, medido sin minificar (script del índice 3,2 KB,
  CSS del índice 1,4, CSS de la franja 2,4, script del muro 0,6, trama 1,2). Lo único pesado son los logos (#2).
- **Accesibilidad**: axe solo reporta `region` en componentes globales; contraste mínimo 5,18:1 (las cifras
  del índice, blanco al 55 % sobre grafito) y todo lo demás entre 5,9 y 14,5:1 en los dos temas; encabezados
  h1 → h2 → h3 → h4 bien anidados; áreas táctiles de 44 px; sin JS la franja se mueve igual (es CSS), los 16
  logos cargan, el índice aparece a los 2,5 s y su lista funciona.
- **Lo resuelto de la revisión del 6-oct**: chips por categoría, `?manga=` en la URL, crédito del visor,
  `sponsor_wall_view`, barra de conversión fuera de esta página, superficie igual de los logos, campo de
  placa con etiqueta visible, textos de la apertura, de los aliados y del cierre.

## Capturas de esta revisión

| Archivo | Qué muestra |
|---|---|
| `revision-movil-primera-pantalla.png` | Pixel 7 al cargar: «Buscar mis fotos» en la primera pantalla, la franja debajo del pliegue. |
| `revision-franja-movil-logos-sin-cargar.png` | La franja a media pantalla con 4G lento y caché fría: casillas en blanco (#2). |
| `revision-franja-360-ultima-marca-bajo-cabecera.png` | 360×640: el final del recorrido ocurre bajo la cabecera; Zuleyma Valencia no alcanza a verse (#1). |
| `revision-movil-tras-buscar-mis-fotos.png` | Lo que se ve tras tocar el botón (trade-off 2). |
| `revision-movil-alternativa-aterrizar-en-franja.png` | Si aterrizara en la franja: siempre las mismas cinco marcas (trade-off 2). |
| `revision-escritorio-alternativa-aterrizar-en-franja.png` | En escritorio: 16 logos y chips (trade-off 2). |
| `revision-galeria-360-tres-barras.png` | Cabecera, filtros e índice sobre la galería a 360×640 (#6), con una horizontal por fila (#8). |
| `revision-galeria-360-titulo-tres-lineas.png` | El título de la Manga 4 en tres líneas (#7). |
| `revision-galeria-escritorio-fila-huerfana.png` | Una foto sola en la última fila, al 20 % del ancho (#3). |
| `revision-prototipo-todas-en-tiras-movil.png` | Prototipo de «Todas» en tiras (#3). |
| `revision-muro-escritorio-tarjetas-desiguales.png` | Tarjetas con y sin usuario lima y descripción (#4). |
| `revision-muro-360-trama.png` | La trama detrás del titular a 360 px (#12). |
| `revision-movil-salto-a-aliados-franja-blanca.png` | 32 px de la sección anterior sobre el muro después del salto (#11). |
| `revision-escritorio-oscuro-riel-cifras.png` | El riel con sus tramos, en tema oscuro (#9). |
| `revision-movil-sin-js-apertura.png` | Sin JS: el índice aparece a los 2,5 s, con la lista nativa. |
