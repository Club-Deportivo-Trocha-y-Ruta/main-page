import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import Card from '../Card.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('Card', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  // ─── Elemento raíz según props ────────────────────────────

  it('renderiza <div> cuando no hay prop href', async () => {
    const html = await container.renderToString(Card, {
      slots: { default: 'Contenido de la tarjeta' },
    });
    const doc = parseHtml(html);
    expect(doc.querySelector('div')).not.toBeNull();
    expect(doc.querySelector('a')).toBeNull();
  });

  it('renderiza <a> cuando se pasa prop href', async () => {
    const html = await container.renderToString(Card, {
      props: { href: '/programas/iniciacion' },
      slots: { default: 'Iniciación' },
    });
    const doc = parseHtml(html);
    const anchor = doc.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('/programas/iniciacion');
    expect(doc.querySelector('div')).toBeNull();
  });

  // ─── Contenido del slot ───────────────────────────────────

  it('renderiza el contenido del slot', async () => {
    const html = await container.renderToString(Card, {
      slots: { default: 'Texto del slot' },
    });
    expect(html).toContain('Texto del slot');
  });

  it('renderiza HTML complejo en el slot', async () => {
    const html = await container.renderToString(Card, {
      slots: { default: '<h2>Título</h2><p>Descripción</p>' },
    });
    expect(html).toContain('<h2>Título</h2>');
    expect(html).toContain('<p>Descripción</p>');
  });

  // ─── Clases CSS ───────────────────────────────────────────

  it('aplica clases base en la variante div', async () => {
    const html = await container.renderToString(Card, {
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const root = doc.querySelector('div')!;
    expect(root.className).toContain('block');
    expect(root.className).toContain('rounded-xl');
    expect(root.className).toContain('shadow-sm');
  });

  it('aplica clases base en la variante enlace', async () => {
    const html = await container.renderToString(Card, {
      props: { href: '/equipo' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const anchor = doc.querySelector('a')!;
    expect(anchor.className).toContain('block');
    expect(anchor.className).toContain('rounded-xl');
    expect(anchor.className).toContain('hover:shadow-md');
  });

  it('combina clase personalizada con clases base', async () => {
    const html = await container.renderToString(Card, {
      props: { class: 'p-6 my-custom' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const root = doc.querySelector('div')!;
    expect(root.className).toContain('p-6');
    expect(root.className).toContain('my-custom');
    expect(root.className).toContain('rounded-xl'); // clases base conservadas
  });

  // ─── Edge cases ───────────────────────────────────────────

  it('maneja prop class undefined sin romper clases base', async () => {
    const html = await container.renderToString(Card, {
      props: {},
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const root = doc.querySelector('div')!;
    // No debe haber "undefined" en las clases
    expect(root.className).not.toContain('undefined');
    expect(root.className).toContain('rounded-xl');
  });
});
