#!/usr/bin/env python3
"""Transcribe ventanas [a,b] de un clip con el modelo grande: confirma qué se oye exactamente entre dos cortes."""
import sys, wave
import numpy as np, whisper
_m = None
def model():
    global _m
    if _m is None: _m = whisper.load_model('large-v3-turbo')
    return _m
def window(wav, a, b):
    with wave.open(wav) as w:
        sr = w.getframerate(); w.setpos(int(a*sr))
        x = np.frombuffer(w.readframes(int((b-a)*sr)), dtype=np.int16).astype(np.float32)/32768
    return x
def hear(wav, a, b):
    r = model().transcribe(window(wav, a, b), language='es', word_timestamps=True,
        condition_on_previous_text=False, temperature=0,
        initial_prompt="Club Trocha y Ruta, Yumbo. Pista Carlos Castro. Copa Valle. Alcalá. Prejuvenil.")
    return ' '.join(f"{w['word'].strip()}[{a+w['start']:.2f}-{a+w['end']:.2f}]" for s in r['segments'] for w in s['words'])
if __name__ == '__main__':
    import json
    for wav, a, b in json.loads(sys.argv[1]):
        print(f'{wav} {a:.2f}-{b:.2f}: {hear(f"/tmp/tyr-video/{wav}.wav", a, b)}')
