#!/usr/bin/env python3
"""Verifica un reel ya armado sin tener que oírlo.

1. Texto: transcribe la salida con Whisper large y la compara, palabra por palabra, con los
   subtítulos del config. Una palabra que falta o sobra en el borde de un tramo es un
   corte a media voz (o un subtítulo que no dice lo que se oye).
2. Silencio en el corte: mide la energía de la salida en ±80 ms alrededor de cada corte
   y la compara con el nivel de la voz. Un corte limpio cae ≥ 10 dB por debajo.
3. Entrega: sonoridad integrada y pico real del máster. Instagram, TikTok y YouTube
   normalizan la reproducción a -14 LUFS; si la pieza sale por debajo, la app no la
   sube, así que se oye más floja que el reel de al lado.

Uso: python3 verify.py config.json   (después de montage.py)
"""
import difflib, json, re, subprocess, sys, unicodedata, wave
from pathlib import Path

import numpy as np
import whisper

WORK = Path('/tmp/tyr-video')
TARGET_LUFS = -14.0
PROMPT = 'Club Trocha y Ruta, Yumbo. Pista Carlos Castro. Copa Valle. Alcalá. Prejuvenil.'


def norm(w):
    w = unicodedata.normalize('NFD', w.lower())
    return re.sub(r'[^a-z0-9ñ]', '', ''.join(c for c in w if unicodedata.category(c) != 'Mn' or c == '̃'))


def wav16(src, out):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(src), '-vn', '-ac', '1', '-ar', '16000', str(out)], check=True)
    return out


def words(model, wav):
    r = model.transcribe(str(wav), language='es', word_timestamps=True, temperature=0,
                         condition_on_previous_text=False, initial_prompt=PROMPT)
    return [(w['start'], w['end'], w['word'].strip()) for s in r['segments'] for w in s['words']]


def delivery(video):
    """Sonoridad integrada y pico real, contra el objetivo de las redes."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-i', str(video), '-vn',
                        '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    tp = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r.stderr)
    if not i:
        print('ENTREGA: no se pudo medir la sonoridad')
        return True
    lufs, peak = float(i[-1]), float(tp[-1]) if tp else 0.0
    ok = abs(lufs - TARGET_LUFS) <= 1.0 and peak <= -1.0
    print(f'ENTREGA: {lufs:+.1f} LUFS (objetivo {TARGET_LUFS:+.0f} ±1), '
          f'pico real {peak:+.1f} dBTP (techo -1.0)  {"ok" if ok else "REVISAR"}')
    if not ok:
        print(f'   → ajusta la ganancia del montaje en {TARGET_LUFS - lufs:+.1f} dB '
              f'y vuelve a armar' if abs(lufs - TARGET_LUFS) > 1.0 else
              '   → el limitador dejó pasar un pico: baja 0,5 dB la ganancia')
    return ok


def main(cfg_path):
    cfg = json.loads(Path(cfg_path).read_text())
    meta = json.loads((WORK / cfg['id'] / 'cuts.json').read_text())
    model = whisper.load_model('large-v3-turbo')

    # Lo esperado son los subtítulos: es el texto curado de lo que debe oírse en cada tramo.
    expected, edge = [], []
    for seg in cfg['segments']:
        ws = [w for _, _, text in seg.get('captions', []) for w in text.split() if norm(w)]
        expected += ws
        # Las dos primeras y las dos últimas palabras de cada tramo son las que un mal corte se come
        edge += [k < 2 or k >= len(ws) - 2 for k in range(len(ws))]

    out_wav = wav16(meta['out'], WORK / 'verify_out.wav')
    got = [w for _, _, w in words(model, out_wav)]
    alias = {'jumbo': 'yumbo', 'esta': 'esa', 'altos': 'saltos', '2': 'segundo', 'a': 'a'}
    e = [alias.get(norm(w), norm(w)) for w in expected]
    g = [alias.get(norm(w), norm(w)) for w in got if norm(w)]
    sm = difflib.SequenceMatcher(a=e, b=g, autojunk=False)
    issues = []
    print(f'TEXTO: {len(e)} palabras esperadas, {len(g)} oídas, coincidencia {sm.ratio():.1%}')
    for tag, i1, i2, j1, j2 in sm.get_opcodes():
        if tag == 'equal':
            continue
        at_edge = any(edge[i1:i2]) or (tag == 'insert' and (i1 == 0 or i1 >= len(edge) or edge[i1] or edge[i1 - 1]))
        kind = 'BORDE' if at_edge else 'interior (variación del transcriptor)'
        if at_edge:
            issues.append(tag)
        print(f'   {kind}: {tag:8s} esperado={" ".join(e[i1:i2]) or "—"}  oído={" ".join(g[j1:j2]) or "—"}')
    if issues:
        print('   → los avisos de BORDE se confirman o descartan con edges.py (espectrograma)')

    with wave.open(str(out_wav)) as w:
        sr = w.getframerate()
        x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32)
    hop = int(sr * 0.02)
    rms = np.sqrt((x[:len(x) - len(x) % hop].reshape(-1, hop) ** 2).mean(axis=1)) + 1e-6
    db = 20 * np.log10(rms / 32768)
    voice, floor = float(np.percentile(db, 85)), float(np.percentile(db[db > -70], 12))
    print(f'CORTES (voz {voice:.1f} dB, piso de ruido {floor:.1f} dB):')
    ok = True
    for t in meta['cuts']:
        i = int(t / 0.02)
        loc = float(np.median(db[max(0, i - 3):i + 4]))
        good = loc - floor <= 6
        ok &= good
        print(f'   {t:6.2f}s  nivel en el corte {loc:6.1f} dB  ({loc - floor:+4.1f} dB sobre el piso)  {"ok" if good else "REVISAR"}')
    ok &= delivery(meta['out'])
    srt = Path(meta['out']).with_suffix('.srt')
    print(f'SUBTÍTULOS: {srt}' if srt.exists() else 'SUBTÍTULOS: falta el .srt (¿montage.py viejo?)')
    print('RESULTADO:', 'limpio' if ok and not issues else 'hay puntos por revisar')


if __name__ == '__main__':
    main(sys.argv[1])
