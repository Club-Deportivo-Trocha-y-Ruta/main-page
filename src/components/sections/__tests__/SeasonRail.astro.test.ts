import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SeasonRail from '../SeasonRail.astro';
import { buildSeason } from '@lib/calendar';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);
const hoy = new Date('2026-08-15T17:00:00Z');

// Dos corridas, una cancelada y una por correr: los cuatro estados que el riel
// tiene que distinguir sin usar solo el color.
const events = [
  {
    id: 'sevilla',
    data: { title: 'I Válida Copa Valle 2026 - Sevilla', date: at('2026-01-31'), city: 'Sevilla' },
  },
  {
    id: 'palmira',
    data: { title: 'V Válida Copa Valle 2026 - Palmira', date: at('2026-08-01'), city: 'Palmira' },
  },
  {
    id: 'roldanillo',
    data: {
      title: 'VI Válida Copa Valle 2026 - Roldanillo',
      date: at('2026-09-26'),
      city: 'Roldanillo',
      status: 'cancelled',
    },
  },
  {
    id: 'yumbo',
    data: { title: 'VII Válida Copa Valle 2026 - Yumbo', date: at('2026-10-18'), city: 'Yumbo' },
  },
];

describe('SeasonRail', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(SeasonRail, { props }).then(parseHtml);

  const season = buildSeason(events, hoy);

  it('no renderiza nada sin fechas', async () => {
    const doc = await render({ season: buildSeason([], hoy) });
    expect(doc.querySelector('ol')).toBeNull();
    expect(doc.body.textContent?.trim()).toBe('');
  });

  it('dibuja un punto por parada, en el orden de la temporada', async () => {
    const doc = await render({ season });
    const stops = [...doc.querySelectorAll('ol > li')];
    expect(stops).toHaveLength(4);
    expect(stops.map((li) => li.getAttribute('style'))).toEqual([
      'left:12.5%',
      'left:37.5%',
      'left:62.5%',
      'left:87.5%',
    ]);
  });

  it('llena la barra hasta donde va la temporada', async () => {
    const doc = await render({ season });
    const fill = [...doc.querySelectorAll('div[style]')].find((el) =>
      el.getAttribute('style')?.includes('width'),
    );
    // 2 de 4 corridas → la mitad del riel
    expect(fill?.getAttribute('style')).toBe('width:50%');
    expect(fill?.className).toContain('bg-primary-deep');
  });

  it('marca la cancelada con la barrita diagonal, no solo con el gris', async () => {
    const doc = await render({ season });
    const stops = [...doc.querySelectorAll('ol > li')];
    const cancelada = stops[2];
    expect(cancelada.innerHTML).toContain('bg-[#b42318]');
    expect(cancelada.innerHTML).toContain('-rotate-45');
    expect(stops.filter((li) => li.innerHTML.includes('bg-[#b42318]'))).toHaveLength(1);
  });

  it('agranda la que sigue además de teñirla de lima', async () => {
    const doc = await render({ season });
    const stops = [...doc.querySelectorAll('ol > li')];
    // Roldanillo está cancelada: la que sigue es Yumbo.
    expect(stops[3].innerHTML).toContain('bg-accent');
    expect(stops[3].innerHTML).toContain('size-4');
    expect(stops.filter((li) => li.innerHTML.includes('bg-accent'))).toHaveLength(1);
    expect(stops[0].innerHTML).toContain('bg-primary-deep');
  });

  it('esconde el dibujo y deja el dato como texto', async () => {
    const doc = await render({ season });
    const riel = doc.querySelector('[aria-hidden="true"]');
    expect(riel?.querySelector('ol')).not.toBeNull();

    const texto = doc.querySelector('p');
    expect(texto?.className).toContain('sr-only');
    expect(texto?.textContent).toBe('Temporada 2026: 2 de 4 fechas corridas, 1 cancelada.');
  });

  it('omite las canceladas del texto cuando no hay ninguna', async () => {
    const doc = await render({ season: buildSeason(events.slice(0, 2), hoy) });
    expect(doc.querySelector('p')?.textContent).toBe('Temporada 2026: 2 de 2 fechas corridas.');
  });
});
