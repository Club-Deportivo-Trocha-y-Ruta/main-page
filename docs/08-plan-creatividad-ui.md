# Implementation Workflow: Creatividad, UI/UX y animaciones (fase 2)

- **Fuente**: `claudedocs/brainstorm-creatividad-ui-2026-08-26.md` (decisiones §6).
- **Continúa** a `docs/06-plan-animaciones.md`: mismas reglas (cero runtimes, cero islands nuevas, `transform`/`opacity` salvo excepciones documentadas, `@supports` + `prefers-reduced-motion`, longhands para `animation-timeline`, tokens con nombre propio, texto visible desde collections).
- **Estado**: en ejecución en rama `feat/creatividad-ui` (2026-08-26). Marcar `[x]` al verificar en el working tree.
- **Cómo retomar con Claude**: `Ejecuta la siguiente tarea pendiente de docs/08-plan-creatividad-ui.md con el modelo asignado`.

## Excepciones explícitas a «solo transform/opacity»

- `stroke-dashoffset` (checkmark del stepper, plan 06).
- `background-size` en `.editorial-mark` (tarea 4): no dispara layout.

## Sprint 0 — Base

| #   | Tarea                                                                                                                                                                                                   | Modelo   | Agente               | Archivos                                                                 | Depende de | Complejidad |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | -------------------- | ------------------------------------------------------------------------ | ---------- | ----------- |
| 1   | `[x]` Red de seguridad global `prefers-reduced-motion: reduce` (catch-all de `animation-duration`/`transition-duration`), verificando que no rompe `.reveal`, `SponsorsBar`, count-up, view transitions | Sonnet   | astro-dev            | `src/styles/global.css`                                                  | —          | Baja        |
| 2   | `[x]` Subsetting de fuentes: `pyftsubset` a Latin + Latin-1 + puntuación española, `unicode-range` en `@font-face`, mantener ejes variables; medir antes/después                                        | **Opus** | performance-engineer | `public/fonts/*`, `src/styles/global.css`, `BaseLayout.astro` (preloads) | —          | Media       |
| 3   | `[x]` `EventCard` y `RiderCard` al nivel de `NewsCard`: lift + sombra + `--ease-spring`, `motion-reduce`                                                                                                | Sonnet   | astro-dev            | `EventCard.astro`, `RiderCard.astro`                                     | 1          | Baja        |
| 4   | `[x]` Subrayado que se dibuja en `.editorial-mark` al `.revealed` (`background-size` 0→100 %); estado completo sin JS y bajo `reduce`                                                                   | Sonnet   | astro-dev            | `src/styles/global.css`, `SectionIntro.astro`                            | 1          | Baja        |

### Notas de la tarea 2 (2026-08-26)

- **`PlusJakartaSans-Variable.woff2` nunca fue una fuente.** Eran 305 KB de la página
  HTML de error 404 de GitHub guardada con extensión `.woff2` (`file` la reporta como
  «HTML document text»). El sitio la preloadeaba en las 143 páginas y los títulos se
  pintaban con el `system-ui` del fallback, sin ningún error visible. Se reemplazó por
  la variable real de `google/fonts`. **La tipografía de titulares del sitio cambia de
  aspecto con este commit: es la primera vez que Plus Jakarta Sans se renderiza.**
- Fuentes: 657 KB → 160 KB (−76 %). Inter 352 → 122.7 KB (−65 %); Jakarta, contra la
  variable real de 176 KB, → 37 KB (−79 %).
- El rango latino estándar de Google Fonts **no basta** para este contenido: un barrido
  del HTML construido encontró `→` (81 veces), `▲`/`▼` (36, tablas de resultados) y `★`
  (4, crónicas). Están añadidos al `unicode-range`. Los emoji de `/trocha-verde` caen al
  font de emoji del sistema, igual que antes (ninguna de las dos familias los tuvo).
- Se conservan **los dos preloads**: Inter pinta header y cuerpo, Jakarta pinta el `h1`
  —candidato a LCP en todas las páginas salvo la home—, y juntos pesan menos de la mitad
  de lo que pesaba Inter sola.
- Las fuentes completas viven en `fonts-src/` (fuera de `public/`, no se despliegan);
  `scripts/subset-fonts.sh` regenera los subsets; `src/test/fonts.test.ts` fija que lo
  servido sea WOFF2 real y que preloads y `@font-face` no se desalineen.

### Notas de la tarea 3 (2026-08-26)

- **El `transition` con `box-shadow` de `NewsCard`/`TreeCard`/`AlbumCard` no se copió tal
  cual.** Esos tres animan `transition duration-300` (todas las propiedades, sombra
  incluida). `EventCard`/`RiderCard` siguen en cambio el patrón más reciente y ya
  documentado de `Button.astro` (`pressable`): solo `transform`/`background-color` llevan
  `transition`, la sombra aparece al instante con `hover:shadow-lg` sin curva propia — el
  comentario de `Button.astro:33-37` explica por qué («nunca `box-shadow`, para no pagar
  el costo de animar sombras»). Mismo resultado percibido (lift + sombra al hover), sin
  sumar una cuarta variante de la regla «solo transform/opacity».
- **`RiderCard`** es un único `<a>` sin `bg-surface`/`ring` (foto + texto apilados, no una
  caja como `NewsCard`): se le agregó `rounded-xl` al enlace —sin tocar la jerarquía de
  elementos— para que `hover:shadow-lg` seudo-corte con el mismo radio que la imagen y no
  aparezca una sombra de esquinas cuadradas alrededor de una tarjeta redondeada.
- **`EventCard`** ya traía `transition-colors hover:bg-surface-muted`; como Tailwind no
  fusiona dos utilidades `transition-*` que compiten por la misma propiedad CSS (gana la
  que quede después en la hoja generada, no la del código fuente), el color y el lift
  comparten un solo `transition-[background-color,transform]` con `ease-spring` para no
  perder la transición de fondo existente.
- Ninguna de las dos tarjetas usaba el patrón de enlace estirado (`after:absolute
after:inset-0`) que sí tienen `NewsCard`/`TreeCard`/`AlbumCard`: `RiderCard` ya es un
  solo `<a>` envolvente y `EventCard` solo linkea el título a propósito (el resto de la
  fila —ubicación, badges— no es clicable). No se tocó esa estructura.

### Notas de la tarea 4 (2026-08-26)

- **`SectionIntro.astro` no necesitó cambios.** Ya renderiza `class="editorial-mark"`
  sin condicionar nada a `.reveal`; el gate por `.reveal`/`.revealed` lo decide el
  ancestro que envuelve a `SectionIntro` en cada página/sección, así que toda la tarea
  quedó en `global.css`.
- **Ningún uso actual de `SectionIntro` queda dentro de un `.reveal` ancestro**
  (barrido de los ~23 consumidores, incluido `TrochaVerde.astro`): donde existe
  `.reveal` cerca, es en un elemento hermano posterior —tarjetas de una rejilla
  (`ProgramsGrid`), el bloque de contadores (`TrochaVerde.astro:82`), un `<li>` de
  listado (`noticias`/`galería`)—, nunca envolviendo al propio `SectionIntro`. Con la
  regla nueva, el trazo de los ~23 usos actuales queda siempre con
  `background-size: 100% 100%` desde el primer render, sin pasar por el 0% intermedio.
  Lo mismo aplica a `Hero.astro`, que usa `.editorial-mark` suelto (fuera de
  `SectionIntro`) sin ancestro `.reveal`. La regla `.reveal:not(.revealed)
.editorial-mark` queda lista para el día en que algún consumidor futuro sí envuelva
  un `SectionIntro` en `.reveal` — hoy no hay ningún caso que la ejercite.
- **`background-size` es la excepción explícita a «solo transform/opacity»** (ya
  listada arriba): no dispara layout porque la caja del fondo la fija el propio texto,
  y es la única propiedad que permite "barrer" el trazo sin partirlo en un
  pseudo-elemento aparte (el comentario de `.editorial-mark` en `global.css` ya explica
  por qué el trazo no puede vivir en un `::before`/`::after`: se estira a todo el ancho
  del bloque en vez de seguir el corte de línea de `box-decoration-break`).
- El delay de 150ms es fijo (no un token nuevo): es menor que la duración del propio
  `.reveal` (0.4s), así el trazo empieza a dibujarse cuando el titular ya está casi
  asentado, no a la vez que aparece.
- Sin JS con un `.reveal` ancestro que nunca llega a `.revealed`, el trazo se queda en
  0% para siempre bajo `no-preference` — mismo límite que ya tiene `.reveal` en general
  (el bloque entero queda en `opacity: 0` sin el `IntersectionObserver` de
  `BaseLayout.astro`); esta tarea no lo introduce ni lo agrava, y no hay ningún caso hoy
  donde el `SectionIntro` en sí quede atrapado así.
- `npm run lint`, `npm run test:run` (65 archivos, 1431 tests) y `npm run build:only`
  verdes; inspeccionado el CSS compilado en `dist/` para confirmar que Lightning CSS no
  descartó la regla `@media (prefers-reduced-motion: no-preference)`.

## Sprint 1 — Funnel

| #   | Tarea                                                                                                                                                                                                                        | Modelo   | Agente    | Archivos                                                                                                | Depende de | Complejidad |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- | ------------------------------------------------------------------------------------------------------- | ---------- | ----------- |
| 5   | `[x]` Selector de edad en `/programas`: `<fieldset>` de radios 4–15 + `:has()` que resalta el tramo del `ProgramPathway` y la sección del programa; CTA contextual; sin soporte todo visible; copy en frontmatter/collection | **Opus** | astro-dev | `src/pages/programas/index.astro`, `ProgramPathway.astro`, `global.css`, schemas/CMS si hace falta copy | 1          | Alta        |
| 6   | `[x]` Count-up en `StatsCounter`: extraer patrón `@property --tv-count` de `TrochaVerde.astro` a utilidad reutilizable y prop en `StatFigure`                                                                                | Sonnet   | astro-dev | `global.css`, `StatFigure.astro`, `StatsCounter.astro`, `TrochaVerde.astro`                             | 1          | Media       |
| 7   | `[x]` Header compacto con scroll (`animation-timeline: scroll(root)`, `animation-range: 0 200px`): logo `scale`, CTA gana `--shadow-pressable`; sin animar `height`                                                          | Sonnet   | astro-dev | `Header.astro`, `global.css`                                                                            | 1          | Media       |
| 8   | `[x]` «Compartir por WhatsApp» al pie de las crónicas con UTM (`docs/05`), entra con `sda-conversion-bar-in`; cero JS                                                                                                        | Sonnet   | astro-dev | `PostLayout.astro` / detalle de noticia, `src/lib/utm` si existe                                        | 1          | Baja        |

### Notas de la tarea 5 (2026-08-26)

- **El texto apagado se quedó fuera, a propósito.** El plan pedía bajar a ~0.55 la
  opacidad de los programas que no corresponden, pero `opacity` sobre un bloque arrastra
  el contraste de su texto: `text-secondary` (#5a5a5a) al 55 % sobre blanco cae a 3.3:1 y
  rompe WCAG 2.1 AA (1.4.3) — y **no hay ningún valor por debajo de 1 que lo salve**
  (a 0.72, que ya casi no se nota, sigue en 3.5:1). La excepción del criterio para
  «componentes inactivos» no aplica: las secciones que no corresponden se siguen leyendo
  y sus enlaces siguen funcionando. Se apaga entonces solo la ilustración
  (`[data-age-media]`: la foto y su mancha de color) y el peso del mensaje lo lleva el
  énfasis —aro en la sección, aro + zoom en el tramo de la regla—. Ni una palabra de la
  página pierde legibilidad al filtrar.
- **Los botones son 9, no 12, y el último es «12+».** El rango sale de `ageMin`/`ageMax`
  como pedía la tarea, pero el tramo de Alto Rendimiento está declarado `12`–`99`: a
  partir de los 12 todas las edades llevan al mismo programa. `buildAgePicker()` corta ahí
  y lo ofrece como un solo botón «12+» («12 años o más» en voz alta). Trece, catorce y
  quince habrían sido tres botones que hacen exactamente lo mismo que el de doce. Los 7
  años de ancho que `buildPathway()` le dibuja a ese tramo son una licencia del dibujo,
  no edades elegibles. Una edad que ningún programa cubre tampoco se ofrece.
- **Lo generado en build es solo el puente, no el diseño.** CSS no sabe comparar el
  `value` de un radio con un rango numérico, así que `ProgramAgePicker` emite una regla por
  edad —`…:has(input[value="7"]:checked) [data-ages~="7"]{--age-emphasis:1}`, 9 líneas en
  un `<style is:inline>`— y **todas** las declaraciones viven en `global.css` leyendo
  `var(--age-emphasis, 0)`: `outline: calc(3px * var(--age-emphasis, 0))`,
  `opacity: calc(0.55 + 0.45 * …)`. La variable se hereda, así que encenderla en la sección
  basta para que la foto de dentro se entere. `~=` compara palabra completa: `1` no matchea
  `11`. Verificado en `dist/` que Lightning CSS no descartó ninguna de las reglas.
- **`SectionShell` aprendió a dejar pasar `data-*`** (índice de plantilla
  ``[key: `data-${string}`]`` + `...rest` al `<section>`). Era eso o enseñarle al marco
  editorial el vocabulario de una página concreta. Ninguna otra sección del sitio pasa
  props fuera del contrato, así que el `rest` va vacío en todos los demás usos.
- **Sin `:has()` no pasa nada, y eso es lo correcto**: toda regla de énfasis lleva `:has()`
  en el selector, así que un navegador sin soporte las descarta enteras y la página se ve
  como siempre. El estado inicial es el mismo: el radio «Todas las edades» arranca
  marcado y hace de reset sin una línea de JS. El `<fieldset>` no vive dentro de ningún
  `<form>`: no hay nada que enviar.
- **La transición se declara fuera del `:has()`** para que volver a «todas» no sea un salto
  seco (dentro del gate, la regla desaparece justo cuando hace falta). Gana por
  especificidad al `transition-colors` del tramo, sin pérdida: el único hover de ese enlace
  es `brightness-95`, un `filter` que `transition-colors` nunca cubrió. El aro aparece de
  golpe, sin curva — mismo criterio que `Button.astro`, que nunca anima `box-shadow`.
- **Queda pendiente el «CTA contextual»** que menciona la fila de la tarea (un botón de
  inscripción que cambie según la edad elegida): sin JS, un CTA por edad significa pintar
  los tres y ocultar dos, y el que queda visible no puede cambiar su `href` ni su texto.
  Se puede hacer con `:has()` sobre tres enlaces preexistentes, pero eso es maquetar tres
  CTA para mostrar uno. Sin decisión de contenido del club sobre qué diría cada uno, no se
  implementó.
- `npm run lint`, `npm run test:run` (66 archivos, 1456 tests) y `npm run build:only`
  verdes.

### Notas de la tarea 6 (2026-08-26)

- **La utilidad quedó renombrada, no solo movida.** `--tv-count`/`.tv-count`/`.tv-count__digits`
  pasan a `--count-value`/`.count-up`/`.count-up__digits` en `global.css` (el nombre viejo era
  específico de Trocha Verde; el nuevo es el que consumen ambos sitios). `--count-target` no
  cambió de nombre — ya era genérico.
- **Se agregó `--count-digits` (ausente en la versión original).** Reserva `min-width:
calc(var(--count-digits, 1) * 1ch)` en `.count-up__digits` con los dígitos del valor final,
  calculados en build (`String(value).length`). Sin esto, el conteo empieza en "0" (1 dígito)
  y ensancha su caja hasta el ancho final — hoy no se nota porque la etiqueta de al lado manda
  el ancho de la columna en los tres usos existentes (nota de rendimiento de la Fase 4, gate 14),
  pero es un layout shift real que ya no depende de esa casualidad.
- **`StatFigure.astro` gana `countUp` y decide sola cuándo aplica.** Si `value` no es
  `number`/`Number.isInteger`, la prop se ignora en silencio y se pinta la cifra tal cual — así
  ningún consumidor futuro tiene que repetir la regla "solo enteros". Cuando sí aplica, el propio
  componente emite su `<noscript>` de reserva (cifra final + `.reveal` visible): queda
  autocontenido, no depende de que la página que lo use recuerde añadir el fallback.
- **`StatsCounter.astro` deja de tener JS propio.** El `<script is:inline>` con
  `IntersectionObserver` + `requestAnimationFrame` (`data-count-target`/`data-count-suffix`) se
  borró entero; el disparo pasa a ser el mismo `.reveal`/`.revealed` de `BaseLayout.astro` que ya
  usa el resto del sitio. Efecto lateral, buscado: la banda de cifras de la portada ahora también
  hace fade-in escalonado al entrar en pantalla (`--stagger`, 80ms por tarjeta, mismo patrón que
  `SeasonOverview`), algo que antes no tenía — solo animaba el número.
- **`StatsCounter` no se migró al componente `<StatFigure countUp>`, a propósito.** Sus cifras
  usan `text-4xl sm:text-5xl` (la banda de credibilidad de la portada, el tamaño más grande del
  sitio); `StatFigure` en su tamaño `default` es `text-3xl sm:text-4xl`. Forzar el cambio de
  componente habría achicado la tipografía sin que nadie lo pidiera. Se aplicó la utilidad CSS
  compartida directamente en el markup existente de `StatsCounter` (mismas clases, mismo `<a>`
  con el CTA "Compruébalo" al hover) y se dejó un `<noscript>` único fuera del `.map()` — la regla
  es genérica (no depende de qué instancia), así que una sola cubre las cuatro cifras. La prop
  `countUp` de `StatFigure` queda lista para el consumidor que sí necesita su tamaño por defecto
  (Sprint 3, tarea 15: stat-strip de crónica).
- **`TrochaVerde.astro` perdió su `<style>` local completo** (la declaración `@property` y las
  reglas `no-preference`): ahora son puramente consumo de la utilidad de `global.css`. Su
  `<noscript>` se queda (ya traía, desde el rediseño de portada, el fix de `.reveal { opacity:
1 !important; transform: none !important }` que pedía la nota del gate 14 — no hizo falta
  agregarlo, solo renombrar las clases/variables que usa).
- **Los `<noscript>` con la CSS de reserva van con `set:html` sobre un string, no como `<style
is:inline>` literal.** Un `<style>` real anidado dentro de un `{condición && (...)}` rompe el
  parser embebido de `prettier-plugin-astro` (repro mínimo aparte, confirmado); en `StatsCounter`
  hay además un segundo hallazgo, más angosto: en ese árbol concreto, autocerrar el propio
  `<noscript>` (`<noscript ... />`) pasa el `--check` de Prettier pero su `--write` lo reescribe
  autocerrado igual y esa forma sí falla el `--check` siguiente — un bug de round-trip del
  plugin, no del compilador de Astro (que compila cualquiera de las dos formas sin problema, y
  así quedó verificado en `dist/`). Se dejó documentado en el propio archivo para que un futuro
  `prettier --write` sobre esa línea no reintroduzca el ciclo.
- Verificado en `dist/`: una sola declaración de `@property --count-value` en el CSS compilado
  (Lightning CSS no la duplicó al venir de dos consumidores), los cinco usos actuales en la
  portada (`StatsCounter` ×4 + `TrochaVerde` ×1) traen su `--count-target`/`--count-digits`
  correctos, y los dos `<noscript>` esperados (uno de `StatsCounter`, cubre sus cuatro cifras;
  uno de `TrochaVerde`) están presentes en `/` — ningún `StatFigure` de otra página usa todavía
  `countUp`, así que hoy no emite ninguno de más.
- `npm run lint`, `npm run test:run` (68 archivos, 1468 tests) y `npm run build:only` verdes; sin
  warnings nuevos de Lightning CSS.

### Notas de la tarea 7 (2026-08-26)

- **`box-shadow` no se anima directamente.** No es `transform`/`opacity` y de
  fondo el navegador tendría que recalcular la sombra en cada frame. La sombra
  "dura" del botón `pressable` (`--shadow-pressable`, ver `Button.astro`) vive
  ya dibujada de forma estática en un `::after` del mismo tamaño que el CTA
  (`inset: 0`, `border-radius: inherit`); lo único que anima el scroll es la
  `opacity` de ese pseudo-elemento, de 0 a 1. El CTA del header nunca usó el
  componente `Button.astro` compartido (es un `<a>` suelto sin la clase
  `pressable`), así que se le fija `--btn-shadow-color: var(--color-accent-dark)`
  a mano —mismo tono que usaría la variante `accent` de `Button`— en vez de
  heredarlo.
- **El logo escala, nada más se mueve.** `.header-logo` (la propia `<a>` que
  envuelve la `<Image>`) pasa de `scale(1)` a `scale(.85)` con
  `transform-origin: left center`; el contenedor `flex min-h-16` del header no
  cambia de alto ni de padding en ningún punto del recorrido, así que no hay
  CLS que medir. La sensación de "cabecera compacta" es puramente el logo más
  chico y el CTA con aspecto presionado — el resto de la fila (nav, buscador,
  hamburguesa) no se toca.
- **Sin soporte de `scroll()` o con `prefers-reduced-motion: reduce`, no hay
  segundo estado que mostrar.** Las tres reglas nuevas (`@keyframes` incluidos)
  viven enteras dentro de `@supports (animation-timeline: scroll()) { @media
(prefers-reduced-motion: no-preference) { ... } }`, calcado del bloque de
  `.conversion-bar` que ya existía unas líneas arriba. Si cualquiera de las dos
  condiciones falla, `.header-cta::after` ni siquiera se crea (no hay regla
  base fuera de la guarda que lo declare con `opacity: 0`), así que el header
  se queda en su único estado de siempre: logo a tamaño completo, CTA sin
  sombra. No es un estado "roto a medias", es el estado que ya tenía el sitio
  antes de esta tarea.
- **Sticky header, `MobileMenu` y `SiteSearch` no se tocaron.** El diff en
  `Header.astro` son dos nombres de clase (`header-logo`, `header-cta`) más un
  comentario; el `<header class="sticky top-0 z-40 ...">`, el `<details>` de
  "Más" y las dos islas React quedan exactamente igual. Verificado además en
  `dist/`: las reglas nuevas quedan anidadas dentro de las dos guardas
  (`@supports` → `@media`) y `animation-timeline`/`animation-range` sobreviven
  como longhands tras Lightning CSS.
- `npm run lint`, `npm run test:run` (68 archivos, 1468 tests) y `npm run
build:only` verdes.

## Sprint 2 — Marca

| #   | Tarea                                                                                                                                                                                                                   | Modelo   | Agente    | Archivos                                                                            | Depende de | Complejidad |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------- | ----------------------------------------------------------------------------------- | ---------- | ----------- |
| 9   | `[x]` `ClubSeal.astro`: envuelve el escudo oficial existente, rotación leve, animación de estampado (`scale(1.4)→1` + opacity, `--ease-pop`) al `.revealed`; usos: cierre de crónica, banner de inscripción, 404, éxito | **Opus** | astro-dev | `src/components/editorial/ClubSeal.astro`, consumidores, `global.css`, `docs/04` §2 | 1          | Media       |
| 10  | `[x]` Dorsal (placa de número) para `RaceLineup` y crónicas; color por `LEVEL_STYLES`; tilt 2° en hover                                                                                                                 | Sonnet   | astro-dev | `RaceLineup.astro`, `global.css`, `editorial.ts`                                    | 1          | Baja        |
| 11  | `[x]` Polaroid en `AlbumCard`/`NewsGallery`: rotación alterna `nth-child`, enderezado en hover; no romper `view-transition-name`                                                                                        | Sonnet   | astro-dev | `AlbumCard.astro`, `NewsGallery.astro`                                              | 1          | Baja        |
| 12  | `[x]` Footer: silueta de perfil de elevación como borde superior (reusar path de `ProgramPathway`), wiggle de iconos sociales                                                                                           | Sonnet   | astro-dev | `Footer.astro`                                                                      | 1          | Baja        |

### Notas de la tarea 9 (2026-08-26)

- **Trampa nueva de Lightning CSS, hermana de la del shorthand `animation`.** La primera
  versión usaba las propiedades independientes `rotate` y `scale` —lo natural: `.reveal`
  ya ocupa `transform` con su `translateY(20px)`, y los longhands componen con él sin
  pelear—. En `dist/` el `scale: 1.4` **no existía**: Lightning CSS trata
  `scale`/`rotate`/`translate` como longhands de `transform` (no lo son; el spec las
  aplica antes y por separado) y, si conviven en la misma regla, colapsa a una sola.
  Reproducido en aislado: `{ scale: 1.4; transform: none }` → `{ transform: none }`;
  `{ transform: none; scale: 1.4 }` → `{ transform: scale(1.4) }`; y dos reglas con el
  mismo selector también se fusionan. Sin warning en ningún caso. La cura es la misma que
  con `animation`: separar. El estampado quedó en `transform` (reescribiendo los dos
  estados de `.reveal`, `scale(1.4)` → `scale(1)`), y la inclinación en `rotate` **en una
  regla propia sin `transform` al lado** — así sobrevive y además se conserva bajo
  `reduce`, donde el catch-all global pisa `transform` pero no `rotate`.
- **El sello se pone el `.reveal` él mismo**, no lo delega al consumidor (criterio ya
  establecido por `StatFigure` con `countUp`): lleva su `<noscript>` de reserva incluido,
  así ninguna página tiene que acordarse. En la portada eso deja un `.reveal` anidado
  dentro del `.reveal` que ya envuelve al banner de `InscriptionCTA`; el observador de
  `BaseLayout.astro` los trata como dos elementos independientes y funciona.
- **El disco claro no es decoración: es lo que hace legible el escudo.** El logo es un
  degradado teal→lima sobre fondo transparente — sobre el `bg-primary` del banner de
  inscripción se disuelve. `tone` solo elige el aro (`ring-white/25` en tonos invertidos,
  `ring-black/5` en el resto); el disco es claro siempre.
- **Nada que agregar a schemas ni a Sveltia**: el sello no tiene texto visible (`alt=""`,
  `aria-hidden`), así que no hay copy que sacar del contenido. El escudo ya vivía en
  `src/assets/images/logo.webp` (el mismo de la cabecera, 492×492, cuadrado — por eso el
  `object-fit: cover` que inyecta `responsiveStyles` de Astro da lo mismo que `contain`).
- **No se usó en el Hero** (lo pedía la tarea) ni en la página de éxito de inscripción que
  mencionaba la fila del plan: ese "éxito" es un estado interno de `InscriptionForm.tsx`
  (island React), no una página `.astro`, y meter ahí el componente obligaría a portar el
  marcado a TSX y a duplicar el `.reveal`. Queda para la tarea 17, que ya toca ese archivo.
- `npm run lint`, `npm run test:run` (70 archivos, 1487 tests) y `npm run build:only`
  verdes; verificado en `dist/` que las tres reglas de `.club-seal` sobreviven a Lightning
  CSS y que el bloque del estampado sigue anidado en
  `@media (prefers-reduced-motion: no-preference)`.

### Notas de la tarea 11 (2026-08-26)

- **Bug real de Astro descubierto y evitado: el scoping normal marca _cada_
  compuesto de un selector, no solo el último.** La primera versión de
  `AlbumCard.astro` usaba un `<style>` con scoping normal y
  `:where(li:nth-child(odd)) > .album-card` (el `<li>` lo arma
  `/galeria/index.astro`, que no se toca). Verificado en `dist/`: Astro
  compiló `[data-astro-cid-x]:where(li:nth-child(odd))>.album-card[data-astro-cid-x]`
  —le exigió el atributo de scope también al compuesto de dentro del
  `:where()`—, y como el `<li>` real nunca lo tiene, la regla salía muerta.
  La cura fue `<style is:global>`: el nombre de clase (`album-card`) es
  único en el sitio, así que no hay riesgo de fuga.
- **Misma cura, mismo motivo, en `NewsGallery.astro`, pero por una razón
  distinta**: ahí el `<button>` de la rejilla lo renderiza el island React
  `ImageLightbox` (`/galeria/[...slug].astro` documenta ese componente como
  "sin tocar" entre sus dos usos), así que ni siquiera es un problema de
  scoping — el elemento no lo imprime esta plantilla en ningún momento. Se
  envolvió el island en `<div class="news-gallery-grid">` y el `<style
is:global>` de `NewsGallery.astro` alcanza los `<button>` por selector
  CSS puro, sin tocar `ImageLightbox.tsx` ni afectar el detalle de álbum
  (que monta el mismo componente sin ese wrapper).
- **La rotación nunca vive en el elemento candidato a `view-transition-name`.**
  En `AlbumCard` va en el `<article>` completo, no en la caja de la foto
  (`m-3 mb-5 rounded-lg`, la que seguiría el patrón de `NewsCard.astro`/
  `TreeCard.astro` el día que el álbum se sume al morph). En `NewsGallery`
  va en el `<button>`, nunca en el `<img>` de adentro —son elementos
  distintos, así que `rotate` (el estándar del `<button>`) y `scale` (el
  `group-hover:scale-105` del `<img>`, propio del island) no compiten por la
  misma declaración y Lightning CSS no las colapsa, la trampa ya documentada
  en la tarea 9—.
- **`:where()` en la mitad "de reposo" de cada regla, no en el `:hover`.**
  `:where(li:nth-child(odd)) > .album-card` sin scoping ya no necesita el
  truco por el bug de arriba, pero sigue haciendo falta por especificidad:
  sin `:where()`, esa regla pesa más que `.album-card:hover` (un elemento +
  una pseudo-clase de más) y el hover nunca gana. Con `:where()` la mitad
  variable no aporta nada y el hover/`:focus-within` —una sola clase más una
  pseudo-clase— gana siempre, sin depender del orden de las reglas en la
  hoja compilada. Mismo criterio en `NewsGallery` con `:focus-visible` en
  vez de `:focus-within`: el `<button>` es focosable él mismo, no un
  contenedor de otro elemento focosable.
- **El marco blanco es solo `padding`/`margin`, sin restructurar el DOM.**
  En `AlbumCard`, la caja de la foto gana `m-3 mb-5 rounded-lg` (margen
  blanco parejo arriba/lados, más ancho abajo) y el bloque de texto pierde
  su `p-5` por `px-3 pb-3` —ya no hace falta relleno arriba, ese espacio lo
  da el `mb-5` de la foto—. En `NewsGallery`, el `<img>` de adentro del
  `<button>` no es absoluto (a diferencia de `AlbumCard`/`NewsCard`), así
  que un `padding` en el propio `<button>` ya deja la foto inscrita sin
  tocar el island; el fondo pasa de `bg-surface-muted` a
  `--color-surface` (blanco) para que ese margen se vea como papel de
  polaroid y no como el gris de "cargando".
- **Solo la talla `default` de `AlbumCard` lleva marco.** La `featured` es
  un bloque a dos columnas (foto + texto lado a lado), no una foto suelta;
  forzarle rotación y margen habría roto su composición sin que la tarea lo
  pidiera.
- **Todo el efecto vive bajo `prefers-reduced-motion: no-preference`**,
  incluida la rotación estática de reposo (no solo el enderezado en hover):
  es la lectura más conservadora de la regla del plan, y sin soporte o con
  `reduce` las tarjetas quedan planas, con el mismo contenido y el mismo
  enlace estirado de siempre.
- `npm run lint`, `npm run test:astro` (63 archivos, 1385 tests) y `npm run
build:only` verdes; verificado en `dist/` que ninguna de las dos hojas
  compiladas quedó con reglas muertas ni con el `data-astro-cid` filtrando
  hacia el `<li>`/`<button>` ajenos.

### Notas de la tarea 12 (2026-08-26)

- **Corregidas dos costuras que la captura del 2026-08-26 dejó ver entre la silueta y el
  pie.** (a) Una línea clara justo encima de la banda: `elevationProfile().area` cierra el
  relleno contra `base`, un 2% por encima del borde inferior del viewBox, que estirado en
  la franja de 40px son ~0,8px transparentes por los que se colaba el fondo de la sección
  anterior — el teal del cierre en la portada, blanco en el resto. Ahora `Footer.astro` no
  usa `area`: cierra el `line` **por debajo** del viewBox y deja que el recorte del propio
  SVG haga de borde, más `-mb-px` en el contenedor para que la banda (que va en flujo y se
  pinta después que un descendiente de z-index negativo) tape el último píxel.
  (b) Un escalón de tono: la cinta llevaba un velo `bg-white/[0.03]` sobre `bg-surface-dark`,
  así que su color compuesto no era el del token y el relleno `currentColor` de la silueta
  se leía distinto. Se retiró el velo; la cinta se sigue distinguiendo por su `border-b`,
  que va abajo y no puede duplicar línea contra la silueta.
- El SVG quedó con `shape-rendering="geometricPrecision"`, `stroke="none"` y `display:block`
  (fuera el `position:absolute` y el `overflow-hidden` del contenedor, que ya no hacían
  falta); el alto sigue fijo en `h-10`, cero CLS.

## Sprint 3 — Deleite

| #   | Tarea                                                                                                                                                                                     | Modelo   | Agente          | Archivos                                                                                    | Depende de | Complejidad |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------- | ---------- | ----------- |
| 13  | `[x]` Hilo de ruta en portada (prototipo): trazo vertical scroll-driven con hitos por sección, solo `lg+`, `aria-hidden`; queda **detrás de una clase opt-in** para decidir con captura   | **Opus** | astro-dev       | `src/pages/index.astro`, `global.css`                                                       | 1          | Alta        |
| 14  | `[x]` Barra de progreso de lectura en crónicas (`scaleX` + `scroll(root)`)                                                                                                                | Sonnet   | astro-dev       | `PostLayout.astro`, `global.css`                                                            | 1          | Baja        |
| 15  | `[x]` Stat-strip de crónica con `.reveal --stagger` + count-up (tarea 6)                                                                                                                  | Sonnet   | astro-dev       | CSS de `stat-strip`, `global.css`                                                           | 6          | Baja        |
| 16  | `[x]` `sessions: [{day,start,end}]` en schema de programs + Sveltia + `.md`; «próxima sesión» derivada en build en `InscriptionCTA` banner; se pinta solo si hay dato; tests en `src/lib` | **Opus** | content-manager | `schemas.ts`, `config.yml`, `src/content/programs/*.md`, `src/lib/`, `InscriptionCTA.astro` | 1          | Alta        |
| 17  | `[x]` Checklist «qué llevar» con stagger y check dibujado en `/inscripciones` y éxito; acotar confeti al tercio superior                                                                  | Sonnet   | astro-dev       | `inscripciones.astro`, `InscriptionForm.tsx`, `global.css`                                  | 1          | Media       |
| 18  | `[x]` `AnnouncementBar` con `@starting-style` y cierre con `interpolate-size`                                                                                                             | Sonnet   | astro-dev       | `AnnouncementBar.astro`, `global.css`                                                       | 1          | Baja        |

### Notas de la tarea 13 (2026-08-26)

- **Prototipo evaluado con captura el 2026-08-26 y descartado; código retirado.** Visto en
  la portada, el hilo se leía como una línea punteada vertical con puntos cruzando todas
  las secciones y siguiendo por encima del cierre teal: ruido en el margen, no guía. Se
  borraron el marcado del rail y su SVG de `src/pages/index.astro`, las siete reglas
  `.route-thread*` de `global.css` (incluido el `@supports (animation-timeline: scroll())`
  del barrido, que solo existía para este efecto) y la prop `mainClass` de
  `BaseLayout.astro`, que se había agregado para encenderlo y se quedaba sin consumidores.
  No queda ninguna aparición de `route-thread` en `src/`.

### Notas de la tarea 15 (2026-08-26)

- **`PostLayout.astro` no es el consumidor: está muerto.** El plan lo listaba como
  archivo candidato, pero nada lo importa — el detalle de crónica real es
  `src/pages/noticias/[...slug].astro`, con su propio `<div class="prose prose-lg
max-w-none">` en la línea 222. Se tocó ese archivo (más `.stat-strip`/`.stat-callout`
  y `global.css`), no `PostLayout.astro`.
- **La entrada es literal: el autor agrega `reveal` a la clase del `<div>` en el
  markdown.** Cero JS nuevo y cero cambios al IntersectionObserver de
  `BaseLayout.astro`: ese script ya hace `document.querySelectorAll('.reveal')` sobre
  todo el documento, sin importar qué envoltorio lo puso ahí, así que un
  `<div class="stat-strip reveal">` escrito a mano en un `.md` se observa exactamente
  igual que un `<li class="reveal">` de `SeasonOverview.astro`. Sin esa clase, el
  bloque se ve como siempre — la clase es opt-in, no un comportamiento nuevo que
  aparece solo.
- **El escalonado de `.stat-strip__item` es `:nth-child`, no `--stagger` calculado.**
  `StatsCounter`/`SeasonOverview`/`ProgramsGrid` numeran sus items en build
  (`.map((item, index) => …)`) y escriben `style="--stagger:${index*80}ms"` por
  instancia — el markdown no tiene ese índice. La cadencia (80ms) es la misma que esos
  componentes; el mecanismo (`:nth-child(2)` → 80ms, `:nth-child(3)` → 160ms, …) es
  CSS puro y cubre las 4-6 cifras que documenta `content-marketer.md`. El contenedor
  `.stat-strip.reveal` usa el fade/`translateY(20px)` de `.reveal` de base tal cual
  (sin reescribirlo, a diferencia de `.club-seal.reveal`); los ítems suman su propio
  fade/`translateY(16px)` encima, así que hay un doble desvanecimiento superpuesto
  —contenedor y cifra— en vez de un movimiento único: mismo criterio ya aceptado en
  la tarea 9 para reveals anidados, y sin CLS porque ambas capas son solo
  `opacity`/`transform`.
- **`.stat-callout` no necesita CSS nueva, solo la clase.** Es un bloque único (valor +
  texto, no una rejilla), así que agregar `reveal` en el markdown ya le da el
  fade/`translateY` completo sin escalonado que declarar — se documentó con un
  comentario junto a su regla en `global.css` en vez de escribir una regla vacía.
- **Count-up sí es viable sin JS desde el markdown, y ya quedó de ejemplo en
  `content-marketer.md`.** El autor escribe a mano el contrato completo de `.count-up`
  (`--count-target`, `--count-digits` = `String(valor).length`, el `<span
class="sr-only">` con la cifra final) dentro de `.stat-strip__value`; como el
  contenedor ya lleva `reveal`, el conteo hereda el mismo disparador `.revealed` sin
  nada adicional. Solo aplica a cifras enteras puras (`11`, `2`, `241`), nunca a las
  que llevan unidad o coma decimal (`3,4 km`, `21 s`) — coincide con la regla que ya
  impone `StatFigure.astro` (`Number.isInteger`).
- **Un solo `<noscript>` genérico en `[...slug].astro`, no uno por bloque.** El
  markdown no puede emitir su propio `<noscript>` por instancia como sí hace
  `StatFigure.astro` (necesitaría que el autor pegue HTML de respaldo a mano en cada
  crónica). Se agregó una sola regla, siempre presente, justo después del `<Content
/>`, con el mismo criterio de "regla genérica" que `StatsCounter.astro` (tarea 6): sin
  JS, arregla `.stat-strip.reveal`/`.stat-callout.reveal`/`.stat-strip__item` a su
  estado final visible y `--count-value` a `--count-target`. Inocua en las crónicas
  sin estos bloques —los selectores no matchean nada— y en las que sí los tengan pero
  no usen `reveal` ni `count-up` en su markdown.
- **`src/content/news/2026-09-copa-valle-roldanillo-xco.md`** (el único `.md` con
  `stat-strip`/`stat-callout` hoy) se actualizó con `reveal` en sus tres bloques para
  que quede alineado con la plantilla nueva; sigue `draft: true`, así que no entra al
  build ni se pudo verificar en `dist/` — se verificó en cambio contra
  `2026-03-copa-valle-xco-ginebra` (crónica publicada, sin estos bloques) que el
  `<noscript>` nuevo se emite igual y no rompe nada.
- Verificado en `dist/`: las seis reglas `:nth-child` sobreviven a Lightning CSS
  anidadas en `@media (prefers-reduced-motion: no-preference)`, y el `<noscript>` de
  `[...slug].astro` aparece en las páginas de noticias construidas.
- `npm run lint` y `npm run test:run` (70 archivos, 1488 tests) verdes; sin tests
  nuevos — ni `PostLayout.astro` ni `[...slug].astro` tenían suite previa (ningún
  layout del proyecto la tiene) y el cambio es puramente de marcado/CSS sin lógica que
  cubrir en `src/lib`.

### Notas de la tarea 16 (2026-08-26)

> **Actualización (2026-09-01): `nextSession()` se eliminó.** El aviso "Próxima
> sesión" del banner de inscripción quedaba desactualizado entre deploys —mostraba
> la sesión más cercana al momento del último build, no a la fecha real de quien
> visitaba la página— y confundía a las familias. Se quitaron `nextSession()`,
> `NextSession`, `ProgramSessionsInput`, `formatTimeOfDay()`, `SESSION_DAYS` y
> `SESSION_DAY_TO_WEEK_DAY` de `src/lib/programs.ts`, `NEXT_SESSION_LABEL` de
> `constants.ts` y el bloque que los usaba en `InscriptionCTA.astro`. El campo
> `sessions` del schema se conserva: sigue alimentando `countWeeklySessions()`.

- **`sessions` no reemplaza a `schedule`, lo acompaña.** El texto libre sigue siendo
  obligatorio y sigue siendo lo que lee una familia: es el único sitio donde caben las
  aclaraciones del club («salida», «gymkanas en pista», «+12 años», «según clima»).
  `sessions` es su versión maquinable y solo existe para lo que el texto no resuelve:
  saber qué sesión viene ahora. Por eso el campo es opcional —un programa sin sesiones
  capturadas se publica igual— y por eso las notas **no** se migraron a un campo `note`:
  el brief pedía `{day,start,end,place?}` y duplicar la aclaración invitaría a que las
  dos versiones se contradigan.
- **Los tres `.md` se derivaron del `schedule` existente, sin inventar horas.** Iniciación
  (mar/vie 16:30–18:00) y Formación (lun/mié/vie 16:00–18:00) salieron directo del texto.
  De Alto Rendimiento salieron cinco sesiones (mar, mié, jue 16:00–18:00; sáb 07:00–09:00;
  dom 07:00–10:00). **El `place` solo se llenó donde el contenido lo dice:** las dos
  primeras tienen sede única y explícita en su campo `location`; en Alto Rendimiento solo
  el miércoles («gymkanas en pista», y su `location` nombra la pista para ese día), y las
  otras cuatro son «salidas por fuera» sin punto fijo, así que quedaron sin lugar. Esa es
  la única ambigüedad que dejó el texto libre y se resolvió dejando el campo vacío.
- **La hora se formatea a mano, no con `Intl`.** `formatTimeOfDay()` arma `"4:30 p. m."`
  con aritmética propia porque el sufijo de `es-CO` cambia de forma según la versión de
  ICU (`a. m.` / `a.m.` / con espacio fino) y esto se hornea en el HTML del build: tiene
  que salir idéntico en el CI y en la máquina de quien despliegue.
- **`nextSession()` es un dato de build, y por eso nunca dice «hoy» ni «mañana».**
  Devuelve día de la semana y hora —que se repiten cada semana y siguen siendo ciertos
  días después del deploy—; una etiqueta relativa caducaría al primer día sin desplegar.
  «Ahora» se resuelve en `America/Bogota` (`clubToday()` + el nuevo `clubTimeOfDay()`,
  ambos en `calendar.ts`), igual que `resolveEventStatus()`. Una sesión **en curso** sigue
  siendo la próxima; una que ya terminó hoy vuelve en siete días. El desempate final es
  por `id` para que dos builds del mismo minuto den el mismo HTML.
- **`countWeeklySessions()` sigue aceptando el texto suelto.** Ahora prefiere `sessions` y
  cae al parseo de `schedule`, pero acepta `string | ProgramSchedule | undefined` porque
  durante la transición conviven las dos formas de tener el horario; los tests del parser
  de texto quedaron intactos como red de seguridad. Cuenta **días distintos** en las dos
  ramas: dos sesiones del mismo sábado son un día de entrenamiento, y la cifra de
  `/programas` no puede cambiar solo porque el club capturó sus horarios.
- **La línea solo se pinta en `variant="banner"`**, que hoy es un único uso (la portada);
  las cinco CTA `inline` ni siquiera consultan la colección. Va en `text-surface-dark`
  sobre `bg-white/40` encima del teal de marca —la misma regla de contraste que ya
  obligaba a no usar blanco en este banner— y el icono es decorativo (`aria-hidden`).
  Cero JS: es HTML estático.
- `npm run lint`, `npm run typecheck` (0 errores) y `npm run test:run` (70 archivos, 1510
  tests) verdes. Sin test de componente para `InscriptionCTA`: como `AnnouncementBar`,
  ahora lee `astro:content` y ningún `.astro.test.ts` del proyecto monta todavía un
  componente con `getCollection`. La lógica quedó cubierta en `src/lib` (24 tests nuevos
  entre `programs`, `schemas` y `calendar`) y el render se verificó en `dist/index.html`.

### Notas de la tarea 17 (2026-08-26)

- **Una sola fuente para el checklist: `ENROLLMENT_DOCUMENTS` (`@lib/enrollment`).** Ya
  existía y ya se usaba en la sección «Qué debes presentar en el paso X» de
  `/inscripciones`; lo único que faltaba era conectarla también a la pantalla de éxito de
  `InscriptionForm.tsx`, que traía un tercer texto suelto y con un item de más
  («certificado médico deportivo», que no está en la lista canónica ni en ningún otro
  sitio del contenido). Se reemplazó ese texto por el mismo array — el comentario de
  `enrollment.ts` decía desde antes que esta era la intención («aquí queda en un solo
  lugar»), pero nunca se había hecho. No se buscó en `programs.equipmentNeeded`: ese campo
  es por programa y variable, y esta sección de la página es única y genérica — no encaja
  con "un solo checklist" y hubiera significado inventar cuál programa mostrar.
- **El observer global de `.reveal` (`BaseLayout.astro`) no ve la lista del island.**
  Corre una sola vez, en `astro:page-load`/carga inicial, sobre `document.querySelectorAll('.reveal')`.
  La lista de `/inscripciones` es contenido estático de esa misma carga, así que la
  recoge sin cambios. La de `InscriptionForm.tsx` no existe todavía en ese momento —se
  monta recién cuando el usuario llega a la pantalla de éxito, minutos después—, así que
  sin nada más se hubiera quedado en `opacity:0` para siempre bajo
  `prefers-reduced-motion: no-preference`. Se resolvió dentro del propio island (ya es
  JS, no se está agregando JS "nuevo fuera de islands"): un `useEffect` con
  `requestAnimationFrame` pasa `checklistRevealed` a `true` un frame después de montar,
  y ese booleano es lo único que decide si cada `<li>` lleva también `.revealed`. Bajo
  `reduce` es inofensivo porque la regla `.reveal{opacity:1}` de `global.css` ya fuerza el
  estado final sin mirar `.revealed`. El estado de éxito además es inalcanzable sin JS (el
  formulario entero depende de React para enviarse), así que no hay caso "sin JS" que
  cubrir aquí.
- **El check reutiliza el keyframe, no lo duplica.** `.checklist-check` es una clase nueva
  con `stroke-dasharray:24; stroke-dashoffset:24` y `animation-name: if-check-draw` (el
  mismo `@keyframes` del stepper de inscripción, tarea del Sprint 2). Se dispara con
  `.reveal.revealed .checklist-check` y un `animation-delay: calc(var(--stagger, 0ms) + 400ms)`
  para que el trazo arranque justo cuando ese ítem específico termina su fundido de
  entrada (0.4s, la transición base de `.reveal`) — no todos a la vez. Todo vive dentro de
  `@media (prefers-reduced-motion: no-preference)`; sin la preferencia el check se pinta
  entero de una vez, igual que el resto del archivo.
- **Icono distinto en cada sitio, misma fuente de datos.** En `/inscripciones` cada
  documento conserva su icono Phosphor (identificación, EPS, firma) con el check
  superpuesto como insignia (`absolute -right-1 -bottom-1`), porque ahí la lista es
  independiente y se beneficia de diferenciar visualmente cada documento. En la pantalla
  de éxito del formulario, dentro de un `<ol>` numerado ya cargado de badges circulares,
  se usó solo el check (sin el icono Phosphor) para no acumular un tercer nivel de
  íconos en el mismo bloque.
- **Confeti acotado sin tocar `ConfettiBurst.tsx`/`SuccessConfetti.tsx`.** Son compartidos
  con `ContactForm.tsx`, que no tiene el mismo problema (su tarjeta de éxito es corta, sin
  texto de lectura debajo). La solución quedó contenida en `InscriptionForm.tsx`: un
  `<div>` envoltorio `absolute inset-x-0 top-0 h-1/3 overflow-hidden` alrededor de
  `<SuccessConfetti />`. Al ser `absolute`, ese wrapper es su propio contexto de
  posicionamiento, así que el `inset-0` interno de `ConfettiBurst` (que no cambió) queda
  recortado a ese tercio superior en vez de a toda la tarjeta.
- `npm run lint`, `npx astro check` (0 errores) y `npm run test:run` (70 archivos, 1515
  tests) verdes. `npm run test:coverage`: `src/components/interactive/**` en
  90.47/80.74/91.92/91.41 (stmts/branch/funcs/lines) — por encima del umbral 80/70/80/80
  del directorio. `npm run build:only` verde (145 páginas); verificado en `dist/` que
  `.checklist-check`/`if-check-draw` siguen mergeados dentro de un único bloque
  `@media (prefers-reduced-motion:no-preference)` (Lightning CSS no los sacó de la
  guarda) y que el HTML de `/inscripciones` renderiza el checklist con `--stagger`
  correcto por ítem.

## Gate (tras cada sprint)

`npm run test:run` + `npm run build` en verde; barrido con `prefers-reduced-motion: reduce`; Lighthouse ≥ 95 tras la tarea 2.

### Verificación de cierre (2026-08-26)

- **Tareas 1–18**: las 18 quedaron verificadas en el working tree de `feat/creatividad-ui`
  (código + CSS presentes para cada una, incluidas las 6 que no traían nota propia:
  1, 8, 10, 12, 14, 18) y marcadas `[x]` arriba. Ninguna falló.
- `npm run test:run`: **70 archivos, 1515 tests**, todos en verde.
- `npm run build` (`astro check` + `astro build` + `pagefind`): **0 errores, 0 warnings,
  5 hints** en `astro check`; **145 páginas** construidas; Pagefind indexó 143 páginas /
  3304 palabras. Verde de punta a punta.
- `npm run lint`: sin salida, 0 problemas.
- `npm run format:check`: los 60 archivos tocados por las tareas 1–18 (`git status`) están
  todos formateados — cero coincidencias contra la lista de archivos con `[warn]`/`[error]`.
  El comando sí falla en general (~200 archivos preexistentes con `[warn]` y 11 con
  `[error]` de parseo real, p. ej. `NewsCard.astro`, `ProgramPathway.astro`,
  `ConsentBanner.astro`, `calendario.astro`), pero es deuda **anterior y ajena** a este
  plan: se reprodujo igual hicieron `git stash` sobre el mismo commit
  (`6a27ab3`, punta de `feat/creatividad-ui` y de `origin/main`), sin ninguno de los
  cambios de las tareas 1–18 aplicado. Los `[error]` son un parseo roto de
  `prettier-plugin-astro` 0.14.1 con comentarios HTML (`<!-- -->`) dentro de expresiones
  JSX (`{cond && (<>...<!-- --> ...)}`) — no algo introducible por una sesión de formato.
  No se tocó ningún archivo fuera del alcance de las tareas 1–18 para no mezclar un
  arreglo de deuda preexistente, potencialmente grande y arriesgado (~200 archivos,
  incluidas las 32 fichas de `species` y los ~77 `.md` de `trees`), con este cierre.

### Tamaño — fuentes y CSS (medido en `dist/` del build de este cierre)

- `public/fonts/`: **160 KB** (`InterVariable-latin.woff2` 122.7 KB +
  `PlusJakartaSans-Variable-latin.woff2` 37.0 KB) — sin cambios respecto a la tarea 2
  (Sprint 0), que ya dejó esta cifra documentada tras el subsetting.
- `dist/_astro/*.css` (3 archivos, gzip):

  | Archivo                          | Sin comprimir | gzip     |
  | --------------------------------- | ------------: | -------: |
  | `ConsentBanner.CTJTdDiZ.css`      |     144.3 KB  | 22.3 KB  |
  | `index.CHtXxHHg.css`              |      14.7 KB  |  6.2 KB  |
  | `index.D-fydMv9.css`              |       4.6 KB  |  1.1 KB  |
  | **Total**                         | **160.2 KB**  | **29.6 KB** |

  El primer archivo es la hoja global compartida por casi todas las páginas (nombre de
  chunk heredado de su punto de entrada); los otros dos son CSS específico de página.
