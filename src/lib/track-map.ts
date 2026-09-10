/**
 * Trazado de la pista: del GPX al `path` del SVG.
 *
 * El mapa de `/la-pista` no se dibuja a mano: se proyecta desde una vuelta
 * grabada con GPS (`src/data/la-pista.gpx`, 5-sep-2026, 929 puntos a 1 Hz).
 * Así el trazado es dato y no ilustración, y el día que se regrabe la vuelta
 * basta con reemplazar el archivo.
 *
 * Módulo puro, como el resto de `src/lib/`: no lee del disco ni importa
 * `astro:content`. La página hace `import gpx from '@/data/la-pista.gpx?raw'`
 * y le pasa el texto.
 *
 * **Elevación**: el GPX trae `ele` en cada punto, pero el dato es ruidoso —el
 * primer punto marca 852,6 m y un segundo después 866,2— así que el desnivel
 * acumulado varía entre 2 y 76 m según cómo se filtre. Este módulo no publica
 * ninguna cifra de desnivel: sería inventarla (regla del proyecto). Lo que sí
 * es sólido es el trazado en planta.
 */

/** Un punto crudo del GPX. */
export interface TrackPoint {
  lat: number;
  lon: number;
  /** Altitud en metros, tal como viene del GPS. Ver nota de cabecera. */
  ele?: number;
}

export interface TrackBounds {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export interface TrackGeometry {
  /** Atributo `d` del `<path>`, ya normalizado al `viewBox`. */
  path: string;
  /** `"0 0 <width> <height>"`, listo para el atributo del `<svg>`. */
  viewBox: string;
  width: number;
  height: number;
  /**
   * Margen interior usado, en unidades del `viewBox`. Quien coloque marcadores
   * encima del mapa lo necesita: `map.x/y` de un obstáculo es un porcentaje de
   * la caja del trazado, no del `viewBox`, y la conversión pasa por aquí.
   */
  padding: number;
  /** Puntos usados para dibujar, después de simplificar. */
  pointCount: number;
  /** Longitud de la vuelta en metros, sobre los puntos originales. */
  lengthMeters: number;
  /** `true` cuando el final vuelve al inicio: el `path` se cierra con `Z`. */
  isLoop: boolean;
  bounds: TrackBounds;
  /** Centro de la caja envolvente. Es la coordenada del `geo` del JSON-LD. */
  center: { lat: number; lon: number };
}

const EARTH_RADIUS_M = 6_371_000;
const toRad = (deg: number) => (deg * Math.PI) / 180;

// ─── Parseo ────────────────────────────────────────────────────────────────

// Un GPX de Strava/Garmin es XML plano y predecible; una expresión regular
// sobre `<trkpt>` evita meter un parser de XML en el bundle de build. Acepta
// los atributos en cualquier orden y `ele` como atributo o como hijo.
const TRKPT_RE = /<trkpt\b([^>]*)>([\s\S]*?)<\/trkpt>|<trkpt\b([^>]*)\/>/g;
const ATTR_RE = (name: string) => new RegExp(`\\b${name}\\s*=\\s*"([-\\d.eE]+)"`);
const ELE_CHILD_RE = /<ele>\s*([-\d.eE]+)\s*<\/ele>/;

/**
 * Extrae los puntos de un GPX en orden. Devuelve `[]` si el texto no trae
 * ninguno, para que quien llame decida si eso es un error o simplemente
 * "todavía no hay trazado".
 */
export function parseGpx(xml: string): TrackPoint[] {
  const points: TrackPoint[] = [];

  for (const match of xml.matchAll(TRKPT_RE)) {
    const attrs = match[1] ?? match[3] ?? '';
    const body = match[2] ?? '';

    const lat = Number(attrs.match(ATTR_RE('lat'))?.[1]);
    const lon = Number(attrs.match(ATTR_RE('lon'))?.[1]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;

    const eleRaw = attrs.match(ATTR_RE('ele'))?.[1] ?? body.match(ELE_CHILD_RE)?.[1];
    const ele = eleRaw === undefined ? undefined : Number(eleRaw);

    points.push(ele !== undefined && Number.isFinite(ele) ? { lat, lon, ele } : { lat, lon });
  }

  return points;
}

// ─── Medidas sobre coordenadas ─────────────────────────────────────────────

/**
 * Distancia entre dos puntos en metros. Proyección equirectangular local: a
 * la escala de una pista (medio kilómetro de lado) el error frente a Haversine
 * es de milímetros, y evita las trigonométricas por punto.
 */
export function distanceMeters(a: TrackPoint, b: TrackPoint): number {
  const meanLat = toRad((a.lat + b.lat) / 2);
  const dx = toRad(b.lon - a.lon) * Math.cos(meanLat) * EARTH_RADIUS_M;
  const dy = toRad(b.lat - a.lat) * EARTH_RADIUS_M;
  return Math.hypot(dx, dy);
}

/** Longitud recorrida sumando tramo a tramo. */
export function trackLengthMeters(points: TrackPoint[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distanceMeters(points[i - 1], points[i]);
  return total;
}

export function trackBounds(points: TrackPoint[]): TrackBounds {
  const lats = points.map((p) => p.lat);
  const lons = points.map((p) => p.lon);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLon: Math.min(...lons),
    maxLon: Math.max(...lons),
  };
}

// ─── Simplificación ────────────────────────────────────────────────────────

/**
 * Ramer-Douglas-Peucker con tolerancia en metros: conserva la forma de la
 * pista y descarta el temblor del GPS parado. Los 929 puntos del archivo real
 * bajan a unos 200 con 1,5 m, y el `path` deja de pesar más que la página.
 *
 * Implementación iterativa (pila explícita) para no arriesgar la recursión con
 * trazas largas.
 */
export function simplifyTrack(points: TrackPoint[], toleranceMeters = 1.5): TrackPoint[] {
  if (points.length <= 2 || toleranceMeters <= 0) return [...points];

  const keep = new Array<boolean>(points.length).fill(false);
  keep[0] = true;
  keep[points.length - 1] = true;

  const stack: [number, number][] = [[0, points.length - 1]];

  while (stack.length > 0) {
    const [first, last] = stack.pop()!;
    if (last - first < 2) continue;

    let maxDistance = 0;
    let index = first;

    for (let i = first + 1; i < last; i++) {
      const distance = perpendicularDistanceMeters(points[i], points[first], points[last]);
      if (distance > maxDistance) {
        maxDistance = distance;
        index = i;
      }
    }

    if (maxDistance > toleranceMeters) {
      keep[index] = true;
      stack.push([first, index], [index, last]);
    }
  }

  return points.filter((_, i) => keep[i]);
}

/** Distancia de un punto al segmento `start`–`end`, en metros. */
function perpendicularDistanceMeters(
  point: TrackPoint,
  start: TrackPoint,
  end: TrackPoint,
): number {
  // Se trabaja en metros locales con `start` como origen: así la distancia no
  // se deforma por la diferencia de escala entre grados de latitud y longitud.
  const meanLat = toRad(start.lat);
  const toXY = (p: TrackPoint) => ({
    x: toRad(p.lon - start.lon) * Math.cos(meanLat) * EARTH_RADIUS_M,
    y: toRad(p.lat - start.lat) * EARTH_RADIUS_M,
  });

  const p = toXY(point);
  const e = toXY(end);
  const lengthSq = e.x * e.x + e.y * e.y;

  if (lengthSq === 0) return Math.hypot(p.x, p.y);

  const t = Math.min(Math.max((p.x * e.x + p.y * e.y) / lengthSq, 0), 1);
  return Math.hypot(p.x - t * e.x, p.y - t * e.y);
}

// ─── Proyección al SVG ─────────────────────────────────────────────────────

export interface TrackPathOptions {
  /** Ancho del `viewBox`. El alto sale del aspecto real del terreno. */
  width?: number;
  /** Margen interior en unidades del `viewBox`, para que el trazo no se corte. */
  padding?: number;
  /** Tolerancia de `simplifyTrack`, en metros. `0` desactiva la simplificación. */
  toleranceMeters?: number;
  /**
   * Separación máxima entre el primer y el último punto para considerar la
   * vuelta cerrada. La vuelta grabada cierra a 6,5 m.
   */
  loopThresholdMeters?: number;
  /** Decimales de las coordenadas del `path`. */
  precision?: number;
}

/**
 * Proyecta la traza a un `path` SVG con el norte arriba y sin deformar: la
 * escala es la misma en los dos ejes, así que el alto del `viewBox` se deduce
 * de la forma real del terreno: la vuelta grabada mide 231 m de este a oeste
 * por 488 m de norte a sur, y el mapa sale igual de vertical.
 */
export function buildTrackPath(
  points: TrackPoint[],
  options: TrackPathOptions = {},
): TrackGeometry | null {
  const {
    width = 1000,
    padding = 24,
    toleranceMeters = 1.5,
    loopThresholdMeters = 15,
    precision = 2,
  } = options;

  if (points.length < 2) return null;

  const bounds = trackBounds(points);
  const center = {
    lat: (bounds.minLat + bounds.maxLat) / 2,
    lon: (bounds.minLon + bounds.maxLon) / 2,
  };

  // Ancho y alto reales del terreno, en metros.
  const spanX = distanceMeters(
    { lat: center.lat, lon: bounds.minLon },
    { lat: center.lat, lon: bounds.maxLon },
  );
  const spanY = distanceMeters(
    { lat: bounds.minLat, lon: center.lon },
    { lat: bounds.maxLat, lon: center.lon },
  );

  if (spanX === 0 && spanY === 0) return null;

  const inner = Math.max(width - padding * 2, 1);
  // Una sola escala para los dos ejes: el trazado no se estira.
  const scale = spanX > 0 ? inner / spanX : inner / spanY;
  const height = round(spanY * scale + padding * 2, precision);

  const drawn = toleranceMeters > 0 ? simplifyTrack(points, toleranceMeters) : points;

  const toSvg = (p: TrackPoint) => {
    const x =
      distanceMeters({ lat: p.lat, lon: bounds.minLon }, { lat: p.lat, lon: p.lon }) * scale;
    // El eje Y del SVG crece hacia abajo y la latitud hacia el norte: se invierte.
    const y =
      distanceMeters({ lat: p.lat, lon: p.lon }, { lat: bounds.maxLat, lon: p.lon }) * scale;
    return `${round(x + padding, precision)} ${round(y + padding, precision)}`;
  };

  const first = points[0];
  const last = points[points.length - 1];
  const isLoop = distanceMeters(first, last) <= loopThresholdMeters;

  // Con la vuelta cerrada se descarta el último punto y cierra `Z`: evita el
  // solape de dos extremos casi iguales, que se ve como un pico en la unión.
  const drawnPoints = isLoop && drawn.length > 2 ? drawn.slice(0, -1) : drawn;
  const path = `M${drawnPoints.map(toSvg).join(' L')}${isLoop ? ' Z' : ''}`;

  return {
    path,
    viewBox: `0 0 ${width} ${height}`,
    width,
    height,
    padding,
    pointCount: drawnPoints.length,
    lengthMeters: Math.round(trackLengthMeters(points)),
    isLoop,
    bounds,
    center,
  };
}

/**
 * Dónde cae una coordenada real dentro del mapa, en % del `viewBox`. Sirve
 * para colocar un marcador desde un GPS sin tener que estimar `map.x/y` a ojo.
 * Un punto fuera de la caja del trazado devuelve valores fuera de 0-100: quien
 * llame decide si lo recorta o lo descarta.
 */
export function latLonToPercent(
  point: TrackPoint,
  bounds: TrackBounds,
): { xPct: number; yPct: number } {
  const spanLon = bounds.maxLon - bounds.minLon;
  const spanLat = bounds.maxLat - bounds.minLat;

  return {
    xPct: spanLon === 0 ? 50 : round(((point.lon - bounds.minLon) / spanLon) * 100, 2),
    yPct: spanLat === 0 ? 50 : round(((bounds.maxLat - point.lat) / spanLat) * 100, 2),
  };
}

function round(value: number, precision: number): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}
