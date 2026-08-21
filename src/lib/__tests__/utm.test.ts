import { describe, it, expect } from 'vitest';
import { withUtm, shareUrl, SHARE_CAMPAIGN, SHARE_SOURCES } from '../utm';

const PAGE = 'https://clubdeportivotrochayruta.org/noticias/2026-06-departamental-ginebra/';

describe('withUtm', () => {
  it('añade source y medium, con "social" por defecto', () => {
    const result = new URL(withUtm(PAGE, { source: 'whatsapp' }));
    expect(result.searchParams.get('utm_source')).toBe('whatsapp');
    expect(result.searchParams.get('utm_medium')).toBe('social');
  });

  it('añade campaign y content cuando se indican', () => {
    const result = new URL(
      withUtm(PAGE, { source: 'instagram', campaign: 'openday-septiembre', content: 'story-1' })
    );
    expect(result.searchParams.get('utm_campaign')).toBe('openday-septiembre');
    expect(result.searchParams.get('utm_content')).toBe('story-1');
  });

  it('omite campaign y content si no se pasan', () => {
    const result = new URL(withUtm(PAGE, { source: 'facebook' }));
    expect(result.searchParams.has('utm_campaign')).toBe(false);
    expect(result.searchParams.has('utm_content')).toBe(false);
  });

  it('permite sobrescribir el medium', () => {
    const result = new URL(withUtm(PAGE, { source: 'boletin', medium: 'email' }));
    expect(result.searchParams.get('utm_medium')).toBe('email');
  });

  it('conserva la query que ya tuviera la URL', () => {
    const result = new URL(withUtm(`${PAGE}?pagina=2`, { source: 'whatsapp' }));
    expect(result.searchParams.get('pagina')).toBe('2');
    expect(result.searchParams.get('utm_source')).toBe('whatsapp');
  });

  it('conserva el fragmento', () => {
    expect(withUtm(`${PAGE}#galeria`, { source: 'whatsapp' })).toContain('#galeria');
  });

  it('es idempotente: aplicarla dos veces no duplica parámetros', () => {
    const once = withUtm(PAGE, { source: 'whatsapp', campaign: 'a' });
    const twice = withUtm(once, { source: 'whatsapp', campaign: 'a' });
    expect(twice).toBe(once);
    expect(twice.match(/utm_source/g)).toHaveLength(1);
  });

  it('sobrescribe un UTM previo en vez de acumularlo', () => {
    const first = withUtm(PAGE, { source: 'facebook' });
    const result = new URL(withUtm(first, { source: 'whatsapp' }));
    expect(result.searchParams.getAll('utm_source')).toEqual(['whatsapp']);
  });

  it('admite rutas relativas y las devuelve relativas', () => {
    const result = withUtm('/inscripciones', { source: 'instagram' });
    expect(result.startsWith('/inscripciones?')).toBe(true);
    expect(result).toContain('utm_source=instagram');
  });

  it('devuelve la URL intacta si source viene vacío', () => {
    expect(withUtm(PAGE, { source: '' })).toBe(PAGE);
  });

  it('devuelve la URL intacta si no es parseable', () => {
    expect(withUtm('http://', { source: 'whatsapp' })).toBe('http://');
  });
});

describe('shareUrl', () => {
  it('etiqueta cada canal con su source y la campaña de compartir', () => {
    for (const channel of Object.keys(SHARE_SOURCES) as (keyof typeof SHARE_SOURCES)[]) {
      const result = new URL(shareUrl(PAGE, channel));
      expect(result.searchParams.get('utm_source')).toBe(SHARE_SOURCES[channel]);
      expect(result.searchParams.get('utm_campaign')).toBe(SHARE_CAMPAIGN);
    }
  });

  it('usa medium "social" para que GA4 lo agrupe en Organic Social', () => {
    const result = new URL(shareUrl(PAGE, 'whatsapp'));
    expect(result.searchParams.get('utm_medium')).toBe('social');
  });

  it('distingue el compartir del sitio de las publicaciones del club', () => {
    expect(SHARE_CAMPAIGN).toBe('compartir-desde-web');
  });
});
