import { describe, it, expect } from 'vitest';
import { buildClubFigures, heroPulse } from '../home';

const HOY = new Date('2026-08-16T12:00:00Z');

const race = (id: string, iso: string, city: string, status?: string) => ({
  id,
  data: { title: `Válida ${city}`, date: new Date(iso), city, status },
});

const TEMPORADA = [
  race('sevilla', '2026-01-25', 'Sevilla'),
  race('ginebra', '2026-02-28', 'Ginebra'),
  race('palmira', '2026-08-16', 'Palmira'),
  race('roldanillo', '2026-09-20', 'Roldanillo'),
];

// Los tres programas reales del club.
const PROGRAMAS = [
  { ageMin: 3, ageMax: 5, schedule: 'Martes y viernes 4:30 - 6:00 PM', maxStudents: 20 },
  { ageMin: 6, ageMax: 11, schedule: 'Lunes a viernes 4:00 - 6:00 PM', maxStudents: 25 },
  { ageMin: 12, ageMax: 99, schedule: 'Sáb 7-9 AM', maxStudents: 10 },
];

const COMPLETO = { years: 16, programs: PROGRAMAS, events: TEMPORADA, trees: 77, now: HOY };

// ============================================================
// buildClubFigures
// ============================================================

describe('buildClubFigures', () => {
  it('arma las cuatro cifras en orden fijo', () => {
    expect(buildClubFigures(COMPLETO).map((f) => f.id)).toEqual([
      'years',
      'programs',
      'season',
      'trees',
    ]);
  });

  it('cada cifra viaja con su procedencia y con dónde comprobarla', () => {
    for (const figure of buildClubFigures(COMPLETO)) {
      expect(figure.note.length).toBeGreaterThan(0);
      expect(figure.href).toMatch(/^\//);
    }
  });

  it('cuenta las fechas de la temporada y cuántas van corridas', () => {
    const season = buildClubFigures(COMPLETO).find((f) => f.id === 'season')!;
    expect(season.value).toBe(4);
    // Sevilla, Ginebra y la de hoy (Palmira, en curso).
    expect(season.note).toContain('3 ya corridas');
    expect(season.note).toContain('2026');
  });

  it('cuenta los programas y sus sesiones semanales', () => {
    const programs = buildClubFigures(COMPLETO).find((f) => f.id === 'programs')!;
    expect(programs.value).toBe(3);
    // 2 (Iniciación) + 5 (Formación) + 1 (Alto Rendimiento en este fixture)
    expect(programs.note).toBe('8 sesiones a la semana entre todos');
  });

  it('no afirma una edad mínima mientras el contenido se contradiga', () => {
    // `programs` arranca en 3; las FAQ y `constants.ts` dicen 4. La portada no
    // zanja esa discusión: describe la ruta sin dar la cifra.
    const programs = buildClubFigures(COMPLETO).find((f) => f.id === 'programs')!;
    expect(programs.note).not.toMatch(/\b[34] años\b/);
  });

  it('cae a describir la ruta cuando ningún horario es legible', () => {
    const figures = buildClubFigures({
      ...COMPLETO,
      programs: [{ ageMin: 3, ageMax: 5, schedule: 'A convenir' }],
    });
    expect(figures.find((f) => f.id === 'programs')!.note).toBe(
      'De la iniciación al alto rendimiento'
    );
  });

  it('no muestra las cifras que el contenido no sostiene', () => {
    const figures = buildClubFigures({
      years: null,
      programs: [],
      events: [],
      trees: 0,
      now: HOY,
    });
    expect(figures).toEqual([]);
  });

  it('se cae solo la cifra que falta, no la banda entera', () => {
    const figures = buildClubFigures({ ...COMPLETO, trees: null });
    expect(figures.map((f) => f.id)).toEqual(['years', 'programs', 'season']);
  });

  it('no repite las cifras históricas que muestra AboutPreview', () => {
    // `ridersTrained` y `medals` son afirmaciones del club sin dataset detrás:
    // viven en AboutPreview y no deben duplicarse aquí.
    const ids = buildClubFigures(COMPLETO).map((f) => f.id);
    expect(ids).not.toContain('riders');
    expect(ids).not.toContain('medals');
  });

  it('concuerda el singular', () => {
    const figures = buildClubFigures({
      years: 1,
      programs: [PROGRAMAS[0]],
      events: [TEMPORADA[3]],
      trees: 1,
      now: HOY,
    });
    expect(figures.map((f) => f.label)).toEqual([
      'año formando ciclistas',
      'programa de formación',
      'fecha en el calendario',
      'árbol sembrado',
    ]);
  });
});

// ============================================================
// heroPulse
// ============================================================

describe('heroPulse', () => {
  it('avisa cuando la carrera es hoy', () => {
    expect(heroPulse(TEMPORADA, HOY)).toMatchObject({
      today: true,
      when: 'Hoy',
      where: 'Palmira',
    });
  });

  it('da la fecha de la siguiente cuando no hay ninguna hoy', () => {
    const pulse = heroPulse(TEMPORADA, new Date('2026-08-20T12:00:00Z'));
    expect(pulse?.today).toBe(false);
    expect(pulse?.where).toBe('Roldanillo');
    expect(pulse?.when).toMatch(/^20 de [a-záéíóú]+$/);
  });

  it('devuelve null cuando ya corrió la temporada', () => {
    expect(heroPulse(TEMPORADA, new Date('2026-12-31T12:00:00Z'))).toBeNull();
  });

  it('devuelve null sin eventos', () => {
    expect(heroPulse([], HOY)).toBeNull();
  });

  it('deja la ciudad vacía si el evento no la trae, sin romperse', () => {
    const sinCiudad = [{ id: 'x', data: { title: 'Clásica', date: new Date('2026-09-01') } }];
    expect(heroPulse(sinCiudad, HOY)?.where).toBe('');
  });
});
