import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import NewsCard from '../NewsCard.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const base = {
  href: '/noticias/copa-valle-palmira',
  title: 'Isabel Quiñones gana en Palmira',
  date: new Date('2026-08-01T00:00:00Z'),
  category: 'competencias',
  excerpt: 'Isabel ganó las gymkanas con recorrido limpio y el mejor tiempo.',
  image: '/images/news/palmira/portada.webp',
  imageAlt: 'Afiche de la V válida de la Copa Valle en Palmira',
};

describe('NewsCard', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(NewsCard, { props: { ...base, ...props } }).then(parseHtml);

  it('titula con un enlace que cubre toda la tarjeta', async () => {
    const doc = await render({});
    const link = doc.querySelector('h3 a');
    expect(link?.getAttribute('href')).toBe('/noticias/copa-valle-palmira');
    // Enlace estirado: toda la tarjeta es clicable con un solo enlace.
    expect(link?.className).toContain('after:absolute');
  });

  it('muestra la categoría en legible y la fecha en español', async () => {
    const doc = await render({});
    expect(doc.body.textContent).toContain('Competencia');
    expect(doc.body.textContent).not.toContain('competencias');
    expect(doc.querySelector('time')?.textContent).toContain('agosto');
  });

  it('muestra el tiempo de lectura solo si hay cuerpo', async () => {
    const sinCuerpo = await render({});
    expect(sinCuerpo.body.textContent).not.toContain('min de lectura');

    const conCuerpo = await render({ body: 'palabra '.repeat(400) });
    expect(conCuerpo.body.textContent).toContain('2 min de lectura');
  });

  it('muestra el afiche completo sobre un fondo desenfocado', async () => {
    const doc = await render({ imageLayout: 'contain' });
    const images = [...doc.querySelectorAll('img')];
    expect(images).toHaveLength(2);

    const [backdrop, poster] = images;
    expect(backdrop.getAttribute('aria-hidden')).toBe('true');
    expect(backdrop.getAttribute('alt')).toBe('');
    expect(backdrop.className).toContain('blur-xl');
    expect(poster.className).toContain('object-contain');
    expect(poster.getAttribute('alt')).toBe(base.imageAlt);
  });

  it('la foto llena el recuadro y no lleva fondo extra', async () => {
    const doc = await render({ imageLayout: 'cover' });
    const images = [...doc.querySelectorAll('img')];
    expect(images).toHaveLength(1);
    expect(images[0].className).toContain('object-cover');
    expect(images[0].className).toContain('group-hover:scale-105');
  });

  it('ninguna imagen aporta alto propio: un afiche vertical no estira la tarjeta', async () => {
    for (const imageLayout of ['contain', 'cover'] as const) {
      const doc = await render({ imageLayout, variant: 'lead' });
      for (const img of doc.querySelectorAll('img')) {
        expect(img.className, imageLayout).toContain('absolute');
        expect(img.className, imageLayout).toContain('inset-0');
        expect(img.getAttribute('height'), imageLayout).toBeNull();
      }
    }
  });

  it('carga con prioridad solo cuando se le pide', async () => {
    const normal = await render({});
    expect(normal.querySelector('img')?.getAttribute('loading')).toBe('lazy');
    expect(normal.querySelector('img')?.getAttribute('fetchpriority')).toBeNull();

    const prioritaria = await render({ eager: true });
    expect(prioritaria.querySelector('img')?.getAttribute('loading')).toBe('eager');
    expect(prioritaria.querySelector('img')?.getAttribute('fetchpriority')).toBe('high');
  });

  it('la talla compacta deja solo título y fecha', async () => {
    const doc = await render({ variant: 'compact', body: 'palabra '.repeat(400) });
    expect(doc.body.textContent).not.toContain(base.excerpt);
    expect(doc.body.textContent).not.toContain('min de lectura');
    expect(doc.querySelector('h3')?.textContent?.trim()).toBe(base.title);
  });

  it('permite bajar el nivel del titular cuando cuelga de un subtítulo', async () => {
    const porDefecto = await render({});
    expect(porDefecto.querySelector('h3')).not.toBeNull();

    const anidada = await render({ as: 'h4' });
    expect(anidada.querySelector('h3')).toBeNull();
    expect(anidada.querySelector('h4')?.textContent?.trim()).toBe(base.title);
  });

  it('cae en un marcador cuando la noticia no trae imagen', async () => {
    const doc = await render({ image: undefined });
    expect(doc.querySelector('img')).toBeNull();
    expect(doc.querySelector('svg')).not.toBeNull();
  });
});
