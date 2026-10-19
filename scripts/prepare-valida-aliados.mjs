/**
 * Prepara los logos de los aliados de la VI Válida Copa Valle (Yumbo, 18-oct-2026)
 * para la página del evento.
 *
 * Entrada: el `logo.png` limpio de cada marca en
 * `claudedocs/valida-yumbo-2026/marcas/<id>/` (lo genera
 * `claudedocs/valida-yumbo-2026/piezas/03-aliados/build.py`).
 * Salida: `public/images/valida-yumbo-2026/aliados/<id>.webp`, con alfa,
 * recortado al contenido (`trim`) y encajado en una caja de 640×400 sin
 * agrandar (Croki Plátano llegó a 150 px y se queda así: ampliarlo solo lo
 * vuelve borroso). Y `<id>-320.webp`, la misma imagen en una caja de 320×200
 * (calidad 80): la franja de la página pinta los logos a menos de 130 px CSS y
 * con la grande bajaba 446 KB para eso; con la chica, unos 180 KB los 16. Las
 * dos van en el `srcset` (`allyLogoSources` en `src/lib/valida.ts`).
 *
 * Además escribe en `src/data/valida-yumbo-2026/aliados.json` el `logoRatio`
 * (ancho ÷ alto) de cada logo. El muro de aliados lo usa para igualar el
 * **área** de los logos, no la caja: en una caja fija un logo apaisado llena
 * el ancho y uno cuadrado queda chico, y en un muro de «todos iguales» el
 * chico se lee como el aliado menor.
 *
 * Los ids y el orden salen del JSON, que es la fuente que lee la página: si
 * una marca está en el JSON y no tiene logo, el script falla en vez de dejar
 * una tarjeta vacía.
 *
 * Uso:  node scripts/prepare-valida-aliados.mjs
 */
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const SRC_DIR = path.resolve('claudedocs/valida-yumbo-2026/marcas');
const OUT_DIR = path.resolve('public/images/valida-yumbo-2026/aliados');
const DATA = path.resolve('src/data/valida-yumbo-2026/aliados.json');

const BOX = { width: 640, height: 400 };
/** Versión chica para la franja: misma imagen, mitad de caja, calidad 80. */
const SMALL_BOX = { width: 320, height: 200 };

async function exists(file) {
  try {
    await stat(file);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const allies = JSON.parse(await readFile(DATA, 'utf8'));
  await mkdir(OUT_DIR, { recursive: true });

  for (const ally of allies) {
    const src = path.join(SRC_DIR, ally.id, 'logo.png');
    if (!(await exists(src))) {
      throw new Error(`Falta el logo limpio de «${ally.name}»: ${src}`);
    }

    const out = path.join(OUT_DIR, `${ally.id}.webp`);
    // `trim` quita el margen uniforme que algunos logos traen alrededor (sea
    // transparente o del color del fondo), para que la proporción sea la del
    // dibujo y no la del archivo.
    const info = await sharp(src)
      .trim({ threshold: 12 })
      .resize({ ...BOX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 86, alphaQuality: 92, effort: 6 })
      .toFile(out);

    ally.logoRatio = Number((info.width / info.height).toFixed(2));

    const small = await sharp(src)
      .trim({ threshold: 12 })
      .resize({ ...SMALL_BOX, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80, alphaQuality: 90, effort: 6 })
      .toFile(path.join(OUT_DIR, `${ally.id}-320.webp`));

    const size = (file) => `${file.width}×${file.height} ${Math.round(file.size / 1024)} KB`;
    console.log(
      `${ally.id.padEnd(28)} ${size(info).padEnd(16)} ratio ${ally.logoRatio}  ·  -320: ${size(small)}`,
    );
  }

  await writeFile(DATA, `${JSON.stringify(allies, null, 2)}\n`);
  console.log(`\nlogoRatio escrito en ${path.relative(process.cwd(), DATA)}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
