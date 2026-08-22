# Resultados (`results`)

Archivo de datos de la temporada: **una válida, una categoría, un archivo**. De aquí
sale el tablero de la general que se pinta en `/noticias` (`SeasonStandings.astro`,
lógica en `src/lib/results.ts`).

- El loader de la colección (`src/content.config.ts`) solo carga `*.yaml`, `*.yml` y
  `*.json`, así que este README **no entra a la colección**.
- El schema Zod vive en `src/lib/schemas.ts` (`resultsSchema`) y el formulario del CMS,
  en `public/admin/config.yml` (colección "Resultados"). Si cambia un campo, se cambian
  los tres.
- **Sin archivos, el tablero no se pinta.** Es la regla del sistema editorial: si el dato
  no existe, el bloque no existe (`docs/04-sistema-editorial.md`).

## Una temporada a la vez

`buildStandings()` suma **todos** los archivos que encuentra: no filtra por año. Mientras
esta carpeta tenga una sola temporada, la general es la del año en curso y el rótulo
"Temporada {año}" es correcto.

**Al abrir la temporada siguiente hay que sacar los archivos del año anterior** de esta
carpeta (moverlos a un archivo histórico fuera de `src/content/results/`). Si conviven
dos años, el tablero sumaría los puntos de ambos en una sola general y la posición, el
movimiento y la línea de podio quedarían mal.

## Nombres de menores

Casi todos los corredores del club son niños. **Qué nombre se publica y con qué detalle
lo decide el club**, no la plantilla ni quien carga los datos: si hay duda sobre un
corredor, se deja fuera del archivo en vez de publicarlo y borrarlo después. Los nombres
del ejemplo de abajo son ficticios a propósito.

## Nombre del archivo

Mismo criterio que `events`: kebab-case, sin acentos, con la fecha adelante y la
categoría al final, para que una válida con varias categorías no colisione.

```
2026-03-copa-valle-ginebra-infantil-a.yml
2026-03-copa-valle-ginebra-prejuvenil-b.yml
```

## Ejemplo completo

```yaml
# Slug del evento en `src/content/events/`. Es lo que agrupa las categorías de una
# misma válida en una sola columna del tablero: dos archivos con el mismo `event`
# son la misma fecha corrida.
event: 2026-03-copa-valle-i-ginebra

# Nombre como lo publica el organizador. De aquí se deriva el nombre de la serie
# ("Copa Valle") comparando los nombres de todas las válidas cargadas.
eventName: I Válida Copa Valle 2026 - Ginebra

# Fecha de la carrera (AAAA-MM-DD). Se lee en UTC, igual que en el resto del sitio.
date: 2026-03-15

# Categoría de carrera, tal como la publica el organizador. Es texto libre, pero
# tiene que escribirse IGUAL en todas las válidas: el tablero agrupa por
# `riderName` + `category`, y "Infantil A" e "Infantil-A" serían dos corredores.
category: Infantil A

# Llegada por llegada, de la primera posición a la última.
positions:
  - position: 1
    # Slug del corredor en `src/content/riders/` (opcional; hoy ninguna vista lo usa).
    rider: ana-ejemplo
    riderName: Ana Ejemplo
    time: "0:42:15"
    # Puntos de la válida. Si falta, el tablero suma 0 por esa fecha en vez de
    # descartar al corredor: quien largó y no puntuó sigue apareciendo en la general.
    points: 40
  - position: 2
    rider: bruno-ejemplo
    riderName: Bruno Ejemplo
    time: "0:43:02"
    points: 35
  - position: 3
    riderName: Carla Ejemplo
    time: "0:44:30"
    points: 32

# Opcional: qué contar de esta carrera. Texto corto, en español.
clubHighlights: Tres corredores del club en el podio de la categoría.

# Opcional: cuántos largaron en la categoría (contexto de la victoria).
totalParticipants: 24
```

## Cómo se usa cada campo en el tablero

| Campo | Para qué |
|-------|----------|
| `event` | Agrupa las categorías en una misma válida y ordena las columnas |
| `eventName` | Deriva el nombre de la serie del titular |
| `date` | Ordena las válidas y decide cuál es "la última" |
| `category` | Agrupa la general y fija la línea de podio de cada una |
| `riderName` | Identifica al corredor dentro de su categoría |
| `points` | Total acumulado, lo sumado en la última válida y la escala del tablero |
| `position` | Desempate: con el mismo total, gana quien acumule mejores puestos |

`rider`, `time`, `clubHighlights` y `totalParticipants` no se pintan hoy en ninguna
vista. Se cargan igual: son el registro de la temporada.
