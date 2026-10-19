import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { JSDOM } from 'jsdom';
import { describe, it, expect, beforeAll } from 'vitest';
import ValidaAllies from '../ValidaAllies.astro';
import aliadosJson from '../../../data/valida-yumbo-2026/aliados.json';
import type { Ally } from '@lib/valida';

function parseHtml(html: string) {
  return new JSDOM(html).window.document;
}

const realAllies = aliadosJson as Ally[];

const logo = (id: string) => `/images/valida-yumbo-2026/aliados/${id}.webp`;
const allies: Ally[] = [
  {
    id: 'yumbileta',
    name: 'Yumbileta',
    role: 'patrocinio',
    tagline: 'Paletería artesanal de Yumbo',
    instagram: 'yumbileta',
    url: null,
    logo: logo('yumbileta'),
    logoRatio: 3.2,
  },
  {
    id: 'ascomy',
    name: 'ASCOMY',
    role: 'apoyo',
    tagline: 'Asociación de Comerciantes',
    instagram: null,
    url: null,
    logo: logo('ascomy'),
    logoRatio: 0.79,
  },
  {
    id: 'ram-bike-atelier',
    name: 'Ram Bike Atelier',
    role: 'patrocinio',
    tagline: null,
    instagram: null,
    url: 'https://www.facebook.com/rambikeatelier/',
    logo: logo('ram-bike-atelier'),
    logoRatio: 1.17,
  },
  {
    id: 'aguila-roja',
    name: 'Café Águila Roja',
    role: 'patrocinio',
    tagline: null,
    instagram: null,
    url: null,
    logo: logo('aguila-roja'),
    logoRatio: 1,
  },
];

const institutions = ['Comisión Vallecaucana de Ciclomontañismo', 'IMDERTY', 'Shimano'];

/** La tarjeta de un aliado: el elemento que contiene su título. */
function cardOf(doc: Document, name: string): Element {
  const heading = [...doc.querySelectorAll('h4')].find((h) => h.textContent?.trim() === name);
  if (!heading) throw new Error(`No hay tarjeta para ${name}`);
  return heading.closest('li')!.firstElementChild!;
}

describe('ValidaAllies', () => {
  let container: Awaited<ReturnType<typeof AstroContainer.create>>;
  let doc: Document;

  beforeAll(async () => {
    container = await AstroContainer.create();
    doc = parseHtml(
      await container.renderToString(ValidaAllies, { props: { allies, institutions } }),
    );
  });

  it('no pinta nada sin aliados', async () => {
    const empty = parseHtml(
      await container.renderToString(ValidaAllies, { props: { allies: [], institutions } }),
    );
    expect(empty.querySelector('section')).toBeNull();
  });

  it('es un escenario oscuro anclado en #aliados y nombrado por su titular', () => {
    const section = doc.querySelector('section#aliados')!;
    expect(section).not.toBeNull();
    expect(section.className).toContain('bg-surface-dark');
    // Al saltar, el borde de la sección se pega a la cabecera fija.
    expect(section.className).toContain('scroll-mt-[var(--header-h,4rem)]');
    const heading = doc.getElementById(section.getAttribute('aria-labelledby')!);
    // «le apostaron» lleva espacio duro: el trazo lima no se parte en dos líneas.
    expect(heading?.textContent).toContain('Gracias a quienes le\u00A0apostaron a la válida');
    expect(heading?.querySelector('.editorial-mark')?.textContent).toBe('le\u00A0apostaron');
  });

  it('en el tema oscuro lleva un filete lima arriba, y solo ahí', () => {
    const classes = doc.querySelector('section#aliados')!.className.split(/\s+/);
    expect(classes).toContain('dark:shadow-[inset_0_3px_0_var(--color-accent)]');
    // Nada de sombra en claro: el escenario ya se recorta solo (13,4:1).
    expect(classes.filter((c) => c.startsWith('shadow-'))).toEqual([]);
  });

  it('agrupa por rol: primero el patrocinio, después el apoyo; el respaldo cierra', () => {
    const headings = [...doc.querySelectorAll('h3')].map((h) => h.textContent?.trim());
    // «Con el respaldo de» también es un encabezado: quien navega por ellos lo encuentra.
    expect(headings).toEqual(['Con el patrocinio de', 'Con el apoyo de', 'Con el respaldo de']);
    const groups = headings.slice(0, 2);
    const lists = [...doc.querySelectorAll('ul[role="list"]')];
    expect(lists).toHaveLength(2);
    // Cada lista se nombra con el rótulo de su grupo.
    expect(
      lists.map((ul) =>
        doc.getElementById(ul.getAttribute('aria-labelledby')!)?.textContent?.trim(),
      ),
    ).toEqual(groups);
  });

  it('ordena alfabéticamente dentro de cada grupo, sin distinguir tildes', () => {
    const [sponsors, supporters] = [...doc.querySelectorAll('ul[role="list"]')].map((ul) =>
      [...ul.querySelectorAll('h4')].map((h) => h.textContent?.trim()),
    );
    expect(sponsors).toEqual(['Café Águila Roja', 'Ram Bike Atelier', 'Yumbileta']);
    expect(supporters).toEqual(['ASCOMY']);
  });

  it('todas las tarjetas son iguales: sin píldora de rol ni destacados', () => {
    const cards = [...doc.querySelectorAll('ul[role="list"] > li')];
    expect(cards).toHaveLength(allies.length);
    for (const card of cards) {
      const texts = [...card.querySelectorAll('span, p')].map((el) => el.textContent?.trim());
      expect(texts).not.toContain('Patrocinador');
      expect(texts).not.toContain('Apoyo');
    }
    // Misma caja para todos, sobre el papel: sin placa blanca propia.
    const boxes = cards.map((card) => card.querySelector('img')!.parentElement!.className);
    expect(new Set(boxes).size).toBe(1);
    for (const box of boxes) {
      expect(box).toContain('aspect-[5/3]');
      expect(box.split(/\s+/)).toContain('isolate');
      expect(box).not.toContain('bg-white');
    }
    for (const card of cards) {
      expect(card.querySelector('img')!.className).toContain('mix-blend-multiply');
    }
  });

  it('todos los aliados van en un solo pliego con marcas de corte; el respaldo queda fuera', () => {
    const sheets = doc.querySelectorAll('.pliego');
    expect(sheets).toHaveLength(1);
    const sheet = sheets[0];
    expect(sheet.querySelector('.pliego__corte')?.getAttribute('aria-hidden')).toBe('true');
    expect(sheet.querySelectorAll('ul[role="list"]')).toHaveLength(2);
    expect(sheet.textContent).toContain('Con el patrocinio de');
    expect(sheet.textContent).toContain('Con el apoyo de');
    expect(sheet.textContent).not.toContain('Con el respaldo de');
    expect(sheet.textContent).not.toContain('¿Tu marca en la próxima?');
    // El papel es una variable local que el tema oscuro remapea (ver el <style>).
    expect(sheet.className).toContain('bg-[var(--pliego-papel)]');
  });

  it('la descripción sale por grupo, solo si todas las del grupo la tienen', () => {
    // En patrocinio a dos les falta: no sale ninguna, tampoco la de Yumbileta.
    expect(doc.body.textContent).not.toContain('Paletería artesanal de Yumbo');
    // ASCOMY, sola en su grupo, la tiene: la conserva.
    expect(cardOf(doc, 'ASCOMY').textContent).toContain('Asociación de Comerciantes');
  });

  it('el usuario va en accent-deep y el que se subraya al pasar es el nombre; no se levanta', () => {
    const card = cardOf(doc, 'Yumbileta');
    const line = card.querySelector('h4 ~ span')!;
    expect(line.className.split(/\s+/)).toContain('text-accent-deep');
    // Lima como texto sobre el papel claro no pasa contraste: nunca `text-accent` ni `-light`.
    expect(line.className).not.toMatch(/text-accent(?!-deep)/);
    const nameClasses = card.querySelector('h4')!.className.split(/\s+/);
    expect(nameClasses).toContain('group-hover:underline');
    expect(nameClasses).toContain('group-focus-visible:underline');
    expect(card.className).not.toContain('translate');
  });

  it('los usuarios largos se cortan solo en _ y . (con <wbr>), no a mitad de palabra', async () => {
    const long: Ally = {
      id: 'beru',
      name: 'Alquiequipos Beru',
      role: 'patrocinio',
      tagline: null,
      instagram: 'bicicletas_garces.yumbo',
      url: null,
      logo: logo('beru'),
      logoRatio: 1,
    };
    const one = parseHtml(
      await container.renderToString(ValidaAllies, { props: { allies: [long] } }),
    );
    const text = cardOf(one, 'Alquiequipos Beru').querySelector('h4 ~ span')!;
    const holder = [...text.querySelectorAll('span')].find((el) => el.querySelector('wbr'))!;
    expect(holder.textContent).toBe('@bicicletas_garces.yumbo');
    expect(holder.querySelectorAll('wbr')).toHaveLength(2);
    expect(holder.innerHTML.replace(/ data-astro-cid-\w+=""/g, '')).toContain(
      '@bicicletas_<wbr>garces.<wbr>yumbo',
    );
    expect(holder.className).toContain('[overflow-wrap:break-word]');
    expect(holder.className).not.toContain('anywhere');
  });

  it('la tarjeta es un enlace solo si hay a dónde ir', () => {
    expect(cardOf(doc, 'Yumbileta').tagName).toBe('A');
    expect(cardOf(doc, 'Ram Bike Atelier').tagName).toBe('A');
    expect(cardOf(doc, 'Café Águila Roja').tagName).toBe('DIV');
    expect(cardOf(doc, 'ASCOMY').tagName).toBe('DIV');
  });

  it('los enlaces llevan la analítica por marca y avisan que abren otra pestaña', () => {
    const yumbileta = cardOf(doc, 'Yumbileta');
    expect(yumbileta.getAttribute('href')).toBe('https://www.instagram.com/yumbileta/');
    expect(yumbileta.getAttribute('target')).toBe('_blank');
    expect(yumbileta.getAttribute('rel')).toBe('noopener noreferrer');
    expect(yumbileta.getAttribute('data-analytics-event')).toBe('sponsor_click');
    expect(yumbileta.getAttribute('data-analytics-sponsor-id')).toBe('yumbileta');
    expect(yumbileta.querySelector('.sr-only')?.textContent).toContain(
      'se abre en una pestaña nueva',
    );
    expect(yumbileta.textContent).toContain('@yumbileta');
    // Sin Instagram, el enlace dice a dónde va.
    expect(cardOf(doc, 'Ram Bike Atelier').textContent).toContain('Facebook');
    // Una tarjeta sin enlace no lleva analítica.
    expect(cardOf(doc, 'ASCOMY').hasAttribute('data-analytics-event')).toBe(false);
  });

  it('el logo no repite el nombre: alt vacío y el nombre en el título de la tarjeta', () => {
    for (const img of doc.querySelectorAll('ul[role="list"] img')) {
      expect(img.getAttribute('alt')).toBe('');
    }
    expect(cardOf(doc, 'Yumbileta').querySelector('h4')?.textContent?.trim()).toBe('Yumbileta');
  });

  it('cada logo trae su versión de 320 px y el ancho que de verdad ocupa', () => {
    const img = cardOf(doc, 'Yumbileta').querySelector('img')!;
    expect(img.getAttribute('srcset')).toBe(
      '/images/valida-yumbo-2026/aliados/yumbileta-320.webp 320w, /images/valida-yumbo-2026/aliados/yumbileta.webp 640w',
    );
    const sizes = img.getAttribute('sizes')!;
    // Cinco columnas de 224 px con el tope; en el teléfono, media pantalla menos márgenes.
    expect(sizes).toMatch(/^\(min-width: 1280px\) [\d.]+px, \(min-width: 1024px\) calc\(/);
    expect(sizes).toMatch(/, calc\([\d.]+vw - [\d.]+px\)$/);
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('iguala la superficie de los logos, no la caja', () => {
    const width = (name: string) =>
      Number(
        cardOf(doc, name)
          .querySelector('img')!
          .getAttribute('style')
          ?.match(/width:([\d.]+)%/)?.[1],
      );
    const area = (name: string, ratio: number) => width(name) ** 2 / ratio;
    expect(width('Yumbileta')).toBeGreaterThan(width('Café Águila Roja'));
    expect(width('Café Águila Roja')).toBeGreaterThan(width('ASCOMY'));
    expect(area('Yumbileta', 3.2)).toBeCloseTo(area('Café Águila Roja', 1), -1);
    expect(area('ASCOMY', 0.79)).toBeCloseTo(area('Café Águila Roja', 1), -1);
  });

  it('un solo contenedor del muro para sponsor_wall_view («muro»), con los dos grupos dentro', () => {
    const walls = doc.querySelectorAll('[data-sponsor-wall]');
    expect(walls).toHaveLength(1);
    expect(walls[0].getAttribute('data-sponsor-wall')).toBe('muro');
    expect(walls[0].querySelectorAll('ul[role="list"]')).toHaveLength(2);
  });

  it('un solo script mide la franja y el muro, una vez cada uno por visita', async () => {
    const html = await container.renderToString(ValidaAllies, { props: { allies, institutions } });
    expect(html).toContain("document.querySelectorAll('[data-sponsor-wall]')");
    expect(html).toContain("__trochaEmit('sponsor_wall_view', { content_id: kind })");
    // La franja cuenta cuando pasa entera; el muro, al llegar a la mitad de la pantalla.
    expect(html).toContain('threshold: 1');
    expect(html).toContain("rootMargin: '0px 0px -50% 0px'");
    expect(html).toContain('state.seen[kind] = true');
    expect(html).toContain('astro:before-swap');
    expect(html).not.toContain('define:vars');
  });

  it('cierra con el respaldo institucional en prosa y la invitación a patrocinar', () => {
    expect(doc.body.textContent).toContain('Con el respaldo de');
    expect(doc.body.textContent).toContain(
      'Comisión Vallecaucana de Ciclomontañismo, IMDERTY y Shimano.',
    );
    const cta = doc.querySelector('a[href="/patrocinadores"]')!;
    expect(cta.textContent?.trim()).toBe('¿Tu marca en la próxima?');
    expect(cta.getAttribute('data-analytics-event')).toBe('sponsor_click');
    expect(cta.getAttribute('data-analytics-sponsor-id')).toBe('quiero-patrocinar');
  });

  it('la bajada une a los aliados con las fotos gratis y dice el orden, no cuántos son', async () => {
    expect(doc.body.textContent).toContain(
      'Por ellos las fotos de esta página son gratis para todas las familias. Van en orden alfabético.',
    );
    // El «16» ya lo dicen la banda de la franja y el índice.
    expect(doc.body.textContent).not.toContain(`Son ${allies.length}`);

    // Con un solo aliado no hay orden que decir.
    const single = parseHtml(
      await container.renderToString(ValidaAllies, { props: { allies: allies.slice(0, 1) } }),
    );
    expect(single.body.textContent).toContain(
      'Por este aliado las fotos de esta página son gratis para todas las familias.',
    );
    expect(single.body.textContent).not.toContain('orden alfabético');
  });

  it('con los datos reales: cada grupo muestra a todos sus aliados', async () => {
    const real = parseHtml(
      await container.renderToString(ValidaAllies, { props: { allies: realAllies, institutions } }),
    );
    const [sponsors, supporters] = [...real.querySelectorAll('ul[role="list"]')].map(
      (ul) => ul.querySelectorAll(':scope > li').length,
    );
    expect(sponsors).toBe(realAllies.filter((ally) => ally.role === 'patrocinio').length);
    expect(supporters).toBe(realAllies.filter((ally) => ally.role === 'apoyo').length);
    expect(real.querySelectorAll('h4')).toHaveLength(realAllies.length);
  });

  it('con los datos reales, el apoyo nombra las secretarías de la Alcaldía una sola vez', async () => {
    const real = parseHtml(
      await container.renderToString(ValidaAllies, { props: { allies: realAllies, institutions } }),
    );
    const supporters = [...real.querySelectorAll('ul[role="list"]')][1];
    const names = [...supporters.querySelectorAll('h4')].map((h4) => h4.textContent?.trim());
    expect(names).toContain('Alcaldía de Yumbo');
    // En el grupo de apoyo todas tienen descripción, así que sale en las dos tarjetas.
    expect(supporters.textContent).toContain('Secretarías de Desarrollo Económico');
    expect(supporters.textContent).toContain('Asociación de Comerciantes');
    expect(real.body.textContent?.match(/Alcaldía de Yumbo/g)).toHaveLength(1);
  });
});
