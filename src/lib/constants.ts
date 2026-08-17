export const SITE = {
  name: 'Club Deportivo Trocha y Ruta',
  shortName: 'Trocha y Ruta',
  tagline: 'Deporte, formación y contacto con la naturaleza',
  url: 'https://clubdeportivotrochayruta.org',
  founded: 2010,
  description:
    'Club de ciclomontañismo para niños desde 4 años en Yumbo, Valle del Cauca, Colombia.',
} as const;

/*
 * Aquí vivía `CLUB_STATS` —80 niños formados, 50 competencias, 100 medallas—.
 * Se eliminó: ninguna de las tres tenía fuente de verdad. Eran números
 * redondos que el sitio repetía en cuatro páginas como si fueran datos, y su
 * propio comentario admitía que estaban "pendientes de confirmación oficial".
 *
 * Las páginas que las mostraban usan ahora cifras que salen del contenido y
 * que el lector puede comprobar: años cumplidos (`getYearsActive()`),
 * programas y cupos (`summarizePrograms()`), fechas de la temporada
 * (`buildSeason()`) y árboles del inventario (`summarizeTrees()`).
 *
 * Si el club confirma alguna de las tres con respaldo, vuelve aquí —fuente
 * única— y no escrita a mano en la plantilla.
 */

/** Fecha de fundación exacta: 1 de mayo de 2010. */
export const FOUNDING_DATE = new Date(SITE.founded, 4, 1);

/** Años cumplidos desde la fundación, a la fecha de build. */
export function getYearsActive(reference: Date = new Date()): number {
  const anniversaryThisYear = new Date(
    reference.getFullYear(),
    FOUNDING_DATE.getMonth(),
    FOUNDING_DATE.getDate()
  );
  const years = reference.getFullYear() - FOUNDING_DATE.getFullYear();
  return reference < anniversaryThisYear ? years - 1 : years;
}

export const CONTACT = {
  email: 'clubtrochayruta@hotmail.com',
  phone: '314 850 5372',
  phoneLink: 'tel:+573148505372',
  whatsapp: 'https://wa.me/573148505372',
  address: 'CL 8 Norte 2 N° 55, Yumbo, Valle del Cauca',
  mapUrl: 'https://maps.app.goo.gl/PQx1LSLCpunnYCtm6',
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3978.5!2d-76.4855763!3d3.5965919!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e30aa594e84bc01%3A0x875e7af1be45105e!2sPista%20de%20Ciclomonta%C3%B1ismo%20%22Carlos%20Castro%22!5e0!3m2!1ses!2sco!4v1710864000000',
} as const;

export const SOCIAL = {
  instagram: 'https://www.instagram.com/club_trochayruta/',
  facebook: 'https://www.facebook.com/trochayruta',
  youtube: 'https://www.youtube.com/@clubtrochayruta',
  strava: 'https://www.strava.com/clubs/326554',
} as const;

export const NAV_ITEMS = [
  { label: 'Inicio', href: '/' },
  { label: 'Quiénes Somos', href: '/quienes-somos' },
  { label: 'Programas', href: '/programas' },
  // { label: 'Equipo', href: '/equipo' }, // TODO: habilitar cuando se implemente la sección de equipo
  { label: 'Noticias', href: '/noticias' },
  { label: 'Calendario', href: '/calendario' },
] as const;

export const SECONDARY_NAV = [
  { label: 'Galería', href: '/galeria' },
  { label: 'Trocha Verde', href: '/trocha-verde' },
  { label: 'Preguntas Frecuentes', href: '/preguntas-frecuentes' },
  { label: 'Patrocinadores', href: '/patrocinadores' },
  { label: 'Transparencia', href: '/transparencia' },
  { label: 'Política Editorial', href: '/politica-editorial' },
  { label: 'Contacto', href: '/contacto' },
] as const;

/**
 * La línea 141 del ICBF es un canal nacional de protección a la niñez,
 * gratuito y confidencial: existe con independencia del club y por eso se
 * sigue publicando en el pie.
 *
 * Aquí había también `policyUrl`, que apuntaba a una "política de protección
 * infantil" publicada en el sitio. El club confirmó que esa política no
 * existe en la práctica, así que la página y todo lo que la afirmaba se
 * eliminaron: anunciar un protocolo que nadie aplica es peor que no tenerlo.
 */
export const CHILD_SAFETY = {
  icbfLine: '141',
} as const;
