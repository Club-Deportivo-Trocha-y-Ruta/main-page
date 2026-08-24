---
name: perf-budget-reality
description: El presupuesto de rendimiento del proyecto (Lighthouse 95+, LCP<2s, JS<50KB, transfer<500KB) NO se cumple y la causa es preexistente — fuentes sin subsetear y el runtime de React
metadata:
  type: project
---

Medido el 2026-08-22 durante el gate de rendimiento de
[[project-plan-animaciones]]. El presupuesto que declaran `CLAUDE.md` y el
plan de animaciones **no se cumple hoy**, y la causa no es ninguno de los
cambios que se estaban auditando.

Cifras (mediana de 3 corridas de Lighthouse 13.4.1, preset móvil, sobre
`npm run preview` local — NO son cifras de producción en Hostinger):

- Performance: `/` ~80, `/inscripciones` ~81, `/programas` ~77 (objetivo ≥95)
- LCP: 5–6 s en las tres (objetivo < 2.0 s)
- Transfer de la portada: ~1.16 MB (objetivo < 500 KB)
- JS de la portada: ~77.5 KB (objetivo < 50 KB)
- CLS 0 y TBT/INP holgados: esas dos sí se cumplen con margen

**Why:** los dos culpables dominantes son (1) `public/fonts/InterVariable.woff2`
(352 KB) + `PlusJakartaSans-Variable.woff2` (305 KB) — variables sin subsetear,
ambas con `<link rel=preload>`, compitiendo con el preload del hero, que es el
elemento LCP de la portada; y (2) el runtime de React (`client.*.js`, ~57 KB gz)
que baja en cualquier página con island. Ambos son anteriores a cualquier
trabajo de animación.

**How to apply:** cuando una auditoría futura mida Lighthouse y dé 75–85 en vez
de 95+, no lo reportes como regresión del cambio que estés auditando: compara
siempre contra una línea base (construir `HEAD` en un `git worktree` aparte con
`node_modules` clonado con `cp -Rc`, nunca `git stash` ni tocar el working
tree). El delta real de un cambio suele ser ±1 punto, dentro del ruido: la
varianza corrida-a-corrida en este portátil llega a 25 puntos, así que hacen
falta ≥3 corridas y reportar mediana. El backlog de verdad para acercarse al
objetivo es subsetear las dos fuentes.

Ver también [[qa-tooling-headless]] para cómo se midieron CLS/INP reales.
