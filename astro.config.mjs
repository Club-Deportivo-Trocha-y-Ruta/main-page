import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import icon from 'astro-icon';

export default defineConfig({
  site: 'https://clubdeportivotrochayruta.org',

  integrations: [
    react(),
    sitemap(),
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
