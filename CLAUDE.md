# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sitio estático del **Club Deportivo Trocha y Ruta** (escuela de ciclomontañismo para niños desde los 4 años, Yumbo, Valle del Cauca). Astro 7 con `output: 'static'`; el build genera ~146 páginas, la mayoría fichas de árboles y especies de Trocha Verde. Contenido visible en español colombiano; código e identificadores en inglés.

## Comandos

```bash
npm run dev            # localhost:4321
npm run build          # astro check + astro build + pagefind --site dist
npm run build:only     # sin astro check (lo usa el deploy de develop, que ya corrió typecheck)
npm run preview
npm run typecheck      # astro check
npm run lint           # eslint src   (lint:fix con --fix)
npm run format:check   # Prettier     (format escribe). Ni lint ni formato son gate de CI

npm test               # vitest en watch (en CI corre una sola vez)
npm run test:run       # una pasada: es el gate del pipeline
npm run test:astro     # solo proyecto "astro" (node)
npm run test:react     # solo proyecto "react" (jsdom)
npm run test:coverage  # con thresholds

# Un solo archivo — hay que indicar el proyecto:
npx vitest run --project astro src/lib/__tests__/utils.test.ts
npx vitest run --project react src/components/interactive/__tests__/ContactForm.react.test.tsx

./scripts/subset-fonts.sh   # regenera public/fonts/*-latin.woff2 desde fonts-src/ (pyftsubset + brotli)
```

Node ≥ 22.12 (`engines`; CI usa 22.12). Variables de entorno (`.env.example`): `PUBLIC_WEB3FORMS_KEY`, `PUBLIC_GA4_MEASUREMENT_ID`, `PUBLIC_CLOUDINARY_CLOUD_NAME`, tipadas en `env.schema` de `astro.config.mjs`, todas opcionales, se importan desde `astro:env/client`. Sin `PUBLIC_GA4_MEASUREMENT_ID` no se renderizan ni `Analytics.astro` ni `ConsentBanner.astro`.

## Stack (lo que no dice el package.json)

- **Astro 7** estático, `site: https://clubdeportivotrochayruta.org`. El sitemap excluye `/enlaces` (linktree del QR) y `/equipo` (oculta). Iconos `astro-icon` + Phosphor (`ph:*`).
- **Tailwind 4** vía `@tailwindcss/vite`; no existe `tailwind.config`. Tokens en `@theme {}` de `src/styles/global.css`; `@source not` saca `docs/` y `.claude/` del escáner de clases.
- **React 19** solo en `src/components/interactive/`. **Vitest 4** con dos proyectos. **Pagefind** indexa `dist/` al final del build.
- **Sveltia CMS** en `public/admin/` (se carga desde unpkg, sin npm). Backend `github` sobre `Club-Deportivo-Trocha-y-Ruta/main-page`, rama `main`, con `editorial_workflow`. No hay colección `settings`: los datos del sitio viven en `src/lib/constants.ts`.
- Aliases TS: `@components/*`, `@layouts/*`, `@lib/*`, `@assets/*`, `@types/*`.
- `netlify.toml`, `wrangler.toml` y `workers/donations/` son restos de experimentos; el hosting real es Hostinger. `docs/02-technical-architecture.md` es de marzo de 2026 y lleva una nota con lo que cambió después (Astro 7, Hostinger, GA4): mandan `package.json` y `.github/workflows/`.

### Tokens de diseño — reglas

- Teal `--color-primary #20b7c9` y lima `--color-accent #8be000` **no cumplen contraste como texto** sobre fondo claro: para texto usar `primary-deep` / `accent-deep`. Sobre fondos de color va texto grafito (`text-surface-dark`).
- Todo token nuevo lleva **nombre propio** (`--radius-chip/control/card/pill/plate`, `--shadow-card/raised/overlay/pressable`, `--ease-spring/pop`, `--duration-micro/celebration`). Definir `--radius-lg`, `--shadow-md` o `--ease-out` pisa la escala por defecto de Tailwind 4 y cambia todos los `rounded-*`/`shadow-*` del sitio.
- Animaciones: solo `transform`/`opacity` (excepciones documentadas en docs/08), bajo `@supports` + `prefers-reduced-motion`, con estado final visible sin soporte. Con `animation-timeline: view()/scroll()` usar **longhands**: Lightning CSS rompe el shorthand `animation`.
- Fuentes: `public/fonts/*-latin.woff2` son subsets generados desde `fonts-src/` (no se despliega). El `unicode-range` de `global.css` debe coincidir con `$UNICODES` del script; `src/test/fonts.test.ts` lo verifica y comprueba que los archivos sean WOFF2 reales (hubo un `.woff2` que era una página 404 de GitHub).

## Arquitectura

### Contenido: schemas → colecciones → CMS

- 15 colecciones registradas en `src/content.config.ts` con glob loaders. **Todos los schemas Zod viven en `src/lib/schemas.ts`** (importan de `astro/zod`) y se testean en `src/lib/__tests__/schemas.test.ts`.
- Pobladas: `news`, `events`, `gallery`, `programs`, `sponsors`, `faqs`, `social-initiatives`, `milestones`, `trees` (77), `species` (32), `riders` (5 fichas, **todas `draft: true`**) y `pages` (solo `programas.md`: copy que la página no puede deducir, como el bloque `agePicker`).
- Vacías: `results` (loader solo `yaml|yml|json`; su README documenta el formato y queda fuera), `directivos` (README excluido por el patrón) y `rutas` (**sin directorio**: crearlo antes de usarla).
- Al cambiar un campo se cambian los tres: **schema Zod + `public/admin/config.yml` + los `.md`**.
- Relaciones por slug en frontmatter: noticia→`relatedEvent`/`relatedGallery`/`galleryFolder`; evento→`relatedGallery`/`relatedNews[]`; álbum→`relatedEvent`; rider→`program`; iniciativa social→`relatedGallery`/`relatedNews[]`; árbol→`species` (por **nombre común**, no por id). `src/lib/__tests__/content-validation.test.ts` valida el frontmatter real y que toda referencia (`relatedEvent`, `relatedGallery`, `relatedNews`, `program`) resuelva, **incluidos los drafts**; `trees.species` queda fuera. En las páginas nunca se arma una URL desde un campo sin comprobar que resuelve (patrón de `chronicle.ts` / `gallery.ts`).
- Imágenes: `src/assets/images/` pasa por `astro:assets` (y es el `media_folder` del CMS); las fotos de crónicas, álbumes y logos van por ruta pública en `public/images/{news,sponsors,trocha-verde}/`. Datos fuera de colecciones: `src/data/transparencia-documentos.json` + PDFs en `public/documentos/transparencia/`.

### Módulos puros por página (`src/lib/`)

La lógica derivada de cada página vive en un módulo puro (`home.ts`, `calendar.ts`, `news.ts`, `chronicle.ts`, `gallery.ts`, `programs.ts`, `results.ts`, `transparency.ts`, `staff.ts`, `trocha-verde.ts`, `navigation.ts`…): recibe arreglos por parámetro, **no importa `astro:content` ni `node:fs`** y tiene test en `__tests__/`. La página `.astro` hace `getCollection()` y le pasa los datos. Las fechas del frontmatter se parsean como medianoche UTC: los cálculos de año/mes usan getters `getUTC*`.

`src/lib/constants.ts` centraliza `SITE`, `CONTACT`, `SOCIAL`, `NAV_ITEMS`/`SECONDARY_NAV` y las etiquetas de CTA (`CTA_TRIAL_LABEL`: un solo texto para todo botón que apunte a `/inscripciones`). **No hay cifras históricas del club** (`CLUB_STATS` se eliminó por no tener fuente): toda cifra visible sale del contenido (`getYearsActive()`, `summarizePrograms()`, `buildSeason()`, `summarizeTrees()`), y si el dato no existe, el bloque no se pinta.

### Sistema editorial — léelo antes de tocar cualquier sección

Toda sección se arma con el mismo vocabulario, no con clases sueltas: `SectionShell` (marco: `tone` plain|muted|tinted|dark|brand, `pattern`, `width`, `spacing`, `scrollDriven`) → `SectionIntro` (antetítulo + titular con `highlight` + bajada) → dato ilustrado (`StatFigure`, `FactGrid`, `Timeline`, `ClubSeal`; SVG generado en build con `elevationProfile()`) → paso siguiente. Componentes en `src/components/editorial/`, tokens en `src/lib/editorial.ts`, guía y referencia de cada página en `docs/04-sistema-editorial.md`. Reglas: contraste antes que color; cero JS nuevo (interactividad real → island con `client:visible`); el texto visible sale de las collections, no de la plantilla; `<section>` con `labelledby` y gráficos `aria-hidden` con equivalente textual; móvil primero. Los tonos alternan entre secciones contiguas.

### React islands

Seis islands montadas, **todas con `client:visible`** (no hay `client:load` en el sitio): `MobileMenu` y `SiteSearch` (en `Header.astro`), `ContactForm`, `InscriptionForm` (4 pasos), `ImageLightbox`, `TrochaVerdeMap` (Leaflet). `SuccessConfetti` (importado por los formularios) trae `ConfettiBurst` con `import()` dinámico; ninguno es island. `SiteSearch` descarga Pagefind solo al abrir el diálogo. Los formularios envían a Web3Forms con `PUBLIC_WEB3FORMS_KEY` de `astro:env/client`.

### Layout y navegación

`BaseLayout.astro` monta `ClientRouter` (View Transitions), `SEOHead`, `AnnouncementBar` (próximo evento no cancelado de `events`), `Header` con `transition:persist`, `ConversionBar` (CTA móvil), `Analytics` y `ConsentBanner`, más un script inline que fija `--header-h` (para sub-navs sticky como `TrochaVerdeNav`) y el scroll-reveal (`.reveal` → `.revealed`). `<main>` lleva `transition:name="page-main"` escrito a mano porque los nombres autogenerados dependen del orden de render. La prop `noindex` añade la meta y además saca la página del índice de Pagefind. `/enlaces` usa `LinktreeLayout`. La regla de "sección activa" (`isActivePath` en `@lib/navigation`) la comparten Header y MobileMenu.

**`/equipo` está construida pero oculta**: `noindex`, fuera del sitemap, de `NAV_ITEMS` y del buscador, con `directivos` vacía, hasta que el club firme las autorizaciones de imagen. Los deportistas son menores: sus perfiles no se publican y qué nombre aparece en resultados lo decide el club.

### Analytics — GA4, catálogo cerrado, sin PII

- Catálogo cerrado en `src/lib/events.ts` (`EVENT_NAMES`, `ALLOWED_PARAM_KEYS`); interfaz neutral en `src/lib/analytics.ts` (`trackEvent`, `sanitizeParams`, `ageBucket` — nunca fecha de nacimiento); provider en `src/lib/analytics/providers/ga4.ts`. **`Analytics.astro` repite ambas listas inline** (`ALLOWED_EVENTS`/`ALLOWED_PARAMS`): un evento nuevo se declara en los dos sitios. Prohibido añadir params con PII (nombre, email, teléfono, EPS, dirección).
- Los clics se instrumentan sin JS por componente: `data-analytics-event="..."` + `data-analytics-{pdf-name,sponsor-id,program-id}` (delegación en `Analytics.astro`); desde código, `window.__trochaEmit(name, params)`. `ScrollDepth.astro` emite `scroll_depth` y lee su target de un marcador en el DOM, no de `define:vars` (bajo `ClientRouter`, `define:vars` pierde `data-astro-rerun`).
- **GA4 va en el hilo principal con `async`; no volver a Partytown.** Astro 7 reescribe los `<script>` con `define:vars` y descarta sus atributos: el script que lleva `src`/`async` no usa `define:vars`, el consent default (Consent Mode v2, todo `denied`; clave de `localStorage` `trocha-analytics-consent`) va antes de cargar gtag, y `Analytics.astro.test.ts` fija ambas condiciones. Desde el 12 de agosto de 2026 el sitio pasó dos semanas sin medir nada por esto.
- Con `ClientRouter`, los pageviews posteriores al primero se emiten en `astro:page-load`.

### SEO y feeds

JSON-LD con los generadores de `src/lib/seo.ts`, pasados a `BaseLayout` por `jsonLd`; locale `es_CO`; fechas con `toColombiaIso()`. `rss.xml.ts` (noticias + eventos) y `news-sitemap.xml.ts` (Google News: ventana de 48 h **anclada a la fecha del artículo más reciente**, no a `Date.now()`, porque se evalúa en build). `public/robots.txt` bloquea `/enlaces`. Enlaces hacia redes/WhatsApp con `withUtm()` (`src/lib/utm.ts`; convención en docs/05).

### Trocha Verde

Inventario de árboles: páginas en `src/pages/trocha-verde/` (índice, `[species].astro`, `arboles/[slug].astro`), stats en `src/lib/trocha-verde.ts`, labels y colores en `src/lib/tree-utils.ts`, secciones `TrochaVerde*.astro`. `TrochaVerdeGrid.astro` está en reserva: no importarla en el índice hasta pasar de 40 árboles. El mapa usa teselas de OpenStreetMap, permitidas en la CSP de `public/.htaccess`.

### Crónicas y tablero de temporada

Las noticias son capítulos de la temporada (`src/lib/chronicle.ts` cruza evento ↔ crónica ↔ álbum). El markdown de las crónicas usa clases editoriales de `global.css` (`.stat-strip`, `.stat-callout`, `.pull-quote`, `.standings-board`, `.circuit-map`). La general (`SeasonStandings` en `/noticias`) se calcula en `results.ts` desde `src/content/results/*.yml` (una válida + una categoría por archivo). `buildStandings()` suma todo lo que encuentra: en la carpeta solo puede haber **una temporada**.

## Testing

| Proyecto | Archivos | Entorno | Notas |
|---|---|---|---|
| `astro` (`vitest.astro.config.ts`) | `*.astro.test.ts`, `*.test.ts` | node, `getViteConfig` de Astro | Renderiza `.astro` con el container de Astro; sin `globals`, se importa de `vitest` |
| `react` (`vitest.react.config.ts`) | `*.react.test.tsx` | jsdom, `globals: true` | Testing Library + jest-dom + `vitest-axe`; alias `astro:env/client` → `src/test/__mocks__/astro-env-client.ts` (ampliarlo si una island importa otra variable) |

Tests junto al código en `__tests__/`. Coverage solo mide `src/lib/**` (90/90/75/90) y `src/components/interactive/**` (80/80/70/80); global 70/75/70/70. Regresiones que no son unitarias: `content-validation.test.ts` (contenido real y referencias cruzadas), `Analytics.astro.test.ts` (Partytown / `define:vars`), `src/test/fonts.test.ts` (subsets y preloads).

## CI/CD y deploy

Flujo: rama de feature → `develop` (QA) → `main` (producción). Los dos workflows suben a Hostinger por FTPS con **lftp** (`mirror --reverse --only-newer` sobre `/public_html`; FTP-Deploy-Action fallaba con ECONNRESET).

- `deploy.yml` (push a `develop`): job `ci` (typecheck + `npm test`) es gate del job `deploy` (`build:only` + lftp, environment `develop`).
- `deploy-prod.yml` (push a `main`): `npm run build` + lftp, environment `production`, **sin tests** (se asume que ya pasó por develop).
- `PUBLIC_*` van como *Variables* del Environment; `FTP_SERVER` / `FTP_USERNAME` / `FTP_PASSWORD` como *Secrets*.
- `public/.htaccess` lleva cabeceras de seguridad y la CSP (`'wasm-unsafe-eval'` para Pagefind, `unpkg.com` para Sveltia, `*.tile.openstreetmap.org` para Leaflet) y bloquea `config.yml` y archivos ocultos.

## Convenciones y restricciones

- Presupuesto: Lighthouse 95+, LCP < 2.0 s, INP < 200 ms, CLS < 0.05; WCAG 2.1 AA (contraste 4.5:1, focus visible, focus trap en overlays). Solo Tailwind: sin CSS por componente ni frameworks extra. Imágenes locales con `<Image>` de `astro:assets`.
- ESLint: el prefijo `_` marca bindings no usados a propósito; `const { omitido, ...rest }` es válido. Prettier: comillas simples, 100 columnas, plugin de Tailwind.
- Nada inventado: ni cifras sin fuente, ni testimonios (la colección se eliminó), ni política de protección infantil (no existe; el pie solo publica la línea 141 del ICBF). Edad mínima 4, derivada de `programs`.
- Permisos del proyecto en `.claude/settings.json`: allowlist de scripts npm/git; `rm -rf`, `git push --force` y `git reset --hard` están denegados.

## Referencias

- `docs/04-sistema-editorial.md` — guía del sistema editorial, referencia de cada página y estado de la migración. **Obligatorio antes de rediseñar.**
- `docs/03-content-strategy.md` — modelo de contenido, taxonomía, CMS. `docs/01-ux-architecture.md` — personas, flujos, wireframes (en parte histórico).
- `docs/05-convencion-utm.md`, `docs/06-plan-animaciones.md`, `docs/07-plan-la-pista.md` (bloqueado por insumos del club), `docs/08-plan-creatividad-ui.md` — planes retomables con tareas `[ ]`/`[x]`.
- `claudedocs/` — diagnósticos y planes de sesión (refresh visual, tráfico orgánico, curaduría fotográfica).
- `.claude/agents/` — 22 agentes organizados como compañía digital (C-suite → directores → especialistas → ingenieros → auditores); `.claude/teams/` — 5 teams; `.claude/agent-memory/` — memoria por agente, versionada.
