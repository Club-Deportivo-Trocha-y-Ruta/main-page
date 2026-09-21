#!/usr/bin/env python3
"""LUT 3D HLG (BT.2020) → SDR BT.709 para los clips que el iPhone graba con «Vídeo HDR».

Este ffmpeg no trae zscale ni libplacebo, así que no puede tonemapear. La LUT hace la
cadena completa en numpy: HLG inverso → OOTF a 1000 nits (blanco SDR = 203) → matriz
BT.2020→709 → Reinhard extendido sobre el máximo del canal → gamma 2.4. Se aplica con
`format=gbrp16le,lut3d=<cube>:interp=tetrahedral`. En la pieza de Cali (14 de 19 clips en
HLG) quedó al lado de los clips SDR nativos sin salto de color visible.
"""
from pathlib import Path

import numpy as np

CUBE = Path('/tmp/tyr-video/hlg2sdr.cube')
N = 65


def build(path=CUBE):
    a, b, c = 0.17883277, 0.28466892, 0.55991073
    g = np.linspace(0, 1, N)
    B, G, R = np.meshgrid(g, g, g, indexing='ij')           # .cube: R varía más rápido
    rgb = np.stack([R, G, B], -1).reshape(-1, 3)
    lin = np.where(rgb <= 0.5, rgb ** 2 / 3, (np.exp((rgb - c) / a) + b) / 12)
    Y = (lin * [0.2627, 0.6780, 0.0593]).sum(-1, keepdims=True)
    disp = lin * np.maximum(Y, 1e-6) ** 0.2 * 1000 / 203
    M = np.array([[1.6605, -0.5876, -0.0728], [-0.1246, 1.1329, -0.0083], [-0.0182, -0.1006, 1.1187]])
    disp = np.clip(disp @ M.T, 0, None)
    peak = 1000 / 203
    L = disp.max(-1, keepdims=True)
    Lt = L * (1 + L / peak ** 2) / (1 + L)
    out = np.clip(disp * np.where(L > 0, Lt / np.maximum(L, 1e-9), 0), 0, 1) ** (1 / 2.4)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, 'w') as f:
        f.write(f'LUT_3D_SIZE {N}\n')
        np.savetxt(f, out, fmt='%.6f')
    return path


def lut_filter():
    """Filtro listo para una cadena -vf; genera la LUT la primera vez."""
    if not CUBE.exists():
        build()
    return f'format=gbrp16le,lut3d={CUBE}:interp=tetrahedral'


if __name__ == '__main__':
    print(build())
