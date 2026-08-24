---
name: vitest-coverage-v8-text-reporter-quirk
description: A fully-covered file (100/100/100/100) can silently be missing its own row in `npm run test:coverage`'s printed `text` table even though the HTML/JSON reports have it — don't read file absence from the terminal table as a coverage gap.
metadata:
  type: project
---

Discovered 2026-08-22 while measuring [[motion-tokens-plan]] Tarea 7's coverage impact.
`src/components/interactive/ConfettiBurst.tsx` — a file dynamically `import()`-ed only
from `SuccessConfetti.tsx`'s effect, never imported statically anywhere — is genuinely
exercised by `ConfettiBurst.react.test.tsx` (direct render) and indirectly by
`SuccessConfetti.react.test.tsx` / the forms' confetti tests (via the real dynamic
import path with `matchMedia` stubbed). `coverage/coverage-final.json` and
`coverage/components/interactive/ConfettiBurst.tsx.html` both confirm 100% statements,
branches, functions, and lines for it. Yet `npm run test:coverage`'s terminal `text`
table (`@vitest/coverage-v8`, reporters `['text', 'html', 'lcov']`) never prints a row
for it at all — not 0%, not 100%, the file is simply absent from the printed tree, both
before this task (when it had zero coverage, also absent) and after (when it's fully
covered, still absent). All the other interactive-directory files
(`ContactForm.tsx`, `SuccessConfetti.tsx`, etc.) print normally in the same run.

**Why:** wasted time investigating this as a possible sign the new
`ConfettiBurst.react.test.tsx` file wasn't actually being picked up / instrumented —
it was, the JSON/HTML reports prove it, and the coverage thresholds check (which reads
the same underlying data, not the printed table) passed with no errors. This looks like
a cosmetic bug/edge-case in the v8-provider's terminal tree renderer for this specific
project setup (two vitest "projects" — `astro`/node and `react`/jsdom — sharing one
`coverage.include` glob defined only on the `astro` project's config, merged into a
single report by the root `vitest.config.ts` runner), not a real absence of coverage
data.

**How to apply:** when checking coverage numbers for `src/lib/**` or
`src/components/interactive/**` files, don't conclude a file has 0%/no coverage just
because it's missing from the terminal `text` table. Cross-check
`coverage/coverage-final.json` (grep the file's absolute path as a JSON key) or the
per-file HTML report at `coverage/<relative-path>.html` before reporting a gap. The
aggregate percentages printed for the parent directory row (e.g. `.../interactive`) do
correctly fold in the missing-row file's real numbers, so the directory-level summary
and the actual threshold pass/fail gate are both trustworthy even when an individual
file's row goes missing.
