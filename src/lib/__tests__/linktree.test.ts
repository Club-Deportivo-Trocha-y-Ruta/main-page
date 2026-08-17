import { describe, it, expect } from 'vitest';
import { nextRace, seasonProgress, linktreeStats } from '../linktree';

// El "hoy" se congela siempre: la página se construye en cada deploy y estos
// tests no pueden depender del reloj de la máquina que corra CI.
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

// ============================================================
// nextRace
// ============================================================

describe('nextRace', () => {
  it('devuelve la carrera en curso cuando es hoy', () => {
    // Quien escanea el QR en la carrera tiene que ver que es hoy.
    const next = nextRace(TEMPORADA, HOY);
    expect(next).toMatchObject({ id: 'palmira', city: 'Palmira', today: true });
  });

  it('devuelve la siguiente cuando no hay ninguna hoy', () => {
    const next = nextRace(TEMPORADA, new Date('2026-08-20T12:00:00Z'));
    expect(next).toMatchObject({ id: 'roldanillo', city: 'Roldanillo', today: false });
    expect(next?.day).toBe('20');
    // La abreviatura del mes depende del ICU del entorno ("sep" o "sept"); lo
    // que sí se garantiza es que va en minúscula y sin el punto final.
    expect(next?.month).toMatch(/^[a-záéíóú]+$/);
  });

  it('devuelve null cuando ya corrió toda la temporada', () => {
    expect(nextRace(TEMPORADA, new Date('2026-12-31T12:00:00Z'))).toBeNull();
  });

  it('devuelve null sin eventos', () => {
    expect(nextRace([], HOY)).toBeNull();
  });

  it('deja la ciudad en null si el evento no la trae', () => {
    const sinCiudad = [{ id: 'x', data: { title: 'Clásica', date: new Date('2026-09-01') } }];
    expect(nextRace(sinCiudad, HOY)?.city).toBeNull();
  });

  it('no anuncia como próxima una carrera cancelada', () => {
    const cancelada = [race('x', '2026-09-01', 'Cali', 'cancelled')];
    expect(nextRace(cancelada, HOY)).toBeNull();
  });
});

// ============================================================
// seasonProgress
// ============================================================

describe('seasonProgress', () => {
  it('cuenta las fechas corridas, incluida la de hoy', () => {
    expect(seasonProgress(TEMPORADA, HOY)).toEqual({ year: 2026, completed: 3, total: 4 });
  });

  it('devuelve null sin eventos', () => {
    expect(seasonProgress([], HOY)).toBeNull();
  });
});

// ============================================================
// linktreeStats
// ============================================================

describe('linktreeStats', () => {
  it('arma las tres cifras reales', () => {
    expect(linktreeStats({ years: 16, programs: 3, trees: 77 })).toEqual([
      { value: 16, label: 'años formando' },
      { value: 3, label: 'programas' },
      { value: 77, label: 'árboles sembrados' },
    ]);
  });

  it('omite la cifra que no se puede calcular, sin rellenarla', () => {
    const stats = linktreeStats({ years: 16, programs: null, trees: 0 });
    expect(stats.map((s) => s.label)).toEqual(['años formando']);
  });

  it('devuelve lista vacía cuando no hay ninguna', () => {
    expect(linktreeStats({ years: null, programs: null, trees: null })).toEqual([]);
  });

  it('concuerda el singular', () => {
    const stats = linktreeStats({ years: 1, programs: 1, trees: 1 });
    expect(stats.map((s) => s.label)).toEqual(['año formando', 'programa', 'árbol sembrado']);
  });
});
