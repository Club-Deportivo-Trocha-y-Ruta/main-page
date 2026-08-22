---
name: tailwind4-theme-treeshaking
description: Tailwind 4's @theme custom properties in novel namespaces get tree-shaken from the production bundle until actually referenced by a scanned candidate — relevant when adding new design tokens ahead of the components that consume them.
metadata:
  type: project
---

Tailwind CSS 4.3.3 (this project's version) only keeps `@theme` custom properties in
the final compiled `:root`/`:host` block when its content scanner finds some textual
evidence the key is "used" somewhere in the scanned project files. Core namespaces
that already have broad usage across the site (`--color-*`, `--font-*`, `--radius-*`,
`--shadow-*`) always survive because *something* in that namespace is used everywhere.
But a brand-new namespace with zero real usage yet (e.g. `--duration-*`, added for
[[motion-tokens-plan]] Task 1 before any component references it) gets dropped from
`dist/_astro/*.css` even though it's syntactically valid and present in source —
confirmed via a clean rebuild (`rm -r dist`, `rm -r node_modules/.vite`) and via
Tailwind's own `compile()` API in isolation, so it is not a caching artifact.

Gotcha discovered while diagnosing this: Tailwind's automatic content detection also
scans `docs/**/*.md` (not just `.astro`/`.tsx`/`.ts`), so a token literally spelled out
in a doc file (e.g. `docs/06-plan-animaciones.md` mentioning `` `--duration-micro/celebration` ``)
can accidentally "survive" tree-shaking via that textual coincidence, while a
structurally identical, equally-unused token whose exact name never appears anywhere
in scanned text (`--duration-celebration`, only written as the abbreviated
`duration-micro/celebration` in the doc) gets pruned. This is not a bug in the CSS or a
sign the token was written wrong — it is expected, harmless, and self-corrects the
moment a real component references the token (`var(--duration-celebration)` in
component CSS/inline style, or an actual Tailwind utility class for namespaces that
generate one, like `ease-spring`/`ease-pop` which — unlike `duration-*` — are real
functional Tailwind utilities backed by the `--ease-*` theme scale).

**Why:** wasted significant budget diagnosing this as a suspected Lightning CSS /
Tailwind parser bug for `linear()` easing values during Fase 1 Tarea 1 of the motion
plan, before isolating the real cause via Tailwind's `compile()` API and a `docs/`
grep.

Confirmed resolved for the `--duration-*` tokens on 2026-08-22 (Fase 2 Tarea 4): once
`InscriptionForm.tsx` used `duration-[var(--duration-celebration)]` and global.css used
`var(--duration-micro)` in a hand-written rule, both keys reappear in the compiled
`:root` (verified with Tailwind's `compile()` on the real `global.css`). Note `duration-*`
is **not** a theme-backed namespace in Tailwind 4 — `duration-celebration` is not a real
utility; the arbitrary-value form `duration-[var(--duration-celebration)]` is the way to
consume those tokens (and is what marks them used). `--ease-*` is theme-backed, so
`ease-pop`/`ease-spring` work as plain utilities.

**How to apply:** when adding new `@theme` tokens in a namespace with no existing
usage (ahead of the components that will consume them, as this project's animation
plan does deliberately phase-by-phase), don't be alarmed if `grep`-ing the production
`dist/_astro/*.css` doesn't show the new token yet — check `npm run build:only` exits
0 (Lightning CSS accepted the syntax) as the real signal, not bundle presence. It will
appear automatically once a later task wires up real usage. Don't rename tokens just
to "trick" the scanner into keeping them; that treats a non-problem as a problem.
