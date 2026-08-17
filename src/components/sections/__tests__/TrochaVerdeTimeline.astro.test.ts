import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import TrochaVerdeTimeline from '../TrochaVerdeTimeline.astro';
import { buildPlantingTimeline } from '@lib/trocha-verde';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

// El tramo real del club: 77 árboles del 15 de marzo al 18 de mayo de 2026, en 7 jornadas.
const fechas = [
  ['2026-03-15', 2],
  ['2026-04-01', 5],
  ['2026-04-04', 7],
  ['2026-04-09', 3],
  ['2026-04-22', 24],
  ['2026-05-03', 27],
  ['2026-05-18', 9],
] as const;
const trees = fechas.flatMap(([fecha, cantidad]) =>
  Array.from({ length: cantidad }, () => ({ plantedDate: at(fecha) }))
);
const timeline = buildPlantingTimeline(trees)!;

describe('TrochaVerdeTimeline', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(TrochaVerdeTimeline, { props }).then(parseHtml);

  it('dibuja una tarjeta de detalle por jornada de siembra', async () => {
    const doc = await render({ timeline });
    const cards = [...doc.querySelectorAll('ol > li')];
    expect(cards).toHaveLength(7);
    expect(cards[0].textContent).toContain('Jornada 1');
    expect(cards[6].textContent).toContain('Jornada 7');
  });

  it('la última jornada acumula el total de árboles sembrados', async () => {
    const doc = await render({ timeline });
    const cards = [...doc.querySelectorAll('ol > li')];
    expect(cards[cards.length - 1].textContent).toContain('Van 77 de 77');
  });

  it('resume el ritmo de siembra en el figcaption para lectores de pantalla', async () => {
    const doc = await render({ timeline });
    const caption = doc.querySelector('figcaption');
    expect(caption?.className).toContain('sr-only');
    expect(caption?.textContent).toContain('77 árboles');
    expect(caption?.textContent).toContain('7 jornadas');
    expect(caption?.textContent).toContain('9 semanas');
  });

  it('marca la regla de semanas con una división por cada semana transcurrida', async () => {
    const doc = await render({ timeline });
    // 9 semanas → 10 marcas (incluye el punto de partida).
    const ticks = doc.querySelectorAll('span.absolute.top-0.w-px');
    expect(ticks).toHaveLength(10);
  });

  it('rotula los extremos con la primera y la última fecha de siembra', async () => {
    const doc = await render({ timeline });
    expect(doc.body.textContent).toContain('15 de mar');
    expect(doc.body.textContent).toContain('18 de may');
  });

  it('no se cae con una sola jornada de siembra', async () => {
    const unico = buildPlantingTimeline([{ plantedDate: at('2026-06-01') }])!;
    const doc = await render({ timeline: unico });
    const cards = [...doc.querySelectorAll('ol > li')];
    expect(cards).toHaveLength(1);
    expect(cards[0].textContent).toContain('Van 1 de 1');
  });
});
