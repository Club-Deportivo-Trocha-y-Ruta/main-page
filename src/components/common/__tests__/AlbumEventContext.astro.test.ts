import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import AlbumEventContext from '../AlbumEventContext.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('AlbumEventContext', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(AlbumEventContext, { props }).then(parseHtml);

  it('no pinta nada sin evento resuelto', async () => {
    const html = await container.renderToString(AlbumEventContext, {
      props: { event: null, chronicles: [] },
    });
    expect(html.trim()).toBe('');
  });

  it('muestra el evento cuando existe, sin lista de crónicas si no hay ninguna', async () => {
    const doc = await render({
      event: { title: 'V Válida Copa Valle - Palmira', href: '/calendario#evento-2026-08-copa-valle-v-palmira' },
      chronicles: [],
    });
    const eventLink = doc.querySelector('a');
    expect(eventLink?.getAttribute('href')).toBe('/calendario#evento-2026-08-copa-valle-v-palmira');
    expect(eventLink?.textContent).toContain('V Válida Copa Valle - Palmira');
    expect(doc.querySelector('ul')).toBeNull();
  });

  it('lista cada crónica resuelta con su propio enlace', async () => {
    const doc = await render({
      event: { title: 'V Válida Copa Valle - Palmira', href: '/calendario#evento-2026-08-copa-valle-v-palmira' },
      chronicles: [
        { href: '/noticias/2026-08-copa-valle-palmira-gymkanas', title: 'Isabel gana en Palmira' },
        { href: '/noticias/2026-08-copa-valle-palmira-xco', title: 'Doblete en el podio' },
      ],
    });
    const chronicleLinks = [...doc.querySelectorAll('ul a')];
    expect(chronicleLinks).toHaveLength(2);
    expect(chronicleLinks.map((a) => a.getAttribute('href'))).toEqual([
      '/noticias/2026-08-copa-valle-palmira-gymkanas',
      '/noticias/2026-08-copa-valle-palmira-xco',
    ]);
    expect(chronicleLinks.map((a) => a.textContent?.trim())).toEqual([
      'Isabel gana en Palmira',
      'Doblete en el podio',
    ]);
  });

  it('combina la clase personalizada con las clases base', async () => {
    const doc = await render({
      event: { title: 'Evento', href: '/calendario#evento-x' },
      chronicles: [],
      class: 'mt-5',
    });
    expect(doc.querySelector('div')?.className).toContain('mt-5');
    expect(doc.querySelector('div')?.className).toContain('rounded-xl');
  });
});
