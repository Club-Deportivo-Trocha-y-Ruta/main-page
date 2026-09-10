import { readdirSync, readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { YUMBO_LANDMARKS, landmarkFile } from '../lib/yumbo';

/**
 * Las láminas de Yumbo no se versionan a mano: las genera
 * `scripts/prepare-yumbo-assets.mjs` desde los originales del estudio, que
 * viven fuera del repo. Este test fija las dos cosas que se rompen en silencio
 * si alguien regenera a medias:
 *
 * 1. que exista el archivo de cada variante declarada en el catálogo, y que sea
 *    un WebP de verdad (mismo susto que el `.woff2` que era un 404 de GitHub,
 *    ver `fonts.test.ts`);
 * 2. que no sobre ninguna: un asset importado y no usado se copia entero a
 *    `dist/`, y por eso el catálogo declara solo lo que el sitio muestra.
 */

const DIR = 'src/assets/images/yumbo';

const declared = YUMBO_LANDMARKS.flatMap((landmark) =>
  landmark.variants.map((variant) => landmarkFile(landmark.id, variant)),
);

describe('láminas de Yumbo', () => {
  it('tiene en disco cada variante declarada', () => {
    expect(readdirSync(DIR).sort()).toEqual([...declared].sort());
  });

  it('son WebP con alfa, no PNG renombrados', () => {
    for (const file of declared) {
      const buffer = readFileSync(`${DIR}/${file}`);
      expect(buffer.subarray(0, 4).toString('ascii')).toBe('RIFF');
      expect(buffer.subarray(8, 12).toString('ascii')).toBe('WEBP');
    }
  });
});
