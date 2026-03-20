import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import SocialLinks from '../SocialLinks.astro';
import { SOCIAL } from '../../../lib/constants';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

describe('SocialLinks', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;

  beforeAll(async () => {
    container = await AstroContainer.create();
  });

  // ─── Redes presentes ──────────────────────────────────────

  it('renderiza los 4 enlaces de redes sociales', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const links = doc.querySelectorAll('a');
    expect(links.length).toBe(4);
  });

  it('incluye enlace a Instagram con la URL correcta', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const links = Array.from(doc.querySelectorAll('a'));
    const instagram = links.find((a) => a.getAttribute('href') === SOCIAL.instagram);
    expect(instagram).not.toBeUndefined();
  });

  it('incluye enlace a Facebook con la URL correcta', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const links = Array.from(doc.querySelectorAll('a'));
    const facebook = links.find((a) => a.getAttribute('href') === SOCIAL.facebook);
    expect(facebook).not.toBeUndefined();
  });

  it('incluye enlace a YouTube con la URL correcta', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const links = Array.from(doc.querySelectorAll('a'));
    const youtube = links.find((a) => a.getAttribute('href') === SOCIAL.youtube);
    expect(youtube).not.toBeUndefined();
  });

  it('incluye enlace a Strava con la URL correcta', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const links = Array.from(doc.querySelectorAll('a'));
    const strava = links.find((a) => a.getAttribute('href') === SOCIAL.strava);
    expect(strava).not.toBeUndefined();
  });

  // ─── Accesibilidad ────────────────────────────────────────

  it('todos los enlaces tienen aria-label descriptivo', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const links = doc.querySelectorAll('a');
    links.forEach((link) => {
      const label = link.getAttribute('aria-label');
      expect(label).not.toBeNull();
      expect(label!.length).toBeGreaterThan(0);
    });
  });

  it('los aria-labels incluyen el nombre de la red social', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const labels = Array.from(doc.querySelectorAll('a')).map(
      (a) => a.getAttribute('aria-label') ?? ''
    );
    expect(labels.some((l) => l.includes('Instagram'))).toBe(true);
    expect(labels.some((l) => l.includes('Facebook'))).toBe(true);
    expect(labels.some((l) => l.includes('YouTube'))).toBe(true);
    expect(labels.some((l) => l.includes('Strava'))).toBe(true);
  });

  it('todos los enlaces abren en nueva pestaña', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const links = doc.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.getAttribute('target')).toBe('_blank');
    });
  });

  it('todos los enlaces tienen rel="noopener noreferrer"', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const links = doc.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.getAttribute('rel')).toBe('noopener noreferrer');
    });
  });

  it('los SVG dentro de los enlaces tienen aria-hidden="true"', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const svgs = doc.querySelectorAll('svg');
    svgs.forEach((svg) => {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    });
  });

  // ─── Tamaños ──────────────────────────────────────────────

  it('aplica tamaño md (w-6 h-6) por defecto', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const svgs = doc.querySelectorAll('svg');
    // En JSDOM, svg.className es SVGAnimatedString — usar getAttribute('class')
    svgs.forEach((svg) => {
      const cls = svg.getAttribute('class') ?? '';
      expect(cls).toContain('w-6');
      expect(cls).toContain('h-6');
    });
  });

  it('aplica tamaño sm (w-5 h-5) cuando se especifica', async () => {
    const html = await container.renderToString(SocialLinks, {
      props: { size: 'sm' },
    });
    const doc = parseHtml(html);
    const svgs = doc.querySelectorAll('svg');
    svgs.forEach((svg) => {
      const cls = svg.getAttribute('class') ?? '';
      expect(cls).toContain('w-5');
      expect(cls).toContain('h-5');
    });
  });

  it('aplica tamaño lg (w-8 h-8) cuando se especifica', async () => {
    const html = await container.renderToString(SocialLinks, {
      props: { size: 'lg' },
    });
    const doc = parseHtml(html);
    const svgs = doc.querySelectorAll('svg');
    svgs.forEach((svg) => {
      const cls = svg.getAttribute('class') ?? '';
      expect(cls).toContain('w-8');
      expect(cls).toContain('h-8');
    });
  });

  // ─── Variantes de color ───────────────────────────────────

  it('aplica colores dark por defecto (texto gris)', async () => {
    const html = await container.renderToString(SocialLinks, {});
    const doc = parseHtml(html);
    const links = doc.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.className).toContain('text-text-secondary');
    });
  });

  it('aplica colores light (texto blanco) cuando variant="light"', async () => {
    const html = await container.renderToString(SocialLinks, {
      props: { variant: 'light' },
    });
    const doc = parseHtml(html);
    const links = doc.querySelectorAll('a');
    links.forEach((link) => {
      expect(link.className).toContain('text-white/70');
    });
  });

  // ─── Clase personalizada ──────────────────────────────────

  it('aplica clase personalizada en el contenedor', async () => {
    const html = await container.renderToString(SocialLinks, {
      props: { class: 'mt-4' },
    });
    const doc = parseHtml(html);
    const wrapper = doc.querySelector('div');
    expect(wrapper?.className).toContain('mt-4');
  });
});
