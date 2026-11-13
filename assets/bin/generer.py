#!/usr/bin/env python3
"""One queue for all generated media: plan it, run it, resume it.

Usage:
  generer.py plan [--til-dag N] [--bare KAT] [--force]
  generer.py kjør [--til-dag N] [--bare KAT|ID] [--tørrkjør]   (ID: port:port-winter; --tørrkjør prints commands, no API calls)
                  [--maks-forespørsler N] [--stopp-etter julius:5] [--force] [--over-budsjett]
  generer.py --selvtest

plan shows three separate lists: what can run now (counted, with a NOK estimate from forbruk.PRIS), what waits
(script not approved for the day, missing photo or input; counted separately) and approved files whose inputs
changed («utdatert», kept, never counted). An item with a -vN candidate made from today's inputs is done. Julius
counts only segments without a take for the current script (julius-dag.py behov).

Order: (a) named tests, (b) Julius days ✗/⚠, (c) Rampenissen ✗/⚠, (d) TV loops and
events, (e) gate entrances, (f) the hidden NisseMusikk track, (g) sleigh horizons, Ugleposten
stills and pixel scenes, portraits (images, 0 video requests). ✓ current and ? unknown
are skipped. Items marked «Lag på nytt» in media-vurdering.json are queued (and their
mark removed on success), while «Godkjent» items are skipped unless --force.
A daily-limit or spending-cap error stops the run with exit code 75.

Video requests are counted from lines julius.sh and loop.sh append to $GENERER_LOGG
after each POST to the interactions API. The API answers synchronously with the video,
so there are no status polls to count. TTS and image calls do not count against the limit.
State: assets/out/generer-tilstand.json (requests per quota day, last error, per item).
"""
import json
import os
import re
import shlex
import signal
import subprocess
import sys
import tempfile
import threading
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).parent))
import forbruk  # noqa: E402
import inventar  # noqa: E402
import medie  # noqa: E402
import importlib.util  # noqa: E402

_spec = importlib.util.spec_from_file_location("julius_dag", Path(__file__).parent / "julius-dag.py")
julius_dag = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(julius_dag)

ROOT = medie.ROOT
BIN = Path(__file__).resolve().parent  # the scripts next to this file, also when NISSEKOMM_ROOT points elsewhere
STATE = ROOT / "assets/out/generer-tilstand.json"
DAY_LIMIT = 200
RETRY = 1.5  # expected takes per clip (julius-dag.py takes at most 2 by default)
EXIT_LIMIT = 75  # EX_TEMPFAIL: try again after the quota resets
LIMIT_RE = re.compile(r"per day|spending cap|Stoppet: (dagsgrensen|månedlig)", re.I)
MEDIER = medie.jobs()  # assets/medier.json; TV loops are listed by tv-loops.sh --liste
# sleigh horizons, Ugleposten stills and their pixel-art versions, pixel portraits, figure overlays
# and pocket icons (0 video requests)
IMAGE_CATS = ("slede", "spill", "spill-piksel", "portrett", "spill-figur", "spill-ikon", "strek", "oppsett")


def names(cat):
    """Jobs made by an image model; others (generator «skaler», «hånd») are only tracked in medier.json."""
    return [k.split("/", 1)[1] for k, j in MEDIER.items()
            if k.startswith(cat + "/") and j["generator"] in ("still", "piksel", "portrett", "figur", "ikon")]


SLEDE, SPILL, PIKSEL, PORTRETT, FIGUR, IKON, STREK, OPPSETT = (names(c) for c in IMAGE_CATS)
STILL_SH = ('mkdir -p "$(dirname "$3")" && bash "$4/still.sh" "$1" "$2" "$3" "${@:5}" && '
            'python3 "$4/medie.py" skriv still.sh "$3" "$2" - gemini-3-pro-image "$1" "${@:5}"')
# same inputs as STILL_SH; the model answers JPEG or PNG at will, ffmpeg makes the .png real
PIKSEL_SH = ('mkdir -p "$(dirname "$3")" && T=$(mktemp -d) && bash "$4/still.sh" "$1" "$2" "$T/bilde" "${@:5}" && '
             'ffmpeg -v error -y -i "$T/bilde" -pix_fmt rgb24 "$3" && rm -rf "$T" && '
             'python3 "$4/medie.py" skriv piksel "$3" "$2" - gemini-3-pro-image "$1" "${@:5}"')
PORTRETT_SH = ('mkdir -p "$(dirname "$3")" "$5" && bash "$4/portrett.sh" "$2" "$5/$(basename "$3")" "${@:6}" && '
               'bash "$4/piksel.sh" "$5/$(basename "$3")" "$3" && '
               'python3 "$4/medie.py" skriv portrett.sh "$3" "$2" - gemini-3-pro-image "${@:6}"')
# $6 is the size spec of piksel-sprite.py («ikon» or BxH in scene pixels); the model's magenta original
# stays in assets/out/<name>.raa.png for review
SPRITE_SH = ('mkdir -p "$(dirname "$3")" "$5" && R="$5/$(basename "$3" .png).raa.png" && bash "$4/portrett.sh" "$2" "$R" "${@:7}" && '
             'python3 "$4/piksel-sprite.py" "$R" "$3" "$6" && '
             'python3 "$4/medie.py" skriv portrett.sh "$3" "$2" - gemini-3-pro-image "${@:7}"')
RETRY_RE = re.compile(r'retryDelay"?:\s*"?(\d+)s|retry in ([\d.]+)\s*s', re.I)

# Named tests: one Julius clip each, made with julius.sh into assets/out/<name>.mp4.
TESTS = {
    "test-klementin": {
        "linje": "Og se hva jeg fant under bordet i dag! En klementin. Den lukter jul.",
        "handling": "Venstre hånd løfter rolig en klementin opp fra under bordkanten, holder den opp foran seg "
                    "og legger den på bordet ved trekoppen, der den blir liggende. Høyre hånd holder mikrofonen hele tiden.",
        "sek": 8,
    },
}


def quota_day() -> str:
    # ponytail: Gemini daily quotas reset at midnight Pacific (~09:00 in Norway)
    return datetime.now(ZoneInfo("America/Los_Angeles")).date().isoformat()


def media_dir() -> Path:
    return Path(os.environ.get("MEDIA_DIR") or ROOT / "public")


def vurdering_path(media: Path = None) -> Path:
    return medie.vurdering_fil(media or media_dir())


def load_vurderinger(path: Path) -> dict:
    try:
        return medie.vurderinger(path)
    except Exception:
        return {}


def is_redo(v) -> bool:
    val = (v.get("vurdering") or v.get("status")) if isinstance(v, dict) else v
    return val in ("lag_paa_nytt", "lag_på_nytt", "redo")


def is_approved(v) -> bool:
    val = (v.get("vurdering") or v.get("status")) if isinstance(v, dict) else v
    return val in ("godkjent", "approved", "ok")


def item_path(item_id: str) -> str:
    cat, _, key = item_id.partition(":")
    if item_id in TESTS:
        return f"assets/out/{item_id}.mp4"
    if cat == "julius":
        return f"video/julius/dag-{int(key):02d}.mp4" if key.isdigit() else ""
    if cat == "rampenissen":
        return f"audio/rampenissen/dag-{int(key):02d}.mp3" if key.isdigit() else ""
    if cat == "slede":
        return f"feed/slede-{key}.jpg"
    if cat == "spill":
        return f"spill/{key}.jpg"
    if cat == "spill-piksel":
        return f"spill/piksel/{key}.png"
    if cat == "portrett":
        return f"spill/portrett-{key}.png"
    if cat == "spill-figur":
        return f"spill/piksel/figur/{key}.png"
    if cat == "spill-ikon":
        return f"spill/piksel/ikon/{key}.png"
    if cat == "strek":
        return f"strek/{key}.png"
    if cat == "oppsett":
        return f"strek/oppsett-{key}.png"
    if cat in ("tv", "port"):
        return f"video/tv/{key}.mp4"
    if cat == "musikk":
        return f"music/{key}.mp3"
    return ""


def tv_jobs():
    out = subprocess.run(["bash", str(BIN / "tv-loops.sh"), "--liste"], capture_output=True, text=True, check=True).stdout
    return out.split()


VENTER = set()  # item ids held back from the queue


def familie(p: str) -> list:
    """The plain file and its -vN candidates that exist (media paths); .old-N is history, not a candidate."""
    f = media_dir() / p
    kand = sorted(x for x in f.parent.glob(f"{f.stem}-v*{f.suffix}")
                  if re.fullmatch(r"-v\d+", x.name[len(f.stem):len(x.name) - len(f.suffix)]))
    return ([p] if f.exists() else []) + [str(x.relative_to(media_dir())) for x in kand]


def nok(cat: str, est: float) -> float:
    """NOK estimate from forbruk.PRIS: video requests, else one image or one TTS call."""
    if est:
        return est * forbruk.PRIS["video"]
    return forbruk.PRIS["tts"] if cat in ("rampenissen", "musikk") else forbruk.PRIS["bilde"] if cat in IMAGE_CATS else 0


def infile(path: str, root: Path) -> Path:
    """A job input on disk. public/… in medier.json is a finished media file, so it lives in MEDIA_DIR
    (which defaults to <root>/public); everything else is relative to the checkout."""
    return media_dir() / path[len("public/"):] if path.startswith("public/") else root / path


def queue(rows, tv_names, root: Path = ROOT, til_dag=24, vurderinger=None, force=False, valgfri=False, rapport=None, sjekk_inndata=False):
    """[(id, category, estimated video requests, command)] in priority order.
    `rapport` (a dict) collects what plan shows besides the queue: «venter» [(id, cat, est, why)] for items that
    cannot run now, «utdatert» [(id, why)] for approved files whose inputs changed (kept, never remade)."""
    rapport = rapport if rapport is not None else {}
    rapport["venter"], rapport["utdatert"] = [], []
    st = {r["path"]: r["status"] for r in rows}
    todo = (medie.MISSING, medie.STALE) + ((medie.VALGFRI,) if valgfri else ())
    vurd = vurderinger or {}
    q = []

    def should_queue(p: str, current_status, item_id: str = "", avledet=()) -> bool:
        v = vurd.get(p)
        if force:
            return True
        fam = familie(p)
        cand = [f for f in fam if f != p]
        ok = [f for f in cand if medie._status(media_dir() / f, "", root)[0] == medie.CURRENT]
        if is_redo(v):
            # a current candidate made after the verdict is the answer to it
            return not any(datetime.fromtimestamp((media_dir() / f).stat().st_mtime).astimezone().isoformat() > v.get("oppdatert", "")
                           for f in ok) if isinstance(v, dict) else True
        if ok or current_status not in todo:
            return False
        godkjent = [f for f in [p, *cand] if is_approved(vurd.get(f))]
        if godkjent:
            f = godkjent[0]
            rapport["utdatert"].append((item_id, "; ".join(medie.status(media_dir() / f, f, root)[1]) or f"{f} endret"))
            return False
        # a photo whose pixel scene is approved is only the fallback; approved stays approved, never remake it
        if (f := next((a for a in avledet if is_approved(vurd.get(a))), None)):
            rapport["utdatert"].append((item_id, f"erstattet av godkjent {f}"))
            return False
        return True

    for name, t in TESTS.items():
        p = f"assets/out/{name}.mp4"
        if not (root / p).exists() or is_redo(vurd.get(p)) or (force and not is_approved(vurd.get(p))):
            q.append((name, "test", RETRY, [str(BIN / "julius.sh"), name, t["linje"], t["handling"], str(t["sek"])]))
    for d in range(1, til_dag + 1):
        segs = medie.julius_segments(d, root)
        p = f"video/julius/dag-{d:02d}.mp4"
        if segs and should_queue(p, st.get(p, medie.MISSING), f"julius:{d}"):
            # only segments without a take for today's script cost a call; the script gate can stop the whole day
            need, why = julius_dag.behov(d, vurd, root)
            if why:
                rapport["venter"].append((f"julius:{d}", "julius", len(need) * RETRY, "; ".join(why)))
            else:
                q.append((f"julius:{d}", "julius", len(need) * RETRY, ["python3", str(BIN / "julius-dag.py"), str(d)]))
    for d in range(1, til_dag + 1):
        p = f"audio/rampenissen/dag-{d:02d}.mp3"
        if medie.rampenissen_text(d, root) and should_queue(p, st.get(p, medie.MISSING), f"rampenissen:{d}"):
            q.append((f"rampenissen:{d}", "rampenissen", 0, ["bash", str(BIN / "rampenissen-tts.sh"), str(d)]))
    for n in tv_names:
        p = f"video/tv/{n}.mp4"
        if should_queue(p, st.get(p, medie.MISSING), f"tv:{n}" if not n.startswith("port-") else f"port:{n}"):
            cat = "port" if n.startswith("port-") else "tv"
            q.append((f"{cat}:{n}", cat, RETRY, ["bash", str(BIN / "tv-loops.sh"), "--bare", n]))
    for cat in IMAGE_CATS:
        for n in names(cat):
            p = MEDIER[f"{cat}/{n}"]["ut"]
            if MEDIER[f"{cat}/{n}"].get("dag", 0) > til_dag:  # a per-day sketch: only up to --til-dag
                continue
            # not every image is in the inventory (media.ts manifest); then ask its sidecar
            if not should_queue(p, st.get(p) or medie.status(media_dir() / p, p, ROOT)[0], f"{cat}:{n}",
                                [f"spill/piksel/{n}.png"] if cat == "spill" else ()):
                continue
            prompt, img, refs = medie.render(f"{cat}/{n}", ROOT, MEDIER)
            refs = [str(infile(r, root)) for r in refs]
            if sjekk_inndata and (gone := [Path(f).name for f in refs + ([str(infile(img, root))] if img else []) if not Path(f).is_file()]):
                rapport["venter"].append((f"{cat}:{n}", cat, 0, "mangler inndata: " + ", ".join(gone)))
                continue
            if cat == "portrett":
                cmd = [PORTRETT_SH, "_", "", str(root / prompt), str(media_dir() / p), str(BIN),
                       str(root / "assets/out"), *refs]
            elif cat in ("spill-figur", "spill-ikon"):
                spec = "ikon" if cat == "spill-ikon" else MEDIER[f"{cat}/{n}"]["px"]
                cmd = [SPRITE_SH, "_", "", str(root / prompt), str(media_dir() / p), str(BIN),
                       str(root / "assets/out"), spec, *refs]
            else:  # still.sh makes the image; medie.py skriv records the sidecar so it counts as current
                sh = PIKSEL_SH if cat in ("spill-piksel", "strek", "oppsett") else STILL_SH
                fmt = MEDIER[f"{cat}/{n}"].get("format")
                sh = f"export ASPECT={fmt}; {sh}" if fmt else sh
                sh = f"export LAERDOM_TYPE={medie.laerdom_type(p) or 'bilde'}; {sh}"  # PIKSEL writes to a temp file first
                cmd = [sh, "_", str(infile(img, root)), str(root / prompt), str(media_dir() / p), str(BIN), *refs]
            q.append((f"{cat}:{n}", cat, 0, ["bash", "-c", *cmd]))
    p_music = "music/rampenissen-synger.mp3"
    if should_queue(p_music, st.get(p_music, medie.MISSING), "musikk:rampenissen-synger"):
        q.append(("musikk:rampenissen-synger", "musikk", 0, ["bash", str(BIN / "rampenissen-tts.sh"), "synger"]))
    return [j for j in q if j[0] not in VENTER]


def load_state(path: Path):
    s = json.loads(path.read_text()) if path.exists() else {}
    s.setdefault("forespørsler", {})
    s.setdefault("elementer", {})
    s["merknad"] = "videoforespørsler = POST til interactions; statusspørringer finnes ikke (synkront svar)"
    return s


def save_state(path: Path, s):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(s, ensure_ascii=False, indent=1) + "\n")


def run_cmd(cmd, env):
    """Run, echo output live, return (exit code, output)."""
    p = subprocess.Popen(cmd, env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, stdin=subprocess.DEVNULL)
    out = []
    for line in p.stdout:
        print("  " + line, end="")
        out.append(line)
    return p.wait(), "".join(out)


def done(item_id, root: Path, media: Path) -> bool:
    """Is the item's output now ✓? Tests only need the file."""
    if item_id in TESTS:
        return (root / f"assets/out/{item_id}.mp4").exists()
    path = item_path(item_id)
    return medie.status(media / path, path, root)[0] == medie.CURRENT


def sigterm_som_unntak(*_):
    raise KeyboardInterrupt("SIGTERM")


def run(q, state_path: Path, maks=None, stopp_etter=None, runner=run_cmd, check=None,
        vurdering_fil: Path = None):
    """Run the queue; returns the exit code (0 done/stopped, 1 an item failed, 75 limit)."""
    check = check or (lambda i: done(i, ROOT, media_dir()))
    vpath = vurdering_fil or vurdering_path()
    vurderinger = load_vurderinger(vpath)
    s = load_state(state_path)
    today = quota_day()
    budget = min(DAY_LIMIT, maks if maks is not None else DAY_LIMIT)
    log = Path(tempfile.mkstemp(prefix="generer-", suffix=".logg")[1])
    if threading.current_thread() is threading.main_thread():
        signal.signal(signal.SIGTERM, sigterm_som_unntak)
    env = {**os.environ, "GENERER_LOGG": str(log)}
    try:
        for item_id, cat, est, cmd in q:
            used = s["forespørsler"].get(today, 0)
            item_p = item_path(item_id)
            redo = is_redo(vurderinger.get(item_p))
            if not redo and s["elementer"].get(item_id, {}).get("status") == "ferdig" and check(item_id):
                continue
            if est and used + est > budget:
                print(f"Stopper før {item_id}: {used} brukt, anslag {est:g}, grense {budget}")
                save_state(state_path, s)
                return 0
            if est and (msg := forbruk.sjekk("video", est)):
                print(msg)
                save_state(state_path, s)
                return forbruk.EXIT_BUDSJETT
            print(f"▶ {item_id} (anslag {est:g} videoforespørsler, {used} brukt i dag)")
            before = len(log.read_text().splitlines())
            # the generators overwrite the plain name; keep what is replaced as .old-N
            mal = media_dir() / item_p if item_p and item_id not in TESTS else None
            par, for_ = (medie.archive(mal, kopier=True), medie.signatur(mal)) if mal else ([], None)
            rc, out = -1, ""
            try:
                rc, out = runner(cmd, env)
            finally:  # also on SIGTERM (sigterm_som_unntak): a killed run puts the old file back
                medie.avslutt_arkiv(par, mal, for_, rc == 0)
            sent = len(log.read_text().splitlines()) - before
            if rc == forbruk.EXIT_BUDSJETT:  # a script's own guard (images, TTS) stopped
                save_state(state_path, s)
                return rc
            s["forespørsler"][today] = used + sent
            limit = LIMIT_RE.search(out)
            ok = rc == 0 and not limit and check(item_id)
            s["elementer"][item_id] = {"status": "ferdig" if ok else "feilet", "forespørsler": sent,
                                       "tid": datetime.now().isoformat(timespec="seconds")}
            if ok and redo:
                medie.fjern_vurdering(vpath, item_p)
                vurderinger = load_vurderinger(vpath)
            if limit:
                m = RETRY_RE.search(out)
                wait = f", prøv igjen om {m.group(1) or m.group(2)} s" if m else ", prøv igjen etter at kvoten nullstilles (ca. 09:00)"
                s["siste_feil"] = f"{item_id}: {limit.group(0)}{wait}"
                save_state(state_path, s)
                print(f"Stoppet: grense nådd ved {item_id} ({limit.group(0)}){wait}. Kjør igjen for å fortsette.")
                return EXIT_LIMIT
            if not ok:
                s["siste_feil"] = f"{item_id}: exit {rc}"
                save_state(state_path, s)
                print(f"Feil i {item_id} (exit {rc}); retter du den, fortsetter neste kjøring herfra.")
                return 1
            save_state(state_path, s)
            if stopp_etter == item_id:
                print(f"Stopper etter {item_id} for gjennomsyn.")
                return 0
    finally:
        log.unlink(missing_ok=True)
    print("Køen er tom.")
    return 0


def plan(q, used: int, rapport=None):
    """The queue that can run now, then what waits (not counted), then approved-but-outdated (not counted)."""
    rapport = rapport or {}
    total = kr = 0.0
    print("KAN KJØRES NÅ")
    for item_id, cat, est, _ in q:
        total += est
        kr += nok(cat, est)
        print(f"  {item_id:38} {est:5g}   sum {total:6g}")
    days = -(-total // DAY_LIMIT) if total else 0
    print(f"  = {len(q)} elementer, ca. {total:g} videoforespørsler (anslag inkl. ×{RETRY} for nye forsøk), "
          f"ca. {kr:.0f} NOK; {used} brukt i dag av {DAY_LIMIT}, {days:g} dag(er) med full kvote.")
    venter = rapport.get("venter", [])
    vt, vk = sum(e for _, _, e, _ in venter), sum(nok(c, e) for _, c, e, _ in venter)
    print(f"\nVENTER PÅ (telles ikke med): {len(venter)} elementer, ca. {vt:g} videoforespørsler, ca. {vk:.0f} NOK")
    for item_id, _, est, why in venter:
        print(f"  {item_id:38} {est:5g}   venter på: {why}")
    ut = rapport.get("utdatert", [])
    print(f"\nUTDATERT (godkjent, lages ikke; telles ikke med): {len(ut)} elementer")
    for item_id, why in ut:
        print(f"  {item_id:38} {why}")


def dry_run(q):
    """Print each command with its absolute paths, no API calls; TV loops expand via tv-loops.sh --tørrkjør.
    Exit 1 if an input file is missing."""
    bad = 0
    for item_id, cat, _, cmd in q:
        print(f"▶ {item_id}", flush=True)
        if cmd[0] == "bash" and cmd[1].endswith("tv-loops.sh"):
            bad |= subprocess.run([*cmd, "--tørrkjør"], stdin=subprocess.DEVNULL).returncode != 0
            continue
        print("  " + shlex.join(cmd))
        if (t := re.search(r"LAERDOM_TYPE=(\w+)", cmd[2] if len(cmd) > 2 else "")) and (u := medie.unngaa(t[1])):
            print("  lærdom:" + u.replace("\n", "\n  "))
        if cmd[:2] == ["bash", "-c"]:  # still/portrett: the positional args are the inputs
            refs_from = {"portrett": 9, "spill-figur": 10, "spill-ikon": 10}.get(cat)
            for f in (cmd[5:6] + cmd[refs_from:]) if refs_from else (cmd[4:6] + cmd[8:]):
                if not Path(f).is_file():
                    print(f"  mangler inndata: '{f}'")
                    bad = 1
    return bad


def arg(argv, name, default=None):
    return argv[argv.index(name) + 1] if name in argv else default


def main(argv):
    if not argv or argv[0] not in ("plan", "kjør"):
        sys.exit(__doc__)
    if "--over-budsjett" in argv:
        os.environ["OVER_BUDSJETT"] = "1"  # the scripts check it
    til = int(arg(argv, "--til-dag", 24))
    bare = arg(argv, "--bare")
    force = "--force" in argv
    vpath = vurdering_path()
    vurd = load_vurderinger(vpath)
    rapport = {}
    q = queue(inventar.scan(media_dir()), tv_jobs(), til_dag=til, vurderinger=vurd, force=force, valgfri=bool(bare), rapport=rapport,
               sjekk_inndata=argv[0] == "plan")
    if bare:
        q = [i for i in q if bare in (i[1], i[0])]  # a category (port) or an item id (port:port-winter)
    if argv[0] == "plan":
        plan(q, load_state(STATE)["forespørsler"].get(quota_day(), 0), rapport)
        return 0
    if "--tørrkjør" in argv:
        return dry_run(q)
    maks = arg(argv, "--maks-forespørsler")
    return run(q, STATE, int(maks) if maks else None, arg(argv, "--stopp-etter"), vurdering_fil=vpath)


def selftest():
    """Fake inventory and a fake API that hits the daily limit on call N; then resume."""
    medie.selftest()
    with tempfile.TemporaryDirectory() as t:
        root = Path(t)
        # images missing from rows fall back to their sidecar in MEDIA_DIR; never read the real library here
        old_media, os.environ["MEDIA_DIR"] = os.environ.get("MEDIA_DIR"), str(root / "media")
        (root / "docs/manus").mkdir(parents=True)
        (root / medie.JULIUS_MS).write_text("".join(
            f"## Dag {d} (x)\n**Replikk:** «Hei {d}»\n- Varighet: 8 s\n- Handling: smil\n- Kulde: ingen\n" for d in (1, 2, 3)))
        (root / medie.RAMPE_MS).write_text("## Dag 1 (x)\n**Klipp:** «Hei!»\n")
        rows = [{"path": "video/julius/dag-01.mp4", "status": medie.CURRENT},
                {"path": "video/julius/dag-02.mp4", "status": medie.MISSING},
                {"path": "video/julius/dag-03.mp4", "status": medie.STALE},
                {"path": "audio/rampenissen/dag-01.mp3", "status": medie.UNKNOWN},
                {"path": "video/tv/landsby-rolig.mp4", "status": medie.UNKNOWN},
                {"path": "music/rampenissen-synger.mp3", "status": medie.CURRENT},
                *({"path": f"feed/slede-{v}.jpg", "status": medie.CURRENT} for v in SLEDE),
                *({"path": f"spill/{n}.jpg", "status": medie.CURRENT} for n in SPILL),
                *({"path": f"spill/piksel/{n}.png", "status": medie.CURRENT} for n in PIKSEL),
                *({"path": f"spill/portrett-{n}.png", "status": medie.CURRENT} for n in PORTRETT),
                *({"path": f"spill/piksel/figur/{n}.png", "status": medie.CURRENT} for n in FIGUR),
                *({"path": f"spill/piksel/ikon/{n}.png", "status": medie.CURRENT} for n in IKON),
                *({"path": f"strek/{n}.png", "status": medie.CURRENT} for n in STREK),
                *({"path": f"strek/oppsett-{n}.png", "status": medie.CURRENT} for n in OPPSETT)]
        def manus_ok(days):  # the guide's script approval, on the current hash of each segment
            return {julius_dag.manus_id(d, i): {"vurdering": "godkjent", "versjon": medie.innholds_hash(julius_dag.take_key(*seg))}
                    for d in days for i, seg in enumerate(medie.julius_segments(d, root), 1)}
        ok = manus_ok((1, 2, 3))
        q = queue(rows, ["landsby-rolig", "landsby-morgen", "port-iq"], root, vurderinger=ok)
        assert [i[0] for i in q] == ["test-klementin", "julius:2", "julius:3", "tv:landsby-morgen", "port:port-iq"], q
        strek = [r for r in rows if r["path"] not in ("strek/dag02.png", "strek/dag09.png")]
        assert [i[0] for i in queue(strek, [], root, til_dag=5) if i[1] == "strek"] == ["strek:dag02"]
        # sleigh stills: queued when missing, as images (estimate 0, so never counted against the video quota)
        qs = queue([r for r in rows if r["path"] != "feed/slede-julenatt.jpg"], [], root, til_dag=0)
        assert [(i[0], i[2]) for i in qs if i[1] == "slede"] == [("slede:julenatt", 0)], qs
        qp = queue([r for r in rows if not r["path"].startswith("spill/")], [], root, til_dag=0)
        assert sorted(i[0] for i in qp if i[1] == "spill") == sorted(f"spill:{n}" for n in SPILL)
        assert all(i[2] == 0 for i in qp if i[1] == "spill") and item_path("spill:torget") == "spill/torget.jpg"
        assert item_path("slede:muren") == "feed/slede-muren.jpg"
        # a spill photo is archived by copy: .old-N after a good run, the old file back after a failed or killed one
        n0 = SPILL[0]
        foto = Path(os.environ["MEDIA_DIR"]) / f"spill/{n0}.jpg"
        foto.parent.mkdir(parents=True, exist_ok=True)

        def kjor(tekst, rc=0, avbryt=False):
            def r(cmd, env):
                foto.write_text(tekst)
                if avbryt:
                    raise KeyboardInterrupt
                return rc, ""
            try:
                run([(f"spill:{n0}", "spill", 0, ["x"])], root / "t_arkiv.json", runner=r, check=lambda i: True,
                    vurdering_fil=root / "v_arkiv.json")
            except KeyboardInterrupt:
                pass
        foto.write_text("gammel")
        kjor("ny")
        old = foto.with_name(f"{n0}.old-1.jpg")
        assert foto.read_text() == "ny" and old.read_text() == "gammel"
        old.unlink()
        for kw in ({"rc": 1}, {"avbryt": True}):
            kjor("halv", **kw)
            assert foto.read_text() == "ny" and not old.exists() and not foto.with_name(foto.name + ".tmp").exists(), kw
        # plan: a photo whose pixel scene is approved is «utdatert», never «kan kjøres»
        foto.unlink()
        rapp = {}
        qa = queue([r for r in rows if r["path"] != f"spill/{n0}.jpg"], [], root, til_dag=0, rapport=rapp,
                   vurderinger={f"spill/piksel/{n0}.png": {"vurdering": "godkjent"}})
        assert f"spill:{n0}" not in [i[0] for i in qa] and f"spill:{n0}" in [u[0] for u in rapp["utdatert"]], rapp
        assert item_path("portrett:winter") == "spill/portrett-winter.png"
        # pixel-art scenes: their own category, read the shown photo from MEDIA_DIR (public/…) and convert to png
        assert item_path("spill-piksel:torget") == "spill/piksel/torget.png"
        qx = queue([r for r in rows if r["path"] != "spill/piksel/torget.png"], [], root, til_dag=0)
        (px,) = [i for i in qx if i[1] == "spill-piksel"]
        assert px[0] == "spill-piksel:torget" and px[3][2].endswith(PIKSEL_SH) and "LAERDOM_TYPE=bilde;" in px[3][2] and px[3][4] == str(root / "media/spill/torget.jpg"), px
        assert infile("assets/x.jpg", root) == root / "assets/x.jpg"
        qr = queue([r for r in rows if r["path"] != "spill/portrett-winter.png"], [], root, til_dag=0)
        assert [i[0] for i in qr if i[1] == "portrett"] == ["portrett:winter"], qr
        # figure overlays and pocket icons: portrett.sh on magenta, then piksel-sprite.py with the size spec
        assert item_path("spill-figur:rudolf") == "spill/piksel/figur/rudolf.png"
        assert item_path("spill-ikon:bolle") == "spill/piksel/ikon/bolle.png"
        qf = queue([r for r in rows if r["path"] not in ("spill/piksel/figur/rudolf.png", "spill/piksel/ikon/bolle.png")],
                   [], root, til_dag=0)
        (fig,), (ik,) = [i for i in qf if i[1] == "spill-figur"], [i for i in qf if i[1] == "spill-ikon"]
        assert fig[3][2].startswith(SPRITE_SH) and fig[3][9] == MEDIER["spill-figur/rudolf"]["px"], fig
        assert ik[3][9] == "ikon", ik
        calls, made = [], set()

        def fake(cmd, env, fail_on=3):
            calls.append(cmd)
            with open(env["GENERER_LOGG"], "a") as f:
                f.write("video x\n")
            if len(calls) == fail_on:
                return 1, '{"error":{"message":"Quota exceeded: requests per day","details":[{"retryDelay":"3600s"}]}}'
            made.add(next(i[0] for i in q if i[3] == cmd))
            return 0, "ok"

        st = root / "tilstand.json"
        rc = run(q, st, runner=fake, check=lambda i: i in made)
        s = json.loads(st.read_text())
        assert rc == EXIT_LIMIT, rc
        assert s["forespørsler"][quota_day()] == 3
        assert s["elementer"]["julius:3"]["status"] == "feilet" and "3600" in s["siste_feil"]
        rc = run(q, st, runner=lambda c, e: fake(c, e, fail_on=0), check=lambda i: i in made)
        assert rc == 0 and len(calls) == 6, calls  # resumed at julius:3, tests and julius:2 skipped
        assert json.loads(st.read_text())["forespørsler"][quota_day()] == 6
        # budget: stop before an item that would exceed --maks-forespørsler
        calls.clear()
        assert run(q, root / "t2.json", maks=2, runner=lambda c, e: fake(c, e, fail_on=0), check=lambda i: True) == 0
        assert len(calls) == 1  # test ran (1 sent), julius:2 (1.5) would pass 2
        # --stopp-etter
        calls.clear()
        made.clear()
        assert run(q, root / "t4.json", stopp_etter="julius:2", runner=lambda c, e: fake(c, e, fail_on=0),
                   check=lambda i: i in made) == 0 and len(calls) == 2

        # media-vurdering: queue honours verdicts and removes mark on success
        v_test = {
            **ok,
            "video/julius/dag-01.mp4": {"vurdering": "lag_paa_nytt"},
            "video/julius/dag-03.mp4": {"vurdering": "godkjent"},
        }
        q_v = queue(rows, ["landsby-rolig"], root, vurderinger=v_test)
        q_v_ids = [i[0] for i in q_v]
        assert "julius:1" in q_v_ids, q_v_ids  # queued because lag_paa_nytt
        assert "julius:2" in q_v_ids, q_v_ids  # queued because MISSING
        assert "julius:3" not in q_v_ids, q_v_ids  # skipped because godkjent

        # with force=True, godkjent item julius:3 is queued
        q_force = queue(rows, ["landsby-rolig"], root, vurderinger=v_test, force=True)
        assert "julius:3" in [i[0] for i in q_force]

        # mark removal after successful run
        v_file = root / "media-vurdering.json"
        v_file.write_text(json.dumps({"video/julius/dag-01.mp4": {"vurdering": "lag_paa_nytt", "notat": "fikse"}}))
        run([("julius:1", "julius", 0, ["echo", "1"])], root / "t_v.json",
            runner=lambda c, e: (0, "ok"),
            check=lambda i: True, vurdering_fil=v_file)
        v_after = json.loads(v_file.read_text())
        assert "vurdering" not in v_after.get("video/julius/dag-01.mp4", {})
        assert v_after.get("video/julius/dag-01.mp4", {}).get("notat") == "fikse"
        # plan: the script gate holds a day back with the reason, and the day is not counted as ready
        rap = {}
        qg = queue(rows, [], root, vurderinger={}, rapport=rap)
        assert "julius:2" not in [i[0] for i in qg]
        assert [(v[0], v[2], "manus ikke godkjent" in v[3]) for v in rap["venter"] if v[1] == "julius"] == \
            [("julius:2", 1.5, True), ("julius:3", 1.5, True)], rap["venter"]
        # takes for today's script are done: only the segment without one counts (julius:2 has 1 segment)
        out = root / "assets/out"
        out.mkdir(parents=True)
        (out / "dag02-1.take.json").write_text(json.dumps(julius_dag.take_key(*medie.julius_segments(2, root)[0])))
        (out / "dag02-1.mp4").write_text("x")
        assert julius_dag.behov(2, ok, root) == ([], []) and julius_dag.behov(3, ok, root) == ([1], [])
        qt = queue(rows, [], root, vurderinger=ok)
        assert [i[2] for i in qt if i[0] == "julius:2"] == [0] and [i[2] for i in qt if i[0] == "julius:3"] == [1.5], qt
        # a -vN candidate made from today's source is done; an approved stale one is «utdatert», both left out
        vid = root / "media/video/tv"
        vid.mkdir(parents=True)
        (root / "docs/x.md").write_text("x")
        (vid / "landsby-morgen-v1.mp4").write_text("x")
        medie.write("still.sh", vid / "landsby-morgen-v1.mp4", "docs/x.md", None, "m", root=root)
        (root / "media/video/julius").mkdir(parents=True)
        (root / "media/video/julius/dag-03-v2.mp4").write_text("x")
        rap = {}
        qf = queue(rows, ["landsby-morgen"], root, vurderinger={"video/julius/dag-03-v2.mp4": {"vurdering": "ok"}, **ok}, rapport=rap)
        assert "tv:landsby-morgen" not in [i[0] for i in qf] and "julius:3" not in [i[0] for i in qf], qf
        assert [u[0] for u in rap["utdatert"]] == ["julius:3"], rap
        assert nok("julius", 3) == 3 * forbruk.PRIS["video"] and nok("rampenissen", 0) == forbruk.PRIS["tts"]
        os.environ.pop("MEDIA_DIR")
        if old_media is not None:
            os.environ["MEDIA_DIR"] = old_media
    print("selvtest ok")


if __name__ == "__main__":
    if "--selvtest" in sys.argv:
        selftest()
    else:
        sys.exit(main(sys.argv[1:]))
