#!/usr/bin/env python3
"""Trazado del circuito sobre el video: la línea blanca gruesa de las «course preview» de la
Copa del Mundo, con bandera a cuadros en la meta. Todo local: GPX → Pillow → ffmpeg.

    python3 trazado.py --still ap.png --preset apertura   # USO APROBADO: trazado completo en la apertura
    python3 trazado.py --demo ap.mp4 --preset apertura    # 6 s: entra con fundido, se queda, sale
    python3 trazado.py --demo salida.mp4                  # ~12 s sobre fondo de prueba, los tres modos
    python3 trazado.py --still salida.png --mode full     # un fotograma (sobre fondo de prueba)
    python3 trazado.py --still t.png --mode marker --to 0.4 --alpha     # solo la capa, transparente
    python3 trazado.py --on clip_1080x1920.mp4 salida.mp4 --mode draw --from 0 --to 0.3
    python3 trazado.py --on clip.mp4 salida.mp4 --spec cues.json        # varios cues en el tiempo
    python3 trazado.py --info                             # orientación elegida, escala, largo

Desde `voz_en_off.py` se activa por plano con `"track": {...}` (ver SKILL.md); este módulo
expone `shot_layer()` para eso. Medidas y criterio: ../referencias/estilo-visual.md.

El GPX (`src/data/la-pista.gpx`) es **la vuelta grabada el 5-sep-2026 (3.717 m)**, no el circuito
homologado de 3,8 km de la válida: el largo no se rotula en pantalla sin confirmarlo.

Modos
-----
full    trazado completo, estático (con fundido de entrada y salida).
draw    el trazo se dibuja de `from` a `to` con easing a lo largo de la duración del cue.
        `keep` (por defecto true): lo anterior a `from` ya está dibujado.
marker  trazado completo tenue + tramo recorrido opaco + punto lima con halo que avanza.

Cada cue: {"mode", "from", "to", "at", "secs", "fade", "ease", "keep", "box", "width"}; `at` y
`secs` en segundos de la línea de tiempo de la capa. El movimiento ocupa `secs - 2·fade` (el
primer y último `fade` son el fundido de aparición y desaparición, con el trazo quieto).

Descartado por el usuario (17-oct): `"sync": "gps"` (marcador siguiendo al ciclista con GPS de GoPro
o GPX de Strava). El uso aprobado es solo la apertura, sin marcador. `Circuit.fraction_of()` queda
por si algún día se retoma.
"""
import argparse
import hashlib
import json
import math
import re
import subprocess
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[3]
GPX = REPO / 'src/data/la-pista.gpx'
WORK = Path('/tmp/tyr-video/trazado-demo')

W, H, FPS = 1080, 1920, 24
LIME, GRAPHITE, WHITE = (139, 224, 0), (47, 47, 47), (255, 255, 255)
STYLE_VERSION = '3'      # sube al cambiar el dibujo: invalida las capas en caché de voz_en_off

# Zonas seguras (estilo-visual.md): 270 px arriba, 384 px abajo. La caja por defecto vive en la
# mitad superior y deja libre la banda de subtítulos (y ≥ 1150) y el rótulo (y = 1170).
SAFE_TOP, SAFE_BOTTOM = 270, H - 384
DEFAULT_BOX = (60, 290, 960, 720)

# Uso aprobado (17-oct): el trazado completo y quieto solo en la apertura, unos segundos sobre el
# primer plano POV, grande y centrado (termina en y = 1500 < 1536). Elegí `full` y no un `draw`
# rápido: el trazo está completo desde el primer fotograma, no compite con el movimiento del
# POV, y el fundido de 0,4 s basta para que no «salte». 13 px: a este tamaño (2,8 px/m) la zona
# de curvas cerradas todavía se separa; con 15 empieza a empastarse.
PRESETS = {
    'apertura': {'mode': 'full', 'box': (40, 260, 1000, 1240), 'width': 13, 'fade': 0.4, 'at': 0.3, 'secs': 3.5},
}

LINE_W = 15              # px a 1080 de ancho
SHADOW_BLUR, SHADOW_DY, SHADOW_A = 7, 5, 0.42
DIM_A = 0.5              # opacidad del trazado completo en modo marker
SS = 3                   # supersampling
EARTH_R = 6_371_000.0


# ---------- geometría: GPX → metros → simplificar → suavizar → vuelta cerrada ----------

def parse_gpx(path=GPX):
    txt = Path(path).read_text()
    pts = [(float(a), float(b)) for a, b in re.findall(r'<trkpt\b[^>]*?lat="([-\d.]+)"[^>]*?lon="([-\d.]+)"', txt)]
    if not pts:   # atributos en otro orden
        pts = [(float(a), float(b)) for b, a in re.findall(r'<trkpt\b[^>]*?lon="([-\d.]+)"[^>]*?lat="([-\d.]+)"', txt)]
    if len(pts) < 3:
        raise SystemExit(f'{path}: sin puntos <trkpt>')
    return pts


def project(latlon, lat0=None, lon0=None):
    """Equirectangular local, en metros: x = este, y = norte. A 500 m de lado el error es de mm."""
    a = np.asarray(latlon, float)
    lat0 = a[:, 0].mean() if lat0 is None else lat0
    lon0 = a[:, 1].mean() if lon0 is None else lon0
    k = math.pi / 180 * EARTH_R
    return np.column_stack([(a[:, 1] - lon0) * k * math.cos(math.radians(lat0)), (a[:, 0] - lat0) * k]), (lat0, lon0)


def seglen(p):
    return np.hypot(*np.diff(p, axis=0).T)


def douglas_peucker(p, tol):
    """Ramer-Douglas-Peucker iterativo; tolerancia en metros."""
    n = len(p)
    keep = np.zeros(n, bool)
    keep[[0, -1]] = True
    stack = [(0, n - 1)]
    while stack:
        i, j = stack.pop()
        if j - i < 2:
            continue
        a, b = p[i], p[j]
        d = b - a
        L = np.hypot(*d)
        seg = p[i + 1:j]
        dist = np.hypot(*(seg - a).T) if L == 0 else np.abs(d[0] * (seg[:, 1] - a[1]) - d[1] * (seg[:, 0] - a[0])) / L
        k = int(dist.argmax())
        if dist[k] > tol:
            keep[i + 1 + k] = True
            stack += [(i, i + 1 + k), (i + 1 + k, j)]
    return p[keep]


def resample(p, step):
    """Puntos equiespaciados por longitud de arco; incluye el primero y el último."""
    cum = np.r_[0, np.cumsum(seglen(p))]
    n = max(2, int(round(cum[-1] / step)) + 1)
    s = np.linspace(0, cum[-1], n)
    return np.column_stack([np.interp(s, cum, p[:, 0]), np.interp(s, cum, p[:, 1])])


def smooth_closed(p, sigma_samples):
    """Gauss circular sobre una curva cerrada (sin el punto repetido del cierre)."""
    if sigma_samples <= 0:
        return p
    r = int(math.ceil(3 * sigma_samples))
    k = np.exp(-0.5 * (np.arange(-r, r + 1) / sigma_samples) ** 2)
    k /= k.sum()
    pad = np.concatenate([p[-r:], p, p[:r]])
    return np.column_stack([np.convolve(pad[:, c], k, mode='valid') for c in (0, 1)])


class Circuit:
    """Trazado listo para dibujar. `pts` es la vuelta cerrada (último punto == primero), en
    metros locales (x este, y norte); `cum` la distancia acumulada de cada punto."""

    def __init__(self, gpx=GPX, simplify_m=2.5, smooth_m=3.0, step_m=2.5):
        latlon = parse_gpx(gpx)
        raw, self.origin = project(latlon)
        self.raw_length = float(seglen(raw).sum())
        self.closing_gap = float(np.hypot(*(raw[-1] - raw[0])))
        # Cierre: el GPX termina a ~6,5 m de la salida. Se reparte el hueco a lo largo de la
        # vuelta (proporcional a la distancia) para que la línea cierre exacta, sin escalón.
        cum_raw = np.r_[0, np.cumsum(seglen(raw))]
        gap = raw[-1] - raw[0]
        raw = raw - np.outer(cum_raw / cum_raw[-1], gap)
        p = douglas_peucker(raw, simplify_m)
        p = resample(p, step_m)[:-1]                       # abierto, sin duplicar el cierre
        p = smooth_closed(p, smooth_m / step_m)
        p = np.vstack([p, p[:1]])
        self.pts = p
        self.cum = np.r_[0, np.cumsum(seglen(p))]
        self.length = float(self.cum[-1])

    def at(self, f):
        """Fracción de vuelta (0..1) → punto (x, y) en metros."""
        s = min(max(f, 0.0), 1.0) * self.length
        return np.array([np.interp(s, self.cum, self.pts[:, 0]), np.interp(s, self.cum, self.pts[:, 1])])

    def slice(self, f0, f1):
        """Polilínea entre dos fracciones (extremos interpolados)."""
        f0, f1 = sorted((min(max(f0, 0.0), 1.0), min(max(f1, 0.0), 1.0)))
        a, b = f0 * self.length, f1 * self.length
        i, j = np.searchsorted(self.cum, [a, b], side='right')
        mid = self.pts[i:j]
        return np.vstack([self.at(f0), mid[(self.cum[i:j] > a) & (self.cum[i:j] < b)], self.at(f1)])

    def fraction_of(self, lat, lon, near=None, window=0.08):
        """GPS → fracción de vuelta (vértice más cercano). Con `near`, solo mira ±`window` de
        vuelta alrededor: evita saltar a otro tramo que pase cerca. Base de `sync: gps`."""
        xy, _ = project([(lat, lon)], *self.origin)
        d = np.hypot(*(self.pts - xy[0]).T)
        if near is not None:
            f = self.cum / self.length
            d = np.where(np.abs(f - near) <= window, d, np.inf)
        return float(self.cum[int(d.argmin())] / self.length)


# ---------- encuadre: una orientación fija, una caja ----------

FLAG_W, FLAG_H, POLE_H = 56, 42, 96       # px a LINE_W = 15 (se escalan con el grosor)


@dataclass
class Layout:
    """Cómo cae el circuito en una caja: rotación, escala (px/m) y desplazamiento, en
    coordenadas locales de la caja (la capa se renderiza solo del tamaño de la caja)."""
    circuit: Circuit
    box: tuple
    rot: float
    scale: float
    off: tuple
    width: float = LINE_W

    def screen(self, pts):
        return _rot(np.atleast_2d(pts), self.rot) * self.scale + np.asarray(self.off)

    @property
    def k(self):
        return self.width / LINE_W


def _rot(p, deg):
    """(este, norte) → pantalla (x derecha, y abajo) con el norte girado `deg` en sentido horario."""
    t = math.radians(deg)
    x, y = p[:, 0], -p[:, 1]
    return np.column_stack([x * math.cos(t) - y * math.sin(t), x * math.sin(t) + y * math.cos(t)])


def _fit(circ, box, rot, width, pad):
    _, _, bw, bh = box
    q = _rot(circ.pts, rot)
    s0 = q[0]
    k = width / LINE_W
    fx0, fx1, fy0, fy1 = -5 * k, (FLAG_W + 4) * k, -(POLE_H + 3) * k, 3 * k
    aw, ah = bw - 2 * pad, bh - 2 * pad
    mn, mx = q.min(0), q.max(0)
    s = min(aw / (mx[0] - mn[0]), ah / (mx[1] - mn[1]))
    while s > 1e-3:
        x0, x1 = min(s * mn[0], s * s0[0] + fx0), max(s * mx[0], s * s0[0] + fx1)
        y0, y1 = min(s * mn[1], s * s0[1] + fy0), max(s * mx[1], s * s0[1] + fy1)
        if x1 - x0 <= aw and y1 - y0 <= ah:
            return s, ((bw - (x0 + x1)) / 2, (bh - (y0 + y1)) / 2)
        s *= 0.995
    raise SystemExit('la caja es demasiado chica para el trazado')


def best_rotation(circ, box=DEFAULT_BOX, width=LINE_W, pad=None, north_bias=0.03):
    """Rotación que mejor llena la caja. Entre las que quedan a ≤3 % de la mejor escala gana
    la más cercana a «norte arriba» (más fácil de reconocer para quien conoce la pista)."""
    pad = pad_for(width) if pad is None else pad
    res = [(r, _fit(circ, box, r, width, pad)[0]) for r in range(0, 360)]
    best = max(s for _, s in res)
    ok = [r for r, s in res if s >= best * (1 - north_bias)]
    return float(min(ok, key=lambda r: min(r, 360 - r)))


def pad_for(width):
    return max(width / 2 + 18, 40)     # medio trazo + sombra; el halo del punto pide ≥ 40


def make_layout(circ, box=DEFAULT_BOX, rot=None, width=LINE_W):
    box = tuple(box)
    pad = pad_for(width)
    rot = best_rotation(circ, box, width, pad) if rot is None else float(rot)
    s, off = _fit(circ, box, rot, width, pad)
    return Layout(circ, box, rot, s, off, width)


# ---------- dibujo ----------

def ease(name, u):
    u = min(max(u, 0.0), 1.0)
    if name == 'linear':
        return u
    if name == 'out':
        return 1 - (1 - u) ** 3
    return u * u * u * (u * (6 * u - 15) + 10)       # inout: smootherstep, como el zoom


def smoothstep(u):
    u = min(max(u, 0.0), 1.0)
    return u * u * (3 - 2 * u)


def _scale(mask, k):
    return mask.point([int(round(v * k)) for v in range(256)])


def _rgba(mask, color):
    c = [Image.new('L', mask.size, v) for v in color]
    return Image.merge('RGBA', (*c, mask))


def _stroke_mask(pts, size, width):
    """Trazo grueso de extremos y uniones redondeados, dibujado a SS× y reducido."""
    w, h = size
    im = Image.new('L', (w * SS, h * SS), 0)
    d = ImageDraw.Draw(im)
    q = np.asarray(pts, float) * SS
    r = width * SS / 2
    # Círculos densos a lo largo de la curva (paso 0,3·r): extremos, uniones y bordes siempre
    # redondos y parejos. Con `line()` + círculos sueltos quedaban muescas en los bordes.
    cum = np.r_[0, np.cumsum(np.hypot(*np.diff(q, axis=0).T))]
    n = max(2, int(cum[-1] / (0.3 * r)) + 2) if cum[-1] > 0 else 1
    s = np.linspace(0, cum[-1], n)
    xs, ys = np.interp(s, cum, q[:, 0]), np.interp(s, cum, q[:, 1])
    for x, y in zip(xs, ys):
        d.ellipse([x - r, y - r, x + r, y + r], fill=255)
    return im.reduce(SS)


def _disc(size, c, r):
    im = Image.new('L', (size[0] * SS, size[1] * SS), 0)
    ImageDraw.Draw(im).ellipse([(c[0] - r) * SS, (c[1] - r) * SS, (c[0] + r) * SS, (c[1] + r) * SS], fill=255)
    return im.reduce(SS)


def _rect(size, x0, y0, x1, y1):
    im = Image.new('L', (size[0] * SS, size[1] * SS), 0)
    ImageDraw.Draw(im).rectangle([x0 * SS, y0 * SS, x1 * SS - 1, y1 * SS - 1], fill=255)
    return im.reduce(SS)


def _shadow(mask, a=SHADOW_A):
    m = ImageChops.offset(mask.filter(ImageFilter.GaussianBlur(SHADOW_BLUR)), 0, SHADOW_DY)
    return _scale(m, a)


def flag_layers(layout, t):
    """Bandera a cuadros en la salida/meta (el mismo punto: la vuelta cierra). Devuelve
    [(máscara, color)] de abajo arriba y la silueta para la sombra. Ondea apenas."""
    k, (w, h) = layout.k, layout.box[2:]
    px, py = layout.screen(layout.circuit.pts[0])[0]
    size = (w, h)
    cols, rows, cell = 4, 3, FLAG_W * k / 4
    top = py - POLE_H * k
    x0 = px + 3 * k
    pole = _rect(size, px - 2.5 * k, top - 2 * k, px + 2.5 * k, py + 2 * k)
    outline = _rect(size, px - 4.5 * k, top - 4 * k, px + 4.5 * k, py + 4 * k)
    light, dark = Image.new('L', (w * SS, h * SS), 0), Image.new('L', (w * SS, h * SS), 0)
    out = Image.new('L', (w * SS, h * SS), 0)
    dl, dd, do = ImageDraw.Draw(light), ImageDraw.Draw(dark), ImageDraw.Draw(out)
    for c in range(cols):
        wave = 1.6 * k * math.sin(t * 5.0 - c * 0.9) * (c / (cols - 1))
        for r in range(rows):
            xa, ya = x0 + c * cell, top + r * cell + wave
            box = [xa * SS, ya * SS, (xa + cell) * SS - 1, (ya + cell) * SS - 1]
            (dl if (c + r) % 2 == 0 else dd).rectangle(box, fill=255)
        col_box = [(x0 + c * cell - 2 * k) * SS, (top + wave - 2 * k) * SS,
                   (x0 + (c + 1) * cell + 2 * k) * SS, (top + rows * cell + wave + 2 * k) * SS]
        do.rectangle(col_box, fill=255)
    flag_out, light, dark = out.reduce(SS), light.reduce(SS), dark.reduce(SS)
    sil = ImageChops.lighter(ImageChops.lighter(flag_out, outline), pole)
    return [(outline, GRAPHITE), (flag_out, GRAPHITE), (pole, WHITE), (light, WHITE), (dark, GRAPHITE)], sil


def dot_layers(layout, c, t):
    """Punto lima con anillo blanco y halo que respira."""
    k, size = layout.k, layout.box[2:]
    cx, cy = c
    pulse = 0.5 + 0.5 * math.sin(t * 2 * math.pi * 1.1)
    halo = _scale(_disc(size, (cx, cy), (34 + 6 * pulse) * k), 0.30)
    ring = _disc(size, (cx, cy), 22 * k)
    core = _disc(size, (cx, cy), 16 * k)
    return [(halo, LIME), (ring, WHITE), (core, LIME)], ring


@dataclass
class Cue:
    mode: str = 'full'
    frm: float = 0.0
    to: float = 1.0
    at: float = 0.0
    secs: float = 3.0
    fade: float = 0.3
    ease: str = None
    keep: bool = True
    box: tuple = None
    width: float = LINE_W
    layout: Layout = field(default=None, repr=False)

    @classmethod
    def from_json(cls, d, **defaults):
        d = {**defaults, **d}
        mode = d.get('mode', 'full')
        if mode not in ('full', 'draw', 'marker'):
            raise SystemExit(f"track.mode inválido: {mode!r} (full | draw | marker)")
        return cls(mode=mode, frm=float(d.get('from', 0.0)), to=float(d.get('to', 1.0)), at=float(d.get('at', 0.0)),
                   secs=float(d.get('secs', 3.0)), fade=float(d.get('fade', 0.3)), ease=d.get('ease'),
                   keep=bool(d.get('keep', True)), box=tuple(d['box']) if d.get('box') else None,
                   width=float(d.get('width', LINE_W)))

    def state(self, t):
        """(opacidad, fracción actual) del cue en el instante t, o None si no está en pantalla."""
        if not (self.at <= t <= self.at + self.secs):
            return None
        f = max(self.fade, 1e-6)
        op = smoothstep((t - self.at) / f) * smoothstep((self.at + self.secs - t) / f)
        m0, m1 = self.at + self.fade, self.at + self.secs - self.fade
        u = (t - m0) / (m1 - m0) if m1 > m0 else 1.0
        e = self.ease or ('linear' if self.mode == 'marker' else 'inout')
        return op, self.frm + (self.to - self.frm) * ease(e, u)


class Renderer:
    """Dibuja los cues sobre una capa RGBA del tamaño de la caja. Una orientación para todos."""

    def __init__(self, circuit=None, cues=(), rot=None, box=None):
        # `box` solo decide la orientación; por defecto, la caja del primer cue.
        self.circuit = circuit or Circuit()
        cues = list(cues)
        self.box = tuple(box or (cues and cues[0].box) or DEFAULT_BOX)
        self.rot = best_rotation(self.circuit, self.box) if rot is None else float(rot)
        self.cues = list(cues)
        self._layouts, self._cache = {}, {}
        for c in self.cues:
            c.layout = self.layout(c.box or self.box, c.width)

    def layout(self, box, width=LINE_W):
        key = (tuple(box), width)
        if key not in self._layouts:
            self._layouts[key] = make_layout(self.circuit, box, self.rot, width)
        return self._layouts[key]

    def _mask(self, lay, f0, f1, keyed):
        key = (id(lay), round(f0, 5), round(f1, 5))
        if keyed and key in self._cache:
            return self._cache[key]
        m = _stroke_mask(lay.screen(self.circuit.slice(f0, f1)), lay.box[2:], lay.width)
        if keyed:
            self._cache[key] = m
        return m

    def frame(self, t):
        """Capa RGBA de `t`, o None si ningún cue está en pantalla."""
        for c in reversed(self.cues):
            st = c.state(t)
            if st:
                return self._draw(c, t, *st)
        return None

    def _draw(self, c, t, op, cur):
        lay = c.layout
        size = lay.box[2:]
        out = Image.new('RGBA', size, (0, 0, 0, 0))
        items = []            # [(máscara, color)] de abajo arriba, ya con opacidad
        shadow = Image.new('L', size, 0)

        def add(mask, color, a=1.0):
            items.append((_scale(mask, a * op), color))

        if c.mode == 'full':
            full = self._mask(lay, 0, 1, True)
            shadow = _shadow(full)
            add(full, WHITE)
        else:
            lo, hi = sorted((0.0 if c.keep else c.frm, cur))
            trav = self._mask(lay, lo, hi, False)
            if c.mode == 'marker':
                full = self._mask(lay, 0, 1, True)
                dim = _scale(full, DIM_A)
                shadow = _shadow(ImageChops.lighter(_scale(full, 0.35), trav))
                items.append((_scale(dim, op), WHITE))
            else:
                shadow = _shadow(trav)
            add(trav, WHITE)
        sil = None
        fl, sil = flag_layers(lay, t)
        shadow = ImageChops.lighter(shadow, _shadow(sil))
        dot = None
        if c.mode == 'marker':
            dl, ring = dot_layers(lay, lay.screen(self.circuit.at(cur))[0], t)
            shadow = ImageChops.lighter(shadow, _shadow(ring, 0.5))
            dot = dl
        out = Image.alpha_composite(out, _rgba(_scale(shadow, op), (0, 0, 0)))
        for m, col in items:
            out = Image.alpha_composite(out, _rgba(m, col))
        for m, col in fl + (dot or []):
            out = Image.alpha_composite(out, _rgba(_scale(m, op), col))
        return out

    def write_video(self, out, total, fps=FPS, size=None):
        """Capa como video RGBA (qtrle) de `total` s; fotogramas sin cue activo van transparentes."""
        sizes = {c.layout.box[2:] for c in self.cues}
        if len(sizes) > 1 and size is None:
            raise SystemExit('los cues de una capa deben compartir el tamaño de caja')
        size = size or (sizes.pop() if sizes else self.box[2:])
        blank = bytes(size[0] * size[1] * 4)
        p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', f'{size[0]}x{size[1]}',
                              '-r', str(fps), '-i', '-', '-c:v', 'qtrle', str(out)], stdin=subprocess.PIPE)
        for i in range(int(round(total * fps))):
            fr = self.frame(i / fps)
            p.stdin.write(blank if fr is None else fr.tobytes())
        p.stdin.close()
        if p.wait():
            raise SystemExit('ffmpeg falló al escribir la capa del trazado')


# ---------- composición ----------

def overlay_clip(clip, out, renderer, total=None, extra_vf=''):
    """Aplica la capa sobre un clip ya escalado a 1080×1920 (un cue por defecto en la caja).
    Para varias cajas distintas usa un cue por clip, como hace `voz_en_off.py`."""
    clip = Path(clip)
    if total is None:
        total = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', str(clip)],
                                     capture_output=True, text=True).stdout)
    WORK.mkdir(parents=True, exist_ok=True)
    layer = WORK / (clip.stem + '-capa.mov')
    boxes = {c.layout.box for c in renderer.cues}
    if len(boxes) != 1:
        raise SystemExit('overlay_clip admite una sola caja; usa un clip por caja')
    x, y = next(iter(boxes))[:2]
    renderer.write_video(layer, total)
    color = 'setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709'
    _run(['ffmpeg', '-v', 'error', '-y', '-i', str(clip), '-i', str(layer), '-filter_complex',
          f'[0:v][1:v]overlay=x={x}:y={y}:eof_action=pass{extra_vf},format=yuv420p,{color}[v]', '-map', '[v]', '-map', '0:a?',
          '-t', f'{total:.3f}', '-c:v', 'libx264', '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p',
          '-c:a', 'copy', '-movflags', '+faststart', str(out)])
    return Path(out)


def shot_layer(track, dur, work, idx, defaults=None, circuit=None, rot=None):
    """Capa de un plano de `voz_en_off.py`. `track` es el dict del JSON del plano, `dur` la
    duración del video del plano (con la cola congelada). Devuelve (ruta_mov, x, y).

    El tiempo es el del plano de SALIDA (el de la pieza, después de la cámara lenta): el
    marcador no sabe de `slow`. `at` (0,25 s por defecto) deja pasar el fundido de entrada del
    plano; `secs` por defecto llega hasta 0,1 s antes de que termine el plano propio.
    """
    defaults = defaults or {}
    pre = PRESETS[track['preset']] if track.get('preset') else {}
    if track.get('preset') and track['preset'] not in PRESETS:
        raise SystemExit(f"track.preset desconocido: {track['preset']!r}")
    d = {**defaults, **pre, **track}
    d.setdefault('at', 0.25)
    d.setdefault('secs', max(1.0, d.get('shot_secs', dur) - d['at'] - 0.1))
    cue = Cue.from_json(d)
    box = tuple(d['box']) if d.get('box') else DEFAULT_BOX
    cue.box = box
    rot = d.get('rotation', rot)
    # La orientación sale de la caja por defecto del JSON; el preset trae la suya (es el único plano).
    basis = box if pre else tuple(defaults.get('box') or DEFAULT_BOX)
    r = Renderer(circuit or Circuit(), [cue], rot=rot, box=basis)
    key = hashlib.sha1(json.dumps([STYLE_VERSION, d, round(dur, 3), r.rot, box], sort_keys=True).encode()).hexdigest()[:10]
    out = Path(work) / 'track' / f'{idx:02d}-{key}.mov'
    if not out.exists():
        out.parent.mkdir(parents=True, exist_ok=True)
        r.write_video(out, dur)
    return out, box[0], box[1]


def _run(cmd):
    r = subprocess.run(cmd, capture_output=True, text=True)
    if r.returncode:
        raise SystemExit(r.stderr[-3000:])


# ---------- fondo de prueba, still y demo ----------

def test_background(label='', variant=0, guides=True):
    """Cielo claro (el peor caso para una línea blanca) sobre tierra y colinas, 1080×1920."""
    y = np.linspace(0, 1, H)[:, None]
    top = np.array([[150, 205, 240], [235, 220, 190], [175, 195, 215]][variant], float)
    sky = (top + (np.array([240, 248, 252]) - top) * np.clip(y / 0.58, 0, 1) ** 0.8)[:, None, :]
    g0, g1 = np.array([128, 150, 84.0]), np.array([82, 98, 52.0])
    ground = (g0 + (g1 - g0) * np.clip((y - 0.58) / 0.42, 0, 1))[:, None, :]
    ridge = 0.58 + 0.03 * np.sin(np.linspace(0, 7, W) + variant)[None, :]
    img = np.where((y > ridge)[..., None], ground, sky)
    img = np.clip(img + np.random.default_rng(variant).normal(0, 3, (H, W, 1)), 0, 255).astype(np.uint8)
    im = Image.fromarray(img)
    d = ImageDraw.Draw(im)
    if guides:
        for yy in (SAFE_TOP, SAFE_BOTTOM):
            for x in range(0, W, 30):
                d.line([(x, yy), (x + 14, yy)], fill=(220, 40, 40), width=3)
    if label:
        from overlays import font
        d.text((40, 1700), label, font=font(54), fill=(255, 255, 255), stroke_width=5, stroke_fill=(40, 40, 40))
    return im


def still(out, cue, rot=None, alpha=False, guides=True):
    r = Renderer(cues=[cue], rot=rot)
    t = cue.at + cue.secs - cue.fade - 1e-3    # fin del movimiento, opacidad plena
    layer = r.frame(t)
    box = cue.layout.box
    if alpha:
        canvas = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        canvas.alpha_composite(layer, box[:2])
    else:
        canvas = test_background(f'{cue.mode}  {cue.frm:.2f} > {cue.to:.2f}', 0, guides).convert('RGBA')
        canvas.alpha_composite(layer, box[:2])
        canvas = canvas.convert('RGB')
    canvas.save(out)
    lay = cue.layout
    print(f'{out}  rotación {lay.rot:.0f}°, escala {lay.scale:.3f} px/m, caja {lay.box}')


DEMO = [  # (modo, from, to, segundos)
    ('full', 0.0, 1.0, 3.6),
    ('draw', 0.0, 1.0, 4.2),
    ('marker', 0.0, 1.0, 4.2),
]


def demo_apertura(out, total=6.0):
    """Apertura de `total` s: el trazado completo entra con fundido, se queda y sale."""
    WORK.mkdir(parents=True, exist_ok=True)
    cue = Cue.from_json({**PRESETS['apertura'], 'at': 0.5})
    p, base = WORK / 'bg-apertura.png', WORK / 'apertura-base.mp4'
    test_background('apertura', 0).save(p)
    _run(['ffmpeg', '-v', 'error', '-y', '-loop', '1', '-framerate', str(FPS), '-t', f'{total}', '-i', str(p),
          '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '14', '-r', str(FPS), str(base)])
    r = Renderer(cues=[cue])
    overlay_clip(base, out, r, total=total)
    print(f'{out}  ({total:.1f} s, rotación {r.rot:.0f}°)')


def demo(out):
    WORK.mkdir(parents=True, exist_ok=True)
    cues, t, bg = [], 0.0, []
    for i, (mode, a, b, secs) in enumerate(DEMO):
        cues.append(Cue(mode=mode, frm=a, to=b, at=t + 0.1, secs=secs - 0.2))
        p = WORK / f'bg{i}.png'
        test_background(f'{mode}  {a:.2f} > {b:.2f}', i).save(p)
        bg.append((p, secs))
        t += secs
    inputs = []
    for p, secs in bg:
        inputs += ['-loop', '1', '-framerate', str(FPS), '-t', f'{secs}', '-i', str(p)]
    base = WORK / 'demo-base.mp4'
    _run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', f'concat=n={len(bg)}:v=1:a=0,format=yuv420p[v]',
          '-map', '[v]', '-c:v', 'libx264', '-crf', '14', '-r', str(FPS), str(base)])
    r = Renderer(cues=cues)
    overlay_clip(base, out, r, total=t)
    print(f'{out}  ({t:.1f} s, rotación {r.rot:.0f}°)')


def cue_from_args(a, secs):
    if a.preset:
        d = dict(PRESETS[a.preset])
        if a.box:
            d['box'] = tuple(a.box)
        if a.width:
            d['width'] = a.width
        if a.secs:
            d['secs'] = a.secs
        return Cue.from_json(d)
    return Cue(mode=a.mode, frm=a.frm, to=a.to, at=a.at, secs=a.secs or secs, ease=a.ease,
               box=tuple(a.box) if a.box else None, width=a.width or LINE_W)


def main():
    ap = argparse.ArgumentParser(description=__doc__.split('\n')[0])
    ap.add_argument('--demo', metavar='SALIDA.mp4')
    ap.add_argument('--still', metavar='SALIDA.png')
    ap.add_argument('--on', nargs=2, metavar=('CLIP', 'SALIDA'), help='clip ya escalado a 1080×1920')
    ap.add_argument('--info', action='store_true')
    ap.add_argument('--mode', default='full', choices=['full', 'draw', 'marker'])
    ap.add_argument('--from', dest='frm', type=float, default=0.0)
    ap.add_argument('--to', type=float, default=1.0)
    ap.add_argument('--at', type=float, default=0.0)
    ap.add_argument('--secs', type=float, default=None)
    ap.add_argument('--ease')
    ap.add_argument('--box', nargs=4, type=int, metavar=('X', 'Y', 'W', 'H'))
    ap.add_argument('--width', type=float, default=None)
    ap.add_argument('--preset', choices=sorted(PRESETS), help='apertura: trazado completo, grande y centrado')
    ap.add_argument('--rotation', type=float, help='grados; por defecto, la que mejor llena la caja')
    ap.add_argument('--spec', help='JSON con una lista de cues (para --on)')
    ap.add_argument('--alpha', action='store_true', help='--still: solo la capa, sobre transparente')
    ap.add_argument('--no-guides', action='store_true')
    a = ap.parse_args()
    sys.path.insert(0, str(HERE))
    if a.info:
        c = Circuit()
        lay = make_layout(c, a.box or DEFAULT_BOX, a.rotation)
        print(f'GPX: {c.raw_length:.0f} m grabados, cierre a {c.closing_gap:.1f} m; suavizado: {c.length:.0f} m, {len(c.pts)} puntos')
        print(f'caja {lay.box}: rotación {lay.rot:.0f}°, {lay.scale:.3f} px/m')
    elif a.demo:
        demo_apertura(a.demo) if a.preset == 'apertura' else demo(a.demo)
    elif a.still:
        cue = cue_from_args(a, 3.0)
        still(a.still, cue, a.rotation, a.alpha, not a.no_guides)
    elif a.on:
        if a.spec:
            cues = [Cue.from_json(d) for d in json.loads(Path(a.spec).read_text())]
        else:
            cues = [cue_from_args(a, 4.0)]
        r = Renderer(cues=cues, rot=a.rotation)
        overlay_clip(a.on[0], a.on[1], r)
        print(a.on[1])
    else:
        ap.print_help()


if __name__ == '__main__':
    main()
