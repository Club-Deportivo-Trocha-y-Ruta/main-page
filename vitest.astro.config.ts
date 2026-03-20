import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    name: 'astro',
    environment: 'node',
    include: ['src/**/*.astro.test.ts'],
    setupFiles: ['./src/test/setup-astro.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/lib/**', 'src/components/interactive/**'],
      exclude: [
        'src/content/**',
        'src/pages/**',
        'src/layouts/**',
        '**/*.astro',
        '**/*.d.ts',
        'src/test/**',
      ],
      thresholds: {
        lines: 70,
        functions: 75,
        branches: 70,
        statements: 70,
      },
    },
  },
});
