import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    name: 'astro',
    environment: 'node',
    include: ['src/**/*.astro.test.ts', 'src/**/*.test.ts'],
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
        // Threshold global — baseline para todo el código bajo cobertura
        lines: 70,
        functions: 75,
        branches: 70,
        statements: 70,
        // Threshold por directorio — lógica pura de utilidades
        'src/lib/**': {
          lines: 90,
          functions: 90,
          branches: 75,
          statements: 90,
        },
        // Threshold por directorio — componentes React interactivos
        'src/components/interactive/**': {
          lines: 80,
          functions: 80,
          branches: 70,
          statements: 80,
        },
      },
    },
  },
});
