"""Captura la maqueta a 1440 y 390 px: primera pantalla, página entera y cortes de 1800 px CSS para revisarla.

Uso: python3 -I capturar_maqueta.py <carpeta_maqueta> <prefijo>
"""
import sys
import time
from pathlib import Path

from PIL import Image
from playwright.sync_api import sync_playwright

base = Path(sys.argv[1])
prefijo = sys.argv[2] if len(sys.argv) > 2 else 'maqueta'
out = base / 'capturas'
out.mkdir(exist_ok=True)
url = (base / 'index.html').as_uri()

VISTAS = {
    'escritorio': dict(viewport={'width': 1440, 'height': 900}, device_scale_factor=1),
    'movil': dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True),
}

with sync_playwright() as p:
    nav = p.chromium.launch()
    for nombre, opts in VISTAS.items():
        ctx = nav.new_context(**opts)
        page = ctx.new_page()
        page.goto(url, wait_until='networkidle')
        alto = page.evaluate('document.documentElement.scrollHeight')
        for y in range(0, alto, 700):
            page.evaluate(f'window.scrollTo(0, {y})')
            time.sleep(0.05)
        page.evaluate('window.scrollTo(0, 0)')
        page.evaluate('document.fonts.ready')
        time.sleep(0.6)
        page.screenshot(path=str(out / f'{prefijo}-{nombre}-primera-pantalla.png'))
        entera = out / f'{prefijo}-{nombre}-entera.png'
        page.screenshot(path=str(entera), full_page=True)
        im = Image.open(entera)
        dsf = opts['device_scale_factor']
        paso = 1800 * dsf
        for i, y in enumerate(range(0, im.height, paso)):
            im.crop((0, y, im.width, min(im.height, y + paso))).save(out / f'{prefijo}-{nombre}-{i + 1:02d}.png')
        print(nombre, 'alto', im.height // dsf, 'px CSS,', (im.height + paso - 1) // paso, 'cortes')
        ctx.close()
    nav.close()
