import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import RiderCard from '../RiderCard.astro';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const baseProps = {
  name: 'Santiago García',
  photo: '/images/riders/santiago-garcia.webp',
  category: 'juvenil',
  href: '/equipo/santiago-garcia',
};

describe('RiderCard', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  // ─── Estructura básica ────────────────────────────────────

  it('renderiza un enlace <a> apuntando al perfil del corredor', async () => {
    const html = await container.renderToString(RiderCard, {
      props: baseProps,
    });
    const doc = parseHtml(html);
    const anchor = doc.querySelector('a');
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('/equipo/santiago-garcia');
  });

  it('muestra el nombre del corredor en un h3', async () => {
    const html = await container.renderToString(RiderCard, {
      props: baseProps,
    });
    const doc = parseHtml(html);
    const h3 = doc.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3!.textContent?.trim()).toBe('Santiago García');
  });

  // ─── Badge de categoría ───────────────────────────────────

  it('renderiza un badge con la etiqueta de la categoría', async () => {
    const html = await container.renderToString(RiderCard, {
      props: baseProps,
    });
    // getCategoryLabel('juvenil') → 'Juvenil'
    expect(html).toContain('Juvenil');
  });

  it('renderiza correctamente la categoría infantil', async () => {
    const html = await container.renderToString(RiderCard, {
      props: { ...baseProps, category: 'infantil' },
    });
    expect(html).toContain('Infantil');
  });

  it('renderiza correctamente la categoría elite', async () => {
    const html = await container.renderToString(RiderCard, {
      props: { ...baseProps, category: 'elite' },
    });
    expect(html).toContain('Elite');
  });

  // ─── Especialidad ─────────────────────────────────────────

  it('no muestra especialidad cuando no se proporciona', async () => {
    const html = await container.renderToString(RiderCard, {
      props: baseProps,
    });
    // No debe haber <p> de especialidad
    const doc = parseHtml(html);
    const paragraphs = doc.querySelectorAll('p');
    expect(paragraphs.length).toBe(0);
  });

  it('muestra la etiqueta de especialidad XCO cuando se proporciona', async () => {
    const html = await container.renderToString(RiderCard, {
      props: { ...baseProps, specialty: 'xco' },
    });
    expect(html).toContain('XCO');
  });

  it('muestra la etiqueta de especialidad XCM', async () => {
    const html = await container.renderToString(RiderCard, {
      props: { ...baseProps, specialty: 'xcm' },
    });
    expect(html).toContain('XCM');
  });

  it('muestra la especialidad raw cuando no está en el mapa de etiquetas', async () => {
    const html = await container.renderToString(RiderCard, {
      props: { ...baseProps, specialty: 'downhill' },
    });
    expect(html).toContain('downhill');
  });

  // ─── Placeholder de imagen ────────────────────────────────

  it('incluye el atributo alt con el nombre del corredor', async () => {
    const html = await container.renderToString(RiderCard, {
      props: baseProps,
    });
    expect(html).toContain('alt="Foto de Santiago García"');
  });

  // ─── Clases de animación ──────────────────────────────────

  it('el enlace tiene clase "group" para estilos de hover', async () => {
    const html = await container.renderToString(RiderCard, {
      props: baseProps,
    });
    const doc = parseHtml(html);
    const anchor = doc.querySelector('a')!;
    expect(anchor.className).toContain('group');
  });

  it('el h3 tiene clase group-hover:text-primary para efecto hover', async () => {
    const html = await container.renderToString(RiderCard, {
      props: baseProps,
    });
    const doc = parseHtml(html);
    const h3 = doc.querySelector('h3')!;
    expect(h3.className).toContain('group-hover:text-primary');
  });

  it('la tarjeta se eleva con sombra al hover, mismo tratamiento que NewsCard', async () => {
    const html = await container.renderToString(RiderCard, {
      props: baseProps,
    });
    const doc = parseHtml(html);
    const anchor = doc.querySelector('a')!;
    expect(anchor.className).toContain('hover:-translate-y-1');
    expect(anchor.className).toContain('hover:shadow-lg');
    expect(anchor.className).toContain('ease-spring');
  });

  it('anula el desplazamiento de hover bajo prefers-reduced-motion', async () => {
    const html = await container.renderToString(RiderCard, {
      props: baseProps,
    });
    const doc = parseHtml(html);
    const anchor = doc.querySelector('a')!;
    expect(anchor.className).toContain('motion-reduce:transition-none');
    expect(anchor.className).toContain('motion-reduce:hover:translate-y-0');
  });
});
