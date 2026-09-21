#!/usr/bin/env python3
"""Hoja de espectrogramas de cada borde `say` de un config: la prueba visual de que la voz
termina antes de la línea (finales) o empieza después (inicios).

Whisper autocompleta palabras truncadas y la envolvente RMS no ve las sílabas suaves
entre el ruido del público; los armónicos de la voz en el espectrograma sí se ven.
Cada panel cubre ±0,5 s alrededor del borde; marcas cada 0,1 s.
Uso: python3 edges.py config.json salida.png
"""
import json, subprocess, sys
from pathlib import Path
from PIL import Image, ImageDraw

WORK = Path('/tmp/tyr-video')
PW, PH, HALF = 500, 150, 0.5


def panel(src, t, label, kind):
    wav = WORK / (Path(src).stem.replace('IMG_', '') + '.wav')
    if not wav.exists():
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', src, '-vn', '-ac', '1', '-ar', '16000', str(wav)], check=True)
    png = WORK / 'edge_tmp.png'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t - HALF}', '-t', f'{2 * HALF}', '-i', str(wav), '-lavfi',
                    f'showspectrumpic=s={PW}x{PH}:legend=0:scale=log:fscale=lin:stop=4000:gain=4', str(png)], check=True)
    im = Image.open(png).convert('RGB')
    d = ImageDraw.Draw(im)
    for k in range(11):
        x = int(k * PW / 10)
        d.line([(x, PH - 8), (x, PH)], fill=(255, 255, 255))
    d.line([(PW // 2, 0), (PW // 2, PH)], fill=(0, 255, 255), width=2)
    d.rectangle([0, 0, 210, 14], fill=(0, 0, 0))
    d.text((3, 1), f'{label} {kind} {t:.2f}', fill=(255, 255, 255))
    return im


def main(cfg_path, out):
    cfg = json.loads(Path(cfg_path).read_text())
    panels = []
    for i, seg in enumerate(cfg['segments'], 1):
        src = str(Path(seg['src']).expanduser())
        s0, s1 = seg['say']
        panels.append(panel(src, s0, f'seg{i}', 'INICIO >'))
        panels.append(panel(src, s1, f'seg{i}', '< FINAL'))
    cols = 2
    rows = (len(panels) + cols - 1) // cols
    sheet = Image.new('RGB', (cols * PW + (cols - 1) * 6, rows * (PH + 4)), (20, 20, 20))
    for k, im in enumerate(panels):
        sheet.paste(im, ((k % cols) * (PW + 6), (k // cols) * (PH + 4)))
    sheet.save(out)
    print(out)


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
