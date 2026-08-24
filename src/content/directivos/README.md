# Directivos y staff (`directivos`)

El equipo **adulto** del club: junta directiva y cuerpo técnico. De aquí sale la página
`/equipo` (`src/pages/equipo/index.astro`, lógica en `src/lib/staff.ts`).

- El loader de la colección (`src/content.config.ts`) carga `**/*.md` **excluyendo este
  README**, así que este archivo no entra a la colección.
- El schema Zod vive en `src/lib/schemas.ts` (`directivosSchema`) y el formulario del CMS,
  en `public/admin/config.yml` (colección "Directivos y Staff"). Si cambia un campo, se
  cambian los tres.
- **Sin fichas, la página no pinta tarjetas ni cifras.** Es la regla del sistema editorial:
  si el dato no existe, el bloque no existe (`docs/04-sistema-editorial.md`). `/equipo` se
  construye igual, con la entrada y el paso siguiente.

## Solo personas mayores de edad

Los deportistas del club son niños y jóvenes: **sus perfiles no se publican**. Esta
colección es únicamente para adultos con un rol en el club — mismo criterio que ya aplican
los `tags` de las crónicas (§20) y el tablero de la temporada (§26).

## La página está oculta a propósito

`/equipo` existe y se construye, pero hoy **no es pública**: no está en el menú
(`NAV_ITEMS` en `src/lib/constants.ts`), lleva `noindex` y está excluida del sitemap
(`astro.config.mjs`). El club todavía no tiene firmadas las autorizaciones de uso de
imagen. Antes de cargar una foto hay que tener la autorización de esa persona; mientras
tanto se puede cargar la ficha sin `photo`, o dejarla en `draft: true`.

## Nombre del archivo

Kebab-case, sin acentos, con el nombre de la persona.

```
maria-lopez.md
juan-perez.md
```

## Ejemplo completo

```markdown
---
# Nombre completo, como lo publica el club.
name: Nombre Apellido

# Foto opcional. Solo con autorización de imagen firmada.
# La sube el CMS a src/assets/images/directivos.
photo: /src/assets/images/directivos/nombre-apellido.webp

# Rol del catálogo cerrado del schema. Decide en qué bloque de la página aparece:
# presidente | vicepresidente | secretario | tesorero | fiscal | vocal  → junta directiva
# entrenador-principal | entrenador | preparador-fisico | mecanico | medico | coordinador
#   → cuerpo técnico
role: entrenador-principal

# Cargo tal como se lee en la tarjeta. Es texto libre: el `role` agrupa, este rotula.
roleLabel: Director Técnico

# Opcional. Dos o tres líneas, en español, sobre su trayectoria en el club.
bio: Dirige los entrenamientos de la escuela desde la primera temporada.

# Opcionales. Solo datos de contacto institucionales, nunca personales de un menor.
email: contacto@ejemplo.org
phone: "+57 300 000 0000"

# Opcionales.
socialMedia:
  instagram: https://www.instagram.com/usuario/
  strava: https://www.strava.com/athletes/000000

# Credenciales verificables. Se pintan como chips en la tarjeta; si la lista está
# vacía, el bloque de credenciales no se pinta.
certifications:
  - Licencia de entrenador UCI nivel 1
  - Primeros auxilios vigente

# Opcional. Año de ingreso al club: alimenta "En el club desde" y la cifra
# "Acompañando desde" de la cabecera.
yearJoined: 2018

# Publicación. `active: false` retira a alguien que ya no está en el club sin
# borrar su ficha; `draft: true` deja la ficha guardada sin publicarla.
active: true
draft: false

# Orden dentro de su bloque. A igualdad, se ordena alfabéticamente.
order: 1
---

Texto largo opcional. Hoy ninguna vista lo pinta.
```

## Cómo se usa cada campo en `/equipo`

| Campo | Para qué |
|-------|----------|
| `name` | Titular de la tarjeta |
| `role` | Agrupa la ficha en junta directiva o cuerpo técnico (`src/lib/staff.ts`) |
| `roleLabel` | El cargo que se lee bajo el nombre |
| `photo` | Retrato de la tarjeta; sin él se pinta un icono neutro |
| `bio` | Párrafo de la tarjeta |
| `certifications` | Chips de credenciales y la cifra "Credenciales declaradas" |
| `yearJoined` | "En el club desde" y la cifra "Acompañando desde" |
| `active` / `draft` | Filtro de publicación |
| `order` | Orden dentro del bloque |

`email`, `phone` y `socialMedia` no se pintan hoy en ninguna vista: son el registro
interno del club.
