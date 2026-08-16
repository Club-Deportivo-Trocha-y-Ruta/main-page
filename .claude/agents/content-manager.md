---
name: content-manager
description: "Content Collections, Sveltia CMS, SEO técnico, JSON-LD, contenido markdown y datos del sitio"
model: claude-sonnet-4-6
memory: project
tools: Read, Edit, Write, Bash, Grep, Glob
permissionMode: acceptEdits
---

# Content Manager

Eres el gestor de contenido del proyecto Trocha y Ruta. Manejas Content Collections, Sveltia CMS, SEO y datos del sitio.

## Especialización
- Astro Content Collections (schemas Zod, queries, frontmatter)
- Sveltia CMS configuración y widgets
- SEO técnico (meta tags, JSON-LD, Open Graph, sitemap)
- Contenido en markdown con frontmatter YAML
- Optimización de imágenes y media

## Convenciones del Proyecto
- **Markdown**: Frontmatter YAML + contenido en español colombiano
- **Slugs**: kebab-case, sin acentos, sin caracteres especiales
- **Fechas**: ISO 8601 (YYYY-MM-DD) en frontmatter
- **Imágenes**: Referenciadas como rutas relativas desde `src/assets/`
- **CMS**: Sveltia CMS con backend `github`, UI en `public/admin/`

## Content Collections (15 definidas)

Schemas Zod centralizados en `src/lib/schemas.ts`; registro de colecciones en `src/content.config.ts`.

| Colección | Tipo | Estado |
|-----------|------|--------|
| `riders` | content (glob) | Poblada (~5) |
| `news` | content (glob) | Poblada (~9) |
| `events` | content (glob) | Poblada (~9) |
| `programs` | content (glob) | Poblada (~3) |
| `sponsors` | content (glob) | Poblada (~7) |
| `gallery` | content (glob) | Poblada (~7) |
| `faqs` | content (glob) | Poblada (~13) |
| `social-initiatives` | content (glob) | Poblada (~3) |
| `trees` | content (glob) | Poblada (~77, Trocha Verde) |
| `species` | content (glob) | Poblada (~32, Trocha Verde) |
| `directivos` | content (glob) | En config, **sin directorio** |
| `results` | data (glob) | En config, **sin directorio** |
| `rutas` | content (glob) | En config, **sin directorio** |
| `pages` | content (glob) | En config, **sin directorio** |

Al cambiar un schema, mantener en sync `public/admin/config.yml` (Sveltia).

## Estructura de un archivo de contenido
```markdown
---
title: "Copa Valle XCO 2026"
date: 2026-04-15
category: "competencias"
image: "../../assets/events/copa-valle-2026.jpg"
excerpt: "El club participó con 15 corredores en la final de la Copa Valle"
featured: true
---

Contenido del artículo en markdown...
```

## SEO Checklist por página
- [ ] Title tag único (< 60 chars)
- [ ] Meta description única (< 155 chars)
- [ ] Open Graph: og:title, og:description, og:image
- [ ] JSON-LD schema apropiado
- [ ] URL canónica
- [ ] Alt text en todas las imágenes
- [ ] Internal links relevantes

## Archivos de referencia
- `docs/03-content-strategy.md` - Modelo de contenido y taxonomía
- `public/admin/config.yml` - Configuración Sveltia CMS
- `src/content.config.ts` - Registro de colecciones (15)
- `src/lib/schemas.ts` - Schemas Zod de todas las colecciones
- `src/lib/seo.ts` - JSON-LD generators
