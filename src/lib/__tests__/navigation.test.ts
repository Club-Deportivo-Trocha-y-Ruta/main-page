import { describe, it, expect } from 'vitest';
import { isActivePath, FOOTER_GROUPS, allFooterLinks } from '../navigation';
import { NAV_ITEMS, SECONDARY_NAV } from '../constants';

// ============================================================
// isActivePath
// ============================================================

describe('isActivePath', () => {
  it('marca la página exacta', () => {
    expect(isActivePath('/programas', '/programas')).toBe(true);
  });

  it('no depende de la barra final, que sí ponen las URL construidas', () => {
    expect(isActivePath('/programas/', '/programas')).toBe(true);
    expect(isActivePath('/programas', '/programas/')).toBe(true);
  });

  it('marca la sección desde una página hija', () => {
    expect(isActivePath('/programas/alto-rendimiento/', '/programas')).toBe(true);
    expect(isActivePath('/noticias/2026-08-copa-valle-palmira-xco/', '/noticias')).toBe(true);
    expect(isActivePath('/trocha-verde/arboles/chambimbe-01/', '/trocha-verde')).toBe(true);
  });

  it('no confunde una ruta que solo comparte prefijo', () => {
    // El `startsWith` a secas daba positivo aquí.
    expect(isActivePath('/noticias-especiales/', '/noticias')).toBe(false);
    expect(isActivePath('/programas-2027/', '/programas')).toBe(false);
  });

  it('la portada solo está activa en la portada', () => {
    expect(isActivePath('/', '/')).toBe(true);
    expect(isActivePath('/programas/', '/')).toBe(false);
    expect(isActivePath('/noticias/algo/', '/')).toBe(false);
  });

  it('no marca una sección distinta', () => {
    expect(isActivePath('/calendario/', '/programas')).toBe(false);
  });

  it('cada ruta del sitio activa una sola entrada del menú principal', () => {
    // Si dos entradas se encendieran a la vez, el menú mentiría.
    const rutas = ['/', '/quienes-somos/', '/programas/', '/noticias/', '/calendario/'];
    for (const ruta of rutas) {
      const activos = NAV_ITEMS.filter((item) => isActivePath(ruta, item.href));
      expect(activos).toHaveLength(1);
    }
  });

  it('ninguna entrada secundaria se solapa con otra', () => {
    for (const item of SECONDARY_NAV) {
      const activos = SECONDARY_NAV.filter((other) => isActivePath(item.href, other.href));
      expect(activos.map((a) => a.href)).toEqual([item.href]);
    }
  });
});

// ============================================================
// FOOTER_GROUPS
// ============================================================

describe('FOOTER_GROUPS', () => {
  it('agrupa en cuatro columnas con título', () => {
    expect(FOOTER_GROUPS).toHaveLength(4);
    for (const group of FOOTER_GROUPS) {
      expect(group.title.length).toBeGreaterThan(0);
      expect(group.links.length).toBeGreaterThan(0);
    }
  });

  it('no repite un enlace en dos columnas', () => {
    const hrefs = allFooterLinks().map((link) => link.href);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  it('todos los destinos son rutas internas', () => {
    for (const link of allFooterLinks()) {
      expect(link.href).toMatch(/^\/[a-z0-9-]*$/);
    }
  });

  it('no deja fuera ninguna sección del menú', () => {
    // El pie es el mapa del sitio: si una sección existe en el menú principal
    // o en el secundario, tiene que poder alcanzarse desde aquí.
    const enElPie = new Set(allFooterLinks().map((link) => link.href));
    for (const item of [...NAV_ITEMS, ...SECONDARY_NAV]) {
      if (item.href === '/') continue; // el logo ya lleva a la portada
      expect(enElPie.has(item.href)).toBe(true);
    }
  });
});
