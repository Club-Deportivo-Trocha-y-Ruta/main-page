"""Versión horizontal del cerro de Yumbo a dos tintas (la de las historias «agencia»), para la maqueta web.

No toca agencia_assets.py: importa sus funciones y cambia el lienzo y el encuadre solo en esta corrida.
Uso: python3 -I cerro_ancho.py <carpeta_salida>
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

# Escritorio: 2400 × 1340 (1,79:1). La cumbre con las torres a la derecha y los cables bajando por detrás del título,
# como en las historias. S = 2: 1200 px del original a lo ancho.
a.W, a.H = 2400, 1340
a.S = 2.0
a.X0, a.Y0 = 40.0, 55.0
a.QUEMADO = [(0, 1.0), (760, 1.0), (1000, 0.0), (1340, 0.0)]
a.SOMBRA = [(0, 0.0), (800, 0.0), (930, 1.0), (1340, 1.0)]
a.generar_fondo(rng=np.random.default_rng(18102026), nombre='cerro-ancho.png')

# Panorama entero (para franjas o el cierre): todo el cerro, torres al centro.
a.W, a.H = 2400, 1000
a.S = 1.50
a.X0, a.Y0 = 40.0, 140.0
a.QUEMADO = [(0, 1.0), (700, 1.0), (950, 0.0), (1000, 0.0)]
a.SOMBRA = [(0, 0.0), (760, 0.0), (880, 1.0), (1000, 1.0)]
a.generar_fondo(rng=np.random.default_rng(1810), nombre='cerro-panorama.png')
print('ok')
