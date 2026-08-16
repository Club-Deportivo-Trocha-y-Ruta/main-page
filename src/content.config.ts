import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import {
  ridersSchema,
  directivosSchema,
  newsSchema,
  eventsSchema,
  resultsSchema,
  programsSchema,
  sponsorsSchema,
  gallerySchema,
  rutasSchema,
  faqsSchema,
  pagesSchema,
  socialInitiativesSchema,
  treesSchema,
  speciesSchema,
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
  schema: socialInitiativesSchema,
});

const trees = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/trees' }),
  schema: treesSchema,
});

const species = defineCollection({
  loader: glob({ pattern: '**/*.md', base: 'src/content/species' }),
  schema: speciesSchema,
});

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
  faqs,
  socialInitiatives,
  trees,
  species,
};
