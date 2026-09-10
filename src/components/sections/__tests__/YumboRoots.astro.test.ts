import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import YumboRoots from '../YumboRoots.astro';
import { YUMBO_LANDMARKS } from '@lib/yumbo';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('YumboRoots', () => {
  let doc: Document;

  beforeAll(async () => {
    const container = await AstroContainer.create();
    const html = await container.renderToString(YumboRoots);
    doc = parseHtml(html);
  });

  it('renderiza las tres láminas a color, una por hito', () => {
    const imgs = doc.querySelectorAll('img');
    expect(imgs.length).toBe(YUMBO_LANDMARKS.length);
  });

  /**
   * Hotfix 2026-09-10 (docs/04 §29): las láminas verticales («monumento»,
   * «iglesia») se desbordaban hacia arriba en producción, tapando el titular
   * de la sección. Causa: `<Image>` con el `layout` global del sitio
   * («constrained») trae su propio CSS (`@layer astro.images`, declarada
   * DESPUÉS que `@layer utilities` de Tailwind en el bundle compilado) que
   * fuerza `height:auto` en todo `[data-astro-image]` — gana sobre `h-full`
   * sin importar la especificidad, porque la prioridad de capa se decide
   * antes que la especificidad. Con `height:auto` forzado y `width:auto`
   * (`h-full w-auto`), la imagen crecía a su proporción completa sobre el
   * ancho de la columna, muy por encima de la caja de 192px.
   *
   * `max-h-full` no lo toca esa capa (Astro no declara nada sobre
   * `max-height`), así que el límite se respeta. `h-full` no puede volver:
   * jsdom no calcula layout real, así que esta prueba no puede medir
   * píxeles — fija la clase en el HTML, que es lo único que un test unitario
   * puede vigilar sin un navegador real (la verificación visual se hizo con
   * Playwright sobre el build, ver el hotfix).
   */
  it('las láminas verticales usan max-h-full, no h-full: Astro fuerza height:auto y h-full pierde', () => {
    const tallLandmarks = YUMBO_LANDMARKS.filter((l) => l.shape === 'tall');
    expect(tallLandmarks.length).toBeGreaterThan(0);

    for (const landmark of tallLandmarks) {
      const img = doc.querySelector(`img[alt="${landmark.alt}"]`);
      expect(img, `no se encontró la lámina de «${landmark.id}»`).not.toBeNull();

      const classes = img!.className.split(/\s+/);
      expect(classes, `«${landmark.id}» no debe usar h-full: Astro lo pisa`).not.toContain(
        'h-full',
      );
      expect(classes, `«${landmark.id}» debe limitar su alto con max-h-full`).toContain(
        'max-h-full',
      );
      expect(classes).toContain('w-auto');
    }
  });

  it('la lámina apaisada (cerro) sigue en h-auto w-full: ya coincidía con lo que Astro fuerza', () => {
    const cerro = YUMBO_LANDMARKS.find((l) => l.shape === 'wide');
    expect(cerro).toBeDefined();

    const img = doc.querySelector(`img[alt="${cerro!.alt}"]`);
    const classes = img!.className.split(/\s+/);
    expect(classes).toContain('h-auto');
    expect(classes).toContain('w-full');
  });
});
