# Fuentes completas (no se despliegan)

Este directorio guarda las fuentes **sin subsetear**. Vive fuera de `public/`
a propósito: nada de lo que hay aquí se copia a `dist/` ni se sirve. Solo es la
entrada de `scripts/subset-fonts.sh`, que genera los subsets `-latin` que sí se
publican en `public/fonts/`.

| Archivo | Familia | Ejes | Licencia |
|---|---|---|---|
| `InterVariable.woff2` | Inter Variable | `opsz` 14–32, `wght` 100–900 | SIL Open Font License 1.1 |
| `PlusJakartaSans[wght].ttf` | Plus Jakarta Sans | `wght` 200–800 | SIL Open Font License 1.1 |

`PlusJakartaSans[wght].ttf` se tomó del repositorio oficial de Google Fonts
(`google/fonts`, `ofl/plusjakartasans/`).

## Por qué existe este directorio

El archivo que el sitio servía antes como `public/fonts/PlusJakartaSans-Variable.woff2`
no era una fuente: era la página HTML de error 404 de GitHub (305 KB) guardada
con extensión `.woff2`. El navegador la descargaba en todas las páginas, la
descartaba por inválida y pintaba los títulos con el `system-ui` del fallback.
Guardar aquí las fuentes de verdad permite regenerar los subsets sin depender
de la red y deja constancia de su origen.

## Regenerar los subsets

```bash
python3 -m pip install fonttools brotli   # brotli habilita el flavor woff2
./scripts/subset-fonts.sh
```

Si agregas al contenido un carácter fuera del rango actual, actualiza
`$UNICODES` en el script **y** el `unicode-range` de los dos `@font-face` de
`src/styles/global.css`. `src/test/fonts.test.ts` verifica que ambos sigan
alineados y que los archivos servidos sean WOFF2 reales.
