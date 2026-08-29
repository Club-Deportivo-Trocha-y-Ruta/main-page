import type { AnalyticsConsentStatus, AnalyticsEvent, AnalyticsProvider } from '../../analytics'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

interface GA4Options {
  measurementId: string
}

export class GA4Provider implements AnalyticsProvider {
  readonly id = 'ga4' as const
  private readonly measurementId: string

  constructor(opts: GA4Options) {
    this.measurementId = opts.measurementId
  }

  init(): void {
    // gtag.js se carga en <Analytics.astro>, en el hilo principal con `async`
    // (no en Partytown). Este provider solo despacha eventos contra el gtag ya cargado.
  }

  trackPageview(path: string, title?: string): void {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
    window.gtag('event', 'page_view', {
      page_path: path,
      page_title: title,
      send_to: this.measurementId,
    })
  }

  trackEvent(event: AnalyticsEvent): void {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
    window.gtag('event', event.name, event.params ?? {})
  }

  setConsent(status: AnalyticsConsentStatus): void {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
    window.gtag('consent', 'update', { analytics_storage: status })
  }
}
