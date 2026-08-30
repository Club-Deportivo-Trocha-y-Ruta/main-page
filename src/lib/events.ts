/**
 * Catálogo cerrado de nombres de evento y whitelist de parámetros.
 * Cualquier evento o param fuera de estas listas se descarta en sanitización.
 */

export const EVENT_NAMES = [
  'contact_submit',
  'inscription_step_view',
  'inscription_complete',
  'whatsapp_click',
  'cta_inscripcion_click',
  'sponsor_click',
  'transparencia_pdf_download',
  'scroll_depth',
  // Ficha de una válida (`/calendario/[slug]`). Se declaran los tres de golpe:
  // cada evento hay que repetirlo a mano en `Analytics.astro`, y hacerlo de a
  // uno multiplica la probabilidad de olvidar una de las dos listas.
  'race_registration_outbound',
  'race_directions_click',
  'race_calendar_add',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export const ALLOWED_PARAM_KEYS = [
  'program_id',
  'age_bucket',
  'step',
  'depth',
  'pdf_name',
  'sponsor_id',
  // `race_id` es el slug de la válida; `content_id`, el destino del clic
  // ('waze', 'google-maps', 'google-calendar', 'ics'). Ambos son datos
  // agregados, del mismo nivel que `age_bucket`: nunca identifican a nadie.
  'race_id',
  'content_id',
] as const;

export type EventParamKey = (typeof ALLOWED_PARAM_KEYS)[number];
