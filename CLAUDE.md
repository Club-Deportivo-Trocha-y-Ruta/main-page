# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sitio web del **Club Deportivo Trocha y Ruta** — club de ciclomontañismo para niños desde 4 años en Yumbo, Valle del Cauca, Colombia. Reconstrucción completa desde WordPress a Astro estático.

**Estado**: Implementación avanzada. El sitio compila y genera 27 páginas estáticas. Faltan colecciones de contenido por poblar (directivos, results, rutas, pages) y ajustes de responsive/QA.

## Comandos

```bash
npm run dev          # Dev server en localhost:4321
npm run build        # Build producción (incluye astro check)
npm run preview      # Preview del build local
npm run lint         # ESLint (archivos .ts, .tsx, .astro)
npm run lint:fix     # ESLint con auto-fix
npm run format       # Prettier
npm run format:check # Prettier sin escribir
npm run typecheck    # astro check (type-checking)
```

## Stack y Decisiones Arquitectónicas

| Capa | Tecnología | Notas Críticas |
|------|-----------|----------------|
| Framework | Astro ^5.17.0 | SSG estático, output `static`. **NO adoptar v6** sin validar breaking changes |
| Estilos | Tailwind CSS ^4.1.0 | Via `@tailwindcss/vite`. **NO existe `tailwind.config.mjs`** — tokens en `@theme {}` dentro de `src/styles/global.css` |
| Typography | @tailwindcss/typography ^0.5.19 | Plugin para prose styling en contenido Markdown |
| Islands | React ^19.2.4 | Solo para 5 componentes interactivos en `src/components/interactive/` |
| CMS | Sveltia CMS | Estático, sin npm. UI en `public/admin/index.html`. Config en `public/admin/config.yml` |
| Hosting | Hostinger (FTPS) | Deploy via GitHub Actions + FTP-Deploy-Action. 2 environments: `develop` y `production` |
| Formularios | Web3Forms | API HTTP, 250/mes gratis. Variable: `PUBLIC_WEB3FORMS_KEY` |
| Imágenes | Astro Image + Cloudinary | Locales via `<Image>` de `astro:assets`, dominio `res.cloudinary.com` habilitado en config |
| Iconos | astro-icon + Phosphor Icons | `icon({ include: { ph: ['*'] } })` — todos los iconos Phosphor disponibles |
| Carruseles | Swiper ^12.1.2 | Usado en TestimonialsCarousel |
| Lightbox | yet-another-react-lightbox ^3.21.0 | Instalado (ImageLightbox usa implementación custom) |
| Forms | react-hook-form ^7.53.2 + zod ^3.23.8 | Validación en ContactForm e InscriptionForm |
| Animaciones | @formkit/auto-animate ^0.8.2 | Animaciones de formulario |
| Optimización | sharp ^0.33.5 | Procesamiento de imágenes en build |

### Tailwind 4 — Configuración en CSS

Tailwind 4 **elimina el archivo de configuración JS**. Los design tokens se definen en CSS:

```css
/* src/styles/global.css */
@import "tailwindcss";
@plugin "@tailwindcss/typography";

@theme {
  --color-primary: #20b7c9;
  --color-primary-dark: #1a96a4;
  --color-primary-light: #4dc9d7;
  --color-accent: #8be000;
  --color-accent-dark: #6fb300;
  --color-accent-light: #a3e63d;
  --color-surface: #ffffff;
  --color-surface-dark: #2f2f2f;
  --color-surface-muted: #d8d8d8;
  --color-text-primary: #2f2f2f;
  --color-text-secondary: #5a5a5a;
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-display: 'Plus Jakarta Sans', system-ui, sans-serif;
}
```

Se integra en `astro.config.mjs` como plugin Vite:
```javascript
import tailwindcss from '@tailwindcss/vite';
// en defineConfig:
vite: { plugins: [tailwindcss()] }
```

### React Islands — Uso Mínimo

Astro genera zero-JS por defecto. React solo se usa en estos 5 componentes:

| Componente | Directiva | Justificación |
|-----------|-----------|---------------|
| `MobileMenu.tsx` | `client:load` | Crítico en mobile. Portal, focus trap, scroll lock, cierra en View Transitions |
| `ContactForm.tsx` | `client:visible` | Validación con react-hook-form + zod, honeypot anti-spam, Web3Forms |
| `InscriptionForm.tsx` | `client:visible` | Formulario multi-paso (4 steps), localStorage persistence (48h TTL) |
| `ImageLightbox.tsx` | `client:visible` | Lightbox custom con keyboard nav, touch swipe, focus trap |
| `TestimonialsCarousel.tsx` | `client:visible` | Carrusel Swiper (autoplay 5s, pagination) |

**Regla**: Nunca usar `client:load` excepto para `MobileMenu`. Todo lo demás es `client:visible`.

## Estructura del Proyecto

```
src/
├── assets/images/          # logo.webp, skg_logo.svg
├── components/
│   ├── common/             # 12 componentes: Header, Footer, Button, Card, Badge,
│   │   │                   #   EventCard, RiderCard, Breadcrumb, SectionTitle,
│   │   │                   #   SocialLinks, YouTubeEmbed, SEOHead
│   ├── sections/           # 11 secciones homepage: Hero, StatsCounter, ProgramsGrid,
│   │   │                   #   UpcomingEvents, NewsPreview, NewsGallery, GalleryPreview,
│   │   │                   #   TestimonialsSlider, TeamRoster, SponsorsBar, AboutPreview
│   └── interactive/        # 5 React islands (ver tabla arriba)
├── content/                # Content Collections (ver sección abajo)
├── data/
│   └── transparencia-documentos.json
├── layouts/
│   ├── BaseLayout.astro    # Root: ClientRouter, SEOHead, Header/Footer, scroll-reveal
│   ├── PageLayout.astro    # Páginas con breadcrumb y título
│   └── PostLayout.astro    # Artículos con fecha/autor/categoría, prose styling
├── lib/
│   ├── constants.ts        # SITE, CONTACT, SOCIAL, NAV_ITEMS, SECONDARY_NAV
│   ├── utils.ts            # formatDate, slugify, getAge, getCategoryLabel, etc.
│   └── seo.ts              # JSON-LD generators: Organization, Event, Article, Breadcrumb
├── pages/                  # 17 páginas (ver sección abajo)
├── styles/
│   └── global.css          # Tailwind @theme, fonts, reveal animations, prose table fix
└── types/                  # (vacío — tipos inline en componentes)
```

### Páginas Implementadas (17)

| Ruta | Archivo | Descripción |
|------|---------|-------------|
| `/` | `index.astro` | Homepage con 11 secciones |
| `/quienes-somos` | `quienes-somos.astro` | Historia, misión/visión, logros |
| `/programas` | `programas/index.astro` | Listado de programas |
| `/programas/[slug]` | `programas/[...slug].astro` | Detalle de programa |
| `/equipo` | `equipo/index.astro` | Roster de corredores |
| `/equipo/[slug]` | `equipo/[...slug].astro` | Perfil de corredor |
| `/noticias` | `noticias/index.astro` | Listado de noticias con filtros |
| `/noticias/[slug]` | `noticias/[...slug].astro` | Artículo con JSON-LD, galería |
| `/calendario` | `calendario.astro` | Eventos próximos y pasados |
| `/galeria` | `galeria/index.astro` | Álbumes fotográficos |
| `/galeria/[slug]` | `galeria/[...slug].astro` | Álbum con lightbox |
| `/contacto` | `contacto.astro` | Formulario + info de contacto |
| `/inscripciones` | `inscripciones.astro` | Formulario multi-paso |
| `/testimonios` | `testimonios.astro` | Testimonios de familias |
| `/patrocinadores` | `patrocinadores.astro` | Sponsors por nivel |
| `/transparencia` | `transparencia/index.astro` | Documentos de gobernanza |
| `/404` | `404.astro` | Página de error |

## Arquitectura de Contenido

11 Content Collections definidas en `src/content.config.ts` (nota: no `src/content/config.ts`):

| Colección | Tipo | Archivos | Estado |
|-----------|------|----------|--------|
| `riders` | content (glob) | 5 .md | Poblada |
| `directivos` | content (glob) | 0 | Sin contenido |
| `news` | content (glob) | 4 .md | Poblada |
| `events` | content (glob) | 8 .md | Poblada |
| `results` | data (glob) | 0 .yaml/.json | Sin contenido |
| `programs` | content (glob) | 3 .md | Poblada (faltan: Recreación) |
| `testimonials` | content (glob) | 3 .md | Poblada |
| `sponsors` | content (glob) | 6 .md | Poblada |
| `gallery` | content (glob) | 2 .md | Poblada |
| `rutas` | content (glob) | 0 | Sin contenido |
| `pages` | content (glob) | 0 | Sin contenido |

### Relaciones entre colecciones
- evento → galería (1:1, via `relatedGallery`)
- evento → noticias (1:N, via `relatedNews` array)
- evento → resultados (1:N, via `event` field en results)
- noticia → galería (1:1, via `relatedGallery` y `galleryFolder`)
- rider → programa (N:1, via `program`)
- testimonial → rider (1:1, via `relatedRider`)
- testimonial → programa (1:1, via `relatedProgram`)
- ruta → programa (N:M, via `usedInPrograms` array)

### Schemas reutilizables
- `seoSchema`: metaTitle, metaDescription, ogImage
- `socialMediaSchema`: instagram, facebook, strava, youtube, tiktok

## Funcionalidades Implementadas

### View Transitions
- `ClientRouter` habilitado en BaseLayout
- `transition:persist` en Header (mantiene estado entre navegaciones)
- `transition:animate="fade"` en contenido principal
- MobileMenu se cierra en evento `astro:before-preparation`

### SEO y JSON-LD
- `SEOHead.astro`: title, meta, Open Graph, Twitter Card, JSON-LD
- Locale: `es_CO`
- Generators en `src/lib/seo.ts`: SportsOrganization, SportsEvent, Article, BreadcrumbList
- Sitemap generado por `@astrojs/sitemap`

### Accesibilidad
- Skip-to-content link
- Focus visible outlines (2px primary, 2px offset)
- ARIA attributes en navegación, formularios, lightbox
- Focus trap en MobileMenu e ImageLightbox
- Keyboard navigation completa (Escape, Tab, Arrow keys)
- `prefers-reduced-motion` respetado

### Formularios
- **ContactForm**: 5 campos, Zod, honeypot anti-spam, Web3Forms POST
- **InscriptionForm**: 4 pasos, 19+ campos, localStorage persistence (48h TTL), validación progresiva

### Scroll Reveal
- IntersectionObserver en BaseLayout
- Clase `.reveal` → `.revealed` con animación opacity + translateY
- Compatible con View Transitions (re-observa en `astro:page-load`)

## Convenciones

### Componentes Astro
- PascalCase para nombres de archivo
- Props tipadas con `interface Props {}` en frontmatter
- Tailwind classes directas, nunca CSS modules
- `<Image>` de `astro:assets` para toda imagen local, nunca `<img>` directo
- Composición via `<slot />` sobre props complejas

### Path Aliases (tsconfig.json)
```
@components/* → src/components/*
@layouts/*    → src/layouts/*
@lib/*        → src/lib/*
@assets/*     → src/assets/*
@types/*      → src/types/*
```

### Contenido
- Frontmatter YAML, contenido en español colombiano
- Slugs: kebab-case sin acentos (`copa-valle-2026`, no `copa-vallé-2026`)
- Fechas: ISO 8601 (`2026-04-15`)
- `draft: true` oculta contenido en producción

### Estilos
- Mobile-first: base para mobile, `md:` para tablet, `lg:` para desktop
- Colores: `text-primary`, `bg-accent`, `bg-surface-muted`, `bg-surface-dark`
- Tipografía: `font-display` para headings, `font-sans` para body
- Prose tables: scroll horizontal automático en mobile

## Variables de Entorno

Gestionadas via **GitHub Environments** (Settings → Environments). Cada environment (QA, PDN) tiene sus propios valores.

| Variable | Descripción | Diferente por env |
|----------|-------------|:-----------------:|
| `PUBLIC_WEB3FORMS_KEY` | API key de Web3Forms (ContactForm, InscriptionForm) | No |
| `PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloud name de Cloudinary | No |
| `PUBLIC_GA4_MEASUREMENT_ID` | Measurement ID de GA4 formato `G-XXXXXXXXXX` (carga vía Partytown) | Recomendado (develop ≠ production) |

Secrets de deploy (en cada environment): `FTP_SERVER`, `FTP_USERNAME`, `FTP_PASSWORD`

### CI/CD

| Workflow | Trigger | Environment | CI Gate |
|----------|---------|-------------|---------|
| `deploy.yml` | push a `develop` | `develop` | Sí (typecheck + tests) |
| `deploy-prod.yml` | push a `main` | `production` | No (asume CI pasó en develop) |

## Assets Estáticos (public/)

| Directorio | Contenido |
|-----------|-----------|
| `public/admin/` | Sveltia CMS: index.html + config.yml |
| `public/fonts/` | InterVariable.woff2, PlusJakartaSans-Variable.woff2 |
| `public/images/news/` | Fotos de noticias (ej. 64 JPGs copa-valle-ginebra) |
| `public/images/sponsors/` | Logos de patrocinadores (SVG, PNG, JPG) |
| `public/documentos/transparencia/` | 15 PDFs de gobernanza y cumplimiento |
| `public/` | favicon (SVG, PNG 16/32/192/512), apple-touch-icon, robots.txt, site.webmanifest |

## Datos Estáticos

- `src/data/transparencia-documentos.json` — Metadata de documentos de transparencia (usado en `/transparencia`)

## Documentos de Referencia

| Documento | Cuándo consultarlo |
|-----------|-------------------|
| `docs/01-ux-architecture.md` | Wireframes ASCII, user flows, personas — al implementar UI |
| `docs/02-technical-architecture.md` | Configs exactos, package.json, ADRs — al configurar proyecto |
| `docs/03-content-strategy.md` | Schemas Zod completos, taxonomía, CMS config.yml — al crear collections |
| `docs/04-implementation-workflow.md` | Fases, tareas, dependencias — al planificar trabajo |

## Agentes del Proyecto — Compañía Digital (22 agentes)

22 agentes en `.claude/agents/` organizados como una compañía digital con jerarquía de 5 tiers. Modelos pinneados a IDs específicos para reproducibilidad.

### Tier 1 — C-Suite (Opus 4.7)
| Agente | Rol | Reporta a | Lidera |
|--------|-----|-----------|--------|
| `ceo-strategist` | CEO — visión, OKRs trimestrales, decisiones cross-departamento, alineación misión club | — | cto-architect, cmo-marketing-director, head-of-operations, sponsor-relations-lead, legal-compliance-officer, project-pm |
| `cto-architect` | CTO — decisiones técnicas, performance/a11y budget, stack roadmap, arquitectura | ceo-strategist | astro-dev, content-manager, performance-engineer, qa-auditor, accessibility-tester, image-optimizer |
| `cmo-marketing-director` | CMO — estrategia digital integral (web + redes + email + B2B), brand voice, captación | ceo-strategist | content-marketer, seo-specialist, community-manager, photo-video-editor, ux-researcher, seo-auditor |

### Tier 2 — Directors / Department Heads (Opus 4.7)
| Agente | Rol | Reporta a | Lidera |
|--------|-----|-----------|--------|
| `head-of-operations` | Calendario deportivo, logística Copa Valle XCO, alianzas operativas | ceo-strategist | event-manager |
| `sponsor-relations-lead` | Monetización B2B, media kit, negociación, retención, activación marca | cmo-marketing-director | fundraiser-bd |
| `legal-compliance-officer` | Ley 1581, Ley 1098 (menores), DIAN, transparencia, consentimientos | ceo-strategist | — (rol transversal) |
| `project-pm` | COO — coordinación ejecución diaria, task management | ceo-strategist | — (orquesta a todos los demás) |

### Tier 3 — Specialists / Senior ICs (Opus 4.7)
| Agente | Rol | Reporta a |
|--------|-----|-----------|
| `content-marketer` | Senior Editor — crónicas Copa Valle XCO (protocolo 7 bloques), copies multi-canal, comunicación a familias y sponsors | cmo-marketing-director |
| `event-manager` | Logística operativa de eventos: kit, transporte, inscripciones, captura datos | head-of-operations |
| `community-manager` | Operación diaria redes (Instagram, Facebook, YouTube), WhatsApp familias, atención < 4h | cmo-marketing-director |
| `data-analyst` | GA4 + Cloudflare Analytics, funnels inscripción, KPIs marketing, ROI sponsor | cto-architect + cmo-marketing-director |
| `ux-researcher` | Entrevistas familias, usability testing, validación personas (Carolina/Mateo/Luis Fernando) | cmo-marketing-director |
| `photo-video-editor` | Producción visual post-evento (48h): fotos, reels, álbumes galería, miniaturas YouTube | cmo-marketing-director |
| `fundraiser-bd` | Outreach B2B cold, propuestas personalizadas, pipeline, follow-up | sponsor-relations-lead |

### Tier 4 — Engineers (Sonnet 4.6)
| Agente | Rol | Reporta a |
|--------|-----|-----------|
| `astro-dev` | Senior Frontend Engineer — componentes, layouts, páginas, React Islands, responsive | cto-architect |
| `content-manager` | Content Engineer — Content Collections, Sveltia CMS, JSON-LD, schemas Zod | cto-architect |
| `performance-engineer` | Bundle size, LCP/INP/CLS, análisis de cuellos de botella, performance budget | cto-architect |
| `seo-specialist` | SEO Strategist — keywords, análisis competitivo, roadmap SEO, rich snippets | cmo-marketing-director |

### Tier 5 — Inspectors / Quality Gate (Haiku 4.5)
| Agente | Rol | Reporta a |
|--------|-----|-----------|
| `qa-auditor` | Lighthouse audit, WCAG 2.1 AA, Core Web Vitals, responsive testing | cto-architect |
| `seo-auditor` | Validación técnica JSON-LD, meta tags, Open Graph, sitemap, SEO local | cmo-marketing-director |
| `accessibility-tester` | WCAG 2.1/3.0 profundo, lectores de pantalla, ARIA, a11y cognitiva y móvil | cto-architect |
| `image-optimizer` | WebP/AVIF, srcset responsive, lazy loading, Cloudinary | cto-architect |

**Criterio de asignación**:
- **Opus 4.7** — liderazgo (C-Suite + Directors) y especialistas con razonamiento estratégico (Tier 3)
- **Sonnet 4.6** — implementación de features y estrategia técnica (Engineers)
- **Haiku 4.5** — auditorías read-only, validaciones deterministas, tareas mecánicas (Inspectors)

## Teams Formales (`.claude/teams/`)

5 teams declarativos que orquestan workflows multi-departamento con leader + followers. Cada team tiene su `config.json` con el organigrama del equipo, prompts por miembro y trigger de activación.

| Team | Leader | Followers (resumen) | Trigger |
|------|--------|--------------------|---------|
| `copa-valle-launch` | head-of-operations | event-manager, content-marketer, community-manager, photo-video-editor, seo-specialist, content-manager | 4 semanas antes de cada válida Copa Valle XCO |
| `captacion-atletas-2026` | cmo-marketing-director | ux-researcher, community-manager, content-marketer, data-analyst, astro-dev, seo-specialist, seo-auditor | Trimestral o inicio de nueva campaña |
| `sponsor-outreach` | sponsor-relations-lead | fundraiser-bd, data-analyst, content-marketer, legal-compliance-officer, photo-video-editor | Inicio de trimestre B2B |
| `trocha-verde` | ceo-strategist | content-manager, astro-dev, community-manager, photo-video-editor, content-marketer, data-analyst | Activación de fase de la iniciativa |
| `compliance-anual` | legal-compliance-officer | content-manager, data-analyst, project-pm | Anual o nuevo formulario/colección |

## Claude Code — Workflow

El proyecto se desarrolla con asistencia de Claude Code (Opus 4.7 / Sonnet 4.6 / Haiku 4.5).

### Permisos y settings
- `.claude/settings.json` define el allowlist de comandos del proyecto (`npm run *`, `git status/diff/log`, `astro check/build`) para reducir prompts de permiso.
- Operaciones destructivas (`rm -rf`, `git push --force`, `git reset --hard`) están en la `deny` list.

### Skills disponibles
23 skills en `.claude/skills/` cubren auditorías SEO (técnico, contenido, schema, hreflang, GEO, sitemap, imágenes, programmatic, competitor pages, local, page), accesibilidad (WCAG 2.2), performance (Core Web Vitals, INP), best-practices, frontend-design, Astro framework, web-design-guidelines, web-quality-audit y playwright-cli. Invocables como `/skill-name` desde el chat.

### Comandos custom
- `/brainstorm` — descubrimiento de requisitos vía diálogo socrático y multi-persona
- `/research` — investigación web profunda con síntesis de evidencia
- `/workflow` — generación de planes de implementación desde PRDs con dependency mapping

## Restricciones

- **Zero-JS por defecto**: No agregar `client:*` a componentes Astro que no requieran interactividad
- **Sin frameworks CSS extra**: No jQuery, Bootstrap, Chakra — solo Tailwind
- **Lighthouse 95+**: En Performance, Accessibility, SEO, Best Practices
- **INP < 200ms, LCP < 2.0s, CLS < 0.05**: Performance budget estricto
- **WCAG 2.1 AA**: Headings jerárquicos, alt text, contraste 4.5:1, focus visible, keyboard nav
- **Español colombiano**: Todo contenido visible al usuario en español. Código en inglés
- **Node >= 20**: Requerido por Astro 5

## Pendientes Conocidos

- Colecciones sin contenido: `directivos`, `results`, `rutas`, `pages`
- Programa "Recreación" falta en `src/content/programs/`
- Directorio `src/types/` vacío (tipos definidos inline en componentes)
- Analytics: GA4 vía `@astrojs/partytown` con Consent Mode v2 (banner custom). Measurement ID via `PUBLIC_GA4_MEASUREMENT_ID`
- Configuración Claude actualizada a Opus 4.7 con IDs pinneados (2026-04-30)
