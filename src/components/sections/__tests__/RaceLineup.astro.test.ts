import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import RaceLineup from '../RaceLineup.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const athletes = [
  {
    name: 'Isabel Cristhina Quiñones Batero',
    category: 'Pre Juvenil A Femenina',
    slug: 'isabel-quinones',
    image: '/images/news/copa-valle-cali-2026/lineup/isabel-quinones.webp',
  },
  {
    name: 'Thiago Duque Cardona',
    category: 'Tetero con Pedales',
    slug: 'thiago-duque',
    image: '/images/news/copa-valle-cali-2026/lineup/thiago-duque.webp',
  },
  {
    name: 'Mariana Coronado Delgado',
    category: 'Pre Juvenil A Femenina',
    slug: 'mariana-coronado',
    image: '/images/news/copa-valle-cali-2026/lineup/mariana-coronado.webp',
  },
];

describe('RaceLineup', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('no renderiza nada cuando athletes está vacío', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes: [] },
    });
    const doc = parseHtml(html);
    expect(doc.querySelector('section.race-lineup')).toBeNull();
    expect(doc.querySelector('.race-lineup__card')).toBeNull();
  });

  it('renderiza una <section> con aria-labelledby', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const section = doc.querySelector('section.race-lineup');
    expect(section).not.toBeNull();
    expect(section!.getAttribute('aria-labelledby')).toBe('lineup-heading');
  });

  it('renderiza un h2 con id lineup-heading', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const h2 = doc.querySelector('h2#lineup-heading');
    expect(h2).not.toBeNull();
    expect(h2!.textContent?.trim()).toBe('El equipo en pista');
  });

  it('usa heading e intro personalizados cuando se proveen', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: {
        athletes,
        heading: 'Roster Palmira',
        intro: 'Cinco corredores en el roster.',
      },
    });
    expect(html).toContain('Roster Palmira');
    expect(html).toContain('Cinco corredores en el roster.');
  });

  it('aplica clase not-prose para escapar del estilo prose', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const section = doc.querySelector('section.race-lineup')!;
    expect(section.className).toContain('not-prose');
  });

  it('renderiza una <ol> con role="list"', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const ol = doc.querySelector('ol.race-lineup__track');
    expect(ol).not.toBeNull();
    expect(ol!.getAttribute('role')).toBe('list');
  });

  it('renderiza un card por cada atleta', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const cards = doc.querySelectorAll('li.race-lineup__card');
    expect(cards.length).toBe(athletes.length);
  });

  it('inyecta CSS var --stagger por índice (50ms step)', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const cards = doc.querySelectorAll<HTMLElement>('li.race-lineup__card');
    expect(cards[0].getAttribute('style')).toContain('--stagger:0ms');
    expect(cards[1].getAttribute('style')).toContain('--stagger:50ms');
    expect(cards[2].getAttribute('style')).toContain('--stagger:100ms');
  });

  it('primera imagen carga eager con fetchpriority high', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const imgs = doc.querySelectorAll('img.race-lineup__poster');
    expect(imgs[0].getAttribute('loading')).toBe('eager');
    expect(imgs[0].getAttribute('fetchpriority')).toBe('high');
  });

  it('imágenes posteriores cargan lazy sin fetchpriority', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const imgs = doc.querySelectorAll('img.race-lineup__poster');
    expect(imgs[1].getAttribute('loading')).toBe('lazy');
    expect(imgs[1].getAttribute('fetchpriority')).toBeNull();
    expect(imgs[2].getAttribute('loading')).toBe('lazy');
  });

  it('imágenes tienen width/height fijos para evitar CLS', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const img = doc.querySelector('img.race-lineup__poster')!;
    expect(img.getAttribute('width')).toBe('600');
    expect(img.getAttribute('height')).toBe('800');
  });

  it('imágenes tienen alt vacío (caption visible entrega la info)', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const imgs = doc.querySelectorAll('img.race-lineup__poster');
    imgs.forEach((img) => {
      expect(img.getAttribute('alt')).toBe('');
    });
  });

  it('cada figcaption contiene el nombre del atleta', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    expect(html).toContain('Isabel Cristhina Quiñones Batero');
    expect(html).toContain('Thiago Duque Cardona');
    expect(html).toContain('Mariana Coronado Delgado');
  });

  it('cada figcaption contiene la categoría del atleta', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    expect(html).toContain('Pre Juvenil A Femenina');
    expect(html).toContain('Tetero con Pedales');
  });

  it('img src coincide con el path del atleta', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const imgs = doc.querySelectorAll('img.race-lineup__poster');
    expect(imgs[0].getAttribute('src')).toBe(athletes[0].image);
    expect(imgs[1].getAttribute('src')).toBe(athletes[1].image);
  });

  it('mantiene el orden de los atletas tal como se pasan en props', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const captions = doc.querySelectorAll('figcaption .race-lineup__name');
    expect(captions[0].textContent?.trim()).toBe(athletes[0].name);
    expect(captions[1].textContent?.trim()).toBe(athletes[1].name);
    expect(captions[2].textContent?.trim()).toBe(athletes[2].name);
  });

  it('cada card tiene clase reveal para stagger on-scroll', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const cards = doc.querySelectorAll('li.race-lineup__card');
    cards.forEach((card) => {
      expect(card.className).toContain('reveal');
    });
  });

  it('glare overlay tiene aria-hidden true', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes },
    });
    const doc = parseHtml(html);
    const glares = doc.querySelectorAll('.race-lineup__glare');
    expect(glares.length).toBe(athletes.length);
    glares.forEach((g) => {
      expect(g.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('renderiza correctamente con un solo atleta', async () => {
    const html = await container.renderToString(RaceLineup, {
      props: { athletes: [athletes[0]] },
    });
    const doc = parseHtml(html);
    const cards = doc.querySelectorAll('li.race-lineup__card');
    expect(cards.length).toBe(1);
    const img = doc.querySelector('img.race-lineup__poster')!;
    expect(img.getAttribute('loading')).toBe('eager');
  });
});
