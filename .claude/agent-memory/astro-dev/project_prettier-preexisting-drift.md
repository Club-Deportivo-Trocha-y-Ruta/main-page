---
name: prettier-preexisting-drift
description: Several files (notably src/components/interactive/InscriptionForm.tsx) fail `prettier --check` on their committed state; CI never runs format:check, so don't blanket-`--write` a file you only touched in one place.
metadata:
  type: project
---

As of 2026-08-22, `git show HEAD:src/styles/global.css | prettier --check` fails on
the committed file itself (double- vs single-quoted `@import`/`@plugin`, single-line
`h1, h2, h3, h4` selector list, single-line multi-value `transition` shorthand,
multi-line `transform` broken across lines) — none of this is related to any specific
task's edits, it's just drift that accumulated before `format:check` was consistently
enforced on this file.

**Why:** running `npx prettier --write` on `src/styles/global.css` for [[motion-tokens-plan]]
Task 1 (adding `--ease-spring`/`--ease-pop`/duration tokens) also silently reformatted
these unrelated pre-existing lines as a side effect of formatting the whole file — this
is expected and fine, not scope creep, since the task's own verification step
explicitly calls for `prettier --write` on this exact file.

`global.css` is now clean (it got formatted during that task), but the drift pattern
repeats elsewhere. `src/components/interactive/InscriptionForm.tsx` is the extreme case:
`prettier --write` on its committed state produces a ~580-line diff (line re-wrapping
plus `prettier-plugin-tailwindcss` re-sorting every `className`). Neither CI workflow
runs `format:check` — `deploy.yml` gates only on `npm run typecheck` + `npm test`.

Confirmed 2026-08-22 ([[motion-tokens-plan]] Fase 2 Tarea 5): `src/components/interactive/ContactForm.tsx`
also fails `prettier --check` on its committed state, before any edits that session —
same drift pattern, same call: edited in local style, `--check` left failing.

Confirmed 2026-08-22 ([[motion-tokens-plan]] Fase 4 Tarea 12), via
`git show HEAD:<file> | prettier --check --stdin-filepath <file>` on each file's
pre-edit committed state: `src/components/common/EventCard.astro`,
`src/components/common/FaqAccordion.astro`, and `src/pages/404.astro` all fail too
(mostly `prettier-plugin-tailwindcss` class-order sorting + long single-line class
strings/JSX-expression-container wrapping the file's author never ran through
`--write`). `src/components/common/NewsCard.astro` also fails, but for a different,
Astro-parser-specific reason — an HTML comment (`<!-- ... -->`) placed between two
sibling `{condition && (<img .../>)}` JSX-style expressions inside the template
(around line 10) trips prettier's Astro parser with a hard `SyntaxError`, not a
"needs formatting" warning; this is a parse failure, not a style diff — `prettier
--write` would abort the same way, so this is not even reachable via `--write`.

**How to apply:** when `prettier --check` reports issues on a file before you've touched
it, don't assume you introduced them. Decide per file: if the drift is small (global.css)
or the task explicitly asks for `--write`, format the whole file and say so in the report.
If a full reformat would bury a small feature diff (InscriptionForm.tsx and its ~580
lines of churn on a ~15-line change), match the file's existing local style instead, let
`--check` keep failing, and report that the failure is pre-existing — formatting is not a
merge gate here.
