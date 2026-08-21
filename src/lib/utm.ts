/**
 * Etiquetado UTM de los enlaces que salen del sitio hacia redes y mensajería.
 *
 * Entre mayo y agosto de 2026 el 50% de las sesiones entraron como «Direct»
 * porque WhatsApp no envía `referer`: cualquier enlace pegado en un grupo de
 * familias llega a GA4 sin origen. Sin UTM no hay forma de saber si una crónica
 * corrió por WhatsApp, por la bio de Instagram o por Facebook.
 *
 * `medium: 'social'` no es decorativo: GA4 solo clasifica la sesión dentro del
 * grupo «Organic Social» si el medium es uno de sus valores reconocidos
 * (`social`, `social-network`, `social-media`, `sm`). Con `referral` o un valor
 * inventado la sesión cae en «Referral» o «Unassigned» y el informe de canales
 * deja de cuadrar.
 *
 * La convención completa, incluida la parte manual (publicaciones del club en
 * Instagram y Facebook), está en `docs/05-convencion-utm.md`.
 */

export interface UtmParams {
  /** De dónde llega la visita: `whatsapp`, `instagram`, `facebook`… */
  source: string;
  /** Agrupación de canal en GA4. Por defecto `social`. */
  medium?: string;
  /** Qué acción o pieza generó el enlace. */
  campaign?: string;
  /** Variante concreta, para distinguir dos enlaces de la misma campaña. */
  content?: string;
}

/**
 * Devuelve `url` con los parámetros UTM aplicados.
 *
 * Conserva la query que ya trajera la URL y sobrescribe únicamente las claves
 * `utm_*` indicadas, de modo que aplicarla dos veces no acumula duplicados.
 * Si la URL no es parseable se devuelve intacta: un enlace roto en la cara del
 * usuario es peor que una sesión sin atribuir.
 */
export function withUtm(url: string, params: UtmParams): string {
  const { source, medium = 'social', campaign, content } = params;

  if (!source) return url;

  // Base ficticia para admitir rutas relativas; se descarta al serializar.
  const RELATIVE_BASE = 'https://relative.invalid';

  let parsed: URL;
  try {
    parsed = new URL(url, RELATIVE_BASE);
  } catch {
    return url;
  }

  parsed.searchParams.set('utm_source', source);
  parsed.searchParams.set('utm_medium', medium);
  if (campaign) parsed.searchParams.set('utm_campaign', campaign);
  if (content) parsed.searchParams.set('utm_content', content);

  return parsed.origin === RELATIVE_BASE
    ? parsed.pathname + parsed.search + parsed.hash
    : parsed.href;
}

/**
 * Campaña de los botones «Compartir» del propio sitio.
 *
 * Se separa de lo que publica el club para poder responder a una pregunta que
 * hoy no tiene respuesta: cuánto tráfico llega porque una familia reenvió una
 * crónica por su cuenta, en vez de por una publicación oficial.
 */
export const SHARE_CAMPAIGN = 'compartir-desde-web';

/** `utm_source` de cada botón de compartir. */
export const SHARE_SOURCES = {
  whatsapp: 'whatsapp',
  facebook: 'facebook',
  twitter: 'twitter',
  /** Web Share API: el destino lo elige el sistema operativo y no se conoce. */
  native: 'compartir-nativo',
} as const;

export type ShareChannel = keyof typeof SHARE_SOURCES;

/** URL lista para el botón de compartir del canal indicado. */
export function shareUrl(url: string, channel: ShareChannel): string {
  return withUtm(url, { source: SHARE_SOURCES[channel], campaign: SHARE_CAMPAIGN });
}
