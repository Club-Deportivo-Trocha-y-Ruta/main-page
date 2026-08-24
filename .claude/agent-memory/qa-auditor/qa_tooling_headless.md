---
name: qa-tooling-headless
description: Qué herramientas de medición sí funcionan en este entorno (lighthouse por npx, Chrome + CDP por WebSocket nativo) y las trampas de medir CLS/INP sin ellas
metadata:
  type: reference
---

Descubierto el 2026-08-22 auditando rendimiento. Sirve para no volver a
concluir "no se puede medir" cuando sí se puede.

- **`npx lighthouse` funciona**: no está en `node_modules`, pero npx lo baja al
  vuelo (13.4.1) y hay Chrome estable en
  `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. No hay
  puppeteer ni playwright instalados y no hacen falta.
- **Chrome + CDP sin dependencias**: Node 22+ trae `WebSocket` global, así que
  se puede lanzar Chrome con `--headless=new --remote-debugging-port=N`, leer
  `http://127.0.0.1:N/json/version` con `fetch` y hablar CDP a mano. Con eso se
  mide lo que Lighthouse no cubre.

Trampas que ya costaron una medición equivocada:

1. **Lighthouse no hace scroll.** Su CLS=0 no dice nada de animaciones
   disparadas por `IntersectionObserver`, count-ups o scroll-driven. Hay que
   recorrer la página con `window.scrollTo` + un `PerformanceObserver` de
   `layout-shift`.
2. **Un `element.click()` desde JS NO marca `hadRecentInput`.** Un clic
   sintético hace que shifts que en la vida real quedarían excluidos del CLS
   aparezcan como computables (el acordeón FAQ "daba" 0.054 así). Para
   veredictos sobre CLS hay que usar `Input.dispatchMouseEvent` /
   `Input.dispatchKeyEvent` de CDP, que sí son eventos de confianza.
3. **Event Timing tiene piso de 16 ms.** `durationThreshold: 0` no reporta
   interacciones más rápidas que eso: una lista de entradas vacía significa INP
   excelente, no "no se midió". Conviene confirmar aparte que la interacción
   ocurrió (p. ej. leyendo `aria-expanded` o `location.pathname` después).
4. **Para línea base, `git worktree add ... HEAD --detach` + `cp -Rc node_modules`**
   (clonefile de APFS, ~30 s para 1.1 GB). Un *symlink* a `node_modules` rompe
   el build de Astro ("No cached compile metadata found for ClientRouter.astro"),
   porque las rutas se resuelven fuera del worktree.

Ver [[perf-budget-reality]] para lo que se midió con esto.
