/**
 * TrochaVerdeMap — React island para el mapa interactivo del inventario de árboles.
 *
 * El CSS de Leaflet se importa aquí mismo para que Vite lo empaquete con el sitio
 * estático — así el mapa se ve correctamente en el hosting sin depender de un CDN.
 *
 * Usar con directiva client:visible, nunca client:load.
 */
import 'leaflet/dist/leaflet.css';
import { useEffect, useRef, useState } from 'react';
import type { Map, LayerGroup } from 'leaflet';

export interface TreeMarker {
  slug: string;
  species: string;
  category: 'frutal' | 'ornamental' | 'nativo' | 'maderable';
  lat: number;
  lng: number;
  donor?: string;
  image: string;
  imageAlt: string;
  plantedDate: string;
}

interface TrochaVerdeMapProps {
  trees: TreeMarker[];
}

const CATEGORY_COLORS: Record<string, string> = {
  frutal: '#d97706',     // amber-600
  ornamental: '#7c3aed', // violet-700
  nativo: '#059669',     // emerald-600
  maderable: '#ea580c',  // orange-600
};

const CATEGORY_LABELS: Record<string, string> = {
  frutal: 'Frutal',
  ornamental: 'Ornamental',
  nativo: 'Nativo',
  maderable: 'Maderable',
};

function createMarkerIcon(L: typeof import('leaflet'), category: string) {
  const color = CATEGORY_COLORS[category] ?? '#059669';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" fill="${color}" stroke="white" stroke-width="2"/>
      <circle cx="12" cy="12" r="4" fill="white" opacity="0.8"/>
    </svg>
  `.trim();

  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -14],
  });
}

function buildPopupContent(tree: TreeMarker): string {
  const donorLine = tree.donor
    ? `<p style="font-size:0.75rem;color:#666;margin:0 0 2px;">Donado por ${tree.donor}</p>`
    : '';

  return `
    <div style="max-width:200px;">
      <img
        src="${tree.image}"
        alt="${tree.imageAlt}"
        style="width:100%;height:100px;object-fit:cover;border-radius:6px;"
        loading="lazy"
      />
      <p style="font-weight:600;margin:6px 0 2px;font-size:0.9rem;">${tree.species}</p>
      ${donorLine}
      <p style="font-size:0.75rem;color:#666;margin:0 0 4px;">${tree.plantedDate}</p>
      <a
        href="/trocha-verde/arboles/${tree.slug}"
        style="display:block;margin-top:6px;font-size:0.8rem;color:#059669;font-weight:600;text-decoration:none;"
      >
        Ver ficha del árbol →
      </a>
    </div>
  `.trim();
}

export default function TrochaVerdeMap({ trees }: TrochaVerdeMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<Map | null>(null);
  const layerGroupRef = useRef<LayerGroup | null>(null);
  const leafletRef = useRef<typeof import('leaflet') | null>(null);
  const [filter, setFilter] = useState<string>('todas');

  const uniqueSpecies = Array.from(new Set(trees.map((t) => t.species))).sort();

  // Inicializar mapa una sola vez
  useEffect(() => {
    if (!mapContainerRef.current || leafletMapRef.current) return;

    import('leaflet').then((L) => {
      if (!mapContainerRef.current || leafletMapRef.current) return;

      // Corrige el path de íconos por defecto que rompe con bundlers
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:
          'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapContainerRef.current, {
        // Sin center/zoom inicial — lo maneja fitBounds abajo
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      const layerGroup = L.layerGroup().addTo(map);

      leafletRef.current = L;
      leafletMapRef.current = map;
      layerGroupRef.current = layerGroup;

      // Poblar marcadores iniciales (sin filtro)
      addMarkers(L, layerGroup, trees, 'todas');

      // Centrar mapa dinámicamente sobre los markers existentes
      const treesWithCoords = trees.filter((t) => t.lat && t.lng);
      if (treesWithCoords.length > 0) {
        const bounds = L.latLngBounds(
          treesWithCoords.map((t) => [t.lat, t.lng] as [number, number]),
        );
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 18 });
      } else {
        // Fallback: coordenadas reales de la Pista Carlos Castro
        map.setView([3.598056, -76.484944], 17);
      }
    });

    return () => {
      leafletMapRef.current?.remove();
      leafletMapRef.current = null;
      leafletRef.current = null;
      layerGroupRef.current = null;
    };
    // trees es estático (generado en build), no cambia en runtime
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Actualizar marcadores cuando cambia el filtro
  useEffect(() => {
    const L = leafletRef.current;
    const layerGroup = layerGroupRef.current;
    if (!L || !layerGroup) return;

    addMarkers(L, layerGroup, trees, filter);
  }, [filter, trees]);

  return (
    <div>
      {/* Controles de filtro */}
      <div className="mb-3 flex flex-wrap items-center gap-3">
        <label
          htmlFor="species-filter"
          className="text-sm font-medium text-text-primary"
        >
          Filtrar por especie:
        </label>
        <select
          id="species-filter"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-lg border border-surface-muted bg-white px-3 py-1.5 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-emerald-600"
          aria-label="Filtrar árboles del mapa por especie"
        >
          <option value="todas">Todas las especies</option>
          {uniqueSpecies.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        {/* Contador de resultados */}
        <span className="text-xs text-text-secondary">
          {filter === 'todas'
            ? `${trees.length} árbol${trees.length !== 1 ? 'es' : ''}`
            : `${trees.filter((t) => t.species === filter).length} de ${trees.length}`}
        </span>
      </div>

      {/* Leyenda de categorías */}
      <div className="mb-3 flex flex-wrap gap-3">
        {Object.entries(CATEGORY_COLORS).map(([key, color]) => (
          <span key={key} className="flex items-center gap-1.5 text-xs text-text-secondary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="12"
              height="12"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill={color} />
            </svg>
            {CATEGORY_LABELS[key]}
          </span>
        ))}
      </div>

      {/* Contenedor del mapa */}
      {trees.length === 0 ? (
        <div className="flex h-96 w-full items-center justify-center rounded-xl border border-emerald-100 bg-surface-muted text-sm text-text-secondary">
          No hay árboles con coordenadas disponibles
        </div>
      ) : (
        <div
          ref={mapContainerRef}
          className="h-96 w-full overflow-hidden rounded-xl border border-emerald-100"
          role="application"
          aria-label="Mapa interactivo del inventario de árboles en la Pista Carlos Castro, Yumbo"
        />
      )}
    </div>
  );
}

// --- Helpers fuera del componente para evitar closures en effects ---

function addMarkers(
  L: typeof import('leaflet'),
  layerGroup: LayerGroup,
  trees: TreeMarker[],
  filter: string,
): void {
  layerGroup.clearLayers();

  const filtered =
    filter === 'todas' ? trees : trees.filter((t) => t.species === filter);

  for (const tree of filtered) {
    const icon = createMarkerIcon(L, tree.category);
    const marker = L.marker([tree.lat, tree.lng], { icon });
    marker.bindPopup(buildPopupContent(tree), { maxWidth: 220 });
    layerGroup.addLayer(marker);
  }
}
