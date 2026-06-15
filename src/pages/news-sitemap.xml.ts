import type { APIContext } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../lib/constants';

type NewsEntry = CollectionEntry<'news'>;

// Google News Sitemap spec:
// - Solo URLs publicadas en las últimas 48 horas (2 días)
// - Máximo 1000 entradas
// Ref: https://developers.google.com/search/docs/crawling-indexing/sitemaps/news-sitemap
//
// IMPORTANTE: el sitio es `output: 'static'`, así que este endpoint se
// evalúa en BUILD, no en cada request. Usar `Date.now()` ancla la ventana
// al reloj del build: si no se redeploya, la ventana nunca avanza, y para
// un publisher de bajo volumen el sitemap quedaría vacío casi siempre.
// Por eso anclamos la ventana a la fecha del artículo MÁS RECIENTE (dato,
// no reloj): determinista y siempre incluye la noticia más fresca tras
// cada build. Google ignora entradas de más de 30 días de todas formas.
const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000;
const MAX_ENTRIES = 1000;

export async function GET(_context: APIContext) {
  const news = await getCollection('news');

  const published = news
    .filter((n: NewsEntry) => !n.data.draft)
    .sort((a: NewsEntry, b: NewsEntry) => b.data.date.getTime() - a.data.date.getTime());

  // Ventana relativa al artículo más reciente (no a Date.now()).
  const newestDate = published[0]?.data.date.getTime() ?? 0;
  const cutoff = newestDate - NEWS_WINDOW_MS;

  const recentArticles = published
    .filter((n: NewsEntry) => n.data.date.getTime() >= cutoff)
    .slice(0, MAX_ENTRIES);

  const escapeXml = (str: string) =>
    str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');

  const urlEntries = recentArticles
    .map(
      (n: NewsEntry) => `  <url>
    <loc>${SITE.url}/noticias/${n.id}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(SITE.name)}</news:name>
        <news:language>es</news:language>
      </news:publication>
      <news:publication_date>${n.data.date.toISOString()}</news:publication_date>
      <news:title>${escapeXml(n.data.title)}</news:title>
    </news:news>
  </url>`
    )
    .join('\n');

  // Si no hay artículos en la ventana de 48h, devolver urlset vacío válido (no 404).
  const body = urlEntries.length > 0 ? `\n${urlEntries}\n` : '\n';

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${body}</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
