import { describe, it, expect } from 'vitest';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { readFileSync } from 'fs';
import { basename, dirname } from 'path';
import {
  ridersSchema,
  newsSchema,
  eventsSchema,
  programsSchema,
  testimonialsSchema,
  sponsorsSchema,
  gallerySchema,
  faqsSchema,
} from '../schemas';

/**
 * Validación de archivos de contenido reales contra schemas Zod.
 * Usa fast-glob + gray-matter para parsear frontmatter de cada .md
 * y validarlo contra el schema correspondiente de la colección.
 */

const CONTENT_DIR = 'src/content';

// Mapa colección → schema Zod
const collectionSchemas: Record<string, ReturnType<typeof ridersSchema.safeParse> extends never ? never : { safeParse: (data: unknown) => { success: boolean; error?: { issues: Array<{ path: (string | number)[]; message: string }> } } }> = {
  riders: ridersSchema,
  news: newsSchema,
  events: eventsSchema,
  programs: programsSchema,
  testimonials: testimonialsSchema,
  sponsors: sponsorsSchema,
  gallery: gallerySchema,
  faqs: faqsSchema,
};

function getContentFiles(collection: string): string[] {
  return fg.sync(`${CONTENT_DIR}/${collection}/**/*.md`);
}

function parseFile(filePath: string) {
  const raw = readFileSync(filePath, 'utf-8');
  return matter(raw);
}

// ============================================================
// Validación por colección
// ============================================================

for (const [collection, schema] of Object.entries(collectionSchemas)) {
  const files = getContentFiles(collection);

  if (files.length === 0) continue;

  describe(`Contenido: ${collection}`, () => {
    it.each(files)('%s tiene frontmatter válido', (filePath) => {
      const { data } = parseFile(filePath);
      const result = schema.safeParse(data);

      if (!result.success) {
        const issues = result.error!.issues
          .map((i) => `  ${i.path.join('.')}: ${i.message}`)
          .join('\n');
        expect.fail(
          `Frontmatter inválido en ${filePath}:\n${issues}`
        );
      }
    });
  });
}

// ============================================================
// Convenciones de archivos de contenido
// ============================================================

describe('Convenciones de contenido', () => {
  const allMdFiles = fg.sync(`${CONTENT_DIR}/**/*.md`);

  it.each(allMdFiles)('%s tiene slug en kebab-case sin acentos', (filePath) => {
    const slug = basename(filePath, '.md');
    // kebab-case: minúsculas, números, guiones
    expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it.each(allMdFiles)('%s no tiene frontmatter vacío', (filePath) => {
    const { data } = parseFile(filePath);
    expect(Object.keys(data).length).toBeGreaterThan(0);
  });

  // Archivos con draft: true no deben ser la mayoría
  it('menos del 50% del contenido está en draft', () => {
    let draftCount = 0;
    for (const filePath of allMdFiles) {
      const { data } = parseFile(filePath);
      if (data.draft === true) draftCount++;
    }
    expect(draftCount).toBeLessThan(allMdFiles.length / 2);
  });
});
