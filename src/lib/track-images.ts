/**
 * Resuelve las fotos de los obstáculos de la pista a partir del nombre de
 * archivo del frontmatter (`image`), igual que `refresh-images.ts` con las
 * fotos del refresh visual.
 *
 * Glob eager en vez de imports sueltos para que un editor del CMS pueda
 * cambiar la foto escribiendo solo el nombre del archivo. Al pasar por
 * `astro:assets`, la foto sale en WebP responsive y con dimensiones
 * explícitas (cero CLS).
 */
const modules = import.meta.glob<{ default: ImageMetadata }>(
  '/src/assets/images/la-pista/*.{webp,jpg,jpeg,png,avif}',
  { eager: true },
);

export function getTrackImage(file?: string): ImageMetadata | undefined {
  if (!file) return undefined;
  return modules[`/src/assets/images/la-pista/${file}`]?.default;
}
