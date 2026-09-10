import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://clubdeportivotrochayruta.org',

  integrations: [
    react(),
    sitemap({
      // Páginas que existen pero no son públicas: `/enlaces` es el linktree del
      // QR (no es una sección del sitio) y `/equipo` está construida pero sin
      // publicar mientras el club no tenga firmadas las autorizaciones de
      // imagen. Ambas llevan además `noindex`.
      filter: (page) => !page.includes('/enlaces') && !page.includes('/equipo'),
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
    layout: 'constrained',
    responsiveStyles: true,
  },

  env: {
    schema: {
      PUBLIC_WEB3FORMS_KEY: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      PUBLIC_GA4_MEASUREMENT_ID: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
      PUBLIC_CLOUDINARY_CLOUD_NAME: envField.string({
        context: 'client',
        access: 'public',
        optional: true,
      }),
    },
  },

  output: 'static',
});
