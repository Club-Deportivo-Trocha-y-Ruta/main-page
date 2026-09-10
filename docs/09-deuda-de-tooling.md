# Deuda de tooling

Tres hallazgos de herramientas que costaron una sesión de depuración cada uno,
rescatados de `docs/08-plan-creatividad-ui.md` (cerrado el 2026-08-26) antes de
que ese plan se archivara. Ninguno bloquea el build; los tres son trampas para
la próxima persona que toque el mismo terreno.

## `prettier-plugin-astro` 0.14.1 rompe con `<style>` dentro de una expresión condicional

Un `<style>` real anidado dentro de `{condición && (...)}` rompe el parser
embebido del plugin (confirmado con repro mínimo). La cura fue mover el CSS de
reserva de los `<noscript>` a `set:html` sobre un string en vez de un
`<style is:inline>` literal.

Hay además un bug de **round-trip** más angosto, visto en `StatsCounter.astro`:
en ese árbol concreto, autocerrar el propio `<noscript>` (`<noscript ... />`)
pasa `prettier --check`, pero `prettier --write` lo reescribe autocerrado igual
— y esa forma reescrita sí falla el `--check` siguiente. Es un bug del plugin,
no del compilador de Astro: este último compila cualquiera de las dos formas
sin problema.

**Consecuencia medida en el cierre de `docs/08`**: `npm run format:check`
falla sobre unos ~200 archivos preexistentes con `[warn]` y 11 con `[error]`
de parseo real (por ejemplo `NewsCard.astro`, `ProgramPathway.astro`,
`ConsentBanner.astro`, `calendario.astro`). Se verificó que esa lista es
idéntica haciendo `git stash` sobre el mismo commit: es deuda anterior y ajena
a cualquier plan reciente, no algo introducible por una sesión de formato.
No se ha intentado arreglar — mezclar un fix de ~200 archivos con trabajo de
feature es su propio riesgo.

## Astro: el scoping normal marca cada compuesto de un selector, no solo el último

Un `<style>` con scoping normal y un selector como
`:where(li:nth-child(odd)) > .album-card` no hace lo que parece. Astro compila
`[data-astro-cid-x]:where(li:nth-child(odd))>.album-card[data-astro-cid-x]`:
exige el atributo de scope también al compuesto de **dentro** del `:where()`.
Si ese elemento (`<li>`) lo imprime otra plantilla — el caso real en
`AlbumCard.astro`, donde el `<li>` lo arma `/galeria/index.astro` — nunca
tendrá ese atributo, y la regla sale muerta sin ningún error de build.

La cura fue `<style is:global>` con un nombre de clase único en el sitio
(`album-card`), sin riesgo de fuga. Misma cura en `NewsGallery.astro`, por una
razón distinta: ahí el elemento interactivo lo renderiza el island React
`ImageLightbox`, así que ni siquiera es un problema de scoping — la plantilla
`.astro` no imprime ese elemento en ningún momento.

**Regla práctica**: cualquier selector compuesto que dependa de marcado
impreso por *otra* plantilla u otro componente (React o `.astro`) necesita
`is:global`, nunca scoping normal.

## `astro:assets` con `layout` distinto de `none`: su propia capa CSS le gana a `h-*`/`object-*` de Tailwind

Hotfix de producción, 2026-09-10: en `/quienes-somos`, las láminas verticales
del tríptico de Yumbo (`YumboRoots.astro`) se desbordaban hacia arriba y
tapaban el titular de la sección. La causa no era del tema claro/oscuro (el
bug ya estaba en el `HEAD` anterior a esa feature) sino de `astro:assets`.

`astro.config.mjs` fija `image: { layout: 'constrained' }` para todo el sitio.
Con cualquier `layout` distinto de `"none"`, `<Image>` genera CSS propio
(`generateImageStylesCSS` en `node_modules/astro/dist/assets/utils/`) dentro de
`@layer astro.images`, con reglas como `:where([data-astro-image]) {
height: auto }` y, si no se pasa un `fit` explícito, un `data-astro-image-fit`
por defecto (`"cover"`) que también trae su propia regla de capa para
`object-fit`. Ese `@layer astro.images` se declara **después** que
`@layer utilities` de Tailwind en el CSS compilado (confirmado con offsets de
bytes en el bundle), así que en cascada por capas gana sobre CUALQUIER
utilidad de Tailwind para esa propiedad — `h-full`, `h-64`, `h-[300px]`, da
igual la especificidad, porque la prioridad de capa se decide antes que la
especificidad. Es la misma mecánica que usa a propósito el remapeo de tokens
del tema oscuro (`global.css`, bloque sin capa: gana porque lo no-capado
siempre gana sobre lo capado), aplicada aquí en sentido contrario y sin
haberlo buscado.

Consecuencia concreta: `<Image class="h-full w-auto">` dentro de una caja de
alto fijo renderiza con `height:auto`, así que la imagen crece a su propia
proporción sobre el ancho disponible, sin límite de alto real —en el caso de
Yumbo, 597px de alto contra una caja de 192px—. Y `class="object-contain"`
sin pasar `fit="contain"` a `<Image>` se recorta con `object-fit:cover` igual
de silenciosamente.

**Cómo evitarlo** (dos rutas, según lo que la imagen necesite):

1. **Imagen que debe conservar su proporción dentro de un límite** (el caso de
   Yumbo): usar `max-h-full`/`max-w-full` en vez de `h-full`/`w-full`. Astro
   no toca `max-height` ni `max-width` (solo `constrained` fuerza
   `max-width:100%`, que es justo lo que se quiere), así que no hay capa que
   ganarle.
2. **Imagen que debe llenar y recortar una caja de proporción fija** (el caso
   de `RiderCard.astro`): usar `aspect-[w/h]` con el mismo ratio que el
   contenedor, en vez de `h-full`. Astro no toca `aspect-ratio`. Es el mismo
   patrón que ya usaban a salvo `TrochaVerde.astro` (`aspect-[16/9]`,
   `aspect-square`) sin que nadie lo hubiera identificado como "la forma
   segura" hasta este hotfix.
3. Si de verdad hace falta `height`/`object-fit` exactos: o se pasa el `fit`
   deseado como prop de `<Image>` (para que el propio atributo que genera
   Astro coincida, sin conflicto) o se usa `layout="none"`/`layout="fixed"` +
   `!important` (`h-12!` en `Header.astro`/`Footer.astro`, ya en el código
   antes de este hotfix) — la única forma de ganarle a una capa sin pasar por
   sus propias reglas.

**Cómo se detectó sin adivinar**: se inspeccionó el CSS compilado
(`dist/_astro/*.css`) con Playwright + Chromium headless, se midió el offset
de bytes de `@layer utilities{` contra `@layer astro.images{` en el mismo
archivo, y se confirmó con `getComputedStyle()` sobre el build real que
`h-full` perdía. No se dedujo solo de leer el código: la prioridad de capas
por orden de declaración es fácil de razonar mal sin medirla.

## Referencia

- `docs/08-plan-creatividad-ui.md` — plan cerrado del que se extrajo esta nota.
- `docs/04-sistema-editorial.md` §2.5 — reglas de animación y sus propias
  trampas de Lightning CSS (comparten familia con la primera nota de aquí,
  pero no son el mismo bug).
