# Ilustraciones originales (no se despliegan)

Este directorio guarda las láminas **tal como las entregó el estudio**: PNG grandes,
con fondo blanco opaco y sin recortar. Vive fuera de `public/` y de `src/assets/` a
propósito: nada de lo que hay aquí se copia a `dist/` ni pasa por `astro:assets`. Es
solo la entrada de `scripts/prepare-yumbo-assets.mjs`, que genera los WebP con alfa
que el sitio sí usa, en `src/assets/images/yumbo/`.

Mismo criterio que `fonts-src/`: el fuente pesado se versiona una vez para que el
resultado se pueda regenerar; lo que se publica es la versión procesada.

## `yumbo/`

Las tres láminas de los hitos de Yumbo, más el ensayo de uniforme del que salieron.

> **Ojo:** ese uniforme fue un **prototipo de ensayo que el club no adoptó**. El
> uniforme real no lleva estos elementos y ningún texto del sitio puede decir que sí.
> Las láminas se quedaron porque sirven por sí solas, no por el uniforme.

| Archivo | Qué es |
|---|---|
| `cerro-yumbo.png` | El cerro con el letrero blanco y las torres de alta tensión |
| `monumento-trabajo.png` | El monumento de las manos de piedra con los engranajes |
| `iglesia-yumbo.png` | La fachada de ladrillo con las dos torres y el reloj |

Cada pie de la web se apoya en una fuente pública anotada en `source`, dentro de
`src/lib/yumbo.ts`. La guía de uso está en `docs/04-sistema-editorial.md` §2.7.
