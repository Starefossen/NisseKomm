#!/usr/bin/env python3
"""Cut fast app montages for the Julius promos from Playwright screen recordings.

Usage: promo-montasje.py <opptak-A-mappe> <opptak-B-mappe> <ut-mappe>
Each recording folder holds r.webm and marks.json ([[name, seconds]], from the recording script).
Writes A-1.mp4 … and B-1.mp4 …, one per cut, for julius-dag.py --cutaway <fil>:<kutt>:<sek>.
Every shot opens with a 2-frame CRT glitch (noise, lift, desaturate) so the cuts snap.

Full cut (v4): promo-montasje.py lag <julius.mp4> <opptak> <A|B> <ut.mp4> [dag] [klipp-mappe]
<julius.mp4> is julius-dag.py's join without --cutaway (end card kept); the recording comes from a
script that marks {name, t, box} per shot (box = 16:9 crop of the window). Writes 1920x1080: a sped-up
boot, the desktop, then Julius with app shots laid over the middle of every segment. Julius' sound
runs under the shots untouched; he is on screen for HEAD s at the start and TAIL s at the end."""
import json, subprocess, sys
from pathlib import Path

DESK_BLUR = "boxblur=6:1,eq=brightness=-0.04"  # B: mood only, no tile names readable
VIDEO = "crop=844:474:218:168"  # Dagbok: the video, not the day title
SLEDE = "crop=640:360:320:195"  # flight only: no stage name (HUD), no radio box
TVBILDE = "crop=700:394:290:160"  # TV picture without the channel label

# (mark, offset into the shot, seconds, extra filter)
A = [
    [("desk", 0.2, 0.9, ""), ("mail", 0.1, 0.7, ""), ("tv", 0.3, 0.9, ""), ("kal", 0.2, 0.8, "")],
    [("dagbok", 0.4, 0.9, VIDEO), ("nissenet", 0.2, 0.8, ""), ("tv2", 0.4, 0.9, ""), ("brev", 0.3, 0.9, "")],
    [("ugle", 1.6, 1.1, ""), ("kode-type", 0.1, 1.2, "")],
    [("slede", 0.8, 1.0, SLEDE), ("slede", 3.2, 1.1, SLEDE)],
]
B = [
    [("desk", 0.3, 1.0, DESK_BLUR), ("tv", 1.0, 1.4, TVBILDE)],
    [("tv", 0.1, 0.8, TVBILDE), ("desk", 1.2, 0.8, DESK_BLUR), ("tv", 1.9, 1.0, TVBILDE)],
    [("kal", 0.3, 1.2, ""), ("tv", 2.0, 0.8, TVBILDE)],
]


def cut(src: Path, shots, dest: Path):
    marks = dict(json.load(open(src / "marks.json")))
    args, fc = [], ""
    for i, (m, off, d, f) in enumerate(shots):
        args += ["-ss", f"{marks[m] + off:.3f}", "-t", f"{d:.3f}", "-i", str(src / "r.webm")]
        fx = (f + ",") if f else ""
        fc += (f"[{i}:v]{fx}scale=1280:720,setsar=1,fps=24,format=yuv420p,"
               "noise=alls=70:allf=t:enable='lt(t,0.09)',eq=brightness=0.12:saturation=0.3:enable='lt(t,0.09)',"
               f"setpts=PTS-STARTPTS[s{i}];")
    fc += "".join(f"[s{i}]" for i in range(len(shots))) + f"concat=n={len(shots)}:v=1:a=0[v]"
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", *args, "-filter_complex", fc, "-map", "[v]",
                    "-c:v", "libx264", "-crf", "18", "-an", str(dest)], check=True)
    return sum(s[2] for s in shots)


HD = "1920:1080"
HEAD, TAIL = 2.0, 1.0
GLITCH = ("noise=alls=70:allf=t:enable='lt(t,0.09)',eq=brightness=0.12:saturation=0.3:enable='lt(t,0.09)'")
# (mark, offset, seconds, push-in, speed); consumed in order, segment by segment
TV, KAL_LÅST = [216, 130, 848, 477], [170, 300, 760, 428]
# (mark, offset, seconds, push-in, speed[, box]); one list per Julius segment, laid from HEAD s in
LAG = {
    "A": dict(intro=[("boot", 0.2, 2.6, False, 2.0), ("desk", 0.3, 1.6, True, 1)], shots=[
        [("tile", 0.1, 1.1, False, 1), ("mail-open", 0.2, 0.8, False, 1), ("mail", 0.2, 1.1, False, 1),
         ("tv-K1", 0.1, 1.0, False, 1)],
        [("tv-K2", 0.1, 0.9, False, 1), ("tv-K3", 0.1, 0.9, False, 1), ("kal", 0.2, 1.3, False, 1),
         ("dagbok-auto", 0.5, 1.0, True, 1), ("nissenet", 0.2, 1.2, False, 1)],
        [("brev", 0.3, 2.4, False, 1.6), ("kode", 0.1, 1.4, False, 1), ("symbol", 0.1, 1.2, False, 1),
         ("ugle", 0.1, 1.4, False, 1), ("slede", 0.5, 1.2, False, 1)],
        [("slede", 3.5, 1.2, False, 1), ("slede", 6.5, 1.2, False, 1), ("slede", 2.0, 1.2, False, 1)]]),
    "B": dict(intro=[("boot", 0.2, 2.6, False, 2.0), ("desk", 0.3, 1.6, True, 1)], shots=[
        [("tv-K1", 0.4, 1.5, True, 1, TV), ("kal", 0.2, 1.3, True, 1, KAL_LÅST), ("tv-K1", 6.0, 1.5, True, 1, TV)],
        [("tv-K1", 12.0, 1.5, True, 1, TV), ("kal", 0.6, 1.3, True, 1, KAL_LÅST), ("tv-K1", 20.0, 1.5, True, 1, TV)],
        [("tv-K1", 28.0, 1.5, True, 1, TV), ("kal", 0.4, 1.3, True, 1, KAL_LÅST), ("tv-K1", 40.0, 1.5, True, 1, TV)]]),
}
WINDOW = [170, 8, 940, 529]  # 16:9 over a centred 896 px window at 1280x720
DIM = "eq=brightness=-0.18:saturation=0.6"  # B: mood only


def shot_filter(i, box, d, push, speed, extra=""):
    x, y, w, h = box
    pz = (f",zoompan=z='1+0.06*on/{int(d * 24)}':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s=1920x1080:fps=24"
          if push else "")
    return (f"[{i}:v]setpts=(PTS-STARTPTS)/{speed},fps=24,trim=duration={d:.3f},crop={w}:{h}:{x}:{y},"
            f"scale={HD}:flags=lanczos{pz},setsar=1{extra and ',' + extra},format=yuv420p,{GLITCH},"
            f"setpts=PTS-STARTPTS[p{i}];")


def lag(base: Path, rec: Path, mode: str, dest: Path, day: int, clips: Path):
    import importlib.util
    spec = importlib.util.spec_from_file_location("jd", Path(__file__).with_name("julius-dag.py"))
    jd = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(jd)
    segs = sorted(clips.glob(f"dag{day}-[0-9].mp4"))
    spans = [jd.speech_span(p, jd.seconds(p)) for p in segs]
    lens = [b - a for a, b in spans]
    starts = [sum(lens[:k]) - k * jd.XFADE for k in range(len(lens))]
    marks = {}
    for m in json.load(open(rec / "marks.json")):
        marks.setdefault(m["name"], m)
    plan = LAG[mode]
    pieces, todo = [], []
    for st, ln, shots in zip(starts, lens, plan["shots"]):
        t, b = st + HEAD, st + ln - TAIL
        for s in shots:
            if t + s[2] / s[4] > b + 0.3:
                todo.append(s)
                continue
            pieces.append(("shot", s, t))
            t += s[2] / s[4]
    timeline, t = [], 0.0
    for kind, s, at in pieces:
        if at > t:
            timeline.append(("base", t, at))
        timeline.append(("shot", s))
        t = at + s[2] / s[4]
    total = jd.seconds(base)
    timeline.append(("base", t, total))
    intro = [("shot", s) for s in plan["intro"]]
    args, fc, labels = [], "", []
    for n, item in enumerate(intro + timeline):
        if item[0] == "shot":
            name, off, d, push, speed = item[1][:5]
            m = marks[name]
            box = item[1][5] if len(item[1]) > 5 else m.get("box", [0, 0, 1280, 720])
            if box[2] > 1200 and name not in ("boot", "desk", "tile"):
                box = WINDOW  # the overlay, not the window: crop to the window's upper part
            args += ["-ss", f"{m['t'] + off:.3f}", "-t", f"{d * speed + 0.5:.3f}", "-i", str(rec / "r.webm")]
            extra = DIM if mode == "B" and name == "desk" else ""
            fc += shot_filter(n, box, d / speed if speed > 1 else d, push, speed, extra)
        else:
            _, a, b = item
            args += ["-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", str(base)]
            fc += f"[{n}:v]fps=24,scale={HD}:flags=lanczos,setsar=1,format=yuv420p,setpts=PTS-STARTPTS[p{n}];"
        labels.append(f"[p{n}]")
    lead = sum(s[2] / s[4] for s in plan["intro"])
    k = len(labels)
    fc += "".join(labels) + f"concat=n={k}:v=1:a=0[v];"
    fc += f"[{k}:a]adelay={int(lead * 1000)}:all=1,apad=pad_dur=0.1[a]"
    args += ["-i", str(base)]
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", *args, "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
                    "-shortest", "-c:v", "libx264", "-crf", "26", "-preset", "slow", "-c:a", "aac", "-b:a", "128k",
                    "-movflags", "+faststart", str(dest)], check=True)
    app = sum(s[2] / s[4] for _, s, _ in pieces) + lead
    print(f"{dest}: {total + lead:.1f} s, app {app:.1f} s ({app / (total + lead):.0%}), "
          f"{len(pieces) + len(intro)} bilder, ubrukt: {[s[0] for s in todo]}")


if __name__ == "__main__":
    if sys.argv[1] == "lag":
        b, r, m, d = sys.argv[2:6]
        day = int(sys.argv[6]) if len(sys.argv) > 6 else (90 if m == "A" else 91)
        clips = Path(sys.argv[7]) if len(sys.argv) > 7 else Path(__file__).resolve().parents[2] / "assets" / "out"
        lag(Path(b), Path(r), m, Path(d), day, clips)
        sys.exit()
    a, b, out = map(Path, sys.argv[1:4])
    out.mkdir(parents=True, exist_ok=True)
    for name, src, plan in (("A", a, A), ("B", b, B)):
        for k, shots in enumerate(plan, 1):
            print(f"{name}-{k}.mp4 {cut(src, shots, out / f'{name}-{k}.mp4'):.1f} s, {len(shots)} bilder")
