#!/usr/bin/env python3
"""Make one Julius video diary entry from the locked script.

Usage: julius-dag.py <dag> [--dry-run]

Reads docs/manus/julius-2026.md, generates one clip per segment with julius.sh
(retries once on failure), joins them with a short tape glitch and writes
public/video/julius/dag-NN.mp4, compressed for the app.
"""
import re
import shutil
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


def words(s: str):
    return re.findall(r"[a-zæøå]+", s.lower())


def coverage(clip: Path, line: str) -> float:
    """Share of the script's words heard in the clip (Gemini transcription)."""
    import base64
    import json
    import urllib.error
    import urllib.request

    key = subprocess.run(["fnox", "get", "GEMINI_API_KEY"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    mp3 = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", str(clip), "-vn", "-ac", "1", "-ar", "16000", "-f", "mp3", "-"],
        capture_output=True, check=True,
    ).stdout
    body = {"contents": [{"parts": [
        {"inlineData": {"mimeType": "audio/mp3", "data": base64.b64encode(mp3).decode()}},
        {"text": "Transcribe exactly what is said, in Norwegian. Write all numbers as words (85,0 = åttifem komma null). Output only the transcript."},
    ]}]}
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
        data=json.dumps(body).encode(), headers={"x-goog-api-key": key, "Content-Type": "application/json"},
    )
    import time

    for wait in (0, 10, 30):  # the transcription API sometimes answers 503
        time.sleep(wait)
        try:
            text = json.load(urllib.request.urlopen(req))["candidates"][0]["content"]["parts"][-1]["text"]
            break
        except urllib.error.URLError as e:
            print(f"  transkripsjon feilet ({e}), prøver igjen")
    else:
        return 0.0
    import difflib

    heard = set(words(text))
    script = words(line)
    # fuzzy: transcription spells names differently (Orakelet/Oraklet), so near matches count
    hit = lambda w: w in heard or bool(difflib.get_close_matches(w, heard, n=1, cutoff=0.75))
    return sum(hit(w) for w in script) / max(len(script), 1)


# ponytail: word-set overlap, not alignment; catches dropped clauses, not swapped word order
MIN_COVERAGE = 0.9
ATTEMPTS = 4


def main():
    day = int(sys.argv[1])
    dry = "--dry-run" in sys.argv
    segs = segments(day)
    names = []
    for i, (line, secs, action, kulde) in enumerate(segs, 1):
        name = f"dag{day:02d}-{i}"
        names.append(name)
        print(f"{name} ({secs} s): {line}")
        if dry:
            continue
        clip = OUT / f"{name}.mp4"
        raw = OUT / f"{name}.raw.mp4"  # check the unfiltered audio; the radio filter hurts transcription
        if clip.exists() and coverage(raw, line) >= MIN_COVERAGE:
            continue
        act = f"{action} Kuldes påvirkning i bildet og lyden: {kulde}"
        best = (-1.0, None)
        for attempt in range(1, ATTEMPTS + 1):
            r = subprocess.run([str(BIN / "julius.sh"), name, line, act, str(secs)], stdin=subprocess.DEVNULL)
            if r.returncode != 0:
                continue
            c = coverage(raw, line)
            print(f"  {name}: {c:.0%} av replikken hørt")
            if c > best[0]:
                keep = name
                for ext in ("mp4", "raw.mp4"):
                    shutil.copy(OUT / f"{name}.{ext}", OUT / f"{name}.best.{ext}")
                best = (c, keep)
            if c >= MIN_COVERAGE:
                break
        if best[1] is None:
            sys.exit(f"{name}: ingen versjon ble laget")
        # ponytail: falls back to the best take instead of aborting; listen to flagged clips by hand
        for ext in ("mp4", "raw.mp4"):
            shutil.copy(OUT / f"{name}.best.{ext}", OUT / f"{name}.{ext}")
        if best[0] < MIN_COVERAGE:
            print(f"  ADVARSEL {name}: beste versjon {best[0]:.0%}, lytt gjennom")
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
