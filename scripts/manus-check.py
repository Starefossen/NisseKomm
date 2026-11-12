#!/usr/bin/env python3
"""Recompute counts in the three manus files and run a leak check.
Usage: manus-check.py [--write]  (without --write: report only)
"""
import math, re, sys
from pathlib import Path
D = str(Path(__file__).resolve().parent.parent / "docs/manus") + "/"
read_ = lambda f: Path(f).read_text(encoding="utf-8")
write_ = lambda f, t: Path(f).write_text(t, encoding="utf-8")
J, R, A = D + "julius-2026.md", D + "rampenissen-radio-2026.md", D + "app-tekster-2026.md"
WRITE = "--write" in sys.argv
CODES = {1:"SIGNAL",2:"48",3:"PRISME",4:"KOMPASS",5:"ULRIKEN",6:"LYKT",7:"KULDE",8:"KRETSKORT",9:"24",
 10:"SPEKTER",11:"75",12:"MELODI",13:"SAFRAN",14:"ORIGAMI",15:"KARAMELL",16:"SORTERING",17:"NORDLYS",
 18:"TURBULENS",19:"GULROT",20:"TURBO",21:"BRANNMUR",22:"LANDÅS",23:"STJERNEKLART",24:"JULEMAGI"}
wc = lambda s: len(s.split())
dur = lambda n: min(15, math.ceil(0.5 + n / 1.79 + 2))  # as julius-dag.py: START + n/WPS + TAIL

def split_days(text):
    parts = re.split(r"^#{2,3} Dag (\d+)", text, flags=re.M)
    out = {}
    for i in range(1, len(parts), 2):
        out[int(parts[i])] = parts[i + 1].split("\n---", 1)[0].split("\n## ", 1)[0]
    return out

# ---------- Julius ----------
jt = read_(J)
jd = split_days(jt)
jrows = {}
for d, body in jd.items():
    segs = re.findall(r"\d+\. \*\*Replikk:\*\* «(.*?)»\n   - Varighet: (\d+) s \((\d+) ord\)", body)
    words = []
    for rep, vs, ws in segs:
        n = wc(rep)
        words.append(n)
        if n > 26: print(f"JULIUS dag {d}: segment over 26 ord ({n}): {rep[:50]}")
        new = f"- Varighet: {dur(n)} s ({n} ord)"
        old = f"- Varighet: {vs} s ({ws} ord)"
        if old != new:
            print(f"JULIUS dag {d}: {old} -> {new}")
            jt = jt.replace(f"«{rep}»\n   {old}", f"«{rep}»\n   {new}")
    tot = sum(words)
    jrows[d] = (tot, round(tot / 2), sum(dur(n) for n in words), len(words), max(words))
# table
def jrow(m):
    d = int(m.group(1)); tot, tale, klipp, seg, longest = jrows[d]
    return f"| {m.group(1):<3} | {m.group(2)} | {tot:<3} | {tale:<6} | {klipp:<7} | {seg:<5} | {longest:<7} |"
jt2 = re.sub(r"^\| (\d+)\s* \| (\S+\s*) \| \d+\s* \| \d+\s* \| \d+\s* \| \d\s* \| \d+\s* \|", jrow, jt, flags=re.M)
jsum = sum(v[0] for v in jrows.values())
jt2 = re.sub(r"Sum: [\d ]+ ord, snitt \d+ per dag", f"Sum: {jsum:,}".replace(",", " ") + f" ord, snitt {round(jsum/24)} per dag", jt2)
print("JULIUS sum", jsum, "snitt", round(jsum / 24))
if WRITE and jt2 != read_(J): write_(J, jt2)

# ---------- Radio ----------
rt = read_(R)
rd = split_days(rt)
rrows = {}
for d, body in rd.items():
    m = re.search(r"\*\*Klipp:\*\* «(.*?)»\n", body, re.S)
    rrows[d] = wc(m.group(1))
def rrow(m):
    d = int(m.group(1)); n = rrows[d]
    return f"| {m.group(1):<3} | {m.group(2)} | {n:<3} | {round(n/2.4):<3} |"
rt2 = re.sub(r"^\| (\d+)\s* \| (\S+\s*) \| \d+\s* \| \d+\s* \|", rrow, rt, flags=re.M)
rsum = sum(rrows.values())
rt2 = re.sub(r"Sum: [\d ]+ ord, snitt \d+ per dag \(cirka \d+ s\)", f"Sum: {rsum:,}".replace(",", " ") + f" ord, snitt {round(rsum/24)} per dag (cirka {round(rsum/24/2.4)} s)", rt2)
print("RADIO sum", rsum)
if WRITE and rt2 != read_(R): write_(R, rt2)

# ---------- App ----------
at = read_(A)
def mail(m):
    n = len([t for t in m.group(2).split() if t != "–" and re.search(r"[\wæøå]", t)])
    if n > 90: print(f"APP: e-post over 90 ord ({n}): {m.group(2)[:40]}")
    if int(m.group(1)) != n: print(f"APP: e-post ordtall {m.group(1)} -> {n}: {m.group(2)[:40]}")
    return f"- `nissemail_tekst` ({n} ord): {m.group(2)}"
at2 = re.sub(r"^- `nissemail_tekst` \((\d+) ord\): (.*)$", mail, at, flags=re.M)
if WRITE and at2 != at: write_(A, at2)

# ---------- Leak check ----------
ad = split_days(at2)
def norm(s): return s.lower()
def chunks(code):
    L = len(code); mn = math.floor(0.4 * L) + 1
    if code.isdigit(): return {code}
    return {code[i:i + k].lower() for k in range(mn, L + 1) for i in range(L - k + 1)}
IGNORE_WORDS = {"rampenissen", "rampenissens", "rampen", "hverandre", "andre", "fra", "etter", "kommer", "kom", "handler",
                "gammel", "kilden", "vinter", "vinteren", "melding", "ter", "aldri", "kaldt", "elleve", "fortelle", "tjernet"}
def spoken_surfaces(d):
    out = []
    for rep in re.findall(r"\*\*Replikk:\*\* «(.*)»", jd[d]): out.append(("julius", rep))
    out.append(("radio", re.search(r"\*\*Klipp:\*\* «(.*?)»\n", rd[d], re.S).group(1)))
    out.append(("intro", re.search(r"\*\*intro_hint:\*\* «(.*?)»", rd[d]).group(1)))
    r = re.search(r"\*\*reaksjon_hint:\*\* «(.*?)»", rd[d])
    if r: out.append(("reaksjon", r.group(1)))
    body = ad[d]
    for key in ("tittel", "nissemail_tekst", "julius_ps", "julius_ps_bonus", "daily_alerts", "symbol_clue.description"):
        for m in re.finditer(r"^- `" + re.escape(key) + r"`[^:]*: (.*)$", body, re.M): out.append((key, m.group(1)))
    for m in re.finditer(r"^  > (.*)$", body, re.M): out.append(("nissenet", m.group(1)))
    return out
hits = []
for d, code in CODES.items():
    cs = chunks(code)
    for surf, text in spoken_surfaces(d):
        if surf == "tittel": text = re.sub(r"\(.*\)", "", text)
        for w in re.findall(r"[\wæøåÆØÅ]+", text):
            lw = w.lower()
            if lw in IGNORE_WORDS: continue
            if code.isdigit():
                if lw == code: hits.append((d, code, surf, w))
                continue
            for c in cs:
                if c in lw: hits.append((d, code, surf, w, c)); break
for h in hits: print("LEAK?", h)
