import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import partytown from '@astrojs/partytown';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://clubdeportivotrochayruta.org',

  integrations: [
    react(),
    sitemap({
      filter: (page) => !page.includes('/enlaces'),
    }),
    partytown({
      config: {
        forward: ['dataLayer.push', 'gtag'],
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
