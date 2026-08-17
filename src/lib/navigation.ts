/**
 * Navegación del sitio: qué está activo y cómo se agrupan los enlaces del pie.
 *
 * Dos cosas vivían escritas dos veces y sin probar:
 *
 * 1. La regla de "sección activa" estaba copiada igual en `Header.astro` y en
 *    `MobileMenu.tsx`, con un fallo de prefijo: `startsWith('/noticias')`
 *    también daba positivo en una futura `/noticias-especiales`. Aquí se
 *    resuelve una vez y se testea.
 * 2. El pie listaba nueve enlaces en una sola columna, mezclando secciones del
 *    club, páginas para familias y textos institucionales. Ahora se agrupan por
 *    lo que son.
 *
 * Puro: sin `node:fs` y sin importar `astro:content`.
 */

// ─── Sección activa ─────────────────────────────────────────────────────────

/** Quita la barra final para poder comparar `/programas` con `/programas/`. */
function normalize(path: string): string {
  return path.length > 1 && path.endsWith('/') ? path.slice(0, -1) : path;
}

/**
 * ¿El enlace `href` corresponde a la página que se está viendo?
 *
 * La portada solo está activa en la portada; el resto también lo está en sus
 * páginas hijas (`/programas` con `/programas/alto-rendimiento`). El corte se
 * hace en el separador: `/noticias` **no** activa `/noticias-especiales`, que
 * es lo que hacía el `startsWith` a secas.
 */
export function isActivePath(currentPath: string, href: string): boolean {
  const current = normalize(currentPath);
  const target = normalize(href);

  if (target === '/') return current === '/';
  return current === target || current.startsWith(`${target}/`);
}

// ─── Enlaces del pie, agrupados ─────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

export interface FooterGroup {
  /** Rótulo de la columna. */
  title: string;
  links: NavLink[];
}

/**
 * El pie repite el mapa del sitio, agrupado como está organizado de verdad:
 * qué es el club, qué pasa esta temporada, qué necesita una familia y qué
 * papeles publica la institución. Antes era una lista plana de nueve enlaces
 * donde "Galería" y "Política de Tratamiento de Datos" pesaban lo mismo.
 */
export const FOOTER_GROUPS: FooterGroup[] = [
  {
    title: 'El club',
    links: [
      { label: 'Quiénes somos', href: '/quienes-somos' },
      { label: 'Programas', href: '/programas' },
      { label: 'Galería', href: '/galeria' },
      { label: 'Trocha Verde', href: '/trocha-verde' },
    ],
  },
  {
    title: 'La temporada',
    links: [
      { label: 'Calendario', href: '/calendario' },
      { label: 'Noticias', href: '/noticias' },
      { label: 'Patrocinadores', href: '/patrocinadores' },
    ],
  },
  {
    title: 'Para familias',
    links: [
      { label: 'Inscripciones', href: '/inscripciones' },
      { label: 'Preguntas frecuentes', href: '/preguntas-frecuentes' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },
  {
    title: 'Institucional',
    links: [
      { label: 'Transparencia', href: '/transparencia' },
      { label: 'Política editorial', href: '/politica-editorial' },
      { label: 'Tratamiento de datos', href: '/politica-de-tratamiento-de-datos' },
    ],
  },
];

/** Todos los enlaces del pie, sin agrupar: para comprobar que resuelven. */
export function allFooterLinks(): NavLink[] {
  return FOOTER_GROUPS.flatMap((group) => group.links);
}
