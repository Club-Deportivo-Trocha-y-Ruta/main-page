import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SectionTitle from '../SectionTitle.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('SectionTitle', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  // ─── Renderizado del título ───────────────────────────────

  it('renderiza un elemento <h2> con el título proporcionado', async () => {
    const html = await container.renderToString(SectionTitle, {
      props: { title: 'Nuestros Programas' },
    });
    const doc = parseHtml(html);
    const h2 = doc.querySelector('h2');
    expect(h2).not.toBeNull();
    expect(h2!.textContent?.trim()).toBe('Nuestros Programas');
  });

  it('no renderiza <p> cuando subtitle está ausente', async () => {
    const html = await container.renderToString(SectionTitle, {
      props: { title: 'Equipo' },
    });
    const doc = parseHtml(html);
    expect(doc.querySelector('p')).toBeNull();
  });

  it('renderiza <p> con el subtítulo cuando se proporciona', async () => {
    const html = await container.renderToString(SectionTitle, {
      props: {
        title: 'Equipo',
        subtitle: 'Conoce a nuestros corredores',
      },
    });
    const doc = parseHtml(html);
    const p = doc.querySelector('p');
    expect(p).not.toBeNull();
    expect(p!.textContent?.trim()).toBe('Conoce a nuestros corredores');
  });

  // ─── Alineación ───────────────────────────────────────────

  it('aplica text-center por defecto', async () => {
    const html = await container.renderToString(SectionTitle, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const wrapper = doc.querySelector('div')!;
    expect(wrapper.className).toContain('text-center');
    expect(wrapper.className).not.toContain('text-left');
  });

  it('aplica text-left cuando align es "left"', async () => {
    const html = await container.renderToString(SectionTitle, {
      props: { title: 'Test', align: 'left' },
    });
    const doc = parseHtml(html);
    const wrapper = doc.querySelector('div')!;
    expect(wrapper.className).toContain('text-left');
    expect(wrapper.className).not.toContain('text-center');
  });

  it('centra la línea decorativa cuando align es center (mx-auto)', async () => {
    const html = await container.renderToString(SectionTitle, {
      props: { title: 'Test', align: 'center' },
    });
    const doc = parseHtml(html);
    // La línea decorativa es el div con h-1 y w-16
    const line = doc.querySelector('div > div');
    expect(line?.className).toContain('mx-auto');
  });

  it('no aplica mx-auto a la línea cuando align es left', async () => {
    const html = await container.renderToString(SectionTitle, {
      props: { title: 'Test', align: 'left' },
    });
    const doc = parseHtml(html);
    const line = doc.querySelector('div > div');
    expect(line?.className).not.toContain('mx-auto');
  });

  // ─── Clases tipográficas ──────────────────────────────────

  it('el h2 incluye clases de tipografía display y bold', async () => {
    const html = await container.renderToString(SectionTitle, {
      props: { title: 'Título' },
    });
    const doc = parseHtml(html);
    const h2 = doc.querySelector('h2')!;
    expect(h2.className).toContain('font-display');
    expect(h2.className).toContain('font-bold');
    expect(h2.className).toContain('text-3xl');
  });

  // ─── Línea decorativa ─────────────────────────────────────

  it('incluye la línea decorativa con bg-accent', async () => {
    const html = await container.renderToString(SectionTitle, {
      props: { title: 'Test' },
    });
    const doc = parseHtml(html);
    const line = doc.querySelector('div > div');
    expect(line?.className).toContain('bg-accent');
    expect(line?.className).toContain('h-1');
  });
});
