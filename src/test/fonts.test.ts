import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';

/**
 * Regresión del subsetting de fuentes (tarea 2 de `docs/08-plan-creatividad-ui.md`).
 *
 * Al subsetear se descubrió que `public/fonts/PlusJakartaSans-Variable.woff2`
 * nunca fue una fuente: era la página HTML de error 404 de GitHub guardada con
 * extensión `.woff2`. El sitio la preloadeaba en las 143 páginas, así que
 * gastaba 305 KB por visita y los títulos jamás se pintaron con Plus Jakarta
 * Sans — caían al `system-ui` del fallback sin un solo error visible.
 *
 * Estos tests fijan las condiciones que hacen imposible que vuelva a pasar en
 * silencio: que cada archivo que la CSS declara exista y sea un WOFF2 de
 * verdad, que los `<link rel="preload">` apunten exactamente a esos archivos,
 * y que cada `@font-face` declare su `unicode-range`.
 */

const GLOBAL_CSS = 'src/styles/global.css';
const LAYOUTS = ['src/layouts/BaseLayout.astro', 'src/layouts/LinktreeLayout.astro'];

const css = readFileSync(GLOBAL_CSS, 'utf-8');

/** Bloques `@font-face { ... }` de la hoja global. */
const fontFaces = [...css.matchAll(/@font-face\s*\{([^}]*)\}/g)].map((m) => m[1]);

/** Rutas `/fonts/*.woff2` que la CSS declara como `src`. */
const declaredFonts = fontFaces
  .map((block) => block.match(/url\('(\/fonts\/[^']+)'\)/)?.[1])
  .filter((href): href is string => Boolean(href));

describe('fuentes locales', () => {
  it('declara las dos familias del sitio', () => {
    expect(fontFaces).toHaveLength(2);
    expect(css).toContain("font-family: 'Inter Variable'");
    expect(css).toContain("font-family: 'Plus Jakarta Sans'");
  });

  it('sirve los subsets `-latin`, no las fuentes completas', () => {
    expect(declaredFonts).toEqual([
      '/fonts/InterVariable-latin.woff2',
      '/fonts/PlusJakartaSans-Variable-latin.woff2',
    ]);
  });

  it.each(declaredFonts)('%s existe y es un WOFF2 real', (href) => {
    // `wOF2` es la firma de WOFF2. El archivo corrupto empezaba por `<!DOCTYPE`.
    const bytes = readFileSync(`public${href}`);
    expect(bytes.subarray(0, 4).toString('ascii')).toBe('wOF2');
  });

  it.each(declaredFonts)('%s pesa menos que la fuente completa', (href) => {
    // Las originales pesaban 352 KB y 305 KB. Un subset que se acerque a eso
    // es señal de que se regeneró sin `--unicodes`.
    expect(readFileSync(`public${href}`).byteLength).toBeLessThan(200 * 1024);
  });

  it('cada @font-face acota su unicode-range', () => {
    for (const block of fontFaces) {
      expect(block).toMatch(/unicode-range:/);
      // El rango tiene que cubrir Latin-1 (ñ, tildes, ¿, ¡) y las flechas y
      // triángulos que usan el hero, las crónicas y las tablas de resultados.
      expect(block).toMatch(/U\+0000-00FF/);
      expect(block).toMatch(/U\+2190-2193/);
      expect(block).toMatch(/U\+25B2/);
      expect(block).toMatch(/U\+25BC/);
    }
  });

  it('conserva el `font-display: swap` de cada familia', () => {
    for (const block of fontFaces) {
      expect(block).toMatch(/font-display:\s*swap/);
    }
  });

  describe.each(LAYOUTS)('%s', (layoutPath) => {
    const layout = readFileSync(layoutPath, 'utf-8');
    const preloaded = [...layout.matchAll(/href=["'](\/fonts\/[^"']+)["']/g)].map((m) => m[1]);

    it('preloadea exactamente las fuentes que declara la CSS', () => {
      expect([...preloaded].sort()).toEqual([...declaredFonts].sort());
    });
  });
});
