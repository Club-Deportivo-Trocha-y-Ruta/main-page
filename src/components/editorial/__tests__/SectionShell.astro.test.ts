import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SectionShell from '../SectionShell.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('SectionShell', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(SectionShell, { props }).then(parseHtml);

  it('recorta con overflow-hidden por defecto', async () => {
    const doc = await render({});
    const section = doc.querySelector('section');
    expect(section?.className).toContain('overflow-hidden');
    expect(section?.className).not.toContain('overflow-clip');
  });

  it('con scrollDriven recorta con overflow-clip, que no crea contenedor de scroll', async () => {
    // Si volviera a overflow-hidden, `view()` se anclaría a la sección y toda
    // animación ligada al scroll quedaría congelada.
    const doc = await render({ scrollDriven: true });
    const section = doc.querySelector('section');
    expect(section?.className).toContain('overflow-clip');
    expect(section?.className).not.toContain('overflow-hidden');
  });

  it('no pinta textura sin pattern', async () => {
    const doc = await render({ scrollDriven: true });
    expect(doc.querySelector('svg')).toBeNull();
  });

  it('deja la textura quieta cuando no se pide scrollDriven', async () => {
    const doc = await render({ pattern: 'topo' });
    const svg = doc.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('inset-0');
    expect(svg?.getAttribute('class')).not.toContain('sda-parallax-slow');
  });

  it('da deriva a la textura y la sobredimensiona con scrollDriven', async () => {
    const doc = await render({ pattern: 'topo', scrollDriven: true });
    const svg = doc.querySelector('svg');
    expect(svg?.getAttribute('class')).toContain('sda-parallax-slow');
    // Más alta que la sección para que la deriva no descubra una franja vacía
    expect(svg?.getAttribute('class')).toContain('h-[calc(100%+4rem)]');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
  });
});
