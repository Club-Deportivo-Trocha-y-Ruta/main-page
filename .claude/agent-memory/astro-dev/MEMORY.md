# Memory Index

- [Tailwind 4 @theme tree-shaking + docs/*.md content scanning](project_tailwind4-theme-treeshaking.md) — unused-namespace theme tokens vanish from dist until referenced; not a bug.
- [Pre-existing Prettier drift; formatting is not a CI gate](project_prettier-preexisting-drift.md) — when to reformat a whole file and when to leave `--check` failing.
- [Motion plan status](project_motion-tokens-plan.md) — docs/06-plan-animaciones.md: Tareas 1-12 done 2026-08-22 (only 13 gated + 14 gate left); mechanisms and rejected alternatives per task.
- [Verifying CSS in real headless Chrome](project_headless-chrome-css-verification.md) — how to measure scroll-driven/SVG rendering with the installed Chrome + sharp; `--screenshot` ignores document scroll; how to capture the footer.
- [Ornamento rechazado, costuras al píxel](feedback_ornamento-vs-costuras.md) — el decorado que cruza secciones no pasa; las uniones entre bloques de color se revisan con captura.
- [Astro 7 ClientRouter / view-transition gotchas](project_astro-view-transitions.md) — why listing cards use inline `view-transition-name` not the directive; auto names are order-dependent; `transition:persist` on a component is a no-op.
- [Tailwind 4 transition-property utility gotchas](project_tailwind4-transition-property-utilities.md) — `--duration-*` tokens need `duration-[var(...)]`; stacked `transition-*` utilities don't merge; `starting:`/`transition-discrete`/`scale-*` behavior.
- [Vitest coverage-v8 text reporter can hide a fully-covered file's row](project_vitest-coverage-v8-text-reporter-quirk.md) — check coverage-final.json/HTML before reporting a coverage gap from the terminal table alone.
