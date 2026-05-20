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
] as const

export type EventName = (typeof EVENT_NAMES)[number]

export const ALLOWED_PARAM_KEYS = [
  'program_id',
  'age_bucket',
  'step',
  'depth',
  'pdf_name',
  'sponsor_id',
] as const

export type EventParamKey = (typeof ALLOWED_PARAM_KEYS)[number]
