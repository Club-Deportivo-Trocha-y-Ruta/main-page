export const SITE = {
  name: 'Club Deportivo Trocha y Ruta',
  shortName: 'Trocha y Ruta',
  tagline: 'Deporte, formación y contacto con la naturaleza',
  url: 'https://clubdeportivotrochayruta.org',
  founded: 2010,
  description:
    'Club de ciclomontañismo para niños desde 4 años en Yumbo, Valle del Cauca, Colombia.',
} as const;

export const CONTACT = {
  email: 'clubtrochayruta@hotmail.com',
  phone: '320 856 1053',
  phoneLink: 'tel:+573208561053',
  whatsapp: 'https://wa.me/573208561053',
  address: 'CL 8 Norte 2 N° 55, Yumbo, Valle del Cauca',
  mapUrl: 'https://maps.app.goo.gl/PQx1LSLCpunnYCtm6',
  mapEmbed:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3978.5!2d-76.4855763!3d3.5965919!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e30aa594e84bc01%3A0x875e7af1be45105e!2sPista%20de%20Ciclomonta%C3%B1ismo%20%22Carlos%20Castro%22!5e0!3m2!1ses!2sco!4v1710864000000',
} as const;

export const SOCIAL = {
  instagram: 'https://www.instagram.com/club_trochayruta/',
  facebook: 'https://www.facebook.com/trochayruta',
  youtube: 'https://www.youtube.com/@clubtrochayruta',
} as const;

export const NAV_ITEMS = [
  { label: 'Inicio', href: '/' },
  { label: 'Quiénes Somos', href: '/quienes-somos' },
  { label: 'Programas', href: '/programas' },
  { label: 'Equipo', href: '/equipo' },
  { label: 'Noticias', href: '/noticias' },
  { label: 'Calendario', href: '/calendario' },
] as const;

export const SECONDARY_NAV = [
  { label: 'Galería', href: '/galeria' },
  { label: 'Testimonios', href: '/testimonios' },
  { label: 'Patrocinadores', href: '/patrocinadores' },
  { label: 'Transparencia', href: '/transparencia' },
  { label: 'Contacto', href: '/contacto' },
] as const;
