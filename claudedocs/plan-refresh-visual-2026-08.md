# Plan de Refresh Visual — Trocha y Ruta (agosto 2026)

> Basado en: auditoría visual de 12 páginas (Chrome), inventario técnico read-only (agente Explore), estrategia de performance (agente performance-engineer), benchmark de tendencias 2026 y skill `ui-ux-pro-max`.
> **Decisión de fondo**: NO rediseño completo. Refresh dirigido en 3 fases. Base técnica (Astro 5 + Tailwind 4 + tokens) se conserva intacta.

---

## Alcance y restricciones

**Se mantiene** (no negociable):
- Paleta kit: teal `#20B7C9` + lima `#8BE000` + grafito `#2F2F2F` (el skill sugirió rojo/amarillo + fuentes infantiles Baloo/Comic Neue — **descartado**: el brand del club ya está definido y es distintivo)
- Tipografías: Plus Jakarta Sans (display) + Inter (body)
- Zero-JS por defecto, performance budget (LCP < 2.0s, INP < 200ms, CLS < 0.05, Lighthouse 95+)
- Flujo editorial con Sveltia CMS (los editores suben a `public/`)

**Direcciones de diseño adoptadas** (de `ui-ux-pro-max` + tendencias 2026):
- Estilo "Vibrant & Block-based": bloques generosos (48px+ gaps), tipografía display grande, hover con cambio de color — ya presente en Hero/Patrocinadores; extenderlo a páginas rezagadas
- "Scroll-Triggered Storytelling" para Quiénes Somos: capítulos historia → comunidad → logros
- Fotografía real > placeholders/stock: el diferenciador de confianza #1 para la persona "Carolina" (mamá protectora). El repo tiene 63 MB de fotos reales y las páginas clave no usan ninguna
- Anti-patrón confirmado: autoplay video pesado. Video solo desktop, diferido, con poster siempre visible

**Descartado explícitamente** (analizado, no hacer):
- B1 (mover covers de noticias a `src/assets`): rompe Sveltia CMS
- A2 (video mp4 self-hosted): +3-5 MB deploy, autoplay policy frágil
- Rebuild de home o navegación

---

## Hallazgos clave que fundamentan el plan (con ubicación exacta)

| # | Hallazgo | Ubicación |
|---|----------|-----------|
| H1 | Flash negro del hero: iframe YouTube tapa el poster hasta el primer frame (2-5s en conexiones lentas). Sin `onError` ni timeout | `Hero.astro:34-36`, `:110-204` |
| H2 | Poster `hero-poster.jpg` 74,7 KB JPG en `public/` (sin WebP/AVIF), `<img>` sin `width/height` | `Hero.astro:23-31` |
| H3 | Preload del poster en TODAS las páginas (27), no solo home | `BaseLayout.astro:43` |
| H4 | Stats contradictorios en 3 fuentes: niños 80 (`StatsCounter.astro:9`, `patrocinadores.astro:79`) vs **200+** (`quienes-somos.astro:76`) | ver tabla inventario |
| H5 | Home dice "77+ llantas recicladas" (iguala llantas a árboles); `/trocha-verde` dice 72 (real vía `getTreeStats()`) | `TrochaVerde.astro:78` vs `trocha-verde.ts:22-54` |
| H6 | Covers de noticias: `<img>` nativo, sin srcset, sin dimensiones (CLS), `loading="lazy"` incluso above-the-fold | `noticias/index.astro:32`, `NewsPreview.astro:35` |
| H7 | `public/images/` pesa **63 MB** (news 32 MB, trocha-verde 31 MB). Top: `donacion-olga-hernandez.jpg` 2,77 MB. `dia-tierra-2026/jornada/` entero en JPG sin convertir | inventario §6 |
| H8 | Quiénes Somos: cero imágenes, emojis como iconos (anti-patrón), sin staff ni historia visual | `quienes-somos.astro:66-88` |
| H9 | Programas: icono `ph:bicycle` gigante como placeholder de foto; `placeholder-program.jpg` referenciado **no existe** | `programas/index.astro:30-32` |
| H11 | EventCard enlaza a la propia página `/calendario` (link circular) | `calendario.astro:44-86` |
| H12 | `NewsGallery.astro:71` enlaza a `/galeria/...` que NO existe (páginas `.bak`) | fase 3 |
| H13 | Dos bloques Trocha Verde consecutivos en home (#11 `LatestInitiative` + #12 `TrochaVerde`) con mismo CTA y cifras sin relación aparente (23 vs 77 árboles) | `index.astro:81-86` |
| H14 | Artículos de Palmira sin `galleryImages` pese a 25 fotos/6,1 MB en disco; 2 covers de noticias faltantes | inventario §3 |
| H15 | 7 rutas placeholder referenciadas inexistentes (`placeholder-program/social/event/gallery/rider/sponsor`) | inventario §6 |
| H16 | `/equipo` y `/galeria` desactivadas (`.bak`); nav comentada con TODO; colecciones pobladas (5 riders, 2 álbumes) | `constants.ts:33,39` |

---

## FASE 1 — Quick wins: performance + integridad de datos

**Objetivo**: eliminar el flash negro, corregir contradicciones de cifras, bajar peso percibido de /noticias. Sin cambios de diseño visibles.
**Esfuerzo total estimado**: 4-6 h de agentes. Todas las tareas son paralelizables salvo dependencias marcadas.

### T1.1 — Hero: eliminar flash negro + poster optimizado
- **Agente**: `performance-engineer` · **Skills**: `core-web-vitals`, `astro`
- **Archivos**: `src/components/sections/Hero.astro`, `src/layouts/BaseLayout.astro:43`, mover `public/images/hero-poster.jpg` → `src/assets/images/hero-poster.webp`
- **Cambios**:
  1. Poster a `<Image>` de astro:assets con `width/height` (genera WebP ~30 KB, -60%)
  2. `hero-video-wrapper` con `opacity: 0` → `.video-ready` (transición 500ms) disparada en `onPlayerReady`. Poster visible siempre debajo
  3. Preload condicional: solo `Astro.url.pathname === '/'`
  4. Revisar `seo.ts:486` (OG image por defecto usa el poster — mantener una copia en `public/` SOLO para OG o apuntar al asset procesado)
- **Aceptación**: sin bloque negro en cold load desktop; LCP home ≤ actual -300ms; `npm run build` verde; poster visible con `prefers-reduced-motion`
- **Riesgo**: OG image rota si se mueve el archivo sin actualizar seo.ts (verificar con `seo-auditor`)

### T1.2 — Fuente única de métricas del club
- **Agente**: `content-manager` · **Skills**: `astro`
- **Archivos**: `src/lib/constants.ts` (nuevo objeto `CLUB_STATS`), `src/components/sections/StatsCounter.astro:8-12`, `src/pages/patrocinadores.astro:78-81`, `src/pages/quienes-somos.astro:72-80`
- **Cambios**: `CLUB_STATS = { ridersTrained: <CIFRA OFICIAL>, competitions: 50, medals: 100 }` + `yearsActive` calculado desde `SITE.founded` (ya existe la lógica en StatsCounter). Las 3 páginas consumen la misma fuente
- **⚠️ INSUMO DEL CLUB**: ¿cifra oficial de niños formados? 80 (StatsCounter/patrocinadores) vs 200+ (quienes-somos). Bloquea números finales, no la refactorización (usar 80 provisional, es la conservadora)
- **Aceptación**: `grep -rn "80\|200+\|100" src/pages src/components` sin métricas hardcodeadas fuera de constants

### T1.3 — Llantas recicladas correctas en home
- **Agente**: `content-manager` (misma sesión que T1.2)
- **Archivos**: `src/components/sections/TrochaVerde.astro:69-78`
- **Cambios**: consumir `getTreeStats()` de `src/lib/trocha-verde.ts` (77 árboles / 72 llantas reales) en vez de `trees.length` para ambas cifras
- **Aceptación**: home y `/trocha-verde` muestran cifras idénticas

### T1.4 — Loading correcto en /noticias + NewsPreview
- **Agente**: `performance-engineer` (misma sesión que T1.1) · **Skills**: `core-web-vitals`, `seo-images`
- **Archivos**: `src/pages/noticias/index.astro:32`, `src/components/sections/NewsPreview.astro:35`, `src/pages/noticias/[...slug].astro:68,72`
- **Cambios**: `loading={index < 3 ? 'eager' : 'lazy'}`, `fetchpriority="high"` en la primera, `width="800" height="450"` en todas (mata CLS), `decoding="async"`
- **Aceptación**: LCP /noticias -500ms a -1s; CLS < 0.05 en listado

### T1.5 — Home: fusionar bloques Trocha Verde duplicados
- **Agente**: `astro-dev` · **Skills**: `frontend-design`
- **Archivos**: `src/pages/index.astro:81-86`, `src/components/sections/LatestInitiative.astro`, `src/components/sections/TrochaVerde.astro`
- **Cambios**: UN solo bloque programa (mosaico fotos + stats acumulados 77/72 vía getTreeStats + CTA "Conoce Trocha Verde") con franja interna "Última jornada: Sembratón Día de la Tierra — 23 árboles · 30 voluntarios · Lee la crónica" (dato de `socialInitiatives`). `LatestInitiative` queda como componente reutilizable para otras páginas si se quiere, pero sale de la home
- **Aceptación**: un solo CTA a /trocha-verde en la home; cifras 23 vs 77 contextualizadas (jornada vs acumulado); scroll de home ~1 viewport más corto

### T1.6 — Higiene: links circulares y rotos
- **Agente**: `astro-dev` (misma sesión que T1.5)
- **Archivos**: `src/pages/calendario.astro` + `EventCard` (H11), `src/components/sections/NewsGallery.astro:71` (H12)
- **Cambios**: EventCard sin `href` circular (o ancla al evento); guard en NewsGallery: no renderizar link a `/galeria/*` mientras las páginas estén `.bak`
- **Aceptación**: cero links a rutas inexistentes (verificable con build + grep)

### Gate de Fase 1
- **Agente**: `qa-auditor` · **Skills**: `web-quality-audit`, `core-web-vitals`
- Lighthouse home + /noticias (antes/después), verificación visual Playwright home/noticias/calendario, `npm run build` 0 errores. **Criterio de salida**: Performance ≥ 95, CLS < 0.05, sin regresión visual

---

## FASE 2 — Refresh visual de páginas rezagadas

**Objetivo**: cerrar la brecha visual con las páginas nuevas usando fotografía real. Dirigido a conversión de familias (persona Carolina).
**Esfuerzo total estimado**: 8-12 h. `T2.0` bloquea al resto.

### T2.0 — Curaduría fotográfica (PRERREQUISITO de toda la fase)
- **Agente**: `photo-video-editor` (Opus) + `image-optimizer` (Haiku, batch técnico)
- **Insumo**: 63 MB en `public/images/` — carpetas news (7 eventos), trocha-verde, lineup Cali (10 retratos 600×800 ya optimizados, 71 KB c/u)
- **Entregable**: carpeta `src/assets/images/refresh/` con selección optimizada (WebP, ≤150 KB c/u):
  - 1 foto por programa × 3 (acción por franja de edad: iniciación/juvenil/rendimiento)
  - 4-6 fotos historia del club para Quiénes Somos (pista Carlos Castro, competencias, siembras)
- **Batch técnico** (`image-optimizer`): comprimir `donacion-olga-hernandez.jpg` (2,77 MB), convertir `trocha-verde/dia-tierra-2026/jornada/*.jpg` a WebP, objetivo: `public/images/` bajo 40 MB
- **⚠️ LEGAL**: fotos con menores identificables en páginas nuevas → validar contra política de protección infantil ANTES de publicar (checklist de `legal-compliance-officer`, sin necesidad de auditoría completa: las fotos ya son públicas en noticias)
- **Aceptación**: manifest de selección (archivo → página destino → peso final)

### T2.1 — Quiénes Somos: storytelling con fotos
- **Agente**: `astro-dev` · **Skills**: `frontend-design`, `ui-ux-pro-max` (patrón Scroll-Triggered Storytelling), `accessibility`
- **Depende de**: T2.0
- **Archivos**: `src/pages/quienes-somos.astro` (reescritura de secciones, mismo PageLayout)
- **Cambios**:
  1. Historia como timeline visual 2010 → hoy (3-4 hitos con foto, scroll-reveal ya disponible)
  2. Misión/Visión/Valores: cards con acento de color por pilar (bloque estilo Vibrant, no cards blancas planas)
  3. Logros: reemplazar emojis por iconos Phosphor (`ph:trophy-bold`, `ph:medal-bold`...) + cifras de `CLUB_STATS` (T1.2)
  4. Banda de fotos de comunidad (grid 3-4 fotos de T2.0)
  5. Sección staff: SOLO si hay consentimientos (T3.1); si no, omitir — NO usar placeholders
- **Aceptación**: cero emojis como iconos; ≥4 fotos reales; heading hierarchy h1→h2→h3; contraste AA; build verde

### T2.2 — Programas: fotos reales + info de decisión
- **Agente**: `astro-dev` · **Skills**: `frontend-design`, `astro`
- **Depende de**: T2.0
- **Archivos**: `src/pages/programas/index.astro:30-32`, `src/pages/programas/[...slug].astro`, `src/content/programs/*.md` (campo `image`), `src/content.config.ts` si el schema necesita import de imagen
- **Cambios**:
  1. Panel `md:w-1/3` con foto real del programa (`<Image>`, no icono bici)
  2. Precio/mensualidad y horario visibles EN la card del listado (hoy solo en detalle) — frustración #2 de Carolina: "no encontrar precios"
  3. Detalle: foto hero del programa arriba del h1
  4. Eliminar referencia a `placeholder-program.jpg` en los 3 `.md`
- **Aceptación**: 3 programas con foto real; precio+horario visibles en listado; JSON-LD Course intacto (verificar `seo-auditor`)

### T2.3 — Calendario: jerarquía visual
- **Agente**: `astro-dev` · **Skills**: `frontend-design`, `ui-ux-pro-max` (§5 layout, §2 touch)
- **Archivos**: `src/pages/calendario.astro`, `src/components/common/EventCard.astro`
- **Cambios**:
  1. Próximo evento destacado como card hero (fecha grande, lugar, mapa-link, CTA .ics/Google prominentes)
  2. Resto de próximos como cards normales; pasados compactos/atenuados con link a su crónica (via `relatedNews` si existe)
  3. Ancho completo del contenedor (hoy columna estrecha con vacío a la derecha)
- **Aceptación**: próximo evento identificable en <1s (test 5 segundos); tap targets ≥44px; sin link circular (T1.6)

### T2.4 — Testimonios ~~completar y humanizar~~ · **CANCELADA**
- La sección de testimonios se eliminó del sitio (2026-08): los 3 items publicados
  eran de demostración, no reales. Se borró la colección, la página, el carrusel y
  todas sus referencias. No se reconstruye sin contenido real y autorizado.

### T2.5 — Covers de noticias a Cloudinary (gradual)
- **Agente**: `content-manager` · **Skills**: `seo-images`, `astro`
- **Independiente** del resto de la fase
- **Archivos**: frontmatter `image` de los 9 `.md` de news; `public/admin/config.yml` (nota para editores); opcional `noticias/index.astro` a `<Image>` de astro:assets (dominio ya habilitado)
- **Cambios**: subir 9 portadas a Cloudinary, URLs `f_auto,q_auto,w_800`; subsanar los 2 covers faltantes (Palmira/Santa Rosa — H14); documentar flujo para artículos nuevos (editor pega URL Cloudinary)
- **Aceptación**: portadas ≤40 KB efectivas; schema `z.string()` sin cambios; Sveltia intacto; `galleryImages` de Palmira poblado (25 fotos disponibles)

### Gate de Fase 2
- **Agentes**: `qa-auditor` + `accessibility-tester` + `seo-auditor` (paralelo, Haiku) · **Skills**: `web-quality-audit`, `accessibility` (WCAG 2.2), `seo-schema`
- Lighthouse 4 páginas tocadas, WCAG AA (contraste, headings, alt text de fotos nuevas, focus), JSON-LD válido (Course, SportsOrganization), responsive 375/768/1024/1440
- **Criterio de salida**: Lighthouse ≥95 en las 4 categorías; 0 violaciones AA; rich results test verde

---

## FASE 3 — Estructural (desbloqueado por legal)

**Objetivo**: reactivar el social proof más fuerte del sitio (equipo + galería). Sin fecha hasta insumo legal.

### T3.1 — Auditoría y consentimientos de imagen de menores
- **Agente**: `legal-compliance-officer` (Opus)
- **Entregable**: checklist Ley 1581/1098 aplicada a: fichas de riders (5 existentes — perfiles ficticios con fotos reales de menores, ver memoria del proyecto), lineup Cali (10 retratos), fotos seleccionadas en T2.0, formato de autorización firmable para acudientes
- **⚠️ INSUMO DEL CLUB**: autorizaciones firmadas por acudiente por cada menor identificable con nombre
- **Aceptación**: matriz menor → foto → autorización → páginas donde puede aparecer

### T3.2 — Reactivar /equipo
- **Agente**: `astro-dev` + `content-manager` · **Depende de**: T3.1
- **Archivos**: los antiguos `src/pages/equipo/*.astro.bak` se eliminaron del árbol (ago 2026; recuperables con `git show 6626fa2:'src/pages/equipo/[...slug].astro.bak'`) — rehacer los perfiles sobre el sistema editorial (`docs/04` §27), descomentar nav en `constants.ts:33`, reconciliar `src/content/riders/*.md` con identidades reales autorizadas (retratos lineup 600×800 disponibles)
- **Aceptación**: /equipo con solo menores autorizados; JSON-LD Person; nav completa

### T3.3 — Reactivar /galeria
- **Agente**: `astro-dev` · **Depende de**: T3.1
- **Archivos**: renombrar `src/pages/galeria/*.astro.bak`, descomentar `constants.ts:39`, restaurar link de `NewsGallery.astro:71` (revertir guard de T1.6), poblar colección con álbumes de Palmira/Ginebra (fotos ya en disco)
- **Aceptación**: lightbox funcional; álbumes enlazados desde crónicas

### T3.4 — Backlog explícito (no planificado aún)
- Georreferenciar árboles (solo 2/77 con lat/lng — mapa Leaflet casi vacío)
- Landings `/sedes/*` (directorio vacío; plan de captación 2026)
- Programa "Recreación" faltante en colección
- Limpiar 6 referencias a placeholders inexistentes restantes (H15)

---

## Orden de ejecución y paralelismo

```
FASE 1 (1 sesión):
  Wave 1 (paralelo): [T1.1 + T1.4] perf-engineer · [T1.2 + T1.3] content-manager · [T1.5 + T1.6] astro-dev
  Wave 2: Gate qa-auditor
FASE 2 (2-3 sesiones):
  Wave 1: T2.0 photo-video-editor + image-optimizer  ·  T2.5 content-manager (independiente)
  Wave 2 (paralelo, tras T2.0): T2.1, T2.2, T2.3 astro-dev · T2.4 content-marketer+astro-dev
  Wave 3: Gate qa-auditor + accessibility-tester + seo-auditor
FASE 3 (cuando el club entregue autorizaciones):
  T3.1 → [T3.2 ∥ T3.3]
```

## Insumos que solo el club puede dar (bloquean partes, no el arranque)

1. **Cifra oficial de niños formados** (¿80 u otra?) — T1.2 usa 80 provisional
3. **Autorizaciones de imagen firmadas** — bloquea toda la Fase 3 y las fotos con menores identificables de T2.0/T2.4

## Métricas de éxito del refresh

- Lighthouse ≥95 × 4 categorías en todas las páginas tocadas (hoy ya se cumple en la mayoría — no regresión + mejora LCP)
- LCP home y /noticias: -300ms a -1s medido en Lighthouse throttled
- Cero contradicciones de cifras entre páginas
- Quiénes Somos y Programas con ≥4 y 3 fotos reales respectivamente
- GA4 (post-deploy): tasa de rebote de /programas y tiempo en /quienes-somos como baseline vs 30 días después
