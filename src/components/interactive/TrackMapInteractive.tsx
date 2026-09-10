/**
 * TrackMapInteractive — mapa satelital de la Pista Carlos Castro.
 *
 * Mejora progresiva sobre el SVG del trazado: el SVG llega en el HTML (cero JS,
 * es lo que se ve mientras la island no ha hidratado y lo único que se ve sin
 * JavaScript) y este componente lo reemplaza por un mapa Leaflet cuando entra
 * en pantalla. Por eso se monta siempre con `client:visible`, nunca
 * `client:load`: la portada de la sección no debe pagar Leaflet.
 *
 * No añade dependencias: `leaflet` ya está en el proyecto por `TrochaVerdeMap`.
 * El trazado llega como pares [lat, lng] ya simplificados en build
 * (`simplifyTrack` en `@lib/track-map`), así el GPX crudo de 106 KB nunca viaja
 * al cliente.
 */
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { Map } from 'leaflet';

export interface TrackObstacleMarker {
  slug: string;
  name: string;
  level: string;
  lat: number;
  lng: number;
  /** Número que lleva en el recorrido. */
  number: number;
  image?: string;
  imageAlt?: string;
}

interface TrackMapInteractiveProps {
  /** Vértices del trazado, ya simplificados: [lat, lng]. */
  track: [number, number][];
  obstacles?: TrackObstacleMarker[];
  /** El SVG del trazado, visible hasta que Leaflet monta y sin JavaScript. */
  children?: ReactNode;
}

/**
 * ESRI World Imagery: satélite gratuito, sin llave ni cuenta.
 *
 * `maxNativeZoom: 19` no es cosmético. Sobre Yumbo, ESRI solo tiene imagen
 * hasta z19; a partir de z20 responde **HTTP 200 con una tesela gris**
 * ("Map data not yet available"), que Leaflet no puede distinguir de una foto
 * real. Con esta opción, los zooms más cercanos reescalan la tesela de z19 en
 * vez de pedir las grises. Verificado el 2026-09-09 sobre la pista.
 */
const SATELLITE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
const SATELLITE_ATTRIBUTION = 'Imagen satelital: Esri, Maxar, Earthstar Geographics';
const MAX_NATIVE_ZOOM = 19;

const LEVEL_COLORS: Record<string, string> = {
  basico: '#059669',
  intermedio: '#b45309',
  avanzado: '#be123c',
};

const LEVEL_LABELS: Record<string, string> = {
  basico: 'Básico',
  intermedio: 'Intermedio',
  avanzado: 'Avanzado',
};

function markerIcon(L: typeof import('leaflet'), obstacle: TrackObstacleMarker) {
  const color = LEVEL_COLORS[obstacle.level] ?? '#b45309';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="${color}" stroke="white" stroke-width="2.5"/>
      <text x="14" y="19" text-anchor="middle" font-size="13" font-weight="700" fill="white"
        font-family="system-ui, sans-serif">${obstacle.number}</text>
    </svg>`.trim();

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

/** El popup se arma como HTML porque Leaflet no renderiza componentes React. */
function popupContent(obstacle: TrackObstacleMarker): string {
  const level = LEVEL_LABELS[obstacle.level] ?? obstacle.level;
  const photo = obstacle.image
    ? `<img src="${obstacle.image}" alt="${obstacle.imageAlt ?? ''}"
         style="width:100%;height:110px;object-fit:cover;border-radius:6px;" loading="lazy" />`
    : '';

  return `
    <div style="max-width:210px;">
      ${photo}
      <p style="font-weight:700;margin:6px 0 2px;font-size:0.95rem;">${obstacle.number}. ${obstacle.name}</p>
      <p style="font-size:0.75rem;color:#666;margin:0;">Nivel ${level.toLowerCase()}</p>
      <a href="/la-pista/${obstacle.slug}"
        style="display:block;margin-top:8px;font-size:0.85rem;color:#0e7490;font-weight:600;text-decoration:none;">
        Ver la ficha →
      </a>
    </div>`.trim();
}

export default function TrackMapInteractive({
  track,
  obstacles = [],
  children,
}: TrackMapInteractiveProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current || track.length < 2) return;

    let cancelled = false;

    import('leaflet').then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        // El mapa no se roba el scroll de la página: la rueda solo hace zoom
        // después de que el usuario entra al mapa con un clic.
        scrollWheelZoom: false,
        maxZoom: MAX_NATIVE_ZOOM + 2,
        attributionControl: true,
      });

      L.tileLayer(SATELLITE_URL, {
        attribution: SATELLITE_ATTRIBUTION,
        maxNativeZoom: MAX_NATIVE_ZOOM,
        maxZoom: MAX_NATIVE_ZOOM + 2,
      }).addTo(map);

      // Dos trazos: uno oscuro ancho debajo para que la línea se lea sobre
      // vegetación clara y sobre concreto, y el lima del club encima.
      L.polyline(track, { color: '#0f172a', weight: 7, opacity: 0.45, lineJoin: 'round' }).addTo(
        map,
      );
      L.polyline(track, { color: '#8be000', weight: 3.5, lineJoin: 'round' }).addTo(map);

      for (const obstacle of obstacles) {
        L.marker([obstacle.lat, obstacle.lng], {
          icon: markerIcon(L, obstacle),
          alt: `Obstáculo ${obstacle.number}: ${obstacle.name}`,
          keyboard: true,
        })
          .addTo(map)
          .bindPopup(popupContent(obstacle));
      }

      map.fitBounds(L.latLngBounds(track), { padding: [24, 24], maxZoom: MAX_NATIVE_ZOOM });
      map.once('click', () => map.scrollWheelZoom.enable());

      mapRef.current = map;
      setReady(true);
    });

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
    };
    // Deps vacías a propósito: el mapa se inicializa una sola vez. `track` y
    // `obstacles` se generan en build y no cambian en runtime (mismo criterio
    // que `TrochaVerdeMap`).
  }, []);

  return (
    <div className="relative">
      <div
        ref={containerRef}
        className="rounded-card bg-primary/5 aspect-[3/4] w-full overflow-hidden"
        role={ready ? 'application' : undefined}
        aria-label={ready ? 'Mapa satelital de la Pista Carlos Castro' : undefined}
      />

      {/* El SVG del trazado: es lo que se ve sin JavaScript y mientras Leaflet
          carga. Se retira del flujo (no se desmonta) cuando el mapa ya está. */}
      {!ready && <div className="absolute inset-0 grid place-items-center">{children}</div>}

      {ready && (
        <p className="text-text-secondary mt-2 text-xs">
          Toca el mapa para activar el zoom con la rueda.
        </p>
      )}
    </div>
  );
}
