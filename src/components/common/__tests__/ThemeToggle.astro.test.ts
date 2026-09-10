import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import ThemeToggle from '../ThemeToggle.astro';

/**
 * El botón no lleva script propio (la delegación de clic vive en
 * `BaseLayout.astro`), así que lo único verificable aquí es el marcado: el
 * atributo que engancha la delegación, el nombre accesible fijo (decisión C
 * del spec de UX) y que el SSR sale con `aria-pressed="false"` sin importar
 * el tema real del dispositivo.
 */
function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('ThemeToggle', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  it('renderiza un botón enganchado a la delegación de BaseLayout', async () => {
    const html = await container.renderToString(ThemeToggle);
    const doc = parseHtml(html);
    const button = doc.querySelector('button[data-theme-toggle]');
    expect(button).not.toBeNull();
    expect(button!.getAttribute('type')).toBe('button');
  });

  it('sale del servidor con aria-pressed="false", corregido luego por el script global', async () => {
    const html = await container.renderToString(ThemeToggle);
    const doc = parseHtml(html);
    const button = doc.querySelector('button[data-theme-toggle]')!;
    expect(button.getAttribute('aria-pressed')).toBe('false');
  });

  it('tiene el nombre accesible fijo "Modo oscuro"', async () => {
    const html = await container.renderToString(ThemeToggle);
    const doc = parseHtml(html);
    const button = doc.querySelector('button[data-theme-toggle]')!;
    expect(button.getAttribute('aria-label')).toBe('Modo oscuro');
    // Nombre fijo: nunca "title" ni un texto que cambie con el estado.
    expect(button.hasAttribute('title')).toBe(false);
  });

  it('incluye los dos iconos de destino, ocultos del árbol de accesibilidad', async () => {
    const html = await container.renderToString(ThemeToggle);
    const doc = parseHtml(html);
    const icons = doc.querySelectorAll('button[data-theme-toggle] svg');
    expect(icons).toHaveLength(2);
    icons.forEach((icon) => {
      expect(icon.getAttribute('aria-hidden')).toBe('true');
    });
  });

  it('acepta una clase extra para que el Header controle su visibilidad', async () => {
    const html = await container.renderToString(ThemeToggle, {
      props: { class: 'hidden sm:inline-flex' },
    });
    const doc = parseHtml(html);
    const button = doc.querySelector('button[data-theme-toggle]')!;
    const classes = button.className.split(/\s+/);
    expect(classes).toContain('hidden');
    expect(classes).toContain('sm:inline-flex');
  });

  it('no lleva aria-live: el repintado de la página es el feedback (decisión E)', async () => {
    const html = await container.renderToString(ThemeToggle);
    const doc = parseHtml(html);
    expect(doc.querySelector('[aria-live]')).toBeNull();
  });
});
