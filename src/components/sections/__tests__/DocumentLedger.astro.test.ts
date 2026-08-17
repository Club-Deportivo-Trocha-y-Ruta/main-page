import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import DocumentLedger from '../DocumentLedger.astro';
import { groupByCategory } from '@lib/transparency';
import type { TransparencyDocumentWithSize } from '@lib/transparency';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const documents: TransparencyDocumentWithSize[] = [
  {
    nombre: 'EF Club Trocha y Ruta 2024',
    descripcion: 'Estados Financieros del club, vigencia 2024',
    categoria: 'Financieros',
    archivo: '/documentos/transparencia/EF-Club-Trocha-y-Ruta-2024-1.pdf',
    anio: 2024,
    sizeLabel: '153 KB',
  },
  {
    nombre: 'Reconocimiento Deportivo',
    descripcion: 'Reconocimiento deportivo otorgado por el ente territorial',
    categoria: 'Legales',
    archivo: '/documentos/transparencia/Reconocimiento-Deportivo.pdf',
    anio: null,
    sizeLabel: '14,8 MB',
  },
  {
    nombre: 'Documento sin peso en disco',
    descripcion: 'Simula un archivo que no aparece bajo public/',
    categoria: 'Legales',
    archivo: '/documentos/transparencia/no-existe.pdf',
    anio: null,
    sizeLabel: null,
  },
];

describe('DocumentLedger', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  const render = (props: Record<string, unknown>) =>
    container.renderToString(DocumentLedger, { props }).then(parseHtml);

  it('no renderiza nada sin categorías', async () => {
    const doc = await render({ groups: [] });
    expect(doc.querySelector('section')).toBeNull();
  });

  it('dibuja una sección por categoría, en el orden de lectura definido', async () => {
    const groups = groupByCategory(documents);
    const doc = await render({ groups });
    const headings = [...doc.querySelectorAll('h3')].map((h) => h.textContent?.trim());
    expect(headings).toEqual(['Financieros', 'Legales']);
  });

  it('explica cada categoría con su propósito antes de listar los documentos', async () => {
    const groups = groupByCategory(documents);
    const doc = await render({ groups });
    const sections = [...doc.querySelectorAll('section')];
    const financieros = sections.find((s) => s.querySelector('h3')?.textContent?.includes('Financieros'));
    expect(financieros?.textContent).toContain('De dónde sale la plata del club');
    // El propósito aparece antes que la lista de fichas en el DOM.
    const purposeIndex = financieros?.innerHTML.indexOf('De dónde sale la plata') ?? -1;
    const listIndex = financieros?.innerHTML.indexOf('<ul') ?? -1;
    expect(purposeIndex).toBeGreaterThan(-1);
    expect(purposeIndex).toBeLessThan(listIndex);
  });

  it('no muestra una categoría sin documentos', async () => {
    const groups = groupByCategory(documents.filter((d) => d.categoria === 'Financieros'));
    const doc = await render({ groups });
    expect(doc.body.textContent).not.toContain('Legales');
  });

  it('cada ficha muestra nombre, descripción, tipo y vigencia cuando la hay', async () => {
    const groups = groupByCategory(documents);
    const doc = await render({ groups });
    const ficha = [...doc.querySelectorAll('article')].find((a) =>
      a.textContent?.includes('EF Club Trocha y Ruta 2024')
    );
    expect(ficha?.querySelector('h4')?.textContent).toBe('EF Club Trocha y Ruta 2024');
    expect(ficha?.textContent).toContain('Estados Financieros del club, vigencia 2024');
    expect(ficha?.textContent).toContain('Vigencia 2024');
    expect(ficha?.textContent).toContain('PDF');
    expect(ficha?.textContent).toContain('153 KB');
  });

  it('omite la vigencia y el peso cuando el documento no los trae', async () => {
    const groups = groupByCategory(documents);
    const doc = await render({ groups });
    const ficha = [...doc.querySelectorAll('article')].find((a) =>
      a.textContent?.includes('Documento sin peso en disco')
    );
    expect(ficha?.textContent).not.toContain('Vigencia');
    expect(ficha?.textContent).toContain('PDF');
  });

  it('conserva los atributos de analytics, el download y el aria-label en cada enlace', async () => {
    const groups = groupByCategory(documents);
    const doc = await render({ groups });
    const links = [...doc.querySelectorAll('a[data-analytics-event]')];
    expect(links).toHaveLength(documents.length);

    const link = links.find(
      (a) => a.getAttribute('data-analytics-pdf-name') === 'Reconocimiento Deportivo'
    );
    expect(link?.getAttribute('data-analytics-event')).toBe('transparencia_pdf_download');
    expect(link?.hasAttribute('download')).toBe(true);
    expect(link?.getAttribute('href')).toBe('/documentos/transparencia/Reconocimiento-Deportivo.pdf');
    expect(link?.getAttribute('aria-label')).toContain('Reconocimiento Deportivo');
    expect(link?.getAttribute('aria-label')).toContain('14,8 MB');
  });

  it('no rompe la ruta del archivo del JSON', async () => {
    const groups = groupByCategory(documents);
    const doc = await render({ groups });
    const hrefs = [...doc.querySelectorAll('a[data-analytics-event]')].map((a) =>
      a.getAttribute('href')
    );
    expect(hrefs).toEqual(documents.map((d) => d.archivo));
  });
});
