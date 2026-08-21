import { describe, it, expect } from 'vitest';
import {
  resolveEventStatus,
  buildSeason,
  clubToday,
  eventDay,
  dayLabel,
  monthShort,
  getEventCategory,
  getEventLevel,
  getEventStatusLabel,
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
      'cancelled'
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
