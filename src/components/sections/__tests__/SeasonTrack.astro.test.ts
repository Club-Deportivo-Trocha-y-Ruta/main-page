import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SeasonTrack from '../SeasonTrack.astro';
import { buildSeason } from '@lib/calendar';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);
const hoy = new Date('2026-08-15T17:00:00Z');

const events = [
  { id: 'sevilla', data: { title: 'I Válida Copa Valle 2026 - Sevilla', date: at('2026-01-31'), city: 'Sevilla' } },
  { id: 'palmira', data: { title: 'V Válida Copa Valle 2026 - Palmira', date: at('2026-08-01'), city: 'Palmira' } },
  { id: 'roldanillo', data: { title: 'VI Válida Copa Valle 2026 - Roldanillo', date: at('2026-09-26'), city: 'Roldanillo' } },
  { id: 'yumbo', data: { title: 'VII Válida Copa Valle 2026 - Yumbo', date: at('2026-10-18'), city: 'Yumbo' } },
];

describe('SeasonTrack', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(SeasonTrack, { props }).then(parseHtml);

  const season = buildSeason(events, hoy);

  it('no renderiza nada sin fechas', async () => {
    const doc = await render({ season: buildSeason([], hoy) });
    expect(doc.querySelector('figure')).toBeNull();
  });

  it('dibuja una parada por fecha, en orden', async () => {
    const doc = await render({ season });
    const stops = [...doc.querySelectorAll('ol > li')];
    expect(stops).toHaveLength(4);
    expect(stops.map((li) => li.textContent?.trim().split('\n').pop()?.trim())).toBeTruthy();
    expect(stops[0].textContent).toContain('Sevilla');
    expect(stops[3].textContent).toContain('Yumbo');
  });

  it('llena la barra hasta donde va la temporada', async () => {
    const doc = await render({ season });
    const fill = [...doc.querySelectorAll('[aria-hidden="true"]')].find((el) =>
      el.getAttribute('style')?.includes('width')
    );
    // 2 de 4 corridas → la mitad del riel
    expect(fill?.getAttribute('style')).toContain('width:50%');
  });

  it('marca la próxima fecha y solo esa', async () => {
    const doc = await render({ season });
    const marcas = [...doc.querySelectorAll('ol > li')].filter((li) =>
      li.textContent?.includes('Sigue')
    );
    expect(marcas).toHaveLength(1);
    expect(marcas[0].textContent).toContain('Roldanillo');
  });

  it('enlaza cada parada con el prefijo que se le pase', async () => {
    const doc = await render({ season, hrefBase: '/calendario#evento-' });
    expect([...doc.querySelectorAll('ol > li a')].map((a) => a.getAttribute('href'))).toEqual([
      '/calendario#evento-sevilla',
      '/calendario#evento-palmira',
      '/calendario#evento-roldanillo',
      '/calendario#evento-yumbo',
    ]);
  });

  it('nombra cada parada completa para lectores de pantalla', async () => {
    const doc = await render({ season });
    const label = doc.querySelector('ol > li a')?.getAttribute('aria-label');
    expect(label).toContain('I Válida Copa Valle 2026 - Sevilla');
    expect(label).toContain('31');
  });

  it('resume el avance en el figcaption y oculta los adornos', async () => {
    const doc = await render({ season });
    const caption = doc.querySelector('figcaption');
    expect(caption?.className).toContain('sr-only');
    expect(caption?.textContent).toContain('2 de 4 fechas corridas');
    expect(caption?.textContent).toContain('Roldanillo');
  });

  describe('fecha cancelada', () => {
    const conCancelada = [
      ...events.slice(0, 2),
      { ...events[2], data: { ...events[2].data, status: 'cancelled' } },
      events[3],
    ];
    const seasonCancelada = buildSeason(conCancelada, hoy);

    it('la deja en el riel, rotulada y tachada', async () => {
      const doc = await render({ season: seasonCancelada });
      const parada = [...doc.querySelectorAll('ol > li')][2];
      expect(parada.textContent).toContain('Roldanillo');
      expect(parada.textContent).toContain('Cancelada');
      expect(parada.innerHTML).toContain('line-through');
    });

    it('no la anuncia como la próxima: esa pasa a ser la siguiente en pie', async () => {
      const doc = await render({ season: seasonCancelada });
      const marcas = [...doc.querySelectorAll('ol > li')].filter((li) =>
        li.textContent?.includes('Sigue')
      );
      expect(marcas).toHaveLength(1);
      expect(marcas[0].textContent).toContain('Yumbo');
    });

    it('la nombra como cancelada para lectores de pantalla', async () => {
      const doc = await render({ season: seasonCancelada });
      const label = [...doc.querySelectorAll('ol > li a')][2].getAttribute('aria-label');
      expect(label).toContain('Roldanillo');
      expect(label).toContain('cancelada');
    });

    it('la descuenta en el conteo visible y en el figcaption', async () => {
      const doc = await render({ season: seasonCancelada });
      expect(doc.body.textContent).toContain('1 cancelada');
      expect(doc.querySelector('figcaption')?.textContent).toContain('Una fecha cancelada');
    });
  });

  it('deja el riel lleno cuando ya no queda nada por correr', async () => {
    const doc = await render({ season: buildSeason(events, new Date('2026-12-01T17:00:00Z')) });
    expect(doc.body.textContent).not.toContain('Sigue');
    expect(doc.body.innerHTML).toContain('width:100%');
  });
});
