---
name: project-plan-animaciones
description: Estado de la auditoría QA del plan docs/06-plan-animaciones.md (animaciones estilo Duolingo), fase por fase
metadata:
  type: project
---

`docs/06-plan-animaciones.md` define 5 fases de micro-interacciones (tokens de
motion, botón físico, stepper de inscripción, view transitions, deleite
editorial, mascota opcional). Regla innegociable del plan: solo se anima
`transform`/`opacity`, todo bajo `prefers-reduced-motion: no-preference` o
neutralizado con `motion-reduce:*`, cero JS nuevo fuera de los 6 islands,
nombres de tokens propios (nunca pisar la escala default de Tailwind 4).

**Fase 1 (Tarea 3, QA) — auditada 2026-08-22, APROBADA sin bloqueantes.**
Alcance: `--ease-spring`/`--ease-pop`/`--duration-micro`(200ms)/`--duration-celebration`(500ms)
en `@theme`, y el botón "físico" de `Button.astro` (`--shadow-pressable` con
`--btn-shadow-color` por variante, `hover:-translate-y-px active:translate-y-1
active:shadow-none`, `motion-reduce:*`).

Hallazgos relevantes de esa auditoría (no bloqueantes, quedaron como nota/advertencia):
- Se removió `transition-colors duration-200` de las clases base del botón sin
  reemplazo — el cambio de color en hover ahora es instantáneo (antes hacía
  fade de 200ms). Es más estricto con la regla "solo transform/opacity" del
  plan, pero es un cambio de comportamiento visible; confirmar que fue
  intencional antes de repetir el patrón en otros componentes.
- Verificado con el compilador de Tailwind 4 en aislado (no `npm run build`):
  el orden de cascada entre `:hover` y `:active` con igual especificidad
  resuelve a favor de `:active` (viene después en el output porque Tailwind
  registra `active` después de `hover` en su orden fijo de variantes) — por
  eso el botón baja al presionar en vez de quedarse arriba por el hover. Es
  correcto, pero depende del orden interno del framework, no de una regla CSS
  explícita — si algún día se reemplaza `hover:`/`active:` por una variante
  custom, hay que re-verificar este orden.
- Ver [[a11y-preexisting-gaps]] para los hallazgos de contraste que NO son de
  esta fase.

**Gate 14, mitad de RENDIMIENTO — auditada 2026-08-22, SIN regresión.**
Las 12 tareas (Fases 1–4) se auditaron contra `HEAD` construido en un worktree
aparte. Veredicto: ninguna métrica empeoró de forma medible (LCP, CLS, INP,
long tasks y Lighthouse quedan iguales dentro del ruido); el peso sube ~929 B
gz de CSS global y entre +116 B y +999 B gz de JS inicial según la página. El
detalle largo, con cifras, quedó escrito en la sección "Notas acumuladas para
el gate 14" de `docs/06-plan-animaciones.md` — leer ahí antes de re-medir.
Lo único que impide firmar el gate como está redactado es que el criterio
"Lighthouse ≥95" nunca se ha cumplido en este proyecto: ver
[[perf-budget-reality]]. Los dos hallazgos accionables que dejó esta auditoría
son el CSS en línea que `transition:name` inyecta por tarjeta (hasta +69 KB
crudos en `/trocha-verde`) y el overshoot de `--ease-spring` aplicado a
`height` en el acordeón FAQ. Herramientas y trampas de medición:
[[qa-tooling-headless]].

**Siguiente en el plan**: Tarea 4 (stepper `InscriptionForm.tsx` + bloque
`if-*` en `global.css`) ya está implementada en el working tree (`[x]` en el
plan) pero fuera del alcance de la auditoría de Fase 1 — el bloque `if-*` se
revisó de pasada (está correctamente encapsulado en
`@media (prefers-reduced-motion: no-preference)`, checkmark cae a trazo
sólido sin la preferencia) pero el componente React no se auditó a fondo.
Tarea 5 (`[ ]` shake/pop de validación) es la siguiente pendiente formal de
Fase 2. El gate final de cada fase es la Tarea 14 (Lighthouse ≥95, CLS<0.05,
INP<200ms, barrido reduced-motion) — cuando se llegue ahí, retomar desde este
resumen en vez de re-auditar Fase 1 desde cero.
