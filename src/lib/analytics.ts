/**
 * Analytics — Interface neutral del módulo de tracking.
 *
 * Cómo agregar un evento nuevo:
 *   1. Declara su nombre en `EVENT_NAMES` (src/lib/events.ts).
 *   2. Si el evento necesita un parámetro nuevo, agrégalo al whitelist `ALLOWED_PARAM_KEYS`
 *      en `src/lib/events.ts`. NUNCA agregar parámetros con PII (nombre, email, teléfono,
 *      fecha nacimiento, EPS, dirección, etc).
 *   3. Llama `trackEvent({ name, params })` desde el componente.
 *
 * Reglas de no-PII:
 *   - Los params pasan por `sanitizeParams()` y se descartan los keys no whitelistados.
 *   - Para edad de menores usar `ageBucket(age)` — nunca enviar fecha de nacimiento real.
 *   - Los valores se truncan a 100 chars para evitar leaks largos.
 */

import { ALLOWED_PARAM_KEYS, type EventName, type EventParamKey } from './events'

export type AnalyticsConsentStatus = 'granted' | 'denied'
export type AnalyticsProviderId = 'ga4'

export type EventParams = Partial<Record<EventParamKey, string | number | boolean>>

export interface AnalyticsEvent {
  name: EventName
  params?: EventParams
}

export interface AnalyticsProvider {
  readonly id: 'ga4'
  init(): void
  trackPageview(path: string, title?: string): void
  trackEvent(event: AnalyticsEvent): void
  setConsent(status: AnalyticsConsentStatus): void
}

type QueueItem =
  | { kind: 'pageview'; path: string; title?: string }
  | { kind: 'event'; event: AnalyticsEvent }
  | { kind: 'consent'; status: AnalyticsConsentStatus }

interface AnalyticsGlobalState {
  providers: AnalyticsProvider[]
  queue: QueueItem[]
  ready: boolean
}

declare global {
  interface Window {
    __trochaAnalytics?: AnalyticsGlobalState
  }
}

function getState(): AnalyticsGlobalState {
  if (typeof window === 'undefined') {
    return { providers: [], queue: [], ready: false }
  }
  if (!window.__trochaAnalytics) {
    window.__trochaAnalytics = { providers: [], queue: [], ready: false }
  }
  return window.__trochaAnalytics
}

export function sanitizeParams(params?: EventParams): EventParams {
  if (!params) return {}
  const out: EventParams = {}
  for (const [rawKey, rawValue] of Object.entries(params)) {
    if (!ALLOWED_PARAM_KEYS.includes(rawKey as EventParamKey)) continue
    if (rawValue === undefined || rawValue === null) continue
    if (typeof rawValue === 'string') {
      out[rawKey as EventParamKey] = rawValue.slice(0, 100)
    } else if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
      out[rawKey as EventParamKey] = rawValue
    }
  }
  return out
}

export function registerProvider(provider: AnalyticsProvider): void {
  const state = getState()
  if (state.providers.some((p) => p.id === provider.id)) return
  state.providers.push(provider)
  provider.init()
  state.ready = true
  while (state.queue.length > 0) {
    const item = state.queue.shift()!
    dispatch(item)
  }
}

function dispatch(item: QueueItem): void {
  const state = getState()
  for (const provider of state.providers) {
    try {
      if (item.kind === 'pageview') provider.trackPageview(item.path, item.title)
      else if (item.kind === 'event') provider.trackEvent(item.event)
      else if (item.kind === 'consent') provider.setConsent(item.status)
    } catch {
      // Swallow provider errors — never break the host page.
    }
  }
}

function enqueueOrDispatch(item: QueueItem): void {
  const state = getState()
  if (state.providers.length === 0) {
    state.queue.push(item)
    return
  }
  dispatch(item)
}

export function trackPageview(path?: string, title?: string): void {
  if (typeof window === 'undefined') return
  const resolvedPath = path ?? window.location.pathname
  const resolvedTitle = title ?? document.title
  enqueueOrDispatch({ kind: 'pageview', path: resolvedPath, title: resolvedTitle })
}

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === 'undefined') return
  const sanitized: AnalyticsEvent = {
    name: event.name,
    params: sanitizeParams(event.params),
  }
  enqueueOrDispatch({ kind: 'event', event: sanitized })
}

export function setConsent(status: AnalyticsConsentStatus): void {
  if (typeof window === 'undefined') return
  enqueueOrDispatch({ kind: 'consent', status })
}

export function ageBucket(age: number | string | undefined): '4-6' | '7-10' | '11-13' | '14+' | 'unknown' {
  const n = typeof age === 'string' ? Number.parseInt(age, 10) : age
  if (!n || Number.isNaN(n)) return 'unknown'
  if (n <= 6) return '4-6'
  if (n <= 10) return '7-10'
  if (n <= 13) return '11-13'
  return '14+'
}
