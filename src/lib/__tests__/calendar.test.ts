import { describe, it, expect } from 'vitest';
import {
  resolveEventStatus,
  buildSeason,
  cancelledAhead,
  clubToday,
  clubTimeOfDay,
  eventDay,
  dayLabel,
  monthShort,
  getEventCategory,
  getEventLevel,
  getEventStatusLabel,
  eventSlug,
  eventPath,
  formatCop,
  EVENT_CATEGORIES,
} from '../calendar';

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

const evento = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: { title: `Válida ${id}`, date: at(date), ...extra },
});

// ============================================================
// Estado derivado de la fecha
// ============================================================

describe('resolveEventStatus', () => {
  // Mediodía en Colombia: bien lejos de los bordes del día.
  const hoy = new Date('2026-08-15T17:00:00Z');

  it('marca como corrido lo que ya pasó', () => {
    expect(resolveEventStatus({ date: at('2026-08-01') }, hoy)).toBe('past');
  });

  it('marca como próximo lo que falta', () => {
    expect(resolveEventStatus({ date: at('2026-09-26') }, hoy)).toBe('upcoming');
  });

  it('marca como en curso el evento de hoy', () => {
    expect(resolveEventStatus({ date: at('2026-08-15') }, hoy)).toBe('ongoing');
  });

  it('mantiene en curso un evento de varios días mientras dure', () => {
    const varios = { date: at('2026-08-14'), endDate: at('2026-08-16') };
    expect(resolveEventStatus(varios, hoy)).toBe('ongoing');
    expect(resolveEventStatus(varios, new Date('2026-08-17T17:00:00Z'))).toBe('past');
  });

  it('ignora el status del frontmatter cuando la fecha lo contradice', () => {
    // Es justo el caso que se pudría: nadie volvió a editar el archivo.
    expect(resolveEventStatus({ date: at('2026-08-01'), status: 'upcoming' }, hoy)).toBe('past');
  });

  it('respeta cancelado, que no se puede deducir de la fecha', () => {
    expect(resolveEventStatus({ date: at('2026-09-26'), status: 'cancelled' }, hoy)).toBe(
      'cancelled',
    );
  });

  it('usa el día del club, no el UTC, en la madrugada', () => {
    // 2026-09-26T02:00Z todavía es 25 de septiembre en Colombia (UTC-5):
    // la válida del 26 sigue siendo "próxima", no "en curso".
    const madrugada = new Date('2026-09-26T02:00:00Z');
    expect(clubToday(madrugada)).toBe('2026-09-25');
    expect(resolveEventStatus({ date: at('2026-09-26') }, madrugada)).toBe('upcoming');
  });

  it('lee el día del evento en UTC, tal como se escribió', () => {
    expect(eventDay(at('2026-01-31'))).toBe('2026-01-31');
  });
});

describe('clubTimeOfDay', () => {
  it('da la hora del club en 24 horas y con ceros a la izquierda', () => {
    // Colombia va cinco horas atrás de UTC y no cambia de hora en el año.
    expect(clubTimeOfDay(new Date('2026-08-26T21:05:00Z'))).toBe('16:05');
    expect(clubTimeOfDay(new Date('2026-08-27T05:00:00Z'))).toBe('00:00');
  });

  it('ordena como texto, que es para lo que se usa', () => {
    const manana = clubTimeOfDay(new Date('2026-08-26T12:00:00Z'));
    const tarde = clubTimeOfDay(new Date('2026-08-26T21:00:00Z'));
    expect(manana < tarde).toBe(true);
  });
});

// ============================================================
// Etiquetas
// ============================================================

describe('etiquetas', () => {
  it('traduce la sigla de la disciplina', () => {
    expect(getEventCategory('xco').short).toBe('XCO');
    expect(getEventCategory('xco').label).toBe('Cross Country olímpico');
  });

  it('cae en XCO ante una categoría desconocida', () => {
    expect(getEventCategory('gravel')).toBe(EVENT_CATEGORIES.xco);
  });

  it('traduce el nivel y devuelve null si no lo conoce', () => {
    expect(getEventLevel('departamental')).toBe('Departamental');
    expect(getEventLevel('interno')).toBe('Interno del club');
    expect(getEventLevel('galactico')).toBeNull();
    expect(getEventLevel(undefined)).toBeNull();
  });

  it('rotula el estado con acento', () => {
    expect(getEventStatusLabel('upcoming')).toBe('Próximo');
    expect(getEventStatusLabel('past')).toBe('Corrido');
  });
});

describe('fechas legibles', () => {
  it('junta el rango cuando el evento cabe en un mes', () => {
    expect(dayLabel(at('2026-08-01'), at('2026-08-02'))).toBe('1-2');
    expect(dayLabel(at('2026-09-26'))).toBe('26');
  });

  it('no junta el rango si cruza de mes', () => {
    expect(dayLabel(at('2026-07-31'), at('2026-08-02'))).toBe('31');
  });

  it('abrevia el mes sin punto', () => {
    expect(monthShort(at('2026-09-26'))).toBe('sept');
    expect(monthShort(at('2026-01-31'))).not.toContain('.');
  });
});

// ============================================================
// La temporada
// ============================================================

describe('buildSeason', () => {
  const hoy = new Date('2026-08-15T17:00:00Z');
  const temporada = [
    evento('sevilla', '2026-01-31', { city: 'Sevilla' }),
    evento('ginebra', '2026-02-28', { city: 'Ginebra' }),
    evento('palmira', '2026-08-01', { city: 'Palmira', endDate: at('2026-08-02') }),
    evento('roldanillo', '2026-09-26', { city: 'Roldanillo' }),
  ];

  it('ordena las paradas por fecha y las etiqueta con la ciudad', () => {
    const season = buildSeason(temporada, hoy);
    expect(season.stops.map((s) => s.label)).toEqual([
      'Sevilla',
      'Ginebra',
      'Palmira',
      'Roldanillo',
    ]);
    expect(season.stops[2].day).toBe('1-2');
  });

  it('cuenta lo corrido y calcula el avance', () => {
    const season = buildSeason(temporada, hoy);
    expect(season.completed).toBe(3);
    expect(season.total).toBe(4);
    expect(season.progressPct).toBe(75);
  });

  it('señala la próxima parada', () => {
    expect(buildSeason(temporada, hoy).next?.id).toBe('roldanillo');
  });

  it('deja la barra llena cuando la temporada terminó', () => {
    const season = buildSeason(temporada, new Date('2026-12-01T17:00:00Z'));
    expect(season.progressPct).toBe(100);
    expect(season.next).toBeNull();
  });

  it('reparte los puntos en el centro de su tramo', () => {
    const { stops } = buildSeason(temporada, hoy);
    expect(stops[0].pct).toBe(12.5);
    expect(stops[3].pct).toBe(87.5);
    // El avance cae justo entre la última corrida y la que sigue.
    expect(buildSeason(temporada, hoy).progressPct).toBeGreaterThan(stops[2].pct);
    expect(buildSeason(temporada, hoy).progressPct).toBeLessThan(stops[3].pct);
  });

  it('usa el año en curso y deja fuera los demás', () => {
    const season = buildSeason([...temporada, evento('vieja', '2025-05-05')], hoy);
    expect(season.year).toBe(2026);
    expect(season.stops).toHaveLength(4);
  });

  it('muestra la temporada más reciente cuando el año en curso aún no tiene fechas', () => {
    const season = buildSeason(temporada, new Date('2027-01-10T17:00:00Z'));
    expect(season.year).toBe(2026);
    expect(season.stops).toHaveLength(4);
  });

  it('cuenta las canceladas aparte, sin sacarlas del riel', () => {
    const conCancelada = [
      ...temporada.slice(0, 3),
      evento('roldanillo', '2026-09-26', { city: 'Roldanillo', status: 'cancelled' }),
    ];
    const season = buildSeason(conCancelada, hoy);
    expect(season.cancelled).toBe(1);
    // Sigue siendo una parada del riel: la fecha existió y la gente la tenía anotada.
    expect(season.stops).toHaveLength(4);
    expect(season.stops[3].status).toBe('cancelled');
    // Y no puede ser "la próxima": esa fecha ya no se corre.
    expect(season.next).toBeNull();
  });

  it('no cuenta canceladas cuando no las hay', () => {
    expect(buildSeason(temporada, hoy).cancelled).toBe(0);
  });

  it('no se cae sin eventos', () => {
    const season = buildSeason([], hoy);
    expect(season.stops).toEqual([]);
    expect(season.progressPct).toBe(0);
    expect(season.next).toBeNull();
  });
});

// ============================================================
// Canceladas que todavía no pasaron
// ============================================================

describe('cancelledAhead', () => {
  const hoy = new Date('2026-08-15T17:00:00Z');
  const eventos = [
    evento('sevilla', '2026-01-31', { city: 'Sevilla' }),
    evento('cali', '2026-05-10', { city: 'Cali', status: 'cancelled' }),
    evento('palmira', '2026-08-01', { city: 'Palmira' }),
    evento('roldanillo', '2026-09-26', { city: 'Roldanillo', status: 'cancelled' }),
  ];

  it('deja solo las canceladas que faltan, en orden', () => {
    expect(cancelledAhead(eventos, hoy).map((e) => e.id)).toEqual(['roldanillo']);
  });

  it('conserva la cancelada del día mismo hasta que termine el día del club', () => {
    // 2026-09-26T00:00Z ya es "pasado" según Date.now() desde las 7 p.m. del
    // 25 en Bogotá: el corte va por día, no por milisegundos.
    const enLaNoche = new Date('2026-09-26T02:00:00Z');
    expect(cancelledAhead(eventos, enLaNoche).map((e) => e.id)).toEqual(['roldanillo']);
    expect(cancelledAhead(eventos, new Date('2026-09-27T17:00:00Z'))).toEqual([]);
  });

  it('respeta la fecha de cierre de las canceladas de varios días', () => {
    const larga = [
      evento('nacional', '2026-08-14', { endDate: at('2026-08-16'), status: 'cancelled' }),
    ];
    expect(cancelledAhead(larga, hoy)).toHaveLength(1);
  });

  it('no se limita al año de la temporada en curso', () => {
    const otroAno = [evento('2027', '2027-03-01', { status: 'cancelled' })];
    expect(cancelledAhead(otroAno, hoy)).toHaveLength(1);
  });

  it('no devuelve nada sin canceladas', () => {
    expect(cancelledAhead([evento('palmira', '2026-09-01')], hoy)).toEqual([]);
  });
});

// ============================================================
// La ficha de cada fecha
// ============================================================

describe('eventSlug / eventPath', () => {
  it('prefiere el urlSlug del frontmatter sobre el nombre del archivo', () => {
    const event = {
      id: '2026-10-copa-valle-vii-yumbo',
      data: { urlSlug: 'copa-valle-yumbo-2026' },
    };
    expect(eventSlug(event)).toBe('copa-valle-yumbo-2026');
    expect(eventPath(event)).toBe('/calendario/copa-valle-yumbo-2026');
  });

  it('cae al id cuando no hay urlSlug', () => {
    const event = { id: '2026-05-copa-valle-iv-cali', data: {} };
    expect(eventPath(event)).toBe('/calendario/2026-05-copa-valle-iv-cali');
  });

  it('ignora un urlSlug en blanco en vez de generar //', () => {
    const event = { id: '2026-05-copa-valle-iv-cali', data: { urlSlug: '   ' } };
    expect(eventPath(event)).toBe('/calendario/2026-05-copa-valle-iv-cali');
  });

  it('el campo NO se llama slug: esa clave es reservada del loader de Astro', () => {
    /*
     * Regresión con historia: llamarlo `slug` hacía que el glob loader usara ese
     * valor como `id` de la entrada (`generateIdDefault`), así que publicar una
     * URL propia renombraba la entrada, rompía `relatedEvent`/`relatedNews` y,
     * si dos eventos coincidían, una desaparecía del sitio con el build verde.
     * Un `slug` en el frontmatter no debe cambiar la ruta.
     */
    const event = { id: '2026-05-copa-valle-iv-cali', data: { slug: 'otra-cosa' } } as {
      id: string;
      data: { urlSlug?: string };
    };
    expect(eventPath(event)).toBe('/calendario/2026-05-copa-valle-iv-cali');
  });
});

describe('formatCop', () => {
  it('escribe el valor como se escribe en Colombia, sin decimales', () => {
    expect(formatCop(70000)).toBe('$70.000');
    expect(formatCop(50000)).toBe('$50.000');
  });

  it('no deja espacio entre el signo y la cifra', () => {
    // `Intl` mete un espacio irrompible que aquí nadie escribe.
    expect(formatCop(70000)).not.toMatch(/\s/);
  });

  it('acepta el cero (una válida sin costo sigue siendo un dato)', () => {
    expect(formatCop(0)).toBe('$0');
  });
});
