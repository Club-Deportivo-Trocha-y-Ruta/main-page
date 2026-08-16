import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import TreeCard from '../TreeCard.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const baseProps = {
  id: 'ixora-1',
  label: 'Ixora 1',
  image: '/images/trocha-verde/dia-tierra-2026/arboles/ixora.webp',
  imageAlt: 'Ixora donada por Vivero Guacandá, sembrada en la Sembratón del Día de la Tierra 2026',
  plantedDate: new Date('2026-04-22T00:00:00Z'),
  status: 'sembrado',
};

describe('TreeCard', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(TreeCard, { props }).then(parseHtml);

  it('enlaza a la ficha del árbol con la etiqueta como nombre accesible', async () => {
    const doc = await render(baseProps);
    const link = doc.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/trocha-verde/arboles/ixora-1');
    expect(link?.textContent?.trim()).toBe('Ixora 1');
  });

  it('un solo enlace por tarjeta, no uno en la imagen y otro en el texto', async () => {
    const doc = await render(baseProps);
    expect(doc.querySelectorAll('a')).toHaveLength(1);
  });

  it('la imagen lleva el alt descriptivo real, no vacío', async () => {
    const doc = await render(baseProps);
    expect(doc.querySelector('img')?.getAttribute('alt')).toBe(baseProps.imageAlt);
    expect(doc.querySelector('img')?.getAttribute('loading')).toBe('lazy');
  });

  it('muestra la fecha de siembra formateada en español', async () => {
    const doc = await render(baseProps);
    expect(doc.body.textContent).toContain('Sembrado el 22 de abril de 2026');
    expect(doc.querySelector('time')?.getAttribute('datetime')).toBe('2026-04-22');
  });

  it('muestra el padrino cuando lo hay', async () => {
    const doc = await render({ ...baseProps, donor: 'Vivero Guacandá (Sr. Néstor Correa)' });
    expect(doc.body.textContent).toContain('Vivero Guacandá (Sr. Néstor Correa)');
  });

  it('omite la línea de padrino cuando no lo hay', async () => {
    const doc = await render(baseProps);
    expect(doc.querySelector('[title]')).toBeNull();
  });

  it('no rotula el estado por defecto ("sembrado"): el contexto ya lo dice', async () => {
    const doc = await render(baseProps);
    // El badge de estado vive sobre la imagen; para "sembrado" no debe pintarse.
    expect(doc.querySelector('.aspect-square span')).toBeNull();
    // La fecha sí debe seguir diciendo "Sembrado el ..." (no es el badge).
    expect(doc.body.textContent).toContain('Sembrado el');
  });

  it('sí rotula un estado que no es el por defecto ("creciendo")', async () => {
    const doc = await render({ ...baseProps, status: 'creciendo' });
    const badge = doc.querySelector('.aspect-square span');
    expect(badge?.textContent?.trim()).toBe('Creciendo');
  });
});
