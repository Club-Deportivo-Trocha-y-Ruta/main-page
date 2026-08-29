# Club Deportivo Trocha y Ruta

Sitio web oficial del **Club Deportivo Trocha y Ruta** — escuela de ciclomontañismo para niños desde los 4 años, fundada en 2010 en Yumbo, Valle del Cauca, Colombia.

> *Deporte, formación y contacto con la naturaleza*

Producción: <https://clubdeportivotrochayruta.org>

## Stack

| Capa | Tecnología |
|------|-----------|
| Framework | [Astro](https://astro.build) 7 (SSG, `output: 'static'`) |
| Estilos | [Tailwind CSS](https://tailwindcss.com) 4 vía Vite plugin (tokens en `@theme {}`, sin `tailwind.config`) |
| Islands | [React](https://react.dev) 19 (6 componentes interactivos, todos `client:visible`) |
| Contenido | Content Collections con schemas [Zod](https://zod.dev) (`src/lib/schemas.ts`) |
| CMS | [Sveltia CMS](https://github.com/sveltia/sveltia-cms) en `/admin/` |
| Buscador | [Pagefind](https://pagefind.app) (índice estático generado en el build) |
| Formularios | [Web3Forms](https://web3forms.com) |
| Imágenes | `astro:assets` + [Cloudinary](https://cloudinary.com) |
| Analytics | GA4 con Consent Mode v2 y banner propio |
| Tests | [Vitest](https://vitest.dev) 4 (proyectos `astro` y `react`), Testing Library, vitest-axe |
| Hosting | [Hostinger](https://www.hostinger.com) (FTPS con lftp) desde GitHub Actions |

## Requisitos

- Node.js ≥ 22.12
- npm

## Inicio rápido

```bash
git clone https://github.com/Club-Deportivo-Trocha-y-Ruta/main-page.git
cd main-page
npm install
cp .env.example .env   # opcional: sin variables el sitio funciona, pero sin analytics ni envío de formularios
npm run dev
```

El sitio queda en `http://localhost:4321`.

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | `astro check` + `astro build` + índice de Pagefind → `dist/` |
| `npm run build:only` | Build sin type-checking (lo usa el pipeline de `develop`, que ya lo corrió) |
| `npm run preview` | Preview del build local |
| `npm run typecheck` | `astro check` |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` / `format:check` | Prettier |
| `npm test` | Vitest en modo watch |
| `npm run test:run` | Vitest una sola vez (gate de CI) |
| `npm run test:astro` / `test:react` | Solo un proyecto de Vitest |
| `npm run test:coverage` | Cobertura con thresholds |
| `./scripts/subset-fonts.sh` | Regenera los subsets de fuentes en `public/fonts/` (requiere `fonttools` + `brotli`) |

Un solo archivo de test: `npx vitest run --project astro src/lib/__tests__/utils.test.ts`.

## Estructura del proyecto

```
src/
├── assets/images/     # Imágenes procesadas por astro:assets
├── components/
│   ├── common/        # Header, Footer, SEOHead, Analytics, tarjetas…
│   ├── editorial/     # Sistema editorial: SectionShell, SectionIntro, StatFigure…
│   ├── interactive/   # React islands
│   └── sections/      # Secciones de página
├── content/           # 15 Content Collections (markdown / YAML)
├── content.config.ts  # Registro de colecciones
├── data/              # transparencia-documentos.json
├── layouts/           # BaseLayout, PageLayout, PostLayout, LinktreeLayout
├── lib/               # Schemas Zod, SEO, analytics, lógica pura por página (+ tests)
├── pages/             # Rutas (file-based routing), rss.xml y news-sitemap.xml
├── styles/global.css  # Tokens de Tailwind 4 y CSS del sistema editorial
└── test/              # Setup de Vitest y mocks
public/
├── admin/             # Sveltia CMS (index.html + config.yml)
├── documentos/        # PDFs de transparencia
├── fonts/             # Subsets de Inter Variable y Plus Jakarta Sans
├── images/            # Fotos de crónicas, álbumes y logos
└── .htaccess          # Cabeceras de seguridad y CSP (Apache / Hostinger)
docs/                  # Arquitectura, contenido, sistema editorial y planes
```

## Content Collections

| Colección | Contenido |
|-----------|-----------|
| `news` | Crónicas y noticias |
| `events` | Calendario de competencias |
| `results` | Resultados por válida y categoría (YAML); alimentan el tablero de la temporada |
| `programs` | Programas de formación |
| `faqs` | Preguntas frecuentes |
| `gallery` | Álbumes fotográficos |
| `sponsors` | Patrocinadores |
| `social-initiatives` | Iniciativas sociales |
| `milestones` | Hitos de la historia del club |
| `trees` / `species` | Inventario de Trocha Verde |
| `riders` | Corredores (todos en borrador: no se publican perfiles de menores) |
| `directivos` | Equipo adulto (página `/equipo`, oculta hasta contar con autorizaciones de imagen) |
| `rutas` | Rutas de entrenamiento (definida, sin contenido) |
| `pages` | Textos de páginas que no se derivan del contenido |

Los schemas viven en `src/lib/schemas.ts`; al cambiar un campo hay que actualizar también `public/admin/config.yml` y los archivos de contenido.

## React islands

Astro genera cero JavaScript por defecto. Solo seis componentes hidratan, todos con `client:visible`:

- **MobileMenu** — menú de navegación móvil
- **SiteSearch** — buscador del sitio (carga Pagefind al abrir el diálogo)
- **ContactForm** — formulario de contacto
- **InscriptionForm** — inscripción en cuatro pasos
- **ImageLightbox** — visor de fotos de la galería
- **TrochaVerdeMap** — mapa Leaflet del inventario de árboles

## Variables de entorno

Copiar `.env.example` a `.env`. Todas son opcionales:

```env
PUBLIC_WEB3FORMS_KEY=          # envío de formularios
PUBLIC_CLOUDINARY_CLOUD_NAME=  # imágenes externas
PUBLIC_GA4_MEASUREMENT_ID=     # G-XXXXXXXXXX; sin ella no se carga analytics ni el banner de consentimiento
```

## CMS

Sveltia CMS se sirve en `/admin/` (cargado desde CDN, sin dependencia npm). Su configuración está en `public/admin/config.yml`, con backend GitHub y flujo editorial (borrador → revisión → publicado).

## Deploy

Dos pipelines de GitHub Actions suben el sitio a Hostinger por FTPS con `lftp`:

| Rama | Workflow | Qué hace |
|------|----------|----------|
| `develop` | `deploy.yml` | Typecheck + tests como gate → build → deploy al entorno de QA |
| `main` | `deploy-prod.yml` | Build → deploy a producción (sin tests: ya pasaron en `develop`) |

Cada workflow usa un Environment de GitHub (`develop` y `production`) con las variables `PUBLIC_*` como *Variables* y `FTP_SERVER`, `FTP_USERNAME` y `FTP_PASSWORD` como *Secrets*.

## Documentación

- `CLAUDE.md` — guía técnica del repositorio (comandos, arquitectura, convenciones)
- `docs/04-sistema-editorial.md` — sistema editorial de secciones y referencia de cada página
- `docs/03-content-strategy.md` — modelo de contenido y CMS
- `docs/05-convencion-utm.md` — etiquetado de enlaces compartidos

## Licencia

Todos los derechos reservados. Club Deportivo Trocha y Ruta.
