import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    name: 'react',
    environment: 'jsdom',
    include: ['src/**/*.react.test.tsx'],
    setupFiles: ['./src/test/setup-react.ts'],
    globals: true,
  },
});
