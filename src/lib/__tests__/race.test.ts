import { describe, it, expect } from 'vitest';
import {
  categoryDistance,
  chroniclesOf,
  formatKm,
  formatRaceTime,
  groupCategories,
  mapProvider,
  otherDates,
  raceFacts,
  registrationOpen,
} from '../race';

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

const evento = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: {
    title: `Válida ${id}`,
    date: at(date),
    location: 'Pista Carlos Castro',
    category: 'xco',
    ...extra,
  },
});

const cronica = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: { title: `Crónica ${id}`, ...extra },
});

// ============================================================
// chroniclesOf
// ============================================================

describe('chroniclesOf', () => {
  const yumbo = evento('yumbo', '2026-10-18');

  it('encuentra la crónica que apunta al evento', () => {
    const news = [cronica('a', { relatedEvent: 'yumbo' }), cronica('b')];
    expect(chroniclesOf(yumbo, news)).toEqual([{ href: '/noticias/a', title: 'Crónica a' }]);
  });

  it('encuentra la crónica que el evento lista en relatedNews', () => {
    const event = evento('yumbo', '2026-10-18', { relatedNews: ['b'] });
    const news = [cronica('a'), cronica('b')];
    expect(chroniclesOf(event, news)).toEqual([{ href: '/noticias/b', title: 'Crónica b' }]);
  });

  it('no duplica la crónica declarada en las dos direcciones', () => {
    const event = evento('yumbo', '2026-10-18', { relatedNews: ['a'] });
    const news = [cronica('a', { relatedEvent: 'yumbo' })];
    expect(chroniclesOf(event, news)).toHaveLength(1);
  });

  it('descarta una referencia que no resuelve en vez de enlazar al vacío', () => {
    const event = evento('yumbo', '2026-10-18', { relatedNews: ['fantasma'] });
    expect(chroniclesOf(event, [cronica('a')])).toEqual([]);
  });

  it('no publica borradores por ninguna de las dos vías', () => {
    const event = evento('yumbo', '2026-10-18', { relatedNews: ['b'] });
    const news = [
      cronica('a', { relatedEvent: 'yumbo', draft: true }),
      cronica('b', { draft: true }),
    ];
    expect(chroniclesOf(event, news)).toEqual([]);
  });
});

// ============================================================
// otherDates
// ============================================================

describe('otherDates', () => {
  const temporada = [
    evento('cali', '2026-05-10'),
    evento('palmira', '2026-08-09'),
    evento('yumbo', '2026-10-18'),
    evento('vieja', '2025-11-02'),
  ];

  it('excluye la fecha que se está viendo', () => {
    const ids = otherDates(temporada[2], temporada).map((o) => o.event.id);
    expect(ids).not.toContain('yumbo');
  });

  it('deja fuera las fechas de otra temporada', () => {
    const ids = otherDates(temporada[2], temporada).map((o) => o.event.id);
    expect(ids).toEqual(['cali', 'palmira']);
  });

  it('respeta el orden de calendario', () => {
    const desordenado = [temporada[1], temporada[0], temporada[2]];
    const ids = otherDates(temporada[2], desordenado).map((o) => o.event.id);
    expect(ids).toEqual(['cali', 'palmira']);
  });

  it('corta en el límite pedido', () => {
    expect(otherDates(temporada[2], temporada, 1)).toHaveLength(1);
  });

  it('elige las fechas MÁS CERCANAS, no las más antiguas del año', () => {
    /*
     * Regresión: ordenar de enero a diciembre y cortar hacía que las diez fichas
     * enlazaran siempre al arranque de la temporada, y la última válida del año
     * solo podía mostrar carreras ya corridas.
     */
    const larga = [
      evento('enero', '2026-01-11'),
      evento('febrero', '2026-02-22'),
      evento('abril', '2026-04-19'),
      evento('agosto', '2026-08-09'),
      evento('septiembre', '2026-09-26'),
      evento('octubre', '2026-10-18'),
    ];
    const ids = otherDates(larga[5], larga, 3).map((o) => o.event.id);
    expect(ids).toEqual(['abril', 'agosto', 'septiembre']);
  });

  it('devuelve el recorte en orden de calendario, no por cercanía', () => {
    const larga = [
      evento('enero', '2026-01-11'),
      evento('agosto', '2026-08-09'),
      evento('septiembre', '2026-09-26'),
      evento('octubre', '2026-10-18'),
    ];
    const fechas = otherDates(larga[3], larga, 2).map((o) => o.event.data.date.getUTCMonth());
    expect(fechas).toEqual([...fechas].sort((a, b) => a - b));
  });
});

// ============================================================
// registrationOpen
// ============================================================

describe('registrationOpen', () => {
  const base = { title: 'x', date: at('2026-10-18'), location: 'Pista', category: 'xco' };

  it('devuelve null cuando no hay plazo publicado', () => {
    // "No hay fecha de cierre" y "el plazo se venció" no son lo mismo.
    expect(registrationOpen(base, '2026-10-01')).toBeNull();
  });

  it('está abierto antes del cierre', () => {
    const data = { ...base, registrationDeadline: at('2026-10-15') };
    expect(registrationOpen(data, '2026-10-01')).toBe(true);
  });

  it('sigue abierto el mismo día del cierre', () => {
    const data = { ...base, registrationDeadline: at('2026-10-15') };
    expect(registrationOpen(data, '2026-10-15')).toBe(true);
  });

  it('está cerrado al día siguiente', () => {
    const data = { ...base, registrationDeadline: at('2026-10-15') };
    expect(registrationOpen(data, '2026-10-16')).toBe(false);
  });

  it('una fecha cancelada nunca tiene inscripciones abiertas', () => {
    const data = { ...base, registrationDeadline: at('2026-10-15'), status: 'cancelled' };
    expect(registrationOpen(data, '2026-10-01')).toBe(false);
  });

  it('una cancelada SIN plazo publicado devuelve false, no null', () => {
    // El early-return por falta de plazo iba primero y la ficha leía el null
    // como "no hay plazo publicado", dejando el CTA de inscripción a la vista.
    const data = { ...base, status: 'cancelled' };
    expect(registrationOpen(data, '2026-10-01')).toBe(false);
  });

  it('una fecha ya corrida no admite inscripciones aunque no declare plazo', () => {
    const data = { ...base, date: at('2026-01-11') };
    expect(registrationOpen(data, '2026-10-01')).toBe(false);
  });
});

// ============================================================
// mapProvider
// ============================================================

describe('mapProvider', () => {
  it('reconoce Google Maps y Waze', () => {
    expect(mapProvider('https://www.google.com/maps/place/Pista')).toBe('google-maps');
    expect(mapProvider('https://maps.google.com/?q=3.59,-76.48')).toBe('google-maps');
    expect(mapProvider('https://goo.gl/maps/abc')).toBe('google-maps');
    expect(mapProvider('https://waze.com/ul?ll=3.59,-76.48')).toBe('waze');
    expect(mapProvider('https://www.waze.com/ul?ll=3.59,-76.48')).toBe('waze');
  });

  it('no confunde un dominio que solo TERMINA parecido', () => {
    expect(mapProvider('https://notgoogle.com/maps')).toBe('otro');
    expect(mapProvider('https://openstreetmap.org/#map=17/3.59/-76.48')).toBe('otro');
  });

  it('no revienta con una URL inválida', () => {
    expect(mapProvider('no-es-una-url')).toBe('otro');
  });
});

// ============================================================
// raceFacts
// ============================================================

describe('raceFacts', () => {
  const base = {
    title: 'VII Válida',
    date: at('2026-10-18'),
    location: 'Pista Carlos Castro',
    category: 'xco',
  };

  const valueOf = (facts: { label: string; value: string }[], label: string) =>
    facts.find((f) => f.label === label)?.value;

  it('traduce la modalidad a su nombre completo', () => {
    expect(valueOf(raceFacts(base), 'Modalidad')).toBe('Cross Country olímpico');
  });

  it('junta sede y ciudad cuando hay ciudad', () => {
    expect(valueOf(raceFacts({ ...base, city: 'Yumbo' }), 'Sede')).toBe(
      'Pista Carlos Castro · Yumbo',
    );
  });

  it('omite los hechos cuyo dato no existe', () => {
    const labels = raceFacts(base).map((f) => f.label);
    expect(labels).not.toContain('Circuito');
    expect(labels).not.toContain('Inscripción');
    expect(labels).not.toContain('Cupos');
    expect(labels).not.toContain('Organiza');
  });

  it('formatea los valores de inscripción en pesos', () => {
    const facts = raceFacts({
      ...base,
      fees: [
        { label: 'Categorías regulares', amount: 70000 },
        { label: 'Teteros', amount: 50000 },
      ],
    });
    expect(valueOf(facts, 'Inscripción')).toBe('$70.000 categorías regulares · $50.000 teteros');
  });

  it('describe el circuito por vuelta', () => {
    const facts = raceFacts({ ...base, circuit: { distanceKm: 3.8 } });
    expect(valueOf(facts, 'Circuito')).toBe('3,8 km por vuelta');
  });

  it('suma las vueltas al circuito cuando el organizador las publica', () => {
    const facts = raceFacts({ ...base, circuit: { distanceKm: 3.8, laps: 6 } });
    expect(valueOf(facts, 'Circuito')).toBe('3,8 km por vuelta · 6 vueltas');
  });

  it('concuerda el singular de una sola vuelta', () => {
    const facts = raceFacts({ ...base, circuit: { distanceKm: 3.8, laps: 1 } });
    expect(valueOf(facts, 'Circuito')).toBe('3,8 km por vuelta · 1 vuelta');
  });

  it('aclara que los cupos son por categoría', () => {
    expect(valueOf(raceFacts({ ...base, capacity: 350 }), 'Cupos')).toBe('350 por categoría');
  });

  it('nunca devuelve un hecho sin valor (FactGrid los descarta, pero no debe recibirlos)', () => {
    expect(raceFacts(base).every((f) => f.value.length > 0)).toBe(true);
  });
});

// ============================================================
// Categorías: horas, mangas y la regla de los kilómetros
// ============================================================

describe('formatRaceTime', () => {
  it('pasa de 24 horas a la forma que se lee en Colombia', () => {
    expect(formatRaceTime('08:30')).toBe('8:30 a. m.');
    expect(formatRaceTime('11:20')).toBe('11:20 a. m.');
    expect(formatRaceTime('12:40')).toBe('12:40 p. m.');
    expect(formatRaceTime('13:00')).toBe('1:00 p. m.');
  });

  it('el mediodía y la medianoche son las 12, no las 0', () => {
    expect(formatRaceTime('12:00')).toBe('12:00 p. m.');
    expect(formatRaceTime('00:15')).toBe('12:15 a. m.');
  });

  it('devuelve la entrada tal cual si no es una hora', () => {
    expect(formatRaceTime('no-es-hora')).toBe('no-es-hora');
  });
});

describe('categoryDistance', () => {
  const circuit = { distanceKm: 3.8 };

  it('multiplica las vueltas cuando la categoría da la vuelta completa', () => {
    expect(categoryDistance({ name: 'Élite', laps: 6 }, circuit)).toBe(22.8);
    expect(categoryDistance({ name: 'Junior', laps: 5 }, circuit)).toBe(19);
  });

  it('NO calcula distancia cuando el recorrido no es la pista completa', () => {
    /*
     * Diez de las 26 categorías de una válida corren un trazado más corto —«70%
     * de la pista», «recorrido especial», «pista alterna»—. Multiplicar sus
     * vueltas por los 3,8 km publicaría una cifra que nadie midió, justo en las
     * categorías infantiles, que son las que miran los papás.
     */
    expect(categoryDistance({ name: 'Infantil A', laps: 2, course: '70% de la pista' }, circuit)).toBeNull();
    expect(categoryDistance({ name: 'Pre-infantil A', laps: 2, course: 'Recorrido especial' }, circuit)).toBeNull();
    expect(categoryDistance({ name: 'Teteros', laps: 2, course: 'Pista alterna' }, circuit)).toBeNull();
  });

  it('devuelve null sin circuito o sin vueltas', () => {
    expect(categoryDistance({ name: 'X', laps: 3 }, undefined)).toBeNull();
    expect(categoryDistance({ name: 'X' }, circuit)).toBeNull();
  });

  it('redondea a un decimal, la precisión del dato de origen', () => {
    expect(categoryDistance({ name: 'X', laps: 3 }, circuit)).toBe(11.4);
  });
});

describe('groupCategories', () => {
  const cats = [
    { name: 'Teteros sin pedales', group: 'Primera manga', startTime: '08:30' },
    { name: 'Teteros con pedales', group: 'Primera manga', startTime: '08:30' },
    { name: 'Prejuvenil A', group: 'Quinta manga', startTime: '11:20' },
    { name: 'Máster A', group: 'Quinta manga', startTime: '11:50' },
  ];

  it('conserva el orden de largada de las mangas', () => {
    expect(groupCategories(cats).map((g) => g.group)).toEqual(['Primera manga', 'Quinta manga']);
  });

  it('rotula la manga con la hora más temprana de las que la componen', () => {
    // La quinta manga tiene dos horas: Prejuvenil A y Promocional largan 11:20
    // y el resto 11:50. El rótulo dice «desde las», así que va la primera.
    expect(groupCategories(cats)[1].startTime).toBe('11:20');
  });

  it('no pierde las categorías sin manga declarada', () => {
    const grupos = groupCategories([...cats, { name: 'Suelta' }]);
    expect(grupos[grupos.length - 1].group).toBeNull();
    expect(grupos.flatMap((g) => g.categories)).toHaveLength(5);
  });
});

describe('formatKm', () => {
  it('usa la coma decimal del español colombiano', () => {
    expect(formatKm(3.8)).toBe('3,8');
    expect(formatKm(15.2)).toBe('15,2');
  });

  it('no le pone decimales a un entero', () => {
    expect(formatKm(19)).toBe('19');
  });
});
