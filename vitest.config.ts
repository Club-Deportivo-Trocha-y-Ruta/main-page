import { defineConfig } from 'vitest/config';

/**
 * Config raíz: define los dos proyectos y la cobertura.
 *
 * El bloque `coverage` tiene que vivir AQUÍ y no en `vitest.astro.config.ts`.
 * Vitest solo lee `coverage` del config raíz: dentro de un project config se
 * ignora en silencio, sin aviso. Mientras estuvo allí, `include`/`exclude` no
 * se aplicaban (la tabla medía hasta `.astro` y `.webp`) y los thresholds no
 * bloqueaban nada —subirlos a un valor imposible seguía saliendo con exit 0—,
 * así que las garantías que documenta CLAUDE.md eran decorativas.
 */
export default defineConfig({
  test: {
    projects: ['vitest.astro.config.ts', 'vitest.react.config.ts'],
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
        '**/__tests__/**',
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
