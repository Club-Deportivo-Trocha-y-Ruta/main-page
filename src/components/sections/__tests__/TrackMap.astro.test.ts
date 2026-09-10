import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { loadRenderers } from 'astro:container';
import { getContainerRenderer } from '@astrojs/react/container-renderer';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import TrackMap from '../TrackMap.astro';
import type { ObstacleMarker } from '../TrackMap.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const markers: ObstacleMarker[] = [
  // Con coordenadas reales: es como llegan las fichas del club.
  {
    slug: 'drop-recibidor-madera',
    name: 'Drop con recibidor de madera',
    level: 'intermedio',
    lat: 3.596855,
    lng: -76.486564,
  },
  // Sin GPS: respaldo con la posición manual en % del recuadro.
  { slug: 'peralte-sur', name: 'Peralte de la curva sur', level: 'basico', x: 70, y: 80 },
];

describe('TrackMap', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    // `TrackMap` monta el island `TrackMapInteractive`, así que el contenedor
    // necesita el renderer de React. En Astro 7 `getContainerRenderer` vive en
    // `@astrojs/react/container-renderer`, no en la raíz del paquete.
    const renderers = await loadRenderers([getContainerRenderer()]);
    container = await AstroContainer.create({ renderers });
  });

  it('dibuja el trazado del GPX real como un path cerrado', async () => {
    const doc = parseHtml(await container.renderToString(TrackMap, { props: {} }));
    const paths = doc.querySelectorAll('svg path');

    expect(paths.length).toBeGreaterThan(0);
    const d = paths[0].getAttribute('d')!;
    expect(d.startsWith('M')).toBe(true);
    // La vuelta grabada cierra sobre sí misma.
    expect(d.endsWith(' Z')).toBe(true);
  });

  it('publica la distancia de la vuelta en el pie del mapa', async () => {
    const doc = parseHtml(await container.renderToString(TrackMap, { props: {} }));
    expect(doc.querySelector('figcaption')?.textContent).toContain('3,7 km');
  });

  it('marca el SVG como decorativo: el equivalente es la lista', async () => {
    const doc = parseHtml(await container.renderToString(TrackMap, { props: { markers } }));
    expect(doc.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
    expect(doc.querySelectorAll('ol li').length).toBe(2);
  });

  it('convierte map.x/y a porcentaje del viewBox, contando el margen', async () => {
    const doc = parseHtml(await container.renderToString(TrackMap, { props: { markers } }));
    const first = doc.querySelector('a[href="/la-pista/drop-recibidor-madera"]') as HTMLElement;

    // x = padding + 29% del ancho útil, sobre el ancho total: no es 29%.
    const left = Number(first.getAttribute('style')!.match(/left:([\d.]+)%/)![1]);
    expect(left).toBeCloseTo(2.4 + 0.29 * 95.2, 1);
    expect(left).not.toBeCloseTo(29, 1);
  });

  it('cada marcador es un enlace con nombre accesible hacia su ficha', async () => {
    const doc = parseHtml(await container.renderToString(TrackMap, { props: { markers } }));
    const links = doc.querySelectorAll('a[aria-label^="Obstáculo"]');

    expect(links.length).toBe(2);
    expect(links[0].getAttribute('aria-label')).toBe('Obstáculo 1: Drop con recibidor de madera');
    expect(links[0].getAttribute('href')).toBe('/la-pista/drop-recibidor-madera');
  });

  it('sin obstáculos dibuja el trazado igual, sin lista ni marcadores', async () => {
    const doc = parseHtml(await container.renderToString(TrackMap, { props: { markers: [] } }));
    expect(doc.querySelector('svg')).not.toBeNull();
    expect(doc.querySelector('ol')).toBeNull();
    expect(doc.querySelectorAll('a').length).toBe(0);
  });
});
