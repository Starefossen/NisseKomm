#!/usr/bin/env python3
"""Make one Julius video diary entry from the locked script.

Usage: julius-dag.py <dag> [--dry-run]

Reads docs/manus/julius-2026.md, generates one clip per segment with julius.sh
(retries once on failure), joins them with a short tape glitch and writes
public/video/julius/dag-NN.mp4, compressed for the app.
"""
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = ROOT / "assets" / "bin"
OUT = ROOT / "assets" / "out"
DEST = ROOT / "public" / "video" / "julius"


def segments(day: int):
    text = (ROOT / "docs" / "manus" / "julius-2026.md").read_text()
    block = re.search(rf"^## Dag {day} \(.*?(?=^## Dag |\Z)", text, re.S | re.M)
    if not block:
        sys.exit(f"Fant ikke dag {day}")
    segs = []
    for m in re.finditer(
        r"\*\*Replikk:\*\* «(.+?)»\s*\n\s*- Varighet: (\d+) s.*?\n\s*- Handling: (.+?)\n\s*- Kulde: (.+?)\n",
        block.group(0),
        re.S,
    ):
        line, secs, action, kulde = m.groups()
        segs.append((line.strip(), int(secs), action.strip(), kulde.strip()))
    return segs


def main():
    day = int(sys.argv[1])
    dry = "--dry-run" in sys.argv
    segs = segments(day)
    names = []
    for i, (line, secs, action, kulde) in enumerate(segs, 1):
        name = f"dag{day:02d}-{i}"
        names.append(name)
        print(f"{name} ({secs} s): {line}")
        if dry or (OUT / f"{name}.mp4").exists():
            continue
        act = f"{action} Kuldes påvirkning i bildet og lyden: {kulde}"
        for attempt in (1, 2):
            r = subprocess.run([str(BIN / "julius.sh"), name, line, act, str(secs)], stdin=subprocess.DEVNULL)
            if r.returncode == 0:
                break
            if attempt == 2:
                sys.exit(f"{name} feilet to ganger")
    if dry:
        return
    glitch = OUT / "glitch.mp4"
    if not glitch.exists():
        subprocess.run(
            ["ffmpeg", "-nostdin", "-y", "-v", "error", "-f", "lavfi", "-i",
             "nullsrc=s=1280x720:r=24:d=0.3,geq=random(1)*255:128:128", "-f", "lavfi", "-i",
             "anoisesrc=a=0.08:d=0.3:r=48000", "-c:v", "libx264", "-pix_fmt", "yuv420p",
             "-c:a", "aac", "-ar", "48000", "-ac", "2", str(glitch)],
            check=True,
        )
    parts = []
    for n in names:
        norm = OUT / f"n_{n}.mp4"
        subprocess.run(
            ["ffmpeg", "-nostdin", "-y", "-v", "error", "-i", str(OUT / f"{n}.mp4"), "-vf",
             "fps=24,scale=1280:720,format=yuv420p", "-c:v", "libx264", "-c:a", "aac",
             "-ar", "48000", "-ac", "2", str(norm)],
            check=True,
        )
        parts += [norm, glitch]
    lst = OUT / f"dag{day:02d}.txt"
    lst.write_text("".join(f"file '{p}'\n" for p in parts[:-1]))
    DEST.mkdir(parents=True, exist_ok=True)
    dest = DEST / f"dag-{day:02d}.mp4"
    # ponytail: crf 28 + 96k audio lands around 8–12 MB per minute at 720p; raise crf if files grow
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-v", "error", "-f", "concat", "-safe", "0", "-i", str(lst),
         "-c:v", "libx264", "-crf", "28", "-preset", "slow", "-c:a", "aac", "-b:a", "96k",
         "-movflags", "+faststart", str(dest)],
        check=True,
    )
    print(dest)


if __name__ == "__main__":
    main()
