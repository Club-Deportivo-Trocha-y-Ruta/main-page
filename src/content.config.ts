import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  ridersSchema,
  directivosSchema,
  newsSchema,
  eventsSchema,
  resultsSchema,
  programsSchema,
  testimonialsSchema,
  sponsorsSchema,
  gallerySchema,
  rutasSchema,
  faqsSchema,
  pagesSchema,
} from './lib/schemas';

const riders = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/riders' }),
  schema: ridersSchema,
});

const directivos = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/directivos' }),
  schema: directivosSchema,
});

const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/news' }),
  schema: newsSchema,
});

const events = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/events' }),
  schema: eventsSchema,
});

const results = defineCollection({
  loader: glob({ pattern: '**/*.{yaml,yml,json}', base: 'src/content/results' }),
  schema: resultsSchema,
});

const programs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/programs' }),
  schema: programsSchema,
});

const testimonials = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/testimonials' }),
  schema: testimonialsSchema,
});

const sponsors = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/sponsors' }),
  schema: sponsorsSchema,
});

const gallery = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/gallery' }),
  schema: gallerySchema,
});

const rutas = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/rutas' }),
  schema: rutasSchema,
});

const faqs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/faqs' }),
  schema: faqsSchema,
});

const pages = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/pages' }),
  schema: pagesSchema,
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
