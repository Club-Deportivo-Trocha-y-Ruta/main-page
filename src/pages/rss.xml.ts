import rss from '@astrojs/rss';
import { getCollection, type CollectionEntry } from 'astro:content';
import { SITE } from '../lib/constants';
import type { APIContext } from 'astro';

type NewsEntry = CollectionEntry<'news'>;
type EventEntry = CollectionEntry<'events'>;

export async function GET(context: APIContext) {
  const news = await getCollection('news');
  const events = await getCollection('events');

  const newsItems = news
    .filter((n: NewsEntry) => !n.data.draft)
    .sort((a: NewsEntry, b: NewsEntry) => b.data.date.getTime() - a.data.date.getTime())
    .map((n: NewsEntry) => ({
      title: n.data.title,
      pubDate: n.data.date,
      description: n.data.excerpt,
      link: `/noticias/${n.id}/`,
      categories: [n.data.category, ...(n.data.tags ?? [])],
      ...(n.data.image
        ? {
            customData: `<enclosure url="${n.data.image.startsWith('http') ? n.data.image : `${SITE.url}${n.data.image}`}" type="image/jpeg" length="0"/>`,
          }
        : {}),
    }));

  const eventItems = events
    .filter((e: EventEntry) => !e.data.draft)
    .sort((a: EventEntry, b: EventEntry) => b.data.date.getTime() - a.data.date.getTime())
    .slice(0, 10)
    .map((e: EventEntry) => ({
      title: `[Evento] ${e.data.title}`,
      pubDate: e.data.date,
      description: `${e.data.title} - ${e.data.location}. Categoría: ${e.data.category}`,
      link: `/calendario/`,
      categories: ['evento', e.data.category],
    }));

  const allItems = [...newsItems, ...eventItems].sort(
    (a, b) => (b.pubDate?.getTime() ?? 0) - (a.pubDate?.getTime() ?? 0)
  );

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: allItems,
    customData: [
      `<language>es-CO</language>`,
      `<managingEditor>${SITE.name}</managingEditor>`,
      `<webMaster>${SITE.name}</webMaster>`,
      `<image>`,
      `  <url>${SITE.url}/images/logo.png</url>`,
      `  <title>${SITE.name}</title>`,
      `  <link>${SITE.url}</link>`,
      `</image>`,
    ].join('\n'),
    stylesheet: '/rss/styles.xsl',
  });
}
