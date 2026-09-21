#!/usr/bin/env python3
"""Subtítulos palabra a palabra y rótulo compacto — el estilo aprobado en la pieza de Cali
(2026-09-20, «estilo B»). Medidas: ../referencias/estilo-visual.md

- Sin caja: blanco peso 800 con contorno grafito de 7 px y sombra difuminada; la palabra
  que suena se enciende en lima. Máximo dos líneas: la letra baja de 64 a 50 px si hace falta.
- Se renderizan como una banda de video con alfa (qtrle) que se superpone una sola vez
  sobre la pieza: cientos de PNG superpuestos uno a uno hacían el filtergraph inmanejable.
- El tiempo de cada palabra sale de Whisper, alineado por TEXTO y no por conteo: las
  palabras corregidas a mano («Ram Bike», «Giraldo», «séptima*») no las reconoce el
  transcriptor y se interpolan entre sus vecinas.
"""
import difflib
import re
import subprocess
import unicodedata

from PIL import Image, ImageDraw, ImageFilter

from overlays import LIME, WHITE, H, W, font, wrap

BAND_Y, BAND_H = 1150, 450      # banda inferior (1150–1600): por encima del 20 % que tapa la app
CY, CY_STRIP = 1420, 1300       # centro normal / con la banda del evento en pantalla
TOP_BAND, TOP_CY = (280, 420), 450  # planos con la acción abajo: subtítulos arriba


def tag_png(name, detail, path, y0=1170):
    """Rótulo compacto: ancho al contenido, barra lima, por DEBAJO de la cara.

    El rótulo ancho de montage.py (60–1020 px, y = 1010) tapó la cara de Oscar en un plano
    medio; este ocupa lo justo. `y0` se ajusta por plano si la cara queda más baja.
    """
    img = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(img)
    fn, fd = font(54), font(34, 600)
    w = max(d.textlength(name, font=fn), d.textlength(detail, font=fd) if detail else 0) + 90
    h = 140 if detail else 96
    d.rounded_rectangle([60, y0, 60 + w, y0 + h], 26, fill=(47, 47, 47, 225))
    d.rectangle([60, y0 + 26, 70, y0 + h - 26], fill=LIME)
    d.text((100, y0 + 16), name, font=fn, fill=WHITE)
    if detail:
        d.text((100, y0 + 84), detail, font=fd, fill=LIME)
    img.save(path)


def plain_label_png(name, detail, path):
    """Rótulo del demo: texto plano con contorno, sin estilos del club."""
    img = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(img)
    for txt, f, y in ((name, font(60), 1130), (detail, font(40, 600), 1210)):
        if txt:
            d.text((70, y), txt, font=f, fill='white', stroke_width=4, stroke_fill=(0, 0, 0, 200))
    img.save(path)


def caption_img(tokens, active, cy, band=(BAND_Y, BAND_H)):
    size = 64
    probe = ImageDraw.Draw(Image.new('RGBA', (1, 1)))
    while len(wrap(probe, ' '.join(tokens), font(size, 800), 880)) > 2 and size > 50:
        size -= 2
    f = font(size, 800)
    img = Image.new('RGBA', (W, H))
    d = ImageDraw.Draw(img)
    sh = Image.new('RGBA', (W, H))
    ds = ImageDraw.Draw(sh)
    lines = wrap(d, ' '.join(tokens), f, 880)
    lh = int(size * 1.22)
    y, k = cy - lh * len(lines) // 2, 0
    for ln in lines:
        x = (W - d.textlength(ln, font=f)) / 2
        for w in ln.split():
            ds.text((x, y + 6), w, font=f, fill=(0, 0, 0, 170))
            d.text((x, y), w, font=f, fill=LIME if k == active else WHITE,
                   stroke_width=7, stroke_fill=(30, 30, 30, 255))
            x += d.textlength(w + ' ', font=f)
            k += 1
        y += lh
    img = Image.alpha_composite(sh.filter(ImageFilter.GaussianBlur(8)), img)
    return img.crop((0, band[0], W, band[0] + band[1]))


def _norm(t):
    return re.sub(r'[^a-z0-9]', '', unicodedata.normalize('NFD', t.lower()).encode('ascii', 'ignore').decode())


def word_starts(caps, words):
    """Inicio de cada palabra de cada subtítulo, en tiempo del máster.

    caps: [(a, b, texto)]; words: [(inicio, fin, palabra)] de Whisper, ya en tiempo del máster.
    """
    out = []
    for a, b, text in caps:
        toks = text.split()
        cand = [w for w in words if a - 0.7 <= w[0] < b + 0.1]
        sm = difflib.SequenceMatcher(None, [_norm(t) for t in toks], [_norm(w[2]) for w in cand], autojunk=False)
        st = [None] * len(toks)
        for blk in sm.get_matching_blocks():
            for i in range(blk.size):
                st[blk.a + i] = max(a, cand[blk.b + i][0])
        known = [(i, t) for i, t in enumerate(st) if t is not None] or [(0, a), (len(toks), b)]
        end = min(b, cand[-1][1]) if cand else b
        for i in range(len(toks)):
            if st[i] is None:
                p = max([k for k in known if k[0] < i], default=(-1, a))
                n = min([k for k in known if k[0] > i], default=(len(toks), end))
                st[i] = p[1] + (n[1] - p[1]) * (i - p[0]) / (n[0] - p[0])
        miss = len(toks) - sum(1 for i, _ in known if i < len(toks))
        if miss > 0:
            print(f'    {miss} palabra(s) interpoladas: {text}')
        out.append(st)
    return out


def build(caps, words, total, out, fps=24, band=(BAND_Y, BAND_H), cy_for=lambda a: CY, only=None):
    """Escribe la banda de subtítulos como video RGBA (qtrle) de `total` segundos."""
    starts = word_starts(caps, words)
    by, bh = band
    cache, blank = {}, bytes(W * bh * 4)
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{W}x{bh}',
                          '-r', str(fps), '-i', '-', '-c:v', 'qtrle', str(out)], stdin=subprocess.PIPE)
    n = int(round(total * fps))
    for i in range(n):
        t, frame = i / fps, blank
        for j, (a, b, text) in enumerate(caps):
            if a <= t < b and (only is None or only(a)):
                k = max(0, sum(1 for s in starts[j] if s <= t) - 1)
                if (j, k) not in cache:
                    cache[(j, k)] = caption_img(text.split(), k, cy_for(a), band).tobytes()
                frame = cache[(j, k)]
                break
        p.stdin.write(frame)
    p.stdin.close()
    p.wait()
    print(f'    banda de subtítulos {by}+{bh}: {len(cache)} estados, {n} fotogramas')
