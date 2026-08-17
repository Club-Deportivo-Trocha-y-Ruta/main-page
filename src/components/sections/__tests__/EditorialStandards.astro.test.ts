import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import EditorialStandards from '../EditorialStandards.astro';
import { EDITORIAL_STANDARDS } from '@lib/editorial-standards';
import type { EditorialStandard } from '@lib/editorial-standards';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('EditorialStandards', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(EditorialStandards, { props }).then(parseHtml);

  it('no renderiza nada sin estándares', async () => {
    const doc = await render({ standards: [] });
    expect(doc.querySelector('section')).toBeNull();
  });

  it('dibuja una sección por estándar, en el orden recibido', async () => {
    const doc = await render({ standards: EDITORIAL_STANDARDS });
    const headings = [...doc.querySelectorAll('h3')].map((h) => h.textContent?.trim());
    expect(headings).toEqual([
      'Estándares editoriales',
      'Fuentes',
      'Política de correcciones',
      'Conflictos de interés',
      'Cobertura de menores',
    ]);
  });

  it('explica cada estándar con su propósito antes del contenido', async () => {
    const doc = await render({ standards: EDITORIAL_STANDARDS });
    const sections = [...doc.querySelectorAll('section')];
    const correcciones = sections.find(
      (s) => s.querySelector('h3')?.textContent === 'Política de correcciones',
    );
    expect(correcciones?.textContent).toContain('en cuánto tiempo responde el club');

    const purposeIndex = correcciones?.innerHTML.indexOf('en cuánto tiempo responde el club') ?? -1;
    const paragraphIndex = correcciones?.innerHTML.indexOf('<p>Si encuentras un error') ?? -1;
    expect(purposeIndex).toBeGreaterThan(-1);
    expect(purposeIndex).toBeLessThan(paragraphIndex);
  });

  it('pinta los párrafos de un estándar sin lista', async () => {
    const doc = await render({ standards: EDITORIAL_STANDARDS });
    const sections = [...doc.querySelectorAll('section')];
    const estandares = sections.find(
      (s) => s.querySelector('h3')?.textContent === 'Estándares editoriales',
    );
    expect(estandares?.querySelectorAll('p').length).toBeGreaterThanOrEqual(2);
    expect(estandares?.querySelector('ul')).toBeNull();
  });

  it('pinta la lista marcada de un estándar con protocolo', async () => {
    const doc = await render({ standards: EDITORIAL_STANDARDS });
    const sections = [...doc.querySelectorAll('section')];
    const menores = sections.find(
      (s) => s.querySelector('h3')?.textContent === 'Cobertura de menores',
    );
    const items = [...(menores?.querySelectorAll('li') ?? [])];
    expect(items.length).toBe(4);
    expect(items[0].textContent).toContain('autorización previa por escrito');
  });

  it('un estándar sin párrafos (solo lista) no deja un bloque de texto vacío', async () => {
    const doc = await render({ standards: EDITORIAL_STANDARDS });
    const sections = [...doc.querySelectorAll('section')];
    const fuentes = sections.find((s) => s.querySelector('h3')?.textContent === 'Fuentes');
    expect(fuentes?.querySelectorAll('p').length).toBe(1); // solo el purpose, sin párrafos de cuerpo
    expect(fuentes?.querySelectorAll('li').length).toBe(3);
  });

  it('cada sección se nombra a sí misma para accesibilidad', async () => {
    const doc = await render({ standards: EDITORIAL_STANDARDS });
    const sections = [...doc.querySelectorAll('section')];
    for (const section of sections) {
      const labelledby = section.getAttribute('aria-labelledby');
      expect(labelledby).toBeTruthy();
      expect(doc.getElementById(labelledby!)).not.toBeNull();
    }
  });

  it('un estándar sintético sin items ni párrafos no rompe el render', async () => {
    const vacio: EditorialStandard = {
      id: 'estandares',
      label: 'Vacío',
      purpose: 'Estándar de prueba sin contenido.',
      icon: 'ph:compass-bold',
      order: 1,
      paragraphs: [],
    };
    const doc = await render({ standards: [vacio] });
    expect(doc.querySelector('h3')?.textContent).toBe('Vacío');
    expect(doc.querySelector('p')?.textContent).toBe('Estándar de prueba sin contenido.');
  });
});
