#!/usr/bin/env python3
"""Make one Julius video diary entry from the locked script.

Usage: julius-dag.py <dag> [--suffix -v3] [--segment N]... [--uten-manusgodkjenning] [--extend] [--dry-run] [--force] [--alle] [--join-only] [--refilter] [--chain] [--forsøk N] [--over-budsjett] [--cutaway <klipp.mp4>[:kutt[:sek]]]... [--manus <fil>] [--dest <mappe>] [--plakat <bilde>] [--upload <base-url>]
       julius-dag.py lint [dag ...]      segments over 22 words (locked brikke exempt), timing budget
       julius-dag.py manus [--sjekk]      bake src/data/julius-manus.json (review hash and lint per segment)
       julius-dag.py segmenter [dag ...]  back-fill dag-NN*.segmenter.json from assets/out (ffmpeg only, no calls)
       julius-dag.py <dag> --kutt [--suffix -v3]  ✂ verdicts: trim the raw takes with ffmpeg, join a new -vN (0 kr + transcription)
       julius-dag.py lyd [dag ...]        back-fill <video>.lyd.json (audio peaks per 0.1 s, ffmpeg only)
       julius-dag.py selftest

Script gate: a segment that would cost a video call needs its script approved (godkjent/ok) in the guide,
id manus/julius/dag-NN#sK, on the current hash of [line, secs, action] (the take.json key). Otherwise it stops
and lists what is missing. --uten-manusgodkjenning skips the gate: use it ONLY when Hans has said yes explicitly.
Segment lock: a segment whose clip is approved (video/julius/dag-NN#sK, godkjent/ok on the raw clip's hash)
is never remade, not even with --alle. --extend goes through the same gate and lock (it refuses if any
segment is locked). Without media-vurdering.json (wrong MEDIA_DIR) both fail closed: it stops.
Outside the gate: --manus <fil> (promo, own script, not reviewed), --dry-run/--join-only/--refilter (no calls),
and generer.py --selvtest (no calls). --segment N (repeatable) remakes only those segments and keeps the rest.
The join writes dag-NN-vN.segmenter.json next to the video (timecodes, take hash, transcript, flags).

Skips a day whose video is current (see medie.py) unless --force.

Reads docs/manus/julius-2026.md, generates one clip per segment with julius.sh
(retries on failure), audits each clip for continuity errors (one take by default; flagged segments are listed for review before take 2),
adds Kulde's effects in post (see kulde_fx), joins them with alternating framing (0.25 s crossfades in the silent tail, -16 LUFS) and writes
public/video/julius/dag-NN.mp4, compressed for the app.
"""
import json
import os
import re
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import forbruk  # noqa: E402
import medie  # noqa: E402

ROOT = medie.ROOT  # NISSEKOMM_ROOT: run this copy on another checkout's assets/out and public/
BIN = ROOT / "assets" / "bin"
OUT = ROOT / "assets" / "out"
DEST = ROOT / "public" / "video" / "julius"


def arg(flag: str):
    return sys.argv[sys.argv.index(flag) + 1] if flag in sys.argv else None


def segments(day: int):
    segs = medie.julius_segments(day, ms=arg("--manus") or medie.JULIUS_MS)
    if not segs:
        sys.exit(f"Fant ikke dag {day}")
    return segs


def words(s: str):
    return re.findall(r"[a-zæøå]+", s.lower())


def wcount(s: str) -> int:
    """Speech-budget words: a hyphenated token («Lucia-morgen», «TV-en») is spoken as one word."""
    return len(re.findall(r"[a-zæøå0-9]+(?:-[a-zæøå0-9]+)*", s.lower()))


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


# Known transcriber mishearings / spelling variants, each group counts as one word.
SAMME = [{"tjernet", "kjernen"}, {"god", "godt"}, {"ses", "sees"}, {"telte", "teltet"}]
# The video model has not been tested on Norwegian (omni.md): names come out spelled freely, so the transcriber gets them
NAVN = "IQ, Kristian, Håkon, Hanna, Hjerterud, Winter, Trixter, Pil, Rudolf, Orakelet, Vintervokteren, Fargesamleren, Rampenissen, Kulde, Snøfall, Nordtoppen, Landås"
IQ = re.compile(r"\b(?:i[ .-]?q|iku|eq|i-ku)\b", re.I)


def squash(w: str) -> str:
    """«goooood» = «god», «sees» = «ses»: repeated letters count once on both sides."""
    return re.sub(r"(.)\1+", r"\1", w)


def spoken(line: str) -> str:
    """The line without its quotes: a «…» inside the line is read in dialect and spelled freely, so it is not checked."""
    return re.sub(r"«[^»]*»", " ", line)


def lev1(a: str, b: str) -> bool:
    """Levenshtein distance <= 1."""
    if abs(len(a) - len(b)) > 1:
        return False
    if len(a) > len(b):
        a, b = b, a
    i = 0
    while i < len(a) and a[i] == b[i]:
        i += 1
    return a[i + 1:] == b[i + 1:] or a[i:] == b[i + 1:]


def heard_as(w: str, heard) -> bool:
    """Is script word w in the transcript: exact, a known variant, or one edit away (words of 5+ letters)."""
    w = squash(w)
    return any(w == h or any(w in g and h in g for g in SAMME) or (len(w) >= 5 and len(h) >= 5 and lev1(w, h))
               for h in map(squash, heard))


def tail_missing(heard_text: str, line: str, n: int = 2) -> list:
    """The script's last n words (outside quotes) that the transcript lacks anywhere; a cut-off ending shows up here."""
    heard = words(IQ.sub("iq", heard_text))
    return [w for w in words(spoken(line))[-n:] if not heard_as(w, heard)]


def extra_words(heard_text: str, line: str) -> str:
    """Words heard after the script's last word («Det var det hele, du»): the trim cannot remove them."""
    heard, last = words(IQ.sub("iq", heard_text)), words(spoken(line))[-1:]
    hits = [i for i, h in enumerate(heard) if last and heard_as(last[0], [h])]
    return " ".join(heard[hits[-1] + 1:]) if hits else ""


def check(text: str, line: str):
    """(coverage, missing words, extra words) of a transcript against the line; coverage 0 if the end is missing."""
    heard = words(IQ.sub("iq", text))
    script = words(spoken(line))
    missing = [w for w in script if not heard_as(w, heard)]
    if tail_missing(text, line):
        return 0.0, missing, extra_words(text, line)
    return 1 - len(missing) / max(len(script), 1), missing, extra_words(text, line)


def coverage(clip: Path, line: str):
    """(share of the script's words heard, transcript, missing, extra) for the clip (Gemini transcription);
    share 0 if the last words are missing, None if the API failed. The transcript is saved as <clip>.txt."""
    import base64
    import json
    import urllib.error
    import urllib.request

    key = os.environ.get("GEMINI_API_KEY") or subprocess.run(["fnox", "get", "GEMINI_API_KEY"], cwd=ROOT, capture_output=True, text=True, check=True).stdout.strip()
    mp3 = subprocess.run(
        ["ffmpeg", "-nostdin", "-v", "error", "-i", str(clip), "-vn", "-ac", "1", "-ar", "16000", "-f", "mp3", "-"],
        capture_output=True, check=True,
    ).stdout
    body = {"contents": [{"parts": [
        {"inlineData": {"mimeType": "audio/mp3", "data": base64.b64encode(mp3).decode()}},
        {"text": "Transcribe exactly what is said, in Norwegian. Write all numbers as words (85,0 = åttifem komma null). "
                 f"Names that may occur, spell them like this: {NAVN}. Output only the transcript."},
    ]}]}
    forbruk.logg("transkripsjon", "gemini-3.5-flash", "julius-dag.py", clip.name)
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
        data=json.dumps(body).encode(), headers={"x-goog-api-key": key, "Content-Type": "application/json"},
    )
    import time

    for wait in (0, 30, 90, 180):  # the API answers 503/429 under load
        time.sleep(wait)
        try:
            text = json.load(urllib.request.urlopen(req, timeout=60))["candidates"][0]["content"]["parts"][-1]["text"]
            break
        except (urllib.error.URLError, TimeoutError) as e:
            body = e.read().decode(errors="replace") if hasattr(e, "read") else ""
            if "requests per day" in body or "per day" in body:
                sys.exit("Stoppet: dagsgrensen for Gemini er nådd (requests per day)")
            print(f"  transkripsjon feilet ({e}), prøver igjen")
    else:
        return None, "", [], ""  # unknown, not zero: keep the clip and flag it
    clip.with_suffix(".txt").write_text(text.strip() + "\n")  # lets a new rule be tried on old clips for free
    c, missing, extra = check(text, line)
    print(f"  hørt: {text.strip()}")
    if missing:
        print(f"  mangler: {' '.join(missing)}")
    if extra:
        print(f"  ekstra ord etter replikken: {extra}")
    return c, text.strip(), missing, extra


WPS = 1.79  # measured median speech rate of the video model (69 raw clips), words per second
START, TAIL = 0.5, 2.0  # speech starts ~0.5 s in; julius.sh asks for 2 s of silence at the end
MAX_WORDS = 22  # ceiling per segment; locked brikke lines are exempt


def timing(line: str, secs: int):
    """Warning if the line does not fit the clip as ordered (see ordered())."""
    need = START + wcount(line) / WPS + TAIL
    if need > ordered(line, secs):
        return f"{wcount(line)} ord trenger {need:.1f} s med 2 s hale, bestilt {ordered(line, secs)} s"
    return None


def ordered(line: str, secs: int) -> int:
    """Seconds asked of the model: one more from 19 words; the tail is where long lines fail (median 1.0 s silence)."""
    return min(15, secs + 1) if wcount(line) >= 19 else secs


# Before a paid call: phrasings that cost takes (herding-plan 3.2). Speech direction blocks a locked segment.
TALEREGI = re.compile(r"senker stemmen|hvisker|snakker lavt|sammenbitt|biter tennene|gjesp|ler gjennom", re.I)
VARSEL = {
    "arket løftes": re.compile(r"(løfter|\btar\b|holder opp|blar|bøyer)[^.]*\b(ark|brev|side)", re.I),
    "mime (tingen dukker opp)": re.compile(r"usynlig|later som|som om han holder", re.I),
}


def warnings(line: str, action: str, locked: bool):
    """(warnings, blocking) for one segment."""
    w, block = [f"{k}: {action}" for k, rx in VARSEL.items() if rx.search(action)], []
    if TALEREGI.search(action):
        (block if locked else w).append(f"taleregi i Handling: {action}")
    last = re.split(r"(?<=[.!?])\s+", spoken(line).strip())[-1]
    if wcount(last) <= 3 and not re.search(r"vi ses|fin dag|sov godt|ha det", last, re.I):
        w.append(f"kort halesetning kan falle bort: «{last}»")
    return w, block


def lint(days) -> int:
    """Print over-long segments and timing warnings; return the number of over-long ones."""
    over = 0
    for day in days:
        for i, (line, secs, action, _k, locked) in enumerate(medie.julius_segments(day), 1):
            n = wcount(line)
            if n > MAX_WORDS and not locked:
                over += 1
                print(f"dag {day}-{i}: {n} ord (maks {MAX_WORDS}): {line[:60]}…")
            warn, block = warnings(line, action, locked)
            over += len(block)
            for w in ([timing(line, secs)] if timing(line, secs) else []) + warn + block:
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
    at = lambda clause: next((START + wcount(line.lower().split(q)[0]) / WPS
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


# Either hand is fine (Hans, 13.11); only a mic held by no hand fails. «Left/right» confused the reviewer
# (his right hand is on the LEFT of the picture), so the rule names no side.
AUDIT = """You are a strict continuity supervisor for a short film. The man holds an old microphone (round, flat, dark grey head with small holes) in one hand. Which hand does not matter: in the first frame it is the hand on the LEFT side of the picture (his own right hand), and holding it in the other hand is fine. Watch every frame and list ONLY physics and continuity errors:
- props appearing, disappearing, duplicating or changing shape/identity (book, letters, papers, ink pot, wooden mug, glasses, switchboard, mic, cable)
- hands: extra/missing fingers, a third hand, hand passing through objects, objects merging with hands or each other, mic floating or held by no hand
- body or furniture morphing, background objects changing
The microphone rule: if the mic floats, hangs in the air, is let go, is put down or disappears, even for one frame, that is always severity "noticeable" and mic_hand_ok is false. A mic held steadily in either hand is not an error; do not report which hand holds it.
Do not report lighting, film grain, style or lip sync. For each error: timestamp (mm:ss), short description, severity: "minor" (only seen when looking for it) or "noticeable" (a 9-year-old would notice on first viewing).
Answer as JSON: {"errors":[{"t":"00:03","what":"...","severity":"minor|noticeable"}],"mic_hand_ok":true|false}"""


MIC = re.compile(r"\bmic|microphone|mikrofon", re.I)


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
    forbruk.logg("transkripsjon", "gemini-3.5-flash", "julius-dag.py", f"revisjon {clip.name}")
    req = urllib.request.Request(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent",
        data=json.dumps(body).encode(), headers={"x-goog-api-key": key, "Content-Type": "application/json"},
    )
    for wait in (0, 30, 90):
        time.sleep(wait)
        try:
            r = json.loads(json.load(urllib.request.urlopen(req, timeout=120))["candidates"][0]["content"]["parts"][-1]["text"])
            break
        except (urllib.error.URLError, TimeoutError, KeyError, ValueError) as e:
            body = e.read().decode(errors="replace") if hasattr(e, "read") else ""
            if "requests per day" in body or "per day" in body:
                sys.exit("Stoppet: dagsgrensen for Gemini er nådd (requests per day)")
            print(f"  gjennomgang feilet ({e}), prøver igjen")
    else:
        return None
    bad = [f"{e['t']} {e['what']}" for e in r.get("errors", []) if e.get("severity") == "noticeable"]
    if not r.get("mic_hand_ok", True) and not any(MIC.search(b) for b in bad):
        bad.append("mikrofonen svever eller forsvinner")
    return bad


RESET = 3  # with --chain, segments 1, 4, 7 start from ref-v3.jpg again so drift in light and look cannot pile up
END = "Avslutter rolig med et smil, ingen latter."  # laughter after the goodbye read as sinister (Hans, dag 3)
# Appended to every action like END, so julius.sh's prompt hash (and days 1–11) stays put (herding-plan 3.1).
# ponytail: six lines at most; a new line replaces one
BLOKK = """
Han sier bare ordene i replikken: ingen ord før, etter eller imellom, ingen kremting og ingen nynning.
Han snakker i jevnt tempo uten lange pauser, med åpen munn og tydelig uttale.
Alt utenfor «…» er bokmål med østlandsk uttale. Et sitat i «…» leser han høyt på nordnorsk, og første ord etter sitatet er bokmål igjen.
Venstre hånd er tom hvis ikke handlingen sier at han tar i noe på bordet.
Ingenting han snakker om, dukker opp i bildet. Bordet og vinduskarmen er som i referansebildet hele klippet."""


MANUS_JSON = ROOT / "src" / "data" / "julius-manus.json"


def take_key(line: str, secs: int, action: str, kulde: str, locked: bool) -> list:
    """What a clip was made from (take.json); its medie.innholds_hash is the script's review version."""
    return [line, secs, f"{action} Kuldes påvirkning: {kulde_fx(kulde, line, locked, secs, False)[4]}"]


def manus_id(day: int, i: int) -> str:
    return f"manus/julius/dag-{day:02d}#s{i}"


def video_id(day: int, i: int) -> str:
    return f"video/julius/dag-{day:02d}#s{i}"


def segment_varsler(line: str, secs: int, action: str, locked: bool) -> list:
    """The lint lines for one segment, as `lint` prints them."""
    n, out = wcount(line), []
    if n > MAX_WORDS and not locked:
        out.append(f"{n} ord (maks {MAX_WORDS})")
    if (t := timing(line, secs)):
        out.append(t)
    w, block = warnings(line, action, locked)
    return out + w + [f"STOPPER: {b}" for b in block]


def bake_manus() -> dict:
    """{dag: [{s, hash, key, ord, laast, varsler}]} for the guide's script review (src/data/julius-manus.json)."""
    out = {}
    for day in range(1, 25):
        out[str(day)] = [{"s": i, "hash": medie.innholds_hash(k := take_key(*seg)), "key": k, "ord": wcount(seg[0]),
                          "laast": seg[4], "varsler": segment_varsler(seg[0], seg[1], seg[2], seg[4])}
                         for i, seg in enumerate(medie.julius_segments(day), 1)]
    return out


def lager_eller_stopp(f: Path) -> dict:
    """The verdicts, or stop: without the store the lock cannot be checked, so it fails closed."""
    if not f.exists():
        sys.exit(f"Stoppet: finner ikke {f} (riktig MEDIA_DIR?); uten vurderingene kan manusporten og låsen ikke sjekkes")
    return medie.vurderinger(f)


def sjekk_port(day: int, keys: list, raws: dict, trenger: set) -> set:
    """Gate and lock before paid calls (main and --extend): the locked segments, or stop."""
    locked, missing = port(day, keys, lager_eller_stopp(medie.vurdering_fil()), raws, trenger)
    if missing and "--uten-manusgodkjenning" not in sys.argv:
        sys.exit(f"Stoppet: manus ikke godkjent for dag {day} segment {', '.join(map(str, missing))}.\n"
                 + "".join(f"  {manus_id(day, i)}: «{keys[i - 1][0][:70]}»\n" for i in missing)
                 + f"Godkjenn i guiden: /nissemor-guide/gjennomgang?id=manus/julius/dag-{day:02d}")
    return locked


def port(day: int, keys: list, vurd: dict, raw: dict, trenger: set):
    """(locked, missing): segments whose clip is approved on its raw hash (never remade), and segments in
    `trenger` (would cost a call) whose script is not approved on the current hash."""
    locked = {i for i in range(1, len(keys) + 1) if raw.get(i) and medie.godkjent(vurd, video_id(day, i), raw[i])}
    missing = [i for i, k in enumerate(keys, 1)
               if i in trenger and i not in locked and not medie.godkjent(vurd, manus_id(day, i), medie.innholds_hash(k))]
    return locked, missing


def sidefil(keys: list, tider: list, raw: dict, sjekk: dict) -> list:
    """dag-NN-vN.segmenter.json: one entry per segment with its place in the joined video."""
    return [{"s": i, "start": round(a, 2), "slutt": round(b, 2), "hash": medie.innholds_hash(k), "raw": raw.get(i),
             "replikk": k[0], "hørt": sjekk.get(i, {}).get("hørt"), "dekning": sjekk.get(i, {}).get("dekning"),
             "flagg": sjekk.get(i, {}).get("flagg", [])}
            for i, (k, (a, b)) in enumerate(zip(keys, tider), 1)]


def arv_sjekk(dest: Path, raws: dict, sjekk: dict) -> dict:
    """Segments without a sjekk.json keep the flags of the newest earlier join of the same take (same raw hash)."""
    def versjon(f):
        return int(m[1]) if (m := re.search(r"-v(\d+)\.segmenter\.json$", f.name)) else 1
    egen = dest.parent / f"{dest.stem}.segmenter.json"
    tidligere = sorted((f for f in dest.parent.glob(f"{dest.name.split('-v')[0].removesuffix('.mp4')}*.segmenter.json") if f != egen),
                       key=versjon, reverse=True)
    ut = dict(sjekk)
    for i, h in raws.items():
        if i in ut:
            continue
        for f in tidligere:
            gammel = next((x for x in json.loads(f.read_text()) if x["s"] == i and x.get("raw") == h), None)
            if gammel:
                ut[i] = {k: gammel[k] for k in ("hørt", "dekning", "flagg") if gammel.get(k) is not None}
                break
    return ut


def flagg_fra_fil(day: int, suffix: str) -> dict:
    """{segment: {hørt, dekning, flagg}} from dagNN<suffix>-flagget.txt (the check's log before sjekk.json existed)."""
    f = OUT / f"dag{day:02d}{suffix}-flagget.txt"
    ut, cur = {}, None
    for ln in (f.read_text().splitlines() if f.exists() else []):
        if (m := re.match(rf"dag{day:02d}-(\d+): (\d+)% hørt; ?(.*)", ln)):
            cur = int(m[1])
            ut[cur] = {"dekning": int(m[2]) / 100, "flagg": [x.strip() for x in m[3].split("; ") if x.strip() and x != "under grensen"]}
        elif cur and ln.strip().startswith("hørt:"):
            ut[cur]["hørt"] = ln.split("hørt:", 1)[1].strip()
    return ut


def segmenter(day: int) -> list:
    """Back-fill the sidecar for the day's videos whose length matches today's clips in assets/out
    (trimmed as join trims them); other videos were joined from takes that are gone and get none."""
    names = [f"dag{day:02d}-{i}" for i in range(1, len(medie.julius_segments(day)) + 1)]
    clips = [OUT / f"{n}.mp4" for n in names]
    if not names or not all(c.exists() for c in clips):
        return []
    dur = [seconds(c) for c in clips]
    span = [speech_span(c, d) for c, d in zip(clips, dur)]
    tider = tidskoder([b - a for a, b in span])
    lengde = tider[-1][1] + OUTRO + BLACK
    raws = {i: raw_hash(OUT / f"{n}.raw.mp4") for i, n in enumerate(names, 1)}
    keys = []
    for i, (n, seg) in enumerate(zip(names, medie.julius_segments(day)), 1):
        take = OUT / f"{n}.take.json"
        keys.append(json.loads(take.read_text()) if take.exists() else take_key(*seg))
    laget = []
    for v in sorted(Path(arg("--dest") or DEST).glob(f"dag-{day:02d}*.mp4")):
        side = v.with_name(f"{v.stem}.segmenter.json")
        if side.exists() or abs(seconds(v) - lengde) > 0.15:
            continue
        sjekk = flagg_fra_fil(day, v.stem.removeprefix(f"dag-{day:02d}"))
        for i, n in enumerate(names, 1):
            if (f := OUT / f"{n}.sjekk.json").exists():
                sjekk[i] = json.loads(f.read_text())
            elif (t := OUT / f"{n}.raw.txt").exists():
                sjekk.setdefault(i, {}).setdefault("hørt", t.read_text().strip())
        side.write_text(json.dumps(sidefil(keys, tider, raws, sjekk), ensure_ascii=False, indent=1) + "\n")
        laget.append(side)
    return laget


def raw_hash(p: Path):
    return medie.sha(p.read_bytes())[:12] if p.exists() else None


def chained(i: int, argv) -> bool:
    """Start from the previous segment's last frame? Off by default: a wrong mic hand spread through the chain."""
    return "--chain" in argv and i > 1 and bool((i - 1) % RESET)


def last_frame(clip: Path, out: Path) -> Path:
    """The clip's last frame as the next segment's start image: the cut lands on the same pose."""
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-sseof", "-0.1", "-i", str(clip), "-update", "1", "-q:v", "2", str(out)], check=True)
    return out


# ponytail: word-set overlap, not alignment; catches dropped clauses, not swapped word order
MIN_COVERAGE = 0.9
ATTEMPTS = 1  # takes per segment; a flagged clip is seen and heard before anyone pays for take 2 (--forsøk N)


def main():
    day = int(sys.argv[1])
    dry = "--dry-run" in sys.argv
    segs = segments(day)
    suffix = sys.argv[sys.argv.index("--suffix") + 1] if "--suffix" in sys.argv else ""
    promo = "--manus" in sys.argv  # promo: own script, not in the media inventory
    dest = Path(arg("--dest") or DEST) / f"dag-{day:02d}{suffix}.mp4"
    valgt = {int(sys.argv[k + 1]) for k, a in enumerate(sys.argv) if a == "--segment"}
    if not dry and not promo and not valgt and "--force" not in sys.argv and medie.status(dest)[0] == medie.CURRENT:
        print(f"{dest} er oppdatert; --force for å lage den på nytt")
        return
    names, flagged = [], []
    keys = [take_key(*seg) for seg in segs]
    raws = {i: raw_hash(OUT / f"dag{day:02d}-{i}.raw.mp4") for i in range(1, len(segs) + 1)}

    def trenger(i):  # superset of the segments that may cost a call
        take, clip = OUT / f"dag{day:02d}-{i}.take.json", OUT / f"dag{day:02d}-{i}.mp4"
        if valgt:
            return i in valgt
        return "--alle" in sys.argv or not clip.exists() or not take.exists() or json.loads(take.read_text()) != keys[i - 1]

    offline = dry or "--join-only" in sys.argv or "--refilter" in sys.argv
    if offline or promo:
        locked_ok = port(day, keys, medie.vurderinger(), raws, set())[0]
    else:
        locked_ok = sjekk_port(day, keys, raws, {i for i in raws if trenger(i)})
    for i, (line, secs, action, kulde, locked) in enumerate(segs, 1):
        name = f"dag{day:02d}-{i}"
        names.append(name)
        print(f"{name} ({secs} s): {line}")
        if (w := timing(line, secs)):
            print(f"  TIDSBUDSJETT {name}: {w}")
        if offline:
            continue
        clip = OUT / f"{name}.mp4"
        raw = OUT / f"{name}.raw.mp4"  # check the unfiltered audio; the radio filter hurts transcription
        key = keys[i - 1]
        act = key[2]
        take = OUT / f"{name}.take.json"
        if i in locked_ok or (valgt and i not in valgt):
            if not clip.exists():
                sys.exit(f"{name}: klippet mangler, kan ikke beholdes")
            print("  video godkjent, låst" if i in locked_ok else "  ikke valgt med --segment, beholdt")
            continue
        if "--alle" not in sys.argv and i not in valgt and clip.exists():
            # accepted earlier with this exact line and action: don't pay for another take
            if take.exists() and json.loads(take.read_text()) == key:
                print("  uendret og godkjent tidligere, beholdt")
                continue
            # a take.json with another line means the clip is for the old text: never accept it by coverage
            if not take.exists() and not speech_at_end(raw) and (coverage(raw, line)[0] or 0) >= MIN_COVERAGE:
                take.write_text(json.dumps(key))
                continue
        env = dict(os.environ)
        if chained(i, sys.argv):
            env["REF"] = str(last_frame(OUT / f"dag{day:02d}-{i - 1}.raw.mp4", OUT / f"{name}.start.jpg"))
        act += BLOKK
        if i == len(segs):
            act += " " + END
        best = (None, None, "")  # (score, problems, transcript); score = (whole line, clean, coverage)
        for attempt in range(1, ATTEMPTS + 1):
            r = subprocess.run([str(BIN / "julius.sh"), name, line, act, str(ordered(line, secs))], stdin=subprocess.DEVNULL, env=env)
            if r.returncode == 78:
                sys.exit(1)  # julius.sh's budget guard has printed why
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
            c, text, missing, extra = coverage(raw, line)
            c = 1.0 if c is None else c  # unknown: don't burn a take on an API hiccup
            bad = audit(raw) or []
            if speech_at_end(raw):
                print(f"  {name}: stemmen går til siste bilde, replikken er kuttet")
                c = 0.0
            if missing:
                bad = bad + [f"mangler: {' '.join(missing)}"] if c < MIN_COVERAGE else bad
            if extra:
                bad = bad + [f"ekstra ord: {extra}"]
            print(f"  {name}: {c:.0%} av replikken hørt, feil: {bad or 'ingen'}")
            score = (c >= MIN_COVERAGE, not bad, c)  # a cut-off line never beats a whole one
            if best[0] is None or score > best[0]:
                for ext in ("mp4", "raw.mp4"):
                    shutil.copy(OUT / f"{name}.{ext}", OUT / f"{name}.best.{ext}")
                best = (score, bad, text)
            if not bad and c >= MIN_COVERAGE:
                take.write_text(json.dumps(key))
                break
        if best[0] is None:
            sys.exit(f"{name}: ingen versjon ble laget")
        # ponytail: falls back to the best take instead of aborting; check flagged clips by hand
        for ext in ("mp4", "raw.mp4"):
            shutil.copy(OUT / f"{name}.best.{ext}", OUT / f"{name}.{ext}")
        (OUT / f"{name}.sjekk.json").write_text(json.dumps({"hørt": best[2], "dekning": round(best[0][2], 2), "flagg": best[1] or []}, ensure_ascii=False))
        if best[1] or best[0][2] < MIN_COVERAGE:
            print(f"  ADVARSEL {name}: beste versjon {best[0][2]:.0%}, feil: {best[1]}")
            flagged.append(f"{name}: {best[0][2]:.0%} hørt; {'; '.join(best[1]) or 'under grensen'}\n  hørt: {best[2]}")
    if flagged:  # the coordinator decides which need a new call; nothing more is paid automatically
        log = OUT / f"dag{day:02d}{suffix}-flagget.txt"
        log.write_text("\n".join(flagged) + "\n")
        print(f"\nFLAGGET → se og hør før tagning 2 ({log}):\n" + "\n".join(flagged))
    if dry:
        print(f"lærdom julius:{medie.unngaa('julius') or ' ingen regler'}")
        return
    if "--refilter" in sys.argv:  # no API calls: redo look and sound from the kept raw clips
        for n in names:
            subprocess.run([str(BIN / "julius-filter.sh"), str(OUT / f"{n}.raw.mp4"), str(OUT / f"{n}.mp4")], check=True)
    for n in names:
        if speech_at_end(OUT / f"{n}.raw.mp4"):
            print(f"  REGENERER {n}: stemmen går til siste bilde, replikken er kuttet")
    dest.parent.mkdir(parents=True, exist_ok=True)
    cuts = []
    for i, a in enumerate(sys.argv):
        if a == "--cutaway":
            f, k, s = (sys.argv[i + 1].split(":") + ["", ""])[:3]
            cuts.append((f, int(k) if k else worst_cut([OUT / f"{n}.raw.mp4" for n in names]), float(s or CUTAWAY)))
    tider = join([OUT / f"{n}.mp4" for n in names], dest, [(s[3], s[0], s[4]) for s in segs], cuts, arg("--plakat"), "--no-trim" not in sys.argv, "--no-outro" not in sys.argv)
    sjekk = {i: json.loads(f.read_text()) for i, n in enumerate(names, 1) if (f := OUT / f"{n}.sjekk.json").exists()}
    raws = {i: raw_hash(OUT / f"{n}.raw.mp4") for i, n in enumerate(names, 1)}
    sjekk = arv_sjekk(dest, raws, sjekk)
    (dest.parent / f"{dest.stem}.segmenter.json").write_text(json.dumps(sidefil(keys, tider, raws, sjekk), ensure_ascii=False, indent=1) + "\n")
    lyd_kurve(dest)
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-ss", "3", "-i", str(dest), "-frames:v", "1",
                    "-q:v", "3", str(dest.with_suffix(".jpg"))], check=True)
    if not promo:
        medie.write("julius-dag.py", dest, medie.JULIUS_MS, f"Dag {day}", "gemini-omni-1.2-flash",
                    ["assets/characters/julius/ref-v3.jpg"], extra={"filter_version": medie.filter_version()})
        medie.refresh_inventar()
    print(dest)
    if "--upload" in sys.argv:
        upload(sys.argv[sys.argv.index("--upload") + 1], dest)


EXT_SECS = 10  # Omni Extend adds 3-10 s per turn
CHAIN_MAX = 40  # seconds before a chain stops and the next starts from its last frame (a cut)
REFUSED = r"safety|policy|prohibited|blocked|RAI"


def seconds(p: Path) -> float:
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]))


def tail(clip: Path, start: float, out: Path) -> Path:
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-ss", f"{start:.3f}", "-i", str(clip), str(out)], check=True)
    return out


def extend_day(day: int):
    """The Extend format: a 15 s clip, extended segment by segment through previous_interaction_id until about
    CHAIN_MAX s; the next chain starts from the last frame. Checks only the new part of each extension."""
    import json
    import time

    segs = segments(day)
    keys = [take_key(*seg) for seg in segs]
    raws = {i: raw_hash(OUT / f"dag{day:02d}-{i}.raw.mp4") for i in range(1, len(segs) + 1)}
    if "--dry-run" not in sys.argv:
        # Extend remakes the whole day: every script approved, and no approved clip thrown away.
        if locked := sjekk_port(day, keys, raws, set(raws)):
            sys.exit(f"Stoppet: segment {', '.join(map(str, sorted(locked)))} er godkjent og låst; --extend lager hele dagen på nytt")
    suffix = sys.argv[sys.argv.index("--suffix") + 1] if "--suffix" in sys.argv else ""
    dest = DEST / f"dag-{day:02d}{suffix}.mp4"
    chains, cur, cap, tokens = [], None, CHAIN_MAX, 0
    for i, (line, secs, action, kulde, locked) in enumerate(segs, 1):
        name = f"dag{day:02d}x-{i}"
        act = f"{action} Kuldes påvirkning: {kulde_fx(kulde, line, locked, secs, False)[4]}"
        while True:
            ext = cur is not None and seconds(OUT / f"{cur}.raw.mp4") + EXT_SECS <= cap
            env, start, length = dict(os.environ), 0.0, secs
            if ext:
                env["PREV"], start, length = (OUT / f"{cur}.id").read_text().strip(), seconds(OUT / f"{cur}.raw.mp4"), EXT_SECS
            elif chains and len(chains) % RESET:
                env["REF"] = str(last_frame(OUT / f"{cur}.raw.mp4", OUT / f"{name}.start.jpg"))
            key = env.get("PREV") or env.get("REF") or "ref"
            print(f"{name} ({'forlengelse' if ext else 'ny kjede'}, {length} s): {line}")
            done = OUT / f"{name}.key"
            if done.exists() and done.read_text() == key and (OUT / f"{name}.mp4").exists():
                break  # kept from an earlier run with the same start
            best, capped = (None, None), False
            for attempt in range(1, ATTEMPTS + 1):
                r = subprocess.run([str(BIN / "julius.sh"), name, line, act, str(length)], stdin=subprocess.DEVNULL, env=env)
                if r.returncode == 78:
                    sys.exit(1)
                if r.returncode != 0:
                    resp = OUT / f"{name}.resp.json"
                    txt = resp.read_text() if resp.exists() else ""
                    if "spending cap" in txt or "per day" in txt:
                        sys.exit("Stoppet: utgiftstak eller dagsgrense i Gemini")
                    if re.search(REFUSED, txt, re.I):
                        sys.exit(f"Stoppet: avvist av retningslinjene ({name}): {txt[:300]}")
                    if ext and re.search(r"duration|length|exceed|too long", txt, re.I):
                        print(f"  {name}: forlengelsen avvist på lengde, ny kjede: {txt[:200]}")
                        capped = True
                        break
                    time.sleep(60 * attempt)
                    continue
                tokens += json.loads((OUT / f"{name}.usage.json").read_text() or "{}").get("total_tokens", 0)
                raw = OUT / f"{name}.raw.mp4"
                c = coverage(tail(raw, start, OUT / f"{name}.ny.mp4"), line)
                c = 1.0 if c is None else c
                if speech_at_end(raw):
                    print(f"  {name}: stemmen går til siste bilde")
                    c = 0.0
                bad = audit(tail(raw, max(start - 2, 0), OUT / f"{name}.sjekk.mp4")) or []
                print(f"  {name}: {c:.0%} hørt, feil: {bad or 'ingen'}")
                if best[0] is None or (not bad, c) > best[0]:
                    for ext_ in ("mp4", "raw.mp4", "id"):
                        shutil.copy(OUT / f"{name}.{ext_}", OUT / f"{name}.best.{ext_}")
                    best = ((not bad, c), bad)
                if not bad and c >= MIN_COVERAGE:
                    break
            if capped:
                cap = seconds(OUT / f"{cur}.raw.mp4")
                continue
            if best[0] is None:
                sys.exit(f"{name}: ingen versjon ble laget")
            for ext_ in ("mp4", "raw.mp4", "id"):
                shutil.copy(OUT / f"{name}.best.{ext_}", OUT / f"{name}.{ext_}")
            done.write_text(key)
            if best[1] or best[0][1] < MIN_COVERAGE:
                print(f"  ADVARSEL {name}: beste versjon {best[0][1]:.0%}, feil: {best[1]}")
            break
        if ext:
            chains[-1].append(i)
        else:
            chains.append([i])
        cur = name
    print(f"kjeder: {chains}, tokens: {tokens}")
    clips = [OUT / f"dag{day:02d}x-{c[-1]}.mp4" for c in chains]
    # one Kulde pass per chain: the cues are found by their quoted words in the joined lines
    kulde = [(" ".join(segs[j - 1][3] for j in c), " ".join(segs[j - 1][0] for j in c), any(segs[j - 1][4] for j in c)) for c in chains]
    DEST.mkdir(parents=True, exist_ok=True)
    join(clips, dest, kulde)
    print(dest, f"{seconds(dest):.1f} s, {len(chains) - 1} kutt")


XFADE = 0.25  # video and audio crossfade at each join, inside the 2 s silent tail so no word is blurred
CUTAWAY = 1.5  # seconds of TV loop laid over one cut, Julius' sound runs on underneath


def worst_cut(raws) -> int:
    """The cut (1-based) whose last and first frames differ most (lowest PSNR): the one a cutaway should hide."""
    def psnr(a, b):
        out = subprocess.run(["ffmpeg", "-nostdin", "-sseof", "-0.1", "-i", str(a), "-i", str(b), "-filter_complex",
                              "[0:v]trim=end_frame=1,scale=320:180[x];[1:v]trim=end_frame=1,scale=320:180[y];[x][y]psnr",
                              "-frames:v", "1", "-f", "null", "-"], capture_output=True, text=True).stderr
        m = re.search(r"average:([\d.]+|inf)", out)
        return float(m.group(1)) if m else 99.0
    scores = [psnr(raws[i], raws[i + 1]) for i in range(len(raws) - 1)]
    return scores.index(min(scores)) + 1


LEAD, TRAIL = 0.25, 0.35  # silence kept before the first and after the last word when trimming


def speech_span(clip: Path, dur: float):
    """(start, end) to keep: leading and trailing silence cut to LEAD/TRAIL around the speech.

    Sounds under 0.2 s at the edges (a click, a breath) count as silence.
    -38 dB sits above the filtered room tone and crackle (-55 to -45); a word ending that fades below it
    is inside the TRAIL margin."""
    out = subprocess.run(["ffmpeg", "-nostdin", "-i", str(clip), "-vn", "-af", "silencedetect=n=-38dB:d=0.3", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    sil = [[float(a), float(b)] for a, b in re.findall(r"silence_start: (-?[\d.]+)[\s\S]*?silence_end: ([\d.]+)", out)]
    if (m := re.findall(r"silence_start: ([\d.]+)", out)) and len(m) > len(sil):
        sil.append([float(m[-1]), dur])  # silence running to the end has no silence_end
    # ponytail: laughter and breathing louder than -38 dB count as speech; needs VAD or transcript timing
    speech = [(a[1], b[0]) for a, b in zip([[0, 0]] + sil, sil + [[dur, dur]]) if b[0] - a[1] > 0.005]
    def peak(a, b):
        out = subprocess.run(["ffmpeg", "-nostdin", "-ss", f"{a:.3f}", "-t", f"{b - a:.3f}", "-i", str(clip), "-vn", "-af", "volumedetect",
                              "-f", "null", "-"], capture_output=True, text=True).stderr
        m = re.search(r"max_volume: (-?[\d.]+)", out)
        return float(m.group(1)) if m else 0.0

    while len(speech) > 1 and speech[0][1] - speech[0][0] < 0.2:
        speech.pop(0)
    # at the end, also a faint (peak under -30 dB) sound under 0.5 s after 1.5 s of silence: a breath or click
    # after the goodbye kept 4 s of silence in day 5; a spoken «nå.» peaks around -20 dB
    while len(speech) > 1 and (speech[-1][1] - speech[-1][0] < 0.2 or (
            speech[-1][1] - speech[-1][0] < 0.5 and speech[-1][0] - speech[-2][1] > 1.5 and peak(*speech[-1]) < -30)):
        speech.pop()
    if not speech:
        return 0.0, dur
    # end may pass dur: a clip whose last word runs to its end gets padded, so the crossfade never eats that word
    return max(0.0, speech[0][0] - LEAD), speech[-1][1] + TRAIL


OUTRO, BLACK = 0.6, 0.4  # the line drops: static over the last frame, then black
PLAKAT = 2.0  # seconds of end card after the last segment (promo)


def join_graph(dur, kulde=None, cuts=(), plakat=False, span=None, outro=False):
    """The filter graph for join; kulde = [(kulde, line, locked)] per segment adds Kulde's effects;
    cuts = [(k, secs)] lays inputs n, n+1, … (TV loops, screen recordings) over cut k for secs, picture only:
    from the start of segment k's silent tail, so no word is lost; k = n covers the last tail.
    plakat = input after the cutaways (a still) held PLAKAT s at the end;
    span = [(start, end)] per segment trims each clip after its effects (they keep the clip's own timeline);
    outro = the line drops at the end: OUTRO s of static over the last frame, a click and hum, then black."""
    n = len(dur)
    span = span or [(0.0, d) for d in dur]
    full, dur = dur, [b - a for a, b in span]
    tail = TRAIL if any(a > 0 or b < d for (a, b), d in zip(span, full)) else TAIL  # silence left after the last word
    w, h = int(1280 / 1.15) // 2 * 2, int(720 / 1.15) // 2 * 2
    fc, drained = "", False
    for i in range(n):
        vf, af, stutter = [], [], None
        if kulde:
            vf, af, stutter, drained, _ = kulde_fx(*kulde[i], full[i], drained)
        fx = "".join("," + f for f in vf)
        pad = max(0.0, span[i][1] - full[i])
        tv = f"tpad=stop_mode=clone:stop_duration={pad:.3f},trim=start={span[i][0]:.3f}:end={span[i][1]:.3f},setpts=PTS-STARTPTS"
        crop = f",crop={w}:{h}:(iw-{w})*0.6:(ih-{h})*0.25,scale=1280:720,setsar=1" if i % 2 else ""
        if stutter is None:
            fc += f"[{i}:v]fps=24,scale=1280:720,setsar=1{fx}{crop},{tv},format=yuv420p[v{i}];"
        else:  # a 0.4 s hold from a 2.5 fps copy laid over the clip: the picture hangs, the sound runs on
            fc += (f"[{i}:v]fps=24,scale=1280:720,setsar=1{fx}{crop},split[s{i}][h{i}];[h{i}]fps=2.5,fps=24[q{i}];"
                   f"[s{i}][q{i}]overlay=enable='between(t,{stutter:.2f},{stutter + 0.4:.2f})',"
                   f"{tv},format=yuv420p[v{i}];")
        # ponytail: one-pass loudnorm per segment; two-pass (measure, then linear) if levels pump audibly
        afx = "".join("," + f for f in af)
        fc += f"[{i}:a]loudnorm=I=-16:TP=-2:LRA=11{afx},apad=pad_dur={pad:.3f},atrim=start={span[i][0]:.3f}:end={span[i][1]:.3f},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo[a{i}];"
    vprev, aprev, t = "v0", "a0", 0.0
    for i in range(1, n):
        t += dur[i - 1] - XFADE
        fc += f"[{vprev}][v{i}]xfade=transition=fade:duration={XFADE}:offset={t:.3f}[y{i}];"
        fc += f"[{aprev}][a{i}]acrossfade=d={XFADE}:c1=tri:c2=tri[x{i}];"
        vprev, aprev = f"y{i}", f"x{i}"
    total = sum(dur) - (n - 1) * XFADE
    ends = [sum(dur[:k]) - (k - 1) * XFADE for k in range(1, n + 1)]
    over = max([0.0] + [ends[k - 1] - tail + s - total for k, s in cuts]) + (PLAKAT if plakat else 0)
    if over > 0:  # the last cutaway or the end card runs past Julius: hold his last frame, pad the sound
        fc += f"[{vprev}]tpad=stop_mode=clone:stop_duration={over:.3f}[vp];[{aprev}]apad=pad_dur={over:.3f}[ap];"
        vprev, aprev = "vp", "ap"
    for j, (k, s) in enumerate(cuts):
        at = ends[k - 1] - tail if len(cuts) > 1 or k == n else ends[k - 1] - XFADE / 2 - s / 2
        fc += (f"[{n + j}:v]fps=24,scale=1280:720,setsar=1,trim=duration={s},format=yuv420p,"
               f"fade=t=in:d=0.15,fade=t=out:st={s - 0.15}:d=0.15,setpts=PTS-STARTPTS+{at:.3f}/TB[c{j}];"
               f"[{vprev}][c{j}]overlay=eof_action=pass[vc{j}];")
        vprev = f"vc{j}"
    if plakat:
        fc += (f"[{n + len(cuts)}:v]scale=1280:720,setsar=1,format=yuv420p[pl];"
               f"[{vprev}][pl]overlay=shortest=1:enable='gte(t,{total + over - PLAKAT:.3f})'[vpl];")
        vprev = "vpl"
    if outro and not plakat:
        t0 = total + over
        fc += (f"[{vprev}]tpad=stop_mode=clone:stop_duration={OUTRO},hue=s=0:enable='gte(t,{t0:.3f})',noise=alls=100:allf=t+u:enable='gte(t,{t0:.3f})',"
               f"noise=alls=100:allf=t+u:enable='gte(t,{t0 + 0.2:.3f})',"
               f"eq=brightness=0.25:contrast=1.6:enable='between(t,{t0 + OUTRO - 0.12:.3f},{t0 + OUTRO:.3f})',"
               f"tpad=stop_mode=add:stop_duration={BLACK}:color=black[vo];"
               f"anoisesrc=d={OUTRO}:c=pink:a=0.3:r=48000[on];sine=f=50:d={OUTRO}:r=48000,volume=0.5[oh];"
               f"[on][oh]amix=inputs=2,afade=t=out:st={OUTRO / 2}:d={OUTRO / 2},apad=pad_dur={BLACK}[ob];"
               f"aevalsrc='0.9*exp(-t*300)*sin(2*PI*1200*t)':d={OUTRO + BLACK}:s=48000[ock];"
               f"[ob][ock]amix=inputs=2:duration=first,aformat=sample_rates=48000:channel_layouts=stereo[ot];"
               f"[{aprev}][ot]concat=n=2:v=0:a=1[ao];")
        vprev, aprev = "vo", "ao"
    fc += f"[{vprev}]null[v];"
    return fc + f"[{aprev}]alimiter=limit=0.84:level=false[a]"  # 0.84 ≈ -1.5 dBTP


def join(segs, dest: Path, kulde=None, cutaways=(), plakat=None, trim=True, outro=True):
    """Alternating framing (every other segment a 1.15x crop) with 0.25 s crossfades in the silent tail,
    each segment levelled to -16 LUFS and the whole day limited to -1.5 dBTP.
    cutaways = [(file, cut number, secs)] laid over cuts; plakat = still image shown PLAKAT s at the end."""
    dur = [float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)])) for p in segs]
    span = [speech_span(p, d) for p, d in zip(segs, dur)] if trim else None
    fc = join_graph(dur, kulde, [(k, s) for _, k, s in cutaways], bool(plakat), span, outro)
    extra = sum((["-stream_loop", "-1", "-i", str(f)] for f, _, _ in cutaways), [])
    if plakat:
        extra += ["-loop", "1", "-i", str(plakat)]
    # ponytail: crf 28 + 96k audio lands around 8–12 MB per minute at 720p; raise crf if files grow
    subprocess.run(
        ["ffmpeg", "-nostdin", "-y", "-v", "error", *sum((["-i", str(p)] for p in segs), []), *extra,
         "-filter_complex", fc, "-map", "[v]", "-map", "[a]",
         "-c:v", "libx264", "-crf", "28", "-preset", "slow", "-c:a", "aac", "-b:a", "96k",
         "-movflags", "+faststart", str(dest)],
        check=True,
    )
    return tidskoder([b - a for a, b in span] if span else dur)


def tidskoder(dur) -> list:
    """(start, end) of each segment in the joined video: each cut overlaps the next by XFADE."""
    starts = [sum(dur[:k]) - k * XFADE for k in range(len(dur))]
    return [(a, a + d) for a, d in zip(starts, dur)]


LYD_DT = 0.1  # seconds per peak in <video>.lyd.json


def lyd_kurve(video: Path) -> Path:
    """<video>.lyd.json: {"dt": 0.1, "topp": [0-99, ...]}, the loudest sample per 0.1 s (the guide's audio curve)."""
    import array

    rate = 8000
    pcm = subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-i", str(video), "-vn", "-ac", "1", "-ar", str(rate),
                          "-f", "s16le", "-"], capture_output=True, check=True).stdout
    a = array.array("h", pcm[: len(pcm) // 2 * 2])
    n = int(rate * LYD_DT)
    topp = [round(max(map(abs, a[i:i + n]), default=0) / 32768 * 99) for i in range(0, len(a), n)]
    out = video.with_name(f"{video.stem}.lyd.json")
    out.write_text(json.dumps({"dt": LYD_DT, "topp": topp}, separators=(",", ":")) + "\n")
    return out


KUTT_FADE = 0.06  # s of fade at a cut: no click, too short to eat a syllable
KUTT_SNAP = 0.6  # a cut point moves to the middle of a pause this close (Hans clicks by ear)


def stillhet(clip: Path):
    out = subprocess.run(["ffmpeg", "-nostdin", "-i", str(clip), "-vn", "-af", "silencedetect=n=-30dB:d=0.12", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return [(float(a), float(b)) for a, b in re.findall(r"silence_start: (-?[\d.]+)[\s\S]*?silence_end: ([\d.]+)", out)]


def kuttpunkt(t: float, pauser) -> float:
    """t, or the middle of the nearest pause within KUTT_SNAP."""
    nær = [((a + b) / 2, abs((a + b) / 2 - t)) for a, b in pauser if a - KUTT_SNAP <= t <= b + KUTT_SNAP]
    return min(nær, key=lambda x: x[1])[0] if nær else t


def nivå_ved(clip: Path, fra: float, lengde: float = 0.08) -> float:
    """Mean volume (dB) of `lengde` s from `fra`: loud means a word runs through the cut."""
    out = subprocess.run(["ffmpeg", "-nostdin", "-ss", f"{max(0, fra):.3f}", "-t", f"{lengde:.3f}", "-i", str(clip), "-vn",
                          "-af", "volumedetect", "-f", "null", "-"], capture_output=True, text=True).stderr
    m = re.search(r"mean_volume: (-?[\d.]+)", out)
    return float(m[1]) if m else -91.0


MIDT_I_ORD = -35  # dB just inside a cut; the filtered room tone sits around -55 to -45


def trim(src: Path, dst: Path, retning: str, t: float):
    """Keep [0, t] («slutt») or [t, end] («start») with a short fade at the cut. Re-encodes: a cut is frame exact."""
    if retning == "slutt":
        tid, af = ["-t", f"{t:.3f}"], f"afade=t=out:st={max(0, t - KUTT_FADE):.3f}:d={KUTT_FADE}"
    else:
        tid, af = ["-ss", f"{t:.3f}"], f"afade=t=in:d={KUTT_FADE}"
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", *(tid if retning == "start" else []), "-i", str(src),
                    *(tid if retning == "slutt" else []), "-af", af, "-c:v", "libx264", "-crf", "18", "-c:a", "aac",
                    "-b:a", "192k", str(dst)], check=True)


def kutt_klipp(raw: Path, clip: Path, retning: str, t: float) -> dict:
    """Trim one segment's raw and filtered takes at t (seconds into the take, snapped to a pause).
    The old takes stay as <navn>.før-kutt-<hash>.*. Returns {punkt, flagg}."""
    punkt = round(kuttpunkt(t, stillhet(raw)), 2)
    gammel = raw_hash(raw)
    tmp = {}
    try:  # both trims first, then the swap: a failed trim leaves both takes as they were
        for f in (raw, clip):
            kopi = f.with_name(f.name.replace(".", f".før-kutt-{gammel}.", 1))
            if not kopi.exists():
                shutil.copy(f, kopi)
            tmp[f] = f.with_name(f"{f.stem}.kutt.mp4")
            trim(kopi, tmp[f], retning, punkt)
    except BaseException:
        for t in tmp.values():
            t.unlink(missing_ok=True)
        raise
    for f, t in tmp.items():
        t.replace(f)
    dur = seconds(raw)
    db = nivå_ved(raw, dur - KUTT_FADE - 0.08) if retning == "slutt" else nivå_ved(raw, KUTT_FADE)
    flagg = [f"kutt midt i ord? ({db:.0f} dB ved kuttet)"] if db > MIDT_I_ORD else []
    return {"punkt": punkt, "flagg": flagg, "fra": gammel}


def neste_suffix(day: int, dest: Path) -> str:
    n = [int(m[1]) for f in dest.glob(f"dag-{day:02d}-v*.mp4") if (m := re.search(r"-v(\d+)\.mp4$", f.name))]
    return f"-v{max(n, default=1) + 1}"


def arvet_dom(historikk: list, kutt_v: dict, flagg: list):
    """The latest ✓/◐ Hans gave this take before the ✂, only when the cut's machine check is clean; else None
    (no verdict: only the cut check waits, and «Ta i bruk» refuses until Hans gives G)."""
    før = [x["vurdering"] for x in historikk
           if x.get("vurdering") in ("godkjent", "ok") and x.get("versjon") == kutt_v.get("versjon")]
    return før[-1] if før and not flagg else None


def flett_flagg(gamle: list, nye: list, retning: str, punkt: float) -> list:
    """The take's earlier audit flags that survive the cut («MM:SS hva»: before the point on an end cut, after it
    and shifted on a start cut; untimed audit flags stay), then the cut's own check. Transcript flags are redone."""
    ut = []
    for f in gamle:
        if m := re.match(r"(\d+):(\d\d) (.*)", f):
            t = int(m[1]) * 60 + int(m[2])
            if retning == "slutt" and t < punkt:
                ut.append(f)
            elif retning == "start" and t >= punkt:
                ut.append(f"{int((t - punkt) // 60):02d}:{int((t - punkt) % 60):02d} {m[3]}")
        elif not f.startswith(("mangler:", "ekstra ord:", "kutt midt i ord")):
            ut.append(f)
    return ut + [f for f in nye if f not in ut]


@__import__("contextlib").contextmanager
def angre_ved_feil(filer: list, nye=lambda: []):
    """Copies of `filer` beside them; on any failure (also SIGTERM from «Avbryt») they are put back by rename
    and the files `nye()` lists are removed, so the ✂ can simply run again."""
    kopier = {}
    for f in filer:
        kopier[f] = f.with_name(f.name + ".angre") if f.exists() else None
        if kopier[f]:
            shutil.copy2(f, kopier[f])
    try:
        yield
    except BaseException:
        for f, k in kopier.items():
            if k:
                os.replace(k, f)
            else:
                f.unlink(missing_ok=True)
        for g in nye():
            g.unlink(missing_ok=True)
        print("Kuttet feilet eller ble avbrutt: tagningene er satt tilbake")
        raise
    for k in kopier.values():
        if k:
            k.unlink()


def kutt_dag(day: int):
    """✂ verdicts on the day's segments: trim each take at Hans' point (no new video call), check the trimmed
    segment (transcription only, ~0.1 kr), join a new -vN and give the cut take a «kuttsjekk» with the old note."""
    f = medie.vurdering_fil()
    vurd = lager_eller_stopp(f)
    segs = segments(day)
    jobber = [(i, v) for i in range(1, len(segs) + 1) if (v := vurd.get(video_id(day, i)) or {}).get("vurdering") == "kutt"]
    if not jobber:
        sys.exit(f"Ingen ✂ på dag {day}")
    import signal

    signal.signal(signal.SIGTERM, lambda *_: sys.exit(143))  # «Avbryt»: roll back like any other failure
    dest = Path(arg("--dest") or DEST)
    suffix = arg("--suffix") or neste_suffix(day, dest)
    ny_glob = lambda: set(dest.glob(f"dag-{day:02d}{suffix}.*"))
    fantes = ny_glob()
    filer = [OUT / f"dag{day:02d}-{i}.{e}" for i, _ in jobber for e in ("raw.mp4", "mp4", "sjekk.json")]
    gjort = {}
    with angre_ved_feil(filer, lambda: ny_glob() - fantes):
        for i, v in jobber:
            name = f"dag{day:02d}-{i}"
            raw, clip = OUT / f"{name}.raw.mp4", OUT / f"{name}.mp4"
            if raw_hash(raw) != v.get("versjon"):
                sys.exit(f"Stoppet: {raw} er ikke tagningen Hans satte ✂ på ({v.get('versjon')})")
            k = v["kutt"]
            # Hans' point is in the joined video, counted from where the join starts the segment (speech_span).
            t = speech_span(clip, seconds(clip))[0] + float(k["t"])
            r = kutt_klipp(raw, clip, k["retning"], t)
            line = segs[i - 1][0]
            c, text, missing, extra = coverage(raw, line)
            nye = r["flagg"] + ([f"mangler: {' '.join(missing)}"] if missing else []) + ([f"ekstra ord: {extra}"] if extra else [])
            sf = OUT / f"{name}.sjekk.json"
            gamle = json.loads(sf.read_text()).get("flagg", []) if sf.exists() else []
            flagg = flett_flagg(gamle, nye, k["retning"], r["punkt"])
            sf.write_text(json.dumps({"hørt": text, "dekning": round(c or 0, 2), "flagg": flagg}, ensure_ascii=False))
            print(f"{name}: kuttet {k['retning']} ved {r['punkt']:.2f} s i tagningen (bedt om {t:.2f}); hørt: {text}; flagg: {flagg or 'ingen'}")
            gjort[i] = (v, r, nye)
        subprocess.run([sys.executable, __file__, str(day), "--join-only", "--suffix", suffix,
                        *(["--dest", arg("--dest")] if arg("--dest") else [])], check=True)
        lagre_kutt(f, day, gjort)
    print(dest / f"dag-{day:02d}{suffix}.mp4")


def lagre_kutt(f: Path, day: int, gjort: dict):
    nå = __import__("datetime").datetime.now(__import__("datetime").timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")
    with medie.lås(f):
        data = medie.les_lager(f)
        if data.get("format") != 2:
            sys.exit(f"Stoppet: {f} er ikke format 2")
        for i, (v, r, nye) in gjort.items():
            id = video_id(day, i)
            e = data["elementer"].setdefault(id, {"vurderinger": [], "historikk": []})
            e["historikk"] += [x for x in e["vurderinger"] if x["fil"] == id]
            e["vurderinger"] = [x for x in e["vurderinger"] if x["fil"] != id]
            ny = raw_hash(OUT / f"dag{day:02d}-{i}.raw.mp4")
            # The cut only removes: the take inherits the ✓/◐ it had before ✂ when the cut's check is clean (else
            # no verdict); note and tags carry over; Hans hears the cut once (G/L), so the check waits as «kuttsjekk».
            e["vurderinger"].append({k: x for k, x in {
                "vurdering": arvet_dom(e["historikk"], v, nye), "notat": v.get("notat"), "tagger": v.get("tagger"),
                "kuttsjekk": v["kutt"], "oppdatert": nå,
                "versjon": ny, "hash": ny, "fil": id}.items() if x})
        medie.skriv_lager(f, data)


def test_arv():
    h = [{"vurdering": "godkjent", "versjon": "a"}, {"vurdering": "lag_paa_nytt", "versjon": "a"},
         {"vurdering": "ok", "versjon": "b"}, {"versjon": "a"}]
    assert arvet_dom(h, {"versjon": "a"}, []) == "godkjent" and arvet_dom(h, {"versjon": "b"}, []) == "ok"
    assert arvet_dom(h, {"versjon": "c"}, []) is None and arvet_dom([], {"versjon": "a"}, []) is None
    assert arvet_dom(h, {"versjon": "a"}, ["kutt midt i ord? (-20 dB ved kuttet)"]) is None  # flagged: no verdict
    gamle = ["00:01 bok forsvinner", "00:05 ekstra finger", "mikrofonen svever eller forsvinner", "mangler: hei"]
    assert flett_flagg(gamle, ["mangler: ja"], "slutt", 3.0) == [
        "00:01 bok forsvinner", "mikrofonen svever eller forsvinner", "mangler: ja"]
    assert flett_flagg(gamle, [], "start", 2.0) == ["00:03 ekstra finger", "mikrofonen svever eller forsvinner"]
    import tempfile
    d = Path(tempfile.mkdtemp())
    seg = lambda raw, flagg: json.dumps([{"s": 1, "raw": raw, "flagg": flagg, "hørt": "x", "dekning": 0.5}])
    (d / "dag-13-v2.segmenter.json").write_text(seg("r1", ["mangler: a"]))
    (d / "dag-13-v3.segmenter.json").write_text(seg("r1", ["nyere"]))
    ny = d / "dag-13-v4.mp4"
    assert arv_sjekk(ny, {1: "r1"}, {})[1]["flagg"] == ["nyere"]  # newest earlier join wins
    assert arv_sjekk(ny, {1: "r2"}, {}) == {}  # another take: nothing carried
    assert arv_sjekk(ny, {1: "r1"}, {1: {"flagg": []}}) == {1: {"flagg": []}}  # own check beats the old flags
    a, b = d / "a.mp4", d / "b.json"
    a.write_text("før")
    try:  # a failure (or SIGTERM) halfway: the take is put back and the half-made join removed
        with angre_ved_feil([a, b], lambda: [d / "dag-13-v5.mp4"]):
            a.write_text("halvkuttet")
            b.write_text("{}")
            (d / "dag-13-v5.mp4").write_text("halv")
            raise SystemExit(143)
    except SystemExit:
        pass
    assert a.read_text() == "før" and not b.exists() and not (d / "dag-13-v5.mp4").exists()
    assert not (d / "a.mp4.angre").exists()
    with angre_ved_feil([a]):
        a.write_text("kuttet")
    assert a.read_text() == "kuttet" and not (d / "a.mp4.angre").exists()
    shutil.rmtree(d)
    print("test_arv ok")


def test_kutt():
    """The cut on a generated clip: tone, pause, tone; a cut in the pause is clean, one in the tone is flagged."""
    import tempfile

    d = Path(tempfile.mkdtemp())
    src = d / "x.raw.mp4"
    subprocess.run(["ffmpeg", "-nostdin", "-y", "-v", "error", "-f", "lavfi", "-i", "color=c=black:s=64x36:d=4:r=24",
                    "-f", "lavfi", "-i", "sine=f=440:d=4,volume='if(between(t,1.5,2.5),0,1)':eval=frame",
                    "-shortest", "-c:v", "libx264", "-c:a", "aac", str(src)], check=True)
    pauser = stillhet(src)
    assert pauser and abs(pauser[0][0] - 1.5) < 0.1, pauser
    assert abs(kuttpunkt(1.2, pauser) - 2.0) < 0.1 and kuttpunkt(0.3, pauser) == 0.3
    clip = d / "x.mp4"
    shutil.copy(src, clip)
    r = kutt_klipp(src, clip, "slutt", 1.2)
    assert abs(seconds(src) - 2.0) < 0.1 and not r["flagg"], (seconds(src), r)
    assert (d / f"x.før-kutt-{r['fra']}.raw.mp4").exists()
    shutil.copy(d / f"x.før-kutt-{r['fra']}.raw.mp4", src)
    r = kutt_klipp(src, clip, "start", 0.5)  # in the tone, nowhere near the pause
    assert abs(seconds(src) - 3.5) < 0.1 and r["flagg"], (seconds(src), r)
    k = json.loads(lyd_kurve(clip).read_text())
    assert k["dt"] == LYD_DT and 30 <= len(k["topp"]) <= 40 and max(k["topp"]) >= 10 and min(k["topp"]) == 0, k
    shutil.rmtree(d)
    print("test_kutt ok")


def test_port():
    """Gate, lock, hash and sidecar without files or API (julius-dag.py test-port; jest runs it)."""
    keys = [take_key("Hei, Snøfall.", 8, "Smiler.", "Svak knitring.", False), take_key("Vi ses.", 6, "Vinker.", "", False)]
    assert keys[0][2] == "Smiler. Kuldes påvirkning: Svak knitring."
    h = [medie.innholds_hash(k) for k in keys]
    assert h[0] == medie.sha(json.dumps(keys[0], ensure_ascii=False, separators=(",", ":")))[:12] and len(h[0]) == 12
    ok = lambda v, ver: {"vurdering": v, "versjon": ver}
    assert port(14, keys, {}, {}, {1, 2}) == (set(), [1, 2])  # nothing approved: refuses both
    vurd = {manus_id(14, 1): ok("godkjent", h[0]), manus_id(14, 2): ok("ok", h[1])}
    assert port(14, keys, vurd, {}, {1, 2}) == (set(), [])  # godkjent and ok both let it through
    assert port(14, keys, {manus_id(14, 1): ok("godkjent", "gammel")}, {}, {1}) == (set(), [1])  # text changed
    assert port(14, keys, {manus_id(14, 1): ok("lag_paa_nytt", h[0])}, {}, {1}) == (set(), [1])
    assert port(14, keys, {}, {}, set()) == (set(), [])  # nothing to make, nothing to approve
    lås = {video_id(14, 2): ok("godkjent", "rawhash")}
    assert port(14, keys, lås, {2: "rawhash"}, {1, 2}) == ({2}, [1])  # approved clip: locked, gate skips it
    assert port(14, keys, lås, {2: "nyttklipp"}, {2}) == (set(), [2])  # another clip: not locked
    assert manus_id(4, 3) == "manus/julius/dag-04#s3"
    t = tidskoder([4.0, 5.0, 3.0])
    assert t == [(0.0, 4.0), (3.75, 8.75), (8.5, 11.5)]
    side = sidefil(keys, t[:2], {1: "abc"}, {1: {"hørt": "hei snøfall", "dekning": 1.0, "flagg": []}})
    assert side[0] == {"s": 1, "start": 0.0, "slutt": 4.0, "hash": h[0], "raw": "abc", "replikk": "Hei, Snøfall.",
                       "hørt": "hei snøfall", "dekning": 1.0, "flagg": []}
    assert side[1]["raw"] is None and side[1]["hørt"] is None and side[1]["flagg"] == []
    assert segment_varsler("ord " * 30, 10, "Hvisker.", True)[-1].startswith("STOPPER")
    try:  # a wrong MEDIA_DIR: the lock fails closed
        lager_eller_stopp(Path("/finnes/ikke/media-vurdering.json"))
        raise AssertionError("lager_eller_stopp slapp gjennom uten lager")
    except SystemExit:
        pass


def selftest():
    test_port()
    test_kutt()
    test_arv()
    assert wcount("Lucia-morgen i TV-en, ja") == 4 and len(words("Lucia-morgen")) == 2
    assert tail_missing("ja hallo IQ sier linjen", "IQ sier linjen er åpen.") == ["er", "åpen"]
    assert tail_missing("IQ sier linjen er åpen", "IQ sier linjen er åpen.") == []
    assert timing("ord " * 10, 15) is None and timing("ord " * 20, 15) is None and "bestilt 15" in timing("ord " * 24, 15)
    assert ordered("ord " * 18, 12) == 12 and ordered("ord " * 19, 12) == 13 and ordered("ord " * 20, 15) == 15
    # herding-plan 3.2: spelling, names, quotes, extra words
    assert heard_as("goooood", ["god"]) and heard_as("gooood", ["godt"]) and heard_as("sees", ["ses"])
    assert check("God morgen Snøfall. Rampenissen rapporterer: E laget lydbølger. Jeg lo så trekoppen hoppet.",
                 "Goooood morgen, Snøfall! Rampenissen rapporterer: «Æ laga lydbølge av dorull.» Jeg lo så trekoppen hoppet.")[0] == 1.0
    assert check("I natt fant Iku notatboken", "I natt fant IQ notatboken.")[0] == 1.0
    assert check("I natt fant I Q notatboken", "I natt fant IQ notatboken.")[0] == 1.0
    c, miss, extra = check("Vi ses. Vi ses. Det var det hele, du.", "Ha en fin dag. Vi ses.")
    assert abs(c - 1 / 3) < 0.01 and miss == ["ha", "en", "fin", "dag"] and extra == "det var det hele du"
    c, miss, _ = check("ja hallo IQ sier linjen", "IQ sier linjen er åpen.")
    assert c == 0.0 and miss == ["er", "åpen"]
    assert warnings("Ingen er like.", "Senker stemmen.", True)[1] and "kort" in warnings("Han kom. Ingen er like.", "x", False)[0][0]
    assert not warnings("Ha en fin dag!", "x", False)[0] and warnings("x y z w v", "Løfter et ark og leser.", False)[0]
    assert "usynlig" not in BLOKK and len(BLOKK.strip().splitlines()) <= 6
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
                                          ("Et hopp i bildet, lyden hakker, rim.", "c", False), ("Uttoning i gull.", "d", False)],
             [(clips[0], worst_cut(clips), CUTAWAY)])
        assert (Path(d) / "dag.mp4").stat().st_size > 0
        png = Path(d) / "p.png"
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-f", "lavfi", "-i", "color=s=320x180", "-frames:v", "1", str(png)], check=True)
        join(clips, Path(d) / "promo.mp4", None, [(clips[0], 1, 1.0), (clips[1], 3, 3.0)], png, trim=False)
        assert abs(seconds(Path(d) / "promo.mp4") - (6 - 2 * XFADE + 3 - TAIL + PLAKAT)) < 0.2
        q = Path(d) / "q.mp4"  # 1 s silence, 0.05 s click, 1 s tone, 2 s silence
        subprocess.run(["ffmpeg", "-nostdin", "-v", "error", "-f", "lavfi", "-i", "testsrc=s=320x180:d=4", "-f", "lavfi", "-i",
                        "aevalsrc='if(between(t,0.4,0.45)+between(t,1,2),sin(2*PI*440*t),0)':d=4", "-shortest", str(q)], check=True)
        a, b = speech_span(q, 4.0)
        assert abs(a - (1 - LEAD)) < 0.05 and abs(b - (2 + TRAIL)) < 0.05, (a, b)
        join(clips[:1] + [q], Path(d) / "t.mp4")
        assert abs(seconds(Path(d) / "t.mp4") - (2 + TRAIL + (b - a) - XFADE + OUTRO + BLACK)) < 0.15
        assert speech_span(clips[0], 2.0)[1] > 2.0  # speech to the very end: padded, not cut
    assert not chained(2, []) and chained(2, ["--chain"]) and not chained(4, ["--chain"]) and not chained(1, ["--chain"])
    assert heard_as("tjernet", ["kjernen"]) and heard_as("god", ["gooood"]) and heard_as("orakelet", ["oraklet"])
    assert not heard_as("rim", ["rik"]) and not heard_as("hvelv", ["hytte"])  # short words stay exact
    assert tail_missing("det er teltet", "det er telte.") == [] and tail_missing("det er", "det er telte") == ["telte"]
    assert "mic_hand_ok is false" in AUDIT and "floats" in AUDIT and "either hand" in AUDIT and MIC.search("mic floating")
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
    if "--over-budsjett" in sys.argv:
        os.environ["OVER_BUDSJETT"] = "1"  # julius.sh checks it
    ATTEMPTS = int(arg("--forsøk") or ATTEMPTS)
    if sys.argv[1:] == ["selftest"]:
        selftest()
    elif sys.argv[1:] == ["test-port"]:
        test_port()
        test_arv()
    elif sys.argv[1:2] == ["manus"]:
        tekst = json.dumps(bake_manus(), ensure_ascii=False, indent=1) + "\n"
        if "--sjekk" in sys.argv:
            sys.exit(0 if MANUS_JSON.exists() and MANUS_JSON.read_text() == tekst else "src/data/julius-manus.json er utdatert: python3 assets/bin/julius-dag.py manus")
        MANUS_JSON.write_text(tekst)
    elif sys.argv[1:2] == ["segmenter"]:
        for d in [int(x) for x in sys.argv[2:] if x.isdigit()] or range(1, 25):
            for f in segmenter(d):
                print(f)
    elif sys.argv[1:] == ["test-kutt"]:
        test_kutt()
        test_arv()
    elif sys.argv[1:2] == ["lyd"]:
        for d in [int(x) for x in sys.argv[2:] if x.isdigit()] or range(1, 25):
            for v in sorted(Path(arg("--dest") or DEST).glob(f"dag-{d:02d}*.mp4")):
                if not v.with_name(f"{v.stem}.lyd.json").exists():
                    print(lyd_kurve(v))
    elif "--kutt" in sys.argv:
        kutt_dag(int(sys.argv[1]))
    elif sys.argv[1:2] == ["lint"]:
        sys.exit(1 if lint([int(d) for d in sys.argv[2:]] or range(1, 25)) else 0)
    elif "--extend" in sys.argv:
        extend_day(int(sys.argv[1]))
    else:
        main()
