import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import AlbumCard from '../AlbumCard.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const base = {
  href: '/galeria/copa-valle-palmira-2026',
  title: 'Copa Valle 2026 — V válida, Palmira',
  date: new Date('2026-08-02T00:00:00Z'),
  category: 'competencia',
  photoCount: 27,
  cover: '/images/news/copa-valle-palmira-2026/equipo-grupal-dia-2.webp',
  coverAlt: 'Equipo del Club Trocha y Ruta en el Bosque Municipal de Palmira',
};

describe('AlbumCard', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown> = {}, slots?: Record<string, string>) =>
    container.renderToString(AlbumCard, { props: { ...base, ...props }, slots }).then(parseHtml);

  it('variante default: toda la tarjeta es un único enlace estirado', async () => {
    const doc = await render({ variant: 'default' });
    const link = doc.querySelector('h3 a');
    expect(link?.getAttribute('href')).toBe(base.href);
    expect(link?.className).toContain('after:absolute');
  });

  it('variante featured: el título no estira la tarjeta y suma un cierre "Ver álbum completo"', async () => {
    const doc = await render({ variant: 'featured' });
    const titleLink = doc.querySelector('h3 a');
    expect(titleLink?.className).not.toContain('after:absolute');

    const links = [...doc.querySelectorAll('a')];
    const closingLink = links.find((a) => a.textContent?.includes('Ver álbum completo'));
    expect(closingLink?.getAttribute('href')).toBe(base.href);
  });

  it('usa la talla default cuando no se indica variante', async () => {
    const doc = await render({});
    expect(doc.querySelector('h3 a')?.className).toContain('after:absolute');
  });

  it('muestra la categoría traducida, no el valor crudo del enum', async () => {
    const doc = await render({});
    expect(doc.body.textContent).toContain('Competencia');
    expect(doc.body.textContent).not.toContain('competencia');
  });

  it('muestra la fecha en español', async () => {
    const doc = await render({});
    expect(doc.querySelector('time')?.textContent).toContain('agosto');
  });

  it('dice cuántas fotos trae el álbum', async () => {
    const conVarias = await render({ photoCount: 27 });
    expect(conVarias.body.textContent).toContain('27 fotos');

    const conUna = await render({ photoCount: 1 });
    expect(conUna.body.textContent).toContain('1 foto');
    expect(conUna.body.textContent).not.toContain('1 fotos');
  });

  it('la portada no aporta alto propio: absoluta dentro de una caja de proporción fija', async () => {
    for (const variant of ['default', 'featured'] as const) {
      const doc = await render({ variant });
      const img = doc.querySelector('img');
      expect(img?.className, variant).toContain('absolute');
      expect(img?.className, variant).toContain('inset-0');
      expect(img?.getAttribute('height'), variant).toBeNull();
    }
  });

  it('la portada lleva su propio texto alternativo, no uno vacío', async () => {
    const doc = await render({});
    expect(doc.querySelector('img')?.getAttribute('alt')).toBe(base.coverAlt);
  });

  it('muestra la descripción cuando existe y la omite cuando no', async () => {
    const conDescripcion = await render({ description: 'Doblete en el podio Prejuvenil A Femenina.' });
    expect(conDescripcion.body.textContent).toContain('Doblete en el podio Prejuvenil A Femenina.');

    const sinDescripcion = await render({});
    expect(sinDescripcion.body.textContent).not.toContain('Doblete');
  });

  it('recorta la descripción a menos líneas en la talla default que en la featured', async () => {
    const props = { description: 'Doblete en el podio Prejuvenil A Femenina.' };

    const featured = await render({ ...props, variant: 'featured' });
    expect(featured.querySelector('p.line-clamp-3')).not.toBeNull();

    const defaultCard = await render({ ...props, variant: 'default' });
    expect(defaultCard.querySelector('p.line-clamp-2')).not.toBeNull();
  });

  it('carga con prioridad solo cuando se le pide', async () => {
    const normal = await render({});
    expect(normal.querySelector('img')?.getAttribute('loading')).toBe('lazy');
    expect(normal.querySelector('img')?.getAttribute('fetchpriority')).toBeNull();

    const prioritaria = await render({ eager: true });
    expect(prioritaria.querySelector('img')?.getAttribute('loading')).toBe('eager');
    expect(prioritaria.querySelector('img')?.getAttribute('fetchpriority')).toBe('high');
  });

  it('renderiza el contenido del slot bajo la descripción', async () => {
    const doc = await render({ variant: 'featured' }, { default: '<div data-test-context>Contexto</div>' });
    expect(doc.querySelector('[data-test-context]')).not.toBeNull();
  });

  it('combina la clase personalizada con las clases base', async () => {
    const doc = await render({ class: 'my-custom-class' });
    expect(doc.querySelector('article')?.className).toContain('my-custom-class');
    expect(doc.querySelector('article')?.className).toContain('rounded-2xl');
  });
});
