"""Capturas del estado actual de /copa-valle-yumbo-2026, sección por sección.

Uso: python3 -I capture.py <base_url> <carpeta_salida> <prefijo> [--dark]
"""
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

base, out_dir, prefix = sys.argv[1], Path(sys.argv[2]), sys.argv[3]
dark = '--dark' in sys.argv
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
    ('09-pie', 'footer'),
]

VIEWPORTS = {
    'escritorio': dict(viewport={'width': 1440, 'height': 900}, device_scale_factor=1),
    'movil': dict(
        viewport={'width': 390, 'height': 844},
        device_scale_factor=2,
        is_mobile=True,
        has_touch=True,
    ),
}

with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, opts in VIEWPORTS.items():
        ctx = browser.new_context(color_scheme='dark' if dark else 'light', **opts)
        page = ctx.new_page()
        page.goto(f'{base}/copa-valle-yumbo-2026/', wait_until='networkidle')
        # Recorre la página para disparar lazy-load, reveal e islas client:visible.
        height = page.evaluate('document.documentElement.scrollHeight')
        y = 0
        while y < height:
            page.evaluate(f'window.scrollTo(0, {y})')
            time.sleep(0.15)
            y += 600
            height = page.evaluate('document.documentElement.scrollHeight')
        page.evaluate('window.scrollTo(0, 0)')
        time.sleep(0.8)
        page.screenshot(path=str(out_dir / f'{prefix}-{name}-primera-pantalla.png'))
        for label, selector in SECTIONS:
            el = page.query_selector(selector)
            if not el:
                print('sin', label)
                continue
            el.scroll_into_view_if_needed()
            time.sleep(0.4)
            box = el.bounding_box()
            print(name, label, int(box['height']) if box else None)
            # Secciones muy altas (la galería): solo los primeros 2400 px CSS.
            if box and box['height'] > 2400:
                page.evaluate(f'window.scrollTo(0, {box["y"] + page.evaluate("window.scrollY")})')
                time.sleep(0.4)
                full = page.evaluate('document.documentElement.scrollHeight')
                page.screenshot(
                    path=str(out_dir / f'{prefix}-{name}-{label}.png'),
                    full_page=True,
                    clip={'x': 0, 'y': page.evaluate(f'document.querySelector({selector!r}).getBoundingClientRect().top + window.scrollY'), 'width': opts['viewport']['width'], 'height': 2400},
                )
            else:
                el.screenshot(path=str(out_dir / f'{prefix}-{name}-{label}.png'))
        total = page.evaluate('document.documentElement.scrollHeight')
        print(name, 'alto total', total)
        ctx.close()
    browser.close()
