import { describe, it, expect } from 'vitest';
import {
  buildWeekRhythm,
  buildPeriodGrid,
  sessionPeriod,
  trainingPlaces,
  selectContactFaqs,
  CONTACT_CHANNELS,
  type ProgramScheduleInput,
} from '../contact';
import { EVENT_NAMES } from '../events';

// Los tres programas reales del club, con el `schedule` tal como está escrito
// en `src/content/programs/*.md`. Si el contenido cambia de forma, estos tests
// son los que avisan que la semana dejó de cuadrar.
const REAL_PROGRAMS: ProgramScheduleInput[] = [
  {
    id: 'escuela-de-iniciacion',
    title: 'Escuela de Iniciación',
    schedule: 'Martes y viernes 4:30 - 6:00 PM',
    targetLevel: 'iniciación',
    order: 1,
  },
  {
    id: 'formacion-juvenil',
    title: 'Formación Juvenil',
    schedule: 'Lunes a viernes 4:00 - 6:00 PM',
    targetLevel: 'formación',
    order: 2,
  },
  {
    id: 'alto-rendimiento',
    title: 'Alto Rendimiento',
    schedule:
      'Mar/Jue 4-6 PM (salida) · Mié 4-6 PM (gymkanas en pista) · Sáb 7-9 AM (salida) · Dom 7-10 AM (salida, +12 años)',
    targetLevel: 'competición',
    order: 3,
  },
];

const day = (rhythm: ReturnType<typeof buildWeekRhythm>, name: string) =>
  rhythm.days.find((d) => d.day === name)!;

// ============================================================
// buildWeekRhythm
// ============================================================

describe('buildWeekRhythm', () => {
  it('devuelve siempre los siete días, en orden', () => {
    const rhythm = buildWeekRhythm(REAL_PROGRAMS);
    expect(rhythm.days.map((d) => d.day)).toEqual([
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
      'sabado',
      'domingo',
    ]);
  });

  it('el domingo solo entrena Alto Rendimiento', () => {
    const domingo = day(buildWeekRhythm(REAL_PROGRAMS), 'domingo');
    expect(domingo.sessions).toHaveLength(1);
    expect(domingo.sessions[0]).toMatchObject({
      programId: 'alto-rendimiento',
      time: '7-10 AM',
      note: 'salida, +12 años',
    });
  });

  it('el lunes solo entrena Formación Juvenil', () => {
    // La página vieja anunciaba "Lunes a Viernes 3:00 PM - 7:00 PM" para todo
    // el club: el lunes en realidad solo tiene un programa.
    const lunes = day(buildWeekRhythm(REAL_PROGRAMS), 'lunes');
    expect(lunes.sessions.map((s) => s.programId)).toEqual(['formacion-juvenil']);
    expect(lunes.sessions[0].time).toBe('4:00 - 6:00 PM');
  });

  it('el martes junta los tres programas', () => {
    const martes = day(buildWeekRhythm(REAL_PROGRAMS), 'martes');
    expect(martes.sessions.map((s) => s.programId)).toEqual([
      'escuela-de-iniciacion',
      'formacion-juvenil',
      'alto-rendimiento',
    ]);
  });

  it('ordena las sesiones del día por la ruta de formación, no por el orden de entrada', () => {
    const invertidos = [...REAL_PROGRAMS].reverse();
    const martes = day(buildWeekRhythm(invertidos), 'martes');
    expect(martes.sessions.map((s) => s.programId)).toEqual([
      'escuela-de-iniciacion',
      'formacion-juvenil',
      'alto-rendimiento',
    ]);
  });

  it('marca el sábado con una sola sesión de mañana', () => {
    const sabado = day(buildWeekRhythm(REAL_PROGRAMS), 'sabado');
    expect(sabado.rest).toBe(false);
    expect(sabado.sessions).toHaveLength(1);
    expect(sabado.sessions[0].time).toBe('7-9 AM');
  });

  it('conserva la aclaración de cada sesión', () => {
    const miercoles = day(buildWeekRhythm(REAL_PROGRAMS), 'miercoles');
    const gymkanas = miercoles.sessions.find((s) => s.programId === 'alto-rendimiento');
    expect(gymkanas?.note).toBe('gymkanas en pista');
  });

  it('cuenta los días activos y el total de sesiones', () => {
    const rhythm = buildWeekRhythm(REAL_PROGRAMS);
    // Los siete días tienen algo: de lunes a viernes entrena Formación Juvenil.
    expect(rhythm.activeDays).toBe(7);
    // 2 (Iniciación) + 5 (Formación) + 5 (Alto Rendimiento) = 12
    expect(rhythm.totalSessions).toBe(12);
  });

  it('deja el día en descanso cuando nadie entrena', () => {
    const rhythm = buildWeekRhythm([
      { id: 'p', title: 'P', schedule: 'Martes 4-6 PM', targetLevel: 'iniciación' },
    ]);
    expect(day(rhythm, 'domingo').rest).toBe(true);
    expect(day(rhythm, 'domingo').sessions).toEqual([]);
    expect(rhythm.activeDays).toBe(1);
  });

  it('no pierde un horario ilegible: lo guarda con su texto original', () => {
    const rhythm = buildWeekRhythm([
      {
        id: 'flexible',
        title: 'Programa Flexible',
        schedule: 'Horario a convenir con el entrenador',
        targetLevel: 'recreativo',
      },
    ]);

    expect(rhythm.activeDays).toBe(0);
    expect(rhythm.totalSessions).toBe(0);
    expect(rhythm.unreadable).toEqual([
      {
        programId: 'flexible',
        programTitle: 'Programa Flexible',
        raw: 'Horario a convenir con el entrenador',
      },
    ]);
  });

  it('un horario ilegible no tumba el resto de la semana', () => {
    const rhythm = buildWeekRhythm([
      ...REAL_PROGRAMS,
      { id: 'x', title: 'X', schedule: 'Consultar', targetLevel: 'recreativo', order: 9 },
    ]);
    expect(rhythm.unreadable).toHaveLength(1);
    expect(day(rhythm, 'domingo').sessions).toHaveLength(1);
  });

  it('sobrevive sin programas', () => {
    const rhythm = buildWeekRhythm([]);
    expect(rhythm.days).toHaveLength(7);
    expect(rhythm.days.every((d) => d.rest)).toBe(true);
    expect(rhythm.activeDays).toBe(0);
    expect(rhythm.unreadable).toEqual([]);
  });

  it('trae las etiquetas con tilde para pintar', () => {
    const rhythm = buildWeekRhythm(REAL_PROGRAMS);
    expect(day(rhythm, 'miercoles').label).toBe('Miércoles');
    expect(day(rhythm, 'sabado').short).toBe('Sáb');
  });

  it('ubica cada sesión en su momento del día', () => {
    const rhythm = buildWeekRhythm(REAL_PROGRAMS);
    expect(day(rhythm, 'lunes').sessions[0].period).toBe('tarde');
    expect(day(rhythm, 'sabado').sessions[0].period).toBe('mañana');
    expect(day(rhythm, 'domingo').sessions[0].period).toBe('mañana');
  });
});

// ============================================================
// sessionPeriod / buildPeriodGrid
// ============================================================

describe('sessionPeriod', () => {
  it('lee AM y PM en sus variantes', () => {
    expect(sessionPeriod('7-9 AM')).toBe('mañana');
    expect(sessionPeriod('4:00 - 6:00 PM')).toBe('tarde');
    expect(sessionPeriod('7 a.m. - 9 a.m.')).toBe('mañana');
  });

  it('devuelve null cuando la franja no lo dice', () => {
    expect(sessionPeriod('16:00 - 18:00')).toBeNull();
    expect(sessionPeriod(null)).toBeNull();
  });
});

describe('buildPeriodGrid', () => {
  it('dibuja la forma real de la semana del club', () => {
    const grid = buildPeriodGrid(buildWeekRhythm(REAL_PROGRAMS).days);
    expect(grid.map((row) => row.period)).toEqual(['mañana', 'tarde']);

    const manana = grid.find((r) => r.period === 'mañana')!;
    const tarde = grid.find((r) => r.period === 'tarde')!;

    // De mañana solo se entrena el fin de semana.
    expect(manana.cells.filter((c) => c.sessions > 0).map((c) => c.day)).toEqual([
      'sabado',
      'domingo',
    ]);
    // De tarde, de lunes a viernes.
    expect(tarde.cells.filter((c) => c.sessions > 0).map((c) => c.day)).toEqual([
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
    ]);
    // El martes es el día más cargado: tres programas a la vez.
    expect(tarde.cells.find((c) => c.day === 'martes')!.sessions).toBe(3);
  });

  it('siempre devuelve las siete columnas', () => {
    const grid = buildPeriodGrid(buildWeekRhythm(REAL_PROGRAMS).days);
    for (const row of grid) expect(row.cells).toHaveLength(7);
  });

  it('omite la franja en la que nunca se entrena', () => {
    const grid = buildPeriodGrid(
      buildWeekRhythm([
        { id: 'p', title: 'P', schedule: 'Martes 4-6 PM', targetLevel: 'iniciación' },
      ]).days
    );
    expect(grid.map((r) => r.period)).toEqual(['tarde']);
  });

  it('no pinta nada sin programas', () => {
    expect(buildPeriodGrid(buildWeekRhythm([]).days)).toEqual([]);
  });
});

// ============================================================
// trainingPlaces
// ============================================================

describe('trainingPlaces', () => {
  it('devuelve el lugar de cada programa en orden de ruta', () => {
    const places = trainingPlaces([
      { id: 'b', title: 'B', location: 'Variado', order: 2 },
      { id: 'a', title: 'A', location: 'Pista Carlos Castro', order: 1 },
    ]);
    expect(places.map((p) => p.programId)).toEqual(['a', 'b']);
  });

  it('omite los programas sin lugar', () => {
    const places = trainingPlaces([
      { id: 'a', title: 'A', location: 'Pista', order: 1 },
      { id: 'b', title: 'B', order: 2 },
    ]);
    expect(places).toHaveLength(1);
  });

  it('devuelve lista vacía sin programas', () => {
    expect(trainingPlaces([])).toEqual([]);
  });
});

// ============================================================
// selectContactFaqs
// ============================================================

const FAQS = [
  { data: { question: 'edad', answer: 'a', category: 'general', order: 1 } },
  { data: { question: 'experiencia', answer: 'a', category: 'inscripciones', order: 2 } },
  { data: { question: 'horarios', answer: 'a', category: 'entrenamiento', order: 4 } },
  { data: { question: 'costo', answer: 'a', category: 'inscripciones', order: 5 } },
  { data: { question: 'proceso', answer: 'a', category: 'inscripciones', order: 9 } },
  { data: { question: 'ubicacion', answer: 'a', category: 'general', order: 10 } },
];

describe('selectContactFaqs', () => {
  it('elige las de inscripción y generales, por su orden', () => {
    expect(selectContactFaqs(FAQS).map((f) => f.data.question)).toEqual([
      'edad',
      'experiencia',
      'costo',
      'proceso',
    ]);
  });

  it('deja fuera las categorías que la página ya responde', () => {
    // Horarios y ubicación se responden arriba, con la semana y el mapa.
    const chosen = selectContactFaqs(FAQS, 10).map((f) => f.data.question);
    expect(chosen).not.toContain('horarios');
  });

  it('respeta el límite', () => {
    expect(selectContactFaqs(FAQS, 2)).toHaveLength(2);
  });

  it('descarta los borradores', () => {
    const withDraft = [
      { data: { question: 'borrador', answer: 'a', category: 'general', order: 0, draft: true } },
      ...FAQS,
    ];
    expect(selectContactFaqs(withDraft).map((f) => f.data.question)).not.toContain('borrador');
  });

  it('devuelve lista vacía cuando no hay ninguna de esas categorías', () => {
    const otras = [{ data: { question: 'x', answer: 'a', category: 'seguridad', order: 1 } }];
    expect(selectContactFaqs(otras)).toEqual([]);
    expect(selectContactFaqs([])).toEqual([]);
  });
});

// ============================================================
// CONTACT_CHANNELS
// ============================================================

describe('CONTACT_CHANNELS', () => {
  it('solo declara eventos del catálogo cerrado de analytics', () => {
    // Un nombre fuera de `EVENT_NAMES` se descarta en la sanitización: el
    // evento se perdería en silencio.
    for (const channel of CONTACT_CHANNELS) {
      if (channel.analyticsEvent) {
        expect(EVENT_NAMES).toContain(channel.analyticsEvent);
      }
    }
  });

  it('marca como externo solo lo que sale del sitio', () => {
    for (const channel of CONTACT_CHANNELS) {
      if (channel.external) expect(channel.href).toMatch(/^https?:\/\//);
    }
  });

  it('las anclas apuntan a un id, no a una ruta', () => {
    const anchors = CONTACT_CHANNELS.filter((c) => c.href.startsWith('#'));
    expect(anchors.length).toBeGreaterThan(0);
    for (const channel of anchors) expect(channel.href).toMatch(/^#[a-z-]+$/);
  });
});
