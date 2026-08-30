/**
 * Schemas Zod extraídos de content.config.ts para testing independiente.
 * Estos schemas definen la estructura de datos de las Content Collections.
 * content.config.ts importa desde aquí para evitar duplicación.
 */
import { z } from 'astro/zod';

// ============================================================
// SCHEMAS REUTILIZABLES
// ============================================================

export const seoSchema = z
  .object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().max(160).optional(),
    ogImage: z.string().optional(),
  })
  .optional();

export const socialMediaSchema = z
  .object({
    instagram: z.url().optional(),
    facebook: z.url().optional(),
    strava: z.url().optional(),
    youtube: z.url().optional(),
    tiktok: z.url().optional(),
  })
  .optional();

// ============================================================
// SCHEMAS DE COLECCIONES
// ============================================================

export const ridersSchema = z.object({
  name: z.string(),
  photo: z.string(),
  birthDate: z.coerce.date(),
  category: z.enum(['pre-infantil', 'infantil', 'juvenil', 'sub23', 'elite', 'master']),
  ageGroup: z.string().optional(),
  level: z
    .enum(['iniciación', 'formación', 'competición', 'alto-rendimiento'])
    .default('formación'),
  specialty: z.enum(['xco', 'xcm', 'enduro', 'ruta', 'múltiple']).optional(),
  dorsalNumber: z.number().optional(),
  yearJoined: z.number().optional(),
  achievements: z
    .array(
      z.object({
        year: z.number(),
        event: z.string(),
        position: z.number().optional(),
        description: z.string(),
      }),
    )
    .default([]),
  socialMedia: socialMediaSchema,
  program: z.string().optional(),
  active: z.boolean().default(true),
  featured: z.boolean().default(false),
  order: z.number().default(0),
  draft: z.boolean().default(false),
  seo: seoSchema,
});

export const directivosSchema = z.object({
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
  roleLabel: z.string(),
  bio: z.string().optional(),
  email: z.email().optional(),
  phone: z.string().optional(),
  socialMedia: socialMediaSchema,
  certifications: z.array(z.string()).default([]),
  yearJoined: z.number().optional(),
  active: z.boolean().default(true),
  order: z.number().default(0),
  /**
   * Mismo interruptor que el resto de colecciones: una ficha a medio cargar
   * —o sin autorización de imagen firmada— se guarda sin publicarse. Aditivo:
   * las fichas que no lo declaren siguen siendo publicables.
   */
  draft: z.boolean().default(false),
});

export const newsSchema = z.object({
  title: z.string(),
  /**
   * Acepta fecha sola (`2026-08-02`) u hora completa con offset colombiano
   * (`2026-08-02T18:30:00-05:00`). Google News ordena por frescura usando la
   * marca de tiempo, así que la hora real vale para una crónica publicada el
   * mismo día de la válida; sin ella se asume medianoche de Bogotá.
   * La conversión a ISO con offset vive en `toColombiaIso` (`src/lib/seo.ts`).
   */
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
  relatedEvent: z.string().optional(),
  relatedGallery: z.string().optional(),
  galleryFolder: z.string().optional(),
  galleryImages: z.array(z.string()).default([]),
  imageLayout: z.enum(['cover', 'contain']).optional().default('cover'),
  lineup: z
    .array(
      z.object({
        name: z.string(),
        category: z.string(),
        slug: z.string(),
        image: z.string(),
      }),
    )
    .optional(),
  seo: seoSchema,
});

export const eventsSchema = z.object({
  title: z.string(),
  /**
   * URL propia del evento, sin el prefijo de fecha del nombre de archivo:
   * `copa-valle-yumbo-2026` en vez de `2026-10-copa-valle-vii-yumbo`. Opcional
   * — sin él la ruta cae al `id` de la entrada (ver `eventPath()` en
   * `@lib/calendar`, que es quien resuelve la regla una sola vez).
   *
   * **No se puede llamar `slug`.** El glob loader de Astro trata esa clave del
   * frontmatter como reservada (`generateIdDefault`: `if (data.slug) return
   * data.slug`) y la usa como `id` de la entrada, antes de que Zod vea nada.
   * Con el campo llamado `slug`, publicar una URL propia renombraba la entrada
   * y dejaba `relatedEvent`/`relatedNews` apuntando a un id inexistente; dos
   * entradas con el mismo valor colapsaban en una y la otra desaparecía del
   * sitio con el build en verde.
   */
  urlSlug: z
    .string()
    .regex(
      /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      'urlSlug en minúsculas y sin acentos, palabras separadas por guiones'
    )
    .optional(),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  /** Fecha de la última revisión del contenido contra la fuente oficial. */
  updatedAt: z.coerce.date().optional(),
  location: z.string(),
  /**
   * Sede como identificador estable, para cruzar el evento con la página del
   * lugar sin comparar substrings de `location`.
   */
  venueSlug: z.string().optional(),
  city: z.string().optional(),
  department: z.string().default('Valle del Cauca'),
  mapUrl: z.url().optional(),
  category: z.enum(['xco', 'xcm', 'ruta', 'enduro', 'recreativo', 'social', 'entrenamiento']),
  level: z
    .enum(['municipal', 'departamental', 'regional', 'nacional', 'internacional', 'interno'])
    .default('departamental'),
  organizer: z.string().optional(),
  image: z.string().optional(),
  imageAlt: z.string().optional(),
  status: z.enum(['upcoming', 'ongoing', 'past', 'cancelled']).default('upcoming'),
  registrationUrl: z.url().optional(),
  registrationDeadline: z.coerce.date().optional(),
  /**
   * Ficha técnica del circuito. Solo lo que el club puede verificar: la
   * distancia sale de la convocatoria oficial. El desnivel se omite a
   * propósito — la altimetría barométrica de un GPS de celular se desvía
   * demasiado en 3,8 km como para publicarla sin validación.
   */
  circuit: z
    .object({
      distanceKm: z.number().positive(),
      laps: z.number().int().positive().optional(),
      surface: z.string().optional(),
    })
    .optional(),
  /** Valores de inscripción, en pesos colombianos. Los cobra el organizador. */
  fees: z
    .array(
      z.object({
        label: z.string(),
        amount: z.number().int().nonnegative(),
      }),
    )
    .default([]),
  /** Cupos por categoría, según la convocatoria. */
  capacity: z.number().int().positive().optional(),
  /**
   * Categorías de la convocatoria. Los rangos de edad, las vueltas y las horas
   * los define la Comisión: publicarlos mal manda a un niño a la categoría
   * equivocada o lo hace llegar tarde a su largada, así que el bloque no se
   * pinta mientras el arreglo esté vacío.
   */
  categories: z
    .array(
      z.object({
        name: z.string(),
        /** Manga o grupo de competencia con el que larga. */
        group: z.string().optional(),
        /** Hora de largada, `HH:MM` en 24 horas — como `clubTimeOfDay()`. */
        startTime: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'hora en formato HH:MM de 24 horas')
          .optional(),
        ageMin: z.number().int().nonnegative().optional(),
        ageMax: z.number().int().nonnegative().optional(),
        laps: z.number().int().positive().optional(),
        /**
         * Recorrido, cuando NO es la vuelta completa al circuito: «70% de la
         * pista», «recorrido especial», «pista alterna».
         *
         * Su presencia es la señal de que **no se puede calcular la distancia**
         * multiplicando vueltas por `circuit.distanceKm`. Las categorías
         * infantiles corren un trazado más corto, y publicar 2 × 3,8 km para
         * quien va a rodar el 70% sería una cifra inventada. Sin `course`, la
         * categoría da la vuelta completa y la multiplicación es válida.
         */
        course: z.string().optional(),
      }),
    )
    .default([]),
  /**
   * El cronograma del día: registro, congresillo, premiaciones. Lo que no es
   * una largada de categoría pero marca a qué hora hay que estar en la pista.
   */
  schedule: z
    .array(
      z.object({
        time: z
          .string()
          .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'hora en formato HH:MM de 24 horas'),
        title: z.string(),
        place: z.string().optional(),
      }),
    )
    .default([]),
  relatedGallery: z.string().optional(),
  relatedNews: z.array(z.string()).default([]),
  resultsUrl: z.url().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  seo: seoSchema,
});

export const resultsSchema = z.object({
  event: z.string(),
  eventName: z.string(),
  date: z.coerce.date(),
  category: z.string(),
  positions: z.array(
    z.object({
      position: z.number(),
      rider: z.string().optional(),
      riderName: z.string(),
      time: z.string().optional(),
      points: z.number().optional(),
    }),
  ),
  clubHighlights: z.string().optional(),
  totalParticipants: z.number().optional(),
});

/** Hora del día en 24 horas, `HH:MM`. Ordena y compara como texto. */
const TIME_OF_DAY = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Una sesión de entrenamiento, en datos.
 *
 * El campo `schedule` sigue siendo el horario que lee una familia ("Mar/Jue 4-6
 * PM (salida) · Sáb 7-9 AM"): admite aclaraciones y excepciones que ningún
 * schema captura. `sessions` es su versión maquinable, y existe para lo que el
 * texto libre no puede resolver bien: saber qué sesión viene ahora.
 *
 * El día va en inglés porque es un identificador, no un texto visible: los
 * nombres en español viven en `WEEK_DAY_LABELS` (`src/lib/programs.ts`), del
 * lado de la interfaz.
 */
export const programSessionSchema = z
  .object({
    day: z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']),
    start: z.string().regex(TIME_OF_DAY, 'Hora en formato HH:MM de 24 horas'),
    end: z.string().regex(TIME_OF_DAY, 'Hora en formato HH:MM de 24 horas'),
    /** Dónde se encuentra el grupo, cuando la sesión no es en el sitio de siempre. */
    place: z.string().optional(),
  })
  .refine((session) => session.end > session.start, {
    message: 'La sesión tiene que terminar después de empezar',
    path: ['end'],
  });

export const programsSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  /**
   * Promesa del programa en una o dos frases: es el texto que se lee en las
   * tarjetas de inicio y en la página de programas. Sin él, la interfaz cae al
   * `subtitle`, que es más corto y no alcanza a explicar la etapa.
   */
  summary: z.string().optional(),
  icon: z.string(),
  image: z.string().optional(),
  ageRange: z.string(),
  ageMin: z.number(),
  ageMax: z.number(),
  targetLevel: z.enum(['iniciación', 'formación', 'competición', 'recreativo']),
  schedule: z.string(),
  /**
   * Opcional a propósito: un programa sin sesiones capturadas se sigue
   * publicando con su `schedule` de texto, y la interfaz simplemente no puede
   * anunciar la próxima sesión.
   */
  sessions: z.array(programSessionSchema).optional(),
  duration: z.string().optional(),
  location: z.string().optional(),
  maxStudents: z.number().optional(),
  requirements: z.array(z.string()),
  equipmentNeeded: z.array(z.string()).default([]),
  objectives: z.array(z.string()).default([]),
  methodology: z.string().optional(),
  enrollmentOpen: z.boolean().default(true),
  monthlyFee: z.string().optional(),
  active: z.boolean().default(true),
  order: z.number(),
  draft: z.boolean().default(false),
  seo: seoSchema,
});

export const sponsorsSchema = z.object({
  name: z.string(),
  logo: z.string(),
  logoLight: z.string().optional(),
  level: z.enum(['principal', 'oficial', 'aliado', 'proveedor']),
  url: z.url().optional(),
  description: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  active: z.boolean().default(true),
  order: z.number().default(0),
  draft: z.boolean().default(false),
});

export const gallerySchema = z.object({
  title: z.string(),
  date: z.coerce.date(),
  cover: z.string(),
  coverAlt: z.string().optional(),
  description: z.string().optional(),
  images: z.array(
    z.object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
      photographer: z.string().optional(),
    }),
  ),
  videos: z
    .array(
      z.object({
        url: z.url(),
        title: z.string(),
        thumbnail: z.string().optional(),
      }),
    )
    .default([]),
  relatedEvent: z.string().optional(),
  category: z
    .enum(['competencia', 'entrenamiento', 'social', 'institucional'])
    .default('competencia'),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  seo: seoSchema,
});

export const rutasSchema = z.object({
  name: z.string(),
  description: z.string(),
  image: z.string().optional(),
  distance: z.number(),
  elevationGain: z.number(),
  difficulty: z.enum(['facil', 'moderada', 'dificil', 'experto']),
  surface: z.enum(['tierra', 'mixto', 'asfalto', 'técnico']),
  estimatedTime: z.string(),
  startPoint: z.string(),
  endPoint: z.string().optional(),
  city: z.string().default('Yumbo'),
  gpxFile: z.string().optional(),
  stravaRoute: z.url().optional(),
  mapUrl: z.url().optional(),
  suitableFor: z.array(z.enum(['pre-infantil', 'infantil', 'juvenil', 'elite', 'recreativo'])),
  usedInPrograms: z.array(z.string()).default([]),
  active: z.boolean().default(true),
  order: z.number().default(0),
  draft: z.boolean().default(false),
  seo: seoSchema,
});

export const faqsSchema = z.object({
  question: z.string(),
  answer: z.string(),
  category: z
    .enum([
      'general',
      'inscripciones',
      'entrenamiento',
      'competencias',
      'equipamiento',
      'seguridad',
    ])
    .default('general'),
  order: z.number().default(0),
  draft: z.boolean().default(false),
});

/**
 * Copy del selector de edad de `/programas`.
 *
 * Las edades y los tramos se derivan de la colección `programs` (`ageMin`/
 * `ageMax`); lo único que no se puede derivar es cómo se le pregunta la edad a
 * una familia. Ese texto vive aquí para que el club lo edite desde Sveltia sin
 * tocar la plantilla. Si el bloque falta, la página no pinta el selector: no
 * se inventa una pregunta por defecto.
 */
export const agePickerSchema = z
  .object({
    /** Pregunta del `<legend>`: "¿Qué edad tiene tu hijo?". */
    legend: z.string(),
    /** Aclaración de qué hace elegir una edad. */
    hint: z.string().optional(),
    /** Texto de la opción que quita el filtro: "Todas las edades". */
    allLabel: z.string(),
  })
  .optional();

export const pagesSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  image: z.string().optional(),
  layout: z.enum(['page', 'fullwidth', 'landing']).default('page'),
  showInNav: z.boolean().default(false),
  order: z.number().default(0),
  draft: z.boolean().default(false),
  /** Solo lo usa `src/pages/programas/index.astro` (entrada `programas`). */
  agePicker: agePickerSchema,
  seo: seoSchema,
});

export const socialInitiativesSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  date: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  type: z.enum(['ambiental', 'formacion', 'recreacion', 'educacion', 'alianza']),
  status: z.enum(['activa', 'completada', 'pausada']).default('completada'),
  recurrent: z.boolean().default(false),
  frequency: z.string().optional(),
  location: z.string().optional(),
  neighborhood: z.string().optional(),
  city: z.string().default('Yumbo'),
  image: z.string(),
  imageAlt: z.string().optional(),
  gallery: z.array(z.string()).default([]),
  impact: z
    .object({
      beneficiaries: z.number().optional(),
      treesPlanted: z.number().optional(),
      volunteersInvolved: z.number().optional(),
      areaRestored: z.string().optional(),
      trainedPeople: z.number().optional(),
      description: z.string().optional(),
    })
    .optional(),
  allies: z.array(z.string()).default([]),
  relatedGallery: z.string().optional(),
  relatedNews: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  order: z.number().default(0),
  seo: seoSchema,
});

export const speciesSchema = z.object({
  commonName: z.string(),
  scientificName: z.string().optional(),
  category: z.enum(['frutal', 'ornamental', 'nativo', 'maderable']),
  description: z.string(),
  curiosity: z.string().optional(),
  heroImage: z.string(),
  heroImageAlt: z.string(),
  origin: z.string().optional(),
  uses: z.array(z.string()).optional(),
  draft: z.boolean().default(false),
  plural: z.string().optional(),
  feminine: z.boolean().default(false),
  seo: seoSchema,
});

export const treesSchema = z.object({
  species: z.string(),
  scientificName: z.string().optional(),
  plantedDate: z.coerce.date(),
  location: z.string().default('Pista de Ciclomontañismo Carlos Castro'),
  protector: z
    .enum(['llanta-bicicleta', 'llanta-moto', 'piedras', 'otro'])
    .default('llanta-bicicleta'),
  protectorColor: z.string().optional(),
  category: z.enum(['frutal', 'ornamental', 'nativo', 'maderable']).default('nativo'),
  image: z.string(),
  imageAlt: z.string(),
  status: z.enum(['sembrado', 'creciendo', 'floreciendo']).default('sembrado'),
  notes: z.string().optional(),
  donor: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  co2EstimateKg: z.number().optional(),
  heightEstimateM: z.number().optional(),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  order: z.number().default(0),
  seo: seoSchema.optional(),
});

// ============================================================
// HITOS DE LA HISTORIA DEL CLUB (línea de tiempo)
// ============================================================

/**
 * Un hito del recorrido del club. `label` no siempre es un año ("La casa",
 * "Hoy"), así que el orden lo manda `order` y no la fecha.
 *
 * `body` admite marcadores `{{clave}}` que se resuelven en build contra las
 * cifras vivas del sitio (ver `renderMilestoneText` en `src/lib/milestones.ts`),
 * para que un dato como el número de árboles no quede congelado en el texto.
 *
 * `image` es el nombre del archivo dentro de `src/assets/images/refresh/`.
 */
export const milestonesSchema = z
  .object({
    label: z.string(),
    title: z.string(),
    body: z.string(),
    icon: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  })
  .refine((data) => !data.image || Boolean(data.imageAlt?.trim()), {
    message: 'imageAlt es obligatorio cuando el hito tiene image',
    path: ['imageAlt'],
  });
