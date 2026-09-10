# Obstáculos de la pista

Una ficha por obstáculo de la Pista de Ciclomontañismo Carlos Castro. Alimentan
`/la-pista` (plan en `docs/07-plan-la-pista.md`). El schema vive en
`src/lib/schemas.ts` (`obstaculosSchema`) y el mismo formulario está en el CMS
(`public/admin/config.yml`, colección "La pista — obstáculos"): al cambiar un
campo se cambian los tres (schema, config.yml y los `.md`).

Este README queda fuera del loader (`!README.md` en `src/content.config.ts`).

## Formato

```md
---
name: "Cajón de grava de la bajada"
type: "cajon-grava"          # cajon-grava | rock-garden | drop | escalon | tabla | doble | peralte | bajada-tecnica | raiz
level: "intermedio"          # basico | intermedio | avanzado
summary: "Un escalón relleno de grava al final de una bajada: enseña a mantener el peso atrás y la mirada adelante."
skills: ["Posición de ataque", "Peso atrás en bajada", "Lectura de línea"]
programs: ["formacion-juvenil", "alto-rendimiento"]   # slugs de src/content/programs/
builtOn: 2026-08-15
builtBy: "Club Deportivo Trocha y Ruta"
# Opcional: fotogramas del flipbook, en src/assets/images/la-pista/<folder>/01.jpg…
sequence:
  folder: "cajon-grava-bajada"
  count: 10
  poster: 6
  alt: "Corredora del club pasa rodando el cajón de grava con el peso atrás"
# Opcional: clip completo (solo enlace, nunca iframe)
video:
  url: "https://youtu.be/XXXXXXXXXXX"
  title: "Pasando el cajón de grava — entrenamiento técnico"
map: { x: 62, y: 34 }        # % sobre el viewBox del mapa
order: 1
---

Capa pedagógica: 2–4 párrafos del entrenador — qué se aprende, cómo se progresa
y qué supervisa él mientras el niño lo pasa.
```

## Antes de publicar

- **Consentimiento de imagen firmado** de todo menor identificable en las fotos
  o el clip (Ley 1098). Sin firma no se sube el material.
- `programs` debe apuntar a slugs que existan: `programsUsingTrack()` revienta el
  build con un mensaje claro si uno no resuelve.
- Nada de cifras sin fuente: el desnivel y la distancia de la pista salen del
  GPX (`src/data/la-pista.gpx`), no de una estimación.
