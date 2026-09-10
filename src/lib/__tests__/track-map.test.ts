import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import {
  parseGpx,
  distanceMeters,
  trackLengthMeters,
  trackBounds,
  simplifyTrack,
  buildTrackPath,
  latLonToPercent,
  type TrackPoint,
} from '../track-map';

/**
 * El GPX real de la vuelta del 5-sep-2026 se usa como caso de referencia: es
 * el archivo que va a dibujar el mapa en producción, y sus cifras (3,7 km,
 * bucle que cierra, 488 × 231 m) son las que se publican.
 */
const GPX = readFileSync('src/data/la-pista.gpx', 'utf8');

const gpxWith = (trkpts: string) => `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1"><trk><trkseg>${trkpts}</trkseg></trk></gpx>`;

// ============================================================
// parseGpx
// ============================================================

describe('parseGpx', () => {
  it('lee los 929 puntos de la vuelta real, con altitud', () => {
    const points = parseGpx(GPX);
    expect(points).toHaveLength(929);
    expect(points[0]).toEqual({ lat: 3.596901, lon: -76.486039, ele: 852.6 });
    expect(points.every((p) => typeof p.ele === 'number')).toBe(true);
  });

  it('acepta la altitud como hijo <ele> y la etiqueta autocerrada', () => {
    const points = parseGpx(
      gpxWith(`
        <trkpt lat="3.5969" lon="-76.4860"><ele>852.6</ele></trkpt>
        <trkpt lat="3.5970" lon="-76.4861" ele="853.0"/>
      `),
    );
    expect(points).toEqual([
      { lat: 3.5969, lon: -76.486, ele: 852.6 },
      { lat: 3.597, lon: -76.4861, ele: 853 },
    ]);
  });

  it('omite la altitud cuando el punto no la trae', () => {
    const points = parseGpx(gpxWith('<trkpt lat="3.5969" lon="-76.4860"></trkpt>'));
    expect(points).toEqual([{ lat: 3.5969, lon: -76.486 }]);
  });

  it('descarta puntos sin coordenadas válidas en vez de romper', () => {
    const points = parseGpx(
      gpxWith('<trkpt lat="" lon="-76.4860"/><trkpt lat="3.5969" lon="-76.4860"/>'),
    );
    expect(points).toHaveLength(1);
  });

  it('devuelve [] con un texto sin puntos', () => {
    expect(parseGpx('<gpx></gpx>')).toEqual([]);
    expect(parseGpx('')).toEqual([]);
  });
});

// ============================================================
// Medidas
// ============================================================

describe('distanceMeters y trackLengthMeters', () => {
  it('mide un grado de latitud en ~111 km', () => {
    const d = distanceMeters({ lat: 3, lon: -76 }, { lat: 4, lon: -76 });
    expect(d).toBeGreaterThan(111_000);
    expect(d).toBeLessThan(111_400);
  });

  it('da 0 entre un punto y sí mismo', () => {
    expect(distanceMeters({ lat: 3.5969, lon: -76.486 }, { lat: 3.5969, lon: -76.486 })).toBe(0);
  });

  it('la vuelta real mide unos 3,7 km', () => {
    const length = trackLengthMeters(parseGpx(GPX));
    expect(length).toBeGreaterThan(3600);
    expect(length).toBeLessThan(3800);
  });

  it('suma 0 con menos de dos puntos', () => {
    expect(trackLengthMeters([])).toBe(0);
    expect(trackLengthMeters([{ lat: 3.5969, lon: -76.486 }])).toBe(0);
  });
});

describe('trackBounds', () => {
  it('devuelve la caja envolvente de la vuelta real', () => {
    const bounds = trackBounds(parseGpx(GPX));
    expect(bounds.minLat).toBeCloseTo(3.594194, 6);
    expect(bounds.maxLat).toBeCloseTo(3.598578, 6);
    expect(bounds.minLon).toBeCloseTo(-76.487167, 6);
    expect(bounds.maxLon).toBeCloseTo(-76.485088, 6);
  });
});

// ============================================================
// simplifyTrack
// ============================================================

describe('simplifyTrack', () => {
  it('reduce los 929 puntos del GPS a menos de 300 conservando la longitud', () => {
    const points = parseGpx(GPX);
    const simplified = simplifyTrack(points, 1.5);

    expect(simplified.length).toBeLessThan(300);
    expect(simplified.length).toBeGreaterThan(40);
    // La forma se conserva: la longitud no se desvía más del 5%.
    const ratio = trackLengthMeters(simplified) / trackLengthMeters(points);
    expect(ratio).toBeGreaterThan(0.95);
    expect(ratio).toBeLessThan(1.05);
  });

  it('conserva los extremos', () => {
    const points = parseGpx(GPX);
    const simplified = simplifyTrack(points, 5);
    expect(simplified[0]).toEqual(points[0]);
    expect(simplified[simplified.length - 1]).toEqual(points[points.length - 1]);
  });

  it('descarta el punto intermedio de una recta y conserva el de una esquina', () => {
    const recta: TrackPoint[] = [
      { lat: 3.5969, lon: -76.486 },
      { lat: 3.597, lon: -76.486 },
      { lat: 3.5971, lon: -76.486 },
    ];
    expect(simplifyTrack(recta, 1.5)).toHaveLength(2);

    const esquina: TrackPoint[] = [
      { lat: 3.5969, lon: -76.486 },
      { lat: 3.597, lon: -76.486 },
      { lat: 3.597, lon: -76.4859 },
    ];
    expect(simplifyTrack(esquina, 1.5)).toHaveLength(3);
  });

  it('con tolerancia 0 o menos de tres puntos devuelve la traza tal cual', () => {
    const points = parseGpx(GPX);
    expect(simplifyTrack(points, 0)).toHaveLength(points.length);
    expect(simplifyTrack(points.slice(0, 2), 1.5)).toHaveLength(2);
  });
});

// ============================================================
// buildTrackPath
// ============================================================

describe('buildTrackPath', () => {
  const geometry = buildTrackPath(parseGpx(GPX))!;

  it('reconoce la vuelta como bucle y cierra el path', () => {
    expect(geometry.isLoop).toBe(true);
    expect(geometry.path.endsWith(' Z')).toBe(true);
    expect(geometry.path.startsWith('M')).toBe(true);
  });

  it('publica la longitud redondeada de la vuelta grabada', () => {
    expect(geometry.lengthMeters).toBe(3717);
  });

  it('respeta el aspecto real del terreno: más alto que ancho', () => {
    expect(geometry.viewBox).toBe(`0 0 ${geometry.width} ${geometry.height}`);
    expect(geometry.width).toBe(1000);
    // 488 m norte-sur contra 231 m este-oeste → algo más del doble de alto.
    expect(geometry.height / geometry.width).toBeGreaterThan(1.8);
    expect(geometry.height / geometry.width).toBeLessThan(2.4);
  });

  it('deja todas las coordenadas dentro del viewBox, con el padding', () => {
    const coords = geometry.path
      .replace(/^M/, '')
      .replace(/ Z$/, '')
      .split(' L')
      .map((pair) => pair.split(' ').map(Number));

    expect(coords.length).toBe(geometry.pointCount);
    for (const [x, y] of coords) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(geometry.width);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(geometry.height);
    }
    // El trazado llega a los bordes interiores: la escala aprovecha el lienzo.
    // No los toca exactamente porque el punto extremo puede caer dentro de la
    // tolerancia de simplificación (1,5 m ≈ 3 unidades del viewBox).
    const xs = coords.map(([x]) => x);
    const ys = coords.map(([, y]) => y);
    expect(Math.min(...xs)).toBeLessThan(24 + 3);
    expect(Math.max(...ys)).toBeGreaterThan(geometry.height - 24 - 3);
  });

  it('centra la caja envolvente donde está la pista (el geo del JSON-LD)', () => {
    expect(geometry.center.lat).toBeCloseTo(3.596386, 5);
    expect(geometry.center.lon).toBeCloseTo(-76.486128, 5);
  });

  it('no cierra una traza que termina lejos del inicio', () => {
    const abierta = buildTrackPath([
      { lat: 3.5942, lon: -76.4872 },
      { lat: 3.5965, lon: -76.486 },
      { lat: 3.5986, lon: -76.4851 },
    ])!;
    expect(abierta.isLoop).toBe(false);
    expect(abierta.path.endsWith('Z')).toBe(false);
  });

  it('devuelve null sin trazado que dibujar', () => {
    expect(buildTrackPath([])).toBeNull();
    expect(buildTrackPath([{ lat: 3.5969, lon: -76.486 }])).toBeNull();
    // Todos los puntos en el mismo sitio: no hay forma que proyectar.
    expect(
      buildTrackPath([
        { lat: 3.5969, lon: -76.486 },
        { lat: 3.5969, lon: -76.486 },
      ]),
    ).toBeNull();
  });

  it('acepta otro ancho y otro padding, y los publica', () => {
    expect(geometry.padding).toBe(24);
    const chico = buildTrackPath(parseGpx(GPX), { width: 400, padding: 0 })!;
    expect(chico.width).toBe(400);
    expect(chico.padding).toBe(0);
    expect(chico.viewBox).toBe(`0 0 400 ${chico.height}`);
  });

  it('con tolerancia 6 m el bucle sigue cerrando y la longitud no varía', () => {
    const points = parseGpx(GPX);
    const geo6 = buildTrackPath(points, { toleranceMeters: 6 })!;
    const geo2 = buildTrackPath(points, { toleranceMeters: 2 })!;
    // El bucle debe seguir cerrando: el inicio y el final están a 6,5 m, y la
    // tolerancia de simplificación se aplica a la forma, no al cierre.
    expect(geo6.isLoop).toBe(true);
    // lengthMeters usa los puntos originales, independiente de la tolerancia.
    expect(geo6.lengthMeters).toBe(geo2.lengthMeters);
    // Con tolerancia mayor se dibujan menos puntos.
    expect(geo6.pointCount).toBeLessThan(geo2.pointCount);
  });
});

// ============================================================
// latLonToPercent
// ============================================================

describe('latLonToPercent', () => {
  const bounds = { minLat: 3.594194, maxLat: 3.598578, minLon: -76.487167, maxLon: -76.485088 };

  it('pone la esquina noroeste arriba a la izquierda', () => {
    expect(latLonToPercent({ lat: bounds.maxLat, lon: bounds.minLon }, bounds)).toEqual({
      xPct: 0,
      yPct: 0,
    });
  });

  it('pone la esquina sureste abajo a la derecha', () => {
    expect(latLonToPercent({ lat: bounds.minLat, lon: bounds.maxLon }, bounds)).toEqual({
      xPct: 100,
      yPct: 100,
    });
  });

  it('deja el centro en el medio', () => {
    const centro = latLonToPercent(
      { lat: (bounds.minLat + bounds.maxLat) / 2, lon: (bounds.minLon + bounds.maxLon) / 2 },
      bounds,
    );
    expect(centro.xPct).toBeCloseTo(50, 1);
    expect(centro.yPct).toBeCloseTo(50, 1);
  });

  it('no divide por cero con una caja degenerada', () => {
    const punto = { lat: 3.5969, lon: -76.486 };
    expect(
      latLonToPercent(punto, { minLat: 3.5969, maxLat: 3.5969, minLon: -76.486, maxLon: -76.486 }),
    ).toEqual({ xPct: 50, yPct: 50 });
  });
});
