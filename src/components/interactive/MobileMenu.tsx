import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';

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

  // SSR-safe mount detection for portal
  useEffect(() => { setMounted(true); }, []);

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
    return () => { document.body.style.overflow = ''; };
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
      'a[href], button, [tabindex]:not([tabindex="-1"])'
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

  const isActive = (href: string) =>
    currentPath === href || (href !== '/' && currentPath.startsWith(href));

  return (
    <>
      {/* Hamburger button */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(true)}
        aria-expanded={isOpen}
        aria-controls="mobile-menu"
        aria-label="Abrir menú de navegación"
        className="inline-flex items-center justify-center rounded-md p-2.5 text-text-secondary hover:bg-gray-100 hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Overlay + Drawer rendered via portal to escape header stacking context */}
      {mounted && createPortal(
        <>
          {/* Overlay */}
          {isOpen && (
            <div
              className="fixed inset-0 z-40 bg-black/50 transition-opacity"
              onClick={close}
              aria-hidden="true"
            />
          )}

          {/* Drawer */}
          <div
            ref={menuRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Menú de navegación"
            className={`fixed top-0 right-0 z-50 h-full w-72 max-w-[85vw] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* Close button */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
              <span className="font-display font-bold text-primary">Menú</span>
              <button
                onClick={close}
                aria-label="Cerrar menú"
                className="rounded-md p-2 text-text-secondary hover:bg-gray-100 hover:text-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Nav items */}
            <nav className="p-4 overflow-y-auto flex-1" aria-label="Navegación móvil">
              <ul className="space-y-1">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={close}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`block rounded-md px-3 py-3 text-sm font-medium transition-colors ${
                        isActive(item.href)
                          ? 'bg-primary/10 text-primary font-semibold'
                          : 'text-text-secondary hover:bg-gray-50 hover:text-primary'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>

              <hr className="my-4 border-gray-100" />

              <ul className="space-y-1">
                {secondaryNavItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      onClick={close}
                      aria-current={isActive(item.href) ? 'page' : undefined}
                      className={`block rounded-md px-3 py-3 text-sm transition-colors ${
                        isActive(item.href)
                          ? 'text-primary font-semibold'
                          : 'text-text-secondary hover:bg-gray-50 hover:text-primary'
                      }`}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>

              <div className="mt-6">
                <a
                  href="/inscripciones"
                  onClick={close}
                  className="flex w-full items-center justify-center rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Inscríbete
                </a>
              </div>
            </nav>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
