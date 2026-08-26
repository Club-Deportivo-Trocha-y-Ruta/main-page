#!/usr/bin/env bash
#
# Regenera los subsets `-latin` que sirve el sitio a partir de las fuentes
# completas de `fonts-src/` (que NO se despliegan: viven fuera de `public/`).
#
# Requisitos: `pyftsubset` (fontTools) y la extension `brotli` de Python, que
# es la que habilita el flavor woff2:
#
#   python3 -m pip install fonttools brotli
#
# El `unicode-range` de `src/styles/global.css` tiene que coincidir con
# $UNICODES. Si agregas un caracter al contenido que se salga de este rango,
# actualiza los dos sitios y vuelve a correr este script.
#
# Los ejes variables se conservan a proposito (no se instancian): Inter
# mantiene `opsz` 14-32 y `wght` 100-900, Plus Jakarta Sans mantiene `wght`
# 200-800. Por eso no se pasa `--instancer` ni se fijan valores en `--text`.

set -euo pipefail

cd "$(dirname "$0")/.."

SRC_DIR="fonts-src"
OUT_DIR="public/fonts"

# Latin basico + Latin-1 Supplement + Latin Extended-A parcial + puntuacion
# general + simbolos de moneda, mas los caracteres que el sitio sí usa y que
# quedan fuera del rango latino estandar de Google Fonts:
#   U+2190-2193  flechas (el hero y las crónicas usan `→` 81 veces)
#   U+25B2/25BC  triangulos de posicion en las tablas de resultados
#   U+2605       estrella de las crónicas
UNICODES='U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0300-0301,U+0303-0304,U+0308-0309,U+0323,U+0329,U+2000-206F,U+20A0-20CF,U+2122,U+2190-2193,U+2212,U+2215,U+25B2,U+25BC,U+2605,U+FEFF,U+FFFD'

subset() {
  local src="$1" out="$2"
  local before after
  before=$(wc -c <"$src" | tr -d ' ')

  pyftsubset "$src" \
    --output-file="$out" \
    --flavor=woff2 \
    --layout-features='*' \
    --unicodes="$UNICODES"

  after=$(wc -c <"$out" | tr -d ' ')
  printf '%-38s %8s B -> %8s B  (-%d%%)\n' \
    "$(basename "$out")" "$before" "$after" \
    "$(((before - after) * 100 / before))"
}

subset "$SRC_DIR/InterVariable.woff2" "$OUT_DIR/InterVariable-latin.woff2"
subset "$SRC_DIR/PlusJakartaSans[wght].ttf" "$OUT_DIR/PlusJakartaSans-Variable-latin.woff2"
