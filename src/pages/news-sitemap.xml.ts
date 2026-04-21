import type { APIContext } from 'astro';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../lib/constants';

type NewsEntry = CollectionEntry<'news'>;

export async function GET(_context: APIContext) {
  const news = await getCollection('news');
  const recentArticles = news
    .filter((n: NewsEntry) => !n.data.draft)
    .sort((a: NewsEntry, b: NewsEntry) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, 50);

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

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${urlEntries}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
