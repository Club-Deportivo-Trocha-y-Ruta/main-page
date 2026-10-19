import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';
import evento from './src/data/valida-yumbo-2026/evento.json' with { type: 'json' };

export default defineConfig({
  site: 'https://clubdeportivotrochayruta.org',

  integrations: [
    react(),
    sitemap({
      // Páginas que existen pero no son públicas: `/enlaces` es el linktree del
      // QR (no es una sección del sitio) y `/equipo` está construida pero sin
      // publicar mientras el club no tenga firmadas las autorizaciones de
      // imagen. Ambas llevan además `noindex`.
      //
      // La página de la VI Válida (`/copa-valle-yumbo-2026`) sigue el mismo
      // patrón que `/equipo`: se construye antes de la carrera y queda oculta
      // —`noindex` en la página y fuera del sitemap— hasta que el club pone
      // `published: true` en `src/data/valida-yumbo-2026/evento.json`. Ese
      // booleano es el único interruptor: la página lee el mismo archivo para
      // decidir su `noindex`, así que los dos lados no se pueden separar.
      filter: (page) =>
        !page.includes('/enlaces') &&
        !page.includes('/equipo') &&
        (evento.published || !page.includes(`/${evento.slug}`)),
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
      // Vista previa de `/copa-valle-yumbo-2026` con los datos de prueba de
      // `src/data/valida-yumbo-2026/preview/` (fotos servidas por
      // `npm run valida:preview`). Solo en local: CI no la define, así que un
      // build de deploy siempre lee los JSON reales.
      VALIDA_PREVIEW: envField.boolean({
        context: 'server',
        access: 'public',
        default: false,
      }),
    },
  },

  output: 'static',
});
