import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import ProgramAdjacentNav from '../ProgramAdjacentNav.astro';
import type { PathwayInput } from '@lib/programs';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const escuela: PathwayInput = {
  id: 'escuela-de-iniciacion',
  title: 'Escuela de Iniciación',
  ageRange: '3 a 5 años',
  ageMin: 3,
  ageMax: 5,
  targetLevel: 'iniciación',
};

const formacion: PathwayInput = {
  id: 'formacion-juvenil',
  title: 'Formación Juvenil',
  ageRange: '6 a 11 años',
  ageMin: 6,
  ageMax: 11,
  targetLevel: 'formación',
};

describe('ProgramAdjacentNav', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(ProgramAdjacentNav, { props }).then(parseHtml);

  it('no renderiza nada si no hay programa anterior ni siguiente', async () => {
    const doc = await render({ previous: null, next: null });
    expect(doc.querySelector('nav')).toBeNull();
  });

  it('enlaza al programa anterior y al siguiente cuando ambos existen', async () => {
    const doc = await render({ previous: escuela, next: formacion });
    const links = [...doc.querySelectorAll('nav a')];
    expect(links).toHaveLength(2);
    expect(links[0].getAttribute('href')).toBe('/programas/escuela-de-iniciacion');
    expect(links[1].getAttribute('href')).toBe('/programas/formacion-juvenil');
  });

  it('solo pinta el enlace al siguiente cuando no hay anterior', async () => {
    const doc = await render({ previous: null, next: formacion });
    const links = [...doc.querySelectorAll('nav a')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/programas/formacion-juvenil');
    expect(links[0].textContent).toContain('Siguiente etapa');
  });

  it('solo pinta el enlace al anterior cuando no hay siguiente', async () => {
    const doc = await render({ previous: escuela, next: null });
    const links = [...doc.querySelectorAll('nav a')];
    expect(links).toHaveLength(1);
    expect(links[0].getAttribute('href')).toBe('/programas/escuela-de-iniciacion');
    expect(links[0].textContent).toContain('Etapa anterior');
  });

  it('nombra cada enlace con el título y el rango de edad del programa vecino', async () => {
    const doc = await render({ previous: escuela, next: formacion });
    const links = [...doc.querySelectorAll('nav a')];
    expect(links[0].getAttribute('aria-label')).toBe(
      'Etapa anterior: Escuela de Iniciación, 3 a 5 años'
    );
    expect(links[1].getAttribute('aria-label')).toBe(
      'Siguiente etapa: Formación Juvenil, 6 a 11 años'
    );
  });

  it('es un landmark de navegación nombrado', async () => {
    const doc = await render({ previous: escuela, next: formacion });
    expect(doc.querySelector('nav')?.getAttribute('aria-label')).toBe(
      'Otras etapas de la ruta de formación'
    );
  });
});
