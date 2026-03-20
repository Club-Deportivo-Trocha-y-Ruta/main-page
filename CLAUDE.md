# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Proyecto

Sitio web del **Club Deportivo Trocha y Ruta** — club de ciclomontañismo para niños desde 4 años en Yumbo, Valle del Cauca, Colombia. Reconstrucción completa desde WordPress a Astro estático.

**Estado**: Pre-implementación. Los documentos de planning están en `docs/`. El código fuente aún no existe.

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
| Framework | Astro ^5.17.0 | SSG estático. **NO adoptar v6** sin validar breaking changes |
| Estilos | Tailwind CSS ^4.1.0 | Via `@tailwindcss/vite`. **NO existe `tailwind.config.mjs`** — tokens en `@theme {}` dentro de `src/styles/global.css` |
| Islands | React ^19.2.4 | Solo para 5 componentes interactivos en `src/components/interactive/` |
| CMS | Sveltia CMS | Estático, sin npm. UI en `public/admin/index.html`. Config en `public/admin/config.yml` |
| Hosting | Cloudflare Pages | Config en `wrangler.toml`. También hay `netlify.toml` como fallback |
| Formularios | Web3Forms | API HTTP, 250/mes gratis. Variable: `PUBLIC_WEB3FORMS_KEY` |
| Imágenes | Astro Image + Cloudinary | Locales via `<Image>` de `astro:assets`, CMS via Cloudinary URLs |
| Analytics | Cloudflare Web Analytics + Umami | Sin cookies, sin banner consent |
| Iconos | astro-icon + Phosphor Icons | Tree-shakeable, SVG inline |

### Tailwind 4 — Configuración Diferente

Tailwind 4 **elimina el archivo de configuración JS**. Los design tokens se definen en CSS:

```css
/* src/styles/global.css */
@import "tailwindcss";

@theme {
  --color-primary: #046bd2;
  --color-accent: #ef4297;
  --color-cyan: #03b7df;
  --color-surface-dark: #1a1a2e;
  --color-surface-muted: #f8fafc;
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
| `MobileMenu.tsx` | `client:load` | Crítico en mobile, debe hidratar inmediatamente |
| `ContactForm.tsx` | `client:visible` | Validación con react-hook-form + zod |
| `InscriptionForm.tsx` | `client:visible` | Formulario multi-paso (4 steps) |
| `ImageLightbox.tsx` | `client:visible` | Lightbox de galería |
| `Carousel.tsx` | `client:visible` | Carrusel Swiper para testimonios/sponsors |

**Regla**: Nunca usar `client:load` excepto para `MobileMenu`. Todo lo demás es `client:visible`.

## Arquitectura de Contenido

11 Content Collections definidas en `src/content/config.ts`:

| Colección | Tipo | Descripción |
|-----------|------|-------------|
| `riders` | content | Corredores del club con categoría FCC, logros, redes |
| `directivos` | content | Equipo directivo y staff técnico |
| `news` | content | Noticias con categorías: competencias, club, entrenamiento, comunidad |
| `events` | content | Eventos con status (upcoming/past), nivel, categoría XCO/XCM/ruta |
| `results` | **data** | Resultados YAML/JSON (no Markdown), vinculados a eventos |
| `programs` | content | 4 programas: Iniciación, Formación, Alto Rendimiento, Recreación |
| `testimonials` | content | Testimonios de familias y corredores |
| `sponsors` | content | Patrocinadores por nivel: principal, oficial, aliado, proveedor |
| `gallery` | content | Álbumes fotográficos con array de imágenes |
| `rutas` | content | Rutas de entrenamiento con datos GPS, dificultad, distancia |
| `pages` | content | Páginas estáticas editables desde CMS |

**Relaciones entre colecciones**: evento→galería (1:1), evento→results (1:N), evento→news (1:N), rider→program (N:1), ruta→program (N:M).

Schemas reutilizables: `seoSchema` (metaTitle, metaDescription, ogImage) y `socialMediaSchema` (instagram, facebook, strava, youtube, tiktok) se comparten entre colecciones.

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

## Variables de Entorno

```
PUBLIC_WEB3FORMS_KEY        # API key de Web3Forms para formularios
PUBLIC_CLOUDINARY_CLOUD_NAME # Cloud name de Cloudinary
```

## Documentos de Referencia

| Documento | Cuándo consultarlo |
|-----------|-------------------|
| `docs/01-ux-architecture.md` | Wireframes ASCII, user flows, personas — al implementar UI |
| `docs/02-technical-architecture.md` | Configs exactos, package.json, ADRs — al configurar proyecto |
| `docs/03-content-strategy.md` | Schemas Zod completos, taxonomía, CMS config.yml — al crear collections |
| `docs/04-implementation-workflow.md` | Fases, tareas, dependencias — al planificar trabajo |
| `PROMPT-PROYECTO.md` | Especificación original del proyecto |

## Agentes del Proyecto

4 agentes en `.claude/agents/` para trabajo especializado:

- **`project-pm`**: Coordinación, task management, integración
- **`astro-dev`**: Componentes, layouts, páginas, React Islands, responsive
- **`content-manager`**: Content Collections, Sveltia CMS, SEO, JSON-LD
- **`qa-auditor`**: Lighthouse audit, WCAG 2.1 AA, Core Web Vitals, responsive testing

## Restricciones

- **Zero-JS por defecto**: No agregar `client:*` a componentes Astro que no requieran interactividad
- **Sin frameworks CSS extra**: No jQuery, Bootstrap, Chakra — solo Tailwind
- **Lighthouse 95+**: En Performance, Accessibility, SEO, Best Practices
- **INP < 200ms, LCP < 2.0s, CLS < 0.05**: Performance budget estricto
- **WCAG 2.1 AA**: Headings jerárquicos, alt text, contraste 4.5:1, focus visible, keyboard nav
- **Español colombiano**: Todo contenido visible al usuario en español. Código en inglés
- **Node >= 20**: Requerido por Astro 5
