import { describe, it, expect } from 'vitest';
import {
  calendarControlPoint,
  newsControlPoint,
  programsControlPoint,
  enrollmentControlPoint,
  buildControlPoints,
  type ControlPointId,
} from '../not-found';
import { dayLabel, monthShort } from '../calendar';
import { ENROLLMENT_STEPS } from '../enrollment';

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

const evento = (id: string, date: string, extra: Record<string, unknown> = {}) => ({
  id,
  data: { title: `Válida ${id}`, date: at(date), ...extra },
});

const noticia = (title: string, date: string) => ({ data: { title, date: at(date) } });

const programa = (
  ageMin: number,
  ageMax: number,
  extra: Record<string, unknown> = {}
) => ({ ageMin, ageMax, ...extra });

// ============================================================
// calendarControlPoint
// ============================================================

describe('calendarControlPoint', () => {
  const hoy = new Date('2026-08-15T17:00:00Z');

  it('siempre apunta a /calendario y trae la etiqueta de navegación', () => {
    const cp = calendarControlPoint([], hoy);
    expect(cp.id).toBe('calendario');
    expect(cp.label).toBe('Calendario');
    expect(cp.href).toBe('/calendario');
  });

  it('arma el dato con día, mes y ciudad de la próxima fecha', () => {
    const fecha = at('2026-09-26');
    const cp = calendarControlPoint(
      [evento('roldanillo', '2026-09-26', { city: 'Roldanillo' })],
      hoy
    );
    expect(cp.fact).toEqual({
      icon: 'ph:flag-checkered-bold',
      label: 'Próxima fecha',
      value: `${dayLabel(fecha)} de ${monthShort(fecha)} · Roldanillo`,
    });
  });

  it('cae en el título cuando el evento no trae ciudad, igual que buildSeason', () => {
    const cp = calendarControlPoint(
      [evento('interno', '2026-09-26', { title: 'Rodada interna' })],
      hoy
    );
    expect(cp.fact?.value).toContain('Rodada interna');
  });

  it('elige la parada más próxima cuando hay varias por venir', () => {
    const cp = calendarControlPoint(
      [
        evento('roldanillo', '2026-09-26', { city: 'Roldanillo' }),
        evento('cali', '2026-08-20', { city: 'Cali' }),
      ],
      hoy
    );
    expect(cp.fact?.value).toContain('Cali');
  });

  it('el punto de control aparece igual sin próxima fecha, pero sin el dato', () => {
    const soloPasado = [evento('vieja', '2026-01-10')];
    const cp = calendarControlPoint(soloPasado, hoy);
    expect(cp.id).toBe('calendario');
    expect(cp.href).toBe('/calendario');
    expect(cp.fact).toBeNull();
  });

  it('no inventa nada sin eventos', () => {
    expect(calendarControlPoint([], hoy).fact).toBeNull();
  });
});

// ============================================================
// newsControlPoint
// ============================================================

describe('newsControlPoint', () => {
  it('elige la fecha más reciente sin importar el orden de llegada', () => {
    const news = [
      noticia('Doblete en Cali', '2026-05-17'),
      noticia('Isabel gana en Palmira', '2026-08-02'),
      noticia('Debut en Sevilla', '2026-01-31'),
    ];
    expect(newsControlPoint(news).fact?.value).toContain('Isabel gana en Palmira');
  });

  it('combina título y fecha corta en un solo dato', () => {
    const fecha = at('2026-08-02');
    const cp = newsControlPoint([noticia('Isabel gana en Palmira', '2026-08-02')]);
    expect(cp.fact).toEqual({
      icon: 'ph:newspaper-bold',
      label: 'Última crónica',
      value: `Isabel gana en Palmira · ${dayLabel(fecha)} de ${monthShort(fecha)}`,
    });
  });

  it('el punto de control aparece igual sin noticias, pero sin el dato', () => {
    const cp = newsControlPoint([]);
    expect(cp.id).toBe('noticias');
    expect(cp.href).toBe('/noticias');
    expect(cp.fact).toBeNull();
  });
});

// ============================================================
// programsControlPoint
// ============================================================

describe('programsControlPoint', () => {
  it('cuenta los programas y muestra el rango de edades de summarizePrograms', () => {
    const cp = programsControlPoint([programa(3, 5), programa(6, 11), programa(12, 99)]);
    expect(cp.fact).toEqual({
      icon: 'ph:users-three-bold',
      label: 'Programas activos',
      value: '3 programas · 3+ años',
    });
  });

  it('usa singular con un solo programa', () => {
    const cp = programsControlPoint([programa(3, 17)]);
    expect(cp.fact?.value).toBe('1 programa · 3–17 años');
  });

  it('el punto de control aparece igual sin programas, pero sin el dato', () => {
    const cp = programsControlPoint([]);
    expect(cp.id).toBe('programas');
    expect(cp.href).toBe('/programas');
    expect(cp.fact).toBeNull();
  });
});

// ============================================================
// enrollmentControlPoint
// ============================================================

describe('enrollmentControlPoint', () => {
  it('usa el primer paso real del proceso de inscripción', () => {
    const cp = enrollmentControlPoint();
    expect(cp.id).toBe('inscripciones');
    expect(cp.href).toBe('/inscripciones');
    expect(cp.fact).toEqual({
      icon: ENROLLMENT_STEPS[0].icon,
      label: `Paso 1 de ${ENROLLMENT_STEPS.length}`,
      value: ENROLLMENT_STEPS[0].title,
    });
  });

  it('se recalcula solo si el proceso cambia de número de pasos', () => {
    const pasos = ENROLLMENT_STEPS.slice(0, 2);
    expect(enrollmentControlPoint(pasos).fact?.label).toBe('Paso 1 de 2');
  });

  it('no inventa un paso si la lista llega vacía', () => {
    expect(enrollmentControlPoint([]).fact).toBeNull();
  });
});

// ============================================================
// buildControlPoints
// ============================================================

describe('buildControlPoints', () => {
  const hoy = new Date('2026-08-15T17:00:00Z');

  it('siempre devuelve los cuatro puntos de control en el mismo orden', () => {
    const orden: ControlPointId[] = ['calendario', 'noticias', 'programas', 'inscripciones'];

    const conTodo = buildControlPoints({
      events: [evento('roldanillo', '2026-09-26', { city: 'Roldanillo' })],
      news: [noticia('Isabel gana en Palmira', '2026-08-02')],
      programs: [programa(3, 17)],
      now: hoy,
    });
    expect(conTodo.map((cp) => cp.id)).toEqual(orden);

    const sinNada = buildControlPoints({ events: [], news: [], programs: [], now: hoy });
    expect(sinNada.map((cp) => cp.id)).toEqual(orden);
  });

  it('nunca hace desaparecer un punto de control por falta de contenido', () => {
    const puntos = buildControlPoints({ events: [], news: [], programs: [], now: hoy });
    expect(puntos).toHaveLength(4);
    // Sin eventos, noticias ni programas, solo inscripciones sostiene un dato
    // (sale de la constante ENROLLMENT_STEPS, no de una collection).
    expect(puntos.map((cp) => cp.fact === null)).toEqual([true, true, true, false]);
  });

  it('no inventa datos: cada fact que aparece se puede rastrear al contenido recibido', () => {
    const puntos = buildControlPoints({
      events: [evento('roldanillo', '2026-09-26', { city: 'Roldanillo' })],
      news: [],
      programs: [],
      now: hoy,
    });
    const [calendario, noticias, programas] = puntos;
    expect(calendario.fact?.value).toContain('Roldanillo');
    expect(noticias.fact).toBeNull();
    expect(programas.fact).toBeNull();
  });

  it('usa "ahora" por defecto cuando no se pasa `now`', () => {
    expect(() => buildControlPoints({ events: [], news: [], programs: [] })).not.toThrow();
  });
});
