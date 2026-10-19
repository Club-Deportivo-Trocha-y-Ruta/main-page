# Revisión de conjunto de `/copa-valle-yumbo-2026`

> 8-oct-2026 · Mirada de página entera, después del rediseño por piezas · Vista previa con 420 fotos de prueba.
> Cómo se midió: Chromium (Playwright) en 1920×1080, 1440×900, Pixel 7 (412×839), 360×640 y, para tabletas, 768×1024 y
> 1024×768; temas claro y oscuro; recorrido de la página entera cada 400 px antes de capturar. Alturas, bordes y tipografía de
> cada sección medidos en el DOM; contraste entre secciones medido sobre píxeles; qué cubre el índice medido cada 200 px de
> scroll; botones lima a la vista medidos cada 50 px; truncamiento del índice probado en 320 a 430 px. **Los arreglos que cito con
> medidas se probaron como prototipos inyectados en el navegador: el repo no se tocó.** No se midió LCP/CLS (ya estaban en
> `revision-opus-rediseno.md`), ni Safari/iOS, ni dispositivos reales.

## Veredicto

1. Las piezas están bien (franja, muro, índice, tiras de la galería) y la página tiene arco: apertura y banda pesadas, galería
   neutra, muro pesado y una segunda mitad tranquila. Lo que falla es de conjunto, no de pieza: **la apertura repite en cifras
   (420 · 16 · 22) lo que la página dice enseguida** y deja la franja de aliados bajo el pliegue en 1440×900; y la segunda mitad
   (Resultados + Cifras + La pista) pesa el 32 % de la página en escritorio y el 34–35 % en móvil, empezando por una sección entera
   para un solo enlace.
2. Con los dos hallazgos altos (≈ 45 min) la primera pantalla de 1920×1080 queda completa (apertura, los 16 logos y la banda
   «16 aliados») y la página baja unos 590 px en escritorio y 440 px en móvil.
3. Lo demás es pulido, y se arregla con clases: los titulares saltan entre dos bordes izquierdos (352 y 480 px), tres cortes feos
   en el teléfono (resaltado partido en 2 titulares, «B» huérfana en un botón, «Próxima v…» truncada en el índice) y dos botones de
   WhatsApp seguidos que compiten.
4. Tema oscuro y móvil: nada se ve sin terminar (papel, placas, filetes), sin desborde horizontal y con áreas táctiles de 44 px
   salvo tres enlaces y el campo de placa (40 px). En oscuro quedan tres detalles menores: el cierre grafito se funde con el pie
   (12), el índice se pierde sobre el grafito (15) y el escenario del muro pierde fuerza (16).

## Lo que la vista previa no enseña (datos reales de hoy)

Los JSON reales traen `edicion2026: null`, `resultsUrl: null`, `chronicle: null`, `album: null`, `photographer.name: null` y
`hero.photoId: null`. El día del lanzamiento (lun 19) la página no tendrá: botón «Resultados oficiales» ni sección `#resultados`,
bloque «La edición 2026» en Cifras, tercera cifra en la apertura, crédito del fotógrafo ni foto de la carrera en el hero. Con eso, la
apertura queda con **dos** cifras (420 y 16, ambas repetidas) y el índice con cinco entradas. Cuando llegue el enlace de resultados
(antes que la crónica y el álbum) aparece `#resultados` con **una** sola tarjeta: ese estado dura días y es el del hallazgo 2.

## Hallazgos

| # | Severidad | Dónde | Qué pasa (medida o captura) | Arreglo concreto |
|---|---|---|---|---|
| 1 | **Alta** | Apertura · `copa-valle-yumbo-2026.astro` l.193–199 y 416–424 (`stats`, `statsGridClass`), `valida.ts` `heroStats` | Las tres cifras (420 · 16 · 22) están repetidas en la misma página: 420 en el índice («Fotos 420») y en el chip «Todas 420»; 16 en la banda de 88 px, 380 px más abajo, y además en el índice, la bajada del muro y el visor; 22 en «La edición 2026» de Cifras. Con datos reales quedan 420 y 16, las dos repetidas. La fila (icono + cifra + etiqueta ×3) cuesta **168 px en escritorio (182–201 en móvil)** y deja la franja bajo el pliegue en 1440×900: los logos empiezan a 875 px de 900. Es además la fila de «tres cifras» de plantilla. `conjunto-escritorio-1440-claro-16-repetido.png` | Quitar el `<div>` de las cifras (l.416–424), `stats`, `statsGridClass` y `heroStats` con su test. **Prototipo medido** (fila oculta): apertura 709→541 px (988→806 en Pixel 7); a 1440×900 los 16 logos entran enteros (683–865 px) y a 1920×1080 también la banda «16 aliados» (865–987). La cifra sigue en el chip, el índice, la banda y Cifras. `conjunto-prototipo-1920-sin-cifras-en-la-apertura.png`, `conjunto-prototipo-1440-sin-cifras-en-la-apertura.png` |
| 2 | **Alta** | `#resultados` · `copa-valle-yumbo-2026.astro` l.608–664 (`recap`) | Con una sola tarjeta es una sección completa de **553 px (escritorio) / 472–491 px (móvil)** para un enlace que ya está en el botón «Resultados oficiales» de la apertura. «Resultados oficiales» se lee tres veces seguidas (antetítulo, H3 de la tarjeta, bajada «Aquí están los resultados oficiales») y la tarjeta (icono en cuadro tintado + título + texto + enlace) es la ficha de plantilla; a 1920 ocupa 578 de 1.216 px y deja la derecha vacía. `conjunto-escritorio-1920-claro-resultados-una-tarjeta.png` | Con `recap.length === 1`, una banda de una fila en vez de la sección: `SectionShell tone="plain" spacing="compact"` sin `SectionIntro`, con icono + «Resultados oficiales de la jornada» + fuente a la izquierda y el botón `outline` a la derecha (`flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between`, ancho `wide`). **Prototipo medido: 553→128 px (escritorio), 472→215 (móvil).** Con 2–3 tarjetas se queda como está; con 0 no se pinta (hoy). `conjunto-prototipo-1440-resultados-en-banda.png`, `conjunto-prototipo-pixel7-resultados-en-banda.png` |
| 3 | Media | Bordes de columna · `resultados`, `la-pista`, `siguiente` en `width="default"` | Los titulares alternan entre dos bordes izquierdos: `inicio/fotos/aliados/cifras` a **352 px** (112 px en 1440) y `resultados/la-pista/siguiente` a **480 px** (240): 352 · 352 · 352 · 480 · 352 · 480 · 480, y el cierre queda 128 px a la derecha del pie (352). En 1920 se ve en cada salto de sección; en móvil no pasa (16 px). `conjunto-panoramica-escritorio-1920-claro-oscuro-2.png` (guías en 352 y 480) | `width="wide"` en `resultados` y `siguiente`; en `la-pista`, `align="center"` en su `SectionIntro` (el eje de la Timeline es central; mismo patrón que `quienes-somos`) o `width="wide"`. Medido con el cambio: todos los titulares a 352 px salvo La pista centrada |
| 4 | Media | Índice · `valida.ts` `dockItems` (etiquetas), `SectionDock.astro` | En 360, 375 y 390 px la mitad izquierda de la píldora corta **«Próxima válida» como «Próxima v…»** cuando esa es la sección actual (texto de 105 px en 88, 96 y 103 px); en 412 cabe. §31 dice que cabe sin cortarse. Sin próxima parada la etiqueta sería «Clase de prueba», más larga. En escritorio esa entrada nunca llega a ser la actual: el pie entra antes de que `#siguiente` pase la línea de lectura y el índice se aparta. `conjunto-movil-360-indice-truncado-antes-despues.png` | «Próxima» (prototipo a 360: cabe, sin truncar) y «Clase gratis» (el texto del botón de la cabecera en móvil) en vez de «Clase de prueba». Actualizar `valida.test.ts` (l.1048 y 1104), `SectionDock.astro.test.ts` (l.20) y la nota de §31 |
| 5 | Media | Titulares · `ValidaAllies.astro` (`title`/`highlight` del muro) y `copa-valle-yumbo-2026.astro` (La pista) | En todos los teléfonos (320 a 412 px) el trazo lima de **«le apostaron»** y de **«Juegos Nacionales»** queda partido en dos líneas («le» solo al final de la primera). Desde 768 px no pasa. `conjunto-movil-360-resaltado-partido-antes-despues.png` | Espacio duro (U+00A0, `&nbsp;`) entre las dos palabras del fragmento, en `title` y en `highlight`: «le» + U+00A0 + «apostaron» en `ValidaAllies.astro`; «Juegos» + U+00A0 + «Nacionales» en la página. Prototipo a 360: trazo entero en los 6 titulares y las mismas líneas de H2 |
| 6 | Media | Botón «Ver las N fotos de …» · `RacePhotoGallery.tsx` l.406 (`MORE_BUTTON`) y l.484 | En 412 px el texto cae «…Prejuvenil / **B**» (en 360 corta bien). El botón no tiene `text-balance`, y repite el nombre de la categoría que el titular acaba de decir y el «60 fotos» de la línea de detalle (tres veces en 230 px). `conjunto-movil-pixel7-boton-huerfana-antes-despues.png` | Texto «Ver las 60 fotos» con `<span className="sr-only"> de {chip}</span>` (el nombre accesible no cambia: los tests usan `^Ver las \d+ fotos de `) y `text-balance text-center` en `MORE_BUTTON`. Solo con `text-balance` ya queda «Ver las 60 fotos de / Junior, Élite y Prejuvenil B» (prototipo) |
| 7 | Media | Pie de la galería · `RacePhotoGallery.tsx` `FamilyCard` (l.1073–1100) y la fila de compartir (`copa-valle-yumbo-2026.astro` l.515–526) | «Escribir por WhatsApp» (lima, ayuda) y 100 px después «Compartir por WhatsApp» (verde WhatsApp): dos botones de relleno del mismo tamaño y dos verdes que compiten, a la vista juntos entre 3.600 y 4.500 px de scroll en los cuatro tamaños. El lima es el color del llamado principal (Buscar mis fotos, Conócelos, Clase de prueba) y aquí se gasta en el recurso de ayuda. Son tres bloques de tres estilos (tarjeta con anillo, fila suelta, tarjeta con anillo). `conjunto-movil-pixel7-claro-pareja-whatsapp.png` | «Escribir por WhatsApp» en contorno (como «Conoce la pista»: `border-2 border-primary-deep text-primary-deep bg-transparent`) y dejar el verde de compartir como único relleno de la zona |
| 8 | Media | `#la-pista` · Timeline con 4 hitos | Repite lo que ya cuenta `/la-pista` y, además, tiene el botón a ella: **1.573 px en escritorio, 1.762 en Pixel 7 y 1.859 en 360** (2,1 pantallas). Con Resultados y Cifras, el 32 % de la página (3.622 de 11.191 px), 34 % en Pixel 7 (4.808 de 14.058) y 35 % en 360, todo después del muro y en tonos casi iguales (resultados→cifras 1,09:1, cifras→pista 1,06:1). En 1920 el zigzag deja la mitad del ancho vacía en cada hito. Es decisión del plan (§3.5), por eso no es alta | Dejar «La casa» y «2012» (lo que explica por qué esta válida es en casa) y mandar el resto con «Conoce la pista»: `trackHistory.slice(0, 2)` → unos −376 px en escritorio y −468 en móvil. Si el club quiere los cuatro, que al menos el intro vaya centrado (hallazgo 3) |
| 9 | Media | `#cifras` · `ValidaNumbers.astro` | (a) La bajada («Conteos de los resultados oficiales: … (2022, 2024 y 2025). Sin nombres.»), el H3 «2022, 2024 y 2025» y la nota al pie («Datos: conteos de los resultados oficiales … 2022, 2024 y 2025. Sin nombres.») dicen lo mismo tres veces. (b) 15 iconos que no llevan dato (3 + 6 de `FactGrid` + 6 de las tarjetas), seis tarjetas KPI de anillo + icono + prefijo y seis etiquetas en mayúsculas espaciadas: el tablero de KPI de plantilla. (c) En móvil son 2.574 px (3,07 pantallas): 862 la edición 2026 y 1.141 las históricas, apiladas. (d) Es la única sección sin paso siguiente (§2.4) | (a) Bajada: «Conteos de los resultados oficiales, sin nombres: los de esta válida y los de las anteriores con registro.» y la fuente solo en la nota. (b) Quitar el icono de las seis tarjetas históricas (el prefijo ya orienta) y dejar el de las tres destacadas. (c) No pasarlas a dos columnas: lo probé y ahorra solo 275 px y parte los textos en 3 líneas. (d) Si el hallazgo 2 se queda en banda, es su paso siguiente natural |
| 10 | Media | Antetítulos · `SectionIntro` en 7 secciones | 7 antetítulos de 12 px en mayúsculas espaciadas con icono (uno por sección) + 4 rótulos de la Timeline + 6 etiquetas de `FactGrid` = **17 rótulos de mayúsculas espaciadas** en una página. En dos son gemelos del titular («RESULTADOS OFICIALES» y H3 «Resultados oficiales»; «LA PISTA» y «La pista de los Juegos…»), y en el muro conviven con el rótulo cursivo del afiche («ALIADOS» y «Con el patrocinio de»): dos voces de rótulo en la misma sección | Sin `eyebrow` en `resultados`, `la-pista` y el muro (es opcional en `SectionIntro`; el rótulo cursivo ya hace de antetítulo). Las etiquetas de `FactGrid` son del sistema: no tocarlas aquí |
| 11 | Media | Bajada del muro · `ValidaAllies.astro` l.116–119 | «Por ellos las fotos de esta página son gratis para todas las familias. Son 16, en orden alfabético.» repite «gratis» (apertura, banda y visor ya lo dicen) y el «16» (cifra de la apertura, índice, banda y visor). Ver la tabla de repeticiones | «Por ellos las fotos de esta página son gratis para todas las familias. Van en orden alfabético.» (sin «Son 16»). El «gratis» de la banda y el del visor se quedan |
| 12 | Baja | Cierre · `#siguiente` `tone="dark"` | El cierre grafito y el pie son el mismo color (1,00:1; también en oscuro): la sección no se lee como bloque propio y desaparece la silueta de elevación que `Footer.astro` pinta 40 px sobre la sección anterior (la firma del pie, que sí se ve cuando antes hay un tono claro). `/patrocinadores` cierra igual. `conjunto-escritorio-1920-claro-cierre-y-pie.png` | `tone="brand"` (como el cierre de la portada: la silueta del pie sobre el teal) o dejarlo así y aceptar la fusión. Un filete inferior no sirve: la silueta lo tapa (probado) |
| 13 | Baja | Barra de filtros · `RacePhotoGallery.tsx` l.590 | `bg-surface-raised/95 … backdrop-blur`: las miniaturas se transparentan como fantasmas detrás de los chips (vidrio suave, lo que el usuario rechaza). `conjunto-escritorio-1920-claro-barra-filtros-translucida.png` | `bg-surface-raised` opaco, sin `backdrop-blur`. Con cabecera e índice son 253 px fijos en 1440×900 (28 %) y 197 px en Pixel 7 (23,5 %): no tapa nada importante en reposo |
| 14 | Baja | Foto de la apertura · `copa-valle-yumbo-2026.astro` l.397 y 409 | `shadow-raised` es la única sombra suave de la página (el resto es anillo, filete o placa): una foto que flota sobre el degradado `tinted` | `ring-1 ring-hairline` en vez de `shadow-raised` |
| 15 | Baja | Índice sobre grafito · `SectionDock.astro` l.97 | Sobre el muro y el cierre el índice (`bg-surface-dark`) es del mismo color que el fondo y solo lo marca `ring-white/15`. `conjunto-escritorio-1920-oscuro-indice-sobre-muro.png` | `ring-white/30` en la barra |
| 16 | Baja | Muro en tema oscuro · `ValidaAllies.astro` | El escenario grafito (#2F2F2F) es más claro que el fondo oscuro (#1C1E20): 1,25:1 contra la galería y contra Resultados (13,4:1 en claro). Sigue leyéndose como escenario por la trama y las placas, pero sin firma. `conjunto-escritorio-1920-muro-escenario-claro-vs-oscuro.png` | Filete lima superior solo en oscuro, como el de la banda (`dark:shadow-[inset_0_3px_0_var(--color-accent)]` en el `SectionShell`). `conjunto-prototipo-1440-oscuro-muro-con-filete.png` |
| 17 | Baja | Franja en tabletas (768–1023 px) · `ValidaSponsorRibbon.astro` | A 768 px los logos miden 35–44 px de alto (Rapi Wey 79×19): más chicos que en el teléfono (casilla de 100 px, logos de 41 px). A 1024 px, 43–55 px. `conjunto-tableta-768-claro-franja-logos-chicos.png` | Llevar el corte de la valla de 768 a 1024 px (`max-width: 1023.98px`) con casilla de `8rem` desde 640 px, o dos filas de ocho solo desde `lg` |
| 18 | Baja | Botones de la apertura en móvil | El secundario («Resultados oficiales», 260 px) es más ancho que el primario («Buscar mis fotos», 227 px): señales cruzadas. (Con los datos reales de hoy el secundario no existe) | `class="w-full justify-center sm:w-auto"` en los dos |
| 19 | Baja | Áreas táctiles | La miga «Calendario» (92×20 px) y el resumen «Política de imágenes de la válida» (340×23) no llegan a los 24 px de WCAG 2.2 (2.5.8); «Ver en el calendario» tiene justo 24 y el campo de placa 40 | `py-1.5` en la miga y en el resumen, `min-h-11` en «Ver en el calendario». El resto (chips, índice, botones, miniaturas) mide ≥ 44 px |
| 20 | Baja | Barra de anuncios (global, no es de esta página) | A 360 px el texto se parte en cuatro líneas y el icono ↗ queda montado sobre la ×. Después del 18 anunciará la misma «próxima parada» (Roldanillo) que `#siguiente`. `conjunto-movil-360-barra-de-anuncios-global.png` | Avisar al dueño del componente; el 19, revisar si en esta página la barra sobra |
| 21 | Baja | Cabeceras de manga · `mangas.json` | 4 de 8 mangas llevan descripción y 4 no: los bloques de título alternan 2 y 3 líneas | Descripción en todas o en ninguna |
| 22 | Baja | Voces tipográficas | La cursiva 800 del afiche vive solo en la franja y el muro (rótulos y el «16» de 88 px); las cifras de la apertura y de Cifras son 800 recta de 36 px. Sirve como código (cursiva = marcas), pero «Yumbo en cifras» no se parece al resto del estilo de la válida | Criterio del usuario. Si se quiere unificar, solo las tres cifras de «La edición 2026» en 800 cursiva a 48 px |

## Información repetida: qué se queda y dónde

| Dato | Aparece (a la vista) | Se queda en | Sobra en |
|---|---|---|---|
| «16» aliados | cifra de la apertura · banda (88 px) · conteo del índice · bajada del muro («Son 16») · visor («Gratis gracias a 16 aliados») | la banda (es el dato enorme) y el conteo del índice | cifra de la apertura (hallazgo 1) y «Son 16» del muro (11) |
| «420» fotos | cifra de la apertura · conteo del índice · chip «Todas 420» | chip e índice | cifra de la apertura (1) |
| «22» municipios | cifra de la apertura · «La edición 2026» | Cifras | apertura (1) |
| «Gratis» | bajada de la apertura · banda · bajada del muro · visor | apertura (promesa a la familia) y banda (agradecimiento) | bajada del muro (11); el visor se queda porque es el crédito en el momento de la descarga |
| «Resultados oficiales» | botón de la apertura · antetítulo · H3 de la tarjeta · bajada · enlace · ítem del índice · bajada de Cifras | botón de la apertura y, con una tarjeta, la banda | antetítulo, H3 y bajada (2) |
| 2022, 2024 y 2025 | bajada de Cifras · H3 · nota al pie | H3 y nota | bajada (9) |
| Próxima parada | barra de anuncios (desde el 19) · `#siguiente` | `#siguiente` | la barra en esta página (20) |

## Distribución: alturas medidas

| Sección | 1440 y 1920 (px) | Pixel 7 (px · pantallas hasta su inicio) | 360×640 (px · pantallas) |
|---|---|---|---|
| Apertura | 709 | 988 · 0 | 972 · 0 |
| Franja | 346 | 161 · 1,3 | 161 · 1,7 |
| Fotos | 3.881 | 3.607 · 1,5 | 3.606 · 2,0 |
| Aliados | 1.471 | 2.578 · 5,8 | 2.489 · 7,6 |
| Resultados | 553 | 472 · 8,9 | 491 · 11,5 |
| Cifras | 1.496 (240 de cerro) | 2.574 · 9,5 | 2.621 · 12,3 |
| La pista | 1.573 | 1.762 · 12,5 | 1.859 · 16,4 |
| Siguiente | 393 | 567 · 14,6 | 619 · 19,3 |
| Pie | 645 | 1.225 | 1.245 |
| **Total** | **11.191** (1440: 12,4 pantallas · 1920: 10,4) | **14.058** (16,8 pantallas) | **14.208** (22,2) |

Con el índice, cualquier sección queda a un toque: el costo de largo se paga sobre todo al bajar a mano. Los hallazgos 1 y 2 restan
593 px en escritorio y 439 en móvil (medidos); el 8, otros 376 y 468 (estimados de las alturas de cada hito).

## Jerarquía tipográfica (medida)

| Nivel | Valor | Veredicto |
|---|---|---|
| Antetítulo | 12 px · 600 · mayúsculas · tracking .18em · con icono, en las 7 secciones | Uniforme; ver hallazgo 10 |
| H1 / H2 | 30·36·48 px / 24·30·36 px, 700 recta | Coherente en toda la página |
| Bajada | 16 / 18 px, `max-w-2xl` | Coherente |
| H3 | 24 (mangas, hitos) · 20 (cifras, «No encuentras») · 20/18 cursiva 800 (rótulos del muro) · 18 (tarjeta) · 16 («Sobre estas fotos») · 30/24 (cierre) | Seis tratamientos, uno por rol; ninguno choca. Se queda |
| Cifras | 36/30 px 800 recta (apertura, Cifras) · 88/60/44 px 800 cursiva (banda) | Dos voces; ver hallazgo 22 |

## Jerarquía de llamados a la acción

El botón principal de cada pantalla es claro en casi todo el recorrido: apertura → «Buscar mis fotos» (lima, 56 px); banda →
«Conócelos»; galería → ninguno (chips y fotos; los «Ver las N fotos» son neutros); muro → contorno; cierre → «Clase de prueba
gratis». «Buscar mis fotos» y «Conócelos» coinciden en pantalla solo en escritorio y por 200–350 px de scroll, nunca en móvil. El
lima de «Clase de prueba gratis» en la cabecera es global y constante: no se toca. El único choque real es el hallazgo 7.

## Arreglos rápidos (menos de 30 min cada uno, por orden de impacto)

1. **Hallazgo 1**: quitar la fila de cifras de la apertura (≈ 20 min con el test de `heroStats`).
2. **Hallazgo 3**: `width="wide"` en `resultados` y `siguiente`, `align="center"` en el intro de La pista (5 min).
3. **Hallazgo 2**: banda de una fila para Resultados con una tarjeta (25 min).
4. **Hallazgo 5**: espacio duro en `le apostaron` y `Juegos Nacionales` (5 min).
5. **Hallazgo 4**: etiquetas del índice «Próxima» y «Clase gratis» con sus tres tests (10 min).
6. **Hallazgo 6**: texto corto + `text-balance text-center` en `MORE_BUTTON` (10 min).
7. **Hallazgo 7**: «Escribir por WhatsApp» en contorno (5 min).
8. **Hallazgos 11 y 9a**: bajada del muro y bajada de Cifras (10 min).
9. **Hallazgo 10**: sin antetítulo en Resultados, La pista y el muro (5 min).
10. **Hallazgos 13, 15 y 18**: barra de filtros opaca, `ring-white/30` en el índice, botones de la apertura a ancho completo en
    móvil (7 min entre los tres).

## Lo que está bien y no hay que tocar

- **El orden y el arco de peso**: apertura → franja → fotos → muro → resultados → cifras → pista → siguiente. Los saltos
  claro/grafito miden entre 12,6:1 y 13,4:1 en claro; quien baja de las fotos a los resultados pasa por el muro.
- **La franja y la banda**: papel rasgado, filete lima inferior, el «16» enorme en cursiva, una sola parada de tabulación. Con el
  hallazgo 1 resuelto componen la primera pantalla de 1920×1080 entera (`conjunto-prototipo-1920-sin-cifras-en-la-apertura.png`).
- **El muro**: placas iguales, orden alfabético, rótulos cursivos del afiche, `subgrid` (ASCOMY mide lo mismo que las otras
  quince), trama. Los logos nunca van sobre una foto.
- **El índice**: se aparta en la apertura y en el pie, el riel de escritorio (766×56 px) y la píldora móvil (52 px), el conteo, el
  foco y el `<details>`. No tapa nada importante en reposo: medido cada 200 px, solo cubre botones que pasan por debajo al
  desplazar.
- **La galería en tiras**: 3.600–3.900 px en lugar de los 9.000 de antes; sin huérfanas.
- **Tema oscuro**: el papel blanco de la franja y las placas del muro funcionan como estaban pensados; tokens, anillos y filetes
  se ven terminados; el filete lima de la banda separa donde el fondo es casi del mismo grafito.
- **Móvil**: sin desborde horizontal (ancho del documento igual al de la pantalla en 360 y 412), chips, botones e índice de 44 px
  o más, y «Buscar mis fotos» en la primera pantalla.
- **Tipografía**: antetítulo, H2 y bajada son idénticos en las siete secciones.

## Capturas de esta revisión (`capturas/`)

| Archivo | Qué muestra |
|---|---|
| `conjunto-panoramica-escritorio-1920-claro-oscuro-1.png` y `-2.png` | La página entera en 1920, claro a la izquierda y oscuro a la derecha, con los hallazgos numerados y guías en 352 y 480 px |
| `conjunto-escritorio-1920-claro-primera-pantalla.png`, `conjunto-escritorio-1440-claro-primera-pantalla.png` | Primera pantalla hoy: en 1440×900 los logos de la franja quedan bajo el pliegue (1) |
| `conjunto-escritorio-1440-claro-16-repetido.png` | El «16» de la apertura y el de la banda a 380 px de distancia (1) |
| `conjunto-prototipo-1920-sin-cifras-en-la-apertura.png`, `conjunto-prototipo-1440-sin-cifras-en-la-apertura.png` | Prototipo del hallazgo 1: apertura + franja completa (+ banda en 1920) en la primera pantalla |
| `conjunto-escritorio-1920-claro-resultados-una-tarjeta.png` | La sección de una tarjeta y su borde a 480 px (2, 3) |
| `conjunto-prototipo-1440-resultados-en-banda.png`, `conjunto-prototipo-pixel7-resultados-en-banda.png` | Prototipo del hallazgo 2: 128 y 215 px |
| `conjunto-movil-360-indice-truncado-antes-despues.png` | «Próxima v…» y «Próxima» (4) |
| `conjunto-movil-360-resaltado-partido-antes-despues.png` | Resaltado partido y entero en el muro y en La pista (5) |
| `conjunto-movil-pixel7-boton-huerfana-antes-despues.png` | La «B» huérfana y el botón balanceado (6) |
| `conjunto-movil-pixel7-claro-pareja-whatsapp.png` | Los dos botones de WhatsApp seguidos (7) |
| `conjunto-escritorio-1440-claro-tres-capas-fijas.png` | Cabecera, barra de filtros e índice a la vez en 1440×900, con las miniaturas transparentándose (13) |
| `conjunto-escritorio-1920-claro-barra-filtros-translucida.png` | Detalle de la barra de filtros (13) |
| `conjunto-escritorio-1920-claro-cierre-y-pie.png` | El cierre grafito fundido con el pie (12) |
| `conjunto-escritorio-1920-oscuro-indice-sobre-muro.png` | El índice sobre el muro grafito (15) |
| `conjunto-escritorio-1920-muro-escenario-claro-vs-oscuro.png` | El borde galería→muro en los dos temas (16) |
| `conjunto-prototipo-1440-oscuro-muro-con-filete.png` | Antes y después del filete lima del muro en oscuro (16) |
| `conjunto-tableta-768-claro-franja-logos-chicos.png` | La franja a 768 px (17) |
| `conjunto-movil-360-barra-de-anuncios-global.png` | La barra de anuncios a 360 px (20) |
| `conjunto-movil-pixel7-claro-recorrido-completo.png`, `conjunto-movil-pixel7-oscuro-recorrido-completo.png` | Las 17 pantallas de scroll de un Pixel 7, con la sección que marca el índice en cada una |

## Segunda pasada: lo aplicado (8-oct-2026)

La revisión de arriba describe la página **antes** de los cambios; las medidas, capturas y
hallazgos de esta sección son de después. Decisiones del usuario aplicadas con las medidas de los
prototipos; Prettier solo en los archivos tocados; nada en `global.css`; sin git.

| # | Estado | Cómo quedó |
|---|---|---|
| 1 | Aplicado | Sin cifras en la apertura; borrados `heroStats`, `HeroStat`, `HeroStatsInput` y `publishableRunners` (quedaba sin uso) con sus tests |
| 2 | Aplicado | Con una tarjeta, banda de una fila; con dos o tres, sección sin antetítulo (probado con 1, 2 y 3 tarjetas); `recapIntro` pasó a `recapLead` (bajada solo con dos o más) |
| 3 | Aplicado | `resultados` y `siguiente` en `wide`; `la-pista` con intro centrado |
| 4 | Aplicado | `shortLabel` en `DockItem` y `ValidaDockItem`; solo la píldora móvil lo usa; el lector de pantalla oye `label`; «Próxima» y «Clase gratis» |
| 5 | Aplicado | U+00A0 en «le apostaron» y «Juegos Nacionales» (`title` y `highlight`) |
| 6 | Aplicado | «Ver las N fotos» + `sr-only` « de {chip}», con `text-balance text-center` |
| 7 | Aplicado | «Escribir por WhatsApp» de `FamilyCard` en contorno |
| 8 | No aplicado | Pendiente de decisión del usuario |
| 9 | 9a y 9b aplicados | Bajada sin los años y sin icono en las seis tarjetas históricas (9c no se aplicaba; 9d queda con la banda) |
| 10 | Parcial | Sin antetítulo en Resultados y en La pista; el de «ALIADOS» se queda |
| 11 | Aplicado | «Por ellos las fotos de esta página son gratis para todas las familias. Van en orden alfabético.» |
| 12 | Aplicado | `tone="brand"`: pasa 4,5:1 (ver abajo) |
| 13 | Aplicado | Barra de filtros opaca |
| 14 | Aplicado | Foto de la apertura con `ring-1 ring-hairline` |
| 15 | Aplicado | `ring-white/30` en la barra y en la lista del índice |
| 16 | Aplicado | Filete lima arriba del muro solo en oscuro |
| 17 | No aplicado | |
| 18 | Aplicado | `w-full gap-2 sm:w-auto` (`Button` ya trae `justify-center`) |
| 19 | Parcial | `py-1.5` en el resumen de la política y `min-h-11` en «Ver en el calendario»; la miga es global y no se tocó |
| 20, 21, 22 | No aplicados | |

### Medidas de después (px)

| | Antes | Después |
|---|---|---|
| Apertura, 1440 y 1920 | 709 | **540** |
| Apertura, Pixel 7 · 360×640 | 988 · 972 | **806 · 772** |
| Resultados en banda, escritorio · Pixel 7 · 360×640 | 553 · 472 · 491 | **177 · 233 · 252** |
| Resultados con 2 / 3 tarjetas, escritorio · Pixel 7 | | 518 / 537 · 685 / 889 |
| Página entera, 1440 y 1920 | 11.191 | **10.594** (−597) |
| Página entera, Pixel 7 · 360×640 | 14.058 · 14.208 | **13.620 · 13.751** (−438 · −457) |
| Pantallas de scroll, 1440×900 · Pixel 7 · 360×640 | 12,4 · 16,8 · 22,2 | **11,8 · 16,2 · 21,5** |
| Primera pantalla, 1440×900 | logos bajo el pliegue | los 16 logos (707–889 de 900, con la franja roja de vista previa) |
| Primera pantalla, 1920×1080 | logos y banda cortados | franja y banda enteras (hasta 1.011 de 1.080) |

### Contraste del cierre en teal (hallazgo 12)

Todo el texto de `#siguiente` sobre el teal de marca (`rgb(32, 183, 201)`), medido con colores
computados y compuestos sobre el fondo, en claro y en oscuro (el teal y el grafito no cambian con
el tema, así que el resultado es el mismo) y en 1440 y 412 px: **mínimo 5,53:1** (antetítulo,
titulares, bajadas, «Ver en el calendario», «Preguntar por WhatsApp»); el rótulo del botón lima,
**8,14:1**. Con hover: «Preguntar por WhatsApp» blanco sobre grafito 13,39:1 y el botón lima
5,18:1. Anillo de foco de los tres controles: grafito, 5,53:1 contra el teal (≥ 3:1).
Dos correcciones hicieron falta para llegar ahí: la bajada de la próxima parada va por el slot de
`SectionIntro` en grafito pleno (el `muted` del tono `brand`, grafito al 80 %, da 3,9:1), y el
botón lima lleva `focus-visible:outline-surface-dark` (el `outline-primary` de `Button` es teal
sobre teal). Límite conocido: el borde del botón lima contra el teal es 1,47:1; lo identifica su
rótulo, no su contorno.

### Resultados de las verificaciones

`npm run test:run`: 88 archivos, 2.124 tests, todos pasan. `npm run typecheck`: 0 errores, 0
advertencias, 6 sugerencias (las mismas de antes, en archivos que no se tocaron). `npm run lint`:
limpio. `npm run test:coverage`: sin umbrales rotos (`valida.ts` 99,6 / 98,5 / 100 / 100). Etiqueta
corta del índice: sin truncar entre 360 y 430 px; a 320 px siguen cortándose «Fotos 420»,
«Aliados» y «Resultados» (como antes, por el icono y la cifra). Alineación de las cifras
históricas: las seis arrancan a 53 px de su tarjeta en 1440 (tres columnas) y en 768 (dos).

### Capturas de después (`capturas/conjunto-v2-*.png`)

| Archivo | Qué muestra |
|---|---|
| `conjunto-v2-escritorio-1920-claro-primera-pantalla.png`, `conjunto-v2-escritorio-1440-claro-primera-pantalla.png` | Primera pantalla sin cifras: apertura, franja y banda |
| `conjunto-v2-escritorio-1920-claro-resultados-banda.png` | La banda de resultados y el borde de columna alineado |
| `conjunto-v2-escritorio-1440-claro-resultados-dos-y-tres-tarjetas.png` | La sección con dos y con tres tarjetas, sin antetítulo (datos de prueba ampliados en una copia temporal del proyecto; el repo no se tocó) |
| `conjunto-v2-escritorio-1920-claro-la-pista.png` | La pista con el intro centrado y el resaltado entero |
| `conjunto-v2-escritorio-1920-claro-cierre.png`, `conjunto-v2-escritorio-1920-oscuro-cierre.png` | El cierre en teal con la silueta del pie, en claro y en oscuro |
| `conjunto-v2-escritorio-1920-oscuro-muro-filete.png` | El muro en oscuro con su filete lima y el índice con anillo visible |
| `conjunto-v2-movil-pixel7-claro-recorrido-completo.png`, `conjunto-v2-movil-pixel7-oscuro-recorrido-completo.png` | Las 17 pantallas de scroll de un Pixel 7 |
| `conjunto-v2-movil-pixel7-detalles.png` | Botones de la apertura a ancho completo, «Ver las 60 fotos» en una línea, La pista centrada, cifras sin icono y el cierre en teal |
| `conjunto-v2-movil-360-indice-corto.png` | El índice a 360 px con «Próxima» sin truncar |

### Pendientes y avisos

- El campo `icon` de `historico` (schema `validaDatosSchema`, `datos.json`, `preview/datos.json` y
  los tests de `valida-data.test.ts` que lo verifican) quedó sin uso en la plantilla. Quitarlo es
  mecánico; no lo toqué porque son datos del club.
- Con una sola tarjeta de crónica o de álbum, la banda repite título y botón («Leer la crónica» y
  «Leer la crónica»): es el texto de `recapCards`, que ya era así dentro de cada tarjeta. Con
  resultados no pasa («Resultados oficiales» y «Ver los resultados»).
- `InscriptionCTA variant="banner"` (el cierre de la portada, `/la-pista` y `/la-pista/[slug]`) pone
  `Button variant="accent"` sobre teal sin cambiar el color del anillo de foco, que es el
  `outline-primary` de `Button`: teal sobre teal, invisible. Aquí se corrigió con una clase; allá no
  se tocó.

