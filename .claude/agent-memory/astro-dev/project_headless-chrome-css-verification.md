---
name: headless-chrome-css-verification
description: How to empirically verify CSS that vitest/jsdom can't test (scroll-driven animations, SVG stroke/clip geometry, reduced motion) using the installed Google Chrome in headless mode plus sharp — including the gotcha that --screenshot ignores document scroll.
metadata:
  type: project
---

This repo has **no** playwright/puppeteer, but `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`
is installed and `sharp` is in `node_modules` — together they're enough to measure
real rendering behavior when jsdom can't (jsdom has no layout, no SVG geometry, no
`animation-timeline`). Used to settle [[motion-tokens-plan]] Fase 4 Tarea 10.

**The scroll gotcha that wastes an hour:** `--headless=new --screenshot=out.png` always
captures the page at document scroll 0. `window.scrollTo()` *does* run (confirmed via
`--dump-dom`) and `location.hash` scrolling works too, but the capture happens from the
top of the document regardless. Workaround: put the test content inside an inner
`<div style="width:W;height:H;overflow:auto">` scroll container and set its `scrollTop`
from an inline script. Scroll-driven timelines resolve against that container, so the
test is still faithful — and the screenshot shows the scrolled state.

Two harness shapes, both worth reusing:

1. **Screenshot + pixel analysis** (`sharp(...).raw().toBuffer({resolveWithObject:true})`,
   then walk `data[i] < 128` per region). Lay the scenarios out *side by side at the same
   y* so one capture shows them all at the same scroll progress; keep a `regions.json`
   manifest of `{id,x,y,w,h}` so the analyzer maps pixels back to scenarios. Good for
   "is this stroke actually complete / where does it stop".
2. **`--dump-dom` + `getComputedStyle`** (double `requestAnimationFrame`, write the values
   into a `<pre>`, then `grep -o 'RESULT (\{.*?\})</pre>'`). Far more precise than pixels:
   `getComputedStyle(el).transform` *does* reflect the current value of a scroll-driven
   animation, and `el.getAnimations()[0].timeline.currentTime` prints the view-timeline
   progress as a percentage — which is how you tell "frozen timeline" from "working".
   Use a non-greedy regex; a greedy `RESULT {.*}` swallows trailing markup and fails to
   parse.

**Capturing the *bottom* of a real page (footer, last section):** two traps.
`file://` renders the page unstyled — Astro links CSS as `/_astro/*.css`, which resolves
to the filesystem root — so serve `dist/` first (`python3 -m http.server` from inside
`dist/`). And a giant `--window-size=1280,14000` does *not* give you a faithful full-page
shot: `<main>` is `flex-1` inside a `min-h-screen` body, so it stretches to fill the tall
viewport and the footer ends up floating far below the section that should precede it.
Working shape: a throwaway `dist/__probe.html` (same origin) with
`<iframe src="/…" width=1280 height=900>` plus an `onload` script that calls
`f.contentWindow.scrollTo(0, doc.documentElement.scrollHeight)` (repeat once in a
`setTimeout`); screenshot the outer page at 1280×900. Delete the probe afterwards.

Other flags that mattered: `--force-prefers-reduced-motion` (proves the reduced-motion
fallback renders the final state), `--force-device-scale-factor=1` (so pixel coordinates
match CSS px), `--hide-scrollbars`, `--virtual-time-budget=3000`, `--disable-gpu`. The
`CVDisplayLinkCreateWithCGDisplay failed` noise on macOS is harmless; send stderr to
/dev/null.

**Feeding it the project's real CSS and markup** (don't hand-write approximations):
- CSS: `compile()` from `node_modules/tailwindcss/dist/lib.mjs` on `src/styles/global.css`
  (needs `loadStylesheet` pointing `tailwindcss` at `node_modules/tailwindcss/index.css`
  **and** a real `loadModule` for `@plugin '@tailwindcss/typography'`, otherwise it throws
  `TypeError: k is not a function`), then `compiler.build([...candidates])` — pass the class
  names scraped from the rendered HTML or the utilities are missing and the layout is wrong.
  Pipe through `lightningcss`'s `transform({minify:true, targets: browserslistToTargets(...)})`
  to see exactly what ships (this is also how you check Lightning CSS didn't collapse
  `animation-*` longhands into the shorthand).
- Markup: a throwaway `*.astro.test.ts` under `src/**/__tests__/` that renders the component
  or page with `experimental_AstroContainer` and `writeFileSync`s the HTML to the scratchpad,
  run with `npx vitest run --project astro <file>`, then delete it. Whole pages need
  `renderers: await loadRenderers([getContainerRenderer()])` from `@astrojs/react`.
