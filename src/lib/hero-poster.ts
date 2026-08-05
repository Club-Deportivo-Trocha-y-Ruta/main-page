import { getImage } from 'astro:assets';
import heroPosterSource from '@assets/images/hero-poster.jpg';

/**
 * Poster del hero procesado por astro:assets (WebP).
 *
 * Se resuelve desde un único lugar para que el `<link rel="preload">` del
 * BaseLayout y el `<img>` del Hero apunten exactamente al mismo archivo
 * hasheado. Si las opciones difieren, Astro genera dos assets distintos y el
 * preload deja de servir de nada.
 *
 * La copia original en `public/images/hero-poster.jpg` se conserva porque la
 * imagen OG por defecto (`seo.ts`) necesita una URL estable y absoluta.
 */
export function getHeroPoster() {
  return getImage({
    src: heroPosterSource,
    format: 'webp',
    quality: 72,
    width: 1280,
    height: 720,
  });
}
