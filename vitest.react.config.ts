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
