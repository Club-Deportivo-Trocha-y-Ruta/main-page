"""¿Algún texto queda tapado? Recorre /copa-valle-yumbo-2026 de arriba abajo y, para cada elemento con texto
propio que esté en pantalla, mira qué elemento hay encima de su centro y de sus dos puntas (`elementFromPoint`).
Si es otro elemento que no lo contiene ni está dentro de él, el texto está tapado.

Se ignoran la cabecera fija, el índice flotante y la barra de filtros fija de la galería (tapan al pasar por
encima mientras se baja: es su trabajo), y lo que es solo para lector de pantalla (`sr-only`).

Uso: python3 -I tapados.py <base_url> [ancho alto ...]
"""
import sys
import time

from playwright.sync_api import sync_playwright

base = sys.argv[1]
sizes = [tuple(map(int, s.split('x'))) for s in sys.argv[2:]] or [(1440, 900), (1024, 768), (768, 1024), (390, 844), (360, 740)]

CHECK_JS = r"""
() => {
  const vh = innerHeight, vw = innerWidth;
  const ignored = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const cs = getComputedStyle(p);
      if (cs.position === 'fixed' || cs.position === 'sticky') return true;
      if (p.matches && (p.matches('[data-sdock]') || p.matches('header'))) return true;
    }
    return false;
  };
  const found = [];
  for (const el of document.querySelectorAll('main *')) {
    if (el.closest('.sr-only')) continue;
    // Lo que está dentro de un desplegable cerrado no se ve (no es texto tapado).
    const closed = el.closest('details:not([open])');
    if (closed && !el.closest('summary')) continue;
    const own = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!own) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
    if (ignored(el)) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 4 || r.height < 4) continue;
    if (r.top < 70 || r.bottom > vh - 70) continue;  // solo lo que está entero en la franja central
    const pts = [[r.left + r.width / 2, r.top + r.height / 2], [r.left + 3, r.top + r.height / 2], [r.right - 3, r.top + r.height / 2]];
    for (const [x, y] of pts) {
      if (x < 0 || x > vw) continue;
      const hit = document.elementFromPoint(x, y);
      if (!hit || hit === el || el.contains(hit) || hit.contains(el)) continue;
      if (ignored(hit)) continue;
      found.push({ texto: el.textContent.trim().slice(0, 50), tapadoPor: hit.tagName + '.' + String(hit.className).slice(0, 60) });
      break;
    }
  }
  return found;
}
"""

with sync_playwright() as p:
    browser = p.chromium.launch()
    for w, h in sizes:
        mobile = w < 700
        ctx = browser.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2 if mobile else 1,
                                  is_mobile=mobile, has_touch=mobile)
        page = ctx.new_page()
        page.goto(f'{base}/copa-valle-yumbo-2026/', wait_until='networkidle')
        close = page.query_selector('button[aria-label="Cerrar anuncio"]')
        if close and close.is_visible():
            close.click()
            time.sleep(0.2)
        total = page.evaluate('document.documentElement.scrollHeight')
        problems = {}
        y = 0
        while y < total:
            page.evaluate(f'window.scrollTo(0, {y})')
            time.sleep(0.25)
            for item in page.evaluate(CHECK_JS):
                problems.setdefault(item['texto'], item['tapadoPor'])
            y += max(200, h - 200)
            total = page.evaluate('document.documentElement.scrollHeight')
        print(f'{w}x{h}: {len(problems)} textos tapados')
        for text, by in list(problems.items())[:12]:
            print('   ·', repr(text), '→', by)
        ctx.close()
    browser.close()
