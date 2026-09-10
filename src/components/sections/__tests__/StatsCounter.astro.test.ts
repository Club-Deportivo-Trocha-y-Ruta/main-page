import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import StatsCounter from '../StatsCounter.astro';
import type { ClubFigure } from '@lib/home';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

// El container de Astro no carga el data store de contenido: dentro de Vitest
// `getCollection()` devuelve vacío, así que renderizar `<StatsCounter />` sin
// props deja una sola cifra (la de años, que no sale de collections) y las
// aserciones sobre la banda dejan de comprobar nada. Por eso el componente
// acepta `figures` por prop y aquí se le pasa un fixture: este test cubre la
// plantilla —escalonado, semántica del contador, fallback sin JS—, no de dónde
// salen los números. Eso lo cubren `home.test.ts` (sobre `buildClubFigures`,
// que es quien los calcula) y `content-validation.test.ts` (sobre el contenido
// real). Antes el test dependía de un `.astro/data-store.json` que solo deja
// `astro dev`, y por eso fallaba en checkout limpio y en CI.
const figures: ClubFigure[] = [
  {
    id: 'years',
    value: 16,
    label: 'años formando ciclistas',
    note: 'Desde mayo de 2010, en Yumbo',
    icon: 'ph:flag-banner-bold',
    href: '/quienes-somos',
  },
  {
    id: 'programs',
    value: 3,
    label: 'programas de formación',
    note: '7 sesiones a la semana entre todos',
    icon: 'ph:path-bold',
    href: '/programas',
  },
  {
    id: 'season',
    value: 9,
    label: 'fechas en el calendario',
    note: 'Temporada 2026: 6 ya corridas',
    icon: 'ph:calendar-dots-bold',
    href: '/calendario',
  },
  {
    id: 'trees',
    value: 77,
    label: 'árboles sembrados',
    note: 'Inventario de Trocha Verde, uno por uno',
    icon: 'ph:tree-bold',
    href: '/trocha-verde',
  },
];

describe('StatsCounter', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;
  let doc: Document;

  beforeAll(async () => {
    container = await AstroContainer.create();
    const html = await container.renderToString(StatsCounter, { props: { figures } });
    doc = parseHtml(html);
  });

  it('pinta una tarjeta por cifra recibida', () => {
    expect(doc.querySelectorAll('li.reveal').length).toBe(figures.length);
    expect(doc.querySelectorAll('.count-up').length).toBe(figures.length);
  });

  it('pinta cada cifra con la utilidad `.count-up` compartida, no con el script anterior', () => {
    const counters = doc.querySelectorAll('.count-up');
    expect(counters.length).toBeGreaterThan(0);
    expect(doc.querySelector('script')).toBeNull();
    expect(doc.body.innerHTML).not.toContain('data-count-target');
    expect(doc.body.innerHTML).not.toContain('IntersectionObserver');
  });

  it('cada dígito animado es aria-hidden y la cifra real vive en sr-only', () => {
    const digitNodes = doc.querySelectorAll('.count-up__digits');
    expect(digitNodes.length).toBe(doc.querySelectorAll('.count-up').length);
    digitNodes.forEach((node) => expect(node.getAttribute('aria-hidden')).toBe('true'));

    doc.querySelectorAll('.count-up').forEach((wrapper) => {
      expect(wrapper.querySelector('.sr-only')?.textContent?.trim()).not.toBe('');
    });
  });

  it('publica cada cifra con su valor, su etiqueta y el enlace donde se comprueba', () => {
    const cards = [...doc.querySelectorAll('li.reveal')];

    cards.forEach((card, index) => {
      const figure = figures[index];
      const counter = card.querySelector('.count-up');

      expect(counter?.getAttribute('style')).toContain(`--count-target:${figure.value}`);
      expect(counter?.querySelector('.sr-only')?.textContent?.trim()).toBe(String(figure.value));
      expect(card.textContent).toContain(figure.label);
      expect(card.textContent).toContain(figure.note);
      expect(card.querySelector('a')?.getAttribute('href')).toBe(figure.href);
    });
  });

  it('cada tarjeta dispara el conteo desde un ancestro `.reveal`', () => {
    doc.querySelectorAll('.count-up').forEach((wrapper) => {
      expect(wrapper.closest('.reveal')).not.toBeNull();
    });
  });

  it('escalona la entrada de las tarjetas con `--stagger`', () => {
    const items = [...doc.querySelectorAll('li.reveal')];
    expect(items.length).toBeGreaterThan(1);
    expect(items[0].getAttribute('style')).toContain('--stagger:0ms');
    expect(items[1].getAttribute('style')).toContain('--stagger:80ms');
  });

  it('el fallback sin JS fuerza la cifra final y el `.reveal` visible', () => {
    const noscript = doc.querySelector('noscript');
    expect(noscript).not.toBeNull();
    expect(noscript?.textContent).toContain('--count-value:var(--count-target) !important');
    expect(noscript?.textContent).toContain('opacity:1 !important');
  });

  it('no pinta la banda cuando no hay ninguna cifra que publicar', async () => {
    const html = await container.renderToString(StatsCounter, { props: { figures: [] } });
    expect(parseHtml(html).querySelector('li.reveal')).toBeNull();
  });
});
