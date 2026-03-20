# 05 - Plan de Unit Testing para Trocha y Ruta

> Investigación y plan de trabajo por fases para implementar unit testing en el proyecto Astro 5 con React Islands.

## 1. Resumen Ejecutivo

Este documento define la estrategia de unit testing para el sitio del Club Deportivo Trocha y Ruta. El stack de testing se basa en **Vitest** (nativo de Vite), el **Container API** de Astro para componentes `.astro`, y **React Testing Library** para los 5 islands interactivos. Se incluye validación de Content Collections, testing de accesibilidad con `vitest-axe`, y mocking de APIs externas (Web3Forms).

---

## 2. Hallazgos de la Investigación

### 2.1 Vitest en Astro 5

- Astro recomienda oficialmente Vitest como framework de testing.
- Se debe usar `getViteConfig()` de `astro/config` en lugar de `defineConfig()` de Vite para resolver correctamente path aliases y módulos virtuales de Astro.
- Para proyectos con Astro + React, se necesitan **Vitest Workspaces** con dos configuraciones separadas:
  - `vitest.astro.config.ts`: entorno `node` para Container API.
  - `vitest.react.config.ts`: entorno `jsdom` para React Testing Library.
- **Gotcha crítico**: Usar `jsdom`/`happy-dom` con el Container API causa el error `"new TextEncoder().encode('') instanceof Uint8Array" is incorrectly false`. Siempre usar `environment: 'node'` para tests de componentes Astro.

### 2.2 Container API para Componentes Astro

- API experimental (`experimental_AstroContainer`) disponible desde Astro 4.9.
- Renderiza componentes `.astro` a strings HTML en Node.js.
- Soporta props, slots (default y named), y renderers de frameworks (React).
- Para componentes que embeben React islands, se necesita cargar el renderer de `@astrojs/react`.
- Template oficial de referencia: `container-with-vitest`.

### 2.3 React Islands con React Testing Library

- Los 5 componentes interactivos (`MobileMenu`, `ContactForm`, `InscriptionForm`, `ImageLightbox`, `Carousel`) se testean en aislamiento con `@testing-library/react`.
- Las directivas de hidratación (`client:load`, `client:visible`) son comportamiento del runtime de Astro — no se pueden testear en unit tests. Se validan con E2E (Playwright).
- Se requiere `@vitejs/plugin-react` para el workspace de React.

### 2.4 Content Collections y Zod Schemas

- Las APIs de Content Collections de Astro **no funcionan dentro de Vitest** (issue #7051).
- Solución: extraer schemas Zod a archivos separados (`src/lib/schemas.ts`) y testearlos independientemente.
- Se pueden validar archivos de contenido reales usando `fast-glob` + `gray-matter` + `describe.each`.
- **Evitar** importar `ImageFunction` de Astro en archivos de schema accesibles por tests (issue #10822).

### 2.5 Testing de APIs Externas (Web3Forms)

- **Opción A**: Mock de `fetch` con `vi.fn()` — simple, bueno para unit tests.
- **Opción B**: Mock Service Worker (MSW) — más realista, intercepta a nivel de red. Recomendado oficialmente por Vitest.
- Ambas opciones son viables; MSW es preferible para tests de integración más completos.

### 2.6 Accesibilidad

- `vitest-axe` (fork de jest-axe para Vitest) usa axe-core de Deque.
- Funciona tanto con HTML del Container API como con `render()` de React Testing Library.
- **No funciona con happy-dom** — usar `jsdom`.
- Cubre ~30-40% de barreras de accesibilidad. Complementar con Lighthouse y Playwright axe-core para el target WCAG 2.1 AA.

### 2.7 Cobertura Recomendada para SSG

| Capa | Threshold | Justificación |
|------|-----------|---------------|
| `src/lib/**` (utilidades) | 90%+ | Lógica pura, fácil de testear, alto valor |
| `src/components/interactive/**` | 80%+ | Lógica de UI con validación |
| Zod schemas | 85%+ | Integridad de datos |
| Componentes `.astro` / layouts / pages | Excluir o 50-60% | Templates declarativos, mejor validados con E2E |
| **Global** | **70%** | Baseline realista para SSG |

---

## 3. Dependencias Requeridas

```json
{
  "devDependencies": {
    "vitest": "^3.x",
    "@vitest/coverage-v8": "^3.x",
    "@testing-library/react": "^16.x",
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/dom": "^10.x",
    "@testing-library/user-event": "^14.x",
    "@vitejs/plugin-react": "^4.x",
    "jsdom": "^25.x",
    "vitest-axe": "^1.x",
    "msw": "^2.x",
    "fast-glob": "^3.x",
    "gray-matter": "^4.x"
  }
}
```

---

## 4. Arquitectura de Configuración

### 4.1 Workspace Principal

```
vitest.workspace.ts          # Define los dos proyectos
vitest.astro.config.ts       # Astro Container API (node)
vitest.react.config.ts       # React Testing Library (jsdom)
src/test/setup-astro.ts      # Setup para tests Astro
src/test/setup-react.ts      # Setup para tests React (jest-dom, vitest-axe, cleanup)
```

### 4.2 `vitest.workspace.ts`

```ts
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'vitest.astro.config.ts',
  'vitest.react.config.ts',
]);
```

### 4.3 `vitest.astro.config.ts`

```ts
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
    },
  },
});
```

### 4.4 `vitest.react.config.ts`

```ts
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
```

### 4.5 npm Scripts

```json
{
  "test": "vitest",
  "test:run": "vitest run",
  "test:astro": "vitest --project astro",
  "test:react": "vitest --project react",
  "test:coverage": "vitest run --coverage"
}
```

### 4.6 Convención de Nombres de Archivos

| Tipo de test | Patrón | Ejemplo |
|-------------|--------|---------|
| Componente Astro | `*.astro.test.ts` | `Card.astro.test.ts` |
| Componente React | `*.react.test.tsx` | `ContactForm.react.test.tsx` |
| Utilidad/schema | `*.test.ts` | `utils.test.ts`, `schemas.test.ts` |

Los tests de utilidades corren en ambos workspaces con `environment: 'node'`. Para evitar duplicación, incluirlos solo en el workspace de Astro (que ya usa `node`).

---

## 5. Plan de Trabajo por Fases

### Fase 1: Infraestructura de Testing

**Objetivo**: Configurar Vitest con workspaces, setup files, y scripts npm.

**Tareas**:

1. Instalar todas las dependencias de desarrollo listadas en la sección 3
2. Crear `vitest.workspace.ts` con los dos proyectos
3. Crear `vitest.astro.config.ts` con `getViteConfig()`
4. Crear `vitest.react.config.ts` con `@vitejs/plugin-react` y jsdom
5. Crear `src/test/setup-astro.ts` (configuración mínima)
6. Crear `src/test/setup-react.ts` (jest-dom, vitest-axe, cleanup afterEach)
7. Agregar scripts de test a `package.json`
8. Verificar que `vitest run` ejecuta sin errores (0 tests found es OK)
9. Agregar coverage thresholds según la sección 2.7

**Dependencias**: Ninguna. Puede ejecutarse en paralelo con desarrollo de componentes.

**Criterio de aceptación**: `npm test` ejecuta sin errores y reconoce ambos workspaces.

---

### Fase 2: Tests de Utilidades y Schemas Zod

**Objetivo**: Testear la capa de lógica pura — schemas, helpers, validadores.

**Tareas**:

1. Extraer schemas Zod compartidos a `src/lib/schemas.ts` (si aún están en `src/content/config.ts`)
2. Escribir tests para cada schema de colección:
   - `riders`, `events`, `news`, `programs`, `results`
   - `seoSchema`, `socialMediaSchema` (schemas reutilizables)
   - Casos válidos, inválidos, y edge cases (slugs con acentos, fechas inválidas, enums incorrectos)
3. Escribir tests para utilidades en `src/lib/`:
   - Slugify (remoción de acentos, kebab-case)
   - Formateo de fechas
   - Filtrado de contenido (draft, status)
   - Construcción de URLs
4. Implementar validación de archivos de contenido reales con `fast-glob` + `gray-matter`:
   - Iterar todos los `.md` en `src/content/` y validar frontmatter contra schemas

**Dependencias**: Fase 1 (infraestructura).

**Criterio de aceptación**: Coverage de `src/lib/**` >= 90%. Todos los schemas tienen tests de casos válidos e inválidos.

---

### Fase 3: Tests de Componentes Astro (Container API)

**Objetivo**: Testear componentes `.astro` verificando HTML renderizado.

**Tareas**:

1. Escribir tests para componentes UI base:
   - `Card`, `Button`, `Badge`, etc. — verificar props, slots, clases CSS
2. Escribir tests para componentes de SEO:
   - Meta tags, JSON-LD, Open Graph — verificar que el HTML contiene los tags correctos
3. Escribir tests para componentes de layout parciales:
   - Header, Footer, Navigation — verificar estructura HTML y links
4. Tests de accesibilidad con `vitest-axe`:
   - Cada componente Astro testeado debe pasar `toHaveNoViolations()`
5. Para componentes que embeben React islands:
   - Cargar `getContainerRenderer()` de `@astrojs/react`
   - Verificar que el HTML contiene `<astro-island>` con las props correctas

**Dependencias**: Fase 1. Parcialmente Fase 2 (si componentes usan utilidades).

**Criterio de aceptación**: Componentes clave renderizados sin errores. 0 violaciones de axe-core.

---

### Fase 4: Tests de React Islands

**Objetivo**: Testear los 5 componentes interactivos en aislamiento.

**Tareas**:

1. **MobileMenu.tsx** (`client:load`):
   - Toggle de visibilidad del menú
   - Cierre con Escape / click fuera
   - Navegación por teclado
   - Focus trap (accesibilidad)

2. **ContactForm.tsx** (`client:visible`):
   - Renderizado de todos los campos
   - Validación de campos requeridos (react-hook-form + zod)
   - Validación de formato de email
   - Submit exitoso (mock de fetch/MSW para Web3Forms)
   - Manejo de errores (429, network error)
   - Estado de loading durante submit

3. **InscriptionForm.tsx** (`client:visible`):
   - Navegación entre los 4 pasos
   - Validación por paso
   - Persistencia de datos entre pasos
   - Submit final del formulario completo

4. **ImageLightbox.tsx** (`client:visible`):
   - Apertura/cierre del lightbox
   - Navegación entre imágenes
   - Cierre con Escape
   - Accesibilidad (aria-modal, focus management)

5. **Carousel.tsx** (`client:visible`):
   - Renderizado de slides
   - Navegación (next/prev)
   - Auto-play (si aplica)

6. Tests de accesibilidad (`vitest-axe`) para cada componente React

**Dependencias**: Fase 1. Independiente de Fases 2-3.

**Criterio de aceptación**: Coverage de `src/components/interactive/**` >= 80%. 0 violaciones de axe-core. Formularios validados en happy path y error paths.

---

### Fase 5: Integración y CI

**Objetivo**: Integrar testing en el flujo de desarrollo y CI/CD.

**Tareas**:

1. Configurar coverage thresholds estrictos en vitest.config:
   - Global: 70%
   - `src/lib/**`: 90%
   - `src/components/interactive/**`: 80%
2. Agregar `npm run test:run` al pipeline de CI (GitHub Actions)
3. Agregar reporte de coverage como artefacto de CI
4. Configurar MSW para tests de integración de formularios (si no se hizo en Fase 4)
5. Documentar convenciones de testing en este archivo o en CLAUDE.md

**Dependencias**: Fases 1-4.

**Criterio de aceptación**: CI ejecuta tests en cada PR. Coverage thresholds se cumplen. Build no pasa si tests fallan.

---

## 6. Estrategia de Testing por Capas

| Capa | Herramienta | Qué testear | Fase |
|------|-------------|-------------|------|
| Unit (lógica) | Vitest | Utilidades, schemas Zod, validación, transformadores | 2 |
| Component (Astro) | Vitest + Container API | HTML renderizado, props, slots, SEO meta tags | 3 |
| Component (React) | Vitest + RTL | Comportamiento interactivo, formularios, estado, a11y | 4 |
| Content validation | Vitest + fast-glob + gray-matter | Frontmatter válido, slugs, campos requeridos | 2 |
| Accesibilidad | vitest-axe (unit) | WCAG 2.1 AA en componentes individuales | 3, 4 |
| Build verification | `astro check` + `astro build` | TypeScript, referencias rotas, assets | CI |
| E2E | Playwright (futuro) | Navegación, hidratación, formularios end-to-end, responsive | Fuera de alcance |

---

## 7. Archivos de Referencia

| Recurso | URL |
|---------|-----|
| Astro Testing Docs | https://docs.astro.build/en/guides/testing/ |
| Container API Reference | https://docs.astro.build/en/reference/container-reference/ |
| Vitest Workspace para Astro+React | https://raphberube.com/technotes/vitest-setup-astro-react/ |
| Astro+React+Vitest Config | https://dreamdevourer.com/astro-react-vitest-the-config-that-actually-works-after-ai-failed-me/ |
| Content Collections en Vitest (issue) | https://github.com/withastro/astro/issues/7051 |
| vitest-axe | https://github.com/chaance/vitest-axe |
| MSW (Mock Service Worker) | https://mswjs.io/ |
| container-with-vitest Example | https://github.com/withastro/astro/tree/main/examples/container-with-vitest |
