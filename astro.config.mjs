import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://clubdeportivotrochayruta.org',

  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/enlaces'),
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
      i18n: {
        defaultLocale: 'es',
        locales: { es: 'es-CO' },
      },
      serialize(item) {
        const url = item.url;
        if (url === 'https://clubdeportivotrochayruta.org/') {
          item.priority = 1.0;
          item.changefreq = 'daily';
        } else if (url.includes('/inscripciones') || url.includes('/programas')) {
          item.priority = 0.9;
          item.changefreq = 'weekly';
        } else if (url.includes('/quienes-somos') || url.includes('/contacto')) {
          item.priority = 0.8;
          item.changefreq = 'monthly';
        } else if (url.includes('/noticias')) {
          item.priority = 0.7;
          item.changefreq = 'weekly';
        } else if (url.includes('/calendario')) {
          item.priority = 0.8;
          item.changefreq = 'weekly';
        }
        return item;
      },
    }),
    icon({
      include: {
        ph: ['*'],
      },
    }),
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  image: {
    domains: ['res.cloudinary.com'],
  },

  output: 'static',
});
