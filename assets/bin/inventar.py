#!/usr/bin/env python3
"""Media inventory: which files are current, out of date, unknown, missing or old.

Usage: inventar.py [--media DIR] [--json]

Scans <media>/{video,audio,music,feed} (default public/, or MEDIA_DIR) and the
manifest in src/lib/media.ts, checks each file's sidecar with medie.status, and
writes assets/INVENTAR.md plus <media>/media-inventar.json (read by the parent
guide). --json prints the JSON to stdout instead of writing the files.
"""
import json
import os
import re
import sys
from collections import Counter
from datetime import date
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
import medie  # noqa: E402

ROOT = medie.ROOT
DIRS = ("video", "audio", "music", "feed", "strek")
KINDS = [("video/julius/", "julius"), ("audio/rampenissen/", "rampenissen"),
         ("video/tv/port-", "port"), ("video/tv/", "tv"),
         ("feed/", "feed"), ("music/", "music"), ("strek/", "strek")]
MARK = {medie.CURRENT: "✓", medie.STALE: "⚠", medie.UNKNOWN: "?", medie.MISSING: "✗"}


def manifest(root: Path = ROOT):
    """Paths in MEDIA_MANIFEST and the MUSIC playlist; the two 24-day series are generated in TS."""
    src = (root / "src/lib/media.ts").read_text()
    paths = re.findall(r'"((?:video|audio|feed|music)/[^"]+\.\w+)"', src)
    days = [f"video/julius/dag-{d:02d}.mp4" for d in range(1, 25)]
    days += [f"audio/rampenissen/dag-{d:02d}.mp3" for d in range(1, 25)]
    ports = [f"video/tv/port-{c}.mp4" for c in ("julius", "hjerterud", "iq", "winter")]
    strek = [j["ut"] for k, j in (medie.jobs(root) if (root / medie.MEDIER).exists() else {}).items()
             if k.startswith("strek/")]
    return list(dict.fromkeys(days + paths + ports + strek))


def kind(path: str) -> str:
    return next((k for prefix, k in KINDS if path.startswith(prefix)), "annet")


def scan(media: Path, root: Path = ROOT):
    present = []
    for d in DIRS:
        for p in sorted((media / d).rglob("*")) if (media / d).is_dir() else []:
            if not p.is_file() or p.name.endswith(".meta.json") or p.name.startswith("."):
                continue
            if p.suffix == ".jpg" and p.with_suffix(".mp4").exists():
                continue  # poster frame written next to a video
            present.append(str(p.relative_to(media)))
    wanted = manifest(root)
    rows = []
    for path in list(dict.fromkeys(wanted + present)):
        f = media / path
        st, why = medie.status(f, path, root)
        if path not in wanted:
            why = why + ["ikke i manifestet"]
        stat = f.stat() if f.exists() else None
        side = Path(str(f) + ".meta.json")
        meta = None
        if side.exists():
            try:
                m = json.loads(side.read_text())
                meta = {
                    "generator": m.get("generator"),
                    "created": m.get("created"),
                    "source": m.get("source"),
                }
            except Exception:
                pass
        rows.append({
            "path": path, "kind": kind(path), "status": st, "reasons": why,
            "size": stat.st_size if stat else None,
            "date": date.fromtimestamp(stat.st_mtime).isoformat() if stat else None,
            "meta": meta,
        })
    return rows


def old_folders(root: Path):
    out = {}
    for base in (root / "assets", root / "public"):
        for d in base.rglob("*"):
            if d.is_dir() and (d.name == "forkastet" or d.name.startswith("original-pre-")):
                out[str(d.relative_to(root))] = sum(f.is_file() for f in d.rglob("*"))
    return dict(sorted(out.items()))


def markdown(rows, old) -> str:
    kinds = list(dict.fromkeys(r["kind"] for r in rows))
    count = Counter((r["kind"], r["status"]) for r in rows)
    order = [medie.CURRENT, medie.STALE, medie.UNKNOWN, medie.MISSING]
    out = ["# Medieinventar", "",
           "Generert av `mise run inventar` (assets/bin/inventar.py). Ikke rediger for hånd.", "",
           "✓ oppdatert · ⚠ utdatert · ? ukjent (laget før sidefiler) · ✗ mangler", "",
           "| Type | " + " | ".join(MARK[s] for s in order) + " |", "|---|" + "---:|" * len(order)]
    out += [f"| {k} | " + " | ".join(str(count[k, s]) for s in order) + " |" for k in kinds]
    for k in kinds:
        out += ["", f"## {k}", "", "| Fil | Størrelse | Dato | Status |", "|---|---:|---|---|"]
        for r in (r for r in rows if r["kind"] == k):
            size = f"{r['size'] / 1e6:.1f} MB" if r["size"] is not None else ""
            why = "; ".join(r["reasons"])
            out.append(f"| {r['path']} | {size} | {r['date'] or ''} | {MARK[r['status']]}{' ' + why if why else ''} |")
    out += ["", "## Gamle filer", "", "| Mappe | Filer |", "|---|---:|"]
    out += [f"| {d} | {n} |" for d, n in old.items()]
    return "\n".join(out) + "\n"


def main(argv):
    if "--media" in argv:
        idx = argv.index("--media")
        if idx + 1 >= len(argv) or argv[idx + 1].startswith("-"):
            print("Usage: inventar.py [--media DIR] [--json]")
            sys.exit(2)
        media = Path(argv[idx + 1])
    else:
        media = Path(os.environ.get("MEDIA_DIR") or ROOT / "public")
    rows = scan(media)
    data = json.dumps(rows, ensure_ascii=False, indent=1)
    if "--json" in argv:
        print(data)
        return
    # old folders live in the checkout that holds the media (assets/out sits beside public/)
    (ROOT / "assets/INVENTAR.md").write_text(markdown(rows, old_folders(media.parent)))
    (media / "media-inventar.json").write_text(data + "\n")
    print(Counter(r["status"] for r in rows))


def selfcheck():
    """Current, changed source and missing, on a temp checkout."""
    import tempfile

    with tempfile.TemporaryDirectory() as t:
        root = Path(t)
        (root / "docs/manus").mkdir(parents=True)
        (root / "src/lib").mkdir(parents=True)
        ms = root / medie.RAMPE_MS
        ms.write_text("## Dag 1 (søn)\n**Klipp:** «Hei!»\n## Dag 2 (man)\n**Klipp:** «Hallo»\n## Dag 5 (fre)\n**Klipp:** «Fem»\n")
        (root / "src/lib/media.ts").write_text('"audio/rampenissen/dag-01.mp3"')
        media = root / "public"
        (media / "audio/rampenissen").mkdir(parents=True)
        for d in (1, 2, 5):
            f = media / f"audio/rampenissen/dag-{d:02d}.mp3"
            f.write_bytes(b"mp3")
            medie.write("rampenissen-tts.sh", f, medie.RAMPE_MS, f"Dag {d}", "tts", [], root)
        (media / "audio/rampenissen/dag-03.mp3").write_bytes(b"mp3")
        ms.write_text("## Dag 1 (søn)\n**Klipp:** «Hei!»\n## Dag 2 (man)\n**Klipp:** «Hallo igjen»\n")
        by = {r["path"]: r for r in scan(media, root)}
        assert by["audio/rampenissen/dag-01.mp3"]["status"] == medie.CURRENT
        assert by["audio/rampenissen/dag-02.mp3"]["status"] == medie.STALE
        assert "kildeteksten er endret" in by["audio/rampenissen/dag-02.mp3"]["reasons"][0]
        assert by["audio/rampenissen/dag-03.mp3"]["status"] == medie.STALE  # override, no sidecar
        assert by["audio/rampenissen/dag-05.mp3"]["status"] == medie.STALE  # day gone from script
        assert by["audio/rampenissen/dag-06.mp3"]["status"] == medie.MISSING
        assert by["video/julius/dag-24.mp4"]["status"] == medie.MISSING
    print("selvtest ok")


if __name__ == "__main__":
    selfcheck() if "--selvtest" in sys.argv else main(sys.argv[1:])
