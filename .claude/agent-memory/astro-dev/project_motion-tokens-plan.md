---
name: motion-tokens-plan
description: Multi-session animation plan in docs/06-plan-animaciones.md (Duolingo-style micro-interactions) — Fases 1-4 (Tareas 1-12) all implemented 2026-08-22; only the gated mascot (13) and the perf/a11y gate (14) remain unchecked.
metadata:
  type: project
---

`docs/06-plan-animaciones.md` is an incremental, multi-session implementation plan for
adding spring/celebration micro-interactions to the site (no animation runtimes —
Rive/Lottie/GSAP explicitly out of scope). It's designed to be resumed task-by-task
across separate conversations, each task marked `[ ]`/`[x]` in the doc's tables, gated
by a `Depende de` column and a dependency graph.

Fase 1 Tarea 1 (motion tokens in `@theme`: `--ease-spring`, `--ease-pop` as `linear()`
curves, `--duration-micro: 200ms`, `--duration-celebration: 500ms`) was implemented
2026-08-22 in `src/styles/global.css` only — no components touched, per the task's own
scope boundary (Tarea 2 owns the physical button). See [[tailwind4-theme-treeshaking]]
for why `--duration-celebration` doesn't yet show up in the production CSS bundle
(expected — it will once a later task references it).

Fase 2 Tarea 4 (stepper de inscripción) was implemented the same day, in parallel with
Fase 1 Tarea 2 by another agent — the plan's phases really are parallelizable after
Tarea 1, including concurrent edits to `global.css` (one agent in `@theme`, another
appending at the end of the file). Convention adopted there and worth reusing: global
keyframes for a single island get a component prefix (`if-` for InscriptionForm:
`if-check-draw`, `if-step-pop`) and live in their own commented block at the end of
`global.css`, wrapped in `@media (prefers-reduced-motion: no-preference)` so the
non-animated state is the CSS default rather than an override.

Fase 1 Tarea 2 (botón físico) was implemented 2026-08-22, same day, right after Tarea 1
— `--shadow-pressable` added to `@theme` (right after `--shadow-overlay`, hard shadow,
no blur, color driven by a `--btn-shadow-color` custom property each `Button.astro`
variant sets via a Tailwind arbitrary-property class, e.g.
`[--btn-shadow-color:var(--color-primary-dark)]`, falling back to
`color-mix(in_srgb,var(--color-surface-muted)_55%,black)` for `secondary` which has no
pre-existing `-dark`/`-deep` token). Mechanism in `Button.astro`: `shadow-pressable` at
rest, `hover:-translate-y-px`, `active:translate-y-1 active:shadow-none` (instant swap,
no transition), `transition-transform duration-[var(--duration-micro)] ease-spring`
governs only `transform`/`translate`, and `motion-reduce:*` zeroes both translates.
Notably this task **dropped** the pre-existing `transition-colors duration-200` on
`Button` (hover bg/text color swap is now instant, not faded) — a deliberate call to
satisfy the task's literal "the only property that transitions is transform"
requirement without stacking two Tailwind `transition-property`-setting utility
classes, see [[tailwind4-transition-property-utilities]]. All 14 `Button.astro.test.ts`
tests plus the full `astro` vitest project (1282 tests) stayed green after the change.

Fase 2 Tarea 5 (validación con feedback en `ContactForm.tsx` e `InscriptionForm.tsx`)
was implemented 2026-08-22, same day. Two new keyframes with the `field-` prefix
(`field-shake`, `field-pop`) were added to `global.css` in their own commented block
**after** the `if-` block (never touch that one — it's Tarea 4's stepper), same
`@media (prefers-reduced-motion: no-preference)` wrapping convention.

Shake retrigger mechanism chosen (documented in-code in both components): a single
`shakingFields: Set<string>` state + `triggerShake(fields)` that clears the field(s)
from the Set, then re-adds them one `requestAnimationFrame` later — a genuine
off-then-on class transition, so the CSS animation restarts reliably. Deliberately
**not** `key`-based remounting: remounting the field wrapper would also unmount the
`<input>` (destroying whatever `setFocus()` just did after a failed `handleNext`/
`onInvalidSubmit`, since RHF's `setFocus` runs synchronously right after and a
key-remount a tick later would yank focus away). The `field-shake` class is **never**
bound directly to `errors[name]` in JSX — that still only drives the red border — so
there's a single source of truth for the animation class (the Set), avoiding two
mechanisms fighting over one class name. Two feed points: (1) a `useEffect` on
`[errors]` diffs current error field names against a `prevErrorFieldsRef` snapshot and
shakes only *newly*-invalid fields (covers "field enters error on blur" without
re-shaking on every keystroke of a field the user is actively fixing, since RHF's
default revalidiate-on-change for already-invalid fields would otherwise spam the
shake); (2) explicit `triggerShake(...)` calls in `handleNext` (Inscription, per-step)
and both forms' new `onInvalidSubmit` handler (covers "re-attempt while still
invalid"). Minor accepted redundancy: on a field's *first* failed attempt both feed
points can fire back-to-back (harmless — `triggerShake` is idempotent-ish, just two
quick clear+set cycles, visually indistinguishable from one).

Valid-checkmark (`field-pop`) is scoped to freeform text-style fields only
(`type="text"/"email"/"tel"` and `<textarea>`) in both forms — not `<select>` (native
arrow already occupies the right edge) and not radio-group/checkbox fields (their
selected state is already the feedback). Condition is literally `touchedFields.x &&
!errors.x` (RHF `touchedFields`, added to both forms' `formState` destructure) with no
extra "non-empty" guard, so an optional field left blank-but-touched (e.g. ContactForm
`phone`) can show a checkmark — accepted as a minor, harmless edge case rather than
extra logic. Position is a small local `ValidCheckmark()` component per file
(duplicated, not shared — Tarea 5's own file scope was just the two components +
`global.css`) rendered `absolute right-3 top-3` inside a `relative`-wrapped parent,
with the input's own className gaining `pr-10` for text clearance. `aria-hidden="true"`
throughout — decorative reinforcement only, never a replacement for the error message/
`aria-invalid`/`role="alert"` triad, which were left untouched.
`InscriptionForm.tsx`'s `guardianAddress` (fully optional, no error UI at all in the
existing markup) was deliberately left out of the checkmark treatment for consistency
with "only fields that already have error handling get paired valid-feedback".

Both forms' full `npx vitest run --project react` (79 tests) and the full `astro`
project (1282 tests) stayed green; `npm run lint` and `npm run typecheck` (`astro
check`) both clean. See [[prettier-preexisting-drift]] — `ContactForm.tsx` was also
confirmed failing `prettier --check` *before* this task's edits (previously the memory
only had confirmed evidence for `InscriptionForm.tsx`/`global.css`), so both files were
edited in their existing local style, no `--write`.

Fase 3 Tarea 9 (`@starting-style` entradas en SiteSearch/MobileMenu/ImageLightbox) was
implemented 2026-08-22, same day, in parallel with Tarea 5's agent — **`global.css` was
not touched at all**, everything resolved with inline Tailwind utilities in the three
TSX files. Two mechanisms, chosen per how each overlay already mounts (see
[[tailwind4-transition-property-utilities]] for the compile()-verified utility list):
- **SiteSearch backdrop + panel, ImageLightbox backdrop + dialog**: all four nodes are
  conditionally rendered in JSX (`{isOpen && (...)}` / `{mounted && isOpen &&
  createPortal(...)}`), so each open is a genuinely new DOM node — `starting:opacity-0`
  (+ `starting:scale-95` on the panel/dialog) fires without needing `transition-discrete`
  (`transition-behavior: allow-discrete` only matters for a *persisting* node toggling
  `display`/`[hidden]`, not for mount/unmount). Backdrops: `transition-opacity` alone.
  Panels/dialogs needing both fade+scale: **one** combined arbitrary utility
  `transition-[opacity,scale]` (not `transition-opacity transition-transform` stacked —
  also note Tailwind's `scale-*`/`starting:scale-*` utilities set the `scale` CSS
  property, not `transform`, so the arbitrary list is `opacity,scale`, not
  `opacity,transform`). `ease-spring duration-[var(--duration-micro)]` +
  `motion-reduce:transition-none` throughout (no need for extra
  `motion-reduce:opacity-100`/`scale-100` resets — with the transition cancelled, the
  starting-style is never visibly painted, the node just renders at its normal end
  state on the first frame, confirmed via the same `compile()`-API technique used for
  the other transition-property findings).
- **MobileMenu drawer**: the drawer `<div>` is *not* conditionally mounted (it's always
  in the portal, off-screen via `translate-x-full`, toggled to `translate-x-0` by a
  class swap on the persistent node) — chose to keep that exact mechanism per the
  task's own "elige lo que menos cambie su estructura" instruction rather than
  refactor it to `@starting-style`, just swapped `duration-300 ease-in-out` for
  `duration-[var(--duration-micro)] ease-spring motion-reduce:transition-none`. Its
  overlay backdrop (which *is* conditionally rendered, `{isOpen && (...)}`) got the
  same `starting:opacity-0` fade treatment as the other two components' backdrops.
  `MobileMenu.test.tsx` asserts `toHaveClass('translate-x-full'/'translate-x-0')`
  directly, so those two literal class names were never touched.
- Bonus fix: `ImageLightbox.tsx`'s modal wrapper had a dead `animate-fade-in` class
  (not a real Tailwind utility, not defined anywhere in `global.css` — pure no-op,
  confirmed via `grep`) that got replaced by the real `starting:`-driven fade as part
  of this task.

`npx prettier --write` was tried once on `MobileMenu.tsx` to see if it'd resolve its
pre-existing drift and immediately produced a ~90-line reformat of unrelated code
(quote style, JSX attribute wrapping) exactly like [[prettier-preexisting-drift]]
predicts — reverted to a pre-write backup and hand-matched the file's existing
single-line-attribute local style instead, per that memory's guidance. `SiteSearch.tsx`
was prettier-clean before this task, so it *was* safe to `--write` there (6-line diff,
no unrelated churn) and still is after.

Full `npx vitest run --project react` (79 tests, 5 files) and `npm run lint` both clean
after this task; `astro`-project tests weren't re-run since no `.astro` file changed.

Fase 2 Tarea 6 (confeti en la pantalla de éxito de ambos formularios) was implemented
2026-08-22, same day, in parallel with Tarea 9. Decision: **CSS puro, not
`canvas-confetti`** — the deciding argument was this repo's production CSP in
`public/.htaccess` (`default-src 'self'`, no `blob:` in `script-src`, no `worker-src`/
`child-src` at all): canvas-confetti spins up a Web Worker from a Blob URL by default,
which would throw a CSP violation on every conversion (it falls back to the main thread,
so it'd "work" while polluting the console — the worst kind of failure). Zero deps also
keeps the plan's own "no animation runtimes" line intact.
Two new files in `src/components/interactive/` (neither is an island — no `client:*`
anywhere): `SuccessConfetti.tsx` is the gate that stays in the island chunk
(`matchMedia` check → `import('./ConfettiBurst')` inside a `[]`-deps effect, so mount
*is* the single trigger and re-renders can't re-fire it), and `ConfettiBurst.tsx` holds
everything else, so it lands in its own Rollup chunk. Empirically confirmed on the
existing `dist/` that this really is zero initial cost: Astro emits dynamic-import
chunks separately (`TrochaVerdeMap.*.js` 4.7KB vs `leaflet-src.*.js` 148KB) **and** puts
no `<link rel="modulepreload">` for them in the HTML, so the chunk is only fetched when
the import actually runs.
Non-obvious details worth keeping: (1) jsdom has **no** `window.matchMedia` at all, so
the gate treats "no matchMedia" as reduce — existing form tests therefore never load the
confetti chunk, and Tarea 7 must stub `matchMedia` to exercise the animated path;
(2) in `ContactForm` the confetti mounts as a *sibling* of the `role="status"` card
inside a new `relative rounded-2xl` wrapper, never inside it — `role="status"` is
`aria-atomic` by definition, so mounting/unmounting a child would make screen readers
re-announce the whole success message twice; `InscriptionForm`'s success card has no
live region, so there the layer sits directly inside it; (3) each particle is one
`<span>` (falls, `translate`) plus its `::before` (spins, `rotate3d` without
`perspective`) because two animations can't drive the same `transform`; per-particle
randomness travels as inline custom properties, which the pseudo-element inherits;
(4) the whole `confetti-` block in `global.css` — including the particle's size and
color — sits inside `prefers-reduced-motion: no-preference`, so even an accidental mount
under `reduce` paints nothing instead of leaving static specks.

Fase 4 Tarea 12 (remates: wiggle de iconos en hover de tarjetas, acordeón FAQ,
bamboleo del ciclista del 404) was implemented 2026-08-22, same day, in parallel with
another agent's Tarea 6. All in scoped `<style>`/inline Tailwind classes — `global.css`
untouched.
- **Wiggle**: only `NewsCard.astro` (the `ph:arrow-right-bold` CTA arrow) and
  `EventCard.astro` (the `ph:map-pin-bold` location pin, after adding `group` to its
  outer `<div>` — it didn't have one) got the treatment.
  **`RiderCard.astro` was deliberately skipped** — read it fully first and it has zero
  `astro-icon` `Icon` usage anywhere (`Badge.astro` doesn't render one either); the
  card's only interactive element is the `<Image>` itself. Don't add wiggle there without
  first adding an icon, which is out of this task's scope (no new visual elements). The
  wiggle itself is one Tailwind class list applied directly to the `<Icon>` (a distinct
  DOM node from whatever `transition-*` class the card/wrapper span already carries, so
  [[tailwind4-transition-property-utilities]]'s same-element stacking gotcha never
  applies — verified anyway via `compile()` that `rotate-[8deg]` sets the `rotate`
  property and `transition-transform` already lists `rotate` in its
  `transition-property`):
  `transition-transform duration-[var(--duration-micro)] ease-spring
  group-hover:rotate-[8deg] motion-reduce:transition-none
  motion-reduce:group-hover:rotate-0`. The explicit `motion-reduce:group-hover:rotate-0`
  (zeroing the actual value, not just killing the transition) follows the same pattern
  Tarea 2's `Button.astro` established, not a new convention.
- **FAQ accordion** (`FaqAccordion.astro`): it's native `<details>`/`<summary>`, no JS.
  Real progressive enhancement, no fallback CSS needed — the entire mechanism (
  `interpolate-size: allow-keywords` on `.faq-item`, `::details-content { height: 0;
  overflow: clip; transition: height ..., content-visibility ... allow-discrete; }`,
  `.faq-item[open]::details-content { height: auto; }`, `@starting-style` for the height:0
  starting point) lives inside one `@supports (interpolate-size: allow-keywords)` block,
  so non-Chromium browsers get literally zero new rules and the native instant
  open/close is untouched byte-for-byte. `height` is the one exception to the plan's
  "only transform/opacity" rule here, explicitly pre-authorized by this task's own
  instructions because `interpolate-size`/`calc-size()` is the only standard mechanism
  for animating to/from an intrinsic `auto` size, it's gated behind `@supports`, and it
  fires on user interaction (not on load), so it doesn't touch the CLS budget. Used
  `--ease-spring` (not `--ease-pop`) per `global.css`'s own doc comment reserving
  `-spring` for "hover, lift de tarjetas, entradas de contenido" and `-pop` for
  celebrations — an accordion opening is content entering, not a celebration. Reduced
  motion is a nested `@media (prefers-reduced-motion: reduce) { transition: none; }`
  inside the same `@supports` block (Chromium + reduced-motion still gets the instant
  native toggle, same end state as everyone else).
- **404 cyclist idle sway**: this is the plan's one explicitly-authorized infinite loop
  (`docs/06-plan-animaciones.md` calls it out by name). The off-trail cyclist `<span>`
  already had `motion-safe:animate-pulse` (opacity flicker) — replaced with a purpose-
  built `offroute-sway` keyframe (`rotate: -2deg` ↔ `2deg`, 3s `ease-in-out infinite`),
  which reads as "balancing on the bike" rather than a generic "loading" pulse.
  `transform-origin: bottom` (not the default center) so it pivots like it's rooted at
  the wheels/ground contact point, not spinning around its own belly — this is the "sensible
  transform-origin" the task asked for. Per the task's explicit instruction, wrapped the
  *entire* `animation:` declaration inside `@media (prefers-reduced-motion:
  no-preference)` (unanimated is the CSS default, not an override) — this is the
  opposite direction from the pre-existing `SponsorsBar.astro`'s `.animate-scroll`
  (animation on by default, killed inside `prefers-reduced-motion: reduce`); both reach
  the same end state, this task just followed the plan's own stated convention.
  `@keyframes` inside a `.astro` `<style>` block (not `global.css`) has one precedent in
  this repo already, `SponsorsBar.astro`'s `@keyframes scroll` — Astro scopes
  `@keyframes` names per-component automatically, so no cross-file collision risk even
  with a generic name.
- All three pieces: `npx vitest run --project astro` (1282 tests), `npm run lint`, and
  `npm run typecheck` stayed clean. `prettier --check` fails on all four touched files
  (`NewsCard.astro`, `EventCard.astro`, `FaqAccordion.astro`, `404.astro`) — confirmed
  via `git show HEAD:<file> | prettier --check` that **all four already failed on their
  committed state before this task's edits** (new pre-existing-drift evidence for
  [[prettier-preexisting-drift]] beyond the files already listed there), so left as-is,
  no `--write`, per that memory's guidance and this task's own instructions.

Fase 4 Tarea 11 (count-up CSS puro del total de árboles) was implemented 2026-08-22,
same day, in parallel with another agent's Tarea 12. **Only `TrochaVerde.astro` (the
homepage/portada section) was touched** — `global.css` untouched, `StatsCounter.astro`
(the "club en cifras" band) deliberately left alone.

Scope call worth remembering: the total-trees figure appears in two places —
`TrochaVerde.astro` (raw `{totalTrees}` markup) and `src/pages/trocha-verde/index.astro`
(via the shared `StatFigure.astro` editorial component, used on 16 pages site-wide). They
don't share a rendering "piece" (portada doesn't use `StatFigure`), so per the task's own
"si no comparten pieza, empieza por la de mayor visibilidad" instruction, only the
homepage instance got the treatment — picked over `/trocha-verde` partly because it's the
higher-traffic page, and partly because `/trocha-verde/index.astro`'s `StatFigure` grid
sits inside that page's own hero (no-scroll, `fetchpriority="high"` LCP image right next
to it, no `.reveal` anywhere on that page) — animating it there would edge into the plan's
own "no animar el hero" exclusion. Retrofitting `StatFigure.astro` itself with an opt-in
count-up prop was considered and rejected: it's a widely shared primitive (16 call sites),
and the task's explicit scope is "SOLO el contador de árboles de Trocha Verde" — touching
a shared component for one caller is a bigger footprint than the task asked for. Worth
revisiting as a follow-up if `/trocha-verde/index.astro`'s own counter ever gets this
treatment (would need a `.reveal`-wrapped stat block on that page first, since none of its
sections currently reveal on scroll).

**`StatsCounter.astro`** (the "El club en cifras" band, `figures.length` cards including
years active, program count, events, **and** trees via `summarizeTrees(...).totalTrees` as
one of up to 4 figures) already has its **own, separate, pre-existing JS count-up** —
untouched by this task, not migrated, per its own explicit instructions. Mechanism: a
`<script is:inline>` at the bottom of the component (not the site-wide `.reveal`/BaseLayout
observer) that runs a *second*, independent `IntersectionObserver` scoped to
`[data-count-target]:not([data-counted])`, threshold `0.5`, `requestAnimationFrame`-driven
`easeOutCubic` interpolation over a hardcoded 1500ms, re-initialized on `astro:page-load`.
Respects `prefers-reduced-motion: reduce` by skipping the observer entirely and writing the
final `textContent` synchronously. No `@property`/CSS involved at all — pure JS text
mutation. A real target for a follow-up "migrate to the CSS mechanism" task, but out of
this task's scope by explicit instruction (only asked to report on it, not touch it).

Mechanism chosen for the homepage counter, mirroring `SeasonStandings.astro`'s existing
convention (build-time value → inline `style={"--foo:${value}"}` custom property consumed
by a component-scoped `<style>`, no `global.css` edit): the real total travels as
`style={`--count-target:${totalTrees}`}` on a wrapper `<span class="tv-count">`; inside it,
an empty `aria-hidden="true"` `<span class="tv-count__digits">` renders the number entirely
via `::before { content: counter(tv-count) }` + `counter-reset: tv-count var(--tv-count)`
**both declared on the same real element** (not split across host/pseudo) — this matters
because `--tv-count` is registered `inherits: false`, so a pseudo-element wouldn't see a
custom property set on its host if it needed to inherit it; putting `counter-reset` and
`--tv-count` on the exact element whose `::before` reads the counter sidesteps that
entirely (counters resolve through the counter table, not custom-property inheritance).
The real accessible number lives in a **sibling** `sr-only` `<span>{totalTrees}</span>` —
screen readers only ever hear the final content-sourced number, never the animated one.

Baseline (unconditional, outside any `@supports`/`@media`): `--tv-count: var(--count-target)`
— i.e. the pseudo shows the final number with **zero** gating, in every browser, before any
enhancement layer is considered. The animated layer lives entirely inside
`@supports at-rule(@property) { @property --tv-count {...} @media (prefers-reduced-motion:
no-preference) { ... } }` — `@supports (prop: value)` can't test at-rule support, `at-rule()`
is the correct/only tool for feature-detecting `@property` itself (both this and the
`@property` registration are new to this codebase, no prior usage to grep). Confirmed the
gating is *load-bearing*, not decorative: without the outer `@supports`, a browser lacking
`@property` support would still apply the inner `@media` block's `--tv-count: 0` (since
`@media` alone doesn't need `@property` to parse), producing a value that can never animate
smoothly (falls back to a discrete flip) instead of the plan's required static-final-value
fallback.

**The no-JS trap** (worth remembering for any future `.reveal`-triggered CSS-only
animation): the site-wide `.reveal`→`.revealed` mechanism is added by an inline `<script>`
in `BaseLayout.astro` — with JS fully disabled, `.revealed` never arrives, and a rule
shaped like `.reveal.revealed .foo { --x: <target> }` simply never fires, permanently
stranding whatever the *pre-revealed* state was. For opacity/transform `.reveal` effects
elsewhere in the site this "just" leaves content invisible (a pre-existing, unrelated
site-wide gap, not something this task fixes) — but for this counter, the pre-revealed
state is a *wrong number* (0), which is strictly worse than invisible content, since it
fabricates false data instead of just failing to animate. Fixed with a genuine progressive-
enhancement idiom, not new JS: `<noscript><style is:inline>.tv-count__digits{--tv-count:
var(--count-target) !important}</style></noscript>` placed right after the counter markup.
Two things make this actually work in Astro specifically (verified by the full `astro`
vitest project staying green, which requires Vite to successfully compile the component's
CSS): (1) `is:inline` is mandatory — Astro's *default* `<style>` handling extracts and
bundles style content into a chunk that's always loaded via `<link>`/`<head>`, completely
regardless of where the source `<style>` tag was nested in the markup, which would silently
defeat the whole `<noscript>` trick (the CSS would load unconditionally, JS or not) if left
as a normal scoped style; `is:inline` opts out of that, keeping the tag literally in-place
in the rendered HTML, so the browser's native "don't parse `<noscript>` children when
scripting is enabled" behavior is what actually gates it, not Astro. (2) `!important` on
the override, not source-order, since `is:inline` styles render in `<body>` flow (after
whatever `<head>`-bundled stylesheet the component's regular scoped `<style>` compiles
into) and relying on that ordering to win a same-specificity, single-class-selector fight
felt fragile against future bundling changes — `!important` makes the override
deterministic regardless.

Duration: fixed `1.2s` (not `--duration-micro`/`--duration-celebration`, both too short for
a 0→77 count) with plain `ease-out`, no spring token — the task explicitly said no spring
needed here, same "duration outside the two existing tokens, on purpose" precedent as
Tarea 5's 300ms shake.

`npx vitest run --project astro` (1282 tests), `npm run lint`, `npm run typecheck` all
clean. `prettier --check` on `TrochaVerde.astro` fails, confirmed via `git show
HEAD:<file> | prettier --check` that it **already failed on its committed state** before
this task (`--write` produced a 222-line unrelated reformat) — left as-is per
[[prettier-preexisting-drift]], new evidence for a file not previously listed there.

Fase 2 Tarea 7 (tests react de los estados animados de Tareas 4-6) was implemented
2026-08-22, same day, purely additive to existing test files — no component code
touched (`InscriptionForm.tsx`, `ContactForm.tsx`, `SuccessConfetti.tsx`,
`ConfettiBurst.tsx` all untouched). Extended `InscriptionForm.react.test.tsx` and
`ContactForm.react.test.tsx` with nested `describe` blocks (stepper progress, shake
retrigger, `ValidCheckmark`, confetti-on-success); added two brand-new files,
`SuccessConfetti.react.test.tsx` and `ConfettiBurst.react.test.tsx`. 24 new tests, all
103 react-project tests green, stable across 3 repeated runs.

Mechanisms worth reusing for future animated-state tests in this repo:
- **Proving a class is genuinely re-applied, not just "still there"**: rather than
  trying to catch a transient state with `waitFor` polling (unreliable — the
  remove-then-`requestAnimationFrame`-re-add window in `triggerShake` can be shorter
  than `waitFor`'s poll interval), attach a `MutationObserver` on `{ attributes: true,
  attributeFilter: ['class'] }` to the exact element before triggering the second failed
  attempt, record `classList.contains('field-shake')` on every mutation record, then
  assert the recorded sequence contains a `false` immediately followed by `true`
  (`observedStates.lastIndexOf(false)` non-negative, next entry `true`). This is
  deterministic because `MutationObserver` queues *every* DOM mutation regardless of
  how fast it happens, unlike polling. Confirmed this genuinely distinguishes "class
  re-applied" from "class never left": React only touches the `class` attribute when
  the produced string actually differs, so the harmless first `triggerShake` call on an
  empty `Set` (removing from nothing) produces zero spurious mutations.
- **`requestAnimationFrame` is real (not stubbed) in this project's jsdom test env** —
  confirmed via `node_modules/vitest`'s bundled fake-timers source: Vitest's jsdom
  environment sets `pretendToBeVisual: true` by default, which is what makes jsdom
  implement `requestAnimationFrame` at all. No polyfill/stub needed for `triggerShake`'s
  rAF-based retrigger to work under plain `waitFor` in tests that don't need the
  MutationObserver-level precision.
- **Stubbing `matchMedia` for `SuccessConfetti`'s gate**: `vi.stubGlobal('matchMedia',
  vi.fn().mockReturnValue({ matches, media, addEventListener: vi.fn(), ... }))`, cleaned
  up with `vi.unstubAllGlobals()` in a `describe`-scoped `afterEach` (not file-level,
  and never in `setup-react.ts` — the task was explicit that adding it there would
  silently change every other form test's default "no matchMedia" behavior). The
  `matches: false` (motion allowed) path requires `await screen.findByTestId(...)` /
  `waitFor`, not a plain synchronous assertion — the gate's `import('./ConfettiBurst')`
  is a real dynamic import and resolves on a later microtask/task even though the module
  is already in the test's dependency graph. The `matches: true` and "no matchMedia at
  all" (jsdom's actual default — just don't stub anything) paths both bail out of the
  gate's effect *before* calling `import()`, so a synchronous assertion right after
  `render()` is sufficient and correctly proves the chunk was never requested (no
  artificial `setTimeout` delay needed to "wait and see if it loads late").
- **`ConfettiBurst`'s `data-testid="confetti-burst"` on the wrapper `<div>`** (pre-existing
  in the component, not added by this task) is the right query target precisely because
  the layer is `aria-hidden="true"` — `getByTestId`/`queryByTestId` ignore the
  accessibility tree, unlike role-based queries, so it's the only ergonomic way to assert
  presence/absence of a deliberately-inaccessible decorative layer.
- **Testing the 2600ms auto-teardown deterministically**: `vi.useFakeTimers()` +
  `act(() => vi.advanceTimersByTime(N))`, asserting presence at 2599ms and absence at
  2600ms (the exact `TEARDOWN_MS = DELAY_MAX_MS + FALL_MAX_MS + 200` from the component's
  own constants) — scoped to `ConfettiBurst.react.test.tsx` only via its own
  `beforeEach`/`afterEach` pair, never touching the other (real-timer) test files. The
  one axe test in that file switches back to `vi.useRealTimers()` first since
  `vitest-axe`'s internal async work doesn't play well with fake timers.
- **Disambiguating duplicate text matches**: `InscriptionForm`'s `<legend>` and its
  matching field error `<p role="alert">` can render identical copy (e.g. "Selecciona un
  programa" appears as both the step legend and, on error, the alert text) — use
  `screen.getByText(str, { selector: 'p' })` rather than reaching for `getAllByText`,
  since the alert is always a `<p>` in both forms' markup.

**Coverage-reporting quirk discovered while measuring Tarea 7's impact** (see
[[vitest-coverage-v8-text-reporter-quirk]]): `ConfettiBurst.tsx`, despite being fully
exercised (confirmed 100/100/100/100 in `coverage/components/interactive/ConfettiBurst.tsx.html`
and in `coverage/coverage-final.json`), never prints a row in `npm run test:coverage`'s
terminal `text` table — not a real coverage gap, just don't trust the printed table alone
for dynamically-imported chunk files; check the HTML/JSON report if a file seems
suspiciously absent.

Coverage before this task (`src/components/interactive/**` aggregate): 87.2%
stmts / 76.74% branch / 87.24% funcs / 88.81% lines. After: 90.31% / 80.79% / 91.71% /
91.29% — comfortably above the directory's 80/80/70/80 thresholds and the global
70/75/70/70 floor; `npm run test:coverage` exits 0 with no threshold errors.

Fase 3 Tarea 8 (`transition:name` morphs tarjeta → detalle) was implemented 2026-08-22,
same day, in parallel with another agent's Tarea 7. **Read [[astro-view-transitions]]
first** — it holds the framework-level findings this task uncovered, the most important
being that adding *any* named element to a page shifts the auto-generated name of
`BaseLayout`'s `<main transition:animate="fade">`, which is why that element now carries
an explicit `transition:name="page-main"`. That one-line change to `BaseLayout` was not
in the task's stated file list but was mandatory: without it the site-wide page fade
would have silently stopped pairing on `/noticias` and `/trocha-verde`.

Three pairs shipped, all image-only: `news-img-{id}` (NewsCard's *image wrapper* ↔ the
`<img>` of `/noticias/{id}`), `tree-img-{id}` (TreeCard's wrapper ↔ the hero of
`/trocha-verde/arboles/{id}`), `species-img-{id}` (the species-inventory card's wrapper
on `/trocha-verde` ↔ the hero of `/trocha-verde/{id}`). Uniform rule adopted: **on the
card the name goes on the element that defines the visible image frame (the
`overflow-hidden` wrapper), on the detail page it goes on the `<img>` itself.** The
wrapper is deliberate on the card side — it clips `group-hover:scale-105`, which *is*
active at click time on desktop, so naming the `<img>` would capture the zoomed,
unclipped state and make the image jump at transition start; all three wrappers were
already `position: relative` or had no absolutely-positioned children, so gaining a name
can't re-anchor anything. On the detail side the `<img>` wins because with
`imageLayout: contain` (9 of 10 crónicas are posters) the container is a nearly-empty
full-width strip and landing the morph there would end the animation on a big empty box.

Pairs deliberately **discarded**: (1) **riders** — `RiderCard.astro` has zero live call
sites (`src/pages/equipo/index.astro.bak` only; the live `/equipo` renders `directivos`
inline and that collection has no directory) and there is no rider detail page
(`[...slug].astro.bak`); (2) **albums** — `AlbumCard` links to `/galeria/{slug}`, but
that detail page has no hero image at all (SectionIntro + StatFigures + the
ImageLightbox grid), so there is nothing to morph into; (3) **all titles** — see the
gate-14 note in the plan doc for the three reasons.

Data facts worth keeping: the `/trocha-verde` species-inventory thumbnail is the image
of the *first* tree of that species (`buildSpeciesInventory`), which equals the species
`heroImage` in 20 of the 28 linked species and differs in 8 (three of those heroes are
the generic `dia-tierra-2026/afiche.jpg`) — those 8 morph as a positioned cross-fade of
two different photos rather than a literal morph. The inventory groups by
`scientificName ?? species` while the link resolves by `commonName`, so two entries can
theoretically point at the same species page; a `morphedSpecies` Set guards against the
duplicate name that would abort every transition on the page.

Verification technique that worked (no build needed, the orchestrator runs the build):
render whole pages with `experimental_AstroContainer` — pass `renderers` from
`loadRenderers([getContainerRenderer()])` of `@astrojs/react` or it throws on
`SiteSearch`, and pass `getStaticPaths` props (`{ entry }`, `{ sp }`, `{ tree }`)
directly. Scope counts came out exactly as predicted (home 4, /noticias 10,
/trocha-verde 30, detalles 2/6/7 including `main`), with zero duplicates.

`npx vitest run --project astro` (1282 tests) green with **no test changes needed** —
the container drops `extraHead`, so no stray `<style>` appears in component renders and
the existing NewsCard/TreeCard assertions are untouched. `npm run lint` and
`npm run typecheck` clean. All nine touched files already failed `prettier --check` at
HEAD (see [[prettier-preexisting-drift]]) — new evidence: `NewsPreview.astro` and
`noticias/index.astro` fail with the same *SyntaxError* as `NewsCard.astro` (Prettier's
astro parser chokes on `<!-- -->` comments inside JSX-ish expressions), not mere style
drift, so `--write` is not even an option there. Also learned: verifying "was it already
failing at HEAD?" **must** use real files inside the repo (`git show HEAD:f > .tmp/…`);
`git show HEAD:f | prettier --check --stdin-filepath f` gave false "clean" results, and
copying to a directory outside the project loses `prettier.config.mjs` entirely.

Fase 4 Tarea 10 (perfil de elevación que se traza al scroll) was implemented 2026-08-22,
same day, running solo. **The task's own recommended mechanism (`stroke-dashoffset` +
`pathLength="1"`) was measured and rejected**: every stroke of the profile carries
`vector-effect="non-scaling-stroke"`, and Chrome then measures the dash pattern in the
post-transform (screen) space while `pathLength` normalizes against the *untransformed*
geometry. With `preserveAspectRatio="none"` the two lengths diverge with viewport width —
measured at 1160×176, `stroke-dashoffset: 0` (the supposed "fully drawn" end state) leaves
the last 12% of the trail missing, and `1` (supposed "hidden") leaves a loose tail visible;
at 340×112 the same values complete the draw at ~36% of the range. Verified with real
Chrome screenshots, see [[headless-chrome-css-verification]] for the harness.
Shipped instead: a **sweep by clip** — `<clipPath><rect class="sda-trail-sweep">` covering
the whole viewBox, animated `transform: scaleX(0) → scaleX(1)` with `transform-origin: left`.
Length-independent, only animates `transform` (so it doesn't even need the plan's
paint-only exception), and at rest the rect covers everything, so the default markup state
is the complete profile — no fallback rule needed outside the guards.
Non-obvious details worth keeping:
- **The view timeline must be declared on an HTML ancestor, not on the SVG element.**
  Anonymous `view()` needs a principal box and SVG children don't have one, so `.sda-trail`
  (the profile's wrapper `<div>`/`<figure>`) declares `view-timeline-name: --sda-trail` and
  the `<rect>` references it by name. Confirmed by experiment: a CSS animation on a `<rect>`
  **inside `<defs>`/`<clipPath>` does run** (elements that are never rendered directly still
  animate), and named-timeline lookup walks the DOM ancestors through the SVG fine. An
  `animation-timeline` on an SVG `<path>` also works — the dash approach failed on geometry,
  not on timeline support.
- **`overflow: hidden` freezes the timeline at an arbitrary, layout-dependent value** — not
  necessarily 0 and not necessarily the end. Measured 53%/63%/83% in different geometries,
  i.e. "sometimes complete, sometimes stuck half-drawn". So `scrollDriven` on the host
  `SectionShell` is load-bearing, and five shells got it (`ProgramsGrid`, `/programas`,
  `/programas/[slug]`, `/inscripciones`, `404`), which as a side effect gives their `topo`
  texture the `sda-parallax-slow` drift.
- **Range `cover 0% cover 35%`, not the `cover 0% cover 85%` of `.timeline-progress`.**
  Measured: the trail completes when the profile's top is ~55% down the viewport, and — the
  reason for picking a short range — a profile that falls inside the *first* viewport
  renders `scaleX(1)` at load instead of empty, which is what keeps `/programas`' opening
  section from painting a half-drawn graph before any scroll happens.
- Only the *strokes* sweep; the terrain fills stay painted. Keeps the graphic legible at any
  progress and minimizes what's hidden if anything goes wrong.
- **Cyclist: dropped on both surfaces, deliberately.** The 404's cyclist is off-trail on
  purpose (the page's metaphor) and already has Tarea 12's sway; `ProgramPathway` has no
  cyclist at all, and `offset-path: path()` can't create one — its coordinates are fixed px
  while the profile stretches non-uniformly, so the on-screen trace is unknowable at build
  time. `offset-path: shape()` with percentage coordinates (which `elevationPointAt` already
  produces) is the only viable future route, noted in the plan's gate-14 notes.
- `src/lib/editorial.ts` was in the task's file list but needed **no change**: the sweep
  needs no path length and no new sampling helper.
- Full `astro` project green at 1283 tests (1282 + 1 new). `ProgramPathway.astro.test.ts`
  needed a legitimate update: the band clips moved from a per-stage `<g>` onto the `<path>`s
  themselves (the sweep needs the only wrapping `<g>`), so `clipPath` count went 3 → 4.
  New evidence for [[prettier-preexisting-drift]]: `ProgramPathway.astro` and
  `ProgramsGrid.astro` fail `prettier --check` at HEAD with the same `<!-- -->`-inside-JSX
  **SyntaxError** as `NewsCard.astro` (unfixable via `--write`), and `/programas/index.astro`
  and `/programas/[...slug].astro` fail with ordinary drift.

**Gate 14 follow-up (2026-08-22, solo run): Tarea 8's `transition:name` directives were
replaced by hand-written inline `view-transition-name` on the card side only.** The
qa-auditor's perf audit surfaced the fact Tarea 8 didn't have — the HTML is served
`max-age=0`, so the directive's un-deduped ~2.4 KB/element head CSS is re-downloaded every
visit. Mechanism, safety proof and the measured before/after live in
[[astro-view-transitions]]. Detail pages deliberately kept the directive: one instance
each, and theirs are the rules that actually animate the pair. Verified in `dist/`: 352
listing→detail pairs still resolve, zero per-page duplicates, `page-main` and the
reduced-motion block still on all 144 BaseLayout pages. `npx vitest run --project astro`
1283 tests green with **no test changes** (`NewsCard.astro.test.ts` /
`TreeCard.astro.test.ts` never asserted on the directive, and
`experimental_AstroContainer` drops `extraHead` anyway); lint + typecheck clean; all seven
touched files already failed `prettier --check` at HEAD, `NewsCard.astro` with the usual
`<!-- -->`-in-JSX SyntaxError — see [[prettier-preexisting-drift]].

One thing worth copying: `BaseLayout.astro`'s explanatory `<!-- -->` comments **ship to
all 146 pages** (Astro does not strip HTML comments). Rewording one of them added +119 B
per page before it got trimmed back to +9 B. Use `{/* … */}` (as
`trocha-verde/index.astro` already does) when a template comment is purely for
maintainers — there is ~800 B/page of pre-existing `<!-- -->` prose in `BaseLayout` that
could be converted the same way, left alone as out of scope.

**Why:** so a future session picking up Tarea 2+ doesn't need to re-derive plan state
from git history alone, and knows the token names/values already exist and are
verified (`npm run build:only` green) before building on them.

**How to apply:** before starting any task in this plan, check the doc's checkbox
state directly (it's the source of truth, update it when merging to `develop` per the
doc's own instructions) rather than relying solely on this memory, since it decays as
tasks progress across sessions.
