import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import ProgramPathway from '../ProgramPathway.astro';
import type { PathwayInput } from '@lib/programs';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const programs: PathwayInput[] = [
  {
    id: 'escuela-de-iniciacion',
    title: 'Escuela de Iniciación',
    ageRange: '3 a 5 años',
    ageMin: 3,
    ageMax: 5,
    targetLevel: 'iniciación',
  },
  {
    id: 'formacion-juvenil',
    title: 'Formación Juvenil',
    ageRange: '6 a 11 años',
    ageMin: 6,
    ageMax: 11,
    targetLevel: 'formación',
  },
  {
    id: 'alto-rendimiento',
    title: 'Alto Rendimiento',
    ageRange: '12 años en adelante',
    ageMin: 12,
    ageMax: 99,
    targetLevel: 'competición',
  },
];

describe('ProgramPathway', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(ProgramPathway, { props }).then(parseHtml);

  it('no renderiza nada sin programas', async () => {
    const doc = await render({ programs: [] });
    expect(doc.querySelector('figure')).toBeNull();
  });

  it('dibuja un tramo por programa, en orden de edad', async () => {
    const doc = await render({ programs: [...programs].reverse() });
    const bands = [...doc.querySelectorAll('ol > li a')];
    expect(bands).toHaveLength(3);
    expect(bands.map((a) => a.querySelector('span')?.textContent?.trim())).toEqual([
      '3–5',
      '6–11',
      '12+',
    ]);
  });

  it('coloca cada tramo según las edades que cubre', async () => {
    const doc = await render({ programs });
    const first = doc.querySelector('ol > li') as HTMLElement;
    // Los 3 primeros años de un recorrido de 16 → arranca en 0 y ocupa 18.75%
    expect(first.getAttribute('style')).toContain('left:0%');
    expect(first.getAttribute('style')).toContain('width:18.75%');
  });

  it('enlaza cada tramo al programa con el prefijo que se le pase', async () => {
    const doc = await render({ programs, hrefBase: '#programa-' });
    const hrefs = [...doc.querySelectorAll('ol > li a')].map((a) => a.getAttribute('href'));
    expect(hrefs).toEqual([
      '#programa-escuela-de-iniciacion',
      '#programa-formacion-juvenil',
      '#programa-alto-rendimiento',
    ]);
  });

  it('nombra cada tramo para lectores de pantalla', async () => {
    const doc = await render({ programs });
    const labels = [...doc.querySelectorAll('ol > li a')].map((a) => a.getAttribute('aria-label'));
    expect(labels[0]).toBe('Etapa 1: Escuela de Iniciación, 3 a 5 años');
    expect(labels[2]).toBe('Etapa 3: Alto Rendimiento, 12 años en adelante');
  });

  it('describe el gráfico en el figcaption y oculta el SVG decorativo', async () => {
    const doc = await render({ programs });
    const caption = doc.querySelector('figcaption');
    expect(caption?.className).toContain('sr-only');
    expect(caption?.textContent).toContain('3 etapas');
    expect(doc.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  });

  it('pinta un tramo del perfil por etapa, recortado a su rango', async () => {
    const doc = await render({ programs });
    const clips = [...doc.querySelectorAll('clipPath')];
    expect(clips).toHaveLength(3);
    // Ids únicos: dos rutas en la misma página no pueden compartir el clip.
    expect(new Set(clips.map((c) => c.id)).size).toBe(3);
    expect(doc.querySelectorAll('g[clip-path]')).toHaveLength(3);
  });

  it('marca los cambios de etapa, no el arranque del recorrido', async () => {
    const doc = await render({ programs });
    expect(doc.querySelectorAll('svg line')).toHaveLength(2);
  });

  it('muestra la leyenda solo cuando se pide', async () => {
    const sinLeyenda = await render({ programs });
    expect(sinLeyenda.querySelectorAll('ol')).toHaveLength(1);

    const conLeyenda = await render({ programs, legend: true });
    const listas = conLeyenda.querySelectorAll('ol');
    expect(listas).toHaveLength(2);
    expect(listas[1].textContent).toContain('Escuela de Iniciación');
    expect(listas[1].textContent).toContain('Juego y equilibrio');
  });

  it('permite cambiar los textos de los extremos del recorrido', async () => {
    const doc = await render({
      programs,
      startLabel: 'Primera rodada',
      endLabel: 'Selección Valle',
    });
    expect(doc.body.textContent).toContain('Primera rodada');
    expect(doc.body.textContent).toContain('Selección Valle');
  });

  describe('activeId', () => {
    it('sin el prop no marca ninguna etapa ni cambia los valores por defecto', async () => {
      const doc = await render({ programs, legend: true });

      expect(doc.querySelectorAll('[aria-current]')).toHaveLength(0);

      // Mismo grosor de trazo para las tres etapas: ninguna se destaca.
      const linePaths = [...doc.querySelectorAll('svg g path[stroke-width]')];
      expect(linePaths.map((p) => p.getAttribute('stroke-width'))).toEqual(['2.5', '2.5', '2.5']);

      // Los marcadores conservan su tamaño y anillo por defecto.
      const markers = [...doc.querySelectorAll('span[style*="top:"]')];
      expect(markers).toHaveLength(3);
      markers.forEach((marker) => {
        expect(marker.className).toContain('size-7');
        expect(marker.className).not.toContain('ring-primary-deep');
      });
    });

    it('distingue la etapa activa en el tramo, el marcador del perfil y la leyenda', async () => {
      const doc = await render({ programs, activeId: 'formacion-juvenil', legend: true });

      // El tramo de la regla de edades y el ítem de la leyenda apuntan al mismo programa.
      const current = [...doc.querySelectorAll('[aria-current="page"]')];
      expect(current).toHaveLength(2);
      current.forEach((el) => expect(el.getAttribute('href')).toBe('/programas/formacion-juvenil'));

      // Su trazo en el perfil se dibuja más grueso que el de las otras dos etapas.
      const linePaths = [...doc.querySelectorAll('svg g path[stroke-width]')];
      expect(linePaths.map((p) => p.getAttribute('stroke-width'))).toEqual(['2.5', '4', '2.5']);

      // Su marcador crece y gana un anillo de marca; los otros dos no cambian.
      const markers = [...doc.querySelectorAll('span[style*="top:"]')];
      expect(markers[1].className).toContain('ring-primary-deep');
      expect(markers[0].className).toContain('size-7');
      expect(markers[2].className).toContain('size-7');
    });

    it('no toca ningún programa cuando el activeId no existe en la ruta', async () => {
      const doc = await render({ programs, activeId: 'no-existe', legend: true });
      expect(doc.querySelectorAll('[aria-current]')).toHaveLength(0);
    });
  });
});
