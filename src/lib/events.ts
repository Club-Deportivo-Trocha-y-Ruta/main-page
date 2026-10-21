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
  // Página de una válida corrida en casa (`/copa-valle-yumbo-2026`). Todos
  // viajan con `content_id`, que dice dónde ocurrió el clic o sobre qué foto o
  // grupo de fotos.
  'photo_download',
  'photo_share',
  'gallery_filter',
  'race_results_click',
  // Embudo de la galería: sin `photo_view` no hay tasa filtro → foto → descarga.
  'photo_view',
  // Una superficie de aliados entró en pantalla (una vez por visita y por
  // superficie): `content_id` dice cuál, `franja` (la cinta antes de la
  // galería) o `muro`. Es lo que se le reporta a cada marca como «personas que
  // vieron sus logos», no solo visitas.
  'sponsor_wall_view',
  // Salto dentro de la página: `content_id` es la sección de destino
  // («aliados», «resultados», «buscar») y `method` dice desde dónde (`indice` o
  // `franja`). Dice qué buscan quienes salen de la galería y qué
  // atajo usan.
  'page_nav_click',
  // Clic en una franja de la portada que lleva a otra página. `content_id` dice
  // a cuál («valida-yumbo-2026»).
  'home_promo_click',
] as const;

export type EventName = (typeof EVENT_NAMES)[number];

export const ALLOWED_PARAM_KEYS = [
  'program_id',
  'age_bucket',
  'step',
  'depth',
  'pdf_name',
  'sponsor_id',
  // Destino del clic o id de una foto o de un grupo de fotos («hero», «manga-3»,
  // «retiro-foto»). Nunca una persona ni un número de placa: identifica a un
  // corredor y la mayoría son niños.
  'content_id',
  // Cómo o desde dónde: el canal con que se compartió una foto (`native`, hoja
  // del sistema o portapapeles, o `whatsapp`) o el punto de la página desde el
  // que se saltó (`indice` o `franja`). Un nombre de canal o de
  // lugar, nunca una persona.
  'method',
] as const;

export type EventParamKey = (typeof ALLOWED_PARAM_KEYS)[number];
