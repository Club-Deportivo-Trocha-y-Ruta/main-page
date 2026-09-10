import { describe, it, expect } from 'vitest';
import {
  activeObstacles,
  obstacleTypeLabel,
  obstacleTypeLabels,
  obstacleLevelLabel,
  obstacleLevelLabels,
  obstacleLevelColors,
  summarizeTrack,
  skillsByFrequency,
  programsUsingTrack,
  getAdjacentObstacles,
  filterTrackMilestones,
  TRACK_MILESTONE_IDS,
  MIN_OBSTACLES_FOR_GRID,
  MIN_OBSTACLES_FOR_SKILLS,
  type ObstacleInput,
} from '../la-pista';
import { OBSTACLE_LEVELS, OBSTACLE_TYPES } from '../schemas';

const at = (iso: string) => new Date(`${iso}T00:00:00Z`);

const obstaculo = (overrides: Partial<ObstacleInput> = {}): ObstacleInput => ({
  name: 'Cajón de grava de la bajada',
  type: 'cajon-grava',
  level: 'intermedio',
  summary: 'Un escalón relleno de grava al final de una bajada.',
  skills: ['Posición de ataque', 'Peso atrás en bajada'],
  programs: ['formacion-juvenil'],
  active: true,
  order: 0,
  ...overrides,
});

const PROGRAMS = [
  { id: 'escuela-de-iniciacion', title: 'Escuela de Iniciación' },
  { id: 'formacion-juvenil', title: 'Formación Juvenil' },
  { id: 'alto-rendimiento', title: 'Alto Rendimiento' },
];

// ============================================================
// Etiquetas
// ============================================================

describe('etiquetas de tipo y nivel', () => {
  it('cubre todos los valores del schema', () => {
    for (const type of OBSTACLE_TYPES) expect(obstacleTypeLabels[type]).toBeTruthy();
    for (const level of OBSTACLE_LEVELS) {
      expect(obstacleLevelLabels[level]).toBeTruthy();
      expect(obstacleLevelColors[level]).toBeTruthy();
    }
  });

  it('devuelve el valor crudo cuando no conoce la clave, en vez de vacío', () => {
    expect(obstacleTypeLabel('wall-ride')).toBe('wall-ride');
    expect(obstacleLevelLabel('imposible')).toBe('imposible');
  });

  it('traduce los tipos que ya existen', () => {
    expect(obstacleTypeLabel('cajon-grava')).toBe('Cajón de grava');
    expect(obstacleLevelLabel('avanzado')).toBe('Avanzado');
  });
});

// ============================================================
// activeObstacles
// ============================================================

describe('activeObstacles', () => {
  it('saca los inactivos y ordena por order', () => {
    const lista = activeObstacles([
      obstaculo({ name: 'Peralte', order: 2 }),
      obstaculo({ name: 'Escalón retirado', order: 1, active: false }),
      obstaculo({ name: 'Cajón', order: 1 }),
    ]);
    expect(lista.map((o) => o.name)).toEqual(['Cajón', 'Peralte']);
  });

  it('desempata por nombre en español', () => {
    const lista = activeObstacles([
      obstaculo({ name: 'Zeta', order: 0 }),
      obstaculo({ name: 'Ñandú', order: 0 }),
      obstaculo({ name: 'Árbol', order: 0 }),
    ]);
    expect(lista.map((o) => o.name)).toEqual(['Árbol', 'Ñandú', 'Zeta']);
  });

  it('no muta el arreglo que recibe', () => {
    const entrada = [obstaculo({ name: 'B', order: 2 }), obstaculo({ name: 'A', order: 1 })];
    activeObstacles(entrada);
    expect(entrada.map((o) => o.name)).toEqual(['B', 'A']);
  });
});

// ============================================================
// summarizeTrack
// ============================================================

describe('summarizeTrack', () => {
  it('devuelve null sin obstáculos, para que la página omita el bloque', () => {
    expect(summarizeTrack([])).toBeNull();
    expect(summarizeTrack([obstaculo({ active: false })])).toBeNull();
  });

  it('cuenta obstáculos, habilidades y programas distintos', () => {
    const summary = summarizeTrack([
      obstaculo({ skills: ['Posición de ataque', 'Peso atrás'], programs: ['formacion-juvenil'] }),
      obstaculo({
        name: 'Peralte de la curva sur',
        skills: ['Peso atrás', 'Lectura de línea'],
        programs: ['formacion-juvenil', 'alto-rendimiento'],
      }),
    ])!;

    expect(summary.totalObstacles).toBe(2);
    expect(summary.totalSkills).toBe(3);
    expect(summary.totalPrograms).toBe(2);
  });

  it('lista los niveles cubiertos de menor a mayor, sin repetir', () => {
    const summary = summarizeTrack([
      obstaculo({ level: 'avanzado' }),
      obstaculo({ level: 'basico' }),
      obstaculo({ level: 'avanzado' }),
    ])!;
    expect(summary.levels).toEqual(['basico', 'avanzado']);
  });

  it('toma la construcción más reciente y admite fichas sin fecha', () => {
    const summary = summarizeTrack([
      obstaculo({ builtOn: at('2026-08-15') }),
      obstaculo({ builtOn: at('2026-09-01') }),
      obstaculo({}),
    ])!;
    expect(summary.lastBuiltOn?.toISOString()).toBe('2026-09-01T00:00:00.000Z');
  });

  it('deja lastBuiltOn en null cuando ninguna ficha trae fecha', () => {
    expect(summarizeTrack([obstaculo({})])!.lastBuiltOn).toBeNull();
  });

  it('ignora los obstáculos inactivos en todas las cifras', () => {
    const summary = summarizeTrack([
      obstaculo({ skills: ['Peso atrás'], programs: ['formacion-juvenil'] }),
      obstaculo({
        active: false,
        level: 'avanzado',
        skills: ['Salto'],
        programs: ['alto-rendimiento'],
      }),
    ])!;
    expect(summary.totalObstacles).toBe(1);
    expect(summary.totalSkills).toBe(1);
    expect(summary.totalPrograms).toBe(1);
    expect(summary.levels).toEqual(['intermedio']);
  });
});

// ============================================================
// skillsByFrequency
// ============================================================

describe('skillsByFrequency', () => {
  it('ordena por cuántos obstáculos entrenan cada habilidad', () => {
    const skills = skillsByFrequency([
      obstaculo({ skills: ['Peso atrás', 'Lectura de línea'] }),
      obstaculo({ skills: ['Peso atrás'] }),
      obstaculo({ skills: ['Peso atrás', 'Frenada'] }),
    ]);
    expect(skills[0]).toEqual({ skill: 'Peso atrás', count: 3 });
    expect(skills.map((s) => s.skill)).toEqual(['Peso atrás', 'Frenada', 'Lectura de línea']);
  });

  it('agrupa sin distinguir mayúsculas ni espacios, y muestra la primera grafía', () => {
    const skills = skillsByFrequency([
      obstaculo({ skills: ['Peso atrás'] }),
      obstaculo({ skills: ['  peso ATRÁS '] }),
    ]);
    expect(skills).toEqual([{ skill: 'Peso atrás', count: 2 }]);
  });

  it('no cuenta dos veces una habilidad repetida dentro del mismo obstáculo', () => {
    const skills = skillsByFrequency([obstaculo({ skills: ['Peso atrás', 'peso atrás'] })]);
    expect(skills).toEqual([{ skill: 'Peso atrás', count: 1 }]);
  });

  it('descarta habilidades vacías y obstáculos inactivos', () => {
    const skills = skillsByFrequency([
      obstaculo({ skills: ['Peso atrás', '   '] }),
      obstaculo({ active: false, skills: ['Salto'] }),
    ]);
    expect(skills).toEqual([{ skill: 'Peso atrás', count: 1 }]);
  });

  it('devuelve [] sin obstáculos', () => {
    expect(skillsByFrequency([])).toEqual([]);
  });
});

// ============================================================
// programsUsingTrack
// ============================================================

describe('programsUsingTrack', () => {
  it('cruza los slugs con la colección y cuenta obstáculos por programa', () => {
    const programas = programsUsingTrack(
      [
        obstaculo({ programs: ['formacion-juvenil'] }),
        obstaculo({ programs: ['formacion-juvenil', 'alto-rendimiento'] }),
      ],
      PROGRAMS,
    );
    expect(programas).toEqual([
      { id: 'formacion-juvenil', title: 'Formación Juvenil', obstacleCount: 2 },
      { id: 'alto-rendimiento', title: 'Alto Rendimiento', obstacleCount: 1 },
    ]);
  });

  it('respeta el orden en que la página entrega los programas', () => {
    const programas = programsUsingTrack(
      [obstaculo({ programs: ['alto-rendimiento', 'escuela-de-iniciacion'] })],
      PROGRAMS,
    );
    expect(programas.map((p) => p.id)).toEqual(['escuela-de-iniciacion', 'alto-rendimiento']);
  });

  it('no cuenta dos veces un slug repetido en la misma ficha', () => {
    const programas = programsUsingTrack(
      [obstaculo({ programs: ['formacion-juvenil', 'formacion-juvenil'] })],
      PROGRAMS,
    );
    expect(programas[0].obstacleCount).toBe(1);
  });

  it('rompe el build nombrando el obstáculo y el slug que no resuelve', () => {
    expect(() =>
      programsUsingTrack(
        [obstaculo({ name: 'Doble del pump track', programs: ['semillero'] })],
        PROGRAMS,
      ),
    ).toThrow(/Doble del pump track.*semillero/s);
  });

  it('ignora los slugs de obstáculos inactivos', () => {
    expect(() =>
      programsUsingTrack([obstaculo({ active: false, programs: ['semillero'] })], PROGRAMS),
    ).not.toThrow();
  });

  it('devuelve [] cuando ninguna ficha referencia programas', () => {
    expect(programsUsingTrack([obstaculo({ programs: [] })], PROGRAMS)).toEqual([]);
  });
});

// ============================================================
// getAdjacentObstacles
// ============================================================

describe('getAdjacentObstacles', () => {
  const lista = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];

  it('devuelve el anterior y el siguiente en el orden del recorrido', () => {
    expect(getAdjacentObstacles(lista, 'b')).toEqual({ previous: { id: 'a' }, next: { id: 'c' } });
  });

  it('deja en null el lado que no existe en los extremos', () => {
    expect(getAdjacentObstacles(lista, 'a').previous).toBeNull();
    expect(getAdjacentObstacles(lista, 'c').next).toBeNull();
  });

  it('devuelve los dos en null si el obstáculo no está en la lista', () => {
    expect(getAdjacentObstacles(lista, 'z')).toEqual({ previous: null, next: null });
    expect(getAdjacentObstacles([], 'a')).toEqual({ previous: null, next: null });
  });
});

// ============================================================
// filterTrackMilestones
// ============================================================

describe('filterTrackMilestones', () => {
  it('devuelve solo los hitos de la historia de la pista', () => {
    const all = [
      { id: 'la-casa-pista-carlos-castro' },
      { id: '2012-primera-valida' },
      { id: 'otro-hito-ajeno' },
      { id: '2019-juegos-nacionales' },
      { id: '2021-panamericanos-junior' },
    ];
    const result = filterTrackMilestones(all);
    expect(result.map((e) => e.id)).toEqual([
      'la-casa-pista-carlos-castro',
      '2012-primera-valida',
      '2019-juegos-nacionales',
      '2021-panamericanos-junior',
    ]);
  });

  it('devuelve [] cuando ninguna entrada pertenece al conjunto', () => {
    expect(filterTrackMilestones([{ id: 'otro' }])).toEqual([]);
  });

  it('devuelve [] con lista vacía', () => {
    expect(filterTrackMilestones([])).toEqual([]);
  });

  it('el conjunto TRACK_MILESTONE_IDS contiene los cuatro hitos esperados', () => {
    expect(TRACK_MILESTONE_IDS.size).toBe(4);
    expect(TRACK_MILESTONE_IDS.has('la-casa-pista-carlos-castro')).toBe(true);
    expect(TRACK_MILESTONE_IDS.has('2021-panamericanos-junior')).toBe(true);
  });
});

// ============================================================
// Constantes de umbral
// ============================================================

describe('constantes de umbral', () => {
  it('MIN_OBSTACLES_FOR_GRID vale 2', () => {
    expect(MIN_OBSTACLES_FOR_GRID).toBe(2);
  });

  it('MIN_OBSTACLES_FOR_SKILLS vale 4', () => {
    expect(MIN_OBSTACLES_FOR_SKILLS).toBe(4);
  });

  it('MIN_OBSTACLES_FOR_SKILLS > MIN_OBSTACLES_FOR_GRID', () => {
    expect(MIN_OBSTACLES_FOR_SKILLS).toBeGreaterThan(MIN_OBSTACLES_FOR_GRID);
  });
});
