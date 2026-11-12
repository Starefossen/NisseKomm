#!/usr/bin/env python3
"""Cut fast app montages for the Julius promos from Playwright screen recordings.

Usage: promo-montasje.py <opptak-A-mappe> <opptak-B-mappe> <ut-mappe>
Each recording folder holds r.webm and marks.json ([[name, seconds]], from the recording script).
Writes A-1.mp4 … and B-1.mp4 …, one per cut, for julius-dag.py --cutaway <fil>:<kutt>:<sek>.
Every shot opens with a 2-frame CRT glitch (noise, lift, desaturate) so the cuts snap."""
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


if __name__ == "__main__":
    a, b, out = map(Path, sys.argv[1:4])
    out.mkdir(parents=True, exist_ok=True)
    for name, src, plan in (("A", a, A), ("B", b, B)):
        for k, shots in enumerate(plan, 1):
            print(f"{name}-{k}.mp4 {cut(src, shots, out / f'{name}-{k}.mp4'):.1f} s, {len(shots)} bilder")
