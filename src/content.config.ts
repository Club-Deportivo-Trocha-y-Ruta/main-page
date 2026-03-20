import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// Schemas auxiliares reutilizables
const seoSchema = z
  .object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().max(160).optional(),
    ogImage: z.string().optional(),
  })
  .optional();

const socialMediaSchema = z
  .object({
    instagram: z.string().url().optional(),
    facebook: z.string().url().optional(),
    strava: z.string().url().optional(),
    youtube: z.string().url().optional(),
    tiktok: z.string().url().optional(),
  })
  .optional();

const riders = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/riders' }),
  schema: z.object({
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
        })
      )
      .default([]),
    socialMedia: socialMediaSchema,
    program: z.string().optional(),
    active: z.boolean().default(true),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    seo: seoSchema,
  }),
});

const directivos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/directivos' }),
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
    roleLabel: z.string(),
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

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Club Trocha y Ruta'),
    category: z.enum(['competencias', 'club', 'entrenamiento', 'comunidad']),
    tags: z.array(z.string()).default([]),
    image: z.string(),
    imageAlt: z.string().optional(),
    imageLayout: z.enum(['cover', 'contain']).default('cover'),
    excerpt: z.string().max(200),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    relatedEvent: z.string().optional(),
    relatedGallery: z.string().optional(),
    galleryFolder: z.string().optional(),
    galleryImages: z.array(z.string()).default([]),
    seo: seoSchema,
  }),
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/events' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    endDate: z.coerce.date().optional(),
    location: z.string(),
    city: z.string().optional(),
    department: z.string().default('Valle del Cauca'),
    mapUrl: z.string().url().optional(),
    category: z.enum([
      'xco',
      'xcm',
      'ruta',
      'enduro',
      'recreativo',
      'social',
      'entrenamiento',
    ]),
    level: z
      .enum([
        'municipal',
        'departamental',
        'regional',
        'nacional',
        'internacional',
        'interno',
      ])
      .default('departamental'),
    organizer: z.string().optional(),
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    status: z.enum(['upcoming', 'ongoing', 'past', 'cancelled']).default('upcoming'),
    registrationUrl: z.string().url().optional(),
    registrationDeadline: z.coerce.date().optional(),
    relatedGallery: z.string().optional(),
    relatedNews: z.array(z.string()).default([]),
    resultsUrl: z.string().url().optional(),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    seo: seoSchema,
  }),
});

const results = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: 'src/content/results' }),
  schema: z.object({
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
      })
    ),
    clubHighlights: z.string().optional(),
    totalParticipants: z.number().optional(),
  }),
});

const programs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/programs' }),
  schema: z.object({
    title: z.string(),
    subtitle: z.string().optional(),
    icon: z.string(),
    image: z.string().optional(),
    ageRange: z.string(),
    ageMin: z.number(),
    ageMax: z.number(),
    targetLevel: z.enum(['iniciación', 'formación', 'competición', 'recreativo']),
    schedule: z.string(),
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
  }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/testimonials' }),
  schema: z.object({
    name: z.string(),
    role: z.enum([
      'padre-de-familia',
      'madre-de-familia',
      'corredor',
      'corredor-juvenil',
      'exalumno',
      'entrenador',
      'aliado',
    ]),
    roleLabel: z.string(),
    photo: z.string().optional(),
    quote: z.string(),
    relatedRider: z.string().optional(),
    relatedProgram: z.string().optional(),
    featured: z.boolean().default(false),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const sponsors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/sponsors' }),
  schema: z.object({
    name: z.string(),
    logo: z.string(),
    logoLight: z.string().optional(),
    level: z.enum(['principal', 'oficial', 'aliado', 'proveedor']),
    url: z.string().url().optional(),
    description: z.string().optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    active: z.boolean().default(true),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/gallery' }),
  schema: z.object({
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
      })
    ),
    videos: z
      .array(
        z.object({
          url: z.string().url(),
          title: z.string(),
          thumbnail: z.string().optional(),
        })
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
  }),
});

const rutas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/rutas' }),
  schema: z.object({
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
    stravaRoute: z.string().url().optional(),
    mapUrl: z.string().url().optional(),
    suitableFor: z.array(
      z.enum(['pre-infantil', 'infantil', 'juvenil', 'elite', 'recreativo'])
    ),
    usedInPrograms: z.array(z.string()).default([]),
    active: z.boolean().default(true),
    order: z.number().default(0),
    draft: z.boolean().default(false),
    seo: seoSchema,
  }),
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/faqs' }),
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z
      .enum(['general', 'inscripciones', 'entrenamiento', 'competencias', 'equipamiento', 'seguridad'])
      .default('general'),
    order: z.number().default(0),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/pages' }),
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

const socialInitiatives = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/social-initiatives' }),
  schema: z.object({
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
    impact: z.object({
      beneficiaries: z.number().optional(),
      treesPlanted: z.number().optional(),
      volunteersInvolved: z.number().optional(),
      areaRestored: z.string().optional(),
      trainedPeople: z.number().optional(),
      description: z.string().optional(),
    }).optional(),
    allies: z.array(z.string()).default([]),
    relatedGallery: z.string().optional(),
    relatedNews: z.array(z.string()).default([]),
    featured: z.boolean().default(false),
    draft: z.boolean().default(false),
    order: z.number().default(0),
    seo: seoSchema,
  }),
});

export const collections = {
  riders,
  directivos,
  news,
  events,
  results,
  programs,
  testimonials,
  sponsors,
  gallery,
  rutas,
  pages,
  faqs,
  socialInitiatives,
};
