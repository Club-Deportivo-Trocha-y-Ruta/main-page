import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@components': resolve(__dirname, 'src/components'),
      '@layouts': resolve(__dirname, 'src/layouts'),
      '@lib': resolve(__dirname, 'src/lib'),
      '@assets': resolve(__dirname, 'src/assets'),
      '@types': resolve(__dirname, 'src/types'),
      // Stub del virtual module astro:env/client — no disponible en Vite puro (jsdom)
      'astro:env/client': resolve(__dirname, 'src/test/__mocks__/astro-env-client.ts'),
    },
  },
  test: {
    name: 'react',
    environment: 'jsdom',
    include: ['src/**/*.react.test.tsx'],
    setupFiles: ['./src/test/setup-react.ts'],
    globals: true,
  },
});
