"""Encuadre panorámico del cerro (3200 × 1100, 2,9:1) para el afiche en pantallas anchas.

En escritorio el afiche no pasa de 660 px de alto: a 1900 px de ancho (2,9:1) el encuadre de 1,79:1 se recortaba
arriba y abajo con `object-fit: cover` y las torres salían mochas. Mismo cerro, misma escala (S = 2), más ancho:
el original mide 1672 px y aquí se usan 1600.
Uso: python3 -I cerro_ultra.py <carpeta_salida> [Y0]
"""
import os
import sys

AGENCIA = '/Users/juadiga/Documents/Personal/Trocha y Ruta/page/claudedocs/valida-yumbo-2026/piezas/03-aliados'
sys.path.insert(0, AGENCIA)
import numpy as np  # noqa: E402
import agencia_assets as a  # noqa: E402

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
a.OUT = out
a.W, a.H = 3200, 1100
a.S = 2.0
a.X0, a.Y0 = 40.0, float(sys.argv[2]) if len(sys.argv) > 2 else 55.0
a.QUEMADO = [(0, 1.0), (620, 1.0), (820, 0.0), (1100, 0.0)]
a.SOMBRA = [(0, 0.0), (655, 0.0), (760, 1.0), (1100, 1.0)]
a.generar_fondo(rng=np.random.default_rng(18102026), nombre='cerro-ultra.png')
print('ok')
