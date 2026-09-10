import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    name: 'astro',
    environment: 'node',
    include: ['src/**/*.astro.test.ts', 'src/**/*.test.ts'],
    setupFiles: ['./src/test/setup-astro.ts'],
  },
});
