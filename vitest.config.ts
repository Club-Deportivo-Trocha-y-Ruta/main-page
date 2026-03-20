import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Entorno Node.js puro para tests de utilidades TypeScript.
    // No se necesita jsdom porque las funciones en utils.ts no manipulan el DOM.
    environment: 'node',

    // Directorio de tests: solo archivos dentro de src/ con extensión .test.ts
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],

    // Excluir archivos de configuración y dependencias
    exclude: ['node_modules/**', 'dist/**', '.astro/**'],

    // Reportes: verbose en local para ver cada test; en CI GitHub Actions
    // detecta automáticamente el reporter apropiado.
    reporters: process.env.CI ? ['verbose', 'github-actions'] : ['verbose'],

    // Cobertura opcional (activar con: npm run test -- --coverage)
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/__tests__/**'],
      reporter: ['text', 'lcov'],
    },
  },
});
