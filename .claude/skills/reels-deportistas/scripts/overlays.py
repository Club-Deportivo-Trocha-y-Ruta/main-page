#!/usr/bin/env python3
"""Piezas dibujadas de los reels: rótulo, subtítulos y banda del evento.

Estilo y medidas: ../referencias/estilo-visual.md
"""
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

REPO = Path('/Users/juadiga/Documents/Personal/Trocha y Ruta/page')
FONT = str(REPO / 'fonts-src/PlusJakartaSans[wght].ttf')
WORK = Path('/tmp/tyr-video')
W, H, FPS = 1080, 1920, 24
TEAL, LIME, GRAPHITE, WHITE = '#20B7C9', '#8BE000', '#2F2F2F', '#FFFFFF'


def font(size, weight=800):
    f = ImageFont.truetype(FONT, size)
    f.set_variation_by_axes([weight])
    return f


def wrap(draw, text, f, max_w):
    lines, cur = [], ''
    for word in text.split():
        t = f'{cur} {word}'.strip()
        if draw.textlength(t, font=f) <= max_w:
            cur = t
        else:
            lines.append(cur)
            cur = word
    lines.append(cur)
    return lines


def text_block(draw, lines, f, cy, fill, box=None, pad=(36, 22), gap=12, radius=28):
    """Dibuja líneas centradas alrededor de cy; con caja opcional por línea."""
    lh = f.size + gap
    y = cy - (lh * len(lines)) // 2
    for ln in lines:
        tw = draw.textlength(ln, font=f)
        x = (W - tw) // 2
        if box:
            draw.rounded_rectangle(
                [x - pad[0], y - pad[1] // 2, x + tw + pad[0], y + f.size + pad[1]], radius, fill=box
            )
        draw.text((x, y), ln, font=f, fill=fill)
        y += lh + (pad[1] if box else 0)


def caption_png(text, path):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    f = font(62)
    text_block(d, wrap(d, text, f, 900), f, 1330, WHITE, box=(47, 47, 47, 225))
    img.save(path)


def lower_third_png(name, detail, path):
    """Rótulo inferior: nombre + dato, sin etiqueta superior."""
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    fn, fd = font(68), font(40, 600)
    h = 190 if detail else 118
    d.rounded_rectangle([60, 1010, W - 60, 1010 + h], 32, fill=(47, 47, 47, 225))
    d.rectangle([60, 1042, 72, 1010 + h - 32], fill=LIME)
    d.text((110, 1030), name, font=fn, fill=WHITE)
    if detail:
        d.text((110, 1122), detail, font=fd, fill=LIME)
    img.save(path)


def strip_png(text, path):
    """Banda del evento: ficha lima con la fecha + sede en blanco, sobre tarjeta grafito.

    `text` = "fecha · resto". Vive dentro de la zona segura inferior (termina en y≈1650).
    """
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    chip_txt, _, rest = text.partition(' · ')
    chip_txt = chip_txt.upper()
    size = 40
    while True:
        fc, fr = font(size, 800), font(size, 600)
        cw, rw = d.textlength(chip_txt, font=fc), d.textlength(rest, font=fr)
        total = 14 + (cw + 52) + 26 + rw + 40
        if total <= W - 100 or size <= 28:
            break
        size -= 2
    h = size + 56
    x0, y0 = (W - total) / 2, 1560
    # Tarjeta con sombra suave
    d.rounded_rectangle([x0 + 4, y0 + 8, x0 + total + 4, y0 + h + 8], h / 2, fill=(0, 0, 0, 70))
    d.rounded_rectangle([x0, y0, x0 + total, y0 + h], h / 2, fill=(47, 47, 47, 238))
    # Ficha de la fecha
    cx0, cy0, ch = x0 + 14, y0 + 12, h - 24
    d.rounded_rectangle([cx0, cy0, cx0 + cw + 52, cy0 + ch], ch / 2, fill=LIME)
    ty = y0 + (h - size) / 2 - size * 0.12
    d.text((cx0 + 26, ty), chip_txt, font=fc, fill=GRAPHITE)
    d.text((cx0 + cw + 52 + 26, ty), rest, font=fr, fill=WHITE)
    img.save(path)


def zoom_expr(keys):
    """Interpolación smootherstep (quíntica) entre keyframes [t, z]; t relativo al corte."""
    expr = f'{keys[-1][1]}'
    for (t0, z0), (t1, z1) in reversed(list(zip(keys, keys[1:]))):
        u = f'((it-{t0})/{t1 - t0})'
        seg = f'({z0}+({z1 - z0})*{u}*{u}*{u}*({u}*(6*{u}-15)+10))'
        expr = f'if(lt(it,{t1}),{seg},{expr})'
    return expr


def run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stderr[-3000:])
