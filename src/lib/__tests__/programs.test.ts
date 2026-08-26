import { describe, it, expect } from 'vitest';
import {
  buildAgePicker,
  countWeeklySessions,
  formatTimeOfDay,
  nextSession,
  parseSchedule,
  parseScheduleDays,
  buildPathway,
  summarizePrograms,
  getAdjacentPrograms,
  getLevelStyle,
  toPathwayInput,
  LEVEL_STYLES,
  OPEN_ENDED_AGE,
  SESSION_DAYS,
  SESSION_DAY_TO_WEEK_DAY,
  WEEK_DAYS,
  type PathwayInput,
  type ProgramSessionsInput,
} from '../programs';

// Los tres programas reales del club: si el contenido cambia de forma, estos
// tests son los que avisan que la ruta de formación dejó de cuadrar.
const REAL_PROGRAMS: PathwayInput[] = [
  {
    id: 'escuela-de-iniciacion',
    title: 'Escuela de Iniciación',
    ageRange: '4 a 5 años',
    ageMin: 4,
    ageMax: 5,
    targetLevel: 'iniciación',
  },
  {
    id: 'formacion-juvenil',
    title: 'Formación Juvenil',
    ageRange: '6 a 11 años',
    ageMin: 6,
    ageMax: 11,
    targetLevel: 'formación',
  },
  {
    id: 'alto-rendimiento',
    title: 'Alto Rendimiento',
    ageRange: '12 años en adelante',
    ageMin: 12,
    ageMax: 99,
    targetLevel: 'competición',
  },
];

// ============================================================
// countWeeklySessions
// ============================================================

describe('countWeeklySessions', () => {
  it('cuenta días sueltos unidos por "y"', () => {
    expect(countWeeklySessions('Martes y viernes 4:30 - 6:00 PM')).toBe(2);
  });

  it('expande un rango de días', () => {
    expect(countWeeklySessions('Lunes a viernes 4:00 - 6:00 PM')).toBe(5);
  });

  it('lee abreviaturas con tilde y separadores mixtos', () => {
    expect(
      countWeeklySessions(
        'Mar/Jue 4-6 PM (salida) · Mié 4-6 PM (gymkanas en pista) · Sáb 7-9 AM (salida) · Dom 7-10 AM (salida, +12 años)'
      )
    ).toBe(5);
  });

  it('no cuenta dos veces el mismo día', () => {
    expect(countWeeklySessions('Sábado 7 AM y sábado 3 PM')).toBe(1);
  });

  it('no parte un nombre completo en su abreviatura', () => {
    // "martes" empieza por "mar": si ganara la abreviatura, contaría de más.
    expect(countWeeklySessions('Martes 4 PM')).toBe(1);
  });

  it('cierra el rango dando la vuelta a la semana', () => {
    // sábado, domingo, lunes
    expect(countWeeklySessions('Sábado a lunes')).toBe(3);
  });

  it('acepta "al" y "hasta" como conectores de rango', () => {
    expect(countWeeklySessions('Lunes al miércoles')).toBe(3);
    expect(countWeeklySessions('Lunes hasta miércoles')).toBe(3);
  });

  it('devuelve null cuando no hay días reconocibles', () => {
    expect(countWeeklySessions('Horario flexible, consultar')).toBeNull();
    expect(countWeeklySessions('')).toBeNull();
    expect(countWeeklySessions(undefined)).toBeNull();
  });

  it('prefiere las sesiones capturadas al texto del horario', () => {
    // El texto dice tres días y las sesiones dicen dos: mandan las sesiones.
    expect(
      countWeeklySessions({
        schedule: 'Lunes, miércoles y viernes 4:00 - 6:00 PM',
        sessions: [
          { day: 'mon', start: '16:00', end: '18:00' },
          { day: 'wed', start: '16:00', end: '18:00' },
        ],
      })
    ).toBe(2);
  });

  it('cuenta días, no sesiones: dos entrenos del mismo sábado son un día', () => {
    expect(
      countWeeklySessions({
        sessions: [
          { day: 'sat', start: '07:00', end: '09:00' },
          { day: 'sat', start: '15:00', end: '17:00' },
        ],
      })
    ).toBe(1);
  });

  it('cae al texto cuando el programa no tiene sesiones capturadas', () => {
    expect(countWeeklySessions({ schedule: 'Martes y viernes 4:30 - 6:00 PM' })).toBe(2);
    expect(
      countWeeklySessions({ schedule: 'Martes y viernes 4:30 - 6:00 PM', sessions: [] })
    ).toBe(2);
    expect(countWeeklySessions({})).toBeNull();
  });
});

// ============================================================
// formatTimeOfDay
// ============================================================

describe('formatTimeOfDay', () => {
  it('traduce las 24 horas al español colombiano', () => {
    expect(formatTimeOfDay('07:00')).toBe('7:00 a. m.');
    expect(formatTimeOfDay('16:30')).toBe('4:30 p. m.');
  });

  it('resuelve los dos mediodías', () => {
    expect(formatTimeOfDay('12:00')).toBe('12:00 p. m.');
    expect(formatTimeOfDay('00:30')).toBe('12:30 a. m.');
  });

  it('devuelve intacto lo que no es una hora', () => {
    expect(formatTimeOfDay('por confirmar')).toBe('por confirmar');
  });
});

// ============================================================
// nextSession
// ============================================================

describe('nextSession', () => {
  // Los horarios reales de dos de los tres programas, recortados a lo que hace
  // falta: uno con lugar fijo y otro con salidas sin punto de encuentro.
  const SESSION_PROGRAMS: ProgramSessionsInput[] = [
    {
      id: 'escuela-de-iniciacion',
      title: 'Escuela de Iniciación',
      sessions: [
        { day: 'tue', start: '16:30', end: '18:00', place: 'Pista Carlos Castro' },
        { day: 'fri', start: '16:30', end: '18:00', place: 'Pista Carlos Castro' },
      ],
    },
    {
      id: 'alto-rendimiento',
      title: 'Alto Rendimiento',
      sessions: [
        { day: 'wed', start: '16:00', end: '18:00' },
        { day: 'sat', start: '07:00', end: '09:00' },
      ],
    },
  ];

  it('el orden de los códigos de día es el mismo de la semana en español', () => {
    expect(SESSION_DAYS.map((day) => SESSION_DAY_TO_WEEK_DAY[day])).toEqual([...WEEK_DAYS]);
  });

  it('anuncia la sesión de hoy mientras no haya empezado', () => {
    // Miércoles 26 de agosto de 2026, 10 a. m. en Bogotá.
    const next = nextSession(SESSION_PROGRAMS, new Date('2026-08-26T15:00:00Z'));

    expect(next).toMatchObject({
      programId: 'alto-rendimiento',
      day: 'miercoles',
      daysAhead: 0,
      place: null,
      label: 'miércoles 4:00 p. m.',
    });
  });

  it('sigue anunciándola mientras el grupo está rodando', () => {
    // Mismo miércoles, 5 p. m.: la sesión va de 4 a 6.
    expect(nextSession(SESSION_PROGRAMS, new Date('2026-08-26T22:00:00Z'))).toMatchObject({
      day: 'miercoles',
      daysAhead: 0,
    });
  });

  it('pasa a la siguiente cuando la de hoy ya terminó', () => {
    // Mismo miércoles, 6 p. m. en punto.
    expect(nextSession(SESSION_PROGRAMS, new Date('2026-08-26T23:00:00Z'))).toMatchObject({
      programId: 'escuela-de-iniciacion',
      day: 'viernes',
      daysAhead: 2,
      label: 'viernes 4:30 p. m. · Pista Carlos Castro',
    });
  });

  it('lee "ahora" en la zona del club, no en UTC', () => {
    // 2 a. m. UTC del sábado: en Colombia todavía es viernes por la noche, y
    // la sesión del viernes ya terminó. En UTC daría "sábado, hoy".
    expect(nextSession(SESSION_PROGRAMS, new Date('2026-08-29T02:00:00Z'))).toMatchObject({
      day: 'sabado',
      daysAhead: 1,
    });
  });

  it('da la vuelta a la semana cuando ya no queda nada por delante', () => {
    // Sábado 10 a. m.: la única sesión del fin de semana terminó a las 9.
    expect(nextSession(SESSION_PROGRAMS, new Date('2026-08-29T15:00:00Z'))).toMatchObject({
      day: 'martes',
      daysAhead: 3,
    });
  });

  it('una sesión que solo se dicta hoy y ya terminó vuelve en una semana', () => {
    const soloMiercoles = [SESSION_PROGRAMS[1]].map((program) => ({
      ...program,
      sessions: program.sessions?.filter((session) => session.day === 'wed'),
    }));

    expect(nextSession(soloMiercoles, new Date('2026-08-26T23:00:00Z'))).toMatchObject({
      day: 'miercoles',
      daysAhead: 7,
    });
  });

  it('desempata por id para que dos builds den lo mismo', () => {
    const empatados: ProgramSessionsInput[] = [
      { id: 'zeta', title: 'Zeta', sessions: [{ day: 'wed', start: '16:00', end: '18:00' }] },
      { id: 'alfa', title: 'Alfa', sessions: [{ day: 'wed', start: '16:00', end: '18:00' }] },
    ];

    expect(nextSession(empatados, new Date('2026-08-26T15:00:00Z'))?.programId).toBe('alfa');
  });

  it('devuelve null cuando ningún programa tiene sesiones capturadas', () => {
    expect(nextSession([], new Date('2026-08-26T15:00:00Z'))).toBeNull();
    expect(
      nextSession(
        [{ id: 'sin-horario', title: 'Sin horario' }],
        new Date('2026-08-26T15:00:00Z')
      )
    ).toBeNull();
  });
});

// ============================================================
// parseSchedule / parseScheduleDays
// ============================================================

describe('parseScheduleDays', () => {
  it('devuelve los días en orden de semana, no en el que se escribieron', () => {
    expect(parseScheduleDays('Viernes y martes 4:30 - 6:00 PM')).toEqual(['martes', 'viernes']);
  });

  it('expande el rango a los días intermedios', () => {
    expect(parseScheduleDays('Lunes a viernes 4:00 - 6:00 PM')).toEqual([
      'lunes',
      'martes',
      'miercoles',
      'jueves',
      'viernes',
    ]);
  });

  it('devuelve null cuando no reconoce ningún día', () => {
    expect(parseScheduleDays('Horario flexible, consultar')).toBeNull();
    expect(parseScheduleDays(undefined)).toBeNull();
  });
});

describe('parseSchedule', () => {
  it('separa cada sesión con su hora y su aclaración', () => {
    const segments = parseSchedule(
      'Mar/Jue 4-6 PM (salida) · Mié 4-6 PM (gymkanas en pista) · Sáb 7-9 AM (salida) · Dom 7-10 AM (salida, +12 años)'
    );

    expect(segments).toHaveLength(4);
    expect(segments[0]).toMatchObject({
      days: ['martes', 'jueves'],
      time: '4-6 PM',
      note: 'salida',
    });
    expect(segments[1]).toMatchObject({ days: ['miercoles'], note: 'gymkanas en pista' });
    expect(segments[2]).toMatchObject({ days: ['sabado'], time: '7-9 AM' });
    // El "+12" de la aclaración no debe confundirse con la franja horaria.
    expect(segments[3]).toMatchObject({
      days: ['domingo'],
      time: '7-10 AM',
      note: 'salida, +12 años',
    });
  });

  it('lee la franja con minutos', () => {
    expect(parseSchedule('Martes y viernes 4:30 - 6:00 PM')[0]).toMatchObject({
      days: ['martes', 'viernes'],
      time: '4:30 - 6:00 PM',
      note: null,
    });
  });

  it('conserva el tramo aunque no se entienda ningún día', () => {
    // Nada se descarta en silencio: la plantilla decide qué hacer con el texto.
    const segments = parseSchedule('Horario flexible, consultar');
    expect(segments).toHaveLength(1);
    expect(segments[0].days).toEqual([]);
    expect(segments[0].raw).toBe('Horario flexible, consultar');
  });

  it('devuelve una lista vacía sin horario', () => {
    expect(parseSchedule(undefined)).toEqual([]);
    expect(parseSchedule('')).toEqual([]);
  });

  it('no arrastra el índice del regex entre llamadas', () => {
    // `TIME_PATTERN` y `NOTE_PATTERN` se reutilizan: si llevaran la bandera /g,
    // la segunda llamada empezaría a buscar donde terminó la primera.
    const once = parseSchedule('Lunes 4-6 PM (pista)');
    const twice = parseSchedule('Lunes 4-6 PM (pista)');
    expect(twice).toEqual(once);
  });
});

// ============================================================
// getLevelStyle
// ============================================================

describe('getLevelStyle', () => {
  it('devuelve el estilo del nivel', () => {
    expect(getLevelStyle('competición')).toBe(LEVEL_STYLES['competición']);
  });

  it('cae en iniciación ante un nivel desconocido', () => {
    expect(getLevelStyle('mixto')).toBe(LEVEL_STYLES['iniciación']);
  });

  it('cada nivel tiene texto legible sobre su color sólido', () => {
    // El lima y el teal vivo solo cumplen AA con texto grafito; el teal
    // profundo, con texto blanco. Que nadie los invierta sin darse cuenta.
    expect(LEVEL_STYLES['iniciación'].ink).toBe('text-surface-dark');
    expect(LEVEL_STYLES['formación'].ink).toBe('text-surface-dark');
    expect(LEVEL_STYLES['competición'].ink).toBe('text-white');
  });
});

// ============================================================
// buildPathway
// ============================================================

describe('buildPathway', () => {
  it('ordena las etapas por edad de entrada y las numera', () => {
    const { stages } = buildPathway([...REAL_PROGRAMS].reverse());
    expect(stages.map((s) => s.id)).toEqual([
      'escuela-de-iniciacion',
      'formacion-juvenil',
      'alto-rendimiento',
    ]);
    expect(stages.map((s) => s.step)).toEqual([1, 2, 3]);
  });

  it('encadena los tramos sin huecos ni solapes', () => {
    const { stages, domain } = buildPathway(REAL_PROGRAMS);
    expect(stages.map((s) => [s.from, s.to])).toEqual([
      [4, 6],
      [6, 12],
      [12, 19],
    ]);
    expect(domain).toEqual({ from: 4, to: 19 });
  });

  it('reparte el ancho en proporción a los años de cada tramo', () => {
    const { stages } = buildPathway(REAL_PROGRAMS);
    expect(stages[0].startPct).toBe(0);
    // La regla cubre 15 años (de 4 a 19): la Escuela ocupa 2 y la Formación 6.
    expect(stages[0].widthPct).toBeCloseTo((2 / 15) * 100, 2);
    expect(stages[1].widthPct).toBeCloseTo((6 / 15) * 100, 2);
    const total = stages.reduce((sum, s) => sum + s.widthPct, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it('trata una edad máxima altísima como tramo abierto', () => {
    const { stages } = buildPathway(REAL_PROGRAMS);
    expect(stages[2].openEnded).toBe(true);
    expect(stages[2].shortAge).toBe('12+');
    expect(stages[0].openEnded).toBe(false);
    expect(stages[0].shortAge).toBe('4–5');
  });

  it('recorta el tramo que se pisa con el siguiente', () => {
    const { stages } = buildPathway([
      { ...REAL_PROGRAMS[0], ageMax: 8 },
      REAL_PROGRAMS[1],
    ]);
    expect(stages[0].to).toBe(6);
    expect(stages[1].from).toBe(6);
  });

  it('respeta un hueco entre programas', () => {
    const { stages, domain } = buildPathway([
      REAL_PROGRAMS[0],
      { ...REAL_PROGRAMS[2], ageMin: 12, ageMax: 17 },
    ]);
    expect(stages[0].to).toBe(6);
    expect(stages[1].from).toBe(12);
    expect(domain.to).toBe(18);
  });

  it('marca como mayores solo las marcas donde arranca una etapa', () => {
    const { ticks } = buildPathway(REAL_PROGRAMS);
    expect(ticks).toHaveLength(16); // de los 4 a los 19 años
    expect(ticks.filter((t) => t.major).map((t) => t.age)).toEqual([4, 6, 12]);
    expect(ticks[0].pct).toBe(0);
    expect(ticks[ticks.length - 1].pct).toBe(100);
  });

  it('sobrevive a una lista vacía', () => {
    const pathway = buildPathway([]);
    expect(pathway.stages).toEqual([]);
    expect(pathway.ticks).toHaveLength(2);
  });

  it('le da ancho a un único programa de un solo año', () => {
    const { stages, domain } = buildPathway([{ ...REAL_PROGRAMS[0], ageMin: 7, ageMax: 6 }]);
    expect(domain.to).toBeGreaterThan(domain.from);
    expect(stages[0].widthPct).toBeGreaterThan(0);
  });
});

// ============================================================
// toPathwayInput
// ============================================================

describe('toPathwayInput', () => {
  it('extrae de la entrada de contenido solo lo que dibuja la ruta', () => {
    expect(
      toPathwayInput({
        id: 'escuela-de-iniciacion',
        data: {
          title: 'Escuela de Iniciación',
          ageRange: '4 a 5 años',
          ageMin: 4,
          ageMax: 5,
          targetLevel: 'iniciación',
        },
      })
    ).toEqual(REAL_PROGRAMS[0]);
  });
});

// ============================================================
// summarizePrograms
// ============================================================

describe('summarizePrograms', () => {
  const withSchedules = [
    { ageMin: 4, ageMax: 5, schedule: 'Martes y viernes 4:30 PM', maxStudents: 20 },
    { ageMin: 6, ageMax: 11, schedule: 'Lunes a viernes 4:00 PM', maxStudents: 25 },
    { ageMin: 12, ageMax: 99, schedule: 'Mar/Jue · Mié · Sáb · Dom', maxStudents: 10 },
  ];

  it('suma sesiones y cupos de todos los programas', () => {
    const totals = summarizePrograms(withSchedules);
    expect(totals.programs).toBe(3);
    expect(totals.weeklySessions).toBe(12);
    expect(totals.seats).toBe(55);
  });

  it('abre el rango de edades cuando el último programa no tiene techo', () => {
    expect(summarizePrograms(withSchedules).ageRange).toBe('4+');
    expect(summarizePrograms([{ ageMin: 3, ageMax: 17 }]).ageRange).toBe('3–17');
    expect(OPEN_ENDED_AGE).toBeGreaterThan(17);
  });

  it('deja en null los datos que el contenido no respalda', () => {
    const totals = summarizePrograms([{ ageMin: 4, ageMax: 5 }]);
    expect(totals.weeklySessions).toBeNull();
    expect(totals.seats).toBeNull();
  });

  it('no inventa nada cuando no hay programas', () => {
    expect(summarizePrograms([])).toEqual({
      programs: 0,
      ageRange: null,
      weeklySessions: null,
      seats: null,
    });
  });
});

// ============================================================
// getAdjacentPrograms
// ============================================================

describe('getAdjacentPrograms', () => {
  it('devuelve el anterior y el siguiente de un programa intermedio', () => {
    const { previous, next } = getAdjacentPrograms(REAL_PROGRAMS, 'formacion-juvenil');
    expect(previous?.id).toBe('escuela-de-iniciacion');
    expect(next?.id).toBe('alto-rendimiento');
  });

  it('el primer programa de la ruta no tiene anterior', () => {
    const { previous, next } = getAdjacentPrograms(REAL_PROGRAMS, 'escuela-de-iniciacion');
    expect(previous).toBeNull();
    expect(next?.id).toBe('formacion-juvenil');
  });

  it('el último programa de la ruta no tiene siguiente', () => {
    const { previous, next } = getAdjacentPrograms(REAL_PROGRAMS, 'alto-rendimiento');
    expect(previous?.id).toBe('formacion-juvenil');
    expect(next).toBeNull();
  });

  it('ordena por ageMin sin importar el orden de entrada', () => {
    const shuffled = [REAL_PROGRAMS[2], REAL_PROGRAMS[0], REAL_PROGRAMS[1]];
    const { previous, next } = getAdjacentPrograms(shuffled, 'formacion-juvenil');
    expect(previous?.id).toBe('escuela-de-iniciacion');
    expect(next?.id).toBe('alto-rendimiento');
  });

  it('devuelve ambos en null cuando el id no aparece en la lista', () => {
    expect(getAdjacentPrograms(REAL_PROGRAMS, 'no-existe')).toEqual({
      previous: null,
      next: null,
    });
  });

  it('devuelve ambos en null con un solo programa en la ruta', () => {
    expect(getAdjacentPrograms([REAL_PROGRAMS[0]], 'escuela-de-iniciacion')).toEqual({
      previous: null,
      next: null,
    });
  });
});

// ============================================================
// buildAgePicker
// ============================================================

describe('buildAgePicker', () => {
  it('ofrece una edad por año cubierto y una sola por el tramo sin techo', () => {
    const { options } = buildAgePicker(REAL_PROGRAMS);

    expect(options.map((option) => option.age)).toEqual([4, 5, 6, 7, 8, 9, 10, 11, 12]);
    expect(options.map((option) => option.label)).toEqual([
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
      '11',
      '12+',
    ]);
  });

  it('dice la edad completa en el nombre accesible', () => {
    const { options } = buildAgePicker(REAL_PROGRAMS);

    expect(options[0].ariaLabel).toBe('4 años');
    expect(options.at(-1)).toMatchObject({ ariaLabel: '12 años o más', openEnded: true });
    expect(options[0].openEnded).toBe(false);
  });

  it('reparte las edades entre los tramos sin solaparlas', () => {
    const { coverage } = buildAgePicker(REAL_PROGRAMS);

    expect(coverage.get('escuela-de-iniciacion')).toEqual({ min: 4, max: 5, ages: [4, 5] });
    expect(coverage.get('formacion-juvenil')).toEqual({
      min: 6,
      max: 11,
      ages: [6, 7, 8, 9, 10, 11],
    });
    // El tramo abierto se dibuja con 7 años de ancho, pero solo se elige por su
    // edad de entrada: de ahí en adelante todas las edades llevan al mismo sitio.
    expect(coverage.get('alto-rendimiento')).toEqual({ min: 12, max: 12, ages: [12] });
  });

  it('sigue a las edades del contenido, no a un rango escrito a mano', () => {
    const { options, coverage } = buildAgePicker([
      { ...REAL_PROGRAMS[0], ageMin: 3, ageMax: 4 },
      { ...REAL_PROGRAMS[1], ageMin: 5, ageMax: 8 },
    ]);

    expect(options.map((option) => option.age)).toEqual([3, 4, 5, 6, 7, 8]);
    expect(options.at(-1)?.openEnded).toBe(false);
    expect(coverage.get('formacion-juvenil')?.ages).toEqual([5, 6, 7, 8]);
  });

  it('no ofrece una edad que ningún programa cubre', () => {
    const { options } = buildAgePicker([
      { ...REAL_PROGRAMS[0], ageMin: 4, ageMax: 5 },
      { ...REAL_PROGRAMS[1], ageMin: 8, ageMax: 9 },
    ]);

    expect(options.map((option) => option.age)).toEqual([4, 5, 8, 9]);
  });

  it('un tramo abierto sin etapas previas deja una sola edad elegible', () => {
    const { options, coverage } = buildAgePicker([REAL_PROGRAMS[2]]);

    expect(options).toHaveLength(1);
    expect(options[0]).toMatchObject({ age: 12, label: '12+' });
    expect(coverage.get('alto-rendimiento')?.ages).toEqual([12]);
  });

  it('sin programas no hay selector', () => {
    const { options, coverage } = buildAgePicker([]);

    expect(options).toEqual([]);
    expect(coverage.size).toBe(0);
  });

  it('ordena por edad aunque los programas lleguen desordenados', () => {
    const shuffled = [REAL_PROGRAMS[2], REAL_PROGRAMS[0], REAL_PROGRAMS[1]];
    expect(buildAgePicker(shuffled).options.map((option) => option.age)).toEqual(
      buildAgePicker(REAL_PROGRAMS).options.map((option) => option.age)
    );
  });
});
