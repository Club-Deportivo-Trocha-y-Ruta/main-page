import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SeasonStandings from '../SeasonStandings.astro';
import type { ResultEntry, SeasonEventInput } from '@lib/results';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Nombres ficticios: los corredores del club son menores. */
const results: ResultEntry[] = [
  {
    id: 'ginebra-infantil-a',
    data: {
      event: 'ginebra',
      eventName: 'I Válida Copa Valle 2026 - Ginebra',
      date: at('2026-02-15'),
      category: 'Infantil A',
      positions: [
        { position: 1, riderName: 'Ana Ejemplo', points: 40 },
        { position: 2, riderName: 'Bruno Ejemplo', points: 35 },
        { position: 3, riderName: 'Carla Ejemplo', points: 32 },
        { position: 4, riderName: 'Diego Ejemplo', points: 30 },
      ],
    },
  },
  {
    id: 'palmira-infantil-a',
    data: {
      event: 'palmira',
      eventName: 'II Válida Copa Valle 2026 - Palmira',
      date: at('2026-03-15'),
      category: 'Infantil A',
      positions: [
        { position: 1, riderName: 'Carla Ejemplo', points: 40 },
        { position: 2, riderName: 'Ana Ejemplo', points: 35 },
        { position: 3, riderName: 'Elena Ejemplo', points: 32 },
        { position: 5, riderName: 'Bruno Ejemplo', points: 28 },
      ],
    },
  },
];

/** Cuatro fechas del mismo año: `buildSeason()` no depende del reloj aquí. */
const events: SeasonEventInput[] = [
  { id: 'ginebra', data: { title: 'Válida Ginebra', date: at('2026-02-15'), city: 'Ginebra' } },
  { id: 'palmira', data: { title: 'Válida Palmira', date: at('2026-03-15'), city: 'Palmira' } },
  { id: 'tulua', data: { title: 'Válida Tuluá', date: at('2026-05-10'), city: 'Tuluá' } },
  { id: 'buga', data: { title: 'Válida Buga', date: at('2026-07-12'), city: 'Buga' } },
];

describe('SeasonStandings', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(SeasonStandings, { props }).then(parseHtml);

  it('no pinta nada sin resultados: la sección entera desaparece', async () => {
    const doc = await render({ results: [], events });
    expect(doc.querySelector('section')).toBeNull();
    expect(doc.body.textContent?.trim()).toBe('');
  });

  it('nombra la sección con su titular y deriva la serie de las válidas', async () => {
    const doc = await render({ results, events });
    const section = doc.querySelector('section[aria-labelledby="tablero-titulo"]');
    expect(section).not.toBeNull();
    const heading = doc.querySelector('#tablero-titulo');
    expect(heading?.textContent?.replace(/\s+/g, ' ').trim()).toBe('Así va la Copa Valle');
    expect(doc.body.textContent).toContain('Temporada 2026');
  });

  it('pinta una fila por corredor, con nombre, categoría y posición', async () => {
    const doc = await render({ results, events });
    const rows = [...doc.querySelectorAll('.board__row')];
    expect(rows).toHaveLength(5);

    const names = rows.map((row) => row.querySelector('.board__name')?.textContent?.trim());
    expect(names).toEqual([
      'Ana Ejemplo',
      'Carla Ejemplo',
      'Bruno Ejemplo',
      'Elena Ejemplo',
      'Diego Ejemplo',
    ]);

    const meta = rows[0].querySelector('.board__meta')?.textContent?.replace(/\s+/g, ' ').trim();
    expect(meta).toBe('Infantil A · 1.º');
  });

  it('el movimiento lleva flecha y verbo, nunca solo color', async () => {
    const doc = await render({ results, events });
    const chips = [...doc.querySelectorAll('.board__move')].map((chip) =>
      chip.textContent?.replace(/\s+/g, ' ').trim()
    );
    expect(chips).toEqual([
      '— Mantiene',
      '▲ Sube 1 puesto',
      '▼ Baja 1 puesto',
      '＋ Nuevo en el tablero',
      '▼ Baja 1 puesto',
    ]);

    const directions = [...doc.querySelectorAll('.board__move')].map(
      (chip) => [...chip.classList].find((c) => c.startsWith('board__move--'))
    );
    expect(directions).toEqual([
      'board__move--same',
      'board__move--up',
      'board__move--down',
      'board__move--new',
      'board__move--down',
    ]);
  });

  it('marca la zona de podio y deja el resto sin marcar', async () => {
    const doc = await render({ results, events });
    const podium = [...doc.querySelectorAll('.board__row')].map((row) =>
      row.classList.contains('board__row--podium')
    );
    expect(podium).toEqual([true, true, true, false, false]);
  });

  it('la escala y los puntos viajan en custom properties, no en porcentajes', async () => {
    const doc = await render({ results, events });
    // 4 válidas × 40 puntos = 160; quedan 2 por correr = 80 en juego.
    expect(doc.querySelector('.board')?.getAttribute('style')).toBe(
      '--board-max:160; --reach:80'
    );
    const first = doc.querySelector('.board__row')?.getAttribute('style');
    expect(first).toBe('--pts:75; --pts-prev:40; --podio:63');
  });

  it('la pista es decorativa y el dato vive en texto', async () => {
    const doc = await render({ results, events });
    const track = doc.querySelector('.board__track');
    expect(track?.getAttribute('aria-hidden')).toBe('true');
    expect(track?.querySelector('.board__reach')).not.toBeNull();
    expect(track?.querySelector('.board__podium')).not.toBeNull();

    const row = doc.querySelector('.board__row');
    expect(row?.querySelector('.board__total-value')?.textContent).toContain('75');
    expect(row?.querySelector('.board__total-gain')?.textContent?.trim()).toBe('+35 en esta');
  });

  it('sin calendario no hay zona en juego ni clave de leyenda para ella', async () => {
    const doc = await render({ results });
    expect(doc.querySelector('.board')?.getAttribute('style')).toBe('--board-max:80; --reach:0');
    expect(doc.querySelector('.board__reach')).toBeNull();
    expect(doc.querySelector('.board__key--reach')).toBeNull();
    expect(doc.body.textContent).toContain('la temporada está corrida');
  });

  it('cierra con la leyenda y el paso siguiente al calendario', async () => {
    const doc = await render({ results, events });
    const legend = doc.querySelector('.board__legend');
    expect(legend?.querySelectorAll('span > .board__key')).toHaveLength(5);

    const link = doc.querySelector('a[href="/calendario"]');
    expect(link).not.toBeNull();
    expect(link?.textContent).toContain('calendario');
  });

  it('agrupa por categoría, cada una con su propio titular', async () => {
    const doc = await render({
      results: [
        ...results,
        {
          id: 'ginebra-prejuvenil-b',
          data: {
            event: 'ginebra',
            eventName: 'I Válida Copa Valle 2026 - Ginebra',
            date: at('2026-02-15'),
            category: 'Prejuvenil B',
            positions: [{ position: 1, riderName: 'Felipe Ejemplo', points: 40 }],
          },
        },
      ],
      events,
    });

    const headings = [...doc.querySelectorAll('h3')].map((h) => h.textContent?.trim());
    expect(headings).toEqual(['Infantil A', 'Prejuvenil B']);

    const groups = [...doc.querySelectorAll('section[aria-labelledby^="tablero-"]')].filter(
      (section) => section.getAttribute('aria-labelledby') !== 'tablero-titulo'
    );
    expect(groups.map((s) => s.getAttribute('aria-labelledby'))).toEqual([
      'tablero-infantil-a',
      'tablero-prejuvenil-b',
    ]);
  });
});
