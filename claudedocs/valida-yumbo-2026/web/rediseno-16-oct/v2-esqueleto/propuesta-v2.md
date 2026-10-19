# Propuesta v2 de `/copa-valle-yumbo-2026`: mejor esqueleto, mismos estilos

> 16-oct-2026. Reemplaza a «La válida impresa» (`../propuesta.md`). El usuario pidió no alejarse de los estilos
> globales del sitio y mejorar el layout. Además, en la maqueta de la v1 había textos ocultos: el título cruzado por
> los cables del cerro, el rótulo negro sobre la trama y los botones por debajo de la pantalla.
>
> **Sin aplicar al sitio.** La propuesta está construida y probada sobre una copia del código real. Para aplicarla
> basta `git apply` de `esqueleto.patch` (8 archivos).

## La regla de esta versión

- **No se toca ningún estilo.** Se usan los colores, tipografías, componentes (`SectionShell`, `SectionIntro`,
  `Button`), tarjetas, bordes y sombras que ya usa el sitio, y los tonos de cada sección quedan iguales.
- **Cambia la disposición.** Se reacomoda qué va al lado de qué, para que la página use bien el ancho en escritorio y
  sea más corta en el celular.
- **Ningún texto va sobre una imagen o una textura.**
- **Datos y analítica intactos.** Los datos, los textos que salen de `@lib/valida`, el SEO y la analítica no cambian.

## Qué cambia, sección por sección

| # | Sección | Hoy | Propuesta | Por qué |
|---|---|---|---|---|
| 1 | Apertura | Titular y botones a la izquierda; a la derecha, una foto decorativa de la pista | A la derecha, **«Busca por categoría»**: una fila por manga con su nombre, la hora de salida (de `mangas.json`) y cuántas fotos tiene. Un toque abre la galería ya filtrada en esa categoría. En el celular la lista va debajo del titular y reemplaza al botón «Buscar mis fotos», que repetía lo mismo. Sin fotos todavía (antes del lunes), la derecha sigue siendo la foto de la pista. | Es lo que la familia vino a hacer: ahora lo hace desde la primera pantalla y con un toque, en vez de bajar hasta los chips. |
| 2 | Fotos | Barra de chips arriba; «Ver las N fotos» como un botón gris centrado debajo de cada tira | En escritorio, los filtros (placa y categorías) pasan a una **columna lateral fija** a la izquierda de las fotos. «Ver las N fotos» va a la derecha del titular de cada manga, como enlace. En el celular, la barra de chips sigue igual. | La barra de arriba ocupaba dos filas de chips. Los ocho botones grises alargaban la galería y quedaban lejos de la última foto que se veía. |
| 3 | Aliados | Titular arriba y rejilla de 5 debajo; en el celular, de 2 en 2 | En escritorio, **«Gracias a quienes le apostaron a la válida» queda fijo a la izquierda** mientras los logos pasan a la derecha. En el celular los logos van **de 3 en 3**. Los de «Con el apoyo de» (que traen descripción) van como lista: logo a la izquierda y texto a la derecha. | En el celular el muro medía 3.600 px. |
| 4 | Cifras | Cifras históricas en seis tarjetas sueltas; en el celular, de a una por fila | Las históricas van en **un solo bloque partido por filetes**, de 2 en 2 en el celular. Las tres destacadas de 2026 llevan el icono al lado de la cifra. | En el celular la sección medía casi 2.500 px. |
| 5 | La pista | Línea de tiempo centrada que alterna lados y deja media pantalla vacía en cada hito | Los hitos van a la izquierda, uno debajo del otro. A la derecha, una tarjeta con **el trazado real de una vuelta** (el GPX de `/la-pista`), «3,7 km por vuelta» y «Conoce la pista», fija mientras se leen los hitos. | Llena el hueco con lo único que la sección no decía: cómo es la pista. |

**Lo que no cambia:** la franja de aliados con su banda «25 aliados», resultados, el cierre teal, el índice flotante,
el aviso de imagen y todos los textos.

## Medido (vista previa con 420 fotos de prueba)

| | Hoy | Propuesta |
|---|---|---|
| Alto total, escritorio 1440 × 900 | 11.312 px | **10.390 px** (−8 %) |
| Alto total, celular 390 × 844 | 14.596 px | **12.505 px** (−14 %) |
| Aliados, celular | 3.626 px | **2.191 px** |
| Cifras, celular | 2.486 px | **1.972 px** |
| Galería, escritorio | 3.893 px | **3.228 px** |
| Categorías tocables en la primera pantalla | 0 | **en todos los tamaños probados** (de 360 × 740 a 1920 × 1080) |
| Primera fila de logos de la franja en la primera pantalla de escritorio (regla del 8-oct) | sí | sí (1280 × 720 en adelante; a 1366 × 657 ya no) |

**Pruebas que pasan:**

- **Textos tapados:** 0, en 7 tamaños, con y sin fotos. Una prueba recorre la página y mira qué elemento queda encima
  de cada texto.
- **Textos recortados o fuera de la pantalla:** 0, en 8 tamaños.
- **Categoría de la apertura:** tocar «Infantil» deja la galería filtrada en Infantil, con la dirección
  `?manga=manga-3`, en escritorio y en celular. Sin JavaScript también funciona: el enlace lleva a `?manga=manga-3#buscar`.
- **Tests:** 2.147 de 2.147 pasan. Se ajustaron 2 tests que describían el diseño anterior (el botón «Ver las N fotos»
  debajo de la tira, la placa de aliado sin variante para celular). `astro check` da 0 errores, ESLint y Prettier pasan.
- **Las demás 150 páginas del sitio quedan idénticas.** La línea de tiempo ganó una variante «apilada», pero Quiénes
  somos y La pista siguen con la alternada. Comparé el HTML compilado: lo único distinto es la hora de compilación
  dentro del enlace «Agregar al calendario».
- **Tema oscuro y datos reales (sin fotos)** revisados en capturas.

## Archivos

- `comparaciones/`: hoy contra propuesta, lado a lado.
  - `1-apertura-escritorio.png`, `1-apertura-celular.png`
  - `2-galeria-escritorio.png`
  - `3-aliados-escritorio.png`, `3-aliados-celular.png`
  - `4-cifras-celular.png`
  - `5-pista-escritorio.png`
- `capturas/`: la propuesta completa, sección por sección, en escritorio y celular. Incluye la galería a mitad de
  página (la columna de filtros fija), el tema oscuro y la apertura con los datos reales de hoy (sin fotos).
- `esqueleto.patch`: el cambio completo, 8 archivos.
  - `src/pages/copa-valle-yumbo-2026.astro`
  - `src/components/sections/ValidaAllies.astro` y `ValidaNumbers.astro`
  - `src/components/interactive/RacePhotoGallery.tsx`
  - `src/components/editorial/Timeline.astro` (variante `layout="stacked"`)
  - Dos tests.
  - `preview/evento.json`: saca a IMDERTY del respaldo de la vista previa, como ya se hizo en el real.
- `herramientas/`: los scripts de captura y de las pruebas de textos tapados y del clic en la categoría.

## Para aplicarla

1. Correr `git apply claudedocs/valida-yumbo-2026/web/rediseno-16-oct/v2-esqueleto/esqueleto.patch` en `page/`.
2. Correr `npm run test:run` y `npm run typecheck`.
3. Actualizar la referencia de la página en `docs/04-sistema-editorial.md`.

## Decisiones

1. **¿Se aplica?** Se puede antes del lunes: no toca datos y la galería funciona igual.
2. **Foto de la carrera en la apertura.** Con fotos, la apertura muestra las categorías, así que el campo
   `hero.photoId` de `evento.json` queda sin uso (hoy está en `null`). Si el club quiere una foto de la jornada arriba,
   habría que buscarle otro lugar.
3. **Aliados en escritorio.** Ahí la ganancia es menor (unos 165 px y el titular siempre a la vista); la grande es en el
   celular. Si prefieres el muro de escritorio como está, se deja así y se aplica solo lo del celular.
