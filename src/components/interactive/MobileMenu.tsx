import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { CTA_TRIAL_LABEL } from '@lib/constants';
import { isActivePath } from '@lib/navigation';

interface NavItem {
  label: string;
  href: string;
}

interface Props {
  navItems: NavItem[];
  secondaryNavItems: NavItem[];
  currentPath: string;
}

export default function MobileMenu({ navItems, secondaryNavItems, currentPath }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const themeToggleRef = useRef<HTMLButtonElement>(null);

  // SSR-safe mount detection for portal
  useEffect(() => {
    setMounted(true);
  }, []);

  // El botón de tema del drawer sale del servidor con `aria-pressed="false"`
  // literal, igual que `ThemeToggle.astro` (decisión C del spec de UX): así
  // coincide con el SSR y con lo que ya corrige el script inline de
  // `BaseLayout` antes del primer paint. Pero ese script corre antes de que
  // este portal exista (depende de `mounted`), así que el botón puede quedar
  // con el valor al revés hasta el próximo `astro:page-load`. Este efecto lo
  // corrige una sola vez, apenas el botón aparece en el DOM, leyendo el
  // `data-theme` real de `<html>`. A partir de ahí, `aria-pressed` queda por
  // completo a cargo del script global (delegación de clic + `astro:page-load`
  // + `astro:after-swap`): si en cambio lo controlara un estado de React,
  // cada re-render de este componente (p. ej. al abrir o cerrar el menú)
  // pisaría lo que el script global acabara de escribir en el DOM real.
  useEffect(() => {
    if (!mounted || !themeToggleRef.current) return;
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    themeToggleRef.current.setAttribute('aria-pressed', isDark ? 'true' : 'false');
  }, [mounted]);

  const close = useCallback(() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, close]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close menu before View Transitions to prevent orphaned portal nodes
  useEffect(() => {
    const handleTransition = () => setIsOpen(false);
    document.addEventListener('astro:before-preparation', handleTransition);
    return () => document.removeEventListener('astro:before-preparation', handleTransition);
  }, []);

  // Focus trap
  useEffect(() => {
    if (!isOpen || !menuRef.current) return;
    const focusable = menuRef.current.querySelectorAll<HTMLElement>(
      'a[href], button, [tabindex]:not([tabindex="-1"])',
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
  }, [isOpen]);

  // Misma regla que la cabecera de escritorio, escrita una sola vez.
  const isActive = (href: string) => isActivePath(currentPath, href);

  return (
    <>
      {/* Hamburger button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Abrir menú de navegación"
        className="text-text-secondary hover:bg-surface-tint hover:text-primary-deep focus-visible:outline-primary inline-flex items-center justify-center rounded-md p-2.5 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
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
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay + Drawer rendered via portal to escape header stacking context */}
      {mounted &&
        createPortal(
          <>
            {/* Overlay */}
            {isOpen && (
              <div
                className="ease-spring fixed inset-0 z-40 bg-black/50 transition-opacity duration-[var(--duration-micro)] motion-reduce:transition-none starting:opacity-0"
                onClick={close}
                aria-hidden="true"
              />
            )}

            {/* Drawer: desliza por el mismo mecanismo de siempre (translate-x-full/0 vía
              clase condicional, no montaje condicional), solo con el vocabulario de
              motion del plan — ease-spring y duration-micro en vez de ease-in-out/300ms. */}
            <div
              ref={menuRef}
              id="mobile-menu"
              role="dialog"
              aria-modal="true"
              aria-label="Menú de navegación"
              className={`bg-surface-raised ease-spring fixed top-0 right-0 z-50 flex h-full w-72 max-w-[85vw] transform flex-col shadow-xl transition-transform duration-[var(--duration-micro)] motion-reduce:transition-none ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
              {/* Close button */}
              <div className="border-hairline flex shrink-0 items-center justify-between border-b p-4">
                <span className="font-display text-primary-deep font-bold">Menú</span>
                <button
                  onClick={close}
                  aria-label="Cerrar menú"
                  className="text-text-secondary hover:bg-surface-tint hover:text-primary-deep focus-visible:outline-primary rounded-md p-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
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
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto p-4" aria-label="Navegación móvil">
                <ul className="space-y-1">
                  {navItems.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={close}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        className={`block rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                          isActive(item.href)
                            ? 'bg-primary/10 text-primary-deep font-semibold'
                            : 'text-text-secondary hover:bg-surface-tint hover:text-primary-deep'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>

                <hr className="border-hairline my-4" />

                <ul className="space-y-1">
                  {secondaryNavItems.map((item) => (
                    <li key={item.href}>
                      <a
                        href={item.href}
                        onClick={close}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        className={`block rounded-md px-3 py-3 text-sm transition-colors ${
                          isActive(item.href)
                            ? 'text-primary-deep font-semibold'
                            : 'text-text-secondary hover:bg-surface-tint hover:text-primary-deep'
                        }`}
                      >
                        {item.label}
                      </a>
                    </li>
                  ))}
                </ul>

                <div className="mt-6">
                  {/*
                  El CTA del header ya no está oculto en móvil, pero este sigue siendo el que
                  ve quien abre el menú, y el 82% del tráfico llega desde móvil. Dice lo mismo
                  que el resto del sitio (`CTA_TRIAL_LABEL`): el botón se llamaba
                  "Preinscríbete" aquí y "Clase de prueba gratis" en hero y banners, así que
                  `cta_inscripcion_click` mezclaba dos promesas distintas.

                  El `data-analytics-event` funciona pese al portal: el listener de
                  `Analytics.astro` es un `click` delegado en `document` con `closest()`, y el
                  drawer se monta en `document.body`, dentro del árbol que ese listener observa.
                  Sin el atributo, el clic no se ve y el evento queda en cero — es justo lo que
                  pasó entre mayo y agosto de 2026.
                */}
                  <a
                    href="/inscripciones"
                    onClick={close}
                    data-analytics-event="cta_inscripcion_click"
                    className="bg-accent text-surface-dark hover:bg-accent-dark focus-visible:outline-accent flex w-full items-center justify-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {CTA_TRIAL_LABEL}
                  </a>
                </div>

                <hr className="border-hairline my-4" />

                {/*
                Interruptor de tema, solo bajo `sm` (`sm:hidden`): desde `sm` el
                equivalente ya vive en `Header.astro`, entre el buscador y el CTA.
                Va después del botón de cerrar (no le roba el foco inicial al
                focus trap) y después del CTA (no compite con la conversión) —
                decisión B del spec de UX.

                Nombre accesible fijo "Modo oscuro" tomado del texto visible, sin
                `aria-label`: es un interruptor de una sola propiedad binaria y un
                nombre dinámico rompería WCAG 2.5.3 contra la etiqueta visible
                (decisión C). Los iconos muestran el destino del clic, no el
                estado actual (decisión D): luna en claro, sol en oscuro, vía
                `dark:hidden`/`dark:block` — sin `astro-icon` aquí, así que son los
                `path` de Phosphor `bold` (moon/sun) copiados como SVG inline,
                igual que ya se hace con la hamburguesa y la equis de este mismo
                componente.

                Sin handler de clic propio: lo captura por delegación el script
                de `BaseLayout` (mismo `data-theme-toggle` que el toggle de
                cabecera). El `aria-pressed` inicial se corrige una sola vez en
                el efecto de arriba; después queda a cargo de ese script.
              */}
                <button
                  type="button"
                  ref={themeToggleRef}
                  data-theme-toggle
                  aria-pressed="false"
                  className="text-text-secondary hover:bg-surface-tint hover:text-primary-deep focus-visible:outline-primary dark:bg-primary/10 dark:text-primary-deep flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 sm:hidden"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 256"
                    fill="currentColor"
                    aria-hidden="true"
                    className="size-[18px] dark:hidden"
                  >
                    <path d="M236.37 139.4a12 12 0 0 0-12-3A84.07 84.07 0 0 1 119.6 31.59a12 12 0 0 0-15-15a108.86 108.86 0 0 0-54.91 38.48A108 108 0 0 0 136 228a107.1 107.1 0 0 0 64.93-21.69a108.86 108.86 0 0 0 38.44-54.94a12 12 0 0 0-3-11.97m-49.88 47.74A84 84 0 0 1 68.86 69.51a84.9 84.9 0 0 1 23.41-21.22Q92 52.13 92 56a108.12 108.12 0 0 0 108 108q3.87 0 7.71-.27a84.8 84.8 0 0 1-21.22 23.41" />
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 256 256"
                    fill="currentColor"
                    aria-hidden="true"
                    className="hidden size-[18px] dark:block"
                  >
                    <path d="M116 36V20a12 12 0 0 1 24 0v16a12 12 0 0 1-24 0m80 92a68 68 0 1 1-68-68a68.07 68.07 0 0 1 68 68m-24 0a44 44 0 1 0-44 44a44.05 44.05 0 0 0 44-44M51.51 68.49a12 12 0 1 0 17-17l-12-12a12 12 0 0 0-17 17Zm0 119l-12 12a12 12 0 0 0 17 17l12-12a12 12 0 1 0-17-17M196 72a12 12 0 0 0 8.49-3.51l12-12a12 12 0 0 0-17-17l-12 12A12 12 0 0 0 196 72m8.49 115.51a12 12 0 0 0-17 17l12 12a12 12 0 0 0 17-17ZM48 128a12 12 0 0 0-12-12H20a12 12 0 0 0 0 24h16a12 12 0 0 0 12-12m80 80a12 12 0 0 0-12 12v16a12 12 0 0 0 24 0v-16a12 12 0 0 0-12-12m108-92h-16a12 12 0 0 0 0 24h16a12 12 0 0 0 0-24" />
                  </svg>
                  Modo oscuro
                </button>
              </nav>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
