import { describe, it, expect } from 'vitest';
import {
  SECTION_TONES,
  getTone,
  getWidth,
  getSpacing,
  uniqueSvgId,
  elevationProfile,
  elevationPointAt,
  TOPO_PATHS,
  TOPO_TILE,
} from '../editorial';

// ============================================================
// Tokens de sección
// ============================================================

describe('tokens de sección', () => {
  it('resuelve cada variante declarada', () => {
    expect(getTone('dark').inverted).toBe(true);
    expect(getWidth('wide')).toBe('max-w-7xl');
    expect(getSpacing('compact')).toBe('py-12 md:py-16');
  });

  it('cae en la variante neutra ante un valor desconocido', () => {
    expect(getTone('neon' as never)).toBe(SECTION_TONES.plain);
    expect(getWidth(undefined)).toBe('max-w-5xl');
    expect(getSpacing(undefined)).toBe('py-16 md:py-24');
  });

  it('solo el tono oscuro se declara invertido', () => {
    const inverted = Object.entries(SECTION_TONES)
      .filter(([, tokens]) => tokens.inverted)
      .map(([name]) => name);
    expect(inverted).toEqual(['dark']);
  });

  it('ningún tono claro usa el teal vivo como color de texto', () => {
    // #20b7c9 se queda en 2.4:1 sobre blanco: en fondos claros va -deep.
    for (const [name, tokens] of Object.entries(SECTION_TONES)) {
      if (tokens.inverted) continue;
      expect(tokens.eyebrow, name).not.toBe('text-primary');
    }
  });
});

describe('uniqueSvgId', () => {
  it('no repite ids entre llamadas', () => {
    const ids = [uniqueSvgId('topo'), uniqueSvgId('topo'), uniqueSvgId('pathway')];
    expect(new Set(ids).size).toBe(3);
    expect(ids[0]).toMatch(/^topo-\d+$/);
  });
});

// ============================================================
// Patrón de curvas de nivel
// ============================================================

describe('TOPO_PATHS', () => {
  const coords = (d: string) =>
    [...d.matchAll(/(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)/g)].map(([, x, y]) => ({
      x: Number(x),
      y: Number(y),
    }));

  it('cada curva entra y sale del tile a la misma altura', () => {
    for (const d of TOPO_PATHS) {
      const points = coords(d);
      const first = points[0];
      const last = points[points.length - 1];
      expect(first.x).toBe(0);
      expect(last.x).toBe(TOPO_TILE);
      expect(last.y).toBe(first.y);
    }
  });

  it('ningún punto se sale del tile: <pattern> recorta lo que sobra', () => {
    for (const d of TOPO_PATHS) {
      for (const { x, y } of coords(d)) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(TOPO_TILE);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(TOPO_TILE);
      }
    }
  });
});

// ============================================================
// Perfil de elevación
// ============================================================

describe('elevationProfile', () => {
  it('arranca abajo a la izquierda y termina arriba a la derecha', () => {
    const { line, base } = elevationProfile();
    const points = [...line.matchAll(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g)].map(([, x, y]) => ({
      x: Number(x),
      y: Number(y),
    }));

    expect(points[0]).toEqual({ x: 0, y: base });
    expect(points[points.length - 1].x).toBe(1000);
    // En SVG la Y crece hacia abajo: terminar más arriba es terminar con menos Y.
    expect(points[points.length - 1].y).toBeLessThan(points[0].y / 2);
  });

  it('nunca se sale del viewBox', () => {
    const height = 260;
    const { line } = elevationProfile({ height });
    for (const [, , y] of line.matchAll(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g)) {
      expect(Number(y)).toBeGreaterThanOrEqual(0);
      expect(Number(y)).toBeLessThanOrEqual(height);
    }
  });

  it('el área cierra contra el suelo para poder rellenarla', () => {
    const { area, base } = elevationProfile({ width: 500 });
    expect(area.endsWith(`L500 ${base} L0 ${base} Z`)).toBe(true);
  });

  it('respeta el número de muestras', () => {
    const { line } = elevationProfile({ samples: 10 });
    expect(line.split('L')).toHaveLength(11); // M + 10 segmentos
  });
});

describe('elevationPointAt', () => {
  it('sitúa los marcadores sobre el terreno, en porcentaje', () => {
    const start = elevationPointAt(0);
    const end = elevationPointAt(1);

    expect(start.xPct).toBe(0);
    expect(end.xPct).toBe(100);
    expect(start.yPct).toBeGreaterThan(end.yPct);
    expect(end.yPct).toBeGreaterThanOrEqual(0);
  });

  it('recorta valores fuera de rango en vez de salirse del recuadro', () => {
    expect(elevationPointAt(-1).xPct).toBe(0);
    expect(elevationPointAt(4).xPct).toBe(100);
  });

  it('coincide con el trazo del perfil en el mismo punto', () => {
    const height = 260;
    const { line } = elevationProfile({ height, samples: 4 });
    const points = [...line.matchAll(/(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/g)].map(([, , y]) => Number(y));
    expect(elevationPointAt(0.5, { height }).yPct).toBeCloseTo((points[2] / height) * 100, 1);
  });
});
