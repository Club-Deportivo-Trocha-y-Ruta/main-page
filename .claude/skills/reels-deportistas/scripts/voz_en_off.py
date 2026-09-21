#!/usr/bin/env python3
"""Reel con relato en off: la voz de una persona (el director deportivo, un entrenador)
cuenta la jornada mientras pasan las escenas, entre un arranque y un cierre con su audio
original. Formato aprobado en la III Válida DH de Cali Bike Park (2026-09-20).

    python3 voz_en_off.py pieza.json --demo   # sin subtítulos, banda ni estilos: para aprobar
    python3 voz_en_off.py pieza.json          # versión final para redes

Estructura y reglas: ../referencias/formato-voz-en-off.md. Imagen y audio van por
separado: cada plano se renderiza mudo con una cola congelada para el fundido, el audio se
mezcla entero en numpy sobre la línea de tiempo y solo al final se unen. Mezclar el relato
con `amix` dentro del filtergraph de los planos lo dejó mudo sin dar error.
"""
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np

import captions
from hlg import lut_filter
from overlays import FPS, run, strip_png, zoom_expr

WORK = Path('/tmp/tyr-video')
OUT = Path.home() / 'Downloads/trocha-reels'
SR = 48000
T = -16.0          # nivel de voz por frase (RMS sobre pasa-altos de 120 Hz), antes del máster
TARGET_LUFS = -14.0
HANDLE = 0.5       # cola congelada de cada plano: da material al fundido sin mover el corte
COLOR = 'setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709'
BASE_PROMPT = 'Club Trocha y Ruta, Yumbo. Pista Carlos Castro. Copa Valle.'


# ---------- fuentes ----------

def probe(src, entries):
    return subprocess.run(['ffprobe', '-v', 'error', *entries, '-of', 'csv=p=0', str(src)],
                          capture_output=True, text=True).stdout


def aac_index(src):
    """Los .mov del iPhone traen una pista APAC (audio espacial) que ffmpeg no decodifica y
    la AAC, en posición 1 o 2 según el clip: se elige la AAC explícitamente."""
    for line in probe(src, ['-show_entries', 'stream=index,codec_name']).splitlines():
        idx, codec = line.split(',')[:2]
        if codec == 'aac':
            return int(idx)
    raise SystemExit(f'{src}: sin pista AAC')


def is_hlg(src):
    return 'arib-std-b67' in probe(src, ['-select_streams', 'v:0', '-show_entries', 'stream=color_transfer'])


def read(src, a, b, af='anull'):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', f'{a}', '-t', f'{b - a}', '-i', str(src),
                          '-map', f'0:{aac_index(src)}', '-af', af, '-f', 'f32le', '-ac', '2', '-ar', str(SR), '-'],
                         capture_output=True).stdout
    return np.frombuffer(raw, np.float32).reshape(-1, 2).copy()


def rms_db(x):
    return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)


def speech_db(src, a, b, af='anull'):
    return rms_db(read(src, a, b, af + ',highpass=f=120'))


def lufs_of(args):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-nostats', *args, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True)
    i = re.findall(r'I:\s+(-?[\d.]+) LUFS', r.stderr)
    p = re.findall(r'Peak:\s+(-?[\d.]+) dBFS', r.stderr)
    return (float(i[-1]) if i else -20.0), (float(p[-1]) if p else 0.0)


# ---------- transcripción ----------

_model = None


def transcript(src, prompt, work):
    """Whisper large-v3-turbo del clip entero, en caché: palabras y frases con tiempos."""
    js = work / 'whisper' / (Path(src).stem + '.json')
    if not js.exists():
        global _model
        import whisper
        if _model is None:
            _model = whisper.load_model('large-v3-turbo')
        js.parent.mkdir(parents=True, exist_ok=True)
        r = _model.transcribe(str(src), language='es', word_timestamps=True, temperature=0,
                              condition_on_previous_text=False, initial_prompt=prompt)
        js.write_text(json.dumps({'segments': [{'start': s['start'], 'end': s['end'], 'text': s['text'],
                                                'words': s.get('words', [])} for s in r['segments']]},
                                 ensure_ascii=False))
    return json.loads(js.read_text())


# ---------- audio ----------

def envelope(n, base_db, phrases, t0, ramp=0.06):
    """Curva de ganancia: `base_db` fuera de las frases, la propia de cada frase dentro."""
    g = np.full(n, base_db, np.float32)
    for a, b, gdb in phrases:
        g[max(0, int((a - t0) * SR)):min(n, int((b - t0) * SR))] = gdb
    k = max(1, int(ramp * SR))
    g = np.convolve(g, np.ones(k) / k, mode='same')
    return (10 ** (g / 20))[:, None]


def fade(x, fi=0.03, fo=0.03):
    a, b = int(fi * SR), int(fo * SR)
    if a:
        x[:a] *= np.linspace(0, 1, a)[:, None]
    if b:
        x[len(x) - b:] *= np.linspace(1, 0, b)[:, None]
    return x


def leveled(src, a, b, phrases, base_offset, af='anull', cap=24):
    """Cada frase al mismo nivel T; entre frases, la ganancia mediana + `base_offset`.

    Nivelar el clip entero no sirve: la invitación quedaba 5 dB bajo el relato.
    """
    x = read(src, a, b, af)
    ph = [(p0, p1, min(cap, T - speech_db(src, p0, p1, af))) for p0, p1 in phrases]
    base = float(np.median([g for *_, g in ph])) + base_offset if ph else 0.0
    return x * envelope(len(x), base, ph, a)


def shot_audio(sh, src, words_src):
    """`words_src` es una función: Whisper solo corre si hacen falta las frases."""
    """Audio original de un plano de arranque o cierre, ya nivelado."""
    a, b = sh['in'], sh['out']
    lv = sh.get('level', {})
    mode = lv.get('mode', 'phrases')
    af = 'afftdn=nr=20:nf=-55:tn=1' if lv.get('denoise') else 'anull'
    if mode == 'whole':   # celebración, público: todo el tramo a un solo nivel
        x = read(src, a, b, af)
        x *= 10 ** ((T + lv.get('offset', 0) - speech_db(src, a, b, af)) / 20)
    elif mode == 'fixed':
        # Ganancia FIJA para toda la escena (la de la voz lejana) y solo se bajan las
        # preguntas pegadas al micrófono. Subir la voz frase a frase hacía bombear el fondo.
        g = min(21.0, float(np.mean([T - speech_db(src, p0, p1, af) for p0, p1 in lv['fixed']])))
        duck = [(p0, p1, T - 1 - speech_db(src, p0, p1, af)) for p0, p1 in lv.get('duck', [])]
        x = read(src, a, b, af)
        x *= envelope(len(x), g, duck, a, ramp=0.18)
    else:
        phrases = lv.get('phrases') or [(max(a, s['start'] - 0.05), min(b, s['end'] + 0.05))
                                        for s in words_src()['segments'] if s['end'] > a and s['start'] < b]
        x = leveled(src, a, b, phrases, lv.get('offset', -4), af)
    fi, fo = sh.get('afade', [0.03, 0.03])
    return fade(x, fi, fo)


def clip_gain(src):
    lufs, _ = lufs_of(['-i', str(src), '-map', f'0:{aac_index(src)}'])
    return max(-8.0, min(18.0, -15.0 - lufs))


# ---------- imagen ----------

def render_shot(i, sh, src, dur, demo, work):
    out = work / 'shots' / f'{i:02d}{"d" if demo else ""}.mov'
    out.parent.mkdir(parents=True, exist_ok=True)
    slow = sh.get('slow', 1.0)
    vf = [f'setpts={slow}*PTS'] if slow != 1.0 else []
    vf.append(f'fps={FPS}')
    if is_hlg(src):
        vf.append(lut_filter())
    if sh.get('zoom'):   # empuje suave: supersampleo 4× + curva quíntica (ver montage.py)
        cx, cy = sh.get('focus', [0.5, 0.5])
        vf += ['scale=4320:-2:flags=lanczos',
               f"zoompan=z='{zoom_expr(sh['zoom'])}':x='(iw-iw/zoom)*{cx}':y='(ih-ih/zoom)*{cy}':d=1:s=1080x1920:fps={FPS}"]
    if sh.get('crop_zoom'):   # recorte fijo para acercar una acción lejana
        z = sh['crop_zoom']
        cx, cy = sh.get('focus', [0.5, 0.5])
        vf.append(f'crop=iw/{z}:ih/{z}:(iw-iw/{z})*{cx}:(ih-ih/{z})*{cy}')
    vf += ['scale=1080:1920:flags=lanczos:out_color_matrix=bt709,format=yuv420p',
           f'tpad=stop_mode=clone:stop_duration={HANDLE}']
    ins = ['-ss', f'{sh["in"]}', '-t', f'{(dur + HANDLE) / slow + 0.2}', '-i', str(src)]
    fc = f"[0:v]{','.join(vf)}[v0]"
    last = 'v0'
    if sh.get('label'):
        p = work / 'shots' / f'label{i}{"d" if demo else ""}.png'
        name, detail = sh['label']
        if demo:
            captions.plain_label_png(name, detail, p)
            x = '0'
        else:
            captions.tag_png(name, detail, p, sh.get('label_y', 1170))
        t0 = sh.get('label_in', 0.4)
        if not demo:  # entra deslizándose desde la izquierda en 0,4 s
            x = f"-w*pow(1-min((t-{t0:.2f})/0.4\\,1)\\,3)"
        ins += ['-i', str(p)]
        fc += f";[v0][1:v]overlay=x='{x}':y=0:enable='between(t,{t0},{min(dur - 0.3, t0 + 3.6)})'[v1]"
        last = 'v1'
    fc += f';[{last}]{COLOR}[v]'
    run(['ffmpeg', '-v', 'error', '-y', *ins, '-filter_complex', fc, '-map', '[v]', '-t', f'{dur + HANDLE}',
         '-an', '-c:v', 'libx264', '-crf', '17', '-preset', 'fast', str(out)])
    return out


# ---------- pieza ----------

def plan(cfg):
    """Lista de planos con su duración e inicio en la pieza."""
    d = Path(cfg['dir']).expanduser()
    v = cfg['voice']
    shots = [dict(s, part='intro', dur=s['out'] - s['in']) for s in cfg['intro']]
    for j, s in enumerate(cfg['broll']):
        nxt = cfg['broll'][j + 1]['at'] if j + 1 < len(cfg['broll']) else v['out'] - v['in']
        assert s.get('audio', 'amb') != 'full', 'durante el relato solo hay ambiente o silencio'
        shots.append(dict(s, part='broll', dur=nxt - s['at']))
    shots += [dict(s, part='outro', dur=s['out'] - s['in']) for s in cfg['outro']]
    t = 0.0
    for s in shots:
        s['start'], s['path'] = t, d / s['src']
        t += s['dur']
    return shots, t


def mix(cfg, shots, total, work, prompt):
    v = cfg['voice']
    d = Path(cfg['dir']).expanduser()
    vsrc = d / v['src']
    buf = np.zeros((int(round(total * SR)) + SR, 2), np.float32)

    def put(x, t):
        i = int(round(t * SR))
        buf[i:i + len(x)] += x[:len(buf) - i]

    for s in shots:
        if s['part'] != 'broll' and s.get('audio', 'full') == 'full':
            put(shot_audio(s, s['path'], lambda s=s: transcript(s['path'], prompt, work)), s['start'])
    # Relato: frases de Whisper, cada una a nivel T
    vt0 = next(s['start'] for s in shots if s['part'] == 'broll')
    segs = [(max(v['in'], g['start'] - 0.05), min(v['out'], g['end'] + 0.05))
            for g in transcript(vsrc, prompt, work)['segments'] if g['end'] > v['in'] and g['start'] < v['out']]
    vo = fade(leveled(vsrc, v['in'], v['out'], segs, v.get('offset', -3), cap=v.get('cap', 16)), 0.05, 0.15)
    # Ambiente de los planos, en promedio 20 dB por debajo del relato
    amb = np.zeros_like(vo)
    for s in shots:
        if s['part'] == 'broll' and s.get('audio', 'amb') == 'amb' and s.get('slow', 1.0) == 1.0:
            x = fade(read(s['path'], s['in'], s['in'] + s['dur']) * 10 ** ((clip_gain(s['path']) - 16) / 20), 0.05, 0.05)
            i = int(round((s['start'] - vt0) * SR))
            amb[i:i + len(x)] += x[:len(amb) - i]
    if np.abs(amb).max() > 0:
        amb *= 10 ** ((rms_db(vo) - v.get('ambient_db', 20) - rms_db(amb)) / 20)
    put(vo + amb, vt0)
    buf = buf[:int(round(total * SR))]
    # Máster: ganancia fija a −14 LUFS y limitador; si el pico real pasa de −1 dBTP, se baja
    raw = work / 'mix.f32'
    buf.astype(np.float32).tofile(raw)
    src = ['-f', 'f32le', '-ar', str(SR), '-ac', '2', '-i', str(raw)]
    lufs, _ = lufs_of(src)
    gain = TARGET_LUFS - lufs
    wav = work / 'master.wav'
    for _ in range(4):
        run(['ffmpeg', '-v', 'error', '-y', *src, '-af', f'volume={gain:.2f}dB,alimiter=limit=0.84:level=false',
             '-c:a', 'pcm_s24le', str(wav)])
        lufs, peak = lufs_of(['-i', str(wav)])
        if peak <= -1.0:
            break
        gain -= peak + 1.2
    print(f'  máster {lufs:+.1f} LUFS, pico real {peak:+.1f} dBTP')
    return wav, vt0


def caption_words(cfg, shots, vt0, work, prompt):
    """Subtítulos y palabras de Whisper, todo en tiempo de la pieza."""
    v = cfg['voice']
    d = Path(cfg['dir']).expanduser()
    caps, words = [], []

    def add(src, t0, src0, lo, hi, items):
        caps.extend((t0 + a - src0, t0 + b - src0, x) for a, b, x in items)
        for s in transcript(src, prompt, work)['segments']:
            for w in s['words']:
                if lo <= w['start'] < hi:
                    words.append((t0 + w['start'] - src0, t0 + w['end'] - src0, w['word']))

    for s in shots:
        if s['part'] != 'broll' and s.get('captions'):
            add(s['path'], s['start'], s['in'], s['in'], s['out'], s['captions'])
    add(d / v['src'], vt0, v['in'], v['in'], v['out'], v.get('captions', []))
    return sorted(caps), words


def srt_time(t):
    h, rem = divmod(max(0.0, t), 3600)
    m, sec = divmod(rem, 60)
    return f'{int(h):02d}:{int(m):02d}:{sec:06.3f}'.replace('.', ',')


def build(cfg, demo):
    pid = cfg['id']
    work = WORK / pid
    work.mkdir(parents=True, exist_ok=True)
    prompt = f"{BASE_PROMPT} {cfg.get('prompt', '')}".strip()
    shots, total = plan(cfg)
    wav, vt0 = mix(cfg, shots, total, work, prompt)
    parts = []
    for i, s in enumerate(shots):
        parts.append(render_shot(i, s, s['path'], s['dur'], demo, work))
        print(f"  {i:02d} {s['part']:5s} {s['start']:6.2f}s +{s['dur']:5.2f}s  {s['src'][:34]}")

    ins, fc, last = [], [], '0:v'
    for p in parts:
        ins += ['-i', str(p)]
    dt = cfg.get('default_transition', ['dissolve', 0.35])
    for i in range(1, len(parts)):
        name, dur = shots[i].get('transition', dt)
        fc.append(f"[{last}][{i}:v]xfade=transition={name}:duration={dur}:offset={shots[i]['start']:.3f}[x{i}]")
        last = f'x{i}'
    k = len(parts)

    caps = []
    if not demo:
        caps, words = caption_words(cfg, shots, vt0, work, prompt)
        st = cfg.get('strip')
        strip_t = shots[len(cfg['intro']) + len(cfg['broll']) + st['outro']]['start'] + st.get('in', 0.8) if st else 1e9
        top = [(s['start'], s['start'] + s['dur']) for s in shots if s.get('captions_top')]
        is_top = lambda a: any(t0 <= a < t1 for t0, t1 in top)
        bot = work / 'captions.mov'
        captions.build(caps, words, total, bot, cy_for=lambda a: captions.CY_STRIP if a >= strip_t - 1.0 else captions.CY,
                       only=lambda a: not is_top(a))
        ins += ['-i', str(bot)]
        fc.append(f'[{last}][{k}:v]overlay=y={captions.BAND_Y}:eof_action=pass[cb]')
        last, k = 'cb', k + 1
        if top:
            tp = work / 'captions-top.mov'
            captions.build(caps, words, total, tp, band=captions.TOP_BAND, cy_for=lambda a: captions.TOP_CY, only=is_top)
            ins += ['-i', str(tp)]
            fc.append(f'[{last}][{k}:v]overlay=y={captions.TOP_BAND[0]}:eof_action=pass[ct]')
            last, k = 'ct', k + 1
        if st:
            from PIL import Image
            sp = work / 'strip.png'
            strip_png(st['text'], sp)
            im = Image.open(sp)
            up = Image.new('RGBA', im.size)
            up.paste(im, (0, -120))   # y = 1440: fuera del 20 % inferior que tapa la app
            up.save(sp)
            ins += ['-i', str(sp)]
            fc.append(f"[{last}][{k}:v]overlay=y='70*pow(1-min((t-{strip_t:.2f})/0.45\\,1)\\,3)'"
                      f":enable='gte(t,{strip_t:.2f})'[sb]")
            last, k = 'sb', k + 1

    fo = cfg.get('fade_out', 0.45)
    fc.append(f'[{last}]trim=0:{total:.3f},fade=t=out:st={total - fo:.3f}:d={fo:.3f},format=yuv420p,{COLOR}[v]')
    OUT.mkdir(exist_ok=True)
    out = OUT / f'{pid}{"-demo" if demo else ""}.mp4'
    run(['ffmpeg', '-v', 'error', '-y', *ins, '-i', str(wav), '-filter_complex', ';'.join(fc),
         '-map', '[v]', '-map', f'{k}:a', '-t', f'{total:.3f}', '-c:v', 'libx264', '-crf', '21', '-maxrate', '10M',
         '-bufsize', '20M', '-preset', 'medium', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
         '-c:a', 'aac', '-b:a', '256k', '-ar', '48000', '-movflags', '+faststart', str(out)])
    print(f'{out}  ({total:.1f} s)')
    if not demo:
        out.with_suffix('.srt').write_text('\n'.join(
            f'{i + 1}\n{srt_time(a)} --> {srt_time(b)}\n{x}\n' for i, (a, b, x) in enumerate(caps)))
        cover = OUT / f'{pid}-portada.jpg'
        run(['ffmpeg', '-v', 'error', '-y', '-ss', f"{cfg.get('cover_at', 1.0)}", '-i', str(out), '-frames:v', '1',
             '-vf', 'crop=1080:1440:0:240', '-q:v', '2', str(cover)])
        print(f'{out.with_suffix(".srt")}  ({len(caps)} subtítulos)\n{cover}')
    (work / 'cuts.json').write_text(json.dumps({'out': str(out), 'dur': total,
                                                'cuts': [s['start'] for s in shots[1:]]}))


if __name__ == '__main__':
    build(json.loads(Path(sys.argv[1]).read_text()), '--demo' in sys.argv)
