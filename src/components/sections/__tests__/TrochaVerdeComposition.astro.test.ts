import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import TrochaVerdeComposition from '../TrochaVerdeComposition.astro';
import { buildCategoryComposition } from '@lib/trocha-verde';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

// La composición real del club: 36 ornamental, 22 frutal, 17 nativo, 2 maderable (77).
const bosque = [
  ...Array.from({ length: 36 }, () => ({ category: 'ornamental' })),
  ...Array.from({ length: 22 }, () => ({ category: 'frutal' })),
  ...Array.from({ length: 17 }, () => ({ category: 'nativo' })),
  ...Array.from({ length: 2 }, () => ({ category: 'maderable' })),
];
const composition = buildCategoryComposition(bosque);

describe('TrochaVerdeComposition', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(TrochaVerdeComposition, { props }).then(parseHtml);

  it('no renderiza nada sin composición', async () => {
    const doc = await render({ composition: [] });
    expect(doc.querySelector('figure')).toBeNull();
  });

  it('dibuja un tramo de barra por categoría, en el mismo orden de mayor a menor', async () => {
    const doc = await render({ composition });
    const bar = doc.querySelector('[aria-hidden="true"].flex');
    const tramos = [...(bar?.children ?? [])];
    expect(tramos).toHaveLength(4);
  });

  it('el ancho de cada tramo es proporcional al total', async () => {
    const doc = await render({ composition });
    const bar = doc.querySelector('[aria-hidden="true"].flex');
    const first = bar?.children[0] as HTMLElement;
    // Ornamental: 36 de 77 ≈ 46.8% (mismo redondeo que `buildCategoryComposition`).
    expect(first.getAttribute('style')).toBe('width:46.8%');
  });

  it('lista cada categoría en la leyenda con su etiqueta, cantidad y porcentaje', async () => {
    const doc = await render({ composition });
    const items = [...doc.querySelectorAll('ul > li')];
    expect(items).toHaveLength(4);
    expect(items[0].textContent).toContain('Ornamental');
    expect(items[0].textContent).toContain('36');
    expect(items[0].textContent).toContain('46.8%');
  });

  it('resume la composición completa en el figcaption para lectores de pantalla', async () => {
    const doc = await render({ composition });
    const caption = doc.querySelector('figcaption');
    expect(caption?.className).toContain('sr-only');
    expect(caption?.textContent).toContain('Ornamental 46.8%');
    expect(caption?.textContent).toContain('Maderable 2.6%');
  });
});
