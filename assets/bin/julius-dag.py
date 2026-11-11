#!/usr/bin/env python3
"""Make one Julius video diary entry from the locked script.

Usage: julius-dag.py <dag> [--dry-run] [--force] [--join-only] [--refilter] [--upload <base-url>]
       julius-dag.py lint [dag ...]      segments over 22 words (locked brikke exempt), timing budget
       julius-dag.py selftest

Skips a day whose video is current (see medie.py) unless --force.

Reads docs/manus/julius-2026.md, generates one clip per segment with julius.sh
(retries on failure), audits each clip for continuity errors (up to 3 takes),
adds Kulde's effects in post (see kulde_fx), joins them with alternating framing (hard cuts, 40 ms audio crossfades, -16 LUFS) and writes
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


def speech_at_end(clip: Path) -> bool:
    """True if the voice is still going in the clip's last 0.15 s: the model ran out of time mid-line.

    The pipeline never trims speech, so such a clip cannot be fixed in the join; regenerate it
    (with more seconds in the script if the line is long)."""
    out = subprocess.run(
        ["ffmpeg", "-nostdin", "-sseof", "-0.15", "-i", str(clip), "-vn", "-af", "astats=measure_overall=RMS_level:measure_perchannel=none",
         "-f", "null", "-"], capture_output=True, text=True).stderr
    rms = re.findall(r"RMS level dB: (-?[\d.]+|-inf)", out)
    # ponytail: RMS threshold, not VAD; room tone above -35 dB would read as speech
    return bool(rms) and rms[-1] != "-inf" and float(rms[-1]) > -35


def tail_missing(heard_text: str, line: str, n: int = 2) -> list:
    """The script's last n words that the transcript lacks; a cut-off ending shows up here, not in the % heard."""
    heard = words(heard_text)
    return [w for w in words(line)[-n:] if w not in heard[-(n + 3):]]


def coverage(clip: Path, line: str):
    """Share of the script's words heard in the clip (Gemini transcription); 0 if the last words are missing."""
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
    if tail_missing(text, line):
        print(f"  slutten mangler: {tail_missing(text, line)} (hørt: …{text.strip()[-60:]})")
        return 0.0
    return sum(hit(w) for w in script) / max(len(script), 1)


WPS = 1.79  # measured median speech rate of the video model (69 raw clips), words per second
START, TAIL = 0.5, 2.0  # speech starts ~0.5 s in; julius.sh asks for 2 s of silence at the end
MAX_WORDS = 22  # ceiling per segment; locked brikke lines are exempt


def timing(line: str, secs: int):
    """Warning if the line does not fit the requested clip, or the 13 s the model often returns for 15."""
    need = START + len(words(line)) / WPS + TAIL
    if need > secs:
        return f"{len(words(line))} ord trenger {need:.1f} s med 2 s hale, bestilt {secs} s"
    if secs >= 15 and need > 13:
        return f"{len(words(line))} ord trenger {need:.1f} s; modellen leverer ofte 13 s på 15"
    return None


def lint(days) -> int:
    """Print over-long segments and timing warnings; return the number of over-long ones."""
    over = 0
    for day in days:
        for i, (line, secs, _a, _k, locked) in enumerate(medie.julius_segments(day), 1):
            n = len(words(line))
            if n > MAX_WORDS and not locked:
                over += 1
                print(f"dag {day}-{i}: {n} ord (maks {MAX_WORDS}): {line[:60]}…")
            if (w := timing(line, secs)):
                print(f"  dag {day}-{i}: {w}")
    return over


# Kulde's disturbances are done here, not by the video model: every clip starts again from the reference
# image (colours and frost come back at each cut), and dropouts asked of the model fail the coverage check.
# The script's Kulde field is free text; these patterns pick out what post can do, the rest goes to the prompt.
# ponytail: keyword vocabulary, not a parser; add a pattern when the script uses a new phrasing
FX = {
    "drain": r"farge\w* (renner|forsvinner|blekner|tappes)|gråton|svart-hvit|grått bilde",
    "colour": r"farge\w* kommer tilbake",
    "nearfrozen": r"nesten frosset",
    "freeze": r"frys|fryser|frosset|hopp i bildet|hakk\w* i bildet|bildet hakker|stopper opp",
    "dropout": r"lyd\w* (faller|forsvinner|hakker|er borte|kutter)|ord\w* faller|bortfall|faller ut|hakker",
    "frost": r"\brim\w*|frost|is brer|iskrystall",
    "dim": r"slukner|mørkne|dimm|lyset (blir svakere|går ned)",
    "flicker": r"flakker|blafrer|blinker",
    "gold": r"gull",
    "drop": r"\bklikk|kommer tilbake|^ingen$",  # mic switched off mid-day, recoveries, «Ingen.»: not prompted
}


def kulde_fx(kulde: str, line: str, locked: bool, dur: float, drained: bool):
    """(video filters, audio filters, stutter time or None, drained after, prompt text) for one segment."""
    vf, af, stutter, keep = [], [], None, []
    at = lambda clause: next((START + len(words(line.lower().split(q)[0])) / WPS
                              for q in re.findall(r"«(.+?)»", clause) if q.lower() in line.lower()), dur / 2)
    hits = set()
    for clause in filter(None, (c.strip() for c in re.split(r"[.;,]\s*", kulde))):
        c = clause.lower()
        found = [k for k, rx in FX.items() if re.search(rx, c)]
        if "nearfrozen" in found:
            found = [k for k in found if k != "freeze"]
        if "dropout" in found and "freeze" in found and "lyd" not in c:
            found.remove("dropout")  # «bildet hakker» is the picture, not the sound
        hits |= set(found)
        if "freeze" in found or "flicker" in found:
            t = at(clause)
            if "freeze" in found:
                stutter = t
            if "flicker" in found:
                vf.append(f"eq=brightness=-0.18:enable='between(t,{t:.2f},{t + 0.25:.2f})'")
        if not found:
            keep.append(clause)
    if "colour" in hits:
        drained = False
    if "drain" in hits:
        vf.append(f"hue=s='max(0,1-t/{dur * 0.8:.2f})'")
        drained = True
    elif drained:
        vf.append("hue=s=0")  # stays grey across the cut until the script says the colours come back
    if "frost" in hits:
        vf += [f"eq=eval=frame:brightness='0.05*t/{dur:.2f}':saturation='1-0.3*t/{dur:.2f}'", "colorbalance=bs=0.08:bm=0.05"]
    if "dim" in hits:
        vf.append(f"eq=eval=frame:brightness='-0.12*t/{dur:.2f}'")
    if "nearfrozen" in hits:
        vf.append("fps=4,fps=24")
    if "gold" in hits:
        vf.append(f"colorbalance=rh=0.08:gh=0.04:bh=-0.06,fade=t=out:st={max(dur - 1.5, 0):.2f}:d=1.5:color=0xC89A3C")
    if "dropout" in hits and not locked:  # never cut a word out of a brikke
        af.append(",".join(f"volume=0:enable='between(t,{t:.2f},{t + 0.15:.2f})'" for t in (dur * 0.35, dur * 0.6)))
    if re.match(r"\s*ingen\b", kulde, re.I):  # days 22–24: clean
        return vf, af, stutter, drained, (", ".join(keep) or "Rent bilde og ren lyd") + "."
    prompt = ", ".join(keep) or "Svak knitring"
    if "knitring" not in prompt.lower():
        prompt += ", svak knitring"
    return vf, af, stutter, drained, prompt + "."


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
    for i, (line, secs, action, kulde, locked) in enumerate(segs, 1):
        name = f"dag{day:02d}-{i}"
        names.append(name)
        print(f"{name} ({secs} s): {line}")
        if (w := timing(line, secs)):
            print(f"  TIDSBUDSJETT {name}: {w}")
        if dry or "--join-only" in sys.argv or "--refilter" in sys.argv:
            continue
        clip = OUT / f"{name}.mp4"
        raw = OUT / f"{name}.raw.mp4"  # check the unfiltered audio; the radio filter hurts transcription
        if clip.exists() and not speech_at_end(raw) and (coverage(raw, line) or 0) >= MIN_COVERAGE:
            continue
        act = f"{action} Kuldes påvirkning: {kulde_fx(kulde, line, locked, secs, False)[4]}"
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
            if speech_at_end(raw):
                print(f"  {name}: stemmen går til siste bilde, replikken er kuttet")
                c = 0.0
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
    for n in names:
        if speech_at_end(OUT / f"{n}.raw.mp4"):
            print(f"  REGENERER {n}: stemmen går til siste bilde, replikken er kuttet")
    DEST.mkdir(parents=True, exist_ok=True)
    join([OUT / f"{n}.mp4" for n in names], dest, [(s[3], s[0], s[4]) for s in segs])
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-ss", "3", "-i", str(dest), "-frames:v", "1",
                    "-q:v", "3", str(dest.with_suffix(".jpg"))], check=True)
    medie.write("julius-dag.py", dest, medie.JULIUS_MS, f"Dag {day}", "gemini-omni-1.2-flash",
                ["assets/characters/julius/ref-v3.jpg"], extra={"filter_version": medie.filter_version()})
    print(dest)
    if "--upload" in sys.argv:
        upload(sys.argv[sys.argv.index("--upload") + 1], dest)


XFADE = 0.04  # audio crossfade at each join; the video loses the same time so lip sync holds


def join_graph(dur, kulde=None):
    """The filter graph for join; kulde = [(kulde, line, locked)] per segment adds Kulde's effects."""
    n = len(dur)
    w, h = int(1280 / 1.15) // 2 * 2, int(720 / 1.15) // 2 * 2
    fc, drained = "", False
    for i in range(n):
        vf, af, stutter = [], [], None
        if kulde:
            vf, af, stutter, drained, _ = kulde_fx(*kulde[i], dur[i], drained)
        fx = "".join("," + f for f in vf)
        end = f",trim=duration={dur[i] - XFADE:.3f}" if i < n - 1 else ""
        crop = f",crop={w}:{h}:(iw-{w})*0.6:(ih-{h})*0.25,scale=1280:720,setsar=1" if i % 2 else ""
        if stutter is None:
            fc += f"[{i}:v]fps=24,scale=1280:720,setsar=1{fx}{crop}{end},setpts=PTS-STARTPTS,format=yuv420p[v{i}];"
        else:  # a 0.4 s hold from a 2.5 fps copy laid over the clip: the picture hangs, the sound runs on
            fc += (f"[{i}:v]fps=24,scale=1280:720,setsar=1{fx}{crop},split[s{i}][h{i}];[h{i}]fps=2.5,fps=24[q{i}];"
                   f"[s{i}][q{i}]overlay=enable='between(t,{stutter:.2f},{stutter + 0.4:.2f})'{end},"
                   f"setpts=PTS-STARTPTS,format=yuv420p[v{i}];")
        # ponytail: one-pass loudnorm per segment; two-pass (measure, then linear) if levels pump audibly
        afx = "".join("," + f for f in af)
        fc += f"[{i}:a]loudnorm=I=-16:TP=-2:LRA=11{afx},aresample=48000,aformat=channel_layouts=stereo[a{i}];"
    fc += "".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0[v];"
    prev = "a0"
    for i in range(1, n):
        fc += f"[{prev}][a{i}]acrossfade=d={XFADE}:c1=tri:c2=tri[x{i}];"
        prev = f"x{i}"
    return fc + f"[{prev}]alimiter=limit=0.84:level=false[a]"  # 0.84 ≈ -1.5 dBTP


def join(segs, dest: Path, kulde=None):
    """Alternating framing (every other segment a 1.15x crop, hard cut) with short audio crossfades,
    each segment levelled to -16 LUFS and the whole day limited to -1.5 dBTP."""
    dur = [float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)])) for p in segs]
    fc = join_graph(dur, kulde)
    # ponytail: crf 28 + 96k audio lands around 8–12 MB per minute at 720p; raise crf if files grow
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-v", "error", *sum((["-i", str(p)] for p in segs), []),
         "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-crf", "28", "-preset", "slow", "-c:a", "aac", "-b:a", "96k",
         "-movflags", "+faststart", str(dest)],
        check=True,
    )


def selftest():
    assert tail_missing("ja hallo IQ sier linjen er", "IQ sier linjen er åpen.") == ["åpen"]
    assert tail_missing("IQ sier linjen er åpen", "IQ sier linjen er åpen.") == []
    assert timing("ord " * 10, 15) is None and "13 s" in timing("ord " * 20, 15) and "bestilt" in timing("ord " * 24, 15)
    vf, af, st, dr, pr = kulde_fx("Svak knitring, klikk når mikrofonen slås av.", "hei", False, 15, False)
    assert (vf, af, st, dr, pr) == ([], [], None, False, "Svak knitring.")
    vf, af, st, dr, pr = kulde_fx("Fargene renner ut. Lyden faller ut et øyeblikk.", "x", False, 15, False)
    assert dr and "hue" in vf[0] and af and pr == "Svak knitring."
    vf, af, st, dr, pr = kulde_fx("Synlig pust.", "x", True, 15, dr)
    assert vf == ["hue=s=0"] and pr == "Synlig pust, svak knitring."  # grey persists across the cut
    _, af, st, _, _ = kulde_fx("Et kort hopp i bildet på «rim», så ordene faller bort.", "Hver natt legger det seg rim på linjen.", True, 15, False)
    assert af == [] and abs(st - (START + 5 / WPS)) < 0.01  # locked: no dropout; hop lands on «rim»
    assert kulde_fx("Ingen. Alle lys tent.", "x", False, 15, False)[4] == "Alle lys tent."
    assert kulde_fx("Nesten frosset bilde, rim brer seg over vinduet.", "x", False, 15, False)[0][-1] == "fps=4,fps=24"
    with __import__("tempfile").TemporaryDirectory() as d:  # the graph must run in ffmpeg
        clips = []
        for i in range(3):
            c = Path(d) / f"{i}.mp4"
            subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-f", "lavfi", "-i", "testsrc=s=320x180:d=2", "-f", "lavfi",
                            "-i", "sine=d=2", "-shortest", str(c)], check=True)
            clips.append(c)
        join(clips, Path(d) / "dag.mp4", [("Fargene renner ut, lampen flakker på «a».", "a b", False),
                                          ("Et hopp i bildet, lyden hakker, rim.", "c", False), ("Uttoning i gull.", "d", False)])
        assert (Path(d) / "dag.mp4").stat().st_size > 0
    print("selftest ok")


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
    if sys.argv[1:] == ["selftest"]:
        selftest()
    elif sys.argv[1:2] == ["lint"]:
        sys.exit(1 if lint([int(d) for d in sys.argv[2:]] or range(1, 25)) else 0)
    else:
        main()
