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

  const stopsOf = (doc: Document) => [...doc.querySelectorAll('[data-stop-id]')];
  const monthsOf = (doc: Document) => [...doc.querySelectorAll('figure > ol > li')];

  it('dibuja una parada por fecha, en orden', async () => {
    const doc = await render({ season });
    const stops = stopsOf(doc);
    expect(stops).toHaveLength(4);
    expect(stops[0].textContent).toContain('Sevilla');
    expect(stops[3].textContent).toContain('Yumbo');
  });

  it('reparte el año en doce meses, con cada parada en el suyo', async () => {
    const doc = await render({ season });
    const months = monthsOf(doc);
    expect(months).toHaveLength(12);
    expect(months[0].textContent).toContain('enero');
    expect(months[0].querySelector('[data-stop-id]')?.getAttribute('data-stop-id')).toBe('sevilla');
    expect(months[7].querySelector('[data-stop-id]')?.getAttribute('data-stop-id')).toBe('palmira');
    expect(months[9].querySelector('[data-stop-id]')?.getAttribute('data-stop-id')).toBe('yumbo');
  });

  it('dice "sin fechas" en los meses vacíos', async () => {
    const doc = await render({ season });
    const marzo = monthsOf(doc)[2];
    expect(marzo.querySelector('[data-stop-id]')).toBeNull();
    expect(marzo.textContent).toContain('Sin fechas');
  });

  it('llena el riel hasta hoy, mes por mes', async () => {
    const doc = await render({ season });
    const fills = monthsOf(doc).map((li) => li.querySelector('.season-track-fill'));
    // Enero a julio, completos: sin recorte.
    for (const fill of fills.slice(0, 7)) {
      expect(fill?.getAttribute('style')).not.toContain('clip-path');
    }
    // Agosto, hasta el 15 de 31 días.
    expect(fills[7]?.getAttribute('style')).toContain('clip-path:inset(0 51.61% 0 0');
    // De septiembre en adelante, vacíos.
    expect(fills.slice(8).every((fill) => fill === null)).toBe(true);
  });

  it('cada mes muestra su tramo del mismo degradado', async () => {
    const doc = await render({ season });
    const fills = monthsOf(doc).map((li) => li.querySelector('.season-track-fill'));
    expect(fills[0]?.getAttribute('style')).toContain('background-position:0% 0');
    expect(fills[7]?.getAttribute('style')).toContain('background-position:63.64% 0');
  });

  it('marca la próxima fecha y solo esa', async () => {
    const doc = await render({ season });
    const marcas = stopsOf(doc).filter((li) => li.textContent?.includes('Sigue'));
    expect(marcas).toHaveLength(1);
    expect(marcas[0].textContent).toContain('Roldanillo');
  });

  it('enlaza cada parada con el prefijo que se le pase', async () => {
    const doc = await render({ season, hrefBase: '/calendario#evento-' });
    expect([...doc.querySelectorAll('[data-stop-id] a')].map((a) => a.getAttribute('href'))).toEqual([
      '/calendario#evento-sevilla',
      '/calendario#evento-palmira',
      '/calendario#evento-roldanillo',
      '/calendario#evento-yumbo',
    ]);
  });

  it('nombra cada parada completa para lectores de pantalla', async () => {
    const doc = await render({ season });
    const label = doc.querySelector('[data-stop-id] a')?.getAttribute('aria-label');
    expect(label).toContain('I Válida Copa Valle 2026 - Sevilla');
    expect(label).toContain('31 de enero de 2026');
    expect(label).toContain('corrida');
  });

  it('anuncia la próxima en su nombre accesible, no solo con el rótulo visible', async () => {
    const doc = await render({ season });
    const label = doc.querySelector('[data-stop-id="roldanillo"] a')?.getAttribute('aria-label');
    expect(label).toContain('la próxima');
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
      const parada = stopsOf(doc)[2];
      expect(parada.textContent).toContain('Roldanillo');
      expect(parada.textContent).toContain('Cancelada');
      expect(parada.innerHTML).toContain('line-through');
    });

    it('no la anuncia como la próxima: esa pasa a ser la siguiente en pie', async () => {
      const doc = await render({ season: seasonCancelada });
      const marcas = stopsOf(doc).filter((li) => li.textContent?.includes('Sigue'));
      expect(marcas).toHaveLength(1);
      expect(marcas[0].textContent).toContain('Yumbo');
    });

    it('la nombra como cancelada para lectores de pantalla', async () => {
      const doc = await render({ season: seasonCancelada });
      const label = doc.querySelectorAll('[data-stop-id] a')[2].getAttribute('aria-label');
      expect(label).toContain('Roldanillo');
      expect(label).toContain('cancelada');
    });

    it('la descuenta en el conteo visible y en el figcaption', async () => {
      const doc = await render({ season: seasonCancelada });
      expect(doc.body.textContent).toContain('1 cancelada');
      expect(doc.querySelector('figcaption')?.textContent).toContain('Una fecha cancelada');
    });
  });

  it('no marca ninguna como la que sigue cuando ya no queda nada por correr', async () => {
    const doc = await render({ season: buildSeason(events, new Date('2026-12-01T17:00:00Z')) });
    expect(doc.body.textContent).not.toContain('Sigue');
  });

  it('cabe sin scroll horizontal ni JS', async () => {
    const doc = await render({ season });
    expect(doc.body.innerHTML).not.toContain('overflow-x-auto');
    expect(doc.querySelector('script')).toBeNull();
  });
});
