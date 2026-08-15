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
});
