---
name: astro-view-transitions
description: Astro 7 ClientRouter gotchas verified in this repo — the transition:name directive is only a CSS name + ~2.4KB of un-deduped head CSS (so listing cards use plain inline view-transition-name instead), auto-generated names are render-order dependent, reduced-motion is already handled by Astro, and component-level transition:persist is a silent no-op.
metadata:
  type: project
---

Findings from reading `node_modules/astro@7.1.6` and the built `dist/` while doing
Tarea 8 of [[motion-tokens-plan]]. All verified, not inferred from docs.

**`transition:animate` without `transition:name` produces an order-dependent name.**
`renderTransition()` (`astro/dist/runtime/server/transition.js`) falls back to the
element's *scope* (`astro-{componentHash}-{n}`) as the `view-transition-name`, and `n`
is a counter shared by every `transition:*` directive rendered in that page, in render
order. Slot content is frequently evaluated **before** the layout element that contains
it, so the number is not stable: `<main transition:animate="fade">` in `BaseLayout` was
`astro-wugk46rw-2` on most routes but `-3` on `/politica-de-tratamiento-de-datos` (that
page's `PageLayout` adds an `<h1 transition:animate="slide">`), and adding
`transition:name` to listing cards pushed it to `-11` on `/noticias` and `-31` on
`/trocha-verde`. Two different names never pair, so the page-level fade silently stops
being one shared transition. **Fix applied 2026-08-22: `<main>` now carries an explicit
`transition:name="page-main"`.** Rule of thumb: never rely on an auto-generated name for
anything that must pair *across* pages. Audited in the built `dist/` afterwards: only
**two** auto-generated names exist site-wide and neither pairs — `PageLayout`'s
`<h1 transition:animate="slide">` has exactly one live caller
(`/politica-de-tratamiento-de-datos`) and `PostLayout` has zero (`equipo/index.astro.bak`
only). Everything that genuinely pairs carries a written name, so the counter is no
longer load-bearing.

**Reduced motion needs no work from us.** `astro/components/viewtransitions.css` (which
the compiler injects via `transitionsAnimationURL` into any component using a
`transition:*` directive) ends with `@media (prefers-reduced-motion) {
::view-transition-group(*), ::view-transition-old(*), ::view-transition-new(*),
[data-astro-transition-scope] { animation: none !important } }`. It is **unlayered**, so
its `!important` beats both the UA defaults and Astro's own rules (which live in
`@layer astro`). Confirmed present in the built `dist/index.html`. `ClientRouter.astro`
only adds a dev-mode `console.warn` on top of that.

**`transition:persist` on a *component* is a silent no-op unless the component spreads
its props.** The compiler turns `<Header transition:persist />` into a
`{"data-astro-transition-persist": createTransitionScope(...)}` **prop**;
`Header.astro` takes no props and never spreads, so the attribute never reaches the
HTML — zero occurrences of `data-astro-transition-persist` in the whole built `dist/`.
The header is therefore rebuilt on every navigation, and `SiteSearch.tsx`'s comment
("la cabecera es `transition:persist`") rests on a false premise. Left unfixed on
purpose: fixing it changes the lifecycle of the header's islands. Note the call still
consumes counter slot #1, which is why `main` used to be `-2`.

**Cost: ~2.4 KB of inline `<head>` CSS per named element — so many-instance sides use
plain CSS instead of the directive.** Every `renderTransition()` call pushes its own
`<style>` into `extraHead` with 8 near-identical rule blocks (forwards/backwards ×
old/new × modern/fallback). Measured: 2372 bytes, never deduped. Gzip flattens the
repetition, which is why Tarea 8 first accepted it — but the HTML is served
`max-age=0` by `dist/.htaccess` (unlike `_astro/*.css`, which is `immutable`), so it is
render-blocking CSS re-downloaded on every visit and growing linearly with card count.

**Reverted 2026-08-22: listing cards now write `style={`view-transition-name: ${name}`}`
by hand; only the one-instance detail pages keep the directive.** Two runtime facts make
this safe and behaviour-identical, both read out of `astro@7.1.6`, not inferred:
- **Pairing is by name only.** The directive's sole functional output is
  `[data-astro-transition-scope="…"] { view-transition-name: … }`. `grep
  data-astro-transition-scope node_modules/astro/dist/` returns *only* CSS strings
  (`transition.js`, `viewtransitions.css`) plus `hydration.js`'s preserve-list — **no
  router JS reads it**. So an inline `view-transition-name` pairs exactly the same.
- **The animation rules that run are the *destination* page's.** `updateDOM` →
  `doSwap` → `swapHeadElements` runs *inside* the `startViewTransition` callback and
  removes every non-persisted inline `<style>` from the outgoing document. The old
  snapshot is captured before that (so the card's name is read from the listing), but by
  the time `::view-transition-old/new(name)` resolve, only the detail page's head exists.
  Keeping the directive on the detail side therefore preserves Astro's fade byte-for-byte
  on the forward trip (`astroFadeOut`/`astroFadeIn`, 180ms, `cubic-bezier(0.76,0,0.24,1)`,
  `mix-blend-mode: plus-lighter`). Only the *back* trip degrades to the UA cross-fade —
  moot here, it already lands on an `opacity: 0` `.reveal` card. The size/position morph is
  UA-default either way: `fade()` never emits a `::view-transition-group` rule.

Measured in `dist/`: `/trocha-verde` 72,024 → 2,337 B of VT head CSS (39,596 → 37,204 B
gz for the page), `/noticias` 24,679 → 2,337 B, site-wide HTML 12.63 → 11.78 MB (−6.8%).
Bonus catch: the directive had been bound to `NewsCard`'s *optional* `transitionName`
prop, so unnamed cards (a chronicle's related posts) also paid 2372 B for an
auto-generated name that paired with nothing.

**Names are sanitized for you *by the directive only*** — hand-written inline names skip
`cssesc`, which is fine here because content ids are already slug-safe: the glob loader's
`generateIdDefault` returns a slugified id (lowercase, unaccented) unless frontmatter
overrides it with `slug:`, and this repo has zero `slug:` overrides. The
`news-img-`/`tree-img-`/`species-img-` prefixes cover the one remaining hazard, ids that
start with a digit (`2026-05-copa-valle-xco-cali`). `cssesc(reEncode(name), { isIdentifier: true })` maps
`_` → `__`, any other non-`[0-9a-zA-Z-]` ASCII → `_xx` hex, and escapes non-ASCII
(`á` → `\E1`). Slugs with dots or accents are safe; a `foo-img-` prefix also guarantees
the ident never starts with a digit. All `news`/`trees`/`species` ids in this repo
already match `^[a-z0-9][a-z0-9-]*$`, so they pass through unchanged.

**Duplicated names abort the whole transition** (spec behaviour) — so uniqueness per
page is a correctness requirement, not a polish item. Verify it by rendering pages with
`experimental_AstroContainer` and counting `data-astro-transition-scope` attributes; the
container **does not** emit `extraHead`, so the `<style>` blocks (and therefore the
resolved names) are invisible there — you can only count scopes, and must read the
compiler output (`@astrojs/compiler`'s `transform()`, look for `$$renderTransition(`)
to confirm which name expression each element gets.
