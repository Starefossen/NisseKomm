#!/usr/bin/env python3
"""Provenance for generated media: what a file was made from, and whether that still holds.

Each generator writes <file>.meta.json next to its output. The status check
recomputes the same inputs from today's sources and compares.

CLI (for the shell generators):
  medie.py tekst rampenissen <dag>        the clip text, as the generator reads it
  medie.py stil rampenissen               the TTS style line
  medie.py skriv <generator> <fil> <kilde> <seksjon|-> <modell> [bilde ...]
  medie.py status <fil>                   prints the status; exit 0 only if ✓ current
"""
import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BIN = ROOT / "assets" / "bin"
JULIUS_MS = "docs/manus/julius-2026.md"
RAMPE_MS = "docs/manus/rampenissen-radio-2026.md"
RAMPE_STYLE = ("Say cheerfully in a sweet, silly, breathless voice with a clear Northern Norwegian (Tromsø) "
               "singsong accent and short giggles:")

CURRENT, STALE, UNKNOWN, MISSING = "current", "stale", "unknown", "missing"

# Files made before sidecars whose source is known to be wrong. Only used while the file has no sidecar.
OVERRIDES = {
    f"audio/rampenissen/dag-{d:02d}.mp3": "instruksjonen ble lest opp (laget før sidefiler)" for d in range(1, 5)
}


def sha(data) -> str:
    return hashlib.sha256(data if isinstance(data, bytes) else data.encode()).hexdigest()


def julius_segments(day: int, root: Path = ROOT):
    """[(line, secs, action, kulde)] for one day of the Julius script; [] if the day is missing."""
    text = (root / JULIUS_MS).read_text()
    block = re.search(rf"^## Dag {day} \(.*?(?=^## Dag |\Z)", text, re.S | re.M)
    if not block:
        return []
    return [
        (line.strip(), int(secs), action.strip(), kulde.strip())
        for line, secs, action, kulde in re.findall(
            r"\*\*Replikk:\*\* «(.+?)»\s*\n\s*- Varighet: (\d+) s.*?\n\s*- Handling: (.+?)\n\s*- Kulde: (.+?)\n",
            block.group(0),
            re.S,
        )
    ]


def rampenissen_text(day: int, root: Path = ROOT) -> str:
    """The **Klipp:** lines of one day, same as the old awk/grep/sed pipeline."""
    out, on = [], False
    for line in (root / RAMPE_MS).read_text().splitlines():
        if line.startswith(f"## Dag {day} "):
            on = True
        elif line.startswith(f"## Dag {day + 1} "):
            on = False
        if on and line.startswith("**Klipp:** «"):
            out.append(re.sub(r"»$", "", line[len("**Klipp:** «"):]))
    return "\n".join(out)


def source_text(path: str, section, root: Path = ROOT):
    """The exact text a generator used from <path> (a day section, or the whole file); None if gone."""
    p = root / path
    if not p.exists():
        return None
    if section is None:
        return p.read_text()
    day = int(section.split()[-1])
    if path == JULIUS_MS:
        segs = julius_segments(day, root)
        return json.dumps(segs, ensure_ascii=False) if segs else None
    if path == RAMPE_MS:
        return rampenissen_text(day, root) or None
    raise ValueError(f"ukjent seksjonert kilde: {path}")


def prompt_version(generator: str, root: Path = ROOT) -> str:
    """Hash of everything that shapes the prompt besides the source text."""
    parts = {
        "julius-dag.py": ["assets/bin/julius.sh", "assets/characters/julius/beskrivelse.txt"],
        "tv-loops.sh": ["assets/bin/loop.sh", "assets/bin/anchor.sh"],
    }.get(generator)
    if parts is None:
        return sha(RAMPE_STYLE)
    # julius.sh: only the prompt part, above the API call; the post-filter lives in julius-filter.sh
    return sha("".join(((root / p).read_text().split("\ncurl ")[0]) if (root / p).exists() else "" for p in parts))


def filter_version(root: Path = ROOT) -> str:
    m = re.search(r"^FILTER_VERSION=(\d+)", (root / "assets/bin/julius-filter.sh").read_text(), re.M)
    return m.group(1) if m else ""


def file_sha(path: str, root: Path = ROOT):
    p = root / path
    return sha(p.read_bytes()) if p.exists() else None


def rel(p) -> str:
    p = Path(p).resolve()
    return str(p.relative_to(ROOT)) if p.is_relative_to(ROOT) else str(p)


def write(generator, out, source, section, model, images=(), root: Path = ROOT, extra=None):
    """Write <out>.meta.json recording the inputs as they are now."""
    meta = {
        "generator": generator,
        "created": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": {"path": source, "section": section, "sha256": sha(source_text(source, section, root) or "")},
        "reference_images": [{"path": i, "sha256": file_sha(i, root)} for i in images],
        "prompt_version": prompt_version(generator, root),
        "model": model,
        **(extra or {}),
    }
    Path(str(out) + ".meta.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2) + "\n")


def status(out: Path, key: str = "", root: Path = ROOT):
    """(status, reasons) for one output file. key is its media path, for OVERRIDES."""
    if not out.exists():
        return MISSING, []
    side = Path(str(out) + ".meta.json")
    if not side.exists():
        return (STALE, [OVERRIDES[key]]) if key in OVERRIDES else (UNKNOWN, [])
    m = json.loads(side.read_text())
    s = m["source"]
    why = []
    text = source_text(s["path"], s["section"], root)
    if text is None:
        why.append(f"kilden finnes ikke lenger: {s['path']} {s['section'] or ''}".strip())
    elif sha(text) != s["sha256"]:
        why.append(f"kildeteksten er endret: {s['path']} {s['section'] or ''}".strip())
    why += [f"referansebildet er endret: {i['path']}" for i in m["reference_images"]
            if file_sha(i["path"], root) != i["sha256"]]
    if prompt_version(m["generator"], root) != m["prompt_version"]:
        why.append("promptversjonen er endret")
    return (STALE if why else CURRENT), why


def main(argv):
    cmd, args = argv[0], argv[1:]
    if cmd == "tekst":
        print(rampenissen_text(int(args[1])))
    elif cmd == "stil":
        print(RAMPE_STYLE)
    elif cmd == "skriv":
        gen, out, src, section, model, *images = args
        write(gen, out, rel(src), None if section == "-" else section, model, [rel(i) for i in images])
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
