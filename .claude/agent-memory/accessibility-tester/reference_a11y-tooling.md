---
name: a11y-tooling
description: Cómo correr auditorías de accesibilidad en este repo — no hay navegador headless; receta axe-core + jsdom sobre dist/
metadata:
  type: reference
---

En este entorno **no hay puppeteer, playwright ni lighthouse instalados** (verificado
2026-08-22). Sí hay `axe-core` (4.11.1) y `jsdom` en `node_modules`, ambos como
dependencias transitivas de `vitest-axe`.

Receta que funciona para auditar el sitio completo:

1. `npm run build:only` (más rápido que `build`, salta `astro check`) → 146 páginas en `dist/`.
2. Script Node que lee el HTML de `dist/`, lo monta en `JSDOM` con
   `runScripts: 'outside-only'` + `pretendToBeVisual: true`, hace `window.eval(axe.min.js)`
   y corre `window.axe.run(window.document)`.
   - Ojo: hay que importar jsdom por **ruta absoluta** a
     `node_modules/jsdom/lib/api.js` si el script vive en el scratchpad (fuera del
     árbol de resolución del proyecto).
3. Desactivar la regla `color-contrast`: jsdom no hace layout ni paint, los resultados
   son ruido. El contraste hay que calcularlo a mano (o pedirle al usuario DevTools).

**Falsos positivos conocidos de esta receta**, no los reportes como hallazgos:
- `label` sobre `input[name="botcheck"]` — son los honeypots de Web3Forms con
  `class="hidden"`; en un navegador real axe los descarta por `display: none`.
- `landmark-one-main` y `page-has-heading-one` salen siempre como "incomplete" por lo mismo.

**Violaciones preexistentes reales que salen en todas las páginas** (no las atribuyas a
ningún cambio nuevo): `region` por la cinta de anuncio, el FAB de WhatsApp y
`ConversionBar` fuera de landmarks; `landmark-complementary-is-top-level` por los
`<aside>` dentro de `<article>` en crónicas y fichas de árbol.

Para verificar que Lightning CSS no sacó una regla de su guarda `@media
(prefers-reduced-motion: ...)`, hay que mirar el CSS **construido**, no el fuente: el
bundle principal es `dist/_astro/ConsentBanner.*.css` (minificado en una sola línea, así
que `grep -c` miente — usar `grep -o ... | wc -l` o Python). Los `<style>` scoped de
componentes `.astro` no van ahí: se inlinean en el `<head>` de cada HTML.

Ver [[a11y-deudas-preexistentes]] para lo que ya se sabe que está mal y no hace falta
volver a descubrir.
