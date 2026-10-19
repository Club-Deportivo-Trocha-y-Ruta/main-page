# Investigación de referencias — rediseño de `/copa-valle-yumbo-2026`

> 16-oct-2026. Solo investigación: no se tocó código. Más de 70 búsquedas con `tvly`, unas 90 páginas leídas con `tvly extract` y unos 30 sitios abiertos en un Chromium aparte (Playwright, 390×844, medición propia del 16-oct-2026).
>
> Cada referencia lleva su marca de verificación: **NAV** = la abrí en navegador (captura y medición propias), **EXT** = leí su texto con `tvly extract`, **FUENTE** = la describe un tercero fiable (reseña, caso de estudio, documentación). **Criterio propio** = juicio de ingeniería mío, no de una fuente. Lo que no pude verificar está en §5.

## Resumen (10 líneas)

1. **La apertura es un cartel, no una tarjeta.** Papel + cerro en trama lima (máscara de una tinta, la técnica que ya usa `prepare-yumbo-assets.mjs`) + «18» gigante + la foto real como recorte de papel rasgado. Paleta corta como The Big Lost [1], reglas finas y mancheta como Sea Harvest [10]; desregistro de tinta solo en titulares ≥ 40 px y a 2–5 px (T5).
2. **La búsqueda *es* el hero.** Chips de categoría/manga y la línea «gratis · tamaño original · sin marca de agua» en la primera pantalla: Venloop pone un buscador-píldora como primera acción [6], Sportograf busca por «categoría + ventana de tiempo» [11], FinisherPix y Fotop abren con la caja de búsqueda [12]. La línea base juvenil a superar es cupón + baja resolución [16].
3. **Cada aliado con un rol, no solo un logo.** «Presented by» bajo el logotipo [3], «Brought to you by» [1], «gracias a ellos las fotos son gratis» (Garmin en Unbound [2]) y la marca atada a un objeto (el Tour anuncia a Sanofi como «el jersey blanco» [5]). Logos tonales o sobre placas de papel [4][7].
4. **Guardar y compartir de verdad desde el celular.** Web Share con el archivo (no solo el enlace) y enlace profundo por categoría [14]; selección múltiple ligera sin cuentas; medir vistas y descargas por foto [15]. Soporte: Chrome Android 61+, iOS 12.2+, Firefox escritorio no (T8).
5. **Una sola trama para material heterogéneo.** Halftone/duotono uniforme para unificar logos y fotos de archivo de calidad dispareja (reseña de «Women Executives in IT Award» [19]); nunca sobre las fotos de las familias.
6. **Cifras: un dato por «plancha»; la pista como perfil de etapa.** Numerales de trama o contorno en CSS, unidad debajo del número, regla fina (FinisherPix [12], Strava [17]); línea de tiempo como perfil de elevación en SVG estático con los hitos de banderín («35 MI | 2,599'» de The Big Lost [1]).
7. **Presupuesto de imprenta.** Hornear en build (sharp), grano como tile estático (la CSP ya permite `img-src … data:`), sin SVG-filter vivo ni `mix-blend-mode` en overlays de pantalla completa; efecto limitado al hero y 2–3 «planchas» (T1, T6, T9).
8. **Orden.** The Big Lost [1] y Unbound [2] ponen las fotos como primer bloque tras el hero. Si el orden de secciones no se toca (así lo fija `propuesta.md`), basta con que el botón y los chips del hero lleven directo a la galería y que la franja siga baja (~134 px en un Pixel 7, según el concepto del 7-oct).
9. **Descartar.** Video a pantalla completa, WebGL/WebGPU/canvas y scroll secuestrado (Lightweight, Run Rob Run, Superlocal, hero de SBT GRVL), y cualquier referencia que pase de ~1 MB de CSS o ~1,5 MB de JS.
10. **Reglas duras que varias referencias violan.** Marca de patrocinador sobre la foto (Pic2Go [13]), búsqueda por selfie/rostro (Sportograf, FinisherPix, ScoutFoto, Pic-Time) y nombres de menores en resultados.

---

## 1. Referencias verificadas (19)

### A. Sitios de eventos y marcas

**[1] The Big Lost** (antes Rebecca's Private Idaho; la URL vieja redirige) — https://biglostidaho.com/ — 2026-27 — **NAV**
- Qué hace bien: tres tintas (grafito, magenta, crema) y un titular de fecha en display 900 («SEPT 8 – 11 2027»). El primer bloque tras el hero es «Official 2026 participant photos»: texto corto, enlace «Click here to find photos of yourself» y logo del fotógrafo. Cada etapa es una ficha con foto, línea de datos «STAGE 1: HARRIMAN / 35 MI | 2,599'» y mapa interactivo con perfil. Los patrocinadores van bajo «Brought to you by:»; al hotel anfitrión le dedica un párrafo con su beneficio concreto («save up to 25 %»). Medí 143 KB de CSS, ≥ 82 KB de JS, 0 video y 0 canvas (Webflow).
- Aplica a: 1, 3, 4, 6, 7.
- Riesgo: el mapa con perfil es un embed pesado (replicar como SVG estático); las fotos se resuelven enlazando a un tercero; los logos van en fila sin tratamiento.

**[2] Unbound Gravel — «Results & Photos»** — https://www.unboundgravel.com/results — 2026 — **NAV + EXT**
- Qué hace bien: una página por año con botones iguales RESULTS / PHOTOS y una fila aparte para «KIDS CRIT» con sus propios resultados y fotos. El patrocinador aparece como habilitador de la gratuidad: «Relive your ride with a FREE photo from Kahola Hill or Americus, thanks to [logo Garmin]»; el resto, «available for purchase… thanks to MarathonFoto» (en 2024: «Athletes receive 1 free photo»). Lista «Future Dates» hasta 2038 en la portada.
- Aplica a: 3, 5, 8.
- Riesgo: página funcional sin dirección de arte; WordPress con 1,75 MB de CSS legible y ≥ 226 KB de JS (no copiar la implementación); gratis = 1 foto, no el original de todas.

**[3] SBT GRVL** — https://www.sbtgrvl.com — 2026-27 — **NAV + EXT**
- Qué hace bien: el patrocinador titular es un lockup bajo el logotipo («SBT GRVL — *Presented by* [Wahoo]»), luego una regla fina, ciudad y fechas. «Our Sponsors» como fila de logos. Agradece por resultado: «our Junior Scholarship Program brought 24 young athletes to the SBT GRVL starting line» (con Obermeyer).
- Aplica a: 1 (lockup), 4 (gracias por resultado), 8.
- Riesgo: hero con video y ≥ 1,5 MB de JS (Squarespace); ventana emergente de newsletter que tapa media pantalla en móvil.

**[4] Crankworx** — https://www.crankworx.com — 2026-27 — **NAV + EXT**
- Qué hace bien: tira de socios (Whistler MTB Park, Pinkbike, Trailforks) arriba del todo, con los logos cortados en los bordes para sugerir continuidad; hero con velo azul noche y antetítulo rojo con trazo corto. Medí ≥ 116 KB de JS.
- Aplica a: 2, 4.
- Riesgo: los logos de los aliados del club traen fondo blanco, no admiten versión blanca; si la tira es marquesina continua exige botón de pausa (WCAG 2.2.2).

**[5] Tour de France** — https://www.letour.fr/en/ — 2026-27 — **NAV**
- Qué hace bien: el titular de la portada es un anuncio de patrocinio atado a un objeto, «New main partner: Sanofi puts on the white jersey», sobre la foto del jersey. Fechas y «NEWS» en etiquetas amarillas con forma de paralelogramo inclinado.
- Aplica a: 4 (rol/objeto), 1 (etiquetas inclinadas).
- Riesgo: banner de cookies a media pantalla sobre el hero en móvil; 634 KB de CSS; escala corporativa.

**[6] Venloop** — https://www.venloop.nl/ — Awwwards Nominee oct-2023; vigente 2026 (20.ª edición) — **NAV + EXT**
- Qué hace bien: hero = foto de la multitud en la meta + titular en itálica pesada («Samen gaan we over de finish!», «¡Vamos juntos a la meta!») + buscador-píldora gigante como primera acción («Vind hier alle antwoorden…»). Sello «20E EDITIE» sobre la primera tarjeta.
- Aplica a: 1, 3.
- Riesgo: WordPress con 1,57 MB de CSS, ≥ 835 KB de JS y ≥ 3,3 MB de imágenes en portada (no copiar la implementación); su buscador responde preguntas frecuentes, no fotos.

**[7] TCS New York City Marathon — galerías de fotos (NYRR)** — http://www.nyrr.org/tcsnycmarathon/marathon-photos — 2025 — **EXT**
- Qué hace bien: las fotos se agrupan por momento («Finish Line», «Charities», «Team for Kids», «Professional Athletes», «Race Week»…) como tarjetas con título. El bloque de patrocinadores trae cada logo en dos versiones, clara y oscura (pares `_white`/`_black` en las URLs), para los dos temas del sitio.
- Aplica a: 3 (agrupar por momento), 2 y 4 (logos tonales por tema).
- Riesgo: verificado solo por texto, no vi la maqueta; exige logos vectoriales o con transparencia, que no todos los aliados del club tienen.

**[8] UCI Mountain Bike World Series / World Cup Fort William** — https://www.shiftactivemedia.com/case-studies/mountain-bike-world-series · https://www.hillside.agency/uci-mountain-bike-world-cup · https://www.ucimtbworldseries.com/ — **FUENTE** (+ **NAV** del sitio)
- Qué hace bien: Shift Active Media creó tipografía propia, logo, colores y sistema gráfico; un color distingue los dos formatos (Gravity / Endurance) y aparece en pantalla, marcadores de recorrido y jerseys de ganadores. Hillside lleva 20 años haciendo para Fort William una creatividad nueva cada año, con «una mezcla de estilos de diseño, fotos e ilustraciones» para carteles, redes, señalética, banderas y web.
- Aplica a: 3 (color por categoría que coincida con la señalética de la pista), 1 y 8 (cartel y web comparten sistema).
- Riesgo: el sitio de la serie abre un modal de merchandising al cargar en móvil (NAV); son casos de estudio de marcas grandes: copiar el principio, no la escala.

**[9] Superlocal 2026** (festival de diseño, Montevideo, 7–12-sep-2026) — https://www.superlocaldesign.com/ — 2026 — **NAV**
- Qué hace bien: rejilla tenue de puntos sobre gris, nombre y fechas en tipografía de matriz de puntos, fotos circulares que flotan como «puntos de trama».
- Aplica a: 6 (cifras en matriz de puntos), 1.
- Riesgo: 3 `<canvas>`, ≥ 574 KB de JS, ≥ 2,5 MB de imágenes y 16.454 px de alto: descartar la implementación; se copia solo la idea (rejilla de puntos con `radial-gradient`, cifras con fuente de puntos).

**[10] Sea Harvest** (mercado de pescado, Canberra) — https://www.seaharvest.net.au/ — vigente 2026 — **NAV** (descrito también en la guía de Qode: https://qodeinteractive.com/magazine/websites-inspired-by-poster-aesthetics)
- Qué hace bien: la portada es un periódico. Mancheta con la fecha del día («FRIDAY, OCTOBER 16, 2026»), reglas negras finas que arman la rejilla, papel con grano suave, titular serif + mono, «Continued on page 4» y un recuadro de borde punteado («HOLIDAY HRS») como recorte. Todo con tipografía, bordes y tono de papel; el único blend es `mix-blend-mode: multiply`. Medí ≥ 208 KB de JS y ≥ 691 KB de imágenes (WordPress).
- Aplica a: 1 (mancheta de edición), 5 (enlaces como recortes), 8 (cupón de clase de prueba).
- Riesgo: tono artesanal-retro de tienda; copiar el método (reglas, papel, mancheta), no la tipografía ni los motivos.

### B. Buscadores y galerías de fotos de carrera

**[11] Sportograf** — https://helpdesk.sportograf.com/en/support/solutions/articles/77000591434-all-photo-search-options — 2025-26 (sin fecha visible) — **EXT**
- Qué hace bien: búsqueda principal a la izquierda y alternativas a la derecha: «Smart search», **por categoría + ventana de tiempo en que pasaste por el punto**, por GPS (subes tu traza) y por dorsal.
- Aplica a: 3 (la «manga + hora» del club equivale a «categoría + ventana de tiempo»).
- Riesgo: la búsqueda principal es la selfie (reconocimiento facial): descartada para menores; el paquete se paga.

**[12] FinisherPix y Fotop** — https://help.finisherpix.com/hc/en-us/articles/8425751891095-Find-Your-Photo-Gallery · https://www.finisherpix.com/en · https://www.fotop.com — 2026 — **EXT** (+ **NAV** de una ficha de evento de FinisherPix)
- Qué hacen bien: la caja «FIND YOUR PHOTOS» está en la portada (evento con autocompletar y luego dorsal o nombre); quien se inscribe recibe un correo con enlace directo a su galería. Fotop abre con «Find your photos here — Start typing to query events». FinisherPix cierra la portada con una tira de cifras con unidad debajo: 62 países · 855 eventos · 5.400.000 competidores · 115.000.000 fotos.
- Aplica a: 3, 6.
- Riesgo: selfie como respaldo; paquetes de pago; Fotop pide cuenta para comprar.

**[13] Pic2Go × Brooks PR Invitational** — https://www.endurancesportswire.com/pic2go-partners-with-brooks-to-deliver-free-race-day-photos-at-the-brooks-pr-invitational-2022 · https://www.racedirectorshq.com/read/race-photo-sharing-pic2go-55 — 2022 (nota de prensa); guía actualizada ago-2024 — **EXT**
- Qué hace bien: fotos gratis para atletas de secundaria pagadas por el patrocinador (Brooks), con una «Open Gallery» para buscar, descargar y compartir. La guía cuantifica el valor para el patrocinador (impresiones por fotos compartidas): argumento para presentar a los aliados como quienes hicieron posible la foto gratis.
- Aplica a: 3, 4.
- Riesgo: las fotos salen «etiquetadas y con la marca» (logo del evento y del patrocinador encima): **prohibido** para nosotros.

**[14] Pic-Time 2.0** — https://blog.pic-time.com/features/pic-time-2-0-client-gallery-experience — 2025-26 (sin fecha visible) — **EXT**
- Qué hace bien: modo de selección (varias a la vez), Favoritos y «Colecciones» como sub-galerías; compartir una selección pequeña **como archivos reales, no solo enlace**, con acceso directo a las apps nativas en móvil; interfaz rehecha pensando en el celular.
- Aplica a: 3.
- Riesgo: búsqueda por rostro con IA en el plan avanzado (no); producto de pago para fotógrafos (nosotros ya alojamos).

**[15] ScoutFoto** — https://find.scoutfoto.com — sin fecha — **EXT**
- Qué hace bien: búsqueda por dorsal o correo; «Detailed analytics on photo views and downloads» para el organizador; descarga gratis en calidad completa cuando el evento no cobra.
- Aplica a: 3.
- Riesgo: reconocimiento facial opcional; no vi actividad reciente.

**[16] Minnesota Cycling (liga juvenil de MTB)** — https://minnesotacycling.org/results-archive — 2026 — **EXT**
- Qué hace: «Race Results, Photos & Videos» por fecha, resultados por categoría y equipo, y fotos en SmugMug con **cupón** para 2 descargas gratuitas de baja resolución con marca de agua.
- Aplica a: 3, 5 (línea base).
- Riesgo: es el ejemplo a superar, no a imitar: aquí el original es gratis, sin cupón ni marca.

### C. Recaps y datos

**[17] Strava — Year in Sport** (análisis de 60fps.design) — https://60fps.design/shots/strava-year-in-sports-review-story-interaction-sequence — 2025 — **FUENTE**
- Qué hace bien: recap vertical en «historias», un dato por pantalla: intro con un trazo rojo que se dibuja, mapa que recorre la ruta mientras actualiza cifras, lista de deportes que se desplaza, llama de rachas, rejilla escalonada de fichas de colores y mapa de calor.
- Aplica a: 6.
- Riesgo: animación pesada y datos personales; copiar el ritmo (un dato por pantalla), no el motion.

**[18] Escape Collective — «Brief report and big gallery» (Unbound Gravel 200, 2026)** — https://escapecollective.com/brief-report-and-big-gallery-a-mudfest-at-unbound-gravel-200 — 2026 — **EXT**
- Qué hace bien: recap en tres capas: relato corto, «Brief results» (top 5 con tiempos) y una galería grande; titular y bajada que ya cuentan la carrera.
- Aplica a: 5.
- Riesgo: contenido de medio (parte para suscriptores); los resultados con nombre no aplican a menores.

### D. Estética impresa

**[19] «Women Executives in IT Award»** (BeaversBrothers, Webflow) — https://onepagelove.com/women-executives-in-it-award — nov-2024 — **FUENTE** (reseña de One Page Love; el sitio original ya no está en línea)
- Qué hace bien: tratamiento monocromo + halftone sobre todos los participantes; la reseña lo llama «una técnica inteligente para unificar a las personas cuando el material que recibes es de calidad mixta».
- Aplica a: 4, 7.
- Riesgo: no puedo inspeccionar su CSS. **No** aplicar a las fotos oficiales (las familias quieren la foto real) ni asumir que el halftone anonimiza a un menor.

---

## 2. Técnicas verificadas y su costo

**T1 · Grano de papel estático.**
- Fuentes: CSS-Tricks «Grainy Gradients» (2021, https://css-tricks.com/grainy-gradients); zharr.is (https://zharr.is/posts/grain-of-the-screen: `body::after` fijo, `opacity: .08`, tile de 180 px, `baseFrequency` 0,65–0,8, `numOctaves` 3–4, «los valores más altos queman CPU sin mejora visible»); Common Paper (sept-2023, https://commonpaper.com/blog/speeding-up-common-paper-reducing-image-size-by-99: cambió un PNG de casi 6 MB por SVG con `feTurbulence`, con diferencias de blend entre navegadores y rayas en Firefox al combinar gradiente + filtro); CodeFronts (https://codefronts.com/design-styles/css-grain-texture/grain-paint-cost-and-byte-size-measured: «un grano estático en data-URI es esencialmente gratis una vez pintado; un `filter` SVG vivo no, y `numOctaves` multiplica el trabajo; seis capas con blend son el caso caro»; un PNG sin costuras típico pesa 40–150 KB).
- Aquí: UN tile estático (SVG data-URI o WebP con alfa de 128–180 px, ≤ 2 KB) como `background-image` de un `::after` **sin** `mix-blend-mode` (grano con alfa, `opacity` ≈ .06–.10), solo sobre el hero y 2–3 planchas. La CSP ya permite `img-src … data:`. Va por encima de las tintas, no dentro de cada una (CodeFronts: «el grano pertenece al papel»; en cada tinta se lee como polvo). Evitar `background-attachment: fixed` (criterio propio). Ojo: para la imagen del cerro, ya tramada, sacarle el grano y ponerlo por CSS casi no la aligera (`propuesta.md` midió 148 KB contra 170 KB a 780 px, porque el peso está en los puntos); el grano por CSS vale para las secciones de papel y para la coherencia, no para ahorrar bytes del LCP.

**T2 · Halftone.**
- Fuentes: leanrada.com (https://leanrada.com/notes/pure-css-halftone: `radial-gradient` + `mix-blend-mode: screen` + `filter: brightness() blur() contrast(999)`; admite que «no es una representación muy exacta»); CSS-IRL (https://css-irl.info/css-halftone-patterns: gradiente radial + máscara + `contrast`); CodeFronts (https://codefronts.com/design-styles/css-grain-texture/static-halftone-dot-print-on-a-card: «contraste primero, trama después» —1,5–1,7 y desaturar—, ángulos de 15°/75° para evitar moiré, el paso de trama debe escalar con la superficie y en pantalla 3× un paso de 6 px son 18 px físicos).
- Costo: los filtros de contraste/blur sobre áreas grandes se repintan; sirven para fondos decorativos pequeños o degradados de puntos (el cielo), no para fotos.
- Aquí: la trama de fotos e ilustraciones se hornea en build con sharp **a la resolución final** de pantalla (escalar un raster tramado produce moiré — criterio propio). Para fondos de puntos y numerales, `radial-gradient` con `background-size` fijo.

**T3 · Máscara de una tinta.**
- Fuente: web.dev (https://web.dev/articles/css-masking): `mask-image` con imagen, SVG o gradiente; `mask-size`, repetición; prefijo `-webkit-mask-image`; «Baseline newly available».
- Ya lo hace el proyecto: `scripts/prepare-yumbo-assets.mjs` genera variantes `-ink.webp` con alfa proporcional a la tinta y se pintan con `mask-image` sobre `currentColor`.
- Aquí: extender a **dos tintas = dos máscaras** (lima y grafito) sobre el mismo cerro; el color lo da el token, cero blend si no se superponen, y un `translate` de 2–5 px en la segunda para el registro. El borde de papel rasgado es una máscara SVG estática, un solo archivo reutilizado en todas las secciones.

**T4 · Duotono.**
- Fuentes: Codrops (https://tympanus.net/codrops/2019/02/05/svg-filter-effects-duotone-images-with-fecomponenttransfer: `feColorMatrix` a gris + `feComponentTransfer` con `type="table"`; `discrete` para posterizar) y utilitybend (https://utilitybend.com/blog/revisiting-svg-filters-my-forgotten-powerhouse-for-duotones-noise-and-other-effects).
- Aquí: funcionan en runtime pero son filtros SVG; hornear con sharp en build para las fotos decorativas. Ningún filtro SVG sobre la galería.

**T5 · Desregistro y sobreimpresión.**
- Fuente: CodeFronts (https://codefronts.com/design-styles/css-grain-texture/risograph-print-misregistration-texture): duplicar, teñir cada copia con una tinta, desplazar y mezclar con `multiply` (con capas opacas «parece un duplicado roto»); «2–5 px se lee como impresión, más de 8 px como error»; rotar 0,3° da desregistro rotacional; «ilegible por debajo de ~40 px: solo titulares»; «tres composiciones para un elemento: limitar a un hero o un cartel, no a toda la página»; fluorescentes en `oklch` con croma > 0,2 con fallback en hex.
- Aquí: solo en el titular del hero y en el «18»; el resto de la página, una tinta. El «registro corrido unos milímetros» de `propuesta.md` debe quedar en ≤ 5 px CSS (1 mm CSS ≈ 3,8 px: más de 8 px se lee como error). Alternativa sin costo en runtime: pre-componer las dos tintas con su desplazamiento en una sola imagen (criterio propio).

**T6 · Blend modes.**
- Fuentes: MDN (https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mix-blend-mode: mezcla con el fondo del *stacking context*; con `isolation: isolate` en el contenedor no mezcla con lo de atrás); web-features (https://web-platform-dx.github.io/web-features-explorer/features/mix-blend-mode: «Widely available» desde 2022-07-15); Stack Overflow (https://stackoverflow.com/questions/33795350/mix-blend-mode-scroll-lag-issues: scroll lento en Chrome y Firefox mientras el elemento está en pantalla; mejora con `isolation` en la capa de abajo y sin `transform` en el mismo elemento; un comentario reporta 5 fps con una sola imagen en Chrome 61).
- Aquí: `multiply` solo en elementos pequeños y estáticos (los 24 logos sobre papel crema), dentro de un contenedor con `isolation: isolate`; nunca en overlays fijos de pantalla completa (como el de zharr.is) ni junto a animaciones de `transform` en el mismo nodo. Probar en un Android de gama baja. No usar blend sobre texto (el contraste no se puede medir).

**T7 · Animación ligada al scroll y tipografía cinética.**
- Fuentes: web-features (https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations: Chrome/Edge 115 en 2023, Safari/iOS 26 el 15-sep-2025, Firefox no; «disponibilidad limitada»); 3str.net (13-sep-2026, https://www.3str.net/blog/kinetic-typography-in-web-design: CSS primero, `@supports (animation-timeline: scroll())`, estado final visible sin soporte, `prefers-reduced-motion`). Ojo: ese artículo dice «Safari 16.4+», que contradice a web-features; usar este último.
- Aquí: coincide con la regla del proyecto. Un iPhone con iOS < 26 y todo Firefox verán el estado final estático: diseñarlo para que funcione así.

**T8 · Web Share API.**
- Fuentes: MDN (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share: HTTPS, gesto del usuario y política `web-share`; `files` con `image/jpeg`, `png`, `avif`…; comprobar con `navigator.canShare()`); web-features (https://web-platform-dx.github.io/web-features-explorer/features/share: Chrome Android 61, Chrome 128 en escritorio, Safari iOS 12.2, Firefox escritorio no).
- Estado del proyecto (leído en `public/.htaccess`): `Permissions-Policy` solo bloquea cámara, micrófono y geolocalización, así que `web-share` no está bloqueado; el `fetch` del archivo debe ser del mismo origen (`connect-src 'self'`).
- Aquí: compartir la variante «web» (1.600 px, unos cientos de KB), no el original de 5–15 MB (WhatsApp recomprime y se evita subir 10 MB por datos móviles — criterio propio); respaldo con `wa.me`. Por verificar en un iPhone: si «Guardar imagen» en la hoja de compartir lleva la foto a Fotos (el atributo `download` guarda en Archivos).

**T9 · SVG-filters animados.**
- Fuente: foro de GSAP (https://gsap.com/community/forums/topic/33075-gsap-and-feturbulence-mobile-performance): «los filtros SVG son terribles para el rendimiento… solo en ráfagas cortas o en áreas pequeñas»; en iOS la pestaña llega a recargarse o cerrarse.
- Aquí: ningún `feTurbulence` ni `feDisplacementMap` animado; el borde rasgado es una máscara estática (T3).

---

## 3. Ideas por sección de la página

### 1 · Apertura
*Diagnóstico:* tarjeta redondeada sobre fondo claro con patrón topográfico = hero de plantilla; no dice «válida de Yumbo».
1. **Cartel en dos tintas, con las mismas piezas del Instagram.** Cielo lima plano (color de token) y cerro de Yumbo en trama lima como máscara de una tinta (T3; si basta una silueta plana, ya existe `cerro-yumbo-solid.webp`, 36 KB); papel `#f4f2eb` con grano (T1); «18» enorme en grafito con relleno de trama (`background-clip: text` + `radial-gradient`, número real en el DOM y color sólido de respaldo); titular itálico 800 cortado por el borde y con desregistro de ~3 px (T5). Refs: [1] [10].
2. **Si se conserva alguna foto en la apertura** (`propuesta.md` recomienda solo el cerro, para no abrir con el primer plano de un niño ni en la vista previa de WhatsApp), que sea la de la pista vacía como recorte de papel rasgado pegado sobre el cartel (máscara SVG estática, sin sombras), no una tarjeta redondeada.
3. **Mancheta de edición** «VI Válida · 18-oct-2026 · Pista Carlos Castro» con reglas finas arriba y abajo [10], y un sello circular «VI» como el «20E EDITIE» de Venloop [6].
4. **Aliado titular como lockup** «Presentada por» bajo el logotipo, con regla fina [3]. Condicional: confirmar con el club si existe esa jerarquía.
*Presupuesto (criterio propio):* LCP = una sola imagen WebP pre-compuesta, en el orden de lo ya medido en `propuesta.md` (119 KB en escritorio a 1440 px; 106–116 KB en celular a 640 px), con `fetchpriority="high"` y dimensiones fijas (CLS); la trama pesa por los puntos, así que conviene una variante móvil aún más liviana (menos densidad de puntos); grano y puntos como pseudo-elementos que no bloquean el LCP; titular y botón dentro de los primeros ~700 px de un teléfono de 390 px; texto solo sobre zonas planas, nunca sobre la trama (WCAG 1.4.3).

### 2 · Franja de aliados
*Diagnóstico:* 24 logos en dos filas sobre papel blanco: correcto, pero indistinguible de cualquier «logo wall».
1. **Papel `#f4f2eb` + `multiply` en los logos** (T6) para que desaparezcan los fondos blancos (cinco logos los traen pegados, según `concepto-aliados-web.md`; hoy el papel es blanco justamente por eso). Contenedor con `isolation: isolate`. Con ese papel cada canal baja ~4–8 % (un azul puro pasa de 255 a 235): validar con los aliados de colores saturados y con los de fondo blanco.
2. **Pliego de pruebas:** reglas finas entre casillas y numeración 01–24 en mono pequeño [10]; sin sombras ni vidrio. En móvil, la valla ligada al scroll que ya tienen es mejor que la marquesina continua de Crankworx [4] (WCAG 2.2.2).
3. **El titular nombra el gesto, no el número:** en vez de «24 aliados le apostaron…», decir qué pusieron, con los roles que ya existen en los datos (`allyCreditLine`), como el Tour [5].
4. **Mantenerla baja** (~134 px en un Pixel 7, según el concepto del 7-oct) y con el salto directo a las fotos desde el hero (ver 3.4).

### 3 · Fotos oficiales
1. **Chips de categoría/manga en la primera pantalla.** Sticky bajo el header, con contador («Sub-9 · 142 fotos») y estado en la URL (`#categoria=sub-9`) para compartir por WhatsApp. La «manga + hora» del plan del lunes es la «categoría + ventana de tiempo» de Sportograf [11]; después, «placa» como en FinisherPix/ScoutFoto [12][15] (sin nombre, sin rostro).
2. **Decir el valor sin letra chica,** junto al botón: «Gratis · tamaño original · sin marca de agua · gracias a [N] aliados». La liga de Minnesota usa cupones y baja resolución [16]; Unbound pone «FREE photo… thanks to Garmin» [2].
3. **Compartir y guardar de verdad:** «Compartir esta foto» con `navigator.share({ files })` (variante web) y respaldo `wa.me`; «mi selección» guardada en `localStorage` (sin cuentas ni PII) con descarga una a una (sin ZIP, ya decidido) [14] (T8).
4. **Orden y medición.** [1] y [2] ponen las fotos justo tras el hero; aquí la franja de aliados va en medio. Sin cambiar el orden, garantizar que la primera fila de miniaturas aparezca dentro de ~1,3 pantallas (botón y chips del hero con ancla directa) o, si se admite tocar el orden, bajar la franja tras la galería (el muro ya agradece). Agrupar como NYRR (por momento: salida / pista / premiación) cuando la categoría no baste [7]; medir vistas y descargas por categoría como ScoutFoto [15] (recordar que `Analytics.astro` repite las listas de eventos y parámetros: declarar en ambos sitios).

### 4 · Muro de aliados (grafito)
1. **Una placa de papel por aliado con su gesto en una línea** («puso los trofeos», «el sonido», «las medallas»), no con adjetivos: modelo SBT GRVL («24 young athletes») [3] y Tour («the white jersey») [5]. Solo con datos reales (regla del proyecto).
2. **Jerarquía por tamaño de placa** (titular 2×, patrocinadores 1×, apoyo ½) y un rótulo en voz del club, «Gracias a:» / «Brought to you by:» [1]; sin cintas, brillos ni vidrio.
3. **Tratamiento uniforme del fondo de la placa**, no de los logos (los logos no se alteran por contrato de marca): la idea del halftone unificador [19] da coherencia a material de calidad dispareja.
4. **Un aliado con párrafo propio y beneficio concreto para las familias** (The Big Lost con su hotel: «save up to 25 %») [1], si alguno ofrece algo a los inscritos.

### 5 · Resultados / crónica
1. **Bloque «Resultados y fotos» en dos botones de igual peso,** como Unbound [2], y una fila separada para cada categoría infantil (Unbound separa «Kids Crit» con sus resultados y fotos).
2. **Recap en tres capas** [18]: párrafo corto, «resultados breves» en tabla mono con reglas (por categoría y placa; **sin nombres de menores**, salvo autorización del club) y enlace a la galería.
3. **Enlaces como recortes de periódico** (borde punteado, «Continúa en…») [10]. La lista de PDFs por fecha de Minnesota [16] no es el modelo: resumen por categoría arriba del PDF.

### 6 · Cifras de la jornada
1. **Una «plancha» por dato:** número gigante, unidad debajo, regla fina, una línea de contexto [12][17]. Numerales con relleno de trama o contorno (`-webkit-text-stroke`), con el número real en el DOM.
2. **Matriz de puntos como fuente de las cifras** [9], con una fuente de puntos o `radial-gradient` en `background-clip: text`; sin canvas.
3. **Entrada con `animation-timeline: view()`** solo con `transform`/`opacity`, estado final visible sin soporte (T7). Los números que «corren» con `@property` (opcional en `propuesta.md`) animan una propiedad que no es `transform`/`opacity`: solo si `docs/04` §2.5 lo admite como excepción (no verifiqué el soporte de `@property`). Cada cifra con su fuente (regla del proyecto).

### 7 · La pista (línea de tiempo)
1. **La línea de tiempo como perfil de etapa:** SVG estático generado en build con `elevationProfile()` (ya existe) y los hitos (Juegos Nacionales, Panamericanos Junior) como banderines sobre el perfil, con una línea de datos «distancia | desnivel» como en [1]; solo con datos reales de la pista.
2. **Fotos históricas de calidad dispareja:** monocromo + trama uniforme [19] (solo archivo y piezas decorativas; nunca fotos de las familias).
3. **Hitos como entradas de periódico:** fecha en mono, sin tarjetas, con el mismo borde rasgado reutilizado entre secciones (T3).
4. **Botón «Descargar GPX»** si se publica `src/data/la-pista.gpx`, como los botones por distancia de la página de rutas de Unbound (RWGPS / Garmin Connect, https://www.unboundgravel.com/routes/, EXT).

### 8 · Cierre teal
1. **Una sola tinta teal plana + grano (T1)** y el titular itálico recortado por el borde; sin degradado.
2. **«Próximas paradas» como lista corta de fechas** del calendario real, al estilo de «Future Dates» de Unbound [2].
3. **La clase de prueba como cupón recortable** (borde punteado, «Presenta este cupón») [10], pero con un botón real, no una imagen.
4. **Agradecimiento final** «Gracias a los 24 aliados…» con enlace al muro; modelo «Junior Scholarship» de SBT GRVL [3] solo si hay becas o cupos con cifras reales (preguntar al club).

---

## 4. Lo que NO conviene copiar (y por qué)

- **Video a pantalla completa, WebGL/WebGPU/canvas y scroll secuestrado.** «Lightweight» (Awwwards SOTD 15-feb-2026: video a pantalla completa y scroll 3D, https://www.awwwards.com/sites/lightweight), «Run Rob Run» (Honorable Mention 21-ago-2026: escena WebGPU/Three.js con GSAP, https://www.awwwards.com/sites/run-rob-run), Superlocal [9] (3 canvas, 574 KB de JS), el hero con video de SBT GRVL [3] y «day one® Run» (Webflow con Lenis y GSAP; a los 4 s la página medía solo 844 px de alto, es decir, scroll controlado por JS; https://day1-run.webflow.io/, NAV). Rompen LCP e INP en un Android de gama media.
- **Sitios de 1–1,7 MB de CSS o ≥ 1,5 MB de JS.** Red Bull Rampage (1,19 MB de CSS y 98 recursos JS, NAV), las tres webs de Life Time (Unbound, Sea Otter, Leadville: ~1,7 MB de CSS cada una, NAV), Bandit Running (329 recursos, NAV). Prueba de que «premium» no es «pesado»: copiar la idea, nunca la pila.
- **Marca de patrocinador sobre la foto** (Pic2Go [13]) y **reconocimiento facial o selfie** (Sportograf, FinisherPix, ScoutFoto, Pic-Time con IA): regla dura del club y biometría de menores.
- **Cupones y baja resolución** (Minnesota [16]): justo lo que el club puede superar.
- **Ventanas emergentes al cargar** (modal de merch de UCI MTB WS, newsletter de SBT GRVL) **y banners de cookies que cubren 30–60 % de la primera pantalla en móvil** (Tour, Red Bull, Cape Epic, Rapha, The Traka, todo NAV). El `ConsentBanner` del club debe ser compacto y no tapar «Buscar mis fotos».
- **Marquesinas continuas sin pausa** (WCAG 2.2.2): mantener la valla ligada al scroll.
- **`mix-blend-mode` o `filter: contrast(999)` en áreas grandes o fijas** (overlay `position: fixed` + `multiply` de zharr.is; el halftone de leanrada): jank y consumo (T6, T9).
- **Desregistro en texto de cuerpo o en 3+ capas por todo el sitio** (ilegible < ~40 px; «hero o cartel, no toda la página») y **grano por tinta** (se lee como polvo).
- **Depender de `animation-timeline` sin respaldo:** Firefox y iOS < 26 no la tienen (T7).
- **Rótulos y cifras de plantilla** («Our Partners», «Trusted by», números sin fuente): es lo que el usuario rechaza como «luce de IA».
- **La estética retro «de tienda»** de Sea Harvest o Peppa Sauce: copiar el método (reglas, papel, mancheta), no la tipografía ni los motivos; la identidad es teal + lima + grafito + itálica 800.

---

## 5. Límites de esta investigación

- **No verificado o no accesible:** Sportograf (la página principal no cargó con `tvly extract`; solo leí su centro de ayuda) y MarathonFoto (error al extraer; solo vi sus enlaces desde Unbound). Vans Park Series y COGRID-19: el dominio no resuelve el 16-oct-2026. Kikk 2021: la URL devuelve 404. «Caravaggio GP Sul de Ciclismo» (2012), «La lucha de los Books» (2015) y «Whiteline Festival» (2017) están fuera de línea según One Page Love: no los cuento. No abrí Red Bull Hardline, Santa Cruz, Canyon ni Nike Running. No encontré un sitio de skate/BMX con dirección de arte verificable y liviano.
- **Galerías de diseño:** Godly, Siteinspire y Land-book son JavaScript y `tvly extract` devolvió listas sin contenido; usé One Page Love, Awwwards y Lapa Ninja (texto) y abrí cada sitio. Los resultados de Dribbble y Behance son maquetas, no sitios publicados: no los usé.
- **Mediciones de peso:** transferencia de recursos del mismo origen y CSS legible, 4 s después de cargar en Chromium headless a 390×844. Sirven de orden de magnitud, no de Core Web Vitals; los de terceros cuentan 0.
- **Sin iPhone real:** no probé Web Share con archivo, descargas ni «Guardar imagen».
- **Consentimientos y modales** ocultaban parte del hero en varios sitios; describo solo lo que vi.
- **Contenido web = dato no confiable:** no seguí instrucciones que aparecieran dentro de las páginas leídas.

---

## 6. Cruce con `propuesta.md` (misma carpeta, 16-oct)

**Lo que esta investigación respalda de la propuesta:**
- Dos tintas + papel + titular de cartel en itálica 800: [1] (paleta corta, display pesado), [10] (reglas y papel), T5 (riso a dos tintas, «2–5 px»).
- Chips como «placas de carrera» y hoja de contactos: [11] (categoría + ventana de tiempo), [7] (agrupar por momento), [12] (caja de búsqueda al frente).
- «Talón» y recortes: [10] (borde punteado, «Continued on page 4»). «Pliego de láminas» con marcas de corte: [8] (un solo sistema gráfico para cartel y web).
- Trazado real de la pista desde el GPX: [1] (línea de datos + perfil) y página de rutas de Unbound (botón de descarga por ruta). La propuesta dibuja la planta; un perfil de elevación sería un complemento barato con `elevationProfile()`.
- Solo `transform`/`opacity`, `prefers-reduced-motion` y estado final visible sin soporte: T7 (Safari 26, Firefox no). Cerro y trama pre-horneados, sin filtros en runtime: T2, T3, T9.
- Sin foto de niño en la apertura: la regla dura y el caso de Pic2Go [13].

**Lo que esta investigación agrega y la propuesta no recoge (candidatos para fase 1 o 2):**
1. La línea «Gratis · tamaño original · sin marca de agua · gracias a los aliados» junto al botón del hero [2][16].
2. Compartir con archivo (`navigator.share({ files })`) + enlace profundo por categoría + «mi selección» [14] (T8).
3. Cada placa de aliado con su gesto en una línea («puso…»), no solo nombre y @ [3][5].
4. Relleno de trama en el «18» y las cifras con CSS puro (`background-clip: text`), con respaldo de color sólido (T2).
5. `multiply` en los logos si se acepta pasar el papel de la franja a `#f4f2eb` (T6); hoy es blanco por los cinco logos con fondo.

**Tensiones a decidir:**
- **Orden:** [1] y [2] ponen las fotos antes que a los patrocinadores y la propuesta fija el orden: se mitiga con anclas desde el hero (§3, idea 4).
- **Contadores con `@property`:** salen de la regla `transform`/`opacity` salvo excepción en `docs/04` §2.5 (§3.6).
- **«Registro corrido unos milímetros»:** limitarlo a ≤ 5 px CSS (T5).
- **Peso de la apertura:** la propuesta mide 119 KB (escritorio) y 106–116 KB (celular); como el peso está en los puntos, una variante móvil con menos densidad de puntos es la palanca real (§3.1).

---

## 7. Fuentes

**Abiertas en navegador (NAV, 16-oct-2026, 390×844):**
https://biglostidaho.com/ · https://www.unboundgravel.com/results · https://www.sbtgrvl.com · https://www.crankworx.com · https://www.letour.fr/en/ · https://www.venloop.nl/ · https://www.ucimtbworldseries.com/ · https://www.superlocaldesign.com/ · https://www.seaharvest.net.au/ · https://www.finisherpix.com/en/event/11313/ · https://www.redbull.com/us-en/events/red-bull-rampage · https://www.rapha.cc/ · https://www.thetraka.com/ · https://day1-run.webflow.io/ · https://banditrunning.com/ · https://www.seaotterclassic.com/ · https://www.leadvilleraceseries.com/

**Leídas con `tvly extract` (EXT):**
- Eventos y marcas: https://www.unboundgravel.com/ · https://www.unboundgravel.com/routes/ · https://www.sbtgrvl.com · https://www.crankworx.com · https://www.shiftactivemedia.com/case-studies/mountain-bike-world-series · https://www.hillside.agency/uci-mountain-bike-world-cup · https://www.awwwards.com/sites/stichting-venloop · http://www.nyrr.org/tcsnycmarathon/marathon-photos · https://www.awwwards.com/sites/day-one-r-run · https://www.awwwards.com/sites/bandit-running
- Fotos: https://helpdesk.sportograf.com/en/support/solutions/articles/77000591434-all-photo-search-options · https://help.finisherpix.com/hc/en-us/articles/8425751891095-Find-Your-Photo-Gallery · https://www.finisherpix.com/en · https://www.fotop.com · https://find.scoutfoto.com · https://blog.pic-time.com/features/pic-time-2-0-client-gallery-experience · https://www.endurancesportswire.com/pic2go-partners-with-brooks-to-deliver-free-race-day-photos-at-the-brooks-pr-invitational-2022 · https://www.racedirectorshq.com/read/race-photo-sharing-pic2go-55 · https://minnesotacycling.org/results-archive
- Recaps y estética: https://60fps.design/shots/strava-year-in-sports-review-story-interaction-sequence · https://escapecollective.com/brief-report-and-big-gallery-a-mudfest-at-unbound-gravel-200 · https://onepagelove.com/women-executives-in-it-award · https://qodeinteractive.com/magazine/websites-inspired-by-poster-aesthetics · https://onepagelove.com/tag/halftone · https://onepagelove.com/tag/torn-paper · https://onepagelove.com/color/duotone · https://onepagelove.com/tag/cycling · https://www.awwwards.com/inspiration/partners-superlocal-design-festival-25
- Técnicas: https://css-tricks.com/grainy-gradients · https://zharr.is/posts/grain-of-the-screen · https://commonpaper.com/blog/speeding-up-common-paper-reducing-image-size-by-99 · https://codefronts.com/design-styles/css-grain-texture/risograph-print-misregistration-texture · https://codefronts.com/design-styles/css-grain-texture/grain-paint-cost-and-byte-size-measured · https://codefronts.com/design-styles/css-grain-texture/static-halftone-dot-print-on-a-card · https://leanrada.com/notes/pure-css-halftone · https://css-irl.info/css-halftone-patterns · https://web.dev/articles/css-masking · https://tympanus.net/codrops/2019/02/05/svg-filter-effects-duotone-images-with-fecomponenttransfer · https://utilitybend.com/blog/revisiting-svg-filters-my-forgotten-powerhouse-for-duotones-noise-and-other-effects · https://www.freecodecamp.org/news/grainy-css-backgrounds-using-svg-filters · https://stackoverflow.com/questions/33795350/mix-blend-mode-scroll-lag-issues · https://gsap.com/community/forums/topic/33075-gsap-and-feturbulence-mobile-performance · https://oliverspies.blog/articles/using-mix-blend-mode-with-partly-transparent-images · https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/mix-blend-mode · https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share · https://web-platform-dx.github.io/web-features-explorer/features/share · https://web-platform-dx.github.io/web-features-explorer/features/scroll-driven-animations · https://web-platform-dx.github.io/web-features-explorer/features/mix-blend-mode · https://www.3str.net/blog/kinetic-typography-in-web-design

**Solo vistas en resultados de búsqueda (no abiertas):**
https://www.awwwards.com/sites/lightweight · https://www.awwwards.com/sites/run-rob-run
