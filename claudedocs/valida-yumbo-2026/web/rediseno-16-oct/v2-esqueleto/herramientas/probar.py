"""Pruebas de comportamiento del ajuste: categorías de la apertura → galería filtrada, en escritorio y celular,
y auditoría de textos recortados o fuera de pantalla en varios tamaños.

Uso: python3 -I probar.py <base_url> <carpeta_capturas>
"""
import json
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

base = sys.argv[1]
out = Path(sys.argv[2])
out.mkdir(parents=True, exist_ok=True)
url = f'{base}/copa-valle-yumbo-2026/'

AUDIT_JS = Path(__file__).with_name('capturar.py').read_text().split('AUDIT_JS = r"""')[1].split('"""')[0]

VIEWS = [
    ('1920x1080', dict(viewport={'width': 1920, 'height': 1080})),
    ('1440x900', dict(viewport={'width': 1440, 'height': 900})),
    ('1366x768', dict(viewport={'width': 1366, 'height': 768})),
    ('1280x720', dict(viewport={'width': 1280, 'height': 720})),
    ('1024x768', dict(viewport={'width': 1024, 'height': 768})),
    ('768x1024', dict(viewport={'width': 768, 'height': 1024}, is_mobile=True, has_touch=True)),
    ('390x844', dict(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)),
    ('360x740', dict(viewport={'width': 360, 'height': 740}, device_scale_factor=2, is_mobile=True, has_touch=True)),
]

report = {}
with sync_playwright() as p:
    browser = p.chromium.launch()
    for name, opts in VIEWS:
        ctx = browser.new_context(**opts)
        page = ctx.new_page()
        page.goto(url, wait_until='networkidle')
        close = page.query_selector('button[aria-label="Cerrar anuncio"]')
        if close and close.is_visible():
            close.click()
            time.sleep(0.2)
        page.screenshot(path=str(out / f'pantalla-{name}.png'))
        first = page.evaluate("""() => {
          const h = innerHeight;
          const cat = document.querySelector('[data-valida-categoria]');
          const logos = document.querySelector('[data-sponsor-wall="franja"] img');
          const r = cat && cat.getBoundingClientRect();
          return { categoriaVisible: !!r && r.top < h - 40, topCategoria: r ? Math.round(r.top) : null,
                   topLogo: logos ? Math.round(logos.getBoundingClientRect().top) : null, alto: h };
        }""")
        # Recorre la página para cargar todo y audita.
        total = page.evaluate('document.documentElement.scrollHeight')
        for y in range(0, total, 700):
            page.evaluate(f'window.scrollTo(0,{y})')
            time.sleep(0.05)
        audit = page.evaluate(AUDIT_JS)
        report[name] = {'primeraPantalla': first, 'recortados': audit['clipped'], 'fueraDeAncho': audit['overflowX'],
                        'anchoDoc': audit['docWidth'], 'alto': total}
        print(name, 'alto', total, '| categoría en 1.ª pantalla:', first['categoriaVisible'], first['topCategoria'],
              '| logo franja top', first['topLogo'], '| recortados', len(audit['clipped']), '| fuera de ancho', len(audit['overflowX']), '| docWidth', audit['docWidth'])
        ctx.close()

    # Comportamiento: tocar «Infantil» en la apertura.
    for name, opts in (('escritorio', VIEWS[1][1]), ('celular', VIEWS[6][1])):
        ctx = browser.new_context(**opts)
        page = ctx.new_page()
        page.goto(url, wait_until='networkidle')
        page.click('[data-valida-categoria="manga-3"]')
        time.sleep(1.8)
        state = page.evaluate("""() => {
          const pressed = Array.from(document.querySelectorAll('#buscar [aria-pressed="true"]')).map(b => b.textContent.trim());
          const heads = Array.from(document.querySelectorAll('#fotos h3')).map(h => h.textContent.trim()).filter(t => t);
          const bar = document.getElementById('buscar').getBoundingClientRect();
          return { url: location.search, activo: pressed, titulares: heads.slice(0, 4), barraTop: Math.round(bar.top) };
        }""")
        page.screenshot(path=str(out / f'tras-tocar-infantil-{name}.png'))
        report[f'clic-{name}'] = state
        print('clic', name, state)
        ctx.close()

    # Sin JavaScript: el enlace lleva a ?manga=…
    ctx = browser.new_context(java_script_enabled=False, viewport={'width': 390, 'height': 844})
    page = ctx.new_page()
    page.goto(url)
    href = page.get_attribute('[data-valida-categoria="manga-3"]', 'href')
    report['sin-js-href'] = href
    print('sin JS, href de Infantil:', href)
    ctx.close()
    browser.close()

(out / 'pruebas.json').write_text(json.dumps(report, ensure_ascii=False, indent=1))
