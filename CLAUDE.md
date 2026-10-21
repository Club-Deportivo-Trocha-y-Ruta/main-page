# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sitio estático del **Club Deportivo Trocha y Ruta** (escuela de ciclomontañismo para niños desde los 4 años, Yumbo, Valle del Cauca). Astro 7 con `output: 'static'`; la mayoría de las páginas generadas son fichas de árboles y especies de Trocha Verde. Contenido visible en español colombiano; código e identificadores en inglés.

## Comandos

```bash
npm run dev            # localhost:4321
npm run build          # astro check + astro build + pagefind --site dist
npm run build:only     # sin astro check (lo usa el deploy de develop, que ya corrió typecheck)
npm run preview
npm run typecheck      # astro check
npm run lint           # eslint src (lint:fix con --fix). Pasa limpio: no dejarlo con errores
npm run format:check   # Prettier. Hoy falla: ver abajo antes de formatear

npm test               # vitest en watch; con CI=true corre una vez (así lo usa el gate de develop)
npm run test:run       # una pasada, lo mismo que corre el gate
npm run test:astro     # solo proyecto "astro" (node), en watch
npm run test:react     # solo proyecto "react" (jsdom), en watch
npm run test:coverage  # con thresholds

# Un solo archivo: el sufijo decide el proyecto (*.react.test.tsx → react; el resto → astro)
npx vitest run src/lib/__tests__/utils.test.ts

./scripts/subset-fonts.sh   # regenera public/fonts/*-latin.woff2 desde fonts-src/ (pyftsubset + brotli)
node scripts/prepare-yumbo-assets.mjs   # regenera src/assets/images/yumbo/*.webp desde illustrations-src/yumbo/ (sharp)
node scripts/prepare-valida-aliados.mjs # logos de los aliados de la válida → public/images/valida-yumbo-2026/aliados/
npm run valida:fotos -- --src <dir> --out <dir>   # fotos oficiales de la válida: thumb/web/original + manifest (fuera de git)
npm run valida:preview                            # fotos de prueba de la válida en :8765 (~420 fotos desde un banco de ~56 MB en ~/Trocha-media/_valida-preview/); `-- --make-manifest 420` regenera el manifest de prueba
VALIDA_PREVIEW=true npm run dev                   # la página de la válida lee src/data/valida-yumbo-2026/preview/ en vez de los JSON reales (franja roja + noindex; solo local, CI no la define)
```

Node ≥ 22.12 (`engines`; CI usa 22.12). Variables de entorno (`.env.example`): `PUBLIC_WEB3FORMS_KEY`, `PUBLIC_GA4_MEASUREMENT_ID`, `PUBLIC_CLOUDINARY_CLOUD_NAME`, tipadas en `env.schema` de `astro.config.mjs`, todas opcionales, se importan desde `astro:env/client`. Sin `PUBLIC_GA4_MEASUREMENT_ID` no se renderizan ni `Analytics.astro` ni `ConsentBanner.astro`.

**No correr `npm run format`**: el repo no está formateado y reescribiría unos 290 archivos, la mayoría `.md` de `src/content/` (solo cambia comillas del frontmatter, que el CMS escribe dobles), y `prettier-plugin-astro` no parsea una docena de `.astro` (docs/09). Formatear solo el código que se toca (`npx prettier --write <archivo>`), nunca `src/content/`. Ni lint ni Prettier son gate de CI.

## Stack (lo que no dice el package.json)

- **Astro 7** estático, `site: https://clubdeportivotrochayruta.org`. El sitemap excluye `/enlaces` (linktree del QR) y `/equipo` (oculta). Iconos `astro-icon` + Phosphor (`ph:*`).
- **Tailwind 4** vía `@tailwindcss/vite`; no existe `tailwind.config`. Tokens en `@theme {}` de `src/styles/global.css`; `@source not` saca `docs/` y `.claude/` del escáner de clases.
- **React 19** solo en `src/components/interactive/`. **Vitest 4** con dos proyectos. **Pagefind** indexa `dist/` al final del build.
- **Sveltia CMS** en `public/admin/` (se carga desde unpkg, sin npm). Backend `github` sobre `Club-Deportivo-Trocha-y-Ruta/main-page`, rama `main`, con `editorial_workflow`. No hay colección `settings`: los datos del sitio viven en `src/lib/constants.ts`.
- Aliases TS: `@components/*`, `@layouts/*`, `@lib/*`, `@assets/*`, `@types/*`.
- **Versiones acopladas**: `zod`, Vite y `@vitejs/plugin-react` se mueven con el major de Astro (los schemas importan `z` de `astro/zod`, nunca de `zod`). TypeScript se queda en 5.x: `astro check` (Volar) usa la API de Language Service que TS 7 eliminó; no subirlo hasta que `@astrojs/check` acepte `^7`.
- `netlify.toml` y `wrangler.toml` son restos de experimentos (no se usan); el hosting real es Hostinger por FTPS con lftp. `docs/02-technical-architecture.md` explica el porqué de cada decisión; `package.json` y `.github/workflows/` mandan sobre el qué.

### Tokens de diseño — reglas

- Teal `--color-primary #20b7c9` y lima `--color-accent #8be000` **no cumplen contraste como texto** sobre fondo claro: para texto usar `primary-deep` / `accent-deep`. Sobre fondos de color va texto grafito (`text-surface-dark`).
- Todo token nuevo lleva **nombre propio** (`--radius-chip/control/card/pill/plate`, `--shadow-card/raised/overlay/pressable`, `--ease-spring/pop`, `--duration-micro/celebration`). Definir `--radius-lg`, `--shadow-md` o `--ease-out` pisa la escala por defecto de Tailwind 4 y cambia todos los `rounded-*`/`shadow-*` del sitio.
- **Tema claro/oscuro** (docs/04 §29): `<html data-theme>` lo fija el script inline de `BaseLayout` (sigue a `prefers-color-scheme`, override en `localStorage['trocha-theme']`, se reaplica en `astro:after-swap` porque el swap de `ClientRouter` borra el atributo). El tema oscuro es un **remapeo de tokens** en `:root[data-theme='dark']` de `global.css`, no `dark:` por todas partes. Al escribir componentes: `bg-surface-raised` (no `bg-white`), `border-hairline` (no `border-black/10`), `text-on-deep` sobre `bg-*-deep`, `text-danger` (no `text-red-*`); el variant `dark:` existe (`@custom-variant`) solo para ajustes puntuales. `surface-dark`, `primary` y `accent` no cambian con el tema. `src/test/theme.test.ts` verifica tokens y contraste en ambos temas.
- Animaciones: solo `transform`/`opacity` (las excepciones, con su razón, en la tabla de docs/04 §2.5), bajo `@supports` + `prefers-reduced-motion`, con estado final visible sin soporte. Con `animation-timeline: view()/scroll()` usar **longhands**: Lightning CSS rompe el shorthand `animation`.
- Fuentes: `public/fonts/*-latin.woff2` son subsets generados desde `fonts-src/` (no se despliega). El `unicode-range` de `global.css` debe coincidir con `$UNICODES` del script; `src/test/fonts.test.ts` lo verifica y comprueba que los archivos sean WOFF2 reales (hubo un `.woff2` que era una página 404 de GitHub).

## Arquitectura

### Contenido: schemas → colecciones → CMS

- 16 colecciones registradas en `src/content.config.ts` con glob loaders. **Todos los schemas Zod viven en `src/lib/schemas.ts`** (importan de `astro/zod`) y se testean en `src/lib/__tests__/schemas.test.ts`.
- Pobladas: `news`, `events`, `gallery`, `programs`, `sponsors`, `faqs`, `social-initiatives`, `milestones`, `trees`, `species`, `riders` (**todas las fichas en `draft: true`**), `obstaculos` (una ficha, en `draft`) y `pages` (solo `programas.md`: copy que la página no puede deducir, como el bloque `agePicker`).
- Vacías: `results` (loader solo `yaml|yml|json`; su README documenta el formato y queda fuera), `directivos` (README excluido por el patrón) y `rutas` (**sin directorio**: crearlo antes de usarla).
- Al cambiar un campo se cambian los tres: **schema Zod + `public/admin/config.yml` + los `.md`**. Si es un enum, también su mapa de etiquetas en `src/lib/` cuando lo tenga (p. ej. `EventCategory`/`EVENT_CATEGORIES` en `calendar.ts`). `faqs` no tiene colección en el CMS: se edita a mano.
- Relaciones por slug en frontmatter: noticia→`relatedEvent`/`relatedGallery`/`galleryFolder`; evento→`relatedGallery`/`relatedNews[]`; álbum→`relatedEvent`; rider→`program`; iniciativa social→`relatedGallery`/`relatedNews[]`; árbol→`species` (por **nombre común**, no por id). `src/lib/__tests__/content-validation.test.ts` valida el frontmatter real y que toda referencia (`relatedEvent`, `relatedGallery`, `relatedNews`, `program`) resuelva, **incluidos los drafts**; `trees.species` queda fuera. En las páginas nunca se arma una URL desde un campo sin comprobar que resuelve (patrón de `chronicle.ts` / `gallery.ts`).
- Imágenes: `src/assets/images/` pasa por `astro:assets` (y es el `media_folder` del CMS); las fotos de crónicas, álbumes y logos van por ruta pública en `public/images/{news,sponsors,trocha-verde}/`. Datos fuera de colecciones: `src/data/transparencia-documentos.json` + PDFs en `public/documentos/transparencia/`, y `src/data/la-pista.gpx` (trazado de `/la-pista`).

### Módulos puros por página (`src/lib/`)

La lógica derivada de cada página vive en un módulo puro (`home.ts`, `calendar.ts`, `news.ts`, `chronicle.ts`, `gallery.ts`, `programs.ts`, `results.ts`, `transparency.ts`, `staff.ts`, `trocha-verde.ts`, `navigation.ts`…): recibe arreglos por parámetro, **no importa `astro:content` ni `node:fs`** y tiene test en `__tests__/`. La página `.astro` hace `getCollection()` y le pasa los datos. Las fechas del frontmatter se parsean como medianoche UTC: los cálculos de año/mes usan getters `getUTC*`.

`src/lib/constants.ts` centraliza `SITE`, `CONTACT`, `SOCIAL`, `NAV_ITEMS`/`SECONDARY_NAV` y las etiquetas de CTA (`CTA_TRIAL_LABEL`: un solo texto para todo botón que apunte a `/inscripciones`). **No hay cifras históricas del club** (`CLUB_STATS` se eliminó por no tener fuente): toda cifra visible sale del contenido (`getYearsActive()`, `summarizePrograms()`, `buildSeason()`, `summarizeTrees()`), y si el dato no existe, el bloque no se pinta.

### Sistema editorial — léelo antes de tocar cualquier sección

Toda sección se arma con el mismo vocabulario, no con clases sueltas: `SectionShell` (marco: `tone` plain|muted|tinted|dark|brand, `pattern`, `width`, `spacing`, `scrollDriven`) → `SectionIntro` (antetítulo + titular con `highlight` + bajada) → dato ilustrado (`StatFigure`, `FactGrid`, `Timeline`, `ClubSeal`; SVG generado en build con `elevationProfile()`) → paso siguiente. Componentes en `src/components/editorial/`, tokens en `src/lib/editorial.ts`, guía y referencia de cada página en `docs/04-sistema-editorial.md`. Reglas: contraste antes que color; cero JS nuevo (interactividad real → island con `client:visible`); el texto visible sale de las collections, no de la plantilla; `<section>` con `labelledby` y gráficos `aria-hidden` con equivalente textual; móvil primero. Los tonos alternan entre secciones contiguas.

### React islands

Islands montadas, **todas con `client:visible`** (no hay `client:load` en el sitio): `MobileMenu` y `SiteSearch` (en `Header.astro`), `ContactForm`, `InscriptionForm` (4 pasos), `ImageLightbox`, `TrochaVerdeMap` (Leaflet) y `TrackMapInteractive` (Leaflet + teselas de ESRI, monta sobre el SVG de `TrackMap.astro`). `SuccessConfetti` (importado por los formularios) trae `ConfettiBurst` con `import()` dinámico; ninguno es island. `SiteSearch` descarga Pagefind solo al abrir el diálogo. Los formularios envían a Web3Forms con `PUBLIC_WEB3FORMS_KEY` de `astro:env/client`.

### Layout y navegación

`BaseLayout.astro` monta `ClientRouter` (View Transitions), `SEOHead`, `AnnouncementBar` (próximo evento no cancelado de `events`), `Header` con `transition:persist`, `ConversionBar` (CTA móvil), `Analytics` y `ConsentBanner`, más el script inline del tema (ver Tokens) y otro que fija `--header-h` (para sub-navs sticky como `TrochaVerdeNav`) y el scroll-reveal (`.reveal` → `.revealed`). `<main>` lleva `transition:name="page-main"` escrito a mano porque los nombres autogenerados dependen del orden de render. La prop `noindex` añade la meta y además saca la página del índice de Pagefind. `/enlaces` usa `LinktreeLayout`. La regla de "sección activa" (`isActivePath` en `@lib/navigation`) la comparten Header y MobileMenu.

**`/equipo` está construida pero oculta**: `noindex`, fuera del sitemap, de `NAV_ITEMS` y del buscador, con `directivos` vacía, hasta que el club firme las autorizaciones de imagen. Los deportistas son menores: sus perfiles no se publican y qué nombre aparece en resultados lo decide el club.

### Analytics — GA4, catálogo cerrado, sin PII

- Catálogo cerrado en `src/lib/events.ts` (`EVENT_NAMES`, `ALLOWED_PARAM_KEYS`); interfaz neutral en `src/lib/analytics.ts` (`trackEvent`, `sanitizeParams`, `ageBucket` — nunca fecha de nacimiento); provider en `src/lib/analytics/providers/ga4.ts`. **`Analytics.astro` repite ambas listas inline** (`ALLOWED_EVENTS`/`ALLOWED_PARAMS`): un evento nuevo se declara en los dos sitios. Prohibido añadir params con PII (nombre, email, teléfono, EPS, dirección).
- Los clics se instrumentan sin JS por componente: `data-analytics-event="..."` + `data-analytics-{pdf-name,sponsor-id,program-id}` (delegación en `Analytics.astro`); desde código, `window.__trochaEmit(name, params)`. `ScrollDepth.astro` emite `scroll_depth` y lee su target de un marcador en el DOM, no de `define:vars` (bajo `ClientRouter`, `define:vars` pierde `data-astro-rerun`).
- **GA4 va en el hilo principal con `async`; no volver a Partytown.** Astro 7 reescribe los `<script>` con `define:vars` y descarta sus atributos: el script que lleva `src`/`async` no usa `define:vars`, el consent default (Consent Mode v2, todo `denied`; clave de `localStorage` `trocha-analytics-consent`) va antes de cargar gtag, y `Analytics.astro.test.ts` fija ambas condiciones (romperlo dejó al sitio dos semanas sin medir en agosto de 2026).
- Con `ClientRouter`, los pageviews posteriores al primero se emiten en `astro:page-load`.

### SEO y feeds

JSON-LD con los generadores de `src/lib/seo.ts`, pasados a `BaseLayout` por `jsonLd`; locale `es_CO`; fechas con `toColombiaIso()`. `rss.xml.ts` (noticias + eventos) y `news-sitemap.xml.ts` (Google News: ventana de 48 h **anclada a la fecha del artículo más reciente**, no a `Date.now()`, porque se evalúa en build). `public/robots.txt` bloquea `/enlaces`. Enlaces hacia redes/WhatsApp con `withUtm()` (`src/lib/utm.ts`; convención en docs/05).

### Trocha Verde

Inventario de árboles: páginas en `src/pages/trocha-verde/` (índice, `[species].astro`, `arboles/[slug].astro`), stats en `src/lib/trocha-verde.ts`, labels y colores en `src/lib/tree-utils.ts`, secciones `TrochaVerde*.astro`. `TrochaVerdeGrid.astro` está en reserva (ninguna página la importa); el plan era publicarla como `/trocha-verde/arboles` al pasar de 40 árboles, umbral ya superado: no montarla sin que el usuario lo decida. El mapa usa teselas de OpenStreetMap, permitidas en la CSP de `public/.htaccess`.

### Crónicas y tablero de temporada

Las noticias son capítulos de la temporada (`src/lib/chronicle.ts` cruza evento ↔ crónica ↔ álbum). El markdown de las crónicas usa clases editoriales de `global.css` (`.stat-strip`, `.stat-callout`, `.pull-quote`, `.thread`, `.standings-board`, `.circuit-map`) y, desde v5, piezas propias por crónica (`.visit-card`, `.day-clock`, `.clock-stamp`, `.ledger`, `.check-sheet`, `.thanks-wall`; catálogo y markup en `.claude/agents/content-marketer.md`). Todas son CSS puro con `reveal` opt-in y estado final visible sin JS; el `<noscript>` de `noticias/[...slug].astro` las repara sin JS y hay que ampliarlo con cada pieza nueva. La general (`SeasonStandings` en `/noticias`) se calcula en `results.ts` desde `src/content/results/*.yml` (una válida + una categoría por archivo). `buildStandings()` suma todo lo que encuentra: en la carpeta solo puede haber **una temporada**.

## Testing

| Proyecto | Archivos | Entorno | Notas |
|---|---|---|---|
| `astro` (`vitest.astro.config.ts`) | `*.astro.test.ts`, `*.test.ts` | node, `getViteConfig` de Astro | Renderiza `.astro` con el container de Astro; sin `globals`, se importa de `vitest` |
| `react` (`vitest.react.config.ts`) | `*.react.test.tsx` | jsdom, `globals: true` | Testing Library + jest-dom + `vitest-axe`; alias `astro:env/client` → `src/test/__mocks__/astro-env-client.ts` (ampliarlo si una island importa otra variable) |

Tests junto al código en `__tests__/`. Coverage solo mide `src/lib/**` (90/90/75/90) y `src/components/interactive/**` (80/80/70/80); global 70/75/70/70. El bloque `coverage` vive en el config raíz `vitest.config.ts` (el que declara los dos proyectos): dentro de un config de proyecto Vitest lo ignora en silencio y los thresholds dejan de bloquear. Regresiones que no son unitarias: `content-validation.test.ts` (contenido real y referencias cruzadas), `Analytics.astro.test.ts` (Partytown / `define:vars`), `src/test/fonts.test.ts` (subsets y preloads).

## CI/CD y deploy

Los dos workflows suben a Hostinger por FTPS con **lftp** (`mirror --reverse --only-newer` sobre `/public_html`; FTP-Deploy-Action fallaba con ECONNRESET).

- `deploy.yml` (push a `develop`): job `ci` (typecheck + `npm test`) es gate del job `deploy` (`build:only` + lftp, environment `develop`).
- `deploy-prod.yml` (push a `main`): `npm run build` (incluye `astro check`) + lftp, environment `production`, **sin tests**.
- El flujo previsto es feature → `develop` → `main`, pero en la práctica los cambios entran directo a `main` (commits y merges de ramas `claude/*`) y `develop` se sincroniza después desde `main`: **producción no tiene gate de tests**. Antes de hacer push o merge a `main`, correr `npm run test:run`.
- `PUBLIC_*` van como *Variables* del Environment; `FTP_SERVER` / `FTP_USERNAME` / `FTP_PASSWORD` como *Secrets*.
- `public/.htaccess` lleva cabeceras de seguridad y la CSP (`'wasm-unsafe-eval'` para Pagefind, `unpkg.com` para Sveltia, teselas de OpenStreetMap y de ESRI para Leaflet, GA4) y bloquea `config.yml` y archivos ocultos. Todo origen externo nuevo (script, tesela, iframe, imagen) se agrega a la CSP; como `.htaccess` solo aplica en Hostinger, lo que falte se rompe en producción y no en `npm run dev`/`preview`.

## Convenciones y restricciones

- Presupuesto: Lighthouse 95+, LCP < 2.0 s, INP < 200 ms, CLS < 0.05; WCAG 2.1 AA (contraste 4.5:1, focus visible, focus trap en overlays). Tailwind primero y sin frameworks extra. Lo que Tailwind no exprese (keyframes, `clip-path`, animaciones ligadas al scroll) va en un `<style>` del propio componente, que Astro encapsula y solo carga en las páginas que lo usan; las trampas están en docs/09 (`is:global` con prefijo único si el selector mira marcado de otro componente o de una isla; nunca un `<style>` dentro de un condicional). `global.css` es solo para lo que comparte todo el sitio (decisión del usuario, 7-oct-2026). Imágenes locales con `<Image>` de `astro:assets`; con el `image.layout: 'constrained'` global, su capa CSS le gana a `h-*`/`w-full`/`object-*` de Tailwind: usar `max-h-full`/`max-w-full`, `aspect-[w/h]` o la prop `fit` (docs/09; ya causó un hotfix en producción).
- ESLint: el prefijo `_` marca bindings no usados a propósito; `const { omitido, ...rest }` es válido. Prettier: comillas simples, 100 columnas, plugin de Tailwind.
- Nada inventado: ni cifras sin fuente, ni testimonios (la colección se eliminó), ni política de protección infantil (no existe; el pie solo publica la línea 141 del ICBF). Edad mínima 4, derivada de `programs`.
- Permisos del proyecto en `.claude/settings.json`: allowlist de scripts npm/git; `rm -rf`, `git push --force` y `git reset --hard` están denegados.

## Referencias

- `docs/04-sistema-editorial.md` — guía del sistema editorial, referencia de cada página (incluida `/la-pista`, §28) y estado de la migración. **Obligatorio antes de rediseñar.**
- `docs/02-technical-architecture.md` — arquitectura técnica y ADRs. `docs/03-content-strategy.md` — modelo de contenido, taxonomía, SEO estructural. `docs/01-ux-architecture.md` — personas y flujos.
- `docs/05-convencion-utm.md` (con sus divergencias conocidas en el código), `docs/07-plan-la-pista.md` y `docs/10-plan-media-hostinger.md` (fotos de crónicas, Trocha Verde y videos fuera de git, servidos desde `/public_html/media/`) — planes vivos con tareas `[ ]`/`[x]`.
- `docs/06-plan-animaciones.md` y `docs/08-plan-creatividad-ui.md` — planes cerrados, conservados como registro; lo vigente pasó a `docs/04` §2.5-2.6. `docs/09-deuda-de-tooling.md` — bugs de Prettier, del scoping de Astro y de la capa CSS de `astro:assets`, con sus rodeos.
- `claudedocs/` — diagnósticos, planes y material de trabajo por sesión o evento (válidas, crónicas, tráfico orgánico, curaduría fotográfica).
- `.claude/agents/` — agentes organizados como compañía digital (C-suite → directores → especialistas → ingenieros → auditores); `.claude/teams/` — teams; `.claude/agent-memory/` — memoria por agente, versionada.
