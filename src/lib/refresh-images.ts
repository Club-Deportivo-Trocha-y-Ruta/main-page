/**
 * Resuelve las fotos curadas del refresh visual (`src/assets/images/refresh/`)
 * a partir del nombre de archivo que viene en el frontmatter.
 *
 * Se usa un glob eager en vez de imports sueltos para que los editores del CMS
 * puedan cambiar la foto de un programa escribiendo solo el nombre del archivo,
 * sin tocar código.
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/refresh/*.{webp,jpg,jpeg,png,avif}',
  { eager: true }
);

export function getRefreshImage(file?: string): ImageMetadata | undefined {
  if (!file) return undefined;
  return modules[`/src/assets/images/refresh/${file}`]?.default;
}
