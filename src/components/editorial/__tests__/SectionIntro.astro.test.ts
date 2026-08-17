import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SectionIntro from '../SectionIntro.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('SectionIntro', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(SectionIntro, { props }).then(parseHtml);

  it('renderiza antetítulo, titular y bajada', async () => {
    const doc = await render({
      eyebrow: 'Programas',
      title: 'Del primer equilibrio al primer podio',
      lead: 'Tres etapas de una misma ruta.',
    });
    expect(doc.body.textContent).toContain('Programas');
    expect(doc.querySelector('h2')?.textContent).toContain('Del primer equilibrio al primer podio');
    expect(doc.body.textContent).toContain('Tres etapas de una misma ruta.');
  });

  it('marca solo el fragmento resaltado y conserva el resto del titular', async () => {
    const doc = await render({
      title: 'Del primer equilibrio al primer podio',
      highlight: 'primer podio',
    });
    const mark = doc.querySelector('.editorial-mark');
    expect(mark?.textContent?.trim()).toBe('primer podio');
    // El titular completo se mantiene: el resaltado no se come el texto.
    expect(doc.querySelector('h2')?.textContent?.replace(/\s+/g, ' ').trim()).toBe(
      'Del primer equilibrio al primer podio'
    );
  });

  it('no envuelve nada cuando el fragmento no aparece en el titular', async () => {
    const doc = await render({
      title: 'Del primer equilibrio al primer podio',
      highlight: 'segundo puesto',
    });
    expect(doc.querySelector('.editorial-mark')).toBeNull();
    expect(doc.querySelector('h2')?.textContent?.trim()).toBe(
      'Del primer equilibrio al primer podio'
    );
  });

  it('el trazo no lleva envoltorios extra: se pinta como fondo del texto', async () => {
    // Con `box-decoration-break: clone` el trazo sigue al texto cuando la frase
    // parte en dos líneas; un <span> interno delataría la versión vieja, que se
    // estiraba a todo el ancho del bloque.
    const doc = await render({ title: 'Formar personas que corren', highlight: 'Formar personas' });
    expect(doc.querySelector('.editorial-mark span')).toBeNull();
  });

  it('refuerza el trazo sobre fondo oscuro', async () => {
    const claro = await render({ title: 'Un titular', highlight: 'titular' });
    expect(claro.querySelector('.editorial-mark')?.className).not.toContain('--on-dark');

    const oscuro = await render({ title: 'Un titular', highlight: 'titular', tone: 'dark' });
    expect(oscuro.querySelector('.editorial-mark')?.className).toContain(
      'editorial-mark--on-dark'
    );
  });

  it('permite elegir el nivel del titular y nombrar la sección', async () => {
    const doc = await render({ title: 'Quiénes somos', as: 'h1', id: 'club-titulo' });
    const heading = doc.querySelector('h1');
    expect(heading).not.toBeNull();
    expect(heading?.id).toBe('club-titulo');
  });

  it('centra el bloque cuando se le pide', async () => {
    const doc = await render({ title: 'Un titular', lead: 'Bajada', align: 'center' });
    expect(doc.body.firstElementChild?.className).toContain('text-center');
  });
});
