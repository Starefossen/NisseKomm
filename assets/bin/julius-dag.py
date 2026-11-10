#!/usr/bin/env python3
"""Make one Julius video diary entry from the locked script.

Usage: julius-dag.py <dag> [--dry-run] [--force] [--upload <base-url>]

Skips a day whose video is current (see medie.py) unless --force.

Reads docs/manus/julius-2026.md, generates one clip per segment with julius.sh
(retries on failure), audits each clip for continuity errors (up to 3 takes),
joins them with alternating framing (hard cuts, continuous audio) and writes
public/video/julius/dag-NN.mp4, compressed for the app.
"""
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import medie  # noqa: E402

ROOT = Path(__file__).resolve().parents[2]
BIN = ROOT / "assets" / "bin"
OUT = ROOT / "assets" / "out"
DEST = ROOT / "public" / "video" / "julius"


def segments(day: int):
    segs = medie.julius_segments(day)
    if not segs:
        sys.exit(f"Fant ikke dag {day}")
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

    for wait in (0, 30, 90, 180):  # the API answers 503/429 under load
        time.sleep(wait)
        try:
            text = json.load(urllib.request.urlopen(req))["candidates"][0]["content"]["parts"][-1]["text"]
            break
        except urllib.error.URLError as e:
            body = e.read().decode(errors="replace") if hasattr(e, "read") else ""
            if "requests per day" in body or "per day" in body:
                sys.exit("Stoppet: dagsgrensen for Gemini er nådd (requests per day)")
            print(f"  transkripsjon feilet ({e}), prøver igjen")
    else:
        return None  # unknown, not zero: keep the clip and flag it
    import difflib

    heard = set(words(text))
    script = words(line)
    # fuzzy: transcription spells names differently (Orakelet/Oraklet), so near matches count
    hit = lambda w: w in heard or bool(difflib.get_close_matches(w, heard, n=1, cutoff=0.75))
    return sum(hit(w) for w in script) / max(len(script), 1)


AUDIT = """You are a strict continuity supervisor for a short film. The man must hold a chrome microphone in his RIGHT hand the whole time. Watch every frame and list ONLY physics and continuity errors:
- props appearing, disappearing, duplicating or changing shape/identity (book, letters, papers, ink pot, wooden mug, glasses, switchboard, mic, cable)
- hands: extra/missing fingers, a third hand, hand passing through objects, objects merging with hands or each other, mic floating or held by no hand, mic switching hands
- body or furniture morphing, background objects changing
Do not report lighting, film grain, style or lip sync. For each error: timestamp (mm:ss), short description, severity: "minor" (only seen when looking for it) or "noticeable" (a 9-year-old would notice on first viewing).
Answer as JSON: {"errors":[{"t":"00:03","what":"...","severity":"minor|noticeable"}],"mic_hand_ok":true|false}"""


def audit(clip: Path):
    """Noticeable continuity errors in the clip (Gemini video review); None if the API failed."""
    import base64
    import json
    import time
    import urllib.error
    import urllib.request

    key = subprocess.run(["fnox", "get", "GEMINI_API_KEY"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    body = {"contents": [{"parts": [
        {"inlineData": {"mimeType": "video/mp4", "data": base64.b64encode(clip.read_bytes()).decode()}},
        {"text": AUDIT}]}], "generationConfig": {"responseMimeType": "application/json"}}
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
        data=json.dumps(body).encode(), headers={"x-goog-api-key": key, "Content-Type": "application/json"},
    )
    for wait in (0, 30, 90):
        time.sleep(wait)
        try:
            r = json.loads(json.load(urllib.request.urlopen(req))["candidates"][0]["content"]["parts"][-1]["text"])
            break
        except (urllib.error.URLError, KeyError, ValueError) as e:
            body = e.read().decode(errors="replace") if hasattr(e, "read") else ""
            if "requests per day" in body or "per day" in body:
                sys.exit("Stoppet: dagsgrensen for Gemini er nådd (requests per day)")
            print(f"  gjennomgang feilet ({e}), prøver igjen")
    else:
        return None
    bad = [f"{e['t']} {e['what']}" for e in r.get("errors", []) if e.get("severity") == "noticeable"]
    if not r.get("mic_hand_ok", True) and not bad:
        bad.append("mikrofonen bytter hånd eller forsvinner")
    return bad


# ponytail: word-set overlap, not alignment; catches dropped clauses, not swapped word order
MIN_COVERAGE = 0.9
ATTEMPTS = 3


def main():
    day = int(sys.argv[1])
    dry = "--dry-run" in sys.argv
    segs = segments(day)
    dest = DEST / f"dag-{day:02d}.mp4"
    if not dry and "--force" not in sys.argv and medie.status(dest)[0] == medie.CURRENT:
        print(f"{dest} er oppdatert; --force for å lage den på nytt")
        return
    names = []
    for i, (line, secs, action, kulde) in enumerate(segs, 1):
        name = f"dag{day:02d}-{i}"
        names.append(name)
        print(f"{name} ({secs} s): {line}")
        if dry or "--join-only" in sys.argv or "--refilter" in sys.argv:
            continue
        clip = OUT / f"{name}.mp4"
        raw = OUT / f"{name}.raw.mp4"  # check the unfiltered audio; the radio filter hurts transcription
        if clip.exists() and (coverage(raw, line) or 0) >= MIN_COVERAGE:
            continue
        act = f"{action} Kuldes påvirkning i bildet og lyden: {kulde}"
        best = (None, None)  # (score, problems); score = (clean, coverage)
        for attempt in range(1, ATTEMPTS + 1):
            r = subprocess.run([str(BIN / "julius.sh"), name, line, act, str(secs)], stdin=subprocess.DEVNULL)
            if r.returncode != 0:
                import time

                resp = OUT / f"{name}.resp.json"
                if resp.exists():
                    txt = resp.read_text()
                    if "spending cap" in txt:
                        sys.exit("Stoppet: månedlig utgiftstak i Gemini er nådd")
                    if "requests per day" in txt or "per day" in txt:
                        sys.exit("Stoppet: dagsgrensen for Gemini er nådd (requests per day)")

                time.sleep(60 * attempt)  # usually 429 from the video API; back off
                continue
            c = coverage(raw, line)
            c = 1.0 if c is None else c  # unknown: don't burn a take on an API hiccup
            bad = audit(raw) or []
            print(f"  {name}: {c:.0%} av replikken hørt, feil: {bad or 'ingen'}")
            score = (not bad, c)
            if best[0] is None or score > best[0]:
                for ext in ("mp4", "raw.mp4"):
                    shutil.copy(OUT / f"{name}.{ext}", OUT / f"{name}.best.{ext}")
                best = (score, bad)
            if not bad and c >= MIN_COVERAGE:
                break
        if best[0] is None:
            sys.exit(f"{name}: ingen versjon ble laget")
        # ponytail: falls back to the best take instead of aborting; check flagged clips by hand
        for ext in ("mp4", "raw.mp4"):
            shutil.copy(OUT / f"{name}.best.{ext}", OUT / f"{name}.{ext}")
        if best[1] or best[0][1] < MIN_COVERAGE:
            print(f"  ADVARSEL {name}: beste versjon {best[0][1]:.0%}, feil: {best[1]}")
    if dry:
        return
    if "--refilter" in sys.argv:  # no API calls: redo look and sound from the kept raw clips
        for n in names:
            subprocess.run([str(BIN / "julius-filter.sh"), str(OUT / f"{n}.raw.mp4"), str(OUT / f"{n}.mp4")], check=True)
    # alternating framing: every other segment a 1.15x crop on Julius, hard cut, continuous audio
    segs = [OUT / f"{n}.mp4" for n in names]
    dur = [float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)])) for p in segs]
    n = len(segs)
    w, h = int(1280 / 1.15) // 2 * 2, int(720 / 1.15) // 2 * 2
    fc = "".join(
        f"[{i}:v]fps=24,scale=1280:720,setsar=1" + (f",crop={w}:{h}:(iw-{w})*0.6:(ih-{h})*0.25,scale=1280:720,setsar=1" if i % 2 else "") + f",format=yuv420p[v{i}];"
        f"[{i}:a]aresample=48000,aformat=channel_layouts=stereo,afade=t=in:d=0.01,afade=t=out:st={dur[i] - 0.01}:d=0.01[a{i}];"
        for i in range(n)
    ) + "".join(f"[v{i}][a{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=1[v][a]"
    DEST.mkdir(parents=True, exist_ok=True)
    # ponytail: crf 28 + 96k audio lands around 8–12 MB per minute at 720p; raise crf if files grow
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-v", "error", *sum((["-i", str(p)] for p in segs), []),
         "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-crf", "28", "-preset", "slow", "-c:a", "aac", "-b:a", "96k",
         "-movflags", "+faststart", str(dest)],
        check=True,
    )
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-ss", "3", "-i", str(dest), "-frames:v", "1",
                    "-q:v", "3", str(dest.with_suffix(".jpg"))], check=True)
    medie.write("julius-dag.py", dest, medie.JULIUS_MS, f"Dag {day}", "gemini-omni-1.2-flash",
                ["assets/characters/julius/ref-v3.jpg"], extra={"filter_version": medie.filter_version()})
    print(dest)
    if "--upload" in sys.argv:
        upload(sys.argv[sys.argv.index("--upload") + 1], dest)


def upload(base: str, f: Path):
    """PUT the finished video to a lan-mode NisseKomm (e.g. http://nissekomm.lan).

    Needs NISSEKOMM_UPLOAD_TOKEN: a parent-level MCP token (locally the parent
    half of MCP_DEV_TOKEN). Checks the stored size via GET /api/media."""
    import json
    import os
    import urllib.request

    auth = {"Authorization": f"Bearer {os.environ['NISSEKOMM_UPLOAD_TOKEN']}"}
    rel = f"video/julius/{f.name}"
    base = base.rstrip("/")
    data = f.read_bytes()
    req = urllib.request.Request(
        f"{base}/api/media/{rel}", data=data, method="PUT",
        headers={**auth, "Content-Type": "video/mp4"},
    )
    with urllib.request.urlopen(req) as r:
        print(f"lastet opp {rel} ({r.status})")
    with urllib.request.urlopen(urllib.request.Request(f"{base}/api/media", headers=auth)) as r:
        size = next((m["size"] for m in json.load(r) if m["path"] == rel), None)
    if size != len(data):
        sys.exit(f"feil størrelse på serveren: {size} != {len(data)}")
    print(f"verifisert {rel}: {size} bytes")


if __name__ == "__main__":
    main()
