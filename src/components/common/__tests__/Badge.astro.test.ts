import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import Badge from '../Badge.astro';

// Helper: parse rendered HTML string into a queryable DOM
function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('Badge', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  // ─── Renderizado base ──────────────────────────────────────

  it('renderiza un elemento <span>', async () => {
    const html = await container.renderToString(Badge, {
      slots: { default: 'Juvenil' },
    });
    const doc = parseHtml(html);
    expect(doc.querySelector('span')).not.toBeNull();
  });

  it('muestra el contenido del slot', async () => {
    const html = await container.renderToString(Badge, {
      slots: { default: 'Próximo' },
    });
    expect(html).toContain('Próximo');
  });

  // ─── Variantes ────────────────────────────────────────────

  it('aplica clases de variante primary por defecto', async () => {
    const html = await container.renderToString(Badge, {
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const span = doc.querySelector('span')!;
    expect(span.className).toContain('bg-primary/10');
    expect(span.className).toContain('text-primary');
  });

  it('aplica clases de variante accent', async () => {
    const html = await container.renderToString(Badge, {
      props: { variant: 'accent' },
      slots: { default: 'Cancelado' },
    });
    const doc = parseHtml(html);
    const span = doc.querySelector('span')!;
    expect(span.className).toContain('bg-accent/10');
    expect(span.className).toContain('text-accent');
  });

  it('aplica clases de variante neutral', async () => {
    const html = await container.renderToString(Badge, {
      props: { variant: 'neutral' },
      slots: { default: 'Pasado' },
    });
    const doc = parseHtml(html);
    const span = doc.querySelector('span')!;
    expect(span.className).toContain('bg-gray-100');
    expect(span.className).toContain('text-text-secondary');
  });

  it('aplica clases de variante cyan (alias de primary-dark)', async () => {
    const html = await container.renderToString(Badge, {
      props: { variant: 'cyan' },
      slots: { default: 'Infantil' },
    });
    const doc = parseHtml(html);
    const span = doc.querySelector('span')!;
    expect(span.className).toContain('text-primary-dark');
  });

  // ─── Tamaños ──────────────────────────────────────────────

  it('aplica tamaño sm por defecto', async () => {
    const html = await container.renderToString(Badge, {
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const span = doc.querySelector('span')!;
    expect(span.className).toContain('text-xs');
  });

  it('aplica tamaño md cuando se especifica', async () => {
    const html = await container.renderToString(Badge, {
      props: { size: 'md' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const span = doc.querySelector('span')!;
    expect(span.className).toContain('text-sm');
    expect(span.className).toContain('px-3');
  });

  // ─── Clases adicionales ───────────────────────────────────

  it('aplica clases CSS personalizadas via prop class', async () => {
    const html = await container.renderToString(Badge, {
      props: { class: 'mt-2 custom-badge' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const span = doc.querySelector('span')!;
    expect(span.className).toContain('mt-2');
    expect(span.className).toContain('custom-badge');
  });

  // ─── Clases base invariantes ──────────────────────────────

  it('siempre incluye clase rounded-full y font-medium', async () => {
    const html = await container.renderToString(Badge, {
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const span = doc.querySelector('span')!;
    expect(span.className).toContain('rounded-full');
    expect(span.className).toContain('font-medium');
  });
});
