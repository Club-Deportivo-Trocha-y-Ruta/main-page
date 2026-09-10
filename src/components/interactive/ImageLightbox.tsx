import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

interface GalleryImage {
  src: string;
  alt: string;
  caption?: string;
}

interface Props {
  images: GalleryImage[];
}

export default function ImageLightbox({ images }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const touchStartX = useRef(0);

  const isOpen = activeIndex !== null;

  // SSR-safe mount detection for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  const open = useCallback((index: number, buttonEl: HTMLButtonElement) => {
    triggerRef.current = buttonEl;
    setActiveIndex(index);
  }, []);

  const close = useCallback(() => {
    setActiveIndex(null);
    triggerRef.current?.focus();
  }, []);

  const prev = useCallback(() => {
    setActiveIndex((i) => (i !== null ? (i - 1 + images.length) % images.length : null));
  }, [images.length]);

  const next = useCallback(() => {
    setActiveIndex((i) => (i !== null ? (i + 1) % images.length : null));
  }, [images.length]);

  // Keyboard: Escape, ArrowLeft, ArrowRight
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') prev();
      else if (e.key === 'ArrowRight') next();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close, prev, next]);

  // Body scroll lock
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;
    const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
      'button, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length > 0) focusable[0].focus();

    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || !focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, activeIndex]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const delta = e.changedTouches[0].clientX - touchStartX.current;
      if (Math.abs(delta) > 50) {
        if (delta > 0) prev();
        else next();
      }
    },
    [prev, next],
  );

  const currentImage = activeIndex !== null ? images[activeIndex] : null;

  return (
    <>
      {/* Grid de thumbnails */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {images.map((img, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => open(index, e.currentTarget)}
            className="group bg-surface-muted focus-visible:outline-primary relative aspect-square cursor-pointer overflow-hidden rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={`Ver imagen: ${img.alt}`}
          >
            <img
              src={img.src}
              alt={img.alt}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            {img.caption && (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                <p className="text-sm text-white">{img.caption}</p>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Modal lightbox: entrada tipo pop (fade del overlay + fade/scale del
          visor) vía @starting-style — el nodo se monta de nuevo cada vez que
          `isOpen` pasa a true, así que no hace falta `transition-discrete`.
          Va por portal a `document.body` (mismo criterio que MobileMenu y
          SiteSearch): si se queda dentro del `<section relative isolate>` de
          SectionShell, ese `isolate` —y, aunque se quite, el
          `view-transition-name` permanente que `<main>` lleva por
          `transition:name="page-main"` (BaseLayout.astro), que por spec
          también forma contexto de apilamiento— encierran su z-50 en un
          contexto propio y el Header (`sticky z-40`, fuera de ambos) se sigue
          pintando encima, sin importar el z-index interno. */}
      {mounted &&
        isOpen &&
        currentImage &&
        createPortal(
          <div
            className="ease-spring fixed inset-0 z-50 flex items-center justify-center bg-black/90 transition-opacity duration-[var(--duration-micro)] motion-reduce:transition-none starting:opacity-0"
            onClick={(e) => {
              if (e.target === e.currentTarget) close();
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Visor de imágenes"
              className="ease-spring relative flex max-h-full max-w-full flex-col items-center px-4 py-8 transition-[opacity,scale] duration-[var(--duration-micro)] motion-reduce:transition-none md:px-16 starting:scale-95 starting:opacity-0"
            >
              {/* Close button */}
              <button
                onClick={close}
                aria-label="Cerrar visor"
                className="absolute top-2 right-2 z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:top-4 md:right-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              {/* Previous button */}
              <button
                onClick={prev}
                aria-label="Imagen anterior"
                className="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:left-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>

              {/* Full image */}
              <img
                src={currentImage.src}
                alt={currentImage.alt}
                decoding="async"
                className="max-h-[75vh] max-w-[90vw] rounded-lg object-contain md:max-h-[80vh] md:max-w-[80vw]"
              />

              {/* Next button */}
              <button
                onClick={next}
                aria-label="Imagen siguiente"
                className="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:right-4"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>

              {/* Caption + Counter */}
              <div className="mt-4 text-center">
                {currentImage.caption && (
                  <p className="mb-2 text-sm text-white">{currentImage.caption}</p>
                )}
                <p className="text-sm text-white/60">
                  {activeIndex + 1} / {images.length}
                </p>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
