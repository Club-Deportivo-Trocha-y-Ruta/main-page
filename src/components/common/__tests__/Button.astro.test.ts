import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import Button from '../Button.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('Button', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  // ─── Elemento raíz según props ────────────────────────────

  it('renderiza <button> cuando no hay prop href', async () => {
    const html = await container.renderToString(Button, {
      slots: { default: 'Inscribirse' },
    });
    const doc = parseHtml(html);
    expect(doc.querySelector('button')).not.toBeNull();
    expect(doc.querySelector('a')).toBeNull();
  });

  it('renderiza <a> cuando se pasa prop href', async () => {
    const html = await container.renderToString(Button, {
      props: { href: '/inscripciones' },
      slots: { default: 'Inscribirse' },
    });
    const doc = parseHtml(html);
    const anchor = doc.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('/inscripciones');
    expect(doc.querySelector('button')).toBeNull();
  });

  it('el enlace preserva atributos adicionales pasados via rest props', async () => {
    const html = await container.renderToString(Button, {
      props: { href: '/contacto', target: '_blank', rel: 'noopener' },
      slots: { default: 'Contactar' },
    });
    const doc = parseHtml(html);
    const anchor = doc.querySelector('a')!;
    expect(anchor.getAttribute('target')).toBe('_blank');
    expect(anchor.getAttribute('rel')).toBe('noopener');
  });

  // ─── Contenido del slot ───────────────────────────────────

  it('muestra el texto del slot', async () => {
    const html = await container.renderToString(Button, {
      slots: { default: 'Ver Programas' },
    });
    expect(html).toContain('Ver Programas');
  });

  // ─── Variantes ────────────────────────────────────────────

  it('aplica variante primary por defecto', async () => {
    const html = await container.renderToString(Button, {
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('bg-primary');
    expect(btn.className).toContain('text-white');
  });

  it('aplica variante secondary', async () => {
    const html = await container.renderToString(Button, {
      props: { variant: 'secondary' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('bg-surface-muted');
  });

  it('aplica variante accent', async () => {
    const html = await container.renderToString(Button, {
      props: { variant: 'accent' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('bg-accent');
  });

  it('aplica variante outline', async () => {
    const html = await container.renderToString(Button, {
      props: { variant: 'outline' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('border-2');
    expect(btn.className).toContain('border-primary');
  });

  // ─── Tamaños ──────────────────────────────────────────────

  it('aplica tamaño md por defecto', async () => {
    const html = await container.renderToString(Button, {
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('px-5');
    expect(btn.className).toContain('py-2.5');
    expect(btn.className).toContain('text-base');
  });

  it('aplica tamaño sm', async () => {
    const html = await container.renderToString(Button, {
      props: { size: 'sm' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('px-3');
    expect(btn.className).toContain('text-sm');
  });

  it('aplica tamaño lg', async () => {
    const html = await container.renderToString(Button, {
      props: { size: 'lg' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('px-7');
    expect(btn.className).toContain('text-lg');
  });

  // ─── Clases base invariantes ──────────────────────────────

  it('siempre incluye clases de focus-visible para accesibilidad', async () => {
    const html = await container.renderToString(Button, {
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('focus-visible:outline-2');
  });

  it('siempre incluye inline-flex y rounded-lg', async () => {
    const html = await container.renderToString(Button, {
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('inline-flex');
    expect(btn.className).toContain('rounded-lg');
  });

  // ─── Prop class adicional ─────────────────────────────────

  it('combina clase personalizada con las clases generadas', async () => {
    const html = await container.renderToString(Button, {
      props: { class: 'w-full' },
      slots: { default: 'Test' },
    });
    const doc = parseHtml(html);
    const btn = doc.querySelector('button')!;
    expect(btn.className).toContain('w-full');
    expect(btn.className).toContain('bg-primary'); // clases base conservadas
  });
});
