import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import ClubSeal from '../ClubSeal.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('ClubSeal', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const renderHtml = (props: Record<string, unknown> = {}) =>
    container.renderToString(ClubSeal, { props });

  const render = (props: Record<string, unknown> = {}) => renderHtml(props).then(parseHtml);

  const seal = (doc: Document) => doc.querySelector('.club-seal');

  it('es decorativo: aria-hidden en el sello y alt vacío en el escudo', async () => {
    const doc = await render();
    expect(seal(doc)?.getAttribute('aria-hidden')).toBe('true');

    const img = doc.querySelector('img');
    expect(img).not.toBeNull();
    expect(img?.getAttribute('alt')).toBe('');
  });

  it('no aporta texto visible: el sello no imprime ninguna palabra', async () => {
    const doc = await render();
    expect(seal(doc)?.textContent?.trim()).toBe('');
  });

  it('se engancha al `.reveal` global para que el estampado tenga disparador', async () => {
    const doc = await render();
    expect(seal(doc)?.classList.contains('reveal')).toBe(true);
  });

  it('el estampado vive en global.css: el único <style> emitido es el del <noscript>', async () => {
    const html = await renderHtml();
    const styleTags = html.match(/<style/g) ?? [];
    expect(styleTags).toHaveLength(1);
    expect(html).toMatch(/<noscript><style/);
  });

  it('emite el fallback sin JS que deja el `.reveal` visible', async () => {
    const doc = await render();
    const noscript = doc.querySelector('noscript');
    expect(noscript).not.toBeNull();
    expect(noscript?.textContent).toContain('opacity:1 !important');
    expect(noscript?.textContent).toContain('transform:none !important');
  });

  it('inclina -6° por defecto, vía custom property propia', async () => {
    const doc = await render();
    expect(seal(doc)?.getAttribute('style')).toContain('--club-seal-rotate:-6deg');
  });

  it('respeta la inclinación pedida por el consumidor', async () => {
    const doc = await render({ rotate: 5 });
    expect(seal(doc)?.getAttribute('style')).toContain('--club-seal-rotate:5deg');
  });

  it('acota la inclinación a ±15°: el sello se firma, no se gira', async () => {
    const arriba = await render({ rotate: 90 });
    expect(seal(arriba)?.getAttribute('style')).toContain('--club-seal-rotate:15deg');

    const abajo = await render({ rotate: -180 });
    expect(seal(abajo)?.getAttribute('style')).toContain('--club-seal-rotate:-15deg');
  });

  it('crece con `size` sin cambiar de marcado', async () => {
    const widths = await Promise.all(
      (['sm', 'md', 'lg'] as const).map(async (size) => {
        const doc = await render({ size });
        return Number(doc.querySelector('img')?.getAttribute('width'));
      }),
    );

    expect(widths[0]).toBeLessThan(widths[1]);
    expect(widths[1]).toBeLessThan(widths[2]);
  });

  it('el escudo es cuadrado: mismo width y height, sin CLS al cargar', async () => {
    const doc = await render({ size: 'lg' });
    const img = doc.querySelector('img');
    expect(img?.getAttribute('width')).toBe(img?.getAttribute('height'));
  });

  it('sobre un tono invertido el disco se vuelve blanco opaco', async () => {
    const doc = await render({ tone: 'dark' });
    const classes = seal(doc)?.className ?? '';
    expect(classes).toContain('bg-white');
    expect(classes).not.toContain('bg-surface ');
  });

  it('sobre tonos claros el disco usa la superficie del sistema editorial', async () => {
    for (const tone of ['plain', 'muted', 'tinted', 'brand'] as const) {
      const doc = await render({ tone });
      expect(seal(doc)?.className).toContain('bg-surface');
    }
  });

  it('deja pasar la clase del consumidor sin perder las propias', async () => {
    const doc = await render({ class: 'mb-5' });
    const classes = seal(doc)?.className ?? '';
    expect(classes).toContain('mb-5');
    expect(classes).toContain('club-seal');
    expect(classes).toContain('reveal');
  });
});
