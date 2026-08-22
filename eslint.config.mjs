import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      // Convención del proyecto: el prefijo `_` marca un binding declarado a
      // propósito pero no usado (firmas de API que Astro exige, capturas de
      // error que se ignoran). `ignoreRestSiblings` habilita el patrón
      // idiomático `const { omitido, ...rest } = obj` para descartar campos.
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      // Las augmentaciones de módulo (`declare module 'vitest'`) requieren
      // interfaces vacías que solo extienden otra: es la forma de inyectar
      // matchers en tipos de terceros, no un descuido.
      '@typescript-eslint/no-empty-object-type': [
        'error',
        { allowInterfaces: 'with-single-extends' },
      ],
    },
  },
  ...eslintPluginAstro.configs.recommended,
];
