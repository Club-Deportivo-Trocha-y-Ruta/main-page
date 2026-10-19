"""Capturas y auditoría de /copa-valle-yumbo-2026 (antes y después del ajuste de esqueleto).

Uso: python3 -I capturar.py <base_url> <carpeta_salida> <prefijo> [--dark] [--solo-medidas]

Por cada vista (escritorio 1440×900 y celular 390×844):
- primera pantalla y una captura por sección;
- alto de cada sección y alto total;
- auditoría: textos recortados (elementos con texto cuyo contenido desborda una caja que recorta),
  elementos que se salen del ancho de la pantalla y si la búsqueda de fotos se ve en la primera
  pantalla.
Escribe <prefijo>-medidas.json con todo.
"""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

base, out_dir, prefix = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
dark = '--dark' in sys.argv
solo_medidas = '--solo-medidas' in sys.argv
out_dir.mkdir(parents=True, exist_ok=True)

SECTIONS = [
    ('01-apertura', '#inicio'),
    ('02-franja', '[data-sponsor-wall="franja"]'),
    ('03-fotos', '#fotos'),
    ('04-aliados', '#aliados'),
    ('05-resultados', '#resultados'),
    ('06-cifras', '#cifras'),
    ('07-pista', '#la-pista'),
    ('08-siguiente', '#siguiente'),
]

VIEWPORTS = {
    'escritorio': dict(viewport={'width': 1440, 'height': 900}, device_scale_factor=1),
    'movil': dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True),
}

AUDIT_JS = r"""
() => {
  const out = { clipped: [], overflowX: [], docWidth: document.documentElement.scrollWidth };
  const vw = window.innerWidth;
  const all = document.querySelectorAll('main *');
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    // Se sale del ancho de la pantalla (sin contar el carrusel de la franja ni tiras con scroll).
    if (r.right > vw + 1 || r.left < -1) {
      let p = el.parentElement, scroller = false;
      while (p) {
        const pcs = getComputedStyle(p);
        if (['auto', 'scroll', 'clip', 'hidden'].includes(pcs.overflowX)) { scroller = true; break; }
        p = p.parentElement;
      }
      if (!scroller) out.overflowX.push({ tag: el.tagName, cls: (el.className || '').toString().slice(0, 80), left: Math.round(r.left), right: Math.round(r.right) });
    }
    // Texto recortado: caja que recorta y cuyo contenido es más grande que ella.
    const clips = ['hidden', 'clip'].includes(cs.overflowX) || ['hidden', 'clip'].includes(cs.overflowY);
    const hasText = Array.from(el.childNodes).some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (clips && hasText && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
      if (!el.closest('.sr-only')) out.clipped.push({ tag: el.tagName, text: el.textContent.trim().slice(0, 60), sw: el.scrollWidth, cw: el.clientWidth, sh: el.scrollHeight, ch: el.clientHeight });
    }
  }
  out.overflowX = out.overflowX.slice(0, 15);
  out.clipped = out.clipped.slice(0, 15);
  return out;
}
"""

FOLD_JS = r"""
() => {
  const h = window.innerHeight;
  const q = (sel) => { const el = document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), visible: r.top < h && r.bottom > 0 }; };
  const buscar = Array.from(document.querySelectorAll('a')).find((a) => a.textContent.includes('Buscar mis fotos'));
  const br = buscar ? buscar.getBoundingClientRect() : null;
  const cat = document.querySelector('[data-valida-categoria]');
  const cr = cat ? cat.getBoundingClientRect() : null;
  const franja = document.querySelector('[data-sponsor-wall="franja"] img');
  const fr = franja ? franja.getBoundingClientRect() : null;
  return {
    alto: h,
    buscarMisFotos: br ? { top: Math.round(br.top), bottom: Math.round(br.bottom), dentro: br.bottom <= h } : null,
    primeraCategoria: cr ? { top: Math.round(cr.top), dentro: cr.bottom <= h } : null,
    primerLogoFranja: fr ? { top: Math.round(fr.top), dentro: fr.top < h } : null,
  };
}
"""

result = {}
with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, opts in VIEWPORTS.items():
        ctx = browser.new_context(color_scheme='dark' if dark else 'light', **opts)
        ctx.add_init_script("try { localStorage.setItem('trocha-theme', '%s'); } catch (e) {}" % ('dark' if dark else 'light'))
        page = ctx.new_page()
        page.goto(f'{base}/copa-valle-yumbo-2026/', wait_until='networkidle')
        # Cierra el aviso de «Próximo evento» si está, para medir lo mismo en las dos versiones.
        # Cierra el aviso de «Próximo evento» (lo mismo en las dos versiones).
        close = page.query_selector('button[aria-label="Cerrar anuncio"]')
        if close and close.is_visible():
            close.click()
            time.sleep(0.3)
        fold = page.evaluate(FOLD_JS)
        if not solo_medidas:
            page.screenshot(path=str(out_dir / f'{prefix}-{name}-primera-pantalla.png'))
        height = page.evaluate('document.documentElement.scrollHeight')
        y = 0
        while y < height:
            page.evaluate(f'window.scrollTo(0, {y})')
            time.sleep(0.12)
            y += 600
            height = page.evaluate('document.documentElement.scrollHeight')
        page.evaluate('window.scrollTo(0, 0)')
        time.sleep(0.6)
        sections = {}
        for label, selector in SECTIONS:
            el = page.query_selector(selector)
            if not el:
                continue
            box = el.bounding_box()
            sections[label] = round(box['height']) if box else None
            if solo_medidas:
                continue
            el.scroll_into_view_if_needed()
            time.sleep(0.35)
            # El índice flotante tapa lo que queda debajo: se oculta solo para la captura.
            page.add_style_tag(content='[data-sdock] { visibility: hidden !important; }')
            if box and box['height'] > 2600:
                top = page.evaluate(f'document.querySelector({selector!r}).getBoundingClientRect().top + window.scrollY')
                page.screenshot(path=str(out_dir / f'{prefix}-{name}-{label}.png'), full_page=True,
                                clip={'x': 0, 'y': top, 'width': opts['viewport']['width'], 'height': 2600})
            else:
                el.screenshot(path=str(out_dir / f'{prefix}-{name}-{label}.png'))
        audit = page.evaluate(AUDIT_JS)
        total = page.evaluate('document.documentElement.scrollHeight')
        result[name] = {'total': total, 'secciones': sections, 'primeraPantalla': fold, 'auditoria': audit}
        print(name, 'total', total, sections)
        print('  primera pantalla', fold)
        print('  recortados', len(audit['clipped']), 'fuera de ancho', len(audit['overflowX']), 'docWidth', audit['docWidth'])
        ctx.close()
    browser.close()

(out_dir / f'{prefix}-medidas.json').write_text(json.dumps(result, ensure_ascii=False, indent=1))
