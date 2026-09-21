#!/usr/bin/env python3
"""Arma un reel vertical uniendo varios fragmentos, uno por intervención.

Cada segmento se renderiza aparte (zoom + rótulo + subtítulos quemados) y luego se
encadenan con xfade/acrossfade. Uso: python3 montage.py config.json

Audio y video se cortan por separado:
- `start`/`end` es lo que se VE. `say: [s0, s1]` es lo que se OYE: primera y última
  sílaba, de Whisper large y confirmadas en el espectrograma con edges.py.
- El fundido entre dos segmentos nunca dura más que el aire que hay entre `say` y el
  borde del video, así que no puede pisar una palabra.
- Cuando el deportista encadena la frase siguiente sin respirar («…es muy fuerte y pues…»)
  se usa `patch_tail: [p0, p1]`: el audio se apaga justo después de `s1` y el resto del
  plano se cubre con tono de sala del mismo clip. `patch_head` hace lo mismo al inicio.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

from hlg import lut_filter
from overlays import FPS, H, W, caption_png, lower_third_png, run, strip_png, zoom_expr

WORK = Path('/tmp/tyr-video')
OUT = Path.home() / 'Downloads/trocha-reels'
TARGET_LUFS = -14.0          # objetivo de entrega de Instagram/TikTok (true peak -1 dBTP)
HARD_CUT = 0.042             # un fotograma a 24 fps
SS = 4 * W                   # ancho al que se supersamplea antes del zoom (ver source_chain)
HDR_TRC = {'arib-std-b67': 'HLG', 'smpte2084': 'PQ'}
# Sin estas etiquetas el reproductor adivina el espacio de color y los teales del club viran.
# Va como filtro: en ffmpeg 8 las opciones -color_trc/-color_primaries del encoder no llegan
# al bitstream (se comprobó: quedaban en «unknown»), `setparams` sí escribe las tres.
COLOR_TAGS = 'setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709'

_trc = {}


def color_trc(src):
    if src not in _trc:
        r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                            'stream=color_transfer', '-of', 'default=nw=1:nk=1', src],
                           capture_output=True, text=True)
        _trc[src] = r.stdout.strip()
    return _trc[src]


def source_chain(src):
    """Cadena previa al zoom.

    1. Los clips grabados con «Vídeo HDR» (Ajustes › Cámara › Formatos) vienen en HLG:
       pasarlos a yuv420p sin tonemapear da una imagen lavada. Se convierten con la LUT de
       `hlg.py`. PQ no tiene LUT (el iPhone no lo usa): se para en vez de exportar mal.
    2. Supersampleo a 4× el ancho de salida: zoompan trunca la ventana de recorte a píxeles
       enteros de la fuente, así que un empuje lento avanza a tirones (medido sobre un
       patrón: pasos de −0,58 a +1,07 px donde deberían ser +0,19 constantes). Con la
       fuente al cuádruple del ancho de salida el paso queda entre 0,00 y +0,50 px y el
       movimiento se vuelve monótono. Cuesta ~15 % más de render y no pierde nitidez.
       Se nota en el empuje lento largo; en un zoom rápido el tirón queda disimulado.
    """
    trc = color_trc(src)
    chain = [f'fps={FPS}']
    if trc == 'arib-std-b67':
        chain.append(lut_filter())
    elif trc in HDR_TRC:
        raise SystemExit(f'{src}: el clip es HDR {HDR_TRC[trc]} y no hay LUT para esa curva: '
                         f'la pieza saldría lavada. Conviértelo a SDR bt709 antes de montarlo.')
    chain.append(f"scale='if(lt(iw,{SS}),{SS},iw)':-2:flags=lanczos")
    return ','.join(chain)


def measure_lufs(src, a, b):
    """Sonoridad integrada del tramo hablado: se aplica ganancia fija, sin bombeo."""
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', '-ss', f'{a}', '-t', f'{b - a}', '-i', src,
                        '-vn', '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True)
    m = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    return float(m[-1]) if m else TARGET_LUFS


def render_segment(seg, tmp, idx, gain):
    """Renderiza un fragmento con su zoom, rótulo, subtítulos y audio ya limpio."""
    t0, t1 = seg['start'], seg['end']
    dur = t1 - t0
    s0, s1 = seg['say']
    overlays = []

    if seg.get('name'):
        lp = tmp / f'lower{idx}.png'
        lower_third_png(seg['name'], seg.get('detail', ''), lp)
        a = seg.get('name_in', 0.3)
        overlays.append((lp, a, a + seg.get('name_secs', 3.2), 'slide'))

    for i, (ca, cb, text) in enumerate(seg.get('captions', [])):
        cp = tmp / f'cap{idx}_{i}.png'
        caption_png(text, cp)
        overlays.append((cp, ca - t0, cb - t0, 'fixed'))

    if seg.get('strip'):
        sp = tmp / f'strip{idx}.png'
        strip_png(seg['strip'], sp)
        sin = seg.get('strip_in', 0)
        overlays.append((sp, sin, dur, 'rise' if sin > 0 else 'fixed'))

    inputs = ['-ss', f'{t0}', '-t', f'{dur}', '-i', str(seg['src'])]
    for p, _, _, _ in overlays:
        inputs += ['-i', str(p)]

    cx, cy = seg.get('focus', [0.45, 0.27])
    z = zoom_expr(seg.get('zoom', [[0, 1.0], [dur, 1.0]]))
    fc = [
        f"[0:v]{source_chain(seg['src'])},zoompan=z='{z}':x='(iw-iw/zoom)*{cx}':y='(ih-ih/zoom)*{cy}'"
        f":d=1:s={W}x{H}:fps={FPS},format=yuv420p[v0]"
    ]
    last = 'v0'
    for i, (_, a, b, kind) in enumerate(overlays, 1):
        x = f"-w*pow(1-min((t-{a:.2f})/0.4\\,1)\\,3)" if kind == 'slide' else '0'
        y = f"70*pow(1-min((t-{a:.2f})/0.45\\,1)\\,3)" if kind == 'rise' else '0'
        fc.append(f"[{last}][{i}:v]overlay=x='{x}':y='{y}':enable='between(t,{a:.2f},{b:.2f})'[v{i}]")
        last = f'v{i}'
    fc.append(f'[{last}]format=yuv420p,{COLOR_TAGS}[vout]')

    # --- Audio: voz con ganancia fija + parches de tono de sala en los bordes ---
    voice = ['aresample=48000']
    mix = []
    n_in = len(overlays) + 1
    if seg.get('patch_head'):
        p0, p1 = seg['patch_head']
        need = s0 - t0
        assert p1 - p0 >= need - 0.02, f'seg {idx}: patch_head corto ({p1 - p0:.2f} < {need:.2f})'
        voice.append(f'afade=t=in:st={max(0, need - 0.10):.3f}:d=0.08')
        inputs += ['-ss', f'{p0}', '-t', f'{need}', '-i', str(seg['src'])]
        fc.append(f'[{n_in}:a]aresample=48000,afade=t=in:d=0.03,'
                  f'afade=t=out:st={max(0, need - 0.10):.3f}:d=0.10[ph]')
        mix.append('[ph]')
        n_in += 1
    else:
        voice.append('afade=t=in:d=0.03')
    if seg.get('patch_tail'):
        p0, p1 = seg['patch_tail']
        off = s1 - t0 + 0.02
        need = dur - off + 0.06
        assert p1 - p0 >= need - 0.02, f'seg {idx}: patch_tail corto ({p1 - p0:.2f} < {need:.2f})'
        voice.append(f'afade=t=out:st={off:.3f}:d=0.08')
        inputs += ['-ss', f'{p0}', '-t', f'{need}', '-i', str(seg['src'])]
        fc.append(f'[{n_in}:a]aresample=48000,afade=t=in:d=0.08,afade=t=out:st={need - 0.04:.3f}:d=0.04,'
                  f'adelay={int((off - 0.02) * 1000)}:all=1[pt]')
        mix.append('[pt]')
        n_in += 1
    else:
        voice.append(f'afade=t=out:st={dur - 0.04:.3f}:d=0.04')
    fc.append(f"[0:a]{','.join(voice)}[vz]")
    if mix:
        fc.append(f"[vz]{''.join(mix)}amix=inputs={len(mix) + 1}:normalize=0:duration=first[am]")
    else:
        fc.append('[vz]anull[am]')
    fc.append(f'[am]volume={gain:.2f}dB,alimiter=limit=0.84:level=false,'
              f'aformat=sample_fmts=fltp:channel_layouts=stereo[aout]')

    out = tmp / f'seg{idx}.mp4'
    run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(fc),
         '-map', '[vout]', '-map', '[aout]', '-t', f'{dur}',
         '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '16', '-preset', 'medium',
         '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', str(out)])
    return out, dur, gain


def build(cfg):
    pid = cfg['id']
    tmp = WORK / pid
    tmp.mkdir(parents=True, exist_ok=True)

    default_td = cfg.get('xfade_secs', 0.3)
    margins, parts = [], []
    # Una sola ganancia por clip: si cada fragmento se nivelara aparte, el mismo
    # deportista saltaría de volumen entre un corte y el siguiente.
    spans = {}
    for seg in cfg['segments']:
        seg['src'] = str(Path(seg['src']).expanduser())
        a, b = seg['say']
        lo, hi = spans.get(seg['src'], (a, b))
        spans[seg['src']] = (min(lo, a), max(hi, b))
    gains = {src: max(-6.0, min(20.0, TARGET_LUFS - measure_lufs(src, a, b)))
             for src, (a, b) in spans.items()}
    for i, seg in enumerate(cfg['segments']):
        # Aire = distancia entre el borde del plano y la voz. Con parche, el aire es real.
        margins.append((seg['say'][0] - seg['start'], seg['end'] - seg['say'][1]))
        path, dur, gain = render_segment(seg, tmp, i, gains[seg['src']])
        parts.append([path, dur, seg.get('transition', 'fade'), seg.get('xfade', default_td)])
        print(f'  seg {i + 1}: {dur:5.2f}s  aire {margins[-1][0]:.2f}/{margins[-1][1]:.2f}  '
              f'ganancia {gain:+.1f} dB')


    for i in range(len(parts) - 1):
        want = parts[i][3]
        tail, head = margins[i][1], margins[i + 1][0]
        safe = want if want <= 0.05 else max(HARD_CUT, min(want, tail, head))
        if safe < want - 0.01:
            print(f'  · corte {i + 1}: fundido {want:.2f}s → {safe:.2f}s (aire {tail:.2f}/{head:.2f})')
        parts[i][3] = round(safe, 3)

    inputs = []
    for p, _, _, _ in parts:
        inputs += ['-i', str(p)]

    fc, vlast, alast, offset, cuts = [], None, None, 0.0, []
    starts = [0.0]  # dónde empieza cada segmento en la línea de tiempo final (para el .srt)
    for i in range(len(parts)):
        fc.append(f'[{i}:v]settb=AVTB,fps={FPS}[sv{i}]')
    for i in range(len(parts)):
        if i == 0:
            vlast, alast, offset = 'sv0', '0:a', parts[0][1]
            continue
        trans, td = parts[i - 1][2], parts[i - 1][3]
        fc.append(f'[{vlast}][sv{i}]xfade=transition={trans}:duration={td}:offset={offset - td}[xv{i}]')
        fc.append(f'[{alast}][{i}:a]acrossfade=d={td}:c1=tri:c2=tri[xa{i}]')
        cuts.append(round(offset - td / 2, 3))
        starts.append(offset - td)
        vlast, alast = f'xv{i}', f'xa{i}'
        offset += parts[i][1] - td

    # La pieza cierra sobre la cara del deportista, con fundido dentro de su propio aire
    fo = min(cfg.get('fade_out', 0.45), margins[-1][1])
    fc.append(f'[{vlast}]fade=t=out:st={offset - fo:.3f}:d={fo:.3f},format=yuv420p,{COLOR_TAGS}[vout]')
    fc.append(f'[{alast}]afade=t=out:st={offset - fo:.3f}:d={fo:.3f}[afo]')
    alast = 'afo'

    if cfg.get('music'):
        inputs += ['-i', str(Path(cfg['music']).expanduser())]
        mi = len(parts)
        g = cfg.get('music_gain', 0.12)
        fc.append(
            f'[{mi}:a]aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,'
            f'atrim=0:{offset},volume={g},afade=t=in:d=1,afade=t=out:st={offset - 1.5}:d=1.5[mus]'
        )
        fc.append(f'[{alast}]asplit[voz][sc];[mus][sc]sidechaincompress=threshold=0.05:ratio=12'
                  f':attack=12:release=350[duck]')
        fc.append('[voz][duck]amix=inputs=2:normalize=0[aout]')
    else:
        fc.append(f'[{alast}]anull[aout]')

    OUT.mkdir(exist_ok=True)
    out = OUT / f'{pid}.mp4'
    run(['ffmpeg', '-v', 'error', '-y', *inputs, '-filter_complex', ';'.join(fc),
         '-map', '[vout]', '-map', '[aout]', '-t', f'{offset}',
         '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', '-preset', 'slow',
         '-profile:v', 'high', '-c:a', 'aac', '-b:a', '256k', '-ar', '48000',
         '-movflags', '+faststart', str(out)])
    (tmp / 'cuts.json').write_text(json.dumps({'out': str(out), 'cuts': cuts, 'dur': offset}))
    print(f'{out}  ({offset:.1f} s)  cortes en: {" ".join(f"{c:.2f}" for c in cuts)}')
    write_srt(cfg, starts, out.with_suffix('.srt'))
    write_cover(out, cfg.get('cover_at', 1.0), OUT / f'{pid}-portada.jpg')


def srt_time(t):
    h, rem = divmod(max(0.0, t), 3600)
    m, sec = divmod(rem, 60)
    return f'{int(h):02d}:{int(m):02d}:{sec:06.3f}'.replace('.', ',')


def write_srt(cfg, starts, path):
    """Los mismos subtítulos quemados, en .srt con los tiempos del máster.

    Sirven para YouTube Shorts (que sí los indexa), para el pie accesible de la
    publicación y para revisar el texto sin volver a ver la pieza.
    """
    lines, n = [], 0
    for seg, s0 in zip(cfg['segments'], starts):
        for ca, cb, text in seg.get('captions', []):
            n += 1
            a, b = s0 + ca - seg['start'], s0 + cb - seg['start']
            lines.append(f'{n}\n{srt_time(a)} --> {srt_time(b)}\n{text}\n')
    path.write_text('\n'.join(lines))
    print(f'{path}  ({n} subtítulos)')


def write_cover(video, t, path):
    """Portada 1080x1440: es el recorte 3:4 con el que Instagram arma la cuadrícula del
    perfil. Sale del propio máster, así que ya trae el rótulo y el color de la pieza.
    El instante se elige con `cover_at` (segundos del máster)."""
    run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t}', '-i', str(video), '-frames:v', '1',
         '-vf', 'crop=1080:1440:0:240', '-q:v', '2', str(path)])
    print(f'{path}  (portada 3:4 en t={t:.2f}s)')


if __name__ == '__main__':
    build(json.loads(Path(sys.argv[1]).read_text()))
