#!/usr/bin/env python3
"""SPYDER Build: python3 build.py  ->  dist/spyder.html (eine einzelne Datei).
Dateien in assets/ (textures/*.jpg, audio/*.mp3, ui/*.png) ersetzen die eingebetteten Daten – einfach austauschen und neu bauen."""
import re, os, base64, subprocess, sys
R = os.path.dirname(os.path.abspath(__file__)); S = R + '/src'; A = R + '/assets'
rd = lambda p: open(p, encoding='utf-8').read()
def emb(path): return base64.b64encode(open(path, 'rb').read()).decode()
def tex(s):
    def f(m):
        k = m.group(1) or m.group(2)
        for e in ('jpg', 'png'):
            p = f'{A}/textures/{k}.{e}'
            if os.path.exists(p): return m.group(0)[:m.group(0).index('"data:') ] + '"data:image/' + ('jpeg' if e == 'jpg' else 'png') + ';base64,' + emb(p) + '"'
        return m.group(0)
    return re.sub(r'(?:"(\w+)": |TEXB\.(\w+) = )"data:image/\w+;base64,[^"]*"', f, s)
def aud(s):
    def f(m):
        k = m.group(1) or m.group(2); p = f'{A}/audio/{k}.mp3'
        return m.group(0)[:m.group(0).rindex('"', 0, len(m.group(0)) - 1)] + '"' + emb(p) + '"' if os.path.exists(p) else m.group(0)
    return re.sub(r'(?:"(\w+)": |SND_B64\.(\w+) = )"[A-Za-z0-9+/=]{200,}"', f, s)
def ui(s):
    c = [0]
    def f(m):
        c[0] += 1; p = f'{A}/ui/ui_{c[0]:02d}.png'
        return 'data:image/png;base64,' + emb(p) if os.path.exists(p) else m.group(0)
    return re.sub(r'data:image/png;base64,[A-Za-z0-9+/=]+', f, s)
ORDER = ['b.js(head4)', 'i18n.js', 'b.js(rest)', 'tex.js', 'c.js', 'd1.js', 'd2.js', 'melee.js', 'menu.js', 'act.js', 'story.js', 'dmg.js', 'shaft.js', 'robot.js', 'alley.js', 'bar.js', 'ch2.js', 'city.js', 'shop.js', 'job.js', 'sfx.js', 'snd.js', 'uisnd.js', 'd3.js']
parts = []
for f in ORDER:
    if f == 'b.js(head4)': parts.append(''.join(rd(S + '/b.js').splitlines(True)[:4]))
    elif f == 'b.js(rest)': parts.append(''.join(rd(S + '/b.js').splitlines(True)[4:]))
    else:
        t = rd(S + '/' + f)
        parts.append(tex(t) if f == 'tex.js' else aud(t) if f in ('sfx.js', 'uisnd.js') else t)
out = ui(rd(S + '/index.template.html')).replace('/*GPU_LIB*/', rd(S + '/three.webgpu.js'), 1) + ''.join(parts)
os.makedirs(R + '/dist', exist_ok=True); open(R + '/dist/spyder.html', 'w', encoding='utf-8').write(out)
print('OK -> dist/spyder.html', len(out) // 1024, 'KB')
