#!/usr/bin/env python3
"""Provenance for generated media: what a file was made from, and whether that still holds.

Each generator writes <file>.meta.json next to its output. The status check
recomputes the same inputs from today's sources and compares.

CLI (for the shell generators):
  medie.py tekst rampenissen <dag>        the clip text, as the generator reads it
  medie.py stil rampenissen               the TTS style line
  medie.py skriv <generator> <fil> <kilde> <seksjon|-> <modell> [bilde ...]
  medie.py status <fil>                   prints the status; exit 0 only if ✓ current
  medie.py render <id>                    prompt, base image and refs of a medier.json job, one per line
  medie.py brukt-av <entitet>             medier.json jobs that use winter, torget, objects/postkasse …
  medie.py flytt                        move gitignored refs and stills to their new paths (assets/flyttet.json)
  medie.py statusjson <mediemappe> <nøkkel>  status and reasons of one file as JSON
  medie.py bakfyll [mediemappe]           sidecar (bakfylt, status ukjent) for files made before the inventory
  medie.py tv                           the TV loops of medier.json, one line each (tv-loops.sh)
  medie.py stiller <id>                   intermediate stills of a job: image|prompt|out|refs, first one first
  medie.py inndata                        every job's template, image, refs exist; exit 1 if one is missing
  medie.py entiteter [--sjekk]            src/data/entiteter.json + CONTENT_GUIDE block from characters/*/entitet.md
  medie.py rydd-kandidater [mediemappe]  once: archive -vK older than a promoted file (media-promoteringer.log)
  medie.py radio-manus [--sjekk]          bake src/data/radio-manus.json (script gate hash per day)
  medie.py radio-port <dag>               exit 1 unless manus/radio/dag-NN is approved on today's text
  medie.py radio-avled [mediemappe]       once: approve the script of each approved, current radio clip
  medie.py unngaa <type|""> [fil]          the «Unngå:» block of active rules (assets/laerdom.json); type from fil if empty
  medie.py --selvtest
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import time
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path

# NISSEKOMM_ROOT: use another checkout's assets (a dry run from a worktree against the real refs)
ROOT = Path(os.environ.get("NISSEKOMM_ROOT") or Path(__file__).resolve().parents[2]).resolve()
BIN = ROOT / "assets" / "bin"
JULIUS_MS = "docs/manus/julius-2026.md"
RAMPE_MS = "docs/manus/rampenissen-radio-2026.md"


def entity(ent: str, root: Path = ROOT) -> dict:
    """assets/<kind>/<id>/entitet.md: its ```json block, plus each «## Overskrift» section under "seksjoner"."""
    p = root / "assets" / ent / "entitet.md"
    if not p.exists():
        return {}
    t = p.read_text()
    meta = json.loads(re.search(r"```json\n(.*?)\n```", t, re.S)[1])
    parts = re.split(r"^## (.+)$", t, flags=re.M)
    meta["seksjoner"] = {h.strip(): b.strip() for h, b in zip(parts[1::2], parts[2::2])}
    return meta


# the TTS line in Rampenissen's «## Stemme»; a changed line marks every clip stale (prompt_version)
RAMPE_STYLE = re.search(r"^TTS: (.+)$", entity("characters/rampenissen")["seksjoner"]["Stemme"], re.M)[1]

CURRENT, STALE, UNKNOWN, MISSING = "current", "stale", "unknown", "missing"
# history, not something to regenerate: a replaced file (.old-N) and a candidate (-vN), see VERSION
ARKIV, KANDIDAT = "arkiv", "kandidat"
# a medier.json job marked "valgfri": nice to have, not made; generer.py queues it only with --bare
VALGFRI = "valgfri"

# Files made before sidecars whose source is known to be wrong. Only used while the file has no sidecar.
OVERRIDES = {
    **{f"audio/rampenissen/dag-{d:02d}.mp3": "instruksjonen ble lest opp (laget før sidefiler)" for d in range(1, 5)},
    "video/tv/landsby-winter.mp4": "Winter har nytt design (laget før sidefiler)",
}


def sha(data) -> str:
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode()).hexdigest()


def innholds_hash(obj) -> str:
    """Version of a reviewed item from its content; same as innholdsHash in src/lib/vurdering-versjon.ts."""
    return sha(json.dumps(obj, ensure_ascii=False, separators=(",", ":")))[:12]


def vurdering_fil(media: Path = None) -> Path:
    return Path(media or os.environ.get("MEDIA_DIR") or ROOT / "public") / "media-vurdering.json"


def les_lager(f: Path) -> dict:
    """The verdict store as stored: format 2 (src/lib/vurdering-lager.ts, which migrates format 1 on first read)."""
    return json.loads(f.read_text()) if f.exists() else {}


@contextmanager
def lås(f: Path, vent: float = 10.0):
    """media-vurdering.json.lock (O_EXCL), shared with withLås in src/lib/vurdering-lager.ts: one read-modify-write at a time."""
    lock, frist = f.with_name(f.name + ".lock"), time.monotonic() + vent
    while True:
        try:
            os.close(os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY))
            break
        except FileExistsError:
            try:  # a writer that died holding it
                if time.time() - lock.stat().st_mtime > 30:
                    lock.unlink(missing_ok=True)
                    continue
            except FileNotFoundError:
                continue
            if time.monotonic() > frist:
                raise SystemExit(f"{lock} er låst; prøv igjen")
            time.sleep(0.02)
    try:
        yield
    finally:
        lock.unlink(missing_ok=True)


def skriv_lager(f: Path, data: dict):
    tmp = f.with_suffix(f".tmp.{os.getpid()}")
    try:
        tmp.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        tmp.replace(f)
    except Exception:
        tmp.unlink(missing_ok=True)
        raise


def flat(data: dict) -> dict:
    """{fil: {vurdering, notat, oppdatert, versjon}} from either format, without the version check."""
    if data.get("format") != 2:
        return data
    return {v["fil"]: {k: x for k, x in v.items() if k not in ("hash", "fil")}
            for e in data["elementer"].values() for v in e["vurderinger"]}


def vurderinger(f: Path = None) -> dict:
    """Hans' verdicts from the guide by file/id; {} when there are none."""
    return flat(les_lager(f or vurdering_fil()))


def fjern_vurdering(f: Path, id: str):
    """A redo is done: the verdict goes to historikk, the note stays."""
    with lås(f):
        data = les_lager(f)
        if data.get("format") != 2:
            v = data.get(id)
            if isinstance(v, dict):
                v.pop("vurdering", None)
                v.pop("status", None)
            if not isinstance(v, dict) or not v:
                data.pop(id, None)
        else:
            for e in data["elementer"].values():
                for v in [v for v in e["vurderinger"] if v["fil"] == id]:
                    e["historikk"].append(dict(v))
                    v.pop("vurdering", None)
                    if not v.get("notat"):
                        e["vurderinger"].remove(v)
        skriv_lager(f, data)


def flytt_vurderinger(f: Path, ny: dict):
    """Files renamed on disk: verdicts follow (format 2 keeps their hash; -vN and .old-N stay in one element)."""
    with lås(f):
        data = les_lager(f)
        if data.get("format") != 2:
            data = {ny.get(k, k): v for k, v in data.items()}
        else:
            for e in data["elementer"].values():
                for v in e["vurderinger"] + e["historikk"]:
                    v["fil"] = ny.get(v["fil"], v["fil"])
        skriv_lager(f, data)


def godkjent(vurd: dict, id: str, versjon: str) -> bool:
    """Approved (godkjent or ok) on exactly this version: any other version counts as not reviewed."""
    v = vurd.get(id) or {}
    return v.get("vurdering") in ("godkjent", "ok") and v.get("versjon") == versjon


def julius_segments(day: int, root: Path = ROOT, ms: str = JULIUS_MS, text: str = None):
    """[(line, secs, action, kulde, locked)] for one day of the Julius script; [] if the day is missing.

    Tolerant of field order and missing fields (the script is rewritten by hand): a segment is a
    **Replikk:** «…» followed by «- Varighet: N s», «- Handling:», «- Kulde:» lines. locked = the
    segment is marked as a locked brikke («låst» or «brikke» on the Varighet line or after the line)."""
    text = text if text is not None else (root / ms).read_text()
    block = re.search(rf"^## Dag {day} \(.*?(?=^## Dag |\Z)", text, re.S | re.M)
    if not block:
        return []
    out = []
    for seg in re.split(r"\*\*Replikk:\*\*", block.group(0))[1:]:
        line = re.match(r"\s*«(.+)»(.*)", seg)  # greedy on one line: nested «…» stays inside
        secs = re.search(r"^\s*- Varighet: (\d+) s(.*)$", seg, re.M)
        if not line or not secs:
            continue
        field = lambda k: (m.group(1).strip() if (m := re.search(rf"^\s*- {k}: (.+)$", seg, re.M)) else "")
        tag = (line.group(2).split("\n")[0] + secs.group(2)).lower()
        out.append((line.group(1).strip(), int(secs.group(1)), field("Handling"), field("Kulde"),
                    "låst" in tag or "brikke" in tag))
    return out


def rampenissen_text(day: int, root: Path = ROOT) -> str:
    """The **Klipp:** lines of one day, same as the old awk/grep/sed pipeline."""
    out, on = [], False
    for line in (root / RAMPE_MS).read_text().splitlines():
        if line.startswith(f"## Dag {day} "):
            on = True
        elif on and line.startswith("## "):
            break
        if on and line.startswith("**Klipp:** «"):
            out.append(re.sub(r"»$", "", line[len("**Klipp:** «"):]))
    return "\n".join(out)


RADIO_MANUS = "src/data/radio-manus.json"
ORD_PER_SEK = 2.4  # scripts/manus-check.py's radio estimate


def radio_id(day: int) -> str:
    return f"manus/radio/dag-{day:02d}"


def radio_manus(root: Path = ROOT) -> dict:
    """{dag: {hash, tekst, ord, sek}}: the text rampenissen-tts.sh speaks; its innholds_hash is the review version."""
    out = {}
    for d in range(1, 25):
        t = rampenissen_text(d, root)
        if t:
            n = len(t.split())
            out[str(d)] = {"hash": innholds_hash(t), "tekst": t, "ord": n, "sek": round(n / ORD_PER_SEK)}
    return out


def radio_avled(media: Path, root: Path = ROOT) -> list:
    """Days whose clip is approved on the file there now and made from today's text: their script counts approved."""
    f = vurdering_fil(media)
    with lås(f):
        data = les_lager(f)
        if data.get("format") != 2:
            raise SystemExit("media-vurdering.json er ikke format 2: åpne guiden én gang først")
        vurd, el, nye = flat(data), data["elementer"], []
        for d, m in radio_manus(root).items():
            fil, id = f"audio/rampenissen/dag-{int(d):02d}.mp3", radio_id(int(d))
            lyd = next((v for e in el.values() for v in e["vurderinger"] if v["fil"] == fil), None)
            p = media / fil
            if (id in vurd or not lyd or lyd.get("vurdering") not in ("godkjent", "ok") or not p.exists()
                    or lyd["hash"] != sha(p.read_bytes())[:12] or status(p, fil, root)[0] != CURRENT):
                continue
            el[id] = {"vurderinger": [{"vurdering": "godkjent", "oppdatert": datetime.now(timezone.utc).isoformat(timespec="seconds"),
                                       "versjon": m["hash"], "hash": m["hash"], "fil": id,
                                       "kilde": "avledet fra godkjent lydklipp"}], "historikk": []}
            nye.append(id)
        if nye:
            skriv_lager(f, data)
        return nye


def strek_text(day: int, root: Path = ROOT) -> str:
    """The **Strek:** line of one day in the Rampenissen script ('' if none)."""
    m = re.search(rf"^## Dag {day} .*?^\*\*Strek:\*\* (.+?)$", (root / RAMPE_MS).read_text(), re.S | re.M)
    return m[1].strip() if m and "\n## " not in m[0] else ""


def fill_day(text: str, day, root: Path = ROOT) -> str:
    """A template for one day: {{strek}} = that day's Strek line, then the usual placeholders."""
    if not day:
        return fill(text, root)
    strek = strek_text(int(day), root)
    # again after fill: an included template (prompts/strek/skisse) carries its own {{strek}}
    return fill(text.replace("{{strek}}", strek), root).replace("{{strek}}", strek)


FLYTTET = "assets/flyttet.json"  # old -> new path of moved prompts, stills and refs


def moves(root: Path = ROOT) -> dict:
    return json.loads((root / FLYTTET).read_text()) if (root / FLYTTET).exists() else {}


def located(path: str, root: Path = ROOT) -> Path:
    """Where a path recorded in a sidecar is now. Sidecars keep their old paths (also absolute ones from
    another checkout); a file that has moved is found through assets/flyttet.json, so no sidecar is rewritten."""
    p = root / path
    if p.exists():
        return p
    i = str(path).find("assets/")
    key = str(path)[i:] if i >= 0 else str(path)
    return root / moves(root)[key] if key in moves(root) else p


def flytt(root: Path = ROOT):
    """Move every file in flyttet.json that is still at its old place (gitignored refs and stills; idempotent)."""
    for old, new in moves(root).items():
        o, n = root / old, root / new
        if o.exists() and not n.exists():
            n.parent.mkdir(parents=True, exist_ok=True)
            o.rename(n)
            print(f"{old} -> {new}")


def source_text(path: str, section, root: Path = ROOT):
    """The exact text a generator used from <path> (a day section, or the whole file); None if gone."""
    p = located(path, root)
    if not p.exists():
        return None
    if section is None:  # a template counts as the text it renders to, so moving text into {{…}} changes nothing
        return fill(p.read_text(), root=root)
    day = int(section.split()[-1])
    if path.startswith("assets/prompts/"):  # a per-day template (strek/skisse)
        return fill_day(p.read_text(), day, root)
    if path == JULIUS_MS:
        segs = julius_segments(day, root)
        return json.dumps(segs, ensure_ascii=False) if segs else None
    if path == RAMPE_MS:
        return rampenissen_text(day, root) or None
    raise ValueError(f"ukjent seksjonert kilde: {path}")


JULIUS_P = re.compile(r'^P="(.*?)(?<!\\)"$', re.S | re.M)  # the main prompt in julius.sh (not the Extend one)

# prompt_version used to hash all of julius.sh above curl, so usage comments and request plumbing marked every
# clip stale. Sidecars keep the old value: map it to the prompt-only hash of the same julius.sh version.
LEGACY_PROMPT = {
    "ff0515e6d7f6623dbdc0bc4a8f8e28c4588bed9362942c03c7f08bb3a73f08be": "4aa414e38d9233aec70d9e4a62ee89bc99c37ed2cf96d67c92ee5df464d52559",  # b5dd51c
    "5ad2b60f7d8da9ca504826453678a59226d16ad3894a5078c703cbb3b500a9c7": "4aa414e38d9233aec70d9e4a62ee89bc99c37ed2cf96d67c92ee5df464d52559",  # c39ad2d
    "4ccb7645b65a70b56c455313b8993aa329a890dd1377fcabb398c937ef9e6fdc": "4aa414e38d9233aec70d9e4a62ee89bc99c37ed2cf96d67c92ee5df464d52559",  # 56a6abf
    "1cdc4ac9cfc1ac1cdecd09fd47d41ecda2226e6bbfa54f2afe9b2384f68927de": "cff6292629a6901bab54b28d63965700c3ddb7f125d7aa0ebaa3cc93897dd1ae",  # 60d1445
    "a9b0d8f47535499dfa28d2798ee34000add42f66d8fc199a8ee5fc18c468552c": "da1787e99358514f7fe57a72b6e45a23608369fb62ea79ccc19459fc0a2eab72",  # 0ef820e
    "d9bac58060f6d96a7782757a00d0c859dd40a97b9b7dfff0123497e8261451f2": "4aa414e38d9233aec70d9e4a62ee89bc99c37ed2cf96d67c92ee5df464d52559",  # herding: tidskoder, mikrofon, ingen pauser
}


def prompt_version(generator: str, root: Path = ROOT):
    """Hash of the prompt text a generator adds besides the source text; None when it adds none.

    Only prompt text counts, not request plumbing: the TV and image scripts send the source template as
    the whole prompt (refs are checked on their own), so they have no prompt version."""
    if generator == "julius-dag.py":
        m = JULIUS_P.search((root / "assets/bin/julius.sh").read_text())
        return sha((m[1] if m else "") + (root / "assets/characters/julius/beskrivelse.txt").read_text())
    if generator == "rampenissen-tts.sh":
        return sha(RAMPE_STYLE)
    return None


LAERDOM = "assets/laerdom.json"
UNNGAA_MAKS = 8
# typeAv in src/app/nissemor-guide/media/filter.ts: the type a rule in Lærdom is filed under
_TYPER = (("video/julius/", "julius"), ("audio/rampenissen/", "radio"), ("video/tv/", "tv"), ("strek/", "strek"),
          ("portrett", "portrett"), ("spill/", "spill"), ("promo/", "promo"), ("feed/", "feed"), ("music/", "feed"))


def laerdom_type(out) -> str:
    """LAERDOM_TYPE, else the media type of an output path; "" when neither says."""
    if os.environ.get("LAERDOM_TYPE"):
        return os.environ["LAERDOM_TYPE"]
    p = "/" + str(out).replace(os.sep, "/")
    for pre, t in _TYPER:
        if ("/" + pre if pre.endswith("/") else pre) in p:
            return t
    return ""


def unngaa_regler(typ: str, root: Path = ROOT) -> list:
    """Hans' active rules for a type, newest first, at most UNNGAA_MAKS."""
    f = root / LAERDOM
    regler = json.loads(f.read_text()).get("regler", []) if f.exists() and typ else []
    # appended in order, so reversed = newest first within a date (sort is stable with reverse=True)
    aktive = [r["regel"] for r in sorted(reversed(regler), key=lambda r: r.get("dato", ""), reverse=True)
              if r.get("aktiv") and r.get("type") == typ]
    return aktive[:UNNGAA_MAKS]


def unngaa(typ: str, root: Path = ROOT) -> str:
    """The fixed block the generators append to a prompt; "" without rules, so prompts stay byte-identical."""
    r = unngaa_regler(typ, root)
    return "\n\nUnngå:\n" + "\n".join(f"- {x}" for x in r) if r else ""


def filter_version(root: Path = ROOT) -> str:
    m = re.search(r"^FILTER_VERSION=(\d+)", (root / "assets/bin/julius-filter.sh").read_text(), re.M)
    return m.group(1) if m else ""


def file_sha(path: str, root: Path = ROOT):
    p = located(path, root)
    return sha(p.read_bytes()) if p.exists() else None


def rel(p) -> str:
    p = Path(p).resolve()
    return str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p)


def write(generator, out, source, section, model, images=(), root: Path = ROOT, extra=None):
    """Write <out>.meta.json recording the inputs as they are now."""
    if source.startswith(RENDERED):  # record the template, so a changed description marks the file stale
        j = jobs(root)[source.removeprefix(RENDERED).removesuffix(".txt")]
        source, section = j["mal"], (f"Dag {j['dag']}" if "dag" in j else section)
    elif section is None and source.startswith("assets/prompts/"):
        # a per-day template ({{strek}}) passed as is: the job that writes <out> from it gives the day
        j = next((j for j in jobs(root).values() if j.get("mal") == source and "dag" in j
                  and str(out).endswith(j.get("ut") or "\0")), None)
        section = f"Dag {j['dag']}" if j else None
    text = source_text(source, section, root)
    if text is None:
        raise ValueError(f"kilden finnes ikke: {source} {section or ''}".strip())
    meta = {
        "generator": generator,
        "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": {"path": source, "section": section, "sha256": sha(text)},
        "reference_images": [{"path": i, "sha256": file_sha(i, root)} for i in images],
        "prompt_version": prompt_version(generator, root),
        "model": model,
        # the rules sent with the prompt: a separate field, never in prompt_version, so new rules mark nothing stale
        **({"unngaa": r} if (r := unngaa_regler(laerdom_type(out), root)) else {}),
        **(extra or {}),
    }
    Path(str(out) + ".meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")


def status(out: Path, key: str = "", root: Path = ROOT):
    """(status, reasons) for one output file. key is its media path, for OVERRIDES and versions."""
    j = next((j for j in jobs(root).values() if key and j.get("ut") == key), {}) \
        if (root / MEDIER).exists() else {}
    if not out.exists():
        return (VALGFRI if j.get("valgfri") else MISSING), []
    v = VERSION.search(key or out.name)
    if v:  # reasons still say how it differs from today's inputs
        return (ARKIV if v[1].startswith(".old") else KANDIDAT), _status(out, "", root)[1]
    if j.get("generator") == "hånd":  # hand-made: there are no inputs to compare, the file is the source
        return CURRENT, []
    st, why = _status(out, key, root)
    if st == UNKNOWN and (j.get("beholdt") or j.get("valgfri")):  # made before sidecars, checked and kept
        return CURRENT, ["beholdt (laget før sidefiler)"]
    return st, why


JULIUS_UTDATERT = 0.8  # below this word match a backfilled Julius video predates the script revision


def _words(text: str):
    return re.findall(r"\w+", text.lower())


def _bakfylt_julius(m: dict, root: Path):
    """A backfilled Julius video has no hash, but its lines can be compared: the sidecar's transcript, else
    the day's segments in the script as of `created` (git), against today's. None = cannot tell."""
    s = m.get("source") or {}
    day = re.fullmatch(r"Dag (\d+)", s.get("section") or "")
    if s.get("path") != JULIUS_MS or not day:
        return None
    try:
        now = _words(" ".join(x[0] for x in julius_segments(int(day[1]), root)))
    except OSError:
        return None
    old = _words(m["transkripsjon"]) if m.get("transkripsjon") else None
    if old is None:
        try:  # the script as of the commit before the video was made
            git = lambda *a: subprocess.run(["git", "-C", str(root), *a], capture_output=True, text=True, check=True).stdout
            rev = git("log", f"--before={m['created']}", "-1", "--format=%H", "--", JULIUS_MS).strip()
            old = _words(" ".join(x[0] for x in julius_segments(int(day[1]), root, text=git("show", f"{rev}:{JULIUS_MS}"))))
        except Exception:
            return None
    if not old or not now:
        return None
    from collections import Counter
    pct = sum((Counter(old) & Counter(now)).values()) / max(len(old), len(now))
    if pct < JULIUS_UTDATERT:
        return STALE, [f"laget før manusrevisjonen ({round(pct * 100)} % ordlikhet)"]
    return None


def _status(out: Path, key: str, root: Path):
    side = Path(str(out) + ".meta.json")
    if not side.exists():
        return (STALE, [OVERRIDES[key]]) if key in OVERRIDES else (UNKNOWN, [])
    m = json.loads(side.read_text())
    if m.get("bakfylt"):  # made before the inventory: no inputs recorded, so nothing to compare
        return _bakfylt_julius(m, root) or (UNKNOWN, [])
    s = m["source"]
    if "sha256" not in s:  # a backfilled sidecar records the source but not its hash
        return UNKNOWN, ["sidefil uten hash (bakfylt)"]
    why, gone = [], []
    text = source_text(s["path"], s["section"], root)
    if text is None:
        why.append(f"kilden finnes ikke lenger: {s['path']} {s['section'] or ''}".strip())
    elif sha(text) != s["sha256"]:
        why.append(f"kildeteksten er endret: {s['path']} {s['section'] or ''}".strip())
    for i in m["reference_images"]:
        now = file_sha(i["path"], root)
        if now is None:  # refs are gitignored: a fresh worktree has none, which is not a change
            gone.append(f"referansebildet finnes ikke her: {i['path']}")
        elif now != i["sha256"]:
            why.append(f"referansebildet er endret: {i['path']}")
    pv = prompt_version(m["generator"], root)
    if pv is not None and pv != LEGACY_PROMPT.get(m.get("prompt_version"), m.get("prompt_version")):
        why.append("promptversjonen er endret")
    return (STALE if why else UNKNOWN if gone else CURRENT), why + gone


MEDIA_DIRS = ("video", "audio", "music", "feed", "strek", "spill", "promo", "icons")

# Versions of one media file. The plain name (dag-01.mp4) is the file in use; a newer candidate is
# <name>-vN.<ext> (dag-01-v3.mp4); a replaced or rejected file is <name>.old-N.<ext> (dag-01.old-1.mp4).
# Nothing else: oversikt.ts (versionKey) groups exactly these on the media page.
VERSION = re.compile(r"(-v\d+|\.old-\d+)(\.\w+)$")


def plain(key: str) -> str:
    """The file in use that a -vN or .old-N version belongs to."""
    return VERSION.sub(r"\2", key)


def archive(path: Path) -> list:
    """Move the file in use to <name>.old-N.<ext> (next free N) with sidecar and poster jpg, before a
    generator overwrites it. Returns [(from, to)] so a failed run can undo it with unarchive."""
    if not path.exists():
        return []
    n = 1
    while any((path.parent / f"{path.stem}.old-{n}{e}").exists() for e in (path.suffix, ".jpg")):
        n += 1
    par = []
    for e in {path.suffix, ".jpg"} if path.suffix == ".mp4" else {path.suffix}:
        for side in ("", ".meta.json"):
            a = path.parent / f"{path.stem}{e}{side}"
            if a.exists():
                par.append((a, path.parent / f"{path.stem}.old-{n}{e}{side}"))
    if (seg := path.parent / f"{path.stem}.segmenter.json").exists():
        par.append((seg, path.parent / f"{path.stem}.old-{n}.segmenter.json"))
    for a, b in par:
        os.rename(a, b)
    return par


def unarchive(par: list):
    for a, b in par:
        if not a.exists():
            os.rename(b, a)


def bakfyll(media: Path, root: Path = ROOT):
    """Write a sidecar (bakfylt, no prompt hash) for each media file under media that has none."""
    table = {j["ut"]: j for j in jobs(root).values() if j.get("ut")}
    n = 0
    for d in MEDIA_DIRS:
        for f in sorted((media / d).rglob("*")):
            if not f.is_file() or f.name.startswith(".") or f.name.endswith((".meta.json", ".segmenter.json")) \
                    or Path(str(f) + ".meta.json").exists():
                continue
            key = str(f.relative_to(media))
            m = re.fullmatch(r"video/julius/dag-(\d+)(-v\d+)?\.mp4", key)
            extra = {}
            if f.suffix == ".jpg" and f.with_suffix(".mp4").exists():  # a poster frame cut from its video
                gen, src = "avledet (plakat)", {"path": key[:-4] + ".mp4"}
                extra = {"avledet_fra": key[:-4] + ".mp4"}
            elif m and m[2] == "-v2":
                gen, src = "julius-dag.py (før inventar)", {"path": "Omni Extend test 12.11"}
            elif m and not m[2]:
                gen, src = "julius-dag.py (før inventar)", {"path": JULIUS_MS, "section": f"Dag {int(m[1])}"}
            elif plain(key) in table:
                gen, src = table[plain(key)]["generator"], {"path": table[plain(key)].get("mal")}
            else:
                gen, src = "hånd/ukjent (før inventar)", {}
            created = datetime.fromtimestamp(f.stat().st_mtime, timezone.utc).isoformat(timespec="seconds")
            Path(str(f) + ".meta.json").write_text(json.dumps(
                {"generator": gen, "created": created, "source": src, "bakfylt": True, **extra},
                ensure_ascii=False, indent=2) + "\n")
            n += 1
    return n


MEDIER = "assets/medier.json"
RENDERED = "assets/out/prompts/"
PLACEHOLDER = re.compile(r"\{\{([\w/.-]+)\}\}")


def jobs(root: Path = ROOT) -> dict:
    return json.loads((root / MEDIER).read_text())


def entity_text(name: str, root: Path = ROOT) -> str:
    """{{stil}} = assets/stil.md, {{prompts/x/y}} = assets/prompts/x/y.txt, {{objects/x}} = assets/objects/x/
    beskrivelse.txt, {{winter}} = the one characters|locations|objects/winter/beskrivelse.txt;
    {{iq.KLÆR}} = its line «KLÆR: …» without the label."""
    a = root / "assets"
    if name == "stil":
        return (a / "stil.md").read_text().strip()
    if name.startswith("prompts/"):  # {{prompts/spill/piksel-stil}}: a block shared by several templates
        return (a / f"{name}.txt").read_text().strip()
    name, _, field = name.partition(".")
    if field:
        m = re.search(rf"^{re.escape(field)}: (.*)$", entity_text(name, root), re.M)
        if not m:  # {{winter.personlighet}}: a section of entitet.md
            ent = name if "/" in name else next((f"{k}/{name}" for k in ("characters", "locations", "objects")
                                                 if (root / "assets" / k / name).is_dir()), name)
            sec = {h.lower(): b for h, b in entity(ent, root).get("seksjoner", {}).items()}
            if field.lower() in sec:
                return sec[field.lower()]
        if not m:
            raise ValueError(f"{{{{{name}.{field}}}}}: ingen linje «{field}:»")
        return m[1].strip()
    hits = [a / name / "beskrivelse.txt"] if "/" in name else \
        [a / k / name / "beskrivelse.txt" for k in ("characters", "locations", "objects")]
    hits = [h for h in hits if h.exists()]
    if len(hits) != 1:
        raise ValueError(f"{{{{{name}}}}}: {'ingen' if not hits else 'flere'} beskrivelse.txt")
    return hits[0].read_text().strip()


def fill(text: str, root: Path = ROOT) -> str:
    return PLACEHOLDER.sub(lambda m: entity_text(m[1], root), text)


def image(spec: str, root: Path = ROOT) -> str:
    """'characters/winter#tophat' -> refs.tophat in its entitet.md, else ref-tophat.jpg; a plain path is kept."""
    if "#" not in spec:
        return spec
    ent, var = spec.split("#")
    refs = entity(ent, root).get("refs", {})
    return f"assets/{ent}/{refs.get(var, f'ref-{var}.jpg')}"


def render(job_id: str, root: Path = ROOT, table=None):
    """(prompt, image, refs) of one medier.json job, relative to root. A template with placeholders is
    written filled to assets/out/prompts/<id>.txt for the shell generators; write() maps it back."""
    table = table or jobs(root)
    j = table[job_id]
    prompt = j.get("mal")
    if prompt:
        text = (root / prompt).read_text()
        filled = fill_day(text, j.get("dag"), root)
        if filled != text:
            prompt = f"{RENDERED}{job_id}.txt"
            (root / prompt).parent.mkdir(parents=True, exist_ok=True)
            (root / prompt).write_text(filled)
    img = j.get("bilde")
    img = table[img]["ut"] if img in table else img and image(img, root)  # an intermediate still: its output
    return prompt, img, [image(r, root) for r in j.get("refs", [])]


def stills(job_id: str, root: Path = ROOT, table=None):
    """[(image, prompt, out)] intermediate stills a job's base image is made from, first one first."""
    table = table or jobs(root)
    out, b = [], table[job_id].get("bilde")
    while b in table:
        prompt, img, refs = render(b, root, table)  # refs (a character) are fine for the image model
        out.insert(0, (img, prompt, table[b]["ut"], *refs))
        b = table[b].get("bilde")
    return out


def missing_inputs(root: Path = ROOT, table=None):
    """(missing, skipped) inputs of every medier.json job: template, base image, refs, state loop.
    An absent image that git does not track (gitignored refs in CI) is skipped, not missing."""
    table = table or jobs(root)
    outs = {j["ut"] for j in table.values() if "ut" in j}
    missing, skipped = [], []
    for k, j in table.items():
        if j.get("generator") == "hånd":
            continue
        if j.get("tilstand") and f"tv/{j['tilstand']}" not in table:
            missing.append(f"{k}: tilstand {j['tilstand']}")
        try:
            prompt, img, refs = render(k, root, table)
        except (ValueError, KeyError, OSError) as e:
            missing.append(f"{k}: {e}")
            continue
        if prompt and not (root / prompt).exists():
            missing.append(f"{k}: {prompt}")
        for f in ([img] if img else []) + refs:
            if f in outs or (root / f).exists():
                continue
            tracked = subprocess.run(["git", "-C", str(root), "ls-files", "--error-unmatch", f],
                                     capture_output=True).returncode == 0
            (missing if tracked else skipped).append(f"{k}: {f}")
    return missing, skipped


def used_by(entity: str, root: Path = ROOT, table=None):
    """medier.json jobs that use an entity (winter, objects/postkasse …): as place, image, ref or in the template."""
    table = table or jobs(root)
    seg = f"/{entity.rsplit('/', 1)[-1]}"
    hits = []
    for k, j in table.items():
        paths = [j.get("bilde") or "", *j.get("refs", [])]
        text = (root / j["mal"]).read_text() if j.get("mal") and (root / j["mal"]).exists() else ""
        if j.get("sted") == entity or any(f"{seg}#" in p or f"{seg}/" in p for p in paths) \
                or re.search(rf"\{{\{{(\w+/)?{re.escape(entity.rsplit('/', 1)[-1])}[}}.]", text):
            hits.append(k)
    return hits


def anchor(a, root: Path = ROOT) -> str:
    """'anker': true -> "1" (anchor to the job's own image); a ref spec -> that image, absolute (e.g. a closed
    gate the clip of the open gate fades from and back to)."""
    return "" if not a else "1" if a is True else str(root / image(a, root))


def tv_lines(root: Path = ROOT):
    """One line per TV loop for tv-loops.sh: name|prompt|image|state|anchor|refs|first_only (absolute, refs space-separated)."""
    table = jobs(root)
    for k, j in table.items():
        if j["generator"] == "loop":
            prompt, img, refs = render(k, root, table)
            yield "|".join([k.split("/", 1)[1], str(root / prompt), str(root / img) if img else "",
                            j.get("tilstand", ""), anchor(j.get("anker"), root), " ".join(str(root / r) for r in refs),
                            "1" if j.get("bare_forste") else ""])


FIXTURE = "src/data/entiteter.json"
GUIDE = "CONTENT_GUIDE.md"
MARK = ("<!-- entiteter:start (mise run entiteter) -->", "<!-- entiteter:slutt -->")


def characters(root: Path = ROOT):
    return [entity(f"characters/{p.name}", root) for p in sorted((root / "assets/characters").iterdir())
            if (p / "entitet.md").exists()]


def entiteter(root: Path = ROOT):
    """(fixture JSON for entiteter.test.ts, CONTENT_GUIDE block), both from characters/*/entitet.md."""
    cs = characters(root)
    fx = [{k: c[k] for k in ("id", "navn", "pronomen", "fra_dag", "ikke")} for c in cs]
    lines = [MARK[0], "", "Generated from `assets/characters/<id>/entitet.md`, the one source for look, personality, "
             "voice, relations and facts. Edit there, then run `mise run entiteter`.", ""]
    for c in cs:
        sek = c["seksjoner"]
        voice = sek["Stemme"].split("\n\nTTS:")[0]; voice = " ".join(voice.split())
        lines += [f"#### {c['navn'][0]} (`assets/characters/{c['id']}/entitet.md`)", "",
                  f"- **Navn:** {', '.join(c['navn'])}; **pronomen:** {c['pronomen']}; **fra dag:** {c['fra_dag']}",
                  f"- **Personlighet:** {sek['Personlighet']}",
                  f"- **Stemme:** {voice}",
                  f"- **Forhold:** {'; '.join(f'{k}: {v}' for k, v in c['forhold'].items())}",
                  f"- **Aldri:** {', '.join(f'«{x}»' for x in c['ikke'])}".rstrip(), ""]  # no trailing space when the list is empty
    return json.dumps(fx, ensure_ascii=False, indent=2) + "\n", "\n".join(lines + [MARK[1]])


def write_entiteter(root: Path = ROOT, check=False) -> bool:
    """Write the fixture and the CONTENT_GUIDE block; with check, only report whether they are current."""
    fx, blk = entiteter(root)
    g = (root / GUIDE).read_text()
    i, j = g.index(MARK[0]), g.index(MARK[1]) + len(MARK[1])
    new_g = g[:i] + blk + g[j:]
    f = root / FIXTURE
    ok = f.exists() and json.loads(f.read_text()) == json.loads(fx) and new_g == g  # prettier may reflow the JSON
    if not check:
        f.write_text(fx)
        (root / GUIDE).write_text(new_g)
    return ok


def test_radio_avled():
    """An approved, current clip approves its script once; a rejected or stale one does not."""
    with __import__("tempfile").TemporaryDirectory() as t:
        d = Path(t)
        (d / "audio/rampenissen").mkdir(parents=True)
        el = {}
        for day, v in ((5, "godkjent"), (6, "lag_paa_nytt"), (7, "ok")):
            fil = f"audio/rampenissen/dag-{day:02d}.mp3"
            (d / fil).write_bytes(b"lyd%d" % day)
            write("rampenissen-tts.sh", d / fil, RAMPE_MS, f"Dag {day}", "m")
            el[fil] = {"vurderinger": [{"vurdering": v, "hash": sha(b"lyd%d" % day)[:12], "fil": fil}], "historikk": []}
        (d / "audio/rampenissen/dag-07.mp3").write_bytes(b"annen")  # the approved take was replaced
        skriv_lager(vurdering_fil(d), {"format": 2, "sesong": 2026, "elementer": el})
        assert radio_avled(d) == [radio_id(5)] and radio_avled(d) == []
        v = vurderinger(vurdering_fil(d))[radio_id(5)]
        assert v["kilde"] == "avledet fra godkjent lydklipp" and godkjent(vurderinger(vurdering_fil(d)), radio_id(5), radio_manus()["5"]["hash"])


def selftest():
    test_radio_avled()
    with __import__("tempfile").TemporaryDirectory() as t:
        d = Path(t)
        for n in ("a.mp4", "a.mp4.meta.json", "a.jpg", "a.old-1.mp4"):
            (d / n).write_text(n)
        par = archive(d / "a.mp4")
        assert not (d / "a.mp4").exists() and (d / "a.old-2.mp4").read_text() == "a.mp4"
        assert (d / "a.old-2.mp4.meta.json").exists() and (d / "a.old-2.jpg").exists()
        unarchive(par)
        assert (d / "a.mp4").exists() and (d / "a.jpg").exists() and not (d / "a.old-2.mp4").exists()
        assert archive(d / "missing.mp4") == []
        # format 2 store: redo cleared to historikk, renames keep the hash
        vf = d / "media-vurdering.json"
        skriv_lager(vf, {"format": 2, "sesong": 2026, "elementer": {"a.mp4": {"historikk": [], "vurderinger": [
            {"hash": "h1", "fil": "a-v2.mp4", "vurdering": "godkjent"},
            {"hash": "h0", "fil": "a.mp4", "vurdering": "lag_paa_nytt", "notat": "munn"}]}}})
        fjern_vurdering(vf, "a.mp4")
        flytt_vurderinger(vf, {"a.mp4": "a.old-1.mp4", "a-v2.mp4": "a.mp4"})
        assert vurderinger(vf) == {"a.mp4": {"vurdering": "godkjent"}, "a.old-1.mp4": {"notat": "munn"}}
        assert len(les_lager(vf)["elementer"]["a.mp4"]["historikk"]) == 1
    import tempfile
    with tempfile.TemporaryDirectory() as d:
        r = Path(d)
        (r / JULIUS_MS).parent.mkdir(parents=True, exist_ok=True)
        (r / JULIUS_MS).write_text("## Dag 3 (x)\n1. **Replikk:** «Hei.»\n   - Varighet: 13 s (2 ord)\n   - Handling: Vinker.\n"
                                   "   - Kulde: Svak knitring.\n2. **Replikk:** «Han sa «hei» til meg.»\n   - Varighet: 9 s\n3. **Replikk:** «Brikke her.» (låst)\n   - Varighet: 15 s\n"
                                   "   - Kulde: Fargene renner ut.\n## Dag 4 (y)\n")
        assert julius_segments(3, r) == [("Hei.", 13, "Vinker.", "Svak knitring.", False),
                                         ("Han sa «hei» til meg.", 9, "", "", False),
                                         ("Brikke her.", 15, "", "Fargene renner ut.", True)], julius_segments(3, r)
        assert julius_segments(4, r) == []
        for f, t in {"assets/stil.md": "STIL\n",
                     "assets/characters/winter/beskrivelse.txt": "KARAKTER: lang mann\nKLÆR: hatt \n",
                     "assets/characters/winter/entitet.md":
                         '# W\n```json\n{"refs": {"tophat": "ref-v1-tophat.jpg"}}\n```\n## Personlighet\nordentlig\n',
                     "assets/objects/postkasse/beskrivelse.txt": "rød kasse",
                     "assets/locations/torg/beskrivelse.txt": "torg",
                     "assets/locations/winter/beskrivelse.txt": "dobbel",
                     "p/a.txt": "{{characters/winter.KARAKTER}} ved {{objects/postkasse}}, {{characters/winter.KLÆR}}. {{stil}}",
                     "p/b.txt": "uten plassholdere", "p/c.txt": "{{torg}}", "p/d.txt": "{{winter}}",
                     "assets/prompts/x/felles.txt": "FELLES\n", "p/f.txt": "{{prompts/x/felles}} her"}.items():
            (r / f).parent.mkdir(parents=True, exist_ok=True)
            (r / f).write_text(t)
        t = {"a": {"mal": "p/a.txt", "bilde": "locations/torg#rolig",
                   "refs": ["characters/winter#tophat", "assets/x.jpg"]},
             "b": {"mal": "p/b.txt"}, "c": {"mal": "p/c.txt"}, "d": {"mal": "p/d.txt"}}
        prompt, img, refs = render("a", r, t)
        assert prompt == "assets/out/prompts/a.txt"
        assert (r / prompt).read_text() == "lang mann ved rød kasse, hatt. STIL", (r / prompt).read_text()
        assert img == "assets/locations/torg/ref-rolig.jpg"
        assert refs == ["assets/characters/winter/ref-v1-tophat.jpg", "assets/x.jpg"]
        assert render("b", r, t) == ("p/b.txt", None, [])  # unchanged text keeps the tracked path
        assert (r / render("c", r, t)[0]).read_text() == "torg"  # bare name, one hit
        assert fill("{{characters/winter.personlighet}}", r) == "ordentlig"  # a section of entitet.md
        assert fill((r / "p/f.txt").read_text(), r) == "FELLES her"  # a shared prompt block
        t |= {"s1": {"ut": "o/s1.jpg", "bilde": "assets/base.jpg", "mal": "p/b.txt"},
              "s2": {"ut": "o/s2.jpg", "bilde": "s1", "mal": "p/b.txt"}, "e": {"bilde": "s2", "mal": "p/b.txt"}}
        assert render("e", r, t)[1] == "o/s2.jpg"  # base image is an intermediate still
        assert used_by("winter", r, t) == ["a", "d"] and used_by("objects/postkasse", r, t) == ["a"]
        assert used_by("torg", r, t) == ["a", "c"]  # image locations/torg#rolig, template {{torg}}
        assert stills("e", r, t) == [("assets/base.jpg", "p/b.txt", "o/s1.jpg"), ("o/s1.jpg", "p/b.txt", "o/s2.jpg")]
        # sidecars: a file made from the rendered prompt records the template; the description drives its status
        (r / MEDIER).write_text(json.dumps(t))
        (r / "ut.jpg").write_text("x")
        write("still.sh", r / "ut.jpg", prompt, None, "m", root=r)
        assert json.loads((r / "ut.jpg.meta.json").read_text())["source"]["path"] == "p/a.txt"
        assert status(r / "ut.jpg", root=r)[0] == CURRENT
        (r / "p/a.txt").write_text("{{characters/winter.KARAKTER}} ved rød kasse, {{characters/winter.KLÆR}}. STIL")
        assert status(r / "ut.jpg", root=r)[0] == CURRENT  # same rendered text, still current
        # moves: the sidecar keeps the old path, flyttet.json finds the new one
        (r / FLYTTET).write_text(json.dumps({"p/a.txt": "q/a.txt", "assets/gml.jpg": "assets/ny.jpg"}))
        flytt(r)
        flytt(r)  # idempotent
        assert (r / "q/a.txt").exists() and not (r / "p/a.txt").exists()
        assert status(r / "ut.jpg", root=r)[0] == CURRENT
        (r / "assets/ny.jpg").write_text("x")
        assert located("/en/annen/sjekkut/assets/gml.jpg", r) == r / "assets/ny.jpg"
        (r / "p/a.txt").parent.mkdir(exist_ok=True)
        (r / "q/a.txt").rename(r / "p/a.txt")
        (r / "assets/characters/winter/beskrivelse.txt").write_text("KARAKTER: kort mann\nKLÆR: hatt\n")
        assert status(r / "ut.jpg", root=r)[0] == STALE
        for bad in (lambda: render("d", r, t), lambda: fill("{{ukjent}}", r),  # ambiguous, unknown
                    lambda: fill("{{winter.SKO}}", r)):  # missing field
            try:
                bad()
                raise AssertionError("plassholderen ble godtatt")
            except ValueError:
                pass
        mi = missing_inputs(r, {"m": {"mal": "p/borte.txt", "tilstand": "nei"},
                                "n": {"mal": "p/b.txt", "bilde": "assets/x.jpg"}})
        assert mi[0][0] == "m: tilstand nei" and "borte.txt" in mi[0][1] and len(mi[0]) == 2, mi
        assert mi[1] == ["n: assets/x.jpg"], mi  # untracked image: skipped
    with tempfile.TemporaryDirectory() as d:
        r = Path(d)
        (r / MEDIER).parent.mkdir(parents=True)
        (r / MEDIER).write_text("{}")
        (r / "public/video/julius").mkdir(parents=True)
        (r / "public/video/julius/dag-07.mp4").write_text("x")
        assert bakfyll(r / "public", r) == 1 and bakfyll(r / "public", r) == 0
        side = json.loads((r / "public/video/julius/dag-07.mp4.meta.json").read_text())
        assert side["source"]["section"] == "Dag 7" and side["bakfylt"]
        assert status(r / "public/video/julius/dag-07.mp4", root=r)[0] == UNKNOWN  # no script at all: cannot tell
        # backfilled Julius video: compare the script as of `created` with today's
        (r / JULIUS_MS).parent.mkdir(parents=True, exist_ok=True)
        ms = lambda t: f"## Dag 7 (x)\n\n1. **Replikk:** «{t}»\n   - Varighet: 5 s\n"
        git = lambda *a: subprocess.run(["git", "-c", "commit.gpgsign=false", "-c", "user.name=t", "-c", "user.email=t@t", "-C", str(r), *a],
                                        check=True, capture_output=True)
        git("init"); (r / JULIUS_MS).write_text(ms("god morgen snøfall her er dagens beskjed fra julius")); git("add", "."); git("commit", "-m", "a")
        side7 = r / "public/video/julius/dag-07.mp4.meta.json"
        side7.write_text(json.dumps(json.loads(side7.read_text()) | {"created": "2999-01-01T00:00:00+00:00"}))
        (r / JULIUS_MS).write_text(ms("helt andre ord om kaker og reinsdyr i dag"))
        st, why = status(r / "public/video/julius/dag-07.mp4", root=r)
        assert st == STALE and why == ["laget før manusrevisjonen (0 % ordlikhet)"], (st, why)
        (r / JULIUS_MS).write_text(ms("god morgen snøfall her er dagens beskjed fra julius og"))
        assert status(r / "public/video/julius/dag-07.mp4", root=r)[0] == UNKNOWN  # 90 % match
        for f in ("video/julius/dag-07.jpg", "feed/x.png", "icons/a.svg"):
            (r / "public" / f).parent.mkdir(parents=True, exist_ok=True)
            (r / "public" / f).write_text("x")
        assert bakfyll(r / "public", r) == 3
        poster = json.loads((r / "public/video/julius/dag-07.jpg.meta.json").read_text())
        assert poster["avledet_fra"] == "video/julius/dag-07.mp4"
        assert json.loads((r / "public/icons/a.svg.meta.json").read_text())["generator"].startswith("hånd")
        assert plain("video/julius/dag-01-v3.mp4") == plain("promo/a.old-2.mp4".replace("promo/a", "video/julius/dag-01")) \
            == "video/julius/dag-01.mp4"
        assert plain("strek/dag01.v-feil.png") == "strek/dag01.v-feil.png"  # not the convention
        # a per-day template passed as is ({{strek}}): the job writing that file gives the day
        (r / RAMPE_MS).parent.mkdir(parents=True, exist_ok=True)
        (r / RAMPE_MS).write_text("## Dag 2 (x)\n**Strek:** Sokker på lampa.\n## Dag 3 (y)\n")
        (r / "assets/prompts/strek").mkdir(parents=True)
        (r / "assets/prompts/strek/skisse.txt").write_text("Scene: {{strek}}")
        (r / MEDIER).write_text(json.dumps({"strek/dag02": {"mal": "assets/prompts/strek/skisse.txt", "dag": 2,
                                                             "ut": "strek/dag02.png"}}))
        (r / "public/strek").mkdir(parents=True)
        (r / "public/strek/dag02.png").write_text("x")
        write("still.sh", r / "public/strek/dag02.png", "assets/prompts/strek/skisse.txt", None, "m", root=r)
        assert json.loads((r / "public/strek/dag02.png.meta.json").read_text())["source"]["section"] == "Dag 2"
        assert status(r / "public/strek/dag02.png", root=r)[0] == CURRENT
        # false alarms: a changed TTS style or a missing (gitignored) ref does not make an image stale
        sp = r / "public/strek/dag02.png.meta.json"
        m = json.loads(sp.read_text())
        sp.write_text(json.dumps(m | {"prompt_version": "gammel", "reference_images": [{"path": "assets/borte.jpg", "sha256": "a"}]}))
        assert status(r / "public/strek/dag02.png", root=r)[0] == UNKNOWN  # ref not here: can't tell
        (r / "assets/borte.jpg").write_text("ny")
        assert status(r / "public/strek/dag02.png", root=r)[0] == STALE  # ref really changed
        # versions are history: a candidate and a replaced file are never stale, whatever changed
        for v, want in (("dag02-v3.png", KANDIDAT), ("dag02.old-1.png", ARKIV)):
            (r / "public/strek" / v).write_text("x")
            (r / "public/strek" / (v + ".meta.json")).write_text(sp.read_text())
            st, why = status(r / "public/strek" / v, f"strek/{v}", r)
            assert st == want and why, (st, why)
        (r / "assets/borte.jpg").unlink()
        (r / RAMPE_MS).write_text("## Dag 2 (x)\n**Strek:** Noe annet.\n## Dag 3 (y)\n")
        assert status(r / "public/strek/dag02.png", root=r)[0] == STALE  # the filled {{strek}} changed
        # Julius: only the prompt text in julius.sh counts; an old full-script hash maps through LEGACY_PROMPT
        (r / "assets/bin").mkdir(parents=True, exist_ok=True)
        js = r / "assets/bin/julius.sh"
        (r / "assets/characters/julius").mkdir(parents=True)
        (r / "assets/characters/julius/beskrivelse.txt").write_text("B")
        js.write_text('# Usage: a\nP="Si \\"$LINE\\" nå."\njq x\ncurl y\n')
        pv = prompt_version("julius-dag.py", r)
        js.write_text('# Usage: b [REF]\nP="Si \\"$LINE\\" nå."\nif true; then jq z; fi\ncurl y\n')
        assert prompt_version("julius-dag.py", r) == pv  # comment and plumbing changed
        js.write_text('P="Si \\"$LINE\\" i morgen."\ncurl y\n')
        assert prompt_version("julius-dag.py", r) != pv
        assert prompt_version("still.sh", r) is None and prompt_version("tv-loops.sh", r) is None
        # Lærdom: active rules per type, newest first, capped; recorded beside prompt_version, never in it
        assert unngaa("tv", r) == ""
        regler = [{"type": "tv", "regel": f"unngå: {i}", "dato": f"2026-11-{10 + i % 3}", "aktiv": True} for i in range(10)]
        (r / LAERDOM).write_text(json.dumps({"regler": regler + [{"type": "tv", "regel": "av", "dato": "2026-12-01", "aktiv": False},
                                                                  {"type": "strek", "regel": "s", "dato": "2026-12-01", "aktiv": True}]}))
        assert unngaa_regler("tv", r) == ["unngå: 8", "unngå: 5", "unngå: 2", "unngå: 7", "unngå: 4", "unngå: 1", "unngå: 9", "unngå: 6"]
        assert unngaa("strek", r) == "\n\nUnngå:\n- s"
        assert laerdom_type("/x/public/strek/dag02.png") == "strek" and laerdom_type("/m/video/tv/a.mp4") == "tv"
        write("still.sh", r / "public/strek/dag02.png", "assets/prompts/strek/skisse.txt", None, "m", root=r)
        side = json.loads((r / "public/strek/dag02.png.meta.json").read_text())
        assert side["unngaa"] == ["s"] and side["prompt_version"] is None, side
        (r / LAERDOM).write_text(json.dumps({"regler": []}))
        assert status(r / "public/strek/dag02.png", root=r)[0] == CURRENT  # a changed rule set marks nothing stale
    missing, skipped = missing_inputs()  # the real medier.json
    assert not missing, missing
    print(f"selvtest ok (inndata: {len(skipped)} bilder utenfor git hoppet over)")


def refresh_inventar(media=None):
    """Keep media-inventar.json in step with the sidecars; never fails a generator."""
    try:
        import inventar
        inventar.refresh(Path(media or os.environ.get("MEDIA_DIR") or ROOT / "public"))
    except Exception as e:
        print(f"medieinventar ikke oppdatert: {e}", file=sys.stderr)


def rydd_kandidater(media: Path) -> list:
    """One-time: for families promoted before ta-i-bruk archived older candidates
    (media-promoteringer.log), move every -vK with K <= the promoted N to .old-M,
    with poster, sidecars, verdict and inventory row, and stamp fra_versjon."""
    log = media / "media-promoteringer.log"
    fra = {}
    for line in (log.read_text().splitlines() if log.exists() else []):
        m = re.match(r"\S+ (\S+)-v(\d+)(\.\w+) -> ", line)
        if m:
            key = m[1] + m[3]
            fra[key] = max(fra.get(key, 0), int(m[2]))
    flyttet = []
    for key, n in fra.items():
        stem, ext = key.rsplit(".", 1)
        folder = (media / key).parent
        base = Path(stem).name
        names = [f.name for f in folder.iterdir()]
        old = max([0] + [int(x[1]) for f in names if (x := re.match(rf"{re.escape(base)}\.old-(\d+)\.", f))])
        ks = sorted(int(x[1]) for f in names if (x := re.fullmatch(rf"{re.escape(base)}-v(\d+)\.{ext}", f)) and int(x[1]) <= n)
        exts = [ext, "jpg"] if ext == "mp4" else [ext]
        par = []
        for i, k in enumerate(ks):
            for e in exts:
                for side in ("", ".meta.json"):
                    a, b = f"{stem}-v{k}.{e}{side}", f"{stem}.old-{old + 1 + i}.{e}{side}"
                    if (media / a).exists():
                        if (media / b).exists():
                            sys.exit(f"{b} finnes fra før")
                        par.append((a, b))
        done = []
        try:
            for a, b in par:
                os.rename(media / a, media / b)
                done.append((a, b))
        except Exception:
            for a, b in reversed(done):
                os.rename(media / b, media / a)
            raise
        sidecar = media / f"{key}.meta.json"
        try:
            meta = json.loads(sidecar.read_text()) if sidecar.exists() else {}
            sidecar.write_text(json.dumps({**meta, "fra_versjon": n}, ensure_ascii=False, indent=2) + "\n")
        except ValueError:
            pass
        ny = dict(par)
        if par and vurdering_fil(media).exists():
            flytt_vurderinger(vurdering_fil(media), ny)
        p = media / "media-inventar.json"
        if par and p.exists():
            data = json.loads(p.read_text())
            data = [{**r, "path": ny[r["path"]], "status": "arkiv"} if r.get("path") in ny else r for r in data]
            p.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n")
        moved = [f"{a} -> {b}" for a, b in par if a.endswith("." + ext)]
        if moved:
            with log.open("a") as f:
                f.write(f"{datetime.now(timezone.utc).isoformat()} rydd-kandidater {'; '.join(moved)}\n")
        flyttet += par
    return flyttet


def main(argv):
    if not argv:
        print(__doc__)
        sys.exit(2)
    cmd, args = argv[0], argv[1:]
    if cmd == "tekst":
        print(rampenissen_text(int(args[1])))
    elif cmd == "stil":
        print(RAMPE_STYLE)
    elif cmd == "skriv":
        gen, out, src, section, model, *images = args
        write(gen, out, rel(src), None if section == "-" else section, model, [rel(i) for i in images])
        refresh_inventar()
    elif cmd == "render":
        prompt, img, refs = render(args[0])
        print(*(str(ROOT / p) for p in (prompt, img, *refs) if p), sep="\n")
    elif cmd == "brukt-av":
        print(*used_by(args[0]), sep="\n")
    elif cmd == "flytt":
        flytt()
    elif cmd == "bakfyll":
        media = Path(args[0] if args else os.environ.get("MEDIA_DIR", ROOT / "public"))
        print(bakfyll(media), "sidecars skrevet")
        refresh_inventar(media)
    elif cmd == "tv":
        for line in tv_lines():
            print(line)
    elif cmd == "stiller":
        # print(*[], sep="\n") would emit one empty line, which tv-loops.sh read as a still with no inputs
        for s in stills(args[0]):
            print("|".join([*(str(ROOT / p) for p in s[:3]), " ".join(str(ROOT / p) for p in s[3:])]))
    elif cmd == "inndata":
        missing, skipped = missing_inputs()
        for m in skipped:
            print(f"hoppet over (ikke i git): {m}")
        for m in missing:
            print(f"mangler: {m}")
        sys.exit(1 if missing else 0)
    elif cmd == "entiteter":
        ok = write_entiteter(check="--sjekk" in args)
        if "--sjekk" in args and not ok:
            sys.exit(f"{FIXTURE} eller blokken i {GUIDE} er utdatert: kjør mise run entiteter")
    elif cmd == "rydd-kandidater":  # [mediemappe]: archive candidates older than a promoted file
        media = Path(args[0] if args else os.environ.get("MEDIA_DIR", ROOT / "public"))
        for a, b in rydd_kandidater(media):
            print(f"{a} -> {b}")
    elif cmd == "arkiver":  # <fil>: file in use -> .old-N, for scripts run outside generer.py
        archive(Path(args[0]))
    elif cmd == "angre":  # <fil>: undo the newest arkiver when the run left no new file
        f = Path(args[0])
        old = sorted(f.parent.glob(f"{f.stem}.old-*{f.suffix}"), key=lambda q: int(q.name.split(".old-")[1].split(".")[0]))
        if old:
            unarchive([(f.parent / (f.name + side), old[-1].parent / (old[-1].name + side)) for side in ("", ".meta.json")
                       if (old[-1].parent / (old[-1].name + side)).exists()])
    elif cmd == "unngaa":
        print(unngaa(args[0] if args and args[0] else laerdom_type(args[1] if len(args) > 1 else "")), end="")
    elif cmd == "--selvtest":
        selftest()
    elif cmd == "radio-manus":
        tekst = json.dumps(radio_manus(), ensure_ascii=False, indent=1) + "\n"
        if "--sjekk" in args:
            sys.exit(0 if (ROOT / RADIO_MANUS).exists() and (ROOT / RADIO_MANUS).read_text() == tekst
                     else f"{RADIO_MANUS} er utdatert: python3 assets/bin/medie.py radio-manus")
        (ROOT / RADIO_MANUS).write_text(tekst)
    elif cmd == "radio-port":
        d = int(args[0])
        m = radio_manus().get(str(d))
        if not m:
            sys.exit(f"Fant ikke klipp for dag {d}")
        if not godkjent(vurderinger(), radio_id(d), m["hash"]):
            sys.exit(f"Stoppet: radiomanus ikke godkjent for dag {d} ({radio_id(d)}, hash {m['hash']}).\n"
                     f"Godkjenn i guiden: /nissemor-guide/gjennomgang?id={radio_id(d)}")
    elif cmd == "radio-avled":
        media = Path(args[0] if args else os.environ.get("MEDIA_DIR", ROOT / "public"))
        print(*radio_avled(media) or ["ingen nye"], sep="\n")
    elif cmd == "statusjson":  # <mediemappe> <nøkkel>: one inventory row's status, for ta-i-bruk
        try:
            st, why = status(Path(args[0]) / args[1], args[1])
        except Exception as e:
            st, why = UNKNOWN, [f"status kunne ikke beregnes: {e}"]
        print(json.dumps({"status": st, "reasons": why}, ensure_ascii=False))
    elif cmd == "status":
        out = Path(args[0]).resolve()
        key = rel(out).removeprefix("public/")
        st, why = status(out, key)
        print(st, *why, sep="\n  ")
        sys.exit(0 if st == CURRENT else 1)
    else:
        sys.exit(__doc__)


if __name__ == "__main__":
    main(sys.argv[1:])
