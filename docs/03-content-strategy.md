# 03 - Estrategia de Contenido y Modelo de Datos

> **Nota (2026-08): la sección de testimonios se eliminó del sitio.** Los tres testimonios
> que existían eran de demostración, no reales. Se borraron la colección `testimonials`, su
> schema, la página `/testimonios`, el carrusel y las referencias en portada y Quiénes Somos.
> Lo que este documento diga sobre testimonios es histórico: no lo reconstruyas sin contenido
> real y autorizado por las familias.


## Club Deportivo Trocha y Ruta - Rebuild del Sitio Web

---

## 1. Inventario de Contenido Actual

Análisis del sitio actual en WordPress (Astra + Elementor): https://clubdeportivotrochayruta.org/

| Página Actual | Tipo de Contenido | Estado | Prioridad | Notas |
|---|---|---|---|---|
| Homepage (`/`) | Hero + CTA + galería miniatura + próximos eventos | **Reescribir** | Alta | Rediseñar con secciones modulares (stats, programas, equipo, sponsors) |
| Quiénes Somos (`/quienes-somos-2/`) | Texto institucional básico: misión, valores, datos de contacto | **Reescribir** | Alta | Falta historia/timeline, equipo directivo, logros, reconocimientos. Expandir significativamente |
| Programas (`/programas/`) | 4 programas listados: Escuela de Iniciación (4-8), Formación Juvenil (9-15), Alto Rendimiento (16+), Recreación y Familia | **Migrar + Expandir** | Alta | Estructura buena pero falta detalle (horarios, requisitos, metodología, equipo necesario) |
| Inscripciones (`/inscripciones/`) | Formulario básico de registro | **Reescribir** | Alta | Implementar formulario multi-paso con validación |
| Galería (`/galeria/`) | 10 fotos sin organización, sin álbumes, sin fechas, sin captions | **Reescribir** | Media | Reorganizar en álbumes por evento/fecha con metadatos |
| Información Pública (`/transparencia/`) | Documentos DIAN y certificados | **Migrar** | Baja | Migrar PDFs y links existentes |
| Contacto (`/contacto/`) | Formulario + datos de contacto | **Reescribir** | Media | Agregar mapa embebido, horarios, redes sociales |
| **NO EXISTE** | Noticias / Blog | **Crear** | Alta | Sección completamente nueva para comunicación del club |
| **NO EXISTE** | Equipo / Roster de corredores | **Crear** | Alta | Perfiles individuales de corredores con datos y logros |
| **NO EXISTE** | Calendario de eventos | **Crear** | Alta | Vista cronológica de competencias y actividades |
| **NO EXISTE** | Patrocinadores | **Crear** | Media | Visibilidad para aliados comerciales |
| **NO EXISTE** | Página 404 | **Crear** | Baja | Página de error personalizada |

### Resumen del inventario
- **Contenido a migrar**: ~20% (programas, transparencia)
- **Contenido a reescribir**: ~50% (homepage, quiénes somos, galería, contacto, inscripciones)
- **Contenido nuevo**: ~30% (noticias, equipo, calendario, patrocinadores)

---

## 2. Content Model Refinado

### 2.1 Análisis de Schemas Originales y Mejoras Propuestas

Los schemas del PROMPT-PROYECTO.md tienen una base sólida pero requieren las siguientes mejoras:

#### Problemas identificados:
1. **Falta colección `directivos`** para equipo directivo/staff administrativo
2. **Falta colección `resultados`** para resultados de competencias
3. **Falta colección `rutas`** para rutas de entrenamiento
4. **Relaciones débiles** entre colecciones (evento ↔ galería, corredor ↔ resultados)
5. **Campos faltantes** en riders (número dorsal, peso, altura para categorías)
6. **Categorías de edad no granulares** — el actual solo tiene `infantil | juvenil | elite | staff`
7. **Sin slug explícito** en varias colecciones (Astro lo genera del filename, pero Decap CMS lo necesita)
8. **Sin soporte para SEO** por entrada (meta description, og:image personalizados)
9. **Sin draft/published** para workflow editorial

### 2.2 Schemas Zod Actualizados y Completos

```typescript
// src/content/config.ts
import { defineCollection, z, reference } from 'astro:content';

// ============================================================
// ESQUEMAS AUXILIARES REUTILIZABLES
// ============================================================

const seoSchema = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().max(160).optional(),
  ogImage: z.string().optional(),
}).optional();

const socialMediaSchema = z.object({
  instagram: z.string().url().optional(),
  facebook: z.string().url().optional(),
  strava: z.string().url().optional(),
  youtube: z.string().url().optional(),
  tiktok: z.string().url().optional(),
}).optional();

// ============================================================
// COLECCIÓN: RIDERS (Corredores)
// ============================================================
const riders = defineCollection({
  type: 'content',
  schema: z.object({
    // --- Datos básicos ---
    name: z.string(),
    photo: z.string(),
    birthDate: z.coerce.date(),

    // --- Clasificación ---
    category: z.enum([
      'pre-infantil',   // 4-7 años
      'infantil',       // 8-11 años
      'juvenil',        // 12-15 años
      'sub23',          // 16-22 años
      'elite',          // 23+ años
      'master',         // 30+ años
    ]),
    ageGroup: z.string().optional(),  // Ej: "Pre-infantil A (4-5)"
    level: z.enum(['iniciación', 'formación', 'competición', 'alto-rendimiento']).default('formación'),

    // --- Datos deportivos ---
    specialty: z.enum(['xco', 'xcm', 'enduro', 'ruta', 'múltiple']).optional(),
    dorsalNumber: z.number().optional(),
    yearJoined: z.number().optional(),

    // --- Logros ---
    achievements: z.array(z.object({
      year: z.number(),
      event: z.string(),
      position: z.number().optional(),
      description: z.string(),
    })).default([]),

    // --- Social ---
    socialMedia: socialMediaSchema,

    // --- Relaciones ---
    program: z.string().optional(),  // slug del programa

    // --- Control ---
    active: z.boolean().default(true),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    seo: seoSchema,
  }),
});

// ============================================================
// COLECCIÓN: DIRECTIVOS (Equipo Directivo y Staff)
// ============================================================
const directivos = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    photo: z.string().optional(),
    role: z.enum([
      'presidente',
      'vicepresidente',
      'secretario',
      'tesorero',
      'fiscal',
      'vocal',
      'entrenador-principal',
      'entrenador',
      'preparador-fisico',
      'mecanico',
      'medico',
      'coordinador',
    ]),
    roleLabel: z.string(),  // Texto libre: "Director Técnico", "Entrenador Infantil"
    bio: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    socialMedia: socialMediaSchema,
    certifications: z.array(z.string()).default([]),
    yearJoined: z.number().optional(),
    active: z.boolean().default(true),
    order: z.number().default(0),
  }),
});

// ============================================================
// COLECCIÓN: NEWS (Noticias)
// ============================================================
const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Club Trocha y Ruta'),
    category: z.enum(['competencias', 'club', 'entrenamiento', 'comunidad']),
    tags: z.array(z.string()).default([]),
    image: z.string(),
    imageAlt: z.string().optional(),
    excerpt: z.string().max(200),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),

    // --- Relaciones ---
    relatedEvent: z.string().optional(),    // slug del evento
    relatedGallery: z.string().optional(),  // slug de la galería

    seo: seoSchema,
  }),
});

// ============================================================
// COLECCIÓN: EVENTS (Eventos y Competencias)
// ============================================================
const events = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),

    // --- Ubicación ---
    location: z.string(),
    city: z.string().optional(),
    department: z.string().default('Valle del Cauca'),
    mapUrl: z.string().url().optional(),

    // --- Clasificación ---
    category: z.enum(['xco', 'xcm', 'ruta', 'enduro', 'recreativo', 'social', 'entrenamiento']),
    level: z.enum(['municipal', 'departamental', 'regional', 'nacional', 'internacional', 'interno']).default('departamental'),
    organizer: z.string().optional(),

    // --- Media ---
    image: z.string().optional(),
    imageAlt: z.string().optional(),

    // --- Estado ---
    status: z.enum(['upcoming', 'ongoing', 'past', 'cancelled']).default('upcoming'),
    registrationUrl: z.string().url().optional(),
    registrationDeadline: z.coerce.date().optional(),

    // --- Relaciones ---
    relatedGallery: z.string().optional(),   // slug de la galería
    relatedNews: z.array(z.string()).default([]), // slugs de noticias

    // --- Resultados ---
    resultsUrl: z.string().url().optional(),

    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    seo: seoSchema,
  }),
});

// ============================================================
// COLECCIÓN: RESULTS (Resultados de Competencias)
// ============================================================
const results = defineCollection({
  type: 'data',  // YAML/JSON, no Markdown
  schema: z.object({
    event: z.string(),         // slug del evento
    eventName: z.string(),     // nombre legible
    date: z.coerce.date(),
    category: z.string(),      // Categoría de la carrera

    positions: z.array(z.object({
      position: z.number(),
      rider: z.string().optional(),  // slug del corredor (si es del club)
      riderName: z.string(),
      time: z.string().optional(),
      points: z.number().optional(),
    })),

    // Resumen del club en el evento
    clubHighlights: z.string().optional(),
    totalParticipants: z.number().optional(),
  }),
});

// ============================================================
// COLECCIÓN: PROGRAMS (Programas de Entrenamiento)
// ============================================================
const programs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    icon: z.string(),            // nombre del icono (Phosphor)
    image: z.string().optional(),

    // --- Audiencia ---
    ageRange: z.string(),        // "4 a 8 años"
    ageMin: z.number(),
    ageMax: z.number(),
    targetLevel: z.enum(['iniciación', 'formación', 'competición', 'recreativo']),

    // --- Logística ---
    schedule: z.string(),        // "Sábados y domingos 7:00 - 10:00 AM"
    // Mismo horario en datos, opcional. Es lo que permite anunciar la próxima
    // sesión (`nextSession()` en src/lib/programs.ts); las aclaraciones del
    // club ("salida", "+12 años") siguen viviendo solo en `schedule`.
    sessions: z.array(z.object({
      day: z.enum(['mon','tue','wed','thu','fri','sat','sun']),
      start: z.string(),         // "16:30" — 24 horas, HH:MM
      end: z.string(),           // "18:00" — posterior a `start`
      place: z.string().optional(),
    })).optional(),
    duration: z.string().optional(),  // "2 horas por sesión"
    location: z.string().optional(),
    maxStudents: z.number().optional(),

    // --- Requisitos ---
    requirements: z.array(z.string()),
    equipmentNeeded: z.array(z.string()).default([]),

    // --- Metodología ---
    objectives: z.array(z.string()).default([]),
    methodology: z.string().optional(),

    // --- Inscripción ---
    enrollmentOpen: z.boolean().default(true),
    monthlyFee: z.string().optional(),

    active: z.boolean().default(true),
    order: z.number(),
    draft: z.boolean().default(false),
    seo: seoSchema,
  }),
});

// ============================================================
// COLECCIÓN: SPONSORS (Patrocinadores)
// ============================================================
const sponsors = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    logo: z.string(),
    logoLight: z.string().optional(),  // Logo para fondo oscuro
    level: z.enum(['principal', 'oficial', 'aliado', 'proveedor']),
    url: z.string().url().optional(),
    description: z.string().optional(),

    // --- Periodo ---
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),

    active: z.boolean().default(true),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

// ============================================================
// COLECCIÓN: GALLERY (Álbumes de Galería)
// ============================================================
const gallery = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    cover: z.string(),
    coverAlt: z.string().optional(),
    description: z.string().optional(),

    images: z.array(z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
      photographer: z.string().optional(),
    })),

    // --- Videos ---
    videos: z.array(z.object({
      url: z.string().url(),
      title: z.string(),
      thumbnail: z.string().optional(),
    })).default([]),

    // --- Relaciones ---
    relatedEvent: z.string().optional(),   // slug del evento

    // --- Clasificación ---
    category: z.enum(['competencia', 'entrenamiento', 'social', 'institucional']).default('competencia'),
    tags: z.array(z.string()).default([]),

    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    seo: seoSchema,
  }),
});

// ============================================================
// COLECCIÓN: RUTAS (Rutas de entrenamiento / circuitos)
// ============================================================
const rutas = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    description: z.string(),
    image: z.string().optional(),

    // --- Datos técnicos ---
    distance: z.number(),          // en km
    elevationGain: z.number(),     // en metros
    difficulty: z.enum(['facil', 'moderada', 'dificil', 'experto']),
    surface: z.enum(['tierra', 'mixto', 'asfalto', 'técnico']),
    estimatedTime: z.string(),     // "2h 30min"

    // --- Ubicación ---
    startPoint: z.string(),
    endPoint: z.string().optional(),
    city: z.string().default('Yumbo'),

    // --- GPS ---
    gpxFile: z.string().optional(),       // link al archivo GPX
    stravaRoute: z.string().url().optional(),
    mapUrl: z.string().url().optional(),

    // --- Uso ---
    suitableFor: z.array(z.enum(['pre-infantil', 'infantil', 'juvenil', 'elite', 'recreativo'])),
    usedInPrograms: z.array(z.string()).default([]),  // slugs de programas

    active: z.boolean().default(true),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    seo: seoSchema,
  }),
});

// ============================================================
// COLECCIÓN: PAGES (Páginas estáticas editables desde CMS)
// ============================================================
const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    image: z.string().optional(),
    layout: z.enum(['page', 'fullwidth', 'landing']).default('page'),
    showInNav: z.boolean().default(false),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    seo: seoSchema,
  }),
});

// ============================================================
// EXPORTAR COLECCIONES
// ============================================================
export const collections = {
  riders,
  directivos,
  news,
  events,
  results,
  programs,
  sponsors,
  gallery,
  rutas,
  pages,
};
```

### 2.3 Diagrama de Relaciones entre Colecciones

```
                    ┌──────────┐
                    │  events  │
                    └─────┬────┘
                     ╱    │    ╲
                    ╱     │     ╲
           ┌───────┐  ┌──┴───┐  ┌─────────┐
           │ news  │  │gallery│  │ results │
           └───┬───┘  └──────┘  └────┬────┘
               │                     │
               │                     │
           ┌───┴───────────────┐     │
           │      riders       ├─────┘
           └───────┬───────────┘
                   │
           ┌───────┴───────┐
           │   programs    │
           └───────┬───────┘
                   │
           ┌───────┴───────┐
           │    rutas      │
           └───────────────┘

   ┌────────────┐   ┌──────────────┐   ┌──────────────┐
   │ directivos │   │   sponsors   │
   └────────────┘   └──────────────┘   └──────────────┘
                           │
                    riders / programs
```

**Relaciones clave:**
- `event` → `gallery` (1:1) — Cada evento puede tener un álbum de galería
- `event` → `results` (1:N) — Un evento puede tener resultados por categoría
- `event` → `news` (1:N) — Un evento puede generar varias noticias
- `rider` → `results` (N:M) — Un corredor aparece en múltiples resultados
- `rider` → `program` (N:1) — Un corredor pertenece a un programa
- `gallery` → `event` (1:1) — Álbum vinculado a un evento
- `ruta` → `program` (N:M) — Una ruta puede usarse en varios programas

---

## 3. Taxonomía y Categorización

### 3.1 Categorías de Noticias

| Categoría | Slug | Descripción | Ejemplo |
|---|---|---|---|
| Competencias | `competencias` | Resultados, crónicas de carreras, clasificaciones | "Trocha y Ruta arrasa en la Copa Valle XCO 2025" |
| Club | `club` | Anuncios institucionales, asambleas, nuevos miembros | "Nuevos horarios de entrenamiento para 2026" |
| Entrenamiento | `entrenamiento` | Tips, metodología, preparación física | "Guía de nutrición para jóvenes ciclistas" |
| Comunidad | `comunidad` | Actividades sociales, voluntariado, colaboraciones | "Jornada de limpieza en senderos de Yumbo" |

### 3.2 Categorías de Eventos

| Categoría | Slug | Descripción |
|---|---|---|
| XCO | `xco` | Cross-Country Olímpico (circuitos cortos) |
| XCM | `xcm` | Cross-Country Maratón (larga distancia) |
| Ruta | `ruta` | Ciclismo de ruta/carretera |
| Enduro | `enduro` | Descenso técnico con tramos cronometrados |
| Recreativo | `recreativo` | Ciclopaseos, rodadas familiares |
| Social | `social` | Eventos no deportivos (asados, celebraciones) |
| Entrenamiento | `entrenamiento` | Sesiones especiales, campus, clínicas |

### 3.3 Niveles de Eventos

| Nivel | Slug | Descripción |
|---|---|---|
| Interno | `interno` | Actividades internas del club |
| Municipal | `municipal` | Competencias en Yumbo |
| Departamental | `departamental` | Copa Valle, Liga Valle del Cauca |
| Regional | `regional` | Suroccidente colombiano |
| Nacional | `nacional` | Copa Colombia, Campeonato Nacional |
| Internacional | `internacional` | Eventos internacionales |

### 3.4 Categorías de Corredores por Edad

Basado en las categorías oficiales de la Federación Colombiana de Ciclismo:

| Categoría | Slug | Rango de Edad | Programa Asociado |
|---|---|---|---|
| Pre-infantil | `pre-infantil` | 4 - 7 años | Escuela de Iniciación |
| Infantil | `infantil` | 8 - 11 años | Escuela de Iniciación / Formación |
| Juvenil | `juvenil` | 12 - 15 años | Formación Juvenil |
| Sub-23 | `sub23` | 16 - 22 años | Alto Rendimiento |
| Elite | `elite` | 23+ años | Alto Rendimiento |
| Master | `master` | 30+ años | Alto Rendimiento |

### 3.5 Niveles de Corredor

| Nivel | Slug | Descripción |
|---|---|---|
| Iniciación | `iniciación` | Primer contacto con el ciclismo |
| Formación | `formación` | Aprendiendo técnica y disciplina |
| Competición | `competición` | Participa en competencias regionales |
| Alto Rendimiento | `alto-rendimiento` | Competencia a nivel departamental/nacional |

### 3.6 Categorías de Programas

| Programa | Target | Edad | Nivel |
|---|---|---|---|
| Escuela de Iniciación | Pre-infantil / Infantil | 4 - 8 años | Iniciación |
| Formación Juvenil | Infantil / Juvenil | 9 - 15 años | Formación |
| Alto Rendimiento | Sub-23 / Elite | 16+ años | Competición |
| Recreación y Familia | Todos | Todas | Recreativo |

### 3.7 Categorías de Galería

| Categoría | Slug | Descripción |
|---|---|---|
| Competencia | `competencia` | Fotos de carreras y podios |
| Entrenamiento | `entrenamiento` | Sesiones de entrenamiento |
| Social | `social` | Eventos sociales y celebraciones |
| Institucional | `institucional` | Fotos oficiales, directivos, documentos |

### 3.8 Niveles de Patrocinadores

| Nivel | Slug | Visibilidad |
|---|---|---|
| Principal | `principal` | Logo grande en header, hero, footer. Mención en todas las noticias |
| Oficial | `oficial` | Logo mediano en footer y página de sponsors |
| Aliado | `aliado` | Logo pequeño en página de sponsors |
| Proveedor | `proveedor` | Mención en página de sponsors |

### 3.9 Tags Reutilizables (cross-collection)

Tags que pueden usarse en noticias, eventos y galería:

| Tag | Uso típico |
|---|---|
| `copa-valle` | Eventos y noticias de la Copa Valle |
| `liga-valle` | Liga departamental |
| `yumbo` | Eventos locales |
| `podio` | Logros y victorias |
| `infantil`, `juvenil`, `elite` | Filtrar por categoría de edad |
| `xco`, `xcm`, `enduro`, `ruta` | Filtrar por disciplina |
| `entrenamiento` | Contenido de entrenamiento |
| `familia` | Contenido para padres/familias |
| `biciescuela` | Escuela de iniciación |
| `resultados` | Publicaciones con resultados |

---

## 4. Estrategia SEO de Contenido

### 4.1 Mapa SEO por Página

| Página | URL | Keyword Principal | Title Tag | Meta Description | Schema.org |
|---|---|---|---|---|---|
| Homepage | `/` | club ciclomontañismo yumbo | Club Deportivo Trocha y Ruta - Ciclomontañismo en Yumbo, Valle | Escuela de ciclomontañismo para niños desde 4 años en Yumbo, Valle del Cauca. Deporte, formación y naturaleza. Inscripciones abiertas. | `SportsOrganization`, `WebSite` |
| Quiénes Somos | `/quienes-somos` | club ciclismo yumbo historia | Quiénes Somos - Club Deportivo Trocha y Ruta | Conoce la historia del Club Trocha y Ruta. Desde 2010 formando ciclistas en Yumbo. Misión, visión, valores y equipo directivo. | `AboutPage`, `SportsOrganization` |
| Programas | `/programas` | escuela ciclismo niños valle del cauca | Programas de Entrenamiento - Club Trocha y Ruta | Programas de ciclomontañismo para todas las edades: Escuela Infantil (4-8), Formación Juvenil (9-15), Alto Rendimiento (16+). | `ItemList`, `Course` |
| Programa Detalle | `/programas/[slug]` | {nombre programa} ciclismo | {Programa} - Club Trocha y Ruta | {Descripción del programa con edades y horarios} | `Course`, `SportsActivity` |
| Equipo | `/equipo` | corredores ciclomontañismo yumbo | Nuestro Equipo - Corredores Club Trocha y Ruta | Conoce a los corredores del Club Trocha y Ruta. Perfiles, logros y categorías desde pre-infantil hasta élite. | `SportsTeam`, `ItemList` |
| Corredor Detalle | `/equipo/[slug]` | {nombre corredor} ciclista | {Nombre} - Corredor Club Trocha y Ruta | {Bio corta del corredor con categoría y logros principales} | `Person`, `Athlete` |
| Noticias | `/noticias` | noticias ciclismo valle del cauca | Noticias - Club Deportivo Trocha y Ruta | Últimas noticias del Club Trocha y Ruta: competencias, entrenamiento, resultados y vida del club. | `CollectionPage`, `Blog` |
| Noticia Detalle | `/noticias/[slug]` | {keyword de la noticia} | {Título de la noticia} - Club Trocha y Ruta | {Excerpt de la noticia} | `NewsArticle`, `BlogPosting` |
| Calendario | `/calendario` | competencias ciclismo valle 2026 | Calendario de Eventos - Club Trocha y Ruta | Próximas competencias y eventos de ciclomontañismo. Calendario actualizado del Club Trocha y Ruta. | `ItemList`, `Event` |
| Galería | `/galeria` | fotos ciclomontañismo yumbo | Galería de Fotos - Club Trocha y Ruta | Galería fotográfica del Club Trocha y Ruta. Competencias, entrenamientos y momentos del club. | `CollectionPage`, `ImageGallery` |
| Álbum Detalle | `/galeria/[slug]` | fotos {evento} ciclismo | {Título del álbum} - Galería Club Trocha y Ruta | {Descripción del álbum con evento y fecha} | `ImageGallery` |
| Inscripciones | `/inscripciones` | inscripción escuela ciclismo yumbo | Inscripciones - Club Deportivo Trocha y Ruta | Inscribe a tu hijo en el Club Trocha y Ruta. Ciclomontañismo desde los 4 años en Yumbo, Valle del Cauca. | `WebPage` |
| Patrocinadores | `/patrocinadores` | patrocinadores club ciclismo | Patrocinadores y Aliados - Club Trocha y Ruta | Empresas y aliados que apoyan el ciclomontañismo juvenil en Yumbo a través del Club Trocha y Ruta. | `WebPage` |
| Transparencia | `/transparencia` | - | Transparencia e Información Pública - Club Trocha y Ruta | Documentos públicos, certificados DIAN y reconocimientos del Club Deportivo Trocha y Ruta. | `WebPage`, `GovernmentService` |
| Contacto | `/contacto` | contacto club ciclismo yumbo | Contacto - Club Deportivo Trocha y Ruta | Contáctanos: CL 8 Norte 2 N° 55, Yumbo. Tel: 314 850 5372. Escríbenos y conoce el club. | `ContactPage`, `LocalBusiness` |

### 4.2 Estrategia de Internal Linking

**Desde Homepage:**
- Hero CTA → `/inscripciones`
- Sección Programas → cada `/programas/[slug]`
- Sección Equipo → `/equipo`
- Sección Eventos → `/calendario`
- Sección Noticias → `/noticias`
- Sección Galería → `/galeria`
- Footer → todas las páginas principales

**Desde Noticias (cada artículo):**
- Link a evento relacionado → `/calendario` o evento específico
- Link a galería del evento → `/galeria/[slug]`
- Link a corredores mencionados → `/equipo/[slug]`
- Breadcrumb: Inicio > Noticias > {Título}

**Desde Eventos:**
- Link a resultados → tabla de resultados
- Link a galería → `/galeria/[slug]`
- Link a noticias relacionadas → `/noticias/[slug]`
- CTA de inscripción → link externo o `/inscripciones`

**Desde Equipo:**
- Link al programa del corredor → `/programas/[slug]`
- Link a resultados del corredor → filtro por corredor
- Breadcrumb: Inicio > Equipo > {Nombre}

**Desde Programas:**
- Link a inscripciones → `/inscripciones`
- Link a corredores del programa → `/equipo?programa={slug}`

### 4.3 Datos Estructurados JSON-LD

Implementar en `src/lib/seo.ts`:

```typescript
// SportsOrganization (global, en homepage)
{
  "@context": "https://schema.org",
  "@type": "SportsOrganization",
  "name": "Club Deportivo Trocha y Ruta",
  "alternateName": "Trocha y Ruta",
  "url": "https://clubdeportivotrochayruta.org",
  "logo": "https://clubdeportivotrochayruta.org/images/logo.png",
  "foundingDate": "2010-05-01",
  "sport": "Mountain Biking",
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "CL 8 Norte 2 N° 55",
    "addressLocality": "Yumbo",
    "addressRegion": "Valle del Cauca",
    "addressCountry": "CO"
  },
  "telephone": "+573148505372",
  "email": "clubtrochayruta@hotmail.com",
  "sameAs": [
    "https://www.facebook.com/ClubDeportivoTrochayRuta",
    "https://www.instagram.com/trochay.ruta",
    "https://www.youtube.com/@clubtrochayruta"
  ]
}

// Event (por cada evento)
{
  "@context": "https://schema.org",
  "@type": "SportsEvent",
  "name": "{título}",
  "startDate": "{fecha}",
  "location": {
    "@type": "Place",
    "name": "{ubicación}"
  },
  "organizer": {
    "@type": "SportsOrganization",
    "name": "Club Deportivo Trocha y Ruta"
  }
}

// Person/Athlete (por cada corredor)
{
  "@context": "https://schema.org",
  "@type": "Person",
  "name": "{nombre}",
  "memberOf": {
    "@type": "SportsTeam",
    "name": "Club Deportivo Trocha y Ruta"
  }
}
```

---

## 5. Plan de Contenido Mínimo para Lanzamiento (MVP)

### 5.1 Contenido Mínimo por Colección

| Colección | Items Mínimos | Contenido Real | Placeholder | Prioridad |
|---|---|---|---|---|
| `programs` | 4 | 4 (migrar de sitio actual) | 0 | P0 - Imprescindible |
| `directivos` | 3-5 | Real (solicitar al club) | 0 | P0 - Imprescindible |
| `riders` | 10-15 | Real (solicitar al club) | 0 | P0 - Imprescindible |
| `news` | 5 | 3 reales + 2 de ejemplo | 2 | P1 - Importante |
| `events` | 5 | 3 reales (calendario 2026) + 2 pasados | 0 | P1 - Importante |
| `gallery` | 3 álbumes | 3 reales (migrar fotos existentes) | 0 | P1 - Importante |
| `sponsors` | 2-4 | Real (solicitar al club) | 0 | P2 - Deseable |
| `results` | 2-3 | 2 de eventos recientes | 0 | P2 - Deseable |
| `rutas` | 2-3 | 2 placeholder descriptivos | 2 | P3 - Post-lanzamiento |
| `pages` | 2 | Quiénes Somos + Transparencia | 0 | P0 - Imprescindible |

### 5.2 Contenido de Páginas Estáticas (MVP)

| Página | Estado MVP | Contenido Necesario |
|---|---|---|
| Homepage | Completa | Hero image, stats reales, programas, al menos 3 eventos, equipo destacado |
| Quiénes Somos | Completa | Historia real del club, misión/visión/valores, al menos 3 directivos |
| Programas | Completa | Los 4 programas con detalle completo |
| Equipo | Completa | Mínimo 10 corredores con foto y datos básicos |
| Noticias | Funcional | Mínimo 3 noticias reales |
| Calendario | Funcional | Mínimo 3 eventos próximos + 2 pasados |
| Galería | Funcional | 3 álbumes con al menos 8 fotos cada uno |
| Inscripciones | Completa | Formulario funcional conectado a Netlify Forms |
| Patrocinadores | Básica | Al menos 2 patrocinadores reales |
| Transparencia | Básica | PDFs existentes migrados |
| Contacto | Completa | Formulario + mapa + datos actualizados |
| 404 | Completa | Diseño simple con redirección |

### 5.3 Prioridad de Migración

**Fase 1 (Pre-lanzamiento, semana 1-2):**
1. Solicitar al club: fotos de corredores, datos de directivos, logos de sponsors
2. Migrar los 4 programas con contenido expandido
3. Organizar las 10 fotos existentes en álbumes
4. Migrar documentos de transparencia

**Fase 2 (Lanzamiento, semana 3):**
1. Publicar con contenido real obtenido del club
2. Crear 3-5 noticias iniciales (historia del club, próximos eventos)
3. Completar calendario con eventos del año en curso

**Fase 3 (Post-lanzamiento, continuo):**
1. Capacitar al equipo del club en Decap CMS
2. Establecer rutina de publicación (1 noticia/semana mínimo)
3. Agregar rutas de entrenamiento progresivamente
4. Agregar resultados de competencias a medida que ocurren

---

## 6. Configuración Decap CMS

### 6.1 Archivo `public/admin/config.yml`

```yaml
# ============================================================
# Decap CMS Configuration
# Club Deportivo Trocha y Ruta
# ============================================================

backend:
  name: git-gateway
  branch: main
  commit_messages:
    create: 'content: crea {{collection}} "{{slug}}"'
    update: 'content: actualiza {{collection}} "{{slug}}"'
    delete: 'content: elimina {{collection}} "{{slug}}"'
    uploadMedia: 'media: sube "{{path}}"'
    deleteMedia: 'media: elimina "{{path}}"'

# Workflow editorial (draft → review → ready → published)
publish_mode: editorial_workflow

# Carpeta de medios
media_folder: "src/assets"
public_folder: "/src/assets"

# Locale en español
locale: "es"

# Tamaño máximo de archivos (5MB)
media_library:
  max_file_size: 5242880

# Logo en el panel de admin
logo_url: "/images/logo.png"

# Slug configuration
slug:
  encoding: "ascii"
  clean_accents: true
  sanitize_replacement: "-"

# ============================================================
# COLECCIONES
# ============================================================

collections:

  # ----------------------------------------------------------
  # NOTICIAS
  # ----------------------------------------------------------
  - name: "news"
    label: "Noticias"
    label_singular: "Noticia"
    folder: "src/content/news"
    create: true
    slug: "{{year}}-{{month}}-{{slug}}"
    sortable_fields: ["date", "title"]
    view_groups:
      - label: "Categoría"
        field: category
      - label: "Año"
        field: date
        pattern: '\d{4}'
    summary: "{{date | date('YYYY-MM-DD')}} — {{title}}"
    fields:
      - { label: "Título", name: "title", widget: "string", required: true }
      - { label: "Fecha", name: "date", widget: "datetime", required: true, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - { label: "Fecha de actualización", name: "updatedDate", widget: "datetime", required: false, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - { label: "Autor", name: "author", widget: "string", default: "Club Trocha y Ruta" }
      - label: "Categoría"
        name: "category"
        widget: "select"
        options:
          - { label: "Competencias", value: "competencias" }
          - { label: "Club", value: "club" }
          - { label: "Entrenamiento", value: "entrenamiento" }
          - { label: "Comunidad", value: "comunidad" }
      - { label: "Tags", name: "tags", widget: "list", required: false, allow_add: true }
      - { label: "Imagen principal", name: "image", widget: "image", required: true, media_folder: "/src/assets/news" }
      - { label: "Texto alternativo imagen", name: "imageAlt", widget: "string", required: false }
      - { label: "Extracto", name: "excerpt", widget: "text", required: true, hint: "Máximo 200 caracteres" }
      - { label: "Destacada", name: "featured", widget: "boolean", default: false }
      - { label: "Borrador", name: "draft", widget: "boolean", default: true }
      - { label: "Evento relacionado (slug)", name: "relatedEvent", widget: "string", required: false }
      - { label: "Galería relacionada (slug)", name: "relatedGallery", widget: "string", required: false }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        required: false
        fields:
          - { label: "Meta título", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta descripción", name: "metaDescription", widget: "text", required: false, hint: "Máximo 160 caracteres" }
          - { label: "Imagen OG", name: "ogImage", widget: "image", required: false }
      - { label: "Contenido", name: "body", widget: "markdown" }

  # ----------------------------------------------------------
  # EVENTOS
  # ----------------------------------------------------------
  - name: "events"
    label: "Eventos"
    label_singular: "Evento"
    folder: "src/content/events"
    create: true
    slug: "{{year}}-{{month}}-{{slug}}"
    sortable_fields: ["date", "title"]
    view_groups:
      - label: "Categoría"
        field: category
      - label: "Estado"
        field: status
    summary: "{{date | date('YYYY-MM-DD')}} — {{title}} [{{status}}]"
    fields:
      - { label: "Título", name: "title", widget: "string", required: true }
      - { label: "Fecha inicio", name: "date", widget: "datetime", required: true, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - { label: "Fecha fin", name: "endDate", widget: "datetime", required: false, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - { label: "Ubicación", name: "location", widget: "string", required: true }
      - { label: "Ciudad", name: "city", widget: "string", required: false }
      - { label: "Departamento", name: "department", widget: "string", default: "Valle del Cauca" }
      - { label: "URL del mapa", name: "mapUrl", widget: "string", required: false }
      - label: "Categoría"
        name: "category"
        widget: "select"
        options:
          - { label: "XCO (Cross-Country Olímpico)", value: "xco" }
          - { label: "XCM (Cross-Country Maratón)", value: "xcm" }
          - { label: "Ruta", value: "ruta" }
          - { label: "Enduro", value: "enduro" }
          - { label: "Recreativo", value: "recreativo" }
          - { label: "Social", value: "social" }
          - { label: "Entrenamiento", value: "entrenamiento" }
      - label: "Nivel"
        name: "level"
        widget: "select"
        default: "departamental"
        options:
          - { label: "Interno", value: "interno" }
          - { label: "Municipal", value: "municipal" }
          - { label: "Departamental", value: "departamental" }
          - { label: "Regional", value: "regional" }
          - { label: "Nacional", value: "nacional" }
          - { label: "Internacional", value: "internacional" }
      - { label: "Organizador", name: "organizer", widget: "string", required: false }
      - { label: "Imagen", name: "image", widget: "image", required: false, media_folder: "/src/assets/events" }
      - { label: "Texto alternativo imagen", name: "imageAlt", widget: "string", required: false }
      - label: "Estado"
        name: "status"
        widget: "select"
        default: "upcoming"
        options:
          - { label: "Próximo", value: "upcoming" }
          - { label: "En curso", value: "ongoing" }
          - { label: "Pasado", value: "past" }
          - { label: "Cancelado", value: "cancelled" }
      - { label: "URL de inscripción", name: "registrationUrl", widget: "string", required: false }
      - { label: "Fecha límite inscripción", name: "registrationDeadline", widget: "datetime", required: false, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - { label: "Galería relacionada (slug)", name: "relatedGallery", widget: "string", required: false }
      - { label: "URL de resultados", name: "resultsUrl", widget: "string", required: false }
      - { label: "Destacado", name: "featured", widget: "boolean", default: false }
      - { label: "Borrador", name: "draft", widget: "boolean", default: true }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        required: false
        fields:
          - { label: "Meta título", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta descripción", name: "metaDescription", widget: "text", required: false }
          - { label: "Imagen OG", name: "ogImage", widget: "image", required: false }
      - { label: "Descripción", name: "body", widget: "markdown" }

  # ----------------------------------------------------------
  # CORREDORES
  # ----------------------------------------------------------
  - name: "riders"
    label: "Corredores"
    label_singular: "Corredor"
    folder: "src/content/riders"
    create: true
    slug: "{{slug}}"
    sortable_fields: ["name", "category"]
    view_groups:
      - label: "Categoría"
        field: category
      - label: "Nivel"
        field: level
    summary: "{{name}} — {{category}}"
    fields:
      - { label: "Nombre completo", name: "name", widget: "string", required: true }
      - { label: "Foto", name: "photo", widget: "image", required: true, media_folder: "/src/assets/riders" }
      - { label: "Fecha de nacimiento", name: "birthDate", widget: "datetime", required: true, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - label: "Categoría"
        name: "category"
        widget: "select"
        options:
          - { label: "Pre-infantil (4-7)", value: "pre-infantil" }
          - { label: "Infantil (8-11)", value: "infantil" }
          - { label: "Juvenil (12-15)", value: "juvenil" }
          - { label: "Sub-23 (16-22)", value: "sub23" }
          - { label: "Elite (23+)", value: "elite" }
          - { label: "Master (30+)", value: "master" }
      - { label: "Grupo de edad", name: "ageGroup", widget: "string", required: false, hint: "Ej: Pre-infantil A (4-5)" }
      - label: "Nivel"
        name: "level"
        widget: "select"
        default: "formación"
        options:
          - { label: "Iniciación", value: "iniciación" }
          - { label: "Formación", value: "formación" }
          - { label: "Competición", value: "competición" }
          - { label: "Alto rendimiento", value: "alto-rendimiento" }
      - label: "Especialidad"
        name: "specialty"
        widget: "select"
        required: false
        options:
          - { label: "XCO", value: "xco" }
          - { label: "XCM", value: "xcm" }
          - { label: "Enduro", value: "enduro" }
          - { label: "Ruta", value: "ruta" }
          - { label: "Múltiple", value: "múltiple" }
      - { label: "Número de dorsal", name: "dorsalNumber", widget: "number", required: false }
      - { label: "Año de ingreso", name: "yearJoined", widget: "number", required: false }
      - label: "Logros"
        name: "achievements"
        widget: "list"
        required: false
        collapsed: true
        fields:
          - { label: "Año", name: "year", widget: "number" }
          - { label: "Evento", name: "event", widget: "string" }
          - { label: "Posición", name: "position", widget: "number", required: false }
          - { label: "Descripción", name: "description", widget: "string" }
      - label: "Redes sociales"
        name: "socialMedia"
        widget: "object"
        collapsed: true
        required: false
        fields:
          - { label: "Instagram", name: "instagram", widget: "string", required: false }
          - { label: "Facebook", name: "facebook", widget: "string", required: false }
          - { label: "Strava", name: "strava", widget: "string", required: false }
      - { label: "Programa (slug)", name: "program", widget: "string", required: false }
      - { label: "Activo", name: "active", widget: "boolean", default: true }
      - { label: "Destacado", name: "featured", widget: "boolean", default: false }
      - { label: "Orden", name: "order", widget: "number", default: 0 }
      - { label: "Borrador", name: "draft", widget: "boolean", default: false }
      - { label: "Biografía", name: "body", widget: "markdown", required: false }

  # ----------------------------------------------------------
  # DIRECTIVOS
  # ----------------------------------------------------------
  - name: "directivos"
    label: "Directivos y Staff"
    label_singular: "Directivo"
    folder: "src/content/directivos"
    create: true
    slug: "{{slug}}"
    sortable_fields: ["name", "role"]
    summary: "{{name}} — {{roleLabel}}"
    fields:
      - { label: "Nombre completo", name: "name", widget: "string", required: true }
      - { label: "Foto", name: "photo", widget: "image", required: false, media_folder: "/src/assets/directivos" }
      - label: "Rol"
        name: "role"
        widget: "select"
        options:
          - { label: "Presidente", value: "presidente" }
          - { label: "Vicepresidente", value: "vicepresidente" }
          - { label: "Secretario(a)", value: "secretario" }
          - { label: "Tesorero(a)", value: "tesorero" }
          - { label: "Fiscal", value: "fiscal" }
          - { label: "Vocal", value: "vocal" }
          - { label: "Entrenador principal", value: "entrenador-principal" }
          - { label: "Entrenador", value: "entrenador" }
          - { label: "Preparador físico", value: "preparador-fisico" }
          - { label: "Mecánico", value: "mecanico" }
          - { label: "Médico", value: "medico" }
          - { label: "Coordinador(a)", value: "coordinador" }
      - { label: "Título del cargo", name: "roleLabel", widget: "string", required: true, hint: "Ej: Director Técnico, Entrenador Infantil" }
      - { label: "Email", name: "email", widget: "string", required: false }
      - { label: "Teléfono", name: "phone", widget: "string", required: false }
      - label: "Redes sociales"
        name: "socialMedia"
        widget: "object"
        collapsed: true
        required: false
        fields:
          - { label: "Instagram", name: "instagram", widget: "string", required: false }
          - { label: "Facebook", name: "facebook", widget: "string", required: false }
      - { label: "Certificaciones", name: "certifications", widget: "list", required: false }
      - { label: "Año de ingreso", name: "yearJoined", widget: "number", required: false }
      - { label: "Activo", name: "active", widget: "boolean", default: true }
      - { label: "Orden", name: "order", widget: "number", default: 0 }
      - { label: "Biografía", name: "body", widget: "markdown", required: false }

  # ----------------------------------------------------------
  # PROGRAMAS
  # ----------------------------------------------------------
  - name: "programs"
    label: "Programas"
    label_singular: "Programa"
    folder: "src/content/programs"
    create: true
    slug: "{{slug}}"
    sortable_fields: ["title", "order"]
    summary: "{{title}} ({{ageRange}})"
    fields:
      - { label: "Título", name: "title", widget: "string", required: true }
      - { label: "Subtítulo", name: "subtitle", widget: "string", required: false }
      - { label: "Icono (Phosphor)", name: "icon", widget: "string", required: true, hint: "Nombre del icono de Phosphor Icons" }
      - { label: "Imagen", name: "image", widget: "image", required: false, media_folder: "/src/assets/programs" }
      - { label: "Rango de edad (texto)", name: "ageRange", widget: "string", required: true, hint: "Ej: 4 a 8 años" }
      - { label: "Edad mínima", name: "ageMin", widget: "number", required: true }
      - { label: "Edad máxima", name: "ageMax", widget: "number", required: true }
      - label: "Nivel objetivo"
        name: "targetLevel"
        widget: "select"
        options:
          - { label: "Iniciación", value: "iniciación" }
          - { label: "Formación", value: "formación" }
          - { label: "Competición", value: "competición" }
          - { label: "Recreativo", value: "recreativo" }
      - { label: "Horario", name: "schedule", widget: "string", required: true }
      - { label: "Duración por sesión", name: "duration", widget: "string", required: false }
      - { label: "Ubicación", name: "location", widget: "string", required: false }
      - { label: "Cupo máximo", name: "maxStudents", widget: "number", required: false }
      - { label: "Requisitos", name: "requirements", widget: "list", required: true }
      - { label: "Equipo necesario", name: "equipmentNeeded", widget: "list", required: false }
      - { label: "Objetivos", name: "objectives", widget: "list", required: false }
      - { label: "Inscripciones abiertas", name: "enrollmentOpen", widget: "boolean", default: true }
      - { label: "Costo mensual", name: "monthlyFee", widget: "string", required: false }
      - { label: "Activo", name: "active", widget: "boolean", default: true }
      - { label: "Orden", name: "order", widget: "number", required: true }
      - { label: "Borrador", name: "draft", widget: "boolean", default: false }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        required: false
        fields:
          - { label: "Meta título", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta descripción", name: "metaDescription", widget: "text", required: false }
          - { label: "Imagen OG", name: "ogImage", widget: "image", required: false }
      - { label: "Descripción completa", name: "body", widget: "markdown" }

  # ----------------------------------------------------------
  # PATROCINADORES
  # ----------------------------------------------------------
  - name: "sponsors"
    label: "Patrocinadores"
    label_singular: "Patrocinador"
    folder: "src/content/sponsors"
    create: true
    slug: "{{slug}}"
    sortable_fields: ["name", "level"]
    view_groups:
      - label: "Nivel"
        field: level
    summary: "{{name}} [{{level}}]"
    fields:
      - { label: "Nombre", name: "name", widget: "string", required: true }
      - { label: "Logo", name: "logo", widget: "image", required: true, media_folder: "/src/assets/sponsors" }
      - { label: "Logo claro (para fondo oscuro)", name: "logoLight", widget: "image", required: false, media_folder: "/src/assets/sponsors" }
      - label: "Nivel"
        name: "level"
        widget: "select"
        options:
          - { label: "Principal", value: "principal" }
          - { label: "Oficial", value: "oficial" }
          - { label: "Aliado", value: "aliado" }
          - { label: "Proveedor", value: "proveedor" }
      - { label: "Sitio web", name: "url", widget: "string", required: false }
      - { label: "Fecha inicio alianza", name: "startDate", widget: "datetime", required: false, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - { label: "Fecha fin alianza", name: "endDate", widget: "datetime", required: false, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - { label: "Activo", name: "active", widget: "boolean", default: true }
      - { label: "Orden", name: "order", widget: "number", default: 0 }
      - { label: "Borrador", name: "draft", widget: "boolean", default: false }
      - { label: "Descripción de la alianza", name: "body", widget: "markdown", required: false }

  # ----------------------------------------------------------
  # GALERÍA
  # ----------------------------------------------------------
  - name: "gallery"
    label: "Galería"
    label_singular: "Álbum"
    folder: "src/content/gallery"
    create: true
    slug: "{{slug}}"
    sortable_fields: ["date", "title"]
    view_groups:
      - label: "Categoría"
        field: category
    summary: "{{date | date('YYYY-MM-DD')}} — {{title}}"
    fields:
      - { label: "Título", name: "title", widget: "string", required: true }
      - { label: "Fecha", name: "date", widget: "datetime", required: true, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - { label: "Portada", name: "cover", widget: "image", required: true, media_folder: "/src/assets/gallery" }
      - { label: "Texto alt portada", name: "coverAlt", widget: "string", required: false }
      - { label: "Descripción", name: "description", widget: "text", required: false }
      - label: "Imágenes"
        name: "images"
        widget: "list"
        required: true
        min: 1
        fields:
          - { label: "Imagen", name: "src", widget: "image", media_folder: "/src/assets/gallery" }
          - { label: "Texto alternativo", name: "alt", widget: "string" }
          - { label: "Pie de foto", name: "caption", widget: "string", required: false }
          - { label: "Fotógrafo", name: "photographer", widget: "string", required: false }
      - label: "Videos"
        name: "videos"
        widget: "list"
        required: false
        fields:
          - { label: "URL del video", name: "url", widget: "string" }
          - { label: "Título", name: "title", widget: "string" }
          - { label: "Miniatura", name: "thumbnail", widget: "image", required: false }
      - { label: "Evento relacionado (slug)", name: "relatedEvent", widget: "string", required: false }
      - label: "Categoría"
        name: "category"
        widget: "select"
        default: "competencia"
        options:
          - { label: "Competencia", value: "competencia" }
          - { label: "Entrenamiento", value: "entrenamiento" }
          - { label: "Social", value: "social" }
          - { label: "Institucional", value: "institucional" }
      - { label: "Tags", name: "tags", widget: "list", required: false }
      - { label: "Destacado", name: "featured", widget: "boolean", default: false }
      - { label: "Borrador", name: "draft", widget: "boolean", default: false }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        required: false
        fields:
          - { label: "Meta título", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta descripción", name: "metaDescription", widget: "text", required: false }
          - { label: "Imagen OG", name: "ogImage", widget: "image", required: false }
      - { label: "Notas adicionales", name: "body", widget: "markdown", required: false }

  # ----------------------------------------------------------
  # RESULTADOS (archivo de datos)
  # ----------------------------------------------------------
  - name: "results"
    label: "Resultados"
    label_singular: "Resultado"
    folder: "src/content/results"
    create: true
    slug: "{{slug}}"
    extension: "yaml"
    format: "yaml"
    sortable_fields: ["date", "eventName"]
    summary: "{{date}} — {{eventName}}"
    fields:
      - { label: "Evento (slug)", name: "event", widget: "string", required: true }
      - { label: "Nombre del evento", name: "eventName", widget: "string", required: true }
      - { label: "Fecha", name: "date", widget: "datetime", required: true, format: "YYYY-MM-DD", date_format: "DD/MM/YYYY", time_format: false }
      - { label: "Categoría de carrera", name: "category", widget: "string", required: true }
      - label: "Posiciones"
        name: "positions"
        widget: "list"
        required: true
        fields:
          - { label: "Posición", name: "position", widget: "number" }
          - { label: "Corredor (slug)", name: "rider", widget: "string", required: false }
          - { label: "Nombre del corredor", name: "riderName", widget: "string" }
          - { label: "Tiempo", name: "time", widget: "string", required: false }
          - { label: "Puntos", name: "points", widget: "number", required: false }
      - { label: "Destacados del club", name: "clubHighlights", widget: "text", required: false }
      - { label: "Total participantes", name: "totalParticipants", widget: "number", required: false }

  # ----------------------------------------------------------
  # RUTAS
  # ----------------------------------------------------------
  - name: "rutas"
    label: "Rutas"
    label_singular: "Ruta"
    folder: "src/content/rutas"
    create: true
    slug: "{{slug}}"
    sortable_fields: ["name", "difficulty"]
    view_groups:
      - label: "Dificultad"
        field: difficulty
    summary: "{{name}} — {{difficulty}} ({{distance}}km)"
    fields:
      - { label: "Nombre", name: "name", widget: "string", required: true }
      - { label: "Descripción corta", name: "description", widget: "text", required: true }
      - { label: "Imagen", name: "image", widget: "image", required: false, media_folder: "/src/assets/rutas" }
      - { label: "Distancia (km)", name: "distance", widget: "number", required: true, value_type: "float" }
      - { label: "Desnivel positivo (m)", name: "elevationGain", widget: "number", required: true }
      - label: "Dificultad"
        name: "difficulty"
        widget: "select"
        options:
          - { label: "Fácil", value: "facil" }
          - { label: "Moderada", value: "moderada" }
          - { label: "Difícil", value: "dificil" }
          - { label: "Experto", value: "experto" }
      - label: "Superficie"
        name: "surface"
        widget: "select"
        options:
          - { label: "Tierra", value: "tierra" }
          - { label: "Mixto", value: "mixto" }
          - { label: "Asfalto", value: "asfalto" }
          - { label: "Técnico", value: "técnico" }
      - { label: "Tiempo estimado", name: "estimatedTime", widget: "string", required: true }
      - { label: "Punto de inicio", name: "startPoint", widget: "string", required: true }
      - { label: "Punto final", name: "endPoint", widget: "string", required: false }
      - { label: "Ciudad", name: "city", widget: "string", default: "Yumbo" }
      - { label: "Archivo GPX", name: "gpxFile", widget: "file", required: false }
      - { label: "Ruta en Strava", name: "stravaRoute", widget: "string", required: false }
      - { label: "URL del mapa", name: "mapUrl", widget: "string", required: false }
      - label: "Apto para"
        name: "suitableFor"
        widget: "select"
        multiple: true
        options:
          - { label: "Pre-infantil", value: "pre-infantil" }
          - { label: "Infantil", value: "infantil" }
          - { label: "Juvenil", value: "juvenil" }
          - { label: "Elite", value: "elite" }
          - { label: "Recreativo", value: "recreativo" }
      - { label: "Programas (slugs)", name: "usedInPrograms", widget: "list", required: false }
      - { label: "Activo", name: "active", widget: "boolean", default: true }
      - { label: "Orden", name: "order", widget: "number", default: 0 }
      - { label: "Borrador", name: "draft", widget: "boolean", default: false }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        required: false
        fields:
          - { label: "Meta título", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta descripción", name: "metaDescription", widget: "text", required: false }
          - { label: "Imagen OG", name: "ogImage", widget: "image", required: false }
      - { label: "Descripción completa", name: "body", widget: "markdown" }

  # ----------------------------------------------------------
  # PÁGINAS ESTÁTICAS
  # ----------------------------------------------------------
  - name: "pages"
    label: "Páginas"
    label_singular: "Página"
    folder: "src/content/pages"
    create: true
    slug: "{{slug}}"
    fields:
      - { label: "Título", name: "title", widget: "string", required: true }
      - { label: "Descripción", name: "description", widget: "text", required: false }
      - { label: "Imagen", name: "image", widget: "image", required: false }
      - label: "Layout"
        name: "layout"
        widget: "select"
        default: "page"
        options:
          - { label: "Página estándar", value: "page" }
          - { label: "Ancho completo", value: "fullwidth" }
          - { label: "Landing page", value: "landing" }
      - { label: "Mostrar en navegación", name: "showInNav", widget: "boolean", default: false }
      - { label: "Orden", name: "order", widget: "number", default: 0 }
      - { label: "Borrador", name: "draft", widget: "boolean", default: false }
      - label: "SEO"
        name: "seo"
        widget: "object"
        collapsed: true
        required: false
        fields:
          - { label: "Meta título", name: "metaTitle", widget: "string", required: false }
          - { label: "Meta descripción", name: "metaDescription", widget: "text", required: false }
          - { label: "Imagen OG", name: "ogImage", widget: "image", required: false }
      - { label: "Contenido", name: "body", widget: "markdown" }

  # ----------------------------------------------------------
  # CONFIGURACIÓN DEL SITIO (singleton)
  # ----------------------------------------------------------
  - name: "settings"
    label: "Configuración"
    files:
      - name: "site"
        label: "Datos del Sitio"
        file: "src/content/settings/site.yaml"
        fields:
          - { label: "Nombre del club", name: "clubName", widget: "string" }
          - { label: "Lema", name: "tagline", widget: "string" }
          - { label: "Descripción", name: "description", widget: "text" }
          - { label: "Email", name: "email", widget: "string" }
          - { label: "Teléfono", name: "phone", widget: "string" }
          - { label: "Dirección", name: "address", widget: "string" }
          - { label: "Ciudad", name: "city", widget: "string" }
          - { label: "Departamento", name: "department", widget: "string" }
          - label: "Redes sociales"
            name: "social"
            widget: "object"
            fields:
              - { label: "Facebook", name: "facebook", widget: "string", required: false }
              - { label: "Instagram", name: "instagram", widget: "string", required: false }
              - { label: "YouTube", name: "youtube", widget: "string", required: false }
              - { label: "TikTok", name: "tiktok", widget: "string", required: false }
          - label: "Horarios"
            name: "schedule"
            widget: "list"
            fields:
              - { label: "Día(s)", name: "days", widget: "string" }
              - { label: "Horario", name: "hours", widget: "string" }
          - { label: "Año de fundación", name: "foundedYear", widget: "number" }
          - { label: "NIT", name: "nit", widget: "string", required: false }
          - { label: "Google Maps embed URL", name: "mapEmbedUrl", widget: "string", required: false }
```

---

## Resumen de Decisiones

### Colecciones nuevas respecto al PROMPT original:
1. **`directivos`** — El sitio actual no tiene equipo directivo visible. Es fundamental para credibilidad institucional.
2. **`results`** — Colección de datos (YAML) para registrar resultados de competencias con relación a eventos y corredores.
3. **`rutas`** — Rutas de entrenamiento con datos técnicos (distancia, desnivel, GPX). Diferenciador para el club.
4. **`pages`** — Páginas estáticas editables desde el CMS (quiénes somos, transparencia).
5. **`settings`** (singleton) — Datos globales del sitio editables desde el CMS.

### Mejoras principales al content model:
- **Categorías de edad granulares**: De 4 categorías a 6 (pre-infantil, infantil, juvenil, sub23, elite, master) alineadas con la Federación Colombiana de Ciclismo.
- **Schema SEO reutilizable**: Campo `seo` opcional en todas las colecciones con `metaTitle`, `metaDescription` y `ogImage`.
- **Campo `draft`**: Workflow editorial en todas las colecciones de contenido.
- **Relaciones explícitas**: `relatedEvent`, `relatedGallery`, `relatedNews`, `relatedRider`, `relatedProgram`.
- **Logros estructurados**: En riders, pasó de `string[]` a objetos con `year`, `event`, `position`, `description`.
- **Soporte multimedia**: Galería ahora soporta videos (YouTube) además de imágenes, con caption y fotógrafo.
- **Tags cross-collection**: Noticias, eventos y galería comparten sistema de tags.
