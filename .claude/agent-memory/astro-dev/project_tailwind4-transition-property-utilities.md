---
name: tailwind4-transition-property-utilities
description: Tailwind CSS 4.3.3 quirks that matter for this project's motion plan — custom `--duration-*` tokens don't auto-generate `duration-*` utilities, stacking two `transition-*` property utilities on one element silently drops one, and how `starting:`/`transition-discrete`/`scale-*` actually compile.
metadata:
  type: project
---

Two Tailwind CSS v4.3.3 (this project's pinned version, see `node_modules/tailwindcss/dist/lib.js`) behaviors discovered while building the pressable button
(Fase 1 Tarea 2 of [[motion-tokens-plan]]), both verified directly via Tailwind's own
`compile()` API against this repo's `node_modules/tailwindcss/index.css` rather than
guessed from docs:

1. **`--duration-*` is not a real theme namespace for the `duration-*` utility.**
   Unlike `--color-*` → `bg-*`/`text-*`, `--radius-*` → `rounded-*`, `--shadow-*` →
   `shadow-*`, or `--ease-*` → `ease-*` (all confirmed via `valueThemeKeys`/`themeKeys`
   in Tailwind's source), the `duration-*` utility is keyed off `--transition-duration`
   with a hardcoded numeric scale (`75/100/150/200/300/500/700/1000`). So this
   project's `--duration-micro: 200ms` / `--duration-celebration: 500ms` tokens (named
   that way on purpose, see [[motion-tokens-plan]] Tarea 1) will **never** produce a
   `duration-micro` / `duration-celebration` utility class no matter how much content
   scanning happens — that class would just be silently unmatched (a no-op, not an
   error). The correct way to consume them as Tailwind utilities is the arbitrary-value
   form: `duration-[var(--duration-micro)]`. Confirmed working in the compiled output
   (`--tw-duration: var(--duration-micro); transition-duration: var(--duration-micro);`).
   `ease-spring`/`ease-pop`, by contrast, work as plain bare utilities since `--ease-*`
   *is* a real theme namespace.

2. **Two Tailwind utilities that both set `transition-property` do not merge — the
   later one in Tailwind's internal utility ordering wins outright**, regardless of the
   order the classes appear in the `class` string. E.g. `transition-colors
   transition-transform` on the same element does not transition colors *and*
   transform; `transition-transform` is always emitted after `transition-colors` in
   Tailwind's generated stylesheet (verified by compiling both orderings — output order
   didn't change), so only `transform, translate, scale, rotate` ends up transitioning
   and the color transition is silently dropped. If multiple property groups genuinely
   need to transition together, use one combined arbitrary value,
   e.g. `transition-[color,background-color,border-color,transform]`, not two stacked
   `transition-*` utilities. Also useful: Tailwind's `translate-y-*`/`-translate-y-*`
   utilities animate the CSS `translate` property (not `transform`), but
   `transition-transform` explicitly includes `translate` in its property list, so it's
   the right utility to reach for when animating `translate-y-*`.

**Why:** wasted a real risk of shipping either a no-op duration class or a silently
broken hover-color transition on `Button.astro` without this — both failure modes are
invisible in a visual smoke test at 200ms and wouldn't show up in
`Button.astro.test.ts` (which only asserts class *names* are present, not the resulting
`transition-property` computed value).

**How to apply:** whenever a later phase of the motion plan (Fase 2 Tareas 5/6 shake +
confetti, Fase 3 dialogs, Fase 4 count-up) reaches for `var(--duration-micro)` or
`var(--duration-celebration)` inside a Tailwind `class` list (as opposed to raw CSS/an
island's inline style, where `var(--duration-micro)` just works directly), use the
`duration-[var(--duration-micro)]` arbitrary-value form. And before stacking more than
one `transition-*` category utility on the same element, either combine them into a
single `transition-[...]` arbitrary value or verify actual behavior with
Tailwind's `compile()` API the way this memory was derived — don't assume class order
in markup controls cascade order.

3. **`starting:` (`@starting-style`) and `transition-discrete` both compile correctly
   in this Tailwind 4.3.3 pin** — verified 2026-08-22 for [[motion-tokens-plan]] Fase 3
   Tarea 9 the same way as findings 1-2 (real `compile()` calls against this repo's
   `global.css`, not docs). `starting:opacity-0`, `starting:scale-95` emit inside a
   `@starting-style { .starting\:opacity-0 { opacity: 0%; } ... }` block;
   `transition-discrete` emits `.transition-discrete { transition-behavior:
   allow-discrete; }`. Two things worth knowing before reaching for these:
   - `scale-*`/`starting:scale-*` set the **`scale`** CSS property (`--tw-scale-x/-y/-z`
     + `scale: var(...)`), not `transform` — same modern-CSS-properties approach
     Tailwind 4 uses for `translate-*`. So a fade+scale entrance needs
     `transition-[opacity,scale]`, not `transition-[opacity,transform]`.
   - `transition-discrete` is only load-bearing for a *persisting* DOM node whose
     `display`/`[hidden]`/`<dialog open>` toggles while staying mounted. For a node
     that's conditionally rendered in JSX (`{isOpen && (...)}`, unmounted/remounted
     each open), the browser already treats it as newly-inserted and applies
     `@starting-style` without needing `allow-discrete` — confirmed by shipping working
     entrance fades on `SiteSearch`/`MobileMenu`/`ImageLightbox`'s conditionally-mounted
     overlay nodes with zero `transition-discrete` usage. Reach for it only if a future
     task toggles `display:none` on a node that stays mounted throughout (e.g. a
     `<dialog>` element using `.showModal()`/`.close()`).
   - Pairing `starting:*` with `motion-reduce:transition-none` (rather than also adding
     explicit `motion-reduce:opacity-100`/`scale-100` resets) is enough to get an
     instant, un-flashed final state under reduced motion: with no active transition,
     the starting-style value is never actually painted — the element just renders at
     its normal computed style on the very first frame.
