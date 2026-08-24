import { describe, it, expect } from 'vitest';
import {
  DEFAULT_POINTS_PER_ROUND,
  PODIUM_SIZE,
  MOVEMENT_LABELS,
  movementLabel,
  seriesName,
  buildStandings,
  summarizeStandings,
  type ResultEntry,
  type ResultPosition,
  type SeasonEventInput,
} from '../results';

/**
 * Todos los nombres de estos fixtures son ficticios a propósito: los
 * corredores del club son menores y qué se publica de ellos lo decide el club,
 * no una suite de tests.
 */

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Una válida, una categoría. `[nombre, posición, puntos?]` por llegada. */
const round = (
  event: string,
  date: string,
  category: string,
  arrivals: [string, number, number?][],
  eventName = `Válida Copa Valle 2026 - ${event}`,
): ResultEntry => ({
  id: `${event}-${category}`,
  data: {
    event,
    eventName,
    date: at(date),
    category,
    positions: arrivals.map(([riderName, position, points]) => {
      const arrival: ResultPosition = { position, riderName };
      if (points !== undefined) arrival.points = points;
      return arrival;
    }),
  },
});

const evento = (id: string, date: string, status?: string): SeasonEventInput => ({
  id,
  data: { title: `Válida ${id}`, date: at(date), city: id, status },
});

const NOW = at('2026-04-01');

/** Dos válidas corridas de una categoría, con movimiento en el tablero. */
const dosValidas: ResultEntry[] = [
  round('ginebra', '2026-02-15', 'Infantil A', [
    ['Ana Ejemplo', 1, 40],
    ['Bruno Ejemplo', 2, 35],
    ['Carla Ejemplo', 3, 32],
    ['Diego Ejemplo', 4, 30],
  ]),
  round('palmira', '2026-03-15', 'Infantil A', [
    ['Carla Ejemplo', 1, 40],
    ['Ana Ejemplo', 2, 35],
    ['Elena Ejemplo', 3, 32],
    ['Bruno Ejemplo', 5, 28],
  ]),
];

const findRider = (standings: ReturnType<typeof buildStandings>, category: string, name: string) =>
  standings.categories
    .find((c) => c.category === category)
    ?.riders.find((r) => r.riderName === name);

// ============================================================
// Agregación multi-válida
// ============================================================

describe('buildStandings — agregación', () => {
  const standings = buildStandings(dosValidas, { now: NOW });

  it('suma los puntos de todas las válidas por corredor', () => {
    expect(findRider(standings, 'Infantil A', 'Ana Ejemplo')?.total).toBe(75);
    expect(findRider(standings, 'Infantil A', 'Carla Ejemplo')?.total).toBe(72);
    expect(findRider(standings, 'Infantil A', 'Bruno Ejemplo')?.total).toBe(63);
  });

  it('separa lo ganado en la última válida del total previo', () => {
    const ana = findRider(standings, 'Infantil A', 'Ana Ejemplo');
    expect(ana?.lastGain).toBe(35);
    expect(ana?.previousTotal).toBe(40);
    expect((ana?.previousTotal ?? 0) + (ana?.lastGain ?? 0)).toBe(ana?.total);
  });

  it('ordena por total descendente dentro de la categoría', () => {
    const riders = standings.categories[0].riders.map((r) => r.riderName);
    expect(riders).toEqual([
      'Ana Ejemplo',
      'Carla Ejemplo',
      'Bruno Ejemplo',
      'Elena Ejemplo',
      'Diego Ejemplo',
    ]);
    expect(standings.categories[0].riders.map((r) => r.position)).toEqual([1, 2, 3, 4, 5]);
  });

  it('cuenta cuántas válidas corrió cada corredor', () => {
    expect(findRider(standings, 'Infantil A', 'Ana Ejemplo')?.rounds).toBe(2);
    expect(findRider(standings, 'Infantil A', 'Elena Ejemplo')?.rounds).toBe(1);
  });

  it('la última válida es la de fecha más reciente, no la última del arreglo', () => {
    const desordenado = [dosValidas[1], dosValidas[0]];
    const result = buildStandings(desordenado, { now: NOW });
    expect(result.latest?.event).toBe('palmira');
    expect(result.rounds.map((r) => r.event)).toEqual(['ginebra', 'palmira']);
    expect(result.roundsCounted).toBe(2);
  });

  it('dos archivos de la misma válida con fechas distintas: manda la primera', () => {
    const result = buildStandings(
      [
        round('ginebra', '2026-02-16', 'Infantil A', [['Ana Ejemplo', 1, 40]]),
        round('ginebra', '2026-02-15', 'Prejuvenil B', [['Felipe Ejemplo', 1, 40]]),
      ],
      { now: NOW },
    );
    expect(result.rounds).toHaveLength(1);
    expect(result.rounds[0].date).toEqual(at('2026-02-15'));
  });

  it('un corredor sin points suma 0 por esa válida, no desaparece del tablero', () => {
    const sinPuntos = [
      dosValidas[0],
      round('palmira', '2026-03-15', 'Infantil A', [
        ['Ana Ejemplo', 1, 40],
        ['Diego Ejemplo', 2],
      ]),
    ];
    const result = buildStandings(sinPuntos, { now: NOW });
    const diego = findRider(result, 'Infantil A', 'Diego Ejemplo');
    expect(diego?.lastGain).toBe(0);
    expect(diego?.total).toBe(30);
    expect(diego?.rounds).toBe(2);
  });

  it('agrupa por nombre + categoría, sin importar acentos ni espacios de más', () => {
    const result = buildStandings(
      [
        round('ginebra', '2026-02-15', 'Infantil A', [['Ana Ejemplo', 1, 40]]),
        round('palmira', '2026-03-15', 'infantil  a', [['ana ejemplo', 1, 40]]),
      ],
      { now: NOW },
    );
    expect(result.categories).toHaveLength(1);
    expect(result.categories[0].riders).toHaveLength(1);
    expect(result.categories[0].riders[0].total).toBe(80);
    // Se conserva la primera forma escrita en el contenido.
    expect(result.categories[0].category).toBe('Infantil A');
    expect(result.categories[0].riders[0].riderName).toBe('Ana Ejemplo');
  });

  it('el mismo nombre en otra categoría es otro corredor', () => {
    const result = buildStandings(
      [
        round('ginebra', '2026-02-15', 'Infantil A', [['Ana Ejemplo', 1, 40]]),
        round('ginebra-b', '2026-02-15', 'Prejuvenil B', [['Ana Ejemplo', 1, 40]]),
      ],
      { now: NOW },
    );
    expect(result.categories.map((c) => c.category)).toEqual(['Infantil A', 'Prejuvenil B']);
    expect(result.categories.every((c) => c.riders[0].total === 40)).toBe(true);
  });

  it('conserva el slug del corredor aunque solo venga en una válida', () => {
    const conSlug: ResultEntry = {
      id: 'palmira-infantil-a',
      data: {
        event: 'palmira',
        eventName: 'II Válida Copa Valle 2026 - Palmira',
        date: at('2026-03-15'),
        category: 'Infantil A',
        positions: [{ position: 1, riderName: 'Ana Ejemplo', rider: 'ana-ejemplo', points: 40 }],
      },
    };
    const result = buildStandings([dosValidas[0], conSlug], { now: NOW });
    expect(findRider(result, 'Infantil A', 'Ana Ejemplo')?.rider).toBe('ana-ejemplo');
    expect(findRider(result, 'Infantil A', 'Bruno Ejemplo')?.rider).toBeNull();
  });

  it('sin resultados devuelve un tablero vacío y sin año', () => {
    const result = buildStandings([], { now: NOW });
    expect(result.categories).toEqual([]);
    expect(result.rounds).toEqual([]);
    expect(result.latest).toBeNull();
    expect(result.year).toBeNull();
    expect(result.series).toBeNull();
  });
});

// ============================================================
// Movimiento respecto al tablero anterior
// ============================================================

describe('buildStandings — movimiento', () => {
  const standings = buildStandings(dosValidas, { now: NOW });

  it('sube quien mejora su puesto en la última válida', () => {
    const carla = findRider(standings, 'Infantil A', 'Carla Ejemplo');
    expect(carla?.previousPosition).toBe(3);
    expect(carla?.position).toBe(2);
    expect(carla?.movement).toEqual({ direction: 'up', places: 1 });
  });

  it('baja quien pierde puestos', () => {
    const bruno = findRider(standings, 'Infantil A', 'Bruno Ejemplo');
    expect(bruno?.previousPosition).toBe(2);
    expect(bruno?.position).toBe(3);
    expect(bruno?.movement).toEqual({ direction: 'down', places: 1 });
  });

  it('mantiene quien conserva su puesto', () => {
    const ana = findRider(standings, 'Infantil A', 'Ana Ejemplo');
    expect(ana?.previousPosition).toBe(1);
    expect(ana?.movement).toEqual({ direction: 'same', places: 0 });
  });

  it('quien debuta en la última válida es nuevo, no "sube"', () => {
    const elena = findRider(standings, 'Infantil A', 'Elena Ejemplo');
    expect(elena?.previousPosition).toBeNull();
    expect(elena?.movement).toEqual({ direction: 'new', places: 0 });
  });

  it('con una sola válida todo el tablero es nuevo', () => {
    const result = buildStandings([dosValidas[0]], { now: NOW });
    expect(result.categories[0].riders.every((r) => r.movement.direction === 'new')).toBe(true);
    expect(result.categories[0].riders.every((r) => r.previousTotal === 0)).toBe(true);
  });

  it('quien no corre la última válida sigue en el tablero y puede caer varios puestos', () => {
    const result = buildStandings(
      [
        round('ginebra', '2026-02-15', 'Infantil A', [
          ['Ana Ejemplo', 1, 40],
          ['Bruno Ejemplo', 2, 35],
          ['Carla Ejemplo', 3, 30],
        ]),
        round('palmira', '2026-03-15', 'Infantil A', [
          ['Bruno Ejemplo', 1, 40],
          ['Carla Ejemplo', 2, 35],
        ]),
      ],
      { now: NOW },
    );
    const ana = findRider(result, 'Infantil A', 'Ana Ejemplo');
    expect(ana?.lastGain).toBe(0);
    expect(ana?.position).toBe(3);
    expect(ana?.movement).toEqual({ direction: 'down', places: 2 });
  });
});

// ============================================================
// Empates
// ============================================================

describe('buildStandings — empates', () => {
  it('con el mismo total va primero quien acumule mejores puestos', () => {
    const result = buildStandings(
      [
        round('ginebra', '2026-02-15', 'Infantil A', [
          ['Ana Ejemplo', 1, 40],
          ['Bruno Ejemplo', 2, 30],
        ]),
        round('palmira', '2026-03-15', 'Infantil A', [
          ['Bruno Ejemplo', 1, 40],
          ['Ana Ejemplo', 5, 30],
        ]),
      ],
      { now: NOW },
    );
    const [primero, segundo] = result.categories[0].riders;
    expect(primero.total).toBe(segundo.total);
    // Bruno: 1.º + 2.º = 3; Ana: 1.º + 5.º = 6.
    expect(primero.riderName).toBe('Bruno Ejemplo');
    expect(primero.placingSum).toBe(3);
    expect(segundo.placingSum).toBe(6);
  });

  it('el tablero anterior desempata con el mismo criterio', () => {
    const result = buildStandings(
      [
        round('ginebra', '2026-02-15', 'Infantil A', [
          ['Ana Ejemplo', 1, 30],
          ['Bruno Ejemplo', 1, 30],
          ['Carla Ejemplo', 3, 10],
        ]),
        round('palmira', '2026-03-15', 'Infantil A', [
          ['Carla Ejemplo', 1, 40],
          ['Ana Ejemplo', 2, 20],
          ['Bruno Ejemplo', 3, 5],
        ]),
      ],
      { now: NOW },
    );

    // Antes de Palmira: Ana y Bruno empatados en 30 y en puestos (el nombre
    // ordena); Carla, tercera con 10.
    expect(findRider(result, 'Infantil A', 'Ana Ejemplo')?.previousPosition).toBe(1);
    expect(findRider(result, 'Infantil A', 'Bruno Ejemplo')?.previousPosition).toBe(2);
    expect(findRider(result, 'Infantil A', 'Carla Ejemplo')?.previousPosition).toBe(3);

    // Después: Ana y Carla empatan en 50 y gana Ana por mejores puestos.
    expect(result.categories[0].riders.map((r) => r.riderName)).toEqual([
      'Ana Ejemplo',
      'Carla Ejemplo',
      'Bruno Ejemplo',
    ]);
    expect(findRider(result, 'Infantil A', 'Carla Ejemplo')?.movement).toEqual({
      direction: 'up',
      places: 1,
    });
  });

  it('empatados también en puestos, ordena el nombre para que el build sea estable', () => {
    const result = buildStandings(
      [
        round('ginebra', '2026-02-15', 'Infantil A', [
          ['Bruno Ejemplo', 1, 40],
          ['Ana Ejemplo', 1, 40],
        ]),
      ],
      { now: NOW },
    );
    expect(result.categories[0].riders.map((r) => r.riderName)).toEqual([
      'Ana Ejemplo',
      'Bruno Ejemplo',
    ]);
  });
});

// ============================================================
// Línea de podio
// ============================================================

describe('buildStandings — línea de podio', () => {
  const standings = buildStandings(dosValidas, { now: NOW });

  it('la línea son los puntos del tercero de la categoría', () => {
    expect(PODIUM_SIZE).toBe(3);
    expect(standings.categories[0].podiumPoints).toBe(63);
    expect(standings.categories[0].riders[2].total).toBe(63);
  });

  it('marca en podio a los tres primeros y solo a ellos', () => {
    expect(standings.categories[0].riders.map((r) => r.inPodium)).toEqual([
      true,
      true,
      true,
      false,
      false,
    ]);
  });

  it('dice cuántos puntos faltan para entrar al podio', () => {
    const riders = standings.categories[0].riders;
    expect(riders[0].pointsToPodium).toBe(0);
    // Elena tiene 32 y la línea está en 63.
    expect(riders[3].pointsToPodium).toBe(31);
  });

  it('sin tres corredores no hay línea que dibujar', () => {
    const result = buildStandings(
      [
        round('ginebra', '2026-02-15', 'Infantil A', [
          ['Ana Ejemplo', 1, 40],
          ['Bruno Ejemplo', 2, 35],
        ]),
      ],
      { now: NOW },
    );
    expect(result.categories[0].podiumPoints).toBeNull();
    expect(result.categories[0].riders.every((r) => r.pointsToPodium === 0)).toBe(true);
  });
});

// ============================================================
// Escala del tablero
// ============================================================

describe('buildStandings — escala', () => {
  const temporada = [
    evento('ginebra', '2026-02-15'),
    evento('palmira', '2026-03-15'),
    evento('cali', '2026-05-10'),
    evento('roldanillo', '2026-07-12'),
    evento('tulua', '2026-09-06'),
    evento('buga', '2026-11-08'),
  ];

  it('el máximo es todas las válidas del año al mejor puntaje observado', () => {
    const result = buildStandings(dosValidas, { events: temporada, now: NOW });
    expect(result.pointsPerRound).toBe(40);
    expect(result.seasonRounds).toBe(6);
    expect(result.roundsCounted).toBe(2);
    expect(result.remainingRounds).toBe(4);
    expect(result.boardMax).toBe(240);
    expect(result.reach).toBe(160);
    expect(result.year).toBe(2026);
  });

  it('una fecha cancelada no suma al máximo ni a lo que queda en juego', () => {
    const conCancelada = [...temporada.slice(0, 5), evento('buga', '2026-11-08', 'cancelled')];
    const result = buildStandings(dosValidas, { events: conCancelada, now: NOW });
    expect(result.seasonRounds).toBe(5);
    expect(result.remainingRounds).toBe(3);
    expect(result.boardMax).toBe(200);
    expect(result.reach).toBe(120);
  });

  it('sin eventos se escala con las válidas corridas y no queda nada en juego', () => {
    const result = buildStandings(dosValidas, { now: NOW });
    expect(result.seasonRounds).toBe(2);
    expect(result.remainingRounds).toBe(0);
    expect(result.reach).toBe(0);
    expect(result.boardMax).toBe(80);
    // El año sale de la última válida cuando no hay calendario que consultar.
    expect(result.year).toBe(2026);
  });

  it('sin ningún points usa el puntaje de referencia', () => {
    const result = buildStandings(
      [round('ginebra', '2026-02-15', 'Infantil A', [['Ana Ejemplo', 1]])],
      { events: temporada, now: NOW },
    );
    expect(DEFAULT_POINTS_PER_ROUND).toBe(40);
    expect(result.pointsPerRound).toBe(DEFAULT_POINTS_PER_ROUND);
    expect(result.boardMax).toBe(240);
  });

  it('la escala nunca queda por debajo de un total real', () => {
    // Una sola válida que repartió 100 puntos: la barra no puede salirse.
    const result = buildStandings(
      [round('ginebra', '2026-02-15', 'Infantil A', [['Ana Ejemplo', 1, 100]])],
      { now: NOW },
    );
    expect(result.boardMax).toBeGreaterThanOrEqual(100);
  });

  it('más válidas puntuadas que fechas en el calendario no deja restantes negativas', () => {
    const result = buildStandings(dosValidas, { events: [temporada[0]], now: NOW });
    expect(result.seasonRounds).toBe(2);
    expect(result.remainingRounds).toBe(0);
  });
});

// ============================================================
// Nombre de la serie
// ============================================================

describe('seriesName', () => {
  it('extrae el tramo común descartando la numeración de la fecha', () => {
    expect(
      seriesName([
        'I Válida Copa Valle 2026 - Ginebra',
        'VI Válida Copa Valle 2026 - Roldanillo',
        '3 Válida Copa Valle 2026 - Palmira',
      ]),
    ).toBe('Copa Valle');
  });

  it('con una sola válida no infiere nada: el nombre de una carrera no es la serie', () => {
    expect(seriesName(['I Válida Copa Valle 2026 - Ginebra'])).toBeNull();
    expect(seriesName([])).toBeNull();
  });

  it('sin al menos dos palabras comunes devuelve null', () => {
    expect(seriesName(['Clásica de Yumbo', 'Vuelta al Valle'])).toBeNull();
  });

  it('no da por común una palabra que solo está contenida en otra', () => {
    // "Copa Valle" no puede casar dentro de "Copa Vallecaucana": la comparación
    // es por palabras completas, así que aquí no hay serie que afirmar.
    expect(seriesName(['Copa Valle Ginebra', 'Copa Vallecaucana Ginebra'])).toBeNull();
  });

  it('el tablero deriva la serie de sus válidas', () => {
    const result = buildStandings(
      [
        round(
          'ginebra',
          '2026-02-15',
          'Infantil A',
          [['Ana Ejemplo', 1, 40]],
          'I Válida Copa Valle 2026 - Ginebra',
        ),
        round(
          'palmira',
          '2026-03-15',
          'Infantil A',
          [['Ana Ejemplo', 1, 40]],
          'II Válida Copa Valle 2026 - Palmira',
        ),
      ],
      { now: NOW },
    );
    expect(result.series).toBe('Copa Valle');
  });
});

// ============================================================
// Etiquetas de movimiento
// ============================================================

describe('movementLabel', () => {
  it('cada dirección lleva flecha y verbo, nunca solo color', () => {
    for (const direction of ['up', 'down', 'same', 'new'] as const) {
      expect(MOVEMENT_LABELS[direction].glyph).not.toBe('');
      expect(MOVEMENT_LABELS[direction].verb).not.toBe('');
    }
  });

  it('concuerda el número de puestos', () => {
    expect(movementLabel({ direction: 'up', places: 1 })).toBe('Sube 1 puesto');
    expect(movementLabel({ direction: 'up', places: 3 })).toBe('Sube 3 puestos');
    expect(movementLabel({ direction: 'down', places: 2 })).toBe('Baja 2 puestos');
  });

  it('mantener y debutar no llevan número', () => {
    expect(movementLabel({ direction: 'same', places: 0 })).toBe('Mantiene');
    expect(movementLabel({ direction: 'new', places: 0 })).toBe('Nuevo en el tablero');
  });
});

// ============================================================
// Resumen
// ============================================================

describe('summarizeStandings', () => {
  it('devuelve null sin resultados: sin datos la sección no se pinta', () => {
    expect(summarizeStandings([], { now: NOW })).toBeNull();
    expect(
      summarizeStandings([], { events: [evento('ginebra', '2026-02-15')], now: NOW }),
    ).toBeNull();
  });

  it('devuelve null cuando las válidas cargadas no tienen ninguna llegada', () => {
    expect(
      summarizeStandings([round('ginebra', '2026-02-15', 'Infantil A', [])], { now: NOW }),
    ).toBeNull();
  });

  it('cuenta corredores, categorías, válidas y podios', () => {
    const summary = summarizeStandings(
      [
        ...dosValidas,
        round('ginebra-b', '2026-02-15', 'Prejuvenil B', [
          ['Felipe Ejemplo', 1, 40],
          ['Gabriela Ejemplo', 2, 35],
        ]),
      ],
      { events: [evento('ginebra', '2026-02-15'), evento('palmira', '2026-03-15')], now: NOW },
    );

    expect(summary).not.toBeNull();
    expect(summary!.riders).toBe(7);
    expect(summary!.categories).toBe(2);
    expect(summary!.rounds).toBe(3);
    expect(summary!.remaining).toBe(0);
    // Tres en Infantil A (hay tercero) y dos en Prejuvenil B (no hay tercero).
    expect(summary!.inPodium).toBe(5);
    expect(summary!.year).toBe(2026);
    expect(summary!.latest?.event).toBe('palmira');
  });

  it('expone el tablero completo para pintarlo', () => {
    const summary = summarizeStandings(dosValidas, { now: NOW });
    expect(summary!.standings.categories[0].riders[0].riderName).toBe('Ana Ejemplo');
    expect(summary!.series).toBe(summary!.standings.series);
  });
});
