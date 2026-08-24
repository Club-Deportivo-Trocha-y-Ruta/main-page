# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sitio web estático del **Club Deportivo Trocha y Ruta** — club de ciclomontañismo para niños desde 4 años en Yumbo, Valle del Cauca, Colombia. Migración completa desde WordPress a Astro. El build genera ~146 páginas estáticas (23 rutas `.astro`, varias dinámicas).

## Comandos

```bash
npm run dev          # Dev server en localhost:4321
npm run build        # astro check + astro build + pagefind --site dist → dist/
npm run build:only   # astro build + pagefind, sin astro check (lo usa el job deploy de develop)
npm run preview      # Preview del build local
npm run typecheck    # astro check
npm run lint         # ESLint (eslint src)
npm run lint:fix     # ESLint con auto-fix
npm run format       # Prettier (escribe)
npm run format:check # Prettier (solo verifica)

npm test             # Vitest en modo watch (ambos proyectos)
npm run test:run     # Vitest una sola vez (CI usa este gate)
npm run test:astro   # Solo proyecto "astro" (componentes .astro + lib)
npm run test:react   # Solo proyecto "react" (islands, jsdom)
npm run test:coverage # Coverage con thresholds estrictos

# Un solo archivo de test:
npx vitest run --project react src/components/interactive/__tests__/ContactForm.react.test.tsx
npx vitest run --project astro src/lib/__tests__/utils.test.ts
```

Node >= 22.12 requerido (engines en `package.json`; CI usa Node 22).

## Stack

| Capa | Tecnología | Notas críticas |
|------|-----------|----------------|
| Framework | Astro ^7.1 | `output: 'static'`. No saltar de major sin validar breaking changes |
| Estilos | Tailwind CSS 4 | Via `@tailwindcss/vite`. **NO existe config JS** — tokens en `@theme {}` de `src/styles/global.css` |
| Islands | React 19 | Solo 6 componentes en `src/components/interactive/` |
| CMS | Sveltia CMS | Estático, sin npm. `public/admin/` (index.html + config.yml) |
| Hosting | Hostinger (FTPS) | Deploy via GitHub Actions + **lftp** (no FTP-Deploy-Action) |
| Formularios | Web3Forms | `PUBLIC_WEB3FORMS_KEY` |
| Analytics | GA4 (gtag.js `async`) | Consent Mode v2, banner custom. `PUBLIC_GA4_MEASUREMENT_ID`. **Sin Partytown** — ver nota abajo |
| Imágenes | astro:assets + Cloudinary | Dominio `res.cloudinary.com` habilitado. `PUBLIC_CLOUDINARY_CLOUD_NAME` |
| Iconos | astro-icon + Phosphor | `ph:*` incluido completo |
| Mapas | Leaflet | Solo en TrochaVerdeMap island |
| Buscador | Pagefind | Índice estático generado al final del `build` (`pagefind --site dist`); el island lo carga solo al abrir el diálogo |
| Forms/validación | react-hook-form + zod | Zod también define los schemas de contenido |

Aliases TS (tsconfig): `@components/*`, `@layouts/*`, `@lib/*`, `@assets/*`, `@types/*`.

### Tailwind 4 — tokens en CSS

Design tokens en `src/styles/global.css` dentro de `@theme {}` (primary teal `#20b7c9`, accent lima `#8be000`, surface, text). Importante: existen variantes `--color-primary-deep` / `--color-accent-deep` para **texto** teal/lima sobre fondos claros — los tonos base no cumplen contraste WCAG AA como texto. También hay tokens de radio (`--radius-chip/control/card/pill`) y de sombra (`--shadow-card/raised/overlay`) con nombres propios a propósito: usar `--radius-sm/md/lg/xl/2xl` o `--shadow-sm/md/lg` sobrescribiría la escala por defecto de Tailwind 4 y cambiaría todos los `rounded-*`/`shadow-*` existentes del sitio. Fuentes locales (Inter Variable, Plus Jakarta Sans) en `public/fonts/` via `@font-face`.

### React Islands — uso mínimo

Astro genera zero-JS por defecto. Solo estos 6 componentes hidratan:

| Componente | Directiva |
|-----------|-----------|
| `MobileMenu.tsx` | `client:load` (único permitido con load) |
| `ContactForm.tsx` | `client:visible` |
| `InscriptionForm.tsx` (4 pasos, localStorage 48h TTL) | `client:visible` |
| `ImageLightbox.tsx` | `client:visible` |
| `TrochaVerdeMap.tsx` (Leaflet) | `client:visible` |
| `SiteSearch.tsx` (Pagefind, en la cabecera) | `client:visible` |

**Regla**: nunca `client:load` salvo MobileMenu; no agregar `client:*` a componentes que no requieran interactividad.

## Arquitectura de contenido

Las colecciones se definen en `src/content.config.ts` (raíz de src, no `src/content/config.ts`) con glob loaders; **todos los schemas Zod viven centralizados en `src/lib/schemas.ts`** y se testean en `src/lib/__tests__/schemas.test.ts`.

14 colecciones definidas; 10 con directorio y contenido: `events`, `faqs`, `gallery`, `news`, `programs`, `riders`, `social-initiatives`, `species` (~32), `sponsors`, `trees` (~77). `results` ya tiene directorio (`src/content/results/`) pero **sin datos todavía**: solo su `README.md`, que documenta el formato y que el loader ignora porque lee `yaml`/`yml`/`json`. Sin archivos, el tablero de la temporada de `/noticias` no se pinta. Otras 3 están en config pero **sin directorio aún**: `directivos`, `rutas`, `pages` — si trabajas con ellas, crea primero el directorio.

Relaciones por referencia en frontmatter: evento→galería (`relatedGallery`), evento→noticias (`relatedNews`), noticia→galería (`relatedGallery`/`galleryFolder`), rider→programa (`program`), árbol→especie.

Sveltia CMS (`public/admin/config.yml`) debe mantenerse en sync con los schemas Zod cuando cambien campos.

## Subsistema Trocha Verde

Iniciativa ambiental (inventario de árboles) con su propio conjunto de piezas:
- Páginas: `src/pages/trocha-verde/` (index, `[species].astro`, `arboles/[slug].astro`)
- Lógica: `src/lib/trocha-verde.ts` (stats agregadas), `src/lib/tree-utils.ts` (labels/colores compartidos)
- Secciones: `TrochaVerde*.astro` en `src/components/sections/` (`TrochaVerdeGrid` existe pero está en reserva — no importar en index hasta tener más contenido)
- Colecciones: `trees` + `species`

## Sistema editorial — cómo se diseña una sección

Toda sección rediseñada se arma con el mismo vocabulario, no con clases sueltas:
`SectionShell` (marco: `tone`/`pattern`/`width`/`spacing`), `SectionIntro` (antetítulo +
titular con `highlight` + bajada), `StatFigure`/`FactGrid` (dato ilustrado) y un paso
siguiente. Los tokens viven en `src/lib/editorial.ts`; los componentes, en
`src/components/editorial/`.

Reglas: toda cifra sale del contenido (si el dato no existe, el bloque no se pinta); cero
JS nuevo —las ilustraciones son SVG generado en build—; el texto visible vive en las
collections, no en la plantilla. La sección de programas (`ProgramsGrid.astro`,
`ProgramPathway.astro`, `/programas`) es la referencia a copiar.

Guía completa y estado de la migración por página: `docs/04-sistema-editorial.md`.

## Analytics — catálogo cerrado, sin PII

Arquitectura provider-neutral en `src/lib/`:
- `events.ts` — catálogo cerrado `EVENT_NAMES` + whitelist `ALLOWED_PARAM_KEYS`. Todo evento/param fuera de lista se descarta en sanitización. **Prohibido agregar params con PII** (nombre, email, teléfono, fecha nacimiento, EPS, dirección)
- `analytics.ts` — interfaz neutral de tracking
- `analytics/providers/ga4.ts` — implementación GA4 (gtag.js en el hilo principal)
- `ConsentBanner.astro` + `Analytics.astro` en components/common

Para agregar un evento: declararlo en `EVENT_NAMES`, y su param (si es nuevo) en la whitelist.

**No devolver GA4 a Partytown.** Entre el 12 y el 24 de agosto de 2026 el sitio no midió nada:
el tag vivía en un web worker con `type="text/partytown"` y el deploy de Astro 7 lo apagó en
seco. Astro 7 reescribe todo script con `define:vars` para inyectar las variables y **descarta
sus atributos** en el proceso, así que el bloque de consentimiento perdió su
`type="text/partytown"`, pasó a correr en el hilo principal y sobrescribió el puente
`window.gtag` de Partytown. Cero hits, cero errores en consola. Reglas que quedan:

- En `Analytics.astro`, el script que lleva atributos (`src`/`async`) **no** usa `define:vars`.
- El consentimiento por defecto se declara **antes** de cargar gtag.js (Consent Mode v2).
- `Analytics.astro.test.ts` fija ambas condiciones; si alguien vuelve a mover el tag a un
  worker, el test falla.

## Testing

Vitest 4 con dos proyectos (`vitest.config.ts` → projects):

| Proyecto | Convención de nombre | Entorno | Notas |
|----------|---------------------|---------|-------|
| `astro` | `*.astro.test.ts` y `*.test.ts` | node | Usa `getViteConfig` de Astro; setup `src/test/setup-astro.ts` |
| `react` | `*.react.test.tsx` | jsdom | Testing Library + vitest-axe; setup `src/test/setup-react.ts` |

El proyecto react **stubbea `astro:env/client`** via alias a `src/test/__mocks__/astro-env-client.ts` (el virtual module no existe en Vite puro). Si un island importa de `astro:env/client`, el mock debe cubrirlo.

Coverage (solo `src/lib/**` y `src/components/interactive/**`): global 70/75/70/70; `src/lib` 90%; `interactive` 80%. Tests en `__tests__/` junto al código.

## CI/CD

Dos workflows en `.github/workflows/`:
- `deploy.yml` (push a `develop`): job `ci` (typecheck + `npm test`) como **gate** → job `deploy` (`build:only` —sin astro check, el typecheck ya corrió en `ci`— + lftp a Hostinger, environment `develop`)
- `deploy-prod.yml` (push a `main`): build + deploy directo, **sin tests** — asume que el código ya pasó el gate en develop

Deploy usa **lftp** con reintentos (FTP-Deploy-Action fallaba con ECONNRESET contra Hostinger). Variables públicas (`PUBLIC_*`) van como Variables del Environment; credenciales FTP como Secrets. Flujo de trabajo: feature branch → `develop` (QA) → `main` (producción).

Archivos legacy no activos: `netlify.toml`, `wrangler.toml`, `workers/donations/` (experimento Cloudflare sin código fuente) — el hosting real es Hostinger.

## Restricciones

- **Performance budget**: Lighthouse 95+, LCP < 2.0s, INP < 200ms, CLS < 0.05
- **WCAG 2.1 AA**: contraste 4.5:1 (usar tokens `-deep` para texto de marca), focus visible, keyboard nav, focus trap en overlays
- **Sin frameworks CSS extra** — solo Tailwind
- **Idioma**: contenido visible en español colombiano; código e identificadores en inglés
- SEO: JSON-LD via generators en `src/lib/seo.ts` + `SEOHead.astro`; locale `es_CO`; la página `/enlaces` (linktree) se excluye del sitemap

## Referencias

- `docs/01-ux-architecture.md` — wireframes, flujos, personas (al implementar UI)
- `docs/02-technical-architecture.md` — ADRs y configs (al configurar)
- `docs/03-content-strategy.md` — schemas completos, taxonomía, CMS (al tocar collections)
- `docs/04-sistema-editorial.md` — **léelo antes de rediseñar cualquier sección o página**
- `docs/05-convencion-utm.md` — etiquetado de enlaces compartidos (al preparar difusión en redes/WhatsApp)
- `docs/06-plan-animaciones.md` — plan retomable de micro-interacciones y scroll-driven (CSS puro, sin runtimes)
- `docs/07-plan-la-pista.md` — plan retomable de la página `/la-pista` (colección `obstaculos`, flipbook CSS de los saltos, mapa SVG); bloqueado por insumos del club
- `.claude/agents/` — 22 agentes de proyecto organizados como compañía digital (C-suite → engineers → auditors); `.claude/teams/` — 5 teams para workflows multi-departamento
- `.claude/settings.json` — allowlist de comandos npm/git del proyecto; `rm -rf`, `git push --force` y `git reset --hard` en deny list
