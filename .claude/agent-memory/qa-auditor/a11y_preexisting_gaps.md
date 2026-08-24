---
name: a11y-preexisting-gaps
description: Gaps de accesibilidad/CSS ya existentes en el repo (no introducidos por el plan de animaciones), detectados durante la auditoría de Fase 1
metadata:
  type: project
---

Detectados el 2026-08-22 mientras se auditaba `docs/06-plan-animaciones.md`
Fase 1 ([[project-plan-animaciones]]), pero **preexistentes** — ninguna línea
involucrada estaba en el diff auditado. Quedan aquí para no tener que
redescubrirlos en cada auditoría futura y para escalarlos como backlog aparte.

1. **`focus-visible:outline-primary` no cumple contraste no-textual.**
   `src/components/common/Button.astro` (y cualquier otro elemento que use el
   mismo patrón de foco) fija el anillo de foco con `--color-primary`
   (`#20b7c9`), que da ~2.42:1 contra blanco/fondos claros — por debajo del
   3:1 mínimo de WCAG 1.4.11 (contraste no-textual) para el estado de foco de
   un control interactivo. El propio archivo ya documenta que ese mismo teal
   "solo da 2.4:1 contra blanco" para TEXTO y por eso existe
   `--color-primary-deep` (5.9:1) — pero el anillo de foco nunca migró a usar
   el tono `-deep`. Candidato a backlog: cambiar
   `focus-visible:outline-primary` → `focus-visible:outline-primary-deep` (o
   equivalente) en el sistema de foco compartido.

2. **Tokens de sombra sin uso real.** `--shadow-card`, `--shadow-raised` y
   `--shadow-overlay` están definidos en `@theme` de `src/styles/global.css`
   desde antes de la Fase 1 de animaciones, pero no aparecen usados como
   utilidad (`shadow-card`/`shadow-raised`/`shadow-overlay`) ni como
   `var(--shadow-*)` en ningún componente de `src/`. No es un bug — solo CSS
   muerto documentado que alguien puede querer limpiar o finalmente adoptar.

**Cómo aplicar**: si una auditoría futura (incluido el gate final, Tarea 14
del plan de animaciones) vuelve a tropezar con el contraste del anillo de
foco, no es una regresión nueva — es este gap de siempre. Repórtalo igual
(sigue siendo un hallazgo real) pero aclara que es preexistente para no
sobre-atribuirlo al cambio que se está auditando en ese momento.
