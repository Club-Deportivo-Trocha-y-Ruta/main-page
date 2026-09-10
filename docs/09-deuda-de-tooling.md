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

## Referencia

- `docs/08-plan-creatividad-ui.md` — plan cerrado del que se extrajo esta nota.
- `docs/04-sistema-editorial.md` §2.5 — reglas de animación y sus propias
  trampas de Lightning CSS (comparten familia con la primera nota de aquí,
  pero no son el mismo bug).
