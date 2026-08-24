import { describe, it, expect } from 'vitest';
import fg from 'fast-glob';
import matter from 'gray-matter';
import { readFileSync } from 'fs';

/**
 * Los `seo.metaTitle` del contenido se usan tal cual como `<title>`: SEOHead
 * no les añade la marca ni los recorta. Google muestra ~60 caracteres; lo que
 * pase de ahí se pierde en el resultado, que es justo donde se decide el clic.
 * `metaDescription` ya lo limita el schema a 160.
 */
const TITLE_MAX = 60;

const files = fg.sync(['src/content/programs/*.md', 'src/content/news/*.md']);

describe('seo.metaTitle del contenido', () => {
  it('encuentra archivos que revisar', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('todos los programas declaran un metaTitle propio', () => {
    const programs = files.filter((f) => f.includes('/programs/'));
    for (const file of programs) {
      const { data } = matter(readFileSync(file, 'utf-8'));
      expect(data.seo?.metaTitle, `${file} sin seo.metaTitle`).toBeTruthy();
    }
  });

  it.each(files)('%s: metaTitle cabe en un resultado de Google', (file) => {
    const { data } = matter(readFileSync(file, 'utf-8'));
    const title = data.seo?.metaTitle as string | undefined;
    if (!title) return;
    expect(title.length, `"${title}" tiene ${title.length} caracteres`).toBeLessThanOrEqual(TITLE_MAX);
  });
});
