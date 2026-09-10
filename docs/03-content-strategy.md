# Modelo de contenido — Club Deportivo Trocha y Ruta

**Reescrito**: 2026-09-09, reemplazando la versión de marzo de 2026 (~80 % obsoleta:
dos bloques de código — el `content.config.ts` completo y el `config.yml` completo
del CMS, 995 de 1393 líneas — eran copias congeladas de archivos que hoy viven en
otro sitio, con otro nombre y más campos). El original queda en el historial de git.

> **Regla de precedencia**: los schemas viven en `src/lib/schemas.ts`, la colección
> en `src/content.config.ts`, el CMS en `public/admin/config.yml`. Este documento
> explica la taxonomía y el porqué de las decisiones; no repite los campos —eso se
> desincroniza en cada commit. **Al cambiar un campo se cambian los tres** (regla
> de `CLAUDE.md`).

## 1. Las 16 colecciones

| Colección | Loader | Consume | Estado |
|---|---|---|---|
| `news` | glob `.md` | `/noticias`, `/noticias/[slug]` | Poblada (12) |
| `events` | glob `.md` | `/calendario` | Poblada (12) |
| `gallery` | glob `.md` | `/galeria` | Poblada (10) |
| `programs` | glob `.md` | `/programas` | Poblada (3: `escuela-de-iniciacion` 4-5 años, `formacion-juvenil` 6-11, `alto-rendimiento` 12+) |
| `sponsors` | glob `.md` | `/patrocinadores` | Poblada (7) |
| `faqs` | glob `.md` | `/preguntas-frecuentes`, `/contacto`, `/inscripciones` | Poblada (13). **Sin colección en Sveltia**: el club no puede editarlas desde el CMS — deuda abierta |
| `social-initiatives` | glob `.md` | `/trocha-verde` | Poblada (3) |
| `milestones` | glob `.md` | Historia del club, `/la-pista` (filtradas por `TRACK_MILESTONE_IDS`) | Poblada (8) |
| `trees` | glob `.md` | Trocha Verde | Poblada (77) |
| `species` | glob `.md` | Trocha Verde | Poblada (32) |
| `obstaculos` | glob `.md` | `/la-pista`, `/la-pista/[slug]` | 1 ficha, en `draft` (README excluido por patrón negativo) |
| `riders` | glob `.md` | — | 5 fichas, **todas `draft: true`**: son menores, no se publican |
| `directivos` | glob `.md` | `/equipo` (oculta) | Vacía — solo README excluido; sin autorizaciones de imagen |
| `results` | glob `.{yaml,yml,json}` | `SeasonStandings` en `/noticias` | Vacía — solo README; una sola temporada por carpeta cuando se llene |
| `rutas` | glob `.md` | — | **Sin directorio**: crearlo antes de usarla |
| `pages` | glob `.md` | `programas.md` únicamente | Poblada (1) — copy que la página no puede deducir sola, como el bloque `agePicker` |

No existe una colección `settings`: los datos generales del sitio (`SITE`,
`CONTACT`, `SOCIAL`, navegación, etiquetas de CTA) viven en `src/lib/constants.ts`.
Tampoco existe `testimonials`: se eliminó en agosto de 2026 porque los tres
testimonios publicados eran de demostración, no reales.

## 2. Relaciones por slug

`news` → `relatedEvent` / `relatedGallery` / `galleryFolder`; `events` →
`relatedGallery` / `relatedNews[]`; `gallery` → `relatedEvent`; `riders` →
`program`; `social-initiatives` → `relatedGallery` / `relatedNews[]`. Todas
resuelven por slug, salvo una: **`trees.species` es por nombre común**, no por
id — la única relación del sitio así, y la única que
`src/lib/__tests__/content-validation.test.ts` deja fuera de su validación.
Ese test valida el resto de referencias cruzadas sobre el contenido real,
**incluidos los drafts**.

## 3. Taxonomía

### 3.1 Categorías de noticias
`competencias` · `club` · `entrenamiento` · `comunidad`

### 3.2 Categorías de eventos
`xco` · `xcm` · `ruta` · `enduro` · `recreativo` · `social` · `entrenamiento`

### 3.3 Estado de evento
`upcoming` · `ongoing` · `past` · `cancelled`

### 3.4 Categorías de corredor (por edad, alineadas con la Federación Colombiana de Ciclismo)
`pre-infantil` · `infantil` · `juvenil` · `sub23` · `elite` · `master`

### 3.5 Especialidad de corredor
`xco` · `xcm` · `enduro` · `ruta` · `múltiple`

### 3.6 Programas — edades reales
Tres programas, no cuatro: `escuela-de-iniciacion` (4-5 años),
`formacion-juvenil` (6-11), `alto-rendimiento` (12-99). La edad mínima del club
es **4 años**, derivada de `programs` — nunca un número escrito a mano en otro
sitio.

### 3.7 Categorías de galería
`xco` · `xcm` · `ruta` · `enduro` · `recreativo` · `social` · `entrenamiento`
(mismas que eventos, por diseño: un álbum suele ligarse a un evento)

### 3.8 Niveles de patrocinador
`principal` · `oficial` · `aliado` · `proveedor`

### 3.9 Categorías de FAQ
`general` · `inscripciones` · `entrenamiento` · `competencias` ·
`equipamiento` · `seguridad`

### 3.10 Iniciativas sociales
Tipo: `ambiental` · `formacion` · `recreacion` · `educacion` · `alianza`.
Estado: `activa` · `completada` · `pausada`.

### 3.11 Árboles y especies (Trocha Verde)
Categoría: `frutal` · `ornamental` · `nativo` · `maderable`. Estado del árbol:
`sembrado` · `creciendo` · `floreciendo`. El protector (tubo de protección del
tronco) tiene su propio color por tipo, en `protectorColor`.

### 3.12 Obstáculos (`/la-pista`)
`OBSTACLE_TYPES` (9 tipos) y `OBSTACLE_LEVELS` (`basico` · `intermedio` ·
`avanzado`) — ambos exportados de `src/lib/schemas.ts` para reutilizar como
enum de TypeScript, no solo como validación de Zod.

### Tags reutilizables
Es una convención sin página de filtro: ninguna ruta del sitio filtra por tag
hoy. Sirve solo como campo libre de búsqueda interna (Pagefind).

## 4. SEO estructural

`src/lib/seo.ts` tiene **15 generadores** de JSON-LD, no los tres que
documentaba la versión anterior de este archivo:

| Generador | Tipo | Página |
|---|---|---|
| `generateOrganizationJsonLd` | `SportsOrganization` | `/` |
| `generateWebSiteJsonLd` | `WebSite` | `/` |
| `generateNewsMediaOrganizationJsonLd` | `NewsMediaOrganization` | `/` |
| `generateSportsClubJsonLd` | `SportsOrganization` + `SportsClub` | `/quienes-somos` |
| `generateEventJsonLd` | `SportsEvent` | `/calendario` |
| `generateEventsListJsonLd` | `ItemList` | `/calendario` |
| `generateFAQPageJsonLd` | `FAQPage` | `/contacto`, `/inscripciones`, `/preguntas-frecuentes` |
| `generateCourseJsonLd` | `Course` (+ `CourseInstance`/`Schedule`/`Offer`/`EducationalAudience`) | `/programas/[slug]` |
| `generateArticleJsonLd` | `NewsArticle` | `/noticias/[slug]` |
| `generateGalleryJsonLd` | `ImageGallery` | `/galeria/[slug]` |
| `generateTrackJsonLd` | `SportsActivityLocation` | `/la-pista` |
| `generateSocialInitiativeJsonLd` | `Event` (según tipo) | `/trocha-verde` |
| `generateBreadcrumbJsonLd` | `BreadcrumbList` | `/trocha-verde/arboles/[slug]` |
| `generateSportsTeamJsonLd` | `SportsTeam` | No se usa — `/equipo` está oculta |
| `generatePersonJsonLd` | `Person` | No se usa — no hay fichas de corredor publicadas |

Fechas siempre con `toColombiaIso()` (offset `-05:00`, no `Z`). `rss.xml.ts`
mezcla noticias con los 10 eventos más recientes (prefijo `[Evento]`).
`news-sitemap.xml.ts` usa una ventana de 48 h **anclada a la fecha del artículo
más reciente**, no a `Date.now()`: en `output: 'static'` el reloj se evalúa en
build, y usarlo dejaría el sitemap vacío casi siempre.

## 5. Reglas de contenido que atraviesan todo el sitio

Documentadas con su razón en `docs/04-sistema-editorial.md` §21 y §27, y en
`CLAUDE.md`; no se repiten aquí. Resumen de lo que hay que saber antes de tocar
una colección:

- **Sin datos, el bloque no se pinta.** Nunca una tarjeta de ejemplo ni un
  "próximamente" — es la regla que siguen `summarizePrograms()`,
  `summarizeStaff()`, `summarizeStandings()` y el resto de funciones de
  `src/lib/`.
- **Los menores no se publican.** `riders` está completa pero en `draft`;
  `/equipo` está construida pero oculta (`noindex`, fuera de sitemap, de
  `NAV_ITEMS` y de Pagefind) hasta que existan autorizaciones de imagen
  firmadas.
- **No hay cifras sin fuente.** `CLUB_STATS` se eliminó; toda cifra visible
  sale de una función que la deriva del contenido real (`getYearsActive()`,
  `summarizeTrees()`, `buildClubFigures()`).
- **`results` es una sola temporada por carpeta.** `buildStandings()` suma
  todo lo que encuentra en `src/content/results/`.

## 6. Sveltia CMS

Backend `github` sobre `Club-Deportivo-Trocha-y-Ruta/main-page`, rama `main`,
con `editorial_workflow`. `media_folder`/`public_folder` apuntan a
`src/assets/images`. No se documenta el YAML campo por campo aquí —eso es
`public/admin/config.yml` mismo—; lo que no se explica solo con leerlo:

- **`results` usa `identifier_field: eventName`** y compone el slug con
  `{{fields.event}}-{{fields.category}}`, porque una válida tiene múltiples
  entradas (una por categoría) que necesitan slugs distintos sin pedirle al
  editor que los escriba a mano.
- **`obstaculos` usa un widget `relation` contra `programs`**, para que la
  ficha del obstáculo pueda decir desde qué programa se entrena sin duplicar
  el título del programa como texto libre.
- **No hay colección `settings`** porque los datos generales del sitio no son
  contenido editorial: son configuración de código en `src/lib/constants.ts`,
  con su propio historial de cambios en git.

## Referencias

- `docs/04-sistema-editorial.md` — sistema de componentes de UI, con la
  referencia de cada página y sus datos.
- `docs/02-technical-architecture.md` — arquitectura técnica y ADRs.
- `CLAUDE.md` — reglas de contenido y convenciones que no se repiten aquí.
