import { describe, it, expect } from 'vitest';
import {
  countWeeklySessions,
  buildPathway,
  summarizePrograms,
  getLevelStyle,
  toPathwayInput,
  LEVEL_STYLES,
  OPEN_ENDED_AGE,
  type PathwayInput,
} from '../programs';

// Los tres programas reales del club: si el contenido cambia de forma, estos
// tests son los que avisan que la ruta de formación dejó de cuadrar.
const REAL_PROGRAMS: PathwayInput[] = [
  {
    id: 'escuela-de-iniciacion',
    title: 'Escuela de Iniciación',
    ageRange: '3 a 5 años',
    ageMin: 3,
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
      [3, 6],
      [6, 12],
      [12, 19],
    ]);
    expect(domain).toEqual({ from: 3, to: 19 });
  });

  it('reparte el ancho en proporción a los años de cada tramo', () => {
    const { stages } = buildPathway(REAL_PROGRAMS);
    expect(stages[0].startPct).toBe(0);
    // 3 de 16 años ≈ 18.75%
    expect(stages[0].widthPct).toBeCloseTo(18.75, 2);
    expect(stages[1].widthPct).toBeCloseTo(37.5, 2);
    const total = stages.reduce((sum, s) => sum + s.widthPct, 0);
    expect(total).toBeCloseTo(100, 1);
  });

  it('trata una edad máxima altísima como tramo abierto', () => {
    const { stages } = buildPathway(REAL_PROGRAMS);
    expect(stages[2].openEnded).toBe(true);
    expect(stages[2].shortAge).toBe('12+');
    expect(stages[0].openEnded).toBe(false);
    expect(stages[0].shortAge).toBe('3–5');
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
    expect(ticks).toHaveLength(17); // de los 3 a los 19 años
    expect(ticks.filter((t) => t.major).map((t) => t.age)).toEqual([3, 6, 12]);
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
          ageRange: '3 a 5 años',
          ageMin: 3,
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
    { ageMin: 3, ageMax: 5, schedule: 'Martes y viernes 4:30 PM', maxStudents: 20 },
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
    expect(summarizePrograms(withSchedules).ageRange).toBe('3+');
    expect(summarizePrograms([{ ageMin: 3, ageMax: 17 }]).ageRange).toBe('3–17');
    expect(OPEN_ENDED_AGE).toBeGreaterThan(17);
  });

  it('deja en null los datos que el contenido no respalda', () => {
    const totals = summarizePrograms([{ ageMin: 3, ageMax: 5 }]);
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
