import { describe, it, expect } from 'vitest';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { readFileSync } from 'fs';
import { basename } from 'path';
import {
  ridersSchema,
  newsSchema,
  eventsSchema,
  programsSchema,
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
// Zod 4 tipa `issue.path` como PropertyKey[] (admite symbol), no (string|number)[].
const collectionSchemas: Record<
  string,
  {
    safeParse: (data: unknown) => {
      success: boolean;
      error?: { issues: ReadonlyArray<{ path: PropertyKey[]; message: string }> };
    };
  }
> = {
  riders: ridersSchema,
  news: newsSchema,
  events: eventsSchema,
  programs: programsSchema,
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
  // Un README dentro de una colección es documentación para quien carga el
  // contenido, no una ficha: no lo carga ningún loader (`results` solo lee
  // yaml/yml/json) y no tiene por qué traer frontmatter ni slug en kebab-case.
  const allMdFiles = fg
    .sync(`${CONTENT_DIR}/**/*.md`)
    .filter((filePath) => basename(filePath).toLowerCase() !== 'readme.md');

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

// ============================================================
// Referencias cruzadas entre colecciones
// ============================================================

/**
 * Las relaciones del contenido se escriben a mano en el CMS y se pudren en
 * silencio: el álbum de Ginebra apuntaba a un evento inexistente y la crónica
 * de Roldanillo a un álbum que no existía. Ninguna de las dos rompía el build
 * —el bloque simplemente no se pintaba—, así que nadie se enteraba.
 *
 * Se validan también los borradores: una referencia rota en un `draft` es
 * justo la que se publica sin que nadie la revise.
 *
 * `trees.species` queda fuera a propósito: referencia por nombre común y no
 * por id, y hay especies sembradas sin ficha propia (Abano, Lengua de suegra).
 * Eso está contemplado en `/trocha-verde`, que no las enlaza.
 */
describe('Referencias cruzadas', () => {
  function idsOf(collection: string): Set<string> {
    return new Set(
      fg.sync(`${CONTENT_DIR}/${collection}/**/*.md`).map((file) => basename(file, '.md'))
    );
  }

  const ids = {
    events: idsOf('events'),
    gallery: idsOf('gallery'),
    news: idsOf('news'),
    programs: idsOf('programs'),
  };

  /** [colección de origen, campo, colección destino] */
  const references: [string, string, keyof typeof ids][] = [
    ['news', 'relatedEvent', 'events'],
    ['news', 'relatedGallery', 'gallery'],
    ['gallery', 'relatedEvent', 'events'],
    ['events', 'relatedGallery', 'gallery'],
    ['events', 'relatedNews', 'news'],
    ['social-initiatives', 'relatedGallery', 'gallery'],
    ['social-initiatives', 'relatedNews', 'news'],
    ['riders', 'program', 'programs'],
  ];

  for (const [collection, field, target] of references) {
    const files = fg.sync(`${CONTENT_DIR}/${collection}/**/*.md`);
    if (files.length === 0) continue;

    it(`${collection}.${field} apunta siempre a un ${target} que existe`, () => {
      const broken: string[] = [];

      for (const filePath of files) {
        const { data } = parseFile(filePath);
        const value = data[field];
        if (value === undefined || value === null) continue;

        for (const ref of Array.isArray(value) ? value : [value]) {
          if (typeof ref === 'string' && ref && !ids[target].has(ref)) {
            broken.push(`${basename(filePath, '.md')} → ${field}: "${ref}"`);
          }
        }
      }

      expect(broken).toEqual([]);
    });
  }
});


// ============================================================
// Rutas de las fichas de evento
// ============================================================

describe('rutas de /calendario/[slug]', () => {
  /**
   * Dos eventos no pueden resolver a la misma URL.
   *
   * `urlSlug` es texto libre en Sveltia, y una colisión no da error de build:
   * `getStaticPaths()` devuelve dos entradas con el mismo `params.slug` y una
   * de las dos fichas deja de existir sin que nada avise. Se comprueba contra
   * el contenido real, que es donde puede ocurrir.
   */
  it('ningún evento comparte URL con otro', () => {
    const files = fg
      .sync(`${CONTENT_DIR}/events/**/*.md`)
      .filter((file) => basename(file).toLowerCase() !== 'readme.md');

    const rutas = new Map<string, string[]>();
    for (const file of files) {
      const id = basename(file, '.md');
      const { data } = matter(readFileSync(file, 'utf-8'));
      const slug = typeof data.urlSlug === 'string' && data.urlSlug.trim() ? data.urlSlug.trim() : id;
      rutas.set(slug, [...(rutas.get(slug) ?? []), id]);
    }

    const colisiones = [...rutas.entries()]
      .filter(([, ids]) => ids.length > 1)
      .map(([slug, ids]) => `${slug} ← ${ids.join(', ')}`);

    expect(colisiones, `URLs duplicadas:\n${colisiones.join('\n')}`).toEqual([]);
  });

  it('ningún evento usa la clave reservada `slug` en su frontmatter', () => {
    // Astro la convierte en el `id` de la entrada y rompe las referencias
    // cruzadas en silencio. El campo del proyecto se llama `urlSlug`.
    const files = fg
      .sync(`${CONTENT_DIR}/events/**/*.md`)
      .filter((file) => basename(file).toLowerCase() !== 'readme.md');

    const culpables = files.filter((file) => 'slug' in matter(readFileSync(file, 'utf-8')).data);
    expect(culpables.map((f) => basename(f))).toEqual([]);
  });
});
