// Setup del proyecto "astro" de Vitest (vitest.astro.config.ts → setupFiles).
//
// Los tests de este proyecto corren en Node sin `globals: true`: importan
// `describe`/`it`/`expect` directamente desde 'vitest' y no usan matchers
// extendidos (jest-dom y vitest-axe solo aplican al proyecto "react").
// Por eso hoy no hay nada que registrar aquí; el archivo se mantiene como
// punto de enganche para setup futuro (mocks globales, hooks compartidos).
export {};
