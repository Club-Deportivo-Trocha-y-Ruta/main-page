# Implementación de la maqueta v6 en `/copa-valle-yumbo-2026`: especificación común

> 16-oct-2026. El usuario aprobó la maqueta v6 («afiche» del cerro a dos tintas, con títulos y botones del estilo
> global) y pidió pasarla a la página real. La página se publica con las fotos el **lunes 19**.

## Referencia visual (la fuente de verdad)

- `maqueta/index.html` + `maqueta/maqueta.css`. Valen solo los bloques del final: **«v6: títulos y botones…»**,
  **«v6.1»** y **«v6.2: retoques UI/UX»**, que pisan lo anterior. Ábrelos y léelos.
- Capturas: `maqueta/capturas/v6-*.png` y `v62-*.png` (escritorio 1440 y celular 390).
- La maqueta es HTML suelto: **se traduce al sistema del sitio**, no se copia su CSS tal cual.

## Reglas del sitio (obligatorias; ver `page/CLAUDE.md`)

- Primero Tailwind en el marcado. Lo que Tailwind no exprese va en un `<style>` **del propio componente**. **Nunca en
  `src/styles/global.css`.**
- **Títulos:** se usa `SectionIntro` (antetítulo + titular + `highlight` + bajada). **Botones:** el componente
  `Button` (variantes `accent`, `outline`, `secondary`) o las mismas clases de la galería. Nada de itálica 800 en
  mayúsculas.
- **Colores, con los tokens del sitio:**
  - lima = `accent` (#8be000);
  - texto oscuro = `text-surface-dark` o `text-text-primary`;
  - fondo oscuro = tono `dark` de `SectionShell` (#2f2f2f; la «tinta» de la maqueta, #1c1e20, se reemplaza por este
    token);
  - teal de enlaces sobre claro = `primary-deep`.
  - **Papel:** usar `#f4f2eb` solo con una variable local del componente, que **en tema oscuro** (`:root[data-theme='dark']`,
    con `:global(...)` en el `<style>` del componente) pase a `var(--color-surface)`.
- **Lima sobre papel nunca como texto** (1,47:1). Para texto lima sobre claro, `accent-deep`.
- **Ningún texto encima de la trama de puntos ni de los cables.** Para esto la maqueta usa el halo lima en el
  titular de la apertura y la placa lisa debajo.
- **Animaciones** solo con `transform` y `opacity`, bajo `prefers-reduced-motion: no-preference`.
- **No tocar:** la analítica (`data-analytics-*`, eventos), los `id` de sección (`#inicio`, `#fotos`, `#buscar`,
  `#aliados`, `#resultados`, `#cifras`, `#la-pista`, `#siguiente`), los textos que salen de `@lib/valida` y de los
  JSON, la regla de no nombres de menores, el SEO ni el JSON-LD.
- **Comandos prohibidos:** `npm run format`, commits y `git push`. Solo `npx prettier --write <tus archivos>`.
- **No** correr `astro build`, `astro dev` ni `astro check`: hay varios agentes en el mismo repo y se pisan. Para
  verificar, usar **solo** `CI=true npx vitest run <tus tests>`. El build y las capturas los hace el coordinador.

## Imágenes del afiche (ya están)

En `src/assets/images/valida-yumbo-2026/`:

| Archivo | Tamaño | Para qué |
|---|---|---|
| `afiche-cerro-ancho.webp` | 2400 × 1340 | Escritorio: cielo lima arriba, torres a la derecha y la sombra del cerro abajo. |
| `afiche-cerro-vertical.webp` | 1080 × 1920 | Celular, menos de 700 px. |
| `afiche-grano.webp` | 512 × 512 | Tesela de grano para la planilla lima, con `mix-blend-mode: multiply`. |

Se sirven con `getImage` o `<Picture>` de `astro:assets`, en formato webp con calidad ~74:

- **Ancho:** variantes de 1440 y 2400 px.
- **Vertical:** variantes de 640 y 780 px.

## Reparto (cada agente toca SOLO sus archivos)

| Agente | Archivos | Contenido |
|---|---|---|
| A · página | `src/pages/copa-valle-yumbo-2026.astro` | 1. Apertura-afiche. 3. Marco de la sección de fotos (papel). 5. Resultados como talón. 7. La pista. 8. El cierre. |
| B · aliados | `src/components/sections/ValidaAllies.astro` y su test | 4. El muro: capítulo oscuro y un solo pliego de papel con marcas de corte. |
| C · cifras | `src/components/sections/ValidaNumbers.astro` (y su test, si hace falta crearlo) | 6. La planilla lima. |
| D · galería y franja | `src/components/interactive/RacePhotoGallery.tsx`, `src/components/sections/ValidaSponsorRibbon.astro` y sus tests | Campo de placa, chips, «Ver las N fotos» y la banda «25 aliados» en el celular. |

## Pendientes que el usuario pidió arreglar (incluidos en el reparto)

1. **Usuarios de Instagram largos** en el muro (B): no partirlos a mitad de palabra. Poner `<wbr>` después de `_` y
   `.`, y bajar el tamaño de letra si hace falta.
2. **Botones del cierre** en escritorio (A): no apilarlos en una columna angosta. La hoja más ancha o los botones
   lado a lado.
3. **Hueco al final de la segunda fila** de la franja (D): en el componente real ya va centrada; solo confirmarlo.
